// NON-VIZ: Scheduling Rules CRUD Editor (list + add + edit + delete)
import React, { useEffect, useState } from 'react';
import api from '../api';

const blank = { name: '', metric: 'custom', threshold: 1, enabled: true, note: '' };

export default function SchedulingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [editing, setEditing] = useState(null); // id or 'new'
  const [draft, setDraft] = useState(blank);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/custom-views/rules');
      setRules(r.data.rules || []);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing('new'); setDraft(blank); };
  const startEdit = (r) => { setEditing(r.id); setDraft({ ...r }); };
  const cancel = () => { setEditing(null); setDraft(blank); };

  const save = async () => {
    try {
      if (editing === 'new') {
        await api.post('/api/custom-views/rules', draft);
      } else {
        await api.put('/api/custom-views/rules/' + editing, draft);
      }
      cancel();
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete('/api/custom-views/rules/' + id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    }
  };

  return (
    <div data-testid="scheduling-rules-editor" style={card}>
      <div style={cardHeader}>
        <span style={{ fontSize: 18 }}>{'\u{2699}️'}</span>
        <h3 style={cardTitle}>Scheduling Rules</h3>
        <button onClick={startNew} style={btnPrimary}>+ Add Rule</button>
      </div>
      {err && <div style={errorBox}>{err}</div>}
      {loading && <div style={muted}>Loading rules…</div>}
      {!loading && rules.length === 0 && <div style={muted}>No rules yet.</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Metric</th>
            <th style={th}>Threshold</th>
            <th style={th}>Enabled</th>
            <th style={th}>Note</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            editing === r.id ? (
              <EditRow key={r.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
            ) : (
              <tr key={r.id} style={{ borderTop: '1px solid #334155' }}>
                <td style={td}>{r.name}</td>
                <td style={td}><code style={{ color: '#fbbf24' }}>{r.metric}</code></td>
                <td style={td}>{r.threshold}</td>
                <td style={td}>{r.enabled ? 'Yes' : 'No'}</td>
                <td style={td}>{r.note}</td>
                <td style={td}>
                  <button onClick={() => startEdit(r)} style={btnSm}>Edit</button>
                  <button onClick={() => remove(r.id)} style={{ ...btnSm, color: '#fca5a5', borderColor: '#7f1d1d' }}>Delete</button>
                </td>
              </tr>
            )
          ))}
          {editing === 'new' && (
            <EditRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function EditRow({ draft, setDraft, onSave, onCancel }) {
  const upd = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  return (
    <tr style={{ borderTop: '1px solid #334155', background: '#0f172a' }}>
      <td style={td}><input value={draft.name} onChange={e => upd('name', e.target.value)} style={inp} /></td>
      <td style={td}><input value={draft.metric} onChange={e => upd('metric', e.target.value)} style={inp} /></td>
      <td style={td}><input type="number" value={draft.threshold} onChange={e => upd('threshold', Number(e.target.value))} style={{ ...inp, width: 80 }} /></td>
      <td style={td}><input type="checkbox" checked={!!draft.enabled} onChange={e => upd('enabled', e.target.checked)} /></td>
      <td style={td}><input value={draft.note} onChange={e => upd('note', e.target.value)} style={inp} /></td>
      <td style={td}>
        <button onClick={onSave} style={btnSm}>Save</button>
        <button onClick={onCancel} style={btnSm}>Cancel</button>
      </td>
    </tr>
  );
}

const card = { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 };
const cardHeader = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
const cardTitle = { fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, flex: 1 };
const muted = { color: '#94a3b8', fontSize: 13 };
const errorBox = { color: '#fca5a5', background: '#7f1d1d22', border: '1px solid #7f1d1d', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 8 };
const th = { color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '6px 8px', textAlign: 'left', letterSpacing: 0.6 };
const td = { color: '#e2e8f0', padding: '6px 8px', fontSize: 12 };
const inp = { width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12 };
const btnSm = { background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', marginRight: 4 };
const btnPrimary = { background: '#3b82f6', border: 0, color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' };
