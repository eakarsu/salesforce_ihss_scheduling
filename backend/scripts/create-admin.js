#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const pool = require('../db');

const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || '';
const name = String(process.env.BOOTSTRAP_ADMIN_NAME || process.env.PROVISION_ADMIN_NAME || 'Scheduling Administrator').trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
if (password.length < 16 || password.length > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain 16-72 characters with upper-case, lower-case, and numeric characters');
}
if (name.length < 2 || name.length > 120) throw new Error('BOOTSTRAP_ADMIN_NAME must contain 2-120 characters');

async function createAdmin() {
  const result = await pool.query(
    `INSERT INTO users(name,email,password_hash,role,is_active)
     VALUES($1,$2,$3,'admin',TRUE)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [name, email, await bcrypt.hash(password, 12)],
  );
  console.log(result.rowCount ? `Administrator identity created for ${email}` : `Administrator identity already exists for ${email}`);
}

createAdmin()
  .catch((error) => {
    console.error(`Administrator bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
