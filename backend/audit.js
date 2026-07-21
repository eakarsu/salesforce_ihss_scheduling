const crypto = require('crypto');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

function materialFromRow(row) {
  return canonical({
    sequence: Number(row.sequence),
    actorUserId: Number(row.actor_user_id),
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    outcome: row.outcome,
    metadata: row.metadata,
    previousHash: row.previous_hash,
    createdAt: new Date(row.created_at).toISOString(),
  });
}

async function recordAudit(client, { actorUserId, action, entityType, entityId, outcome = 'SUCCESS', metadata = {} }) {
  await client.query('SELECT pg_advisory_xact_lock(7420260721)');
  const previous = (await client.query('SELECT sequence,event_hash FROM scheduling_audit_events ORDER BY sequence DESC LIMIT 1')).rows[0];
  const sequence = previous ? Number(previous.sequence) + 1 : 1;
  if (!Number.isSafeInteger(sequence)) throw new Error('Audit sequence exceeds safe integer limits');
  const previousHash = previous?.event_hash || '0'.repeat(64);
  const createdAt = new Date().toISOString();
  const material = canonical({ sequence, actorUserId, action, entityType, entityId: String(entityId), outcome, metadata, previousHash, createdAt });
  const eventHash = sha256(JSON.stringify(material));
  return (await client.query(
    `INSERT INTO scheduling_audit_events(sequence,actor_user_id,action,entity_type,entity_id,outcome,metadata,previous_hash,event_hash,created_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [sequence, actorUserId, action, entityType, String(entityId), outcome, metadata, previousHash, eventHash, createdAt]
  )).rows[0];
}

function verifyAuditChain(rows) {
  let previousHash = '0'.repeat(64);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const sequence = Number(row.sequence);
    if (!Number.isSafeInteger(sequence) || sequence !== index + 1 || row.previous_hash !== previousHash || sha256(JSON.stringify(materialFromRow(row))) !== row.event_hash) {
      return { valid: false, checked: index, firstInvalidSequence: Number.isSafeInteger(sequence) ? sequence : String(row.sequence) };
    }
    previousHash = row.event_hash;
  }
  return { valid: true, checked: rows.length, firstInvalidSequence: null };
}

module.exports = { canonical, recordAudit, sha256, verifyAuditChain };
