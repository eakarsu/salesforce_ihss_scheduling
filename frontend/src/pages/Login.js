import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    padding: 20,
  },
  card: {
    background: '#1e293b',
    borderRadius: 20,
    border: '1px solid #334155',
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: 'block',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#e2e8f0',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 500,
  },
  sfBadge: {
    display: 'inline-block',
    marginTop: 12,
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: '#3b82f622',
    color: '#3b82f6',
    border: '1px solid #3b82f644',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  autoFillBtn: {
    width: '100%',
    padding: '12px 24px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 12,
  },
  error: {
    background: '#ef444422',
    border: '1px solid #ef444444',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
    textAlign: 'center',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#334155',
  },
  dividerText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user || { email }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('admin@lowes.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>{'\u2601\uFE0F'}</span>
          <div style={styles.logoTitle}>Lowe's</div>
          <div style={styles.logoSubtitle}>Installation Services Platform</div>
          <span style={styles.sfBadge}>Home Improvement</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              required
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password..."
              required
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.loginBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.opacity = '1'; }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button
          style={styles.autoFillBtn}
          onClick={handleAutoFill}
          onMouseEnter={(e) => { e.target.style.background = '#475569'; e.target.style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.target.style.background = '#334155'; e.target.style.color = '#94a3b8'; }}
        >
          Auto-Fill Credentials
        </button>
      </div>
    </div>
  );
}
