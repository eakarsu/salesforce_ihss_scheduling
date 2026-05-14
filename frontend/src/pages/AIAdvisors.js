import React, { useState } from 'react';
import api from '../api';

const ACCENT = '#10b981';
const ACCENT_BG = '#10b98111';

const tools = [
  {
    id: 'optimize-schedule',
    label: 'Optimize Schedule',
    icon: '\u{1F5D3}️',
    color: '#3b82f6',
    description: 'AI-driven shift assignment optimizer',
    endpoint: '/api/ai/optimize-schedule',
    fields: [
      { key: 'period', label: 'Period', type: 'text', placeholder: 'e.g., 2026-05-06 to 2026-05-12' },
      { key: 'territory', label: 'Territory', type: 'text', placeholder: 'e.g., West Region' },
      { key: 'objectives', label: 'Objectives', type: 'textarea', placeholder: 'e.g., minimize travel, prioritize skill match, balance workload...' },
    ],
  },
  {
    id: 'predict-demand',
    label: 'Predict Demand',
    icon: '\u{1F4C8}',
    color: '#8b5cf6',
    description: 'Forecast service demand for upcoming periods',
    endpoint: '/api/ai/predict-demand',
    fields: [
      { key: 'territory', label: 'Territory', type: 'text', placeholder: 'e.g., Mid-Atlantic Territory' },
      { key: 'horizonDays', label: 'Horizon Days', type: 'number', placeholder: '14' },
      { key: 'context', label: 'Context (optional)', type: 'textarea', placeholder: 'Seasonal factors, special events, holidays...' },
    ],
  },
  {
    id: 'find-backup-resource',
    label: 'Find Backup Resource',
    icon: '\u{1F198}',
    color: '#ef4444',
    description: 'Recommend a backup resource for a last-minute absence',
    endpoint: '/api/ai/find-backup-resource',
    fields: [
      { key: 'absentResource', label: 'Absent Resource', type: 'text', placeholder: 'e.g., Carla Diaz' },
      { key: 'shiftStart', label: 'Shift Start (ISO)', type: 'text', placeholder: '2026-05-07T08:00:00Z' },
      { key: 'shiftEnd', label: 'Shift End (ISO)', type: 'text', placeholder: '2026-05-07T16:00:00Z' },
      { key: 'requiredSkills', label: 'Required Skills (comma separated)', type: 'text', placeholder: 'e.g., HVAC, Bilingual Spanish' },
      { key: 'territory', label: 'Territory', type: 'text', placeholder: 'e.g., Northeast Territory' },
    ],
  },
  {
    id: 'skill-gap-analyzer',
    label: 'Skill Gap Analyzer',
    icon: '\u{1F4DA}',
    color: '#f59e0b',
    description: 'Identify training gaps for your roster vs required skills',
    endpoint: '/api/ai/skill-gap-analyzer',
    fields: [
      { key: 'roster', label: 'Roster (JSON array) *', type: 'textarea', placeholder: '[{"name":"A. Smith","skills":["HVAC","plumbing"],"certs":["EPA608"]},{"name":"B. Jones","skills":["electrical"],"certs":[]}]' },
      { key: 'required_skills', label: 'Required Skills (JSON array)', type: 'textarea', placeholder: '["HVAC","electrical","appliance_install","drywall_repair"]' },
      { key: 'target_certifications', label: 'Target Certifications (JSON array)', type: 'textarea', placeholder: '["EPA608","OSHA10","NATE"]' },
      { key: 'work_mix', label: 'Work Mix (JSON object, optional)', type: 'textarea', placeholder: '{"HVAC":0.45,"appliance":0.30,"electrical":0.25}' },
    ],
  },
  // Apply pass 5 — backlog tools
  {
    id: 'rate-advisor',
    label: 'Labor Cost Advisor',
    icon: '\u{1F4B0}',
    color: '#22c55e',
    description: 'AI labor-cost analysis from rate cards and worked hours',
    endpoint: '/api/ai/rate-advisor',
    fields: [
      { key: 'rates', label: 'Rates (JSON array)', type: 'textarea', placeholder: '[{"work_type":"HVAC","hourly_rate":48,"territory":"NE"}]' },
      { key: 'hours', label: 'Hours (JSON array)', type: 'textarea', placeholder: '[{"work_type":"HVAC","resource":"A. Smith","hours":32}]' },
      { key: 'territory', label: 'Territory', type: 'text', placeholder: 'all' },
    ],
  },
  {
    id: 'notify-sms',
    label: 'SMS Notify (Twilio)',
    icon: '\u{1F4AC}',
    color: '#06b6d4',
    description: 'Schedule-change SMS dispatch (requires Twilio creds)',
    endpoint: '/api/ai/notify-sms',
    fields: [
      { key: 'to', label: 'To (E.164) *', type: 'text', placeholder: '+15551234567' },
      { key: 'body', label: 'Body *', type: 'textarea', placeholder: 'Your shift on 2026-05-09 starts 30min later.' },
    ],
  },
  {
    id: 'notify-push',
    label: 'Push Notify (FCM)',
    icon: '\u{1F4F2}',
    color: '#a855f7',
    description: 'Mobile push notification (requires FCM_SERVER_KEY)',
    endpoint: '/api/ai/notify-push',
    fields: [
      { key: 'device_token', label: 'Device Token *', type: 'text' },
      { key: 'title', label: 'Title *', type: 'text', placeholder: 'Schedule update' },
      { key: 'body', label: 'Body', type: 'textarea' },
    ],
  },
  {
    id: 'gps-track',
    label: 'GPS Track',
    icon: '\u{1F4CD}',
    color: '#eab308',
    description: 'Fleet GPS lookup (requires GPS_TRACKING_API_KEY)',
    endpoint: '/api/ai/gps-track',
    fields: [
      { key: 'resource_id', label: 'Resource ID', type: 'text' },
    ],
  },
  {
    id: 'payroll-export',
    label: 'Payroll Export',
    icon: '\u{1F4B5}',
    color: '#ec4899',
    description: 'Payroll period export (requires PAYROLL_API_KEY)',
    endpoint: '/api/ai/payroll-export',
    fields: [
      { key: 'period_start', label: 'Period Start *', type: 'text', placeholder: '2026-05-01' },
      { key: 'period_end', label: 'Period End *', type: 'text', placeholder: '2026-05-15' },
    ],
  },
];

