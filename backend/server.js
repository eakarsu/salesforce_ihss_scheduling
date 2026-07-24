const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const pool = require('./db');
const config = require('./config');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use((req, res, next) => {
  req.requestId = /^[A-Za-z0-9._:-]{8,100}$/.test(String(req.headers['x-request-id'] || '')) ? req.headers['x-request-id'] : crypto.randomUUID();
  res.set('X-Request-ID', req.requestId);
  const started = Date.now();
  res.on('finish', () => console.log(JSON.stringify({ level: 'info', event: 'request', requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started })));
  next();
});
app.use(helmet({ contentSecurityPolicy: config.frontendDirectory ? undefined : false }));
app.use(cors({
  credentials: false,
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed'); error.status = 403; error.code = 'CORS_FORBIDDEN'; callback(error);
  },
}));
app.use(express.json({ limit: '256kb', strict: true }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: config.nodeEnv === 'test' ? 1000 : 20, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/runtime-ai', require('./routes/runtimeAI'));
app.use('/api/scheduling', require('./routes/scheduling'));
app.use('/api/audit-logs', require('./routes/auditLogs'));

app.get(['/health', '/api/health'], async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.set('Cache-Control', 'no-store').json({ status: 'ok', database: 'reachable', service: 'installation-scheduling' });
  } catch (error) { error.status = 503; error.code = 'DATABASE_UNAVAILABLE'; next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found', code: 'NOT_FOUND' }));
if (fs.existsSync(config.frontendDirectory)) {
  app.use(express.static(config.frontendDirectory, { index: false, maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
  app.get('*splat', (_req, res) => res.sendFile(path.join(config.frontendDirectory, 'index.html')));
}
app.use((_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));
app.use((error, req, res, _next) => {
  const status = error.status || (error.type === 'entity.too.large' ? 413 : 500);
  const code = error.code && !/^\d+$/.test(String(error.code)) ? error.code : status === 413 ? 'BODY_TOO_LARGE' : 'INTERNAL_ERROR';
  if (status >= 500) console.error(JSON.stringify({ level: 'error', event: 'request_failed', requestId: req.requestId, code, message: error.message }));
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message, code, requestId: req.requestId });
});

let server;
if (require.main === module) {
  server = app.listen(config.port, config.host, () => console.log(JSON.stringify({ level: 'info', event: 'server_started', host: config.host, port: config.port })));
  const shutdown = (signal) => {
    console.log(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
