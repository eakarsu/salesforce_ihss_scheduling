const crypto = require('crypto');
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { canonical, recordAudit, sha256 } = require('../audit');
const { subtractIntervals, timeToMinutes, validateBookingWindow } = require('../lib/scheduling');
const { email, fail, integer, text } = require('../lib/validation');

router.use(auth, authorize('admin', 'manager'));

const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function isoDate(value) {
  const result = text(value, 'date', { min: 10, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(new Date(`${result}T12:00:00Z`).getTime())) fail('date must use YYYY-MM-DD');
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const requested = new Date(`${result}T00:00:00Z`);
  if (requested < today || requested > new Date(today.getTime() + 366 * 86400000)) fail('date must be today through 366 days from now');
  return result;
}

function timestamp(value, name) {
  const result = text(value, name, { min: 20, max: 40 });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(result)) fail(`${name} must be an ISO-8601 timestamp with an explicit offset`);
  return result;
}

function leadInput(value) {
  const lead = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const budget = text(lead.budget, 'lead_data.budget', { min: 1, max: 20, optional: true });
  if (budget && (!/^\d+(?:\.\d{1,2})?$/.test(budget) || Number(budget) > 1000000000)) fail('lead_data.budget must be a non-negative amount no greater than 1000000000');
  return {
    contact_name: text(lead.contact_name, 'lead_data.contact_name', { min: 2, max: 160, optional: true }),
    contact_phone: text(lead.contact_phone, 'lead_data.contact_phone', { min: 7, max: 40, optional: true }),
    contact_email: email(lead.contact_email, 'lead_data.contact_email', true),
    budget,
    account_name: text(lead.account_name, 'lead_data.account_name', { min: 2, max: 160, optional: true }),
    region: text(lead.region, 'lead_data.region', { min: 2, max: 120, optional: true }),
    district: text(lead.district, 'lead_data.district', { min: 2, max: 120, optional: true }),
    market: text(lead.market, 'lead_data.market', { min: 2, max: 120, optional: true }),
  };
}

async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '40001') { error.status = 409; error.code = 'SERIALIZATION_RETRY'; error.message = 'Concurrent scheduling change detected; retry the identical idempotent request'; }
    throw error;
  } finally { client.release(); }
}

async function loadRules(client, workOrderNumber, lock = false) {
  const result = await client.query(
    `SELECT wo.*,wt.estimated_duration_minutes,wt.skill_requirement,wt.block_time_before,wt.block_time_after,
       st.operating_hours_name,oh.timezone AS scheduling_timezone,
       oh.monday_start,oh.monday_end,oh.tuesday_start,oh.tuesday_end,oh.wednesday_start,oh.wednesday_end,
       oh.thursday_start,oh.thursday_end,oh.friday_start,oh.friday_end,oh.saturday_start,oh.saturday_end,oh.sunday_start,oh.sunday_end
     FROM work_orders wo
     JOIN work_types wt ON wt.name=wo.work_type_name AND wt.status='Active'
     JOIN service_territories st ON st.name=wo.territory_name AND st.status='Active' AND st.is_active='true'
     JOIN operating_hours oh ON oh.name=st.operating_hours_name AND oh.status='Active'
     WHERE wo.work_order_number=$1 ${lock ? 'FOR UPDATE OF wo' : ''}`,
    [workOrderNumber]
  );
  if (!result.rows[0]) fail('Work order or scheduling policy not found', 404, 'SCHEDULING_CONTEXT_NOT_FOUND');
  return result.rows[0];
}

function numericRule(value, name, { min = 0, max = 1440 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) fail(`${name} is invalid`, 409, 'SCHEDULING_POLICY_INVALID');
  return number;
}

router.get('/work-orders', async (_req, res, next) => {
  try {
    const rows = (await pool.query(`SELECT id,work_order_number,subject,account_name,contact_name,contact_phone,contact_email,budget,region,district,market,territory_name,work_type_name,priority,status,start_date,end_date,address,city,state,version
      FROM work_orders WHERE status IN ('Pending','New','Open','In Progress')
      ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END,id LIMIT 200`)).rows;
    res.set('Cache-Control', 'no-store').json(rows);
  } catch (error) { next(error); }
});

