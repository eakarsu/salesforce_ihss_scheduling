// VIZ: Caregiver Coverage Heatmap (days x territories)
import React, { useEffect, useState } from 'react';
import api from '../api';

export default function CaregiverCoverageHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    api.get('/api/custom-views/coverage-heatmap')
      .then(r => { if (on) { setData(r.data); setErr(''); } })
      .catch(e => { if (on) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const cellAt = (day, terr) => {
    if (!data) return null;
    return data.cells.find(c => c.day === day && c.territory === terr);
  };

  const colorFor = (intensity) => {
    // green gradient 0 -> dark, 1 -> bright
    const r = Math.round(16 + 24 * intensity);
    const g = Math.round(80 + 155 * intensity);
    const b = Math.round(60 + 50 * intensity);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="caregiver-coverage-heatmap" style={card}>
      <div style={cardHeader}>
        <span style={{ fontSize: 18 }}>{'\u{1F525}'}</span>
        <h3 style={cardTitle}>Caregiver Coverage Heatmap</h3>
        <span style={cardMeta}>{data ? data.territories.length + ' territories' : ''}</span>
      </div>
      {loading && <div style={muted}>Loading heatmap…</div>}
      {err && <div style={errorBox}>Error: {err}</div>}
      {data && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 11 }}>
            <thead>
              <tr>
                <th style={th}></th>
                {data.days.map(d => <th key={d} style={th}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.territories.map(t => (
                <tr key={t}>
                  <td style={{ ...th, textAlign: 'right', paddingRight: 8 }}>{t.slice(0, 18)}</td>
                  {data.days.map(d => {
                    const c = cellAt(d, t);
                    const i = c ? c.intensity : 0;
                    return (
                      <td key={d + t} title={`${t} / ${d}: ${c ? c.value : 0}`} style={{
                        width: 38, height: 26, borderRadius: 4,
                        background: colorFor(i),
                        color: i > 0.6 ? '#0f172a' : '#e2e8f0',
                        textAlign: 'center', fontWeight: 600,
                      }}>{c ? c.value : 0}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
const th = { color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, padding: '4px 6px' };
