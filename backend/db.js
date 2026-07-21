const { Pool } = require('pg');
const { databaseUrl } = require('./config');

const max = Number(process.env.DB_POOL_MAX || 10);
if (!Number.isInteger(max) || max < 1 || max > 50) throw new Error('DB_POOL_MAX must be an integer from 1 to 50');

module.exports = new Pool({
  connectionString: databaseUrl,
  max,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 15000,
});