const styles = {
  page: { padding: '32px 32px', maxWidth: 1100, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 },
  card: (active, color) => ({
    background: active ? `${color}1a` : '#0f172a',
    border: `1px solid ${active ? color : '#334155'}`,
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
    transition: 'all .2s',
  }),
  icon: { fontSize: 28 },
  cardTitle: { fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginTop: 6 },
  cardDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  form: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 24,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
    minHeight: 90,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: (loading) => ({
    background: loading ? '#475569' : ACCENT,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontWeight: 700,
    fontSize: 13,
    cursor: loading ? 'wait' : 'pointer',
  }),
  resultBox: {
    marginTop: 16,
    background: ACCENT_BG,
    border: `1px solid ${ACCENT}`,
    borderRadius: 12,
    padding: 16,
  },
  errorBox: {
    marginTop: 16,
    background: '#7f1d1d33',
    border: '1px solid #ef4444',
    borderRadius: 12,
    padding: 16,
    color: '#fecaca',
    fontSize: 13,
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, monospace',
  },
};

export default function AIAdvisors() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [forms, setForms] = useState({});
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const tool = tools.find((t) => t.id === activeId);
  const formData = forms[activeId] || {};
  const result = results[activeId];
  const error = errors[activeId];
  const isLoading = !!loading[activeId];

  const setField = (key, value) => {
    setForms((prev) => ({ ...prev, [activeId]: { ...(prev[activeId] || {}), [key]: value } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, [activeId]: true }));
    setErrors((prev) => ({ ...prev, [activeId]: null }));
    setResults((prev) => ({ ...prev, [activeId]: null }));
    try {
      const payload = { ...formData };
      if (payload.requiredSkills && typeof payload.requiredSkills === 'string') {
        payload.requiredSkills = payload.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (payload.horizonDays) payload.horizonDays = Number(payload.horizonDays);
      // Skill-gap-analyzer requires JSON-shaped fields.
      if (tool.id === 'skill-gap-analyzer') {
        const tryJson = (k, fallback) => {
          const v = payload[k];
          if (v === undefined || v === null || v === '') { payload[k] = fallback; return; }
          try { payload[k] = JSON.parse(v); } catch { /* keep as string */ }
        };
        tryJson('roster', []);
        tryJson('required_skills', []);
        tryJson('target_certifications', []);
        tryJson('work_mix', {});
      }
      // Rate advisor: rates / hours are JSON arrays.
      if (tool.id === 'rate-advisor') {
        const tryJson = (k, fallback) => {
          const v = payload[k];
          if (v === undefined || v === null || v === '') { payload[k] = fallback; return; }
          try { payload[k] = JSON.parse(v); } catch { /* keep as string */ }
        };
        tryJson('rates', []);
        tryJson('hours', []);
      }
      const res = await api.post(tool.endpoint, payload);
      setResults((prev) => ({ ...prev, [activeId]: res.data }));
    } catch (err) {
      const status = err.response?.status;
      const baseMsg = err.response?.data?.error || err.message || 'Request failed';
      const msg = status === 503 ? `AI service unavailable (503): ${baseMsg}` : baseMsg;
      setErrors((prev) => ({ ...prev, [activeId]: msg }));
    } finally {
      setLoading((prev) => ({ ...prev, [activeId]: false }));
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>AI Advisors</div>
        <div style={styles.subtitle}>
          Schedule optimization, demand prediction, and last-minute backup resourcing.
        </div>
      </div>

      <div style={styles.grid}>
        {tools.map((t) => (
          <div
            key={t.id}
            style={styles.card(activeId === t.id, t.color)}
            onClick={() => setActiveId(t.id)}
          >
            <div style={styles.icon}>{t.icon}</div>
            <div style={styles.cardTitle}>{t.label}</div>
            <div style={styles.cardDesc}>{t.description}</div>
          </div>
        ))}
      </div>

      <form style={styles.form} onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...styles.title, fontSize: 18 }}>{tool.label}</div>
          <div style={styles.subtitle}>{tool.description}</div>
        </div>

        {tool.fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={styles.label}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                style={styles.textarea}
                value={formData[f.key] || ''}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                type={f.type}
                style={styles.input}
                value={formData[f.key] || ''}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}

        <button type="submit" style={styles.button(isLoading)} disabled={isLoading}>
          {isLoading ? 'Working...' : `Run ${tool.label}`}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}

        {result && (
          <div style={styles.resultBox}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>Result</div>
            <pre style={styles.pre}>
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
