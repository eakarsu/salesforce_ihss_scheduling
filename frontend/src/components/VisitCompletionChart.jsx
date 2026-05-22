// VIZ: Visit Completion Chart (pure SVG bars + legend)
import React, { useEffect, useState } from 'react';
import api from '../api';

export default function VisitCompletionChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    api.get('/api/custom-views/visit-completion')
      .then(r => { if (on) { setData(r.data); setErr(''); } })
      .catch(e => { if (on) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const buckets = (data && data.buckets) || [];
  const max = buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1;
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div data-testid="visit-completion-chart" style={card}>
      <div style={cardHeader}>
        <span style={{ fontSize: 18 }}>{'\u{1F4CA}'}</span>
        <h3 style={cardTitle}>Visit Completion</h3>
        <span style={cardMeta}>{data ? 'Total: ' + data.total : ''}</span>
      </div>
      {loading && <div style={muted}>Loading chart…</div>}
      {err && <div style={errorBox}>Error: {err}</div>}
      {!loading && !err && buckets.length === 0 && <div style={muted}>No data yet.</div>}
      {!loading && !err && buckets.length > 0 && (
        <svg viewBox="0 0 520 220" style={{ width: '100%', height: 220 }} role="img" aria-label="Visit completion bar chart">
          {buckets.map((b, i) => {
            const x = 40 + i * (440 / buckets.length);
            const w = (440 / buckets.length) - 12;
            const h = (b.count / max) * 160;
            const y = 180 - h;
            return (
              <g key={b.label}>
                <rect x={x} y={y} width={w} height={h} fill={colors[i % colors.length]} rx="4" />
                <text x={x + w / 2} y={y - 6} fontSize="11" textAnchor="middle" fill="#cbd5e1">{b.count}</text>
                <text x={x + w / 2} y={200} fontSize="10" textAnchor="middle" fill="#94a3b8">{b.label.slice(0, 10)}</text>
                <text x={x + w / 2} y={214} fontSize="9" textAnchor="middle" fill="#64748b">{b.pct}%</text>
              </g>
            );
          })}
          <line x1="40" y1="180" x2="480" y2="180" stroke="#334155" strokeWidth="1" />
        </svg>
      )}
    </div>
  );
}

const card = { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 };
const cardHeader = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
const cardTitle = { fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, flex: 1 };
const cardMeta = { fontSize: 11, color: '#94a3b8', fontWeight: 600 };
const muted = { color: '#94a3b8', fontSize: 13 };
const errorBox = { color: '#fca5a5', background: '#7f1d1d22', border: '1px solid #7f1d1d', padding: 8, borderRadius: 6, fontSize: 12 };
