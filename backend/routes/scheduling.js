const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ─── GET SCHEDULABLE WORK ORDERS ─────────────────────────────────────────────
router.get('/work-orders', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM work_orders
      WHERE status IN ('Pending', 'New', 'Open', 'In Progress')
      ORDER BY
        CASE priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5
        END,
        id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIND AVAILABLE SLOTS ────────────────────────────────────────────────────
router.post('/available-slots', auth, async (req, res) => {
  try {
    const { work_order_number, date } = req.body;
    if (!work_order_number || !date) {
      return res.status(400).json({ error: 'work_order_number and date are required' });
    }

    // 1. Get work order
    const woResult = await pool.query(
      `SELECT * FROM work_orders WHERE work_order_number = $1`,
      [work_order_number]
    );
    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    const wo = woResult.rows[0];

    // 2. Get work type
    const wtResult = await pool.query(
      `SELECT * FROM work_types WHERE name = $1`,
      [wo.work_type_name]
    );
    if (wtResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work type not found' });
    }
    const wt = wtResult.rows[0];
    const durationMinutes = parseInt(wt.estimated_duration_minutes) || 60;
    const blockBefore = parseInt(wt.block_time_before) || 0;
    const blockAfter = parseInt(wt.block_time_after) || 0;

    // 3. Get territory operating hours
    const territoryResult = await pool.query(
      `SELECT * FROM service_territories WHERE name = $1`,
      [wo.territory_name]
    );
    if (territoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Territory not found' });
    }
    const territory = territoryResult.rows[0];

    const ohResult = await pool.query(
      `SELECT * FROM operating_hours WHERE name = $1`,
      [territory.operating_hours_name]
    );
    if (ohResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operating hours not found' });
    }
    const oh = ohResult.rows[0];

    // Get day-specific hours
    const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayStart = oh[`${dayOfWeek}_start`];
    const dayEnd = oh[`${dayOfWeek}_end`];

    if (!dayStart || !dayEnd) {
      return res.json({ resources: [], message: 'Territory is closed on this day' });
    }

    // 4. Find eligible resources: territory members with matching skills
    const membersResult = await pool.query(
      `SELECT tm.resource_name, sr.*
       FROM territory_members tm
       JOIN service_resources sr ON sr.name = tm.resource_name
       WHERE tm.territory_name = $1
         AND tm.status = 'Active'
         AND sr.is_active = 'true'
         AND sr.status = 'Active'`,
      [wo.territory_name]
    );

    let eligibleResources = membersResult.rows;

    // Filter by skill if work type requires one
    if (wt.skill_requirement) {
      const skilledResult = await pool.query(
        `SELECT DISTINCT resource_name FROM service_resource_skills
         WHERE skill_name = $1 AND status = 'Active'`,
        [wt.skill_requirement]
      );
      const skilledNames = new Set(skilledResult.rows.map(r => r.resource_name));
      eligibleResources = eligibleResources.filter(r => skilledNames.has(r.resource_name));
    }

    // 5. For each resource, calculate available slots
    const resourceSlots = [];

    for (const resource of eligibleResources) {
      // Get existing appointments on that date
      const apptResult = await pool.query(
        `SELECT scheduled_start, scheduled_end, duration_minutes
         FROM service_appointments
         WHERE resource_name = $1
           AND status NOT IN ('Cancelled', 'Completed')
           AND scheduled_start::date = $2::date`,
        [resource.resource_name, date]
      );

      // Get absences overlapping that date
      const absenceResult = await pool.query(
        `SELECT start_time, end_time
         FROM resource_absences
         WHERE resource_name = $1
           AND status IN ('Approved', 'Pending')
           AND start_time::date <= $2::date
           AND end_time::date >= $2::date`,
        [resource.resource_name, date]
      );

      // Build busy intervals (in minutes from midnight)
      const busyIntervals = [];

      for (const appt of apptResult.rows) {
        const startMin = timeToMinutes(extractTime(appt.scheduled_start));
        const endMin = timeToMinutes(extractTime(appt.scheduled_end));
        // Add block buffers around appointments
        busyIntervals.push({
          start: Math.max(0, startMin - blockBefore),
          end: Math.min(24 * 60, endMin + blockAfter)
        });
      }

      for (const absence of absenceResult.rows) {
        const absStart = extractTime(absence.start_time);
        const absEnd = extractTime(absence.end_time);
        // If absence spans full day, block all hours
        const startMin = absStart === '00:00' ? 0 : timeToMinutes(absStart);
        const endMin = absEnd === '23:59' ? 24 * 60 : timeToMinutes(absEnd);
        busyIntervals.push({ start: startMin, end: endMin });
      }

      // 6. Calculate free windows within operating hours
      const opStart = timeToMinutes(dayStart);
      const opEnd = timeToMinutes(dayEnd);

      const freeWindows = subtractIntervals(opStart, opEnd, busyIntervals);

      // Break free windows into slots of work_type duration at 30-min increments
      const slots = [];
      for (const window of freeWindows) {
        let slotStart = window.start;
        // Align to 30-minute boundary
        if (slotStart % 30 !== 0) {
          slotStart = Math.ceil(slotStart / 30) * 30;
        }
        while (slotStart + durationMinutes <= window.end) {
          slots.push({
            start: minutesToTime(slotStart),
            end: minutesToTime(slotStart + durationMinutes),
            start_datetime: `${date} ${minutesToTime(slotStart)}`,
            end_datetime: `${date} ${minutesToTime(slotStart + durationMinutes)}`,
          });
          slotStart += 30;
        }
      }

      if (slots.length > 0) {
        resourceSlots.push({
          resource_name: resource.resource_name,
          resource_type: resource.resource_type,
          email: resource.email,
          phone: resource.phone,
          efficiency_rating: resource.efficiency_rating,
          existing_appointments: apptResult.rows.length,
          slots,
        });
      }
    }

    res.json({
      work_order: wo,
      work_type: wt,
      territory: wo.territory_name,
      date,
      operating_hours: { start: dayStart, end: dayEnd },
      resources: resourceSlots,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BOOK APPOINTMENT ────────────────────────────────────────────────────────
router.post('/book', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { work_order_number, resource_name, scheduled_start, scheduled_end, lead_data } = req.body;
    if (!work_order_number || !resource_name || !scheduled_start || !scheduled_end) {
      return res.status(400).json({ error: 'work_order_number, resource_name, scheduled_start, and scheduled_end are required' });
    }

    await client.query('BEGIN');

    // Get work order details
    const woResult = await client.query(
      `SELECT * FROM work_orders WHERE work_order_number = $1`,
      [work_order_number]
    );
    if (woResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Work order not found' });
    }
    const wo = woResult.rows[0];

    // Generate next appointment number
    const maxResult = await client.query(
      `SELECT appointment_number FROM service_appointments ORDER BY id DESC LIMIT 1`
    );
    let nextNum = 16; // Default start after seed data SA-015
    if (maxResult.rows.length > 0) {
      const lastNum = parseInt(maxResult.rows[0].appointment_number.replace('SA-', ''));
      nextNum = lastNum + 1;
    }
    const appointmentNumber = `SA-${String(nextNum).padStart(3, '0')}`;

    // Calculate duration
    const startDate = new Date(scheduled_start);
    const endDate = new Date(scheduled_end);
    const durationMinutes = Math.round((endDate - startDate) / 60000);

    // Insert service appointment
    const insertResult = await client.query(
      `INSERT INTO service_appointments
        (appointment_number, work_order_number, subject, status, scheduled_start, scheduled_end,
         duration_minutes, resource_name, territory_name, address, city, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        appointmentNumber,
        work_order_number,
        wo.subject,
        'Scheduled',
        scheduled_start,
        scheduled_end,
        String(durationMinutes),
        resource_name,
        wo.territory_name,
        wo.address,
        wo.city,
        wo.state,
      ]
    );

    // Update work order status and lead data
    if (lead_data) {
      await client.query(
        `UPDATE work_orders
         SET status = 'Scheduled',
             contact_name = COALESCE($2, contact_name),
             contact_phone = COALESCE($3, contact_phone),
             contact_email = COALESCE($4, contact_email),
             budget = COALESCE($5, budget),
             account_name = COALESCE($6, account_name),
             region = COALESCE($7, region),
             district = COALESCE($8, district),
             market = COALESCE($9, market)
         WHERE work_order_number = $1`,
        [
          work_order_number,
          lead_data.contact_name || null,
          lead_data.contact_phone || null,
          lead_data.contact_email || null,
          lead_data.budget || null,
          lead_data.account_name || null,
          lead_data.region || null,
          lead_data.district || null,
          lead_data.market || null,
        ]
      );
    } else {
      await client.query(
        `UPDATE work_orders SET status = 'Scheduled' WHERE work_order_number = $1`,
        [work_order_number]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Appointment booked successfully',
      appointment: insertResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function extractTime(datetimeStr) {
  if (!datetimeStr) return '00:00';
  // Handle "2024-11-01 08:00" or "2024-11-01T08:00" or just "08:00"
  if (datetimeStr.includes(' ')) {
    return datetimeStr.split(' ')[1].substring(0, 5);
  }
  if (datetimeStr.includes('T')) {
    return datetimeStr.split('T')[1].substring(0, 5);
  }
  return datetimeStr.substring(0, 5);
}

function subtractIntervals(start, end, busyIntervals) {
  // Sort busy intervals by start time
  const sorted = [...busyIntervals].sort((a, b) => a.start - b.start);

  // Merge overlapping busy intervals
  const merged = [];
  for (const interval of sorted) {
    if (merged.length > 0 && interval.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }

  // Calculate free windows
  const free = [];
  let current = start;

  for (const busy of merged) {
    if (busy.start > current) {
      free.push({ start: current, end: Math.min(busy.start, end) });
    }
    current = Math.max(current, busy.end);
  }

  if (current < end) {
    free.push({ start: current, end });
  }

  return free;
}

module.exports = router;
