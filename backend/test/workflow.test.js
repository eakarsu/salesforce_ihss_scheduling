const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const request = require('supertest');
const app = require('../server');
const pool = require('../db');

const password = process.env.FIXTURE_PASSWORD;
const idempotencyHeader = ['Idempotency', 'Key'].join('-');
let admin; let manager; let viewer; let workOrders; let availability; let winningBooking;
const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

async function login(email, expected = 200) {
  const response = await request(app).post('/api/auth/login').send({ email, password }).expect(expected);
  return response.body.token;
}
function bearer(token) { return { Authorization: `Bearer ${token}` }; }

after(async () => { await pool.end(); });

test('identity is closed, generic failures are safe, and live roles are loaded', async () => {
  admin = await login('admin@example.test');
  manager = await login('manager@example.test');
  viewer = await login('viewer@example.test');
  await request(app).post('/api/auth/login').send({ email: 'admin@example.test', password: 'wrong' }).expect(401).expect((response) => assert.equal(response.body.error, 'Invalid credentials'));
  await request(app).post('/api/auth/register').send({}).expect(403);
  await request(app).get('/api/auth/me').set(bearer(admin)).expect(200).expect((response) => assert.equal(response.body.user.role, 'admin'));
  await request(app).get('/api/scheduling/work-orders').expect(401);
  await request(app).get('/api/scheduling/work-orders').set(bearer(viewer)).expect(403);
});

test('authorized manager receives only bounded schedulable work orders', async () => {
  const response = await request(app).get('/api/scheduling/work-orders').set(bearer(manager)).expect(200);
  workOrders = response.body;
  assert.equal(workOrders.length, 3);
  assert.deepEqual(Object.keys(workOrders[0]).sort(), ['account_name','address','budget','city','contact_email','contact_name','contact_phone','district','end_date','id','market','priority','region','start_date','state','status','subject','territory_name','version','work_order_number','work_type_name'].sort());
  await request(app).post('/api/scheduling/available-slots').set(bearer(manager)).send({ work_order_number: workOrders[0].work_order_number, date: 'not-a-date' }).expect(422);
});

test('deterministic availability returns timezone-explicit skill-matched slots', async () => {
  const response = await request(app).post('/api/scheduling/available-slots').set(bearer(manager)).send({ work_order_number: 'WO-FIXTURE-001', date }).expect(200);
  availability = response.body;
  assert.equal(availability.timezone, 'America/New_York');
  assert.equal(availability.work_order_version, 1);
  assert.equal(availability.resources.length, 1);
  assert.equal(availability.resources[0].resource_name, 'Fixture Installer');
  assert.match(availability.resources[0].slots[0].scheduled_start, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
});

test('missing scheduling context and resource absence fail closed', async () => {
  await pool.query(`INSERT INTO work_orders(work_order_number,subject,territory_name,work_type_name,priority,status) VALUES('WO-MISSING-CONTEXT','Missing rules','Fixture Territory','Unknown Work Type','Low','Pending')`);
  try {
    await request(app).post('/api/scheduling/available-slots').set(bearer(manager)).send({ work_order_number: 'WO-MISSING-CONTEXT', date }).expect(404).expect((response) => assert.equal(response.body.code, 'SCHEDULING_CONTEXT_NOT_FOUND'));
  } finally { await pool.query("DELETE FROM work_orders WHERE work_order_number='WO-MISSING-CONTEXT'"); }

  const slot = availability.resources[0].slots[0];
  const absence = (await pool.query(`INSERT INTO resource_absences(resource_name,start_time,end_time,status) VALUES('Fixture Installer',$1,$2,'Approved') RETURNING id`, [slot.scheduled_start, slot.scheduled_end])).rows[0];
  try {
    await request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, 'absence-failure-20260720').send({ work_order_number: 'WO-FIXTURE-003', resource_name: 'Fixture Installer', scheduled_start: slot.scheduled_start, scheduled_end: slot.scheduled_end, expected_work_order_version: 1, lead_data: {} }).expect(409).expect((response) => assert.equal(response.body.code, 'RESOURCE_ABSENT'));
  } finally { await pool.query('DELETE FROM resource_absences WHERE id=$1', [absence.id]); }
});

