const router = require('express').Router;
const pool = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { recordAudit } = require('../audit');

function createCrudRouter(tableName, columns) {
  const r = router();

  r.get('/', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.get('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id=$1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  r.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
    const client = await pool.connect();
    try {
      const cols = columns.filter((c) => req.body[c] !== undefined);
      if (cols.length === 0) return res.status(400).json({ error: 'At least one supported field is required' });
      const vals = cols.map((c) => req.body[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        vals
      );
      await recordAudit(client, req, 'create', tableName, result.rows[0].id, null, result.rows[0]);
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  r.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    const client = await pool.connect();
    try {
      const cols = columns.filter((c) => req.body[c] !== undefined);
      if (cols.length === 0) return res.status(400).json({ error: 'At least one supported field is required' });
      const vals = cols.map((c) => req.body[c]);
      const sets = cols.map((c, i) => `${c}=$${i + 1}`);
      vals.push(req.params.id);
      await client.query('BEGIN');
      const before = await client.query(`SELECT * FROM ${tableName} WHERE id=$1 FOR UPDATE`, [req.params.id]);
      if (before.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Not found' });
      }
      const result = await client.query(
        `UPDATE ${tableName} SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`,
        vals
      );
      await recordAudit(client, req, 'update', tableName, req.params.id, before.rows[0], result.rows[0]);
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  r.delete('/:id', auth, authorize('admin'), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`DELETE FROM ${tableName} WHERE id=$1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Not found' });
      }
      await recordAudit(client, req, 'delete', tableName, req.params.id, result.rows[0], null);
      await client.query('COMMIT');
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  return r;
}

module.exports = createCrudRouter;
