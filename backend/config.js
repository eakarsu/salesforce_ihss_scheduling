const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function required(name, minimum = 1) {
  const value = String(process.env[name] || '').trim();
  if (value.length < minimum) throw new Error(`${name} must contain at least ${minimum} characters`);
  return value;
}

const databaseUrl = required('DATABASE_URL');
const nodeEnv = process.env.NODE_ENV || 'development';
if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) throw new Error('DATABASE_URL must use PostgreSQL');
const port = Number(process.env.BACKEND_PORT || 4003);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('BACKEND_PORT must be an unprivileged TCP port');
const host = process.env.APP_HOST || '127.0.0.1';
if (!['127.0.0.1', '0.0.0.0'].includes(host)) throw new Error('APP_HOST must be 127.0.0.1 or 0.0.0.0');
const trustProxyValue = process.env.TRUST_PROXY || 'false';
if (!['true', 'false'].includes(trustProxyValue)) throw new Error('TRUST_PROXY must be true or false');

module.exports = {
  databaseUrl,
  jwtSecret: required('JWT_SECRET', 32),
  jwtIssuer: 'installation-scheduling',
  jwtAudience: 'installation-scheduling-web',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  corsOrigins: (nodeEnv === 'test' ? process.env.CORS_ORIGINS || 'http://127.0.0.1:3000' : required('CORS_ORIGINS')).split(',').map((value) => value.trim()).filter(Boolean),
  host,
  port,
  nodeEnv,
  frontendDirectory: process.env.FRONTEND_DIST || path.resolve(__dirname, '../frontend/dist'),
  trustProxy: trustProxyValue === 'true',
};
