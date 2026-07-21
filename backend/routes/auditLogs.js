const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { verifyAuditChain } = require('../audit');

router.get('/', auth, authorize('admin'), async (_req, res, next) => {
  try {
    const rows = (await pool.query(`SELECT id,sequence,actor_user_id,action,entity_type,entity_id,outcome,metadata,previous_hash,event_hash,created_at
      FROM scheduling_audit_events ORDER BY sequence ASC LIMIT 10000`)).rows;
    res.set('Cache-Control', 'no-store').json({ events: rows, verification: verifyAuditChain(rows) });
  } catch (error) { next(error); }
});

module.exports = router;
