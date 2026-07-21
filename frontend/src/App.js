import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import api from './api';
import Login from './pages/Login';
import SchedulingPage from './pages/SchedulingPage';

function ProtectedScheduling() {
  const navigate = useNavigate();
  const [state, setState] = useState({ checking: true, user: null });
  useEffect(() => {
    api.get('/api/auth/me')
      .then((response) => setState({ checking: false, user: response.data.user }))
      .catch(() => {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        setState({ checking: false, user: null });
      });
  }, []);
  if (state.checking) return <main style={{ minHeight: '100vh', background: '#0f172a', color: '#94a3b8', padding: 40 }}>Validating session…</main>;
  if (!state.user) return <Navigate to="/login" replace />;
  if (!['admin', 'manager'].includes(state.user.role)) return <main style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: 40 }}><h1>Scheduling access denied</h1><p>This workflow is limited to authorized dispatch managers.</p><button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>Sign out</button></main>;
  return <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #334155', background: '#1e293b' }}>
      <div><strong>Installation Scheduling</strong><span style={{ color: '#94a3b8', marginLeft: 12, fontSize: 12 }}>Deterministic availability · {state.user.role}</span></div>
      <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} style={{ border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: '8px 12px' }}>Sign out</button>
    </header>
    <SchedulingPage />
  </div>;
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/*" element={<ProtectedScheduling />} />
  </Routes></BrowserRouter>;
}