test('crafted booking outside operating hours is rejected', async () => {
  const start = `${date}T01:00:00Z`; const end = `${date}T02:00:00Z`;
  await request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, 'outside-hours-20260720').send({ work_order_number: 'WO-FIXTURE-003', resource_name: 'Fixture Installer', scheduled_start: start, scheduled_end: end, expected_work_order_version: 1, lead_data: {} }).expect(409).expect((response) => assert.equal(response.body.code, 'OUTSIDE_OPERATING_HOURS'));
});

test('booking validates optimistic version and input bounds before mutation', async () => {
  const slot = availability.resources[0].slots[0];
  await request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, 'invalid-version-key').send({ work_order_number: 'WO-FIXTURE-001', resource_name: 'Fixture Installer', scheduled_start: slot.scheduled_start, scheduled_end: slot.scheduled_end, expected_work_order_version: 99, lead_data: {} }).expect(409).expect((response) => assert.equal(response.body.code, 'VERSION_CONFLICT'));
  const count = Number((await pool.query('SELECT COUNT(*) FROM service_appointments')).rows[0].count);
  assert.equal(count, 0);
});

test('concurrent overlapping bookings serialize so only one wins', async () => {
  const slot = availability.resources[0].slots[0];
  const bodies = ['WO-FIXTURE-001','WO-FIXTURE-002'].map((workOrderNumber) => ({ work_order_number: workOrderNumber, resource_name: 'Fixture Installer', scheduled_start: slot.scheduled_start, scheduled_end: slot.scheduled_end, expected_work_order_version: 1, lead_data: {} }));
  const responses = await Promise.all(bodies.map((body, index) => request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, `concurrent-booking-${index}-20260720`).send(body)));
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  const winnerIndex = responses.findIndex((response) => response.status === 201);
  winningBooking = { response: responses[winnerIndex], body: bodies[winnerIndex], key: `concurrent-booking-${winnerIndex}-20260720` };
  assert.equal(Number((await pool.query('SELECT COUNT(*) FROM service_appointments')).rows[0].count), 1);
});

test('booking retry is idempotent and changed input under the key is rejected', async () => {
  const replay = await request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, winningBooking.key).send(winningBooking.body).expect(200);
  assert.equal(replay.body.duplicate, true);
  assert.equal(replay.body.appointment.id, winningBooking.response.body.appointment.id);
  await request(app).post('/api/scheduling/book').set(bearer(manager)).set(idempotencyHeader, winningBooking.key).send({ ...winningBooking.body, resource_name: 'Changed Installer' }).expect(409).expect((response) => assert.equal(response.body.code, 'IDEMPOTENCY_CONFLICT'));
});

test('audit export verifies its hash chain, excludes customer PII, and is immutable', async () => {
  const audit = await request(app).get('/api/audit-logs').set(bearer(admin)).expect(200);
  assert.deepEqual(audit.body.verification, { valid: true, checked: 1, firstInvalidSequence: null });
  const serialized = JSON.stringify(audit.body.events);
  assert.doesNotMatch(serialized, /contact1@example\.test|1 Example Street|555-0101/);
  await request(app).get('/api/audit-logs').set(bearer(manager)).expect(403);
  await assert.rejects(() => pool.query("UPDATE scheduling_audit_events SET outcome='TAMPERED' WHERE id=$1", [audit.body.events[0].id]), /immutable/);
});

test('historical generic AI, CRUD, healthcare, and demo surfaces are not executable', async () => {
  await request(app).post('/api/ai/optimize-schedule').set(bearer(admin)).send({}).expect(404);
  await request(app).get('/api/work-orders').set(bearer(admin)).expect(404);
  await request(app).get('/api/evv-visit-verification').set(bearer(admin)).expect(404);
  await request(app).post('/api/gap-client-portal').set(bearer(admin)).send({}).expect(404);
});