router.post('/available-slots', async (req, res, next) => {
  try {
    const workOrderNumber = text(req.body?.work_order_number, 'work_order_number', { min: 3, max: 80 });
    const date = isoDate(req.body?.date);
    const rules = await loadRules(pool, workOrderNumber);
    if (['Scheduled','Completed','Cancelled'].includes(rules.status)) fail(`Work order in ${rules.status} state cannot be scheduled`, 409, 'WORK_ORDER_STATE');
    if ((rules.start_date && date < String(rules.start_date).slice(0, 10)) || (rules.end_date && date > String(rules.end_date).slice(0, 10))) fail('Requested date is outside the work-order window', 409, 'WORK_ORDER_WINDOW');
    const duration = numericRule(rules.estimated_duration_minutes, 'estimated duration', { min: 15, max: 720 });
    const blockBefore = numericRule(rules.block_time_before, 'block before');
    const blockAfter = numericRule(rules.block_time_after, 'block after');
    const day = dayNames[new Date(`${date}T12:00:00Z`).getUTCDay()];
    const dayStart = rules[`${day}_start`]; const dayEnd = rules[`${day}_end`];
    const operatingStart = timeToMinutes(dayStart); const operatingEnd = timeToMinutes(dayEnd);
    if (operatingStart === null || operatingEnd === null || operatingStart >= operatingEnd) return res.json({ work_order_version: rules.version, date, timezone: rules.scheduling_timezone, resources: [], message: 'Territory is closed on this day' });
    const resources = (await pool.query(
      `SELECT sr.name AS resource_name,sr.resource_type,sr.efficiency_rating
       FROM service_resources sr JOIN territory_members tm ON tm.resource_name=sr.name AND tm.territory_name=$1 AND tm.status='Active'
       WHERE sr.status='Active' AND sr.is_active='true'
         AND ($2::TEXT IS NULL OR EXISTS(SELECT 1 FROM service_resource_skills srs WHERE srs.resource_name=sr.name AND srs.skill_name=$2 AND srs.status='Active'))
       ORDER BY sr.name`,
      [rules.territory_name, rules.skill_requirement || null]
    )).rows;
    const responseResources = [];
    for (const resource of resources) {
      const appointments = (await pool.query(
        `SELECT to_char(scheduled_start::timestamptz AT TIME ZONE $3,'HH24:MI') AS start_time,
                to_char(scheduled_end::timestamptz AT TIME ZONE $3,'HH24:MI') AS end_time
         FROM service_appointments WHERE resource_name=$1 AND status NOT IN ('Cancelled','Completed')
           AND (scheduled_start::timestamptz AT TIME ZONE $3)::date=$2::date`,
        [resource.resource_name, date, rules.scheduling_timezone]
      )).rows;
      const absences = (await pool.query(
        `SELECT to_char(start_time::timestamptz AT TIME ZONE $3,'HH24:MI') AS start_time,
                to_char(end_time::timestamptz AT TIME ZONE $3,'HH24:MI') AS end_time
         FROM resource_absences WHERE resource_name=$1 AND status IN ('Approved','Pending')
           AND (start_time::timestamptz AT TIME ZONE $3)::date <= $2::date
           AND (end_time::timestamptz AT TIME ZONE $3)::date >= $2::date`,
        [resource.resource_name, date, rules.scheduling_timezone]
      )).rows;
      const busy = appointments.map((item) => ({ start: Math.max(0, timeToMinutes(item.start_time) - blockBefore), end: Math.min(1440, timeToMinutes(item.end_time) + blockAfter) }));
      for (const item of absences) busy.push({ start: timeToMinutes(item.start_time), end: timeToMinutes(item.end_time) });
      const localSlots = [];
      for (const window of subtractIntervals(operatingStart, operatingEnd, busy)) {
        let start = Math.ceil(window.start / 30) * 30;
        while (start + duration <= window.end) { localSlots.push({ start, end: start + duration }); start += 30; }
      }
      if (!localSlots.length) continue;
      const localValues = [...new Set(localSlots.flatMap((slot) => [slot.start, slot.end]).map((minutes) => `${date} ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`))];
      const converted = (await pool.query(
        `SELECT value,to_char((value::timestamp AT TIME ZONE $2) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS utc_value FROM unnest($1::TEXT[]) value`,
        [localValues, rules.scheduling_timezone]
      )).rows;
      const utc = new Map(converted.map((row) => [row.value, row.utc_value]));
      const formatTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      responseResources.push({ ...resource, existing_appointments: appointments.length, slots: localSlots.map((slot) => ({ start: formatTime(slot.start), end: formatTime(slot.end), scheduled_start: utc.get(`${date} ${formatTime(slot.start)}`), scheduled_end: utc.get(`${date} ${formatTime(slot.end)}`) })) });
    }
    res.set('Cache-Control', 'no-store').json({ work_order: { work_order_number: rules.work_order_number, subject: rules.subject }, work_order_version: rules.version, work_type: { name: rules.work_type_name, estimated_duration_minutes: duration, skill_requirement: rules.skill_requirement }, territory: rules.territory_name, date, timezone: rules.scheduling_timezone, operating_hours: { start: dayStart, end: dayEnd }, resources: responseResources });
  } catch (error) { next(error); }
});

