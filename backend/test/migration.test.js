const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const pool = require('../db');
const { migrate, verifySchema } = require('../db/migrate');

after(async () => { await pool.end(); });

test('migration replay is idempotent and the expected schema is present', async () => {
  const result = await migrate();
  assert.equal(result.newlyApplied, 0);
  assert.deepEqual(result.verified, { relations: 11, columns: 5, controls: 2 });
});

test('schema verification detects drift without retaining the destructive probe', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP INDEX service_appointments_idempotency_uq');
    await assert.rejects(() => verifySchema(client), /Schema drift detected: service_appointments_idempotency_uq/);
    await client.query('ROLLBACK');
    await verifySchema(client);
  } finally { client.release(); }
});
