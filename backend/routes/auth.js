const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');
const { jwtSecret, jwtIssuer, jwtAudience, jwtExpiresIn } = require('../config');

router.post('/register', (_req, res) => res.status(403).json({ error: 'Public staff registration is disabled', code: 'REGISTRATION_DISABLED' }));

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (email.length < 3 || email.length > 255 || password.length < 1 || password.length > 72) {
      return res.status(400).json({ error: 'Email and password are required', code: 'CREDENTIALS_REQUIRED' });
    }
    const result = await pool.query(
      `SELECT id,name,email,password_hash,role FROM users
       WHERE LOWER(email)=$1 AND is_active=TRUE`,
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }
    const token = jwt.sign({}, jwtSecret, {
      algorithm: 'HS256', subject: String(user.id), issuer: jwtIssuer, audience: jwtAudience, expiresIn: jwtExpiresIn,
    });
    res.set('Cache-Control', 'no-store').json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.get('/me', auth, (req, res) => res.set('Cache-Control', 'no-store').json({ user: req.user }));

module.exports = router;