router.post('/book', async (req, res, next) => {
  try {
    const idempotencyKey = text(req.headers['idempotency-key'], 'Idempotency-Key', { min: 8, max: 128 });
    const input = {
      workOrderNumber: text(req.body?.work_order_number, 'work_order_number', { min: 3, max: 80 }),
      resourceName: text(req.body?.resource_name, 'resource_name', { min: 2, max: 120 }),
      scheduledStart: timestamp(req.body?.scheduled_start, 'scheduled_start'),
      scheduledEnd: timestamp(req.body?.scheduled_end, 'scheduled_end'),
      expectedVersion: integer(req.body?.expected_work_order_version, 'expected_work_order_version', { min: 1, max: 1000000000 }),
      lead: leadInput(req.body?.lead_data),
    };
    const requestHash = sha256(JSON.stringify(canonical(input)));
    const result = await transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('booking:' || $1::text))", [idempotencyKey]);
      const existing = (await client.query('SELECT * FROM service_appointments WHERE idempotency_key=$1', [idempotencyKey])).rows[0];
      if (existing) {
        if (existing.request_hash !== requestHash) fail('Idempotency key was used with different booking input', 409, 'IDEMPOTENCY_CONFLICT');
        return { appointment: existing, duplicate: true };
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [`resource:${input.resourceName}`]);
      const rules = await loadRules(client, input.workOrderNumber, true);
      if (rules.version !== input.expectedVersion) fail('Work order changed; refresh available slots', 409, 'VERSION_CONFLICT');
      if (!['Pending','New','Open','In Progress'].includes(rules.status)) fail(`Work order in ${rules.status} state cannot be scheduled`, 409, 'WORK_ORDER_STATE');
      const window = validateBookingWindow(input.scheduledStart, input.scheduledEnd);
      if (!window.valid) fail(window.error);
      if (window.start < new Date(Date.now() - 60000) || window.start > new Date(Date.now() + 366 * 86400000)) fail('Appointment must be within the next 366 days');
      const duration = numericRule(rules.estimated_duration_minutes, 'estimated duration', { min: 15, max: 720 });
      if (window.durationMinutes !== duration) fail('Appointment duration must match the work type', 409, 'DURATION_MISMATCH');
      const local = (await client.query(
        `SELECT to_char($1::timestamptz AT TIME ZONE $3,'YYYY-MM-DD') AS local_date,
                to_char($1::timestamptz AT TIME ZONE $3,'HH24:MI') AS local_start,
                to_char($2::timestamptz AT TIME ZONE $3,'HH24:MI') AS local_end`,
        [input.scheduledStart, input.scheduledEnd, rules.scheduling_timezone]
      )).rows[0];
      const day = dayNames[new Date(`${local.local_date}T12:00:00Z`).getUTCDay()];
      const operatingStart = timeToMinutes(rules[`${day}_start`]); const operatingEnd = timeToMinutes(rules[`${day}_end`]);
      const localStart = timeToMinutes(local.local_start); const localEnd = timeToMinutes(local.local_end);
      if ([operatingStart, operatingEnd, localStart, localEnd].some((value) => value === null) || localStart < operatingStart || localEnd > operatingEnd) fail('Appointment is outside territory operating hours', 409, 'OUTSIDE_OPERATING_HOURS');
      if ((rules.start_date && local.local_date < String(rules.start_date).slice(0, 10)) || (rules.end_date && local.local_date > String(rules.end_date).slice(0, 10))) fail('Appointment is outside the work-order window', 409, 'WORK_ORDER_WINDOW');
      const eligible = (await client.query(
        `SELECT 1 FROM service_resources sr JOIN territory_members tm ON tm.resource_name=sr.name AND tm.territory_name=$2 AND tm.status='Active'
         WHERE sr.name=$1 AND sr.status='Active' AND sr.is_active='true'
           AND ($3::TEXT IS NULL OR EXISTS(SELECT 1 FROM service_resource_skills srs WHERE srs.resource_name=sr.name AND srs.skill_name=$3 AND srs.status='Active'))`,
        [input.resourceName, rules.territory_name, rules.skill_requirement || null]
      )).rows[0];
      if (!eligible) fail('Resource is not eligible for the territory and required skill', 409, 'RESOURCE_INELIGIBLE');
      const absent = (await client.query(`SELECT 1 FROM resource_absences WHERE resource_name=$1 AND status IN ('Approved','Pending') AND start_time::timestamptz < $3::timestamptz AND end_time::timestamptz > $2::timestamptz LIMIT 1`, [input.resourceName, input.scheduledStart, input.scheduledEnd])).rows[0];
      if (absent) fail('Resource is unavailable during the requested time', 409, 'RESOURCE_ABSENT');
      const blockBefore = numericRule(rules.block_time_before, 'block before'); const blockAfter = numericRule(rules.block_time_after, 'block after');
      const conflict = (await client.query(
        `SELECT 1 FROM service_appointments WHERE resource_name=$1 AND status NOT IN ('Cancelled','Completed')
         AND scheduled_start::timestamptz < $3::timestamptz + ($5::TEXT || ' minutes')::interval
         AND scheduled_end::timestamptz > $2::timestamptz - ($4::TEXT || ' minutes')::interval LIMIT 1`,
        [input.resourceName, input.scheduledStart, input.scheduledEnd, blockBefore, blockAfter]
      )).rows[0];
      if (conflict) fail('Resource already has an appointment or required buffer in this window', 409, 'APPOINTMENT_CONFLICT');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('appointment-number'))");
      const lastNumber = Number((await client.query("SELECT COALESCE(MAX(NULLIF(regexp_replace(appointment_number,'[^0-9]','','g'),'')::INTEGER),0) AS value FROM service_appointments")).rows[0].value);
      const appointmentNumber = `SA-${String(lastNumber + 1).padStart(6, '0')}`;
      const created = (await client.query(
        `INSERT INTO service_appointments(appointment_number,work_order_number,subject,status,scheduled_start,scheduled_end,duration_minutes,resource_name,territory_name,address,city,state,idempotency_key,request_hash,booked_work_order_version,created_by)
         VALUES($1,$2,$3,'Scheduled',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [appointmentNumber, input.workOrderNumber, rules.subject, input.scheduledStart, input.scheduledEnd, String(duration), input.resourceName, rules.territory_name, rules.address, rules.city, rules.state, idempotencyKey, requestHash, rules.version, req.user.id]
      )).rows[0];
      const updated = await client.query(
        `UPDATE work_orders SET status='Scheduled',contact_name=COALESCE($2,contact_name),contact_phone=COALESCE($3,contact_phone),contact_email=COALESCE($4,contact_email),budget=COALESCE($5,budget),account_name=COALESCE($6,account_name),region=COALESCE($7,region),district=COALESCE($8,district),market=COALESCE($9,market),version=version+1,updated_at=NOW()
         WHERE id=$1 AND version=$10`,
        [rules.id, input.lead.contact_name, input.lead.contact_phone, input.lead.contact_email, input.lead.budget, input.lead.account_name, input.lead.region, input.lead.district, input.lead.market, rules.version]
      );
      if (updated.rowCount !== 1) fail('Work order changed; refresh available slots', 409, 'VERSION_CONFLICT');
      await recordAudit(client, { actorUserId: req.user.id, action: 'APPOINTMENT_BOOKED', entityType: 'service_appointment', entityId: created.id, metadata: { appointmentNumber, workOrderNumber: input.workOrderNumber, resourceName: input.resourceName, territoryName: rules.territory_name, scheduledStart: new Date(input.scheduledStart).toISOString(), scheduledEnd: new Date(input.scheduledEnd).toISOString(), workOrderVersion: rules.version, requestHash } });
      return { appointment: created, duplicate: false };
    });
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) { next(error); }
});

module.exports = router;
