// NON-VIZ: Visit Verification PDF generator (form -> POST -> blob -> download)
import React, { useState } from 'react';
import api from '../api';

export default function VisitVerificationPdf() {
  const [form, setForm] = useState({
    visit_id: 'V-' + Math.floor(Math.random() * 9000 + 1000),
    caregiver: 'Maria Lopez',
    client: 'Robert Johnson',
    date: new Date().toISOString().slice(0, 10),
    minutes: 90,
    notes: 'Bathing, meal preparation, and medication reminder completed per care plan.',
  });
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setStatus(''); setDownloadUrl('');
    try {
      const res = await api.post('/api/custom-views/verification-pdf', form, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus('PDF generated (' + Math.round(blob.size / 100) / 10 + ' KB).');
    } catch (err) {
      setStatus('Error: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="visit-verification-pdf" style={card}>
      <div style={cardHeader}>
        <span style={{ fontSize: 18 }}>{'\u{1F4C4}'}</span>
        <h3 style={cardTitle}>Visit Verification PDF</h3>
      </div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Visit ID" value={form.visit_id} onChange={v => update('visit_id', v)} />
        <Field label="Date" value={form.date} onChange={v => update('date', v)} />
        <Field label="Caregiver" value={form.caregiver} onChange={v => update('caregiver', v)} />
        <Field label="Client" value={form.client} onChange={v => update('client', v)} />
        <Field label="Minutes" value={form.minutes} onChange={v => update('minutes', v)} type="number" />
        <div style={{ gridColumn: '1 / span 2' }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} style={ta} />
        </div>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={btn}>{loading ? 'Generating…' : 'Generate PDF'}</button>
          {downloadUrl && <a href={downloadUrl} download={`visit-${form.visit_id}.pdf`} style={dlBtn}>Download / Open</a>}
          {status && <span style={{ fontSize: 12, color: status.startsWith('Error') ? '#fca5a5' : '#86efac' }}>{status}</span>}
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}

const card = { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 };
const cardHeader = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
const cardTitle = { fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, flex: 1 };
const lbl = { display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 };
const inp = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13 };
const ta = { ...inp, fontFamily: 'inherit', resize: 'vertical' };
const btn = { padding: '8px 16px', borderRadius: 6, border: 0, background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const dlBtn = { padding: '8px 14px', borderRadius: 6, border: '1px solid #10b981', background: '#10b98122', color: '#86efac', fontWeight: 600, textDecoration: 'none', fontSize: 12 };
