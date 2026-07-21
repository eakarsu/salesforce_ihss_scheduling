const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwtSecret, jwtIssuer, jwtAudience } = require('../config');

module.exports = async function authenticate(req, res, next) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  try {
    const decoded = jwt.verify(header.slice(7), jwtSecret, { algorithms: ['HS256'], issuer: jwtIssuer, audience: jwtAudience });
    if (!/^\d+$/.test(String(decoded.sub || ''))) throw new Error('invalid subject');
    const result = await pool.query(
      `SELECT id,name,email,role FROM users
       WHERE id=$1 AND is_active=TRUE AND role IN ('admin','manager','viewer')`,
      [Number(decoded.sub)]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid access token', code: 'AUTH_INVALID' });
    req.user = result.rows[0];
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Invalid access token', code: 'AUTH_INVALID' });
  }
};
