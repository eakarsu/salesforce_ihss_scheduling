const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const migrationDirectory = path.join(__dirname, 'migrations');
const expectedRelations = ['users','operating_hours','service_territories','service_resources','service_resource_skills','territory_members','work_types','work_orders','resource_absences','service_appointments','scheduling_audit_events','ai_provider_receipts'];

async function verifySchema(client) {
  const missingRelations = [];
  for (const relation of expectedRelations) {
    const result = await client.query('SELECT to_regclass($1) AS relation', [`public.${relation}`]);
    if (!result.rows[0].relation) missingRelations.push(relation);
  }
  const columns = await client.query(`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND (table_name,column_name) IN (('users','password_hash'),('users','is_active'),('work_orders','version'),('service_appointments','idempotency_key'),('service_appointments','request_hash'))`);
  const columnSet = new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}`));
  const expectedColumns = ['users.password_hash','users.is_active','work_orders.version','service_appointments.idempotency_key','service_appointments.request_hash'];
  const missingColumns = expectedColumns.filter((column) => !columnSet.has(column));
  const controls = await client.query(`SELECT
    to_regclass('public.service_appointments_idempotency_uq') IS NOT NULL AS idempotency_index,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='scheduling_audit_immutable' AND NOT tgisinternal) AS audit_trigger`);
  const missingControls = [];
  if (!controls.rows[0].idempotency_index) missingControls.push('service_appointments_idempotency_uq');
  if (!controls.rows[0].audit_trigger) missingControls.push('scheduling_audit_immutable');
  if (missingRelations.length || missingColumns.length || missingControls.length) {
    throw new Error(`Schema drift detected: ${[...missingRelations, ...missingColumns, ...missingControls].join(', ')}`);
  }
  return { relations: expectedRelations.length, columns: expectedColumns.length, controls: 2 };
}

async function migrate({ checkOnly = false } = {}) {
  const client = await pool.connect();
  let locked = false;
  try {
    await client.query('SELECT pg_advisory_lock(7420260720)'); locked = true;
    const trackingExists = (await client.query("SELECT to_regclass('public.schema_migrations') AS relation")).rows[0].relation;
    if (checkOnly && !trackingExists) throw new Error('schema_migrations is missing; run migrations explicitly');
    if (!trackingExists) await client.query(`CREATE TABLE schema_migrations(name TEXT PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const files = fs.readdirSync(migrationDirectory).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    const applied = new Map((await client.query('SELECT name,checksum FROM schema_migrations')).rows.map((row) => [row.name, row.checksum]));
    const pending = [];
    for (const name of files) {
      const sql = fs.readFileSync(path.join(migrationDirectory, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      if (applied.has(name) && applied.get(name) !== checksum) throw new Error(`Applied migration checksum mismatch: ${name}`);
      if (!applied.has(name)) pending.push({ name, checksum, sql });
    }
    if (checkOnly && pending.length) throw new Error(`Pending migrations: ${pending.map((item) => item.name).join(', ')}`);
    for (const item of checkOnly ? [] : pending) {
      await client.query('BEGIN');
      try {
        await client.query(item.sql);
        await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [item.name, item.checksum]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
    const verified = await verifySchema(client);
    return { files: files.length, newlyApplied: checkOnly ? 0 : pending.length, pending: checkOnly ? pending.length : 0, verified };
  } finally {
    if (locked) await client.query('SELECT pg_advisory_unlock(7420260720)').catch(() => {});
    client.release();
  }
}

if (require.main === module) migrate({ checkOnly: process.argv.includes('--check') })
  .then((result) => console.log(`Migration status: ${JSON.stringify(result)}`))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());

module.exports = { migrate, verifySchema };
