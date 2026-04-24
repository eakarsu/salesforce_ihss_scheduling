import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 68;

const groups = [
  {
    title: 'Territory Mgmt',
    keys: ['service-territories', 'operating-hours', 'territory-members'],
    color: '#3b82f6',
  },
  {
    title: 'Resource Mgmt',
    keys: ['service-resources', 'skills', 'service-resource-skills', 'service-crews', 'resource-absences'],
    color: '#10b981',
  },
  {
    title: 'Work Mgmt',
    keys: ['work-types', 'work-orders', 'work-order-line-items', 'service-appointments', 'maintenance-plans'],
    color: '#f59e0b',
  },
  {
    title: 'Operations',
    keys: ['time-sheets', 'time-sheet-entries', 'shifts', 'assets', 'scheduling-policies'],
    color: '#8b5cf6',
  },
];

export default function Sidebar({ features, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const currentPath = location.pathname.replace('/', '');
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  let userName = 'User';
  let userRole = 'Administrator';
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      userName = parsed.name || parsed.email || 'User';
      userRole = parsed.role || 'Administrator';
    }
  } catch (e) {
    // ignore
  }

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const featureMap = {};
  features.forEach((f) => { featureMap[f.key] = f; });

  const isActive = (path) => currentPath === path;

  const linkStyle = (active, color, hovered) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: collapsed ? '10px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
    background: active ? `${color}18` : hovered ? `${color}0c` : 'transparent',
    color: active ? color : hovered ? color : '#94a3b8',
    border: active ? `1px solid ${color}30` : '1px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  return (
    <div
      style={{
        width,
        minWidth: width,
        height: '100vh',
        background: '#1e293b',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Brand + Collapse toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 0' : '16px 16px',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>{'\u2601\uFE0F'}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', letterSpacing: -0.3 }}>
              <span style={{ color: '#3b82f6' }}>Lowe's</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid #475569',
            background: '#0f172a',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#64748b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#475569'; }}
        >
          {collapsed ? '\u00BB' : '\u00AB'}
        </button>
      </div>

      {/* Scrollable nav area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '12px 8px' : '12px 12px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#334155 transparent',
        }}
      >
        {/* Dashboard link */}
        <Link
          to="/"
          style={linkStyle(location.pathname === '/', '#3b82f6', hoveredItem === 'dashboard')}
          title="Dashboard"
          onMouseEnter={() => setHoveredItem('dashboard')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{'\u{1F3E0}'}</span>
          <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s ease' }}>
            Dashboard
          </span>
        </Link>

        {/* Schedule Appointment link */}
        <Link
          to="/scheduling"
          style={{
            ...linkStyle(isActive('scheduling'), '#10b981', hoveredItem === 'scheduling'),
            marginTop: 4,
          }}
          title="Schedule Appointment"
          onMouseEnter={() => setHoveredItem('scheduling')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{'\uD83D\uDCC5'}</span>
          <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s ease' }}>
            Schedule Appointment
          </span>
        </Link>

        {/* Feature groups */}
        {groups.map((group) => {
          const groupFeatures = group.keys
            .map((key) => featureMap[key])
            .filter(Boolean);

          return (
            <div key={group.title} style={{ marginTop: 16 }}>
              {/* Group header */}
              {!collapsed ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: group.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: group.color,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                    }}
                  >
                    {group.title}
                  </span>
                  <div style={{ flex: 1, height: 1, background: `${group.color}25` }} />
                </div>
              ) : (
                <div
                  style={{
                    width: 20,
                    height: 1,
                    background: `${group.color}40`,
                    margin: '8px auto',
                  }}
                />
              )}

              {/* Group features */}
              {groupFeatures.map((feature) => {
                const active = isActive(feature.key);
                const hovered = hoveredItem === feature.key;
                return (
                  <Link
                    key={feature.key}
                    to={`/${feature.key}`}
                    style={{
                      ...linkStyle(active, feature.color, hovered),
                      marginTop: 2,
                      paddingLeft: collapsed ? 0 : 24,
                    }}
                    title={feature.label}
                    onMouseEnter={() => setHoveredItem(feature.key)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>
                      {feature.icon}
                    </span>
                    <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s ease' }}>
                      {feature.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User section at bottom */}
      <div
        style={{
          borderTop: '1px solid #334155',
          padding: collapsed ? '16px 8px' : '16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
              letterSpacing: 0.5,
            }}
            title={userName}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                {userRole}
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onLogout}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef444418';
              e.currentTarget.style.borderColor = '#ef444444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Logout
          </button>
        )}
        {collapsed && (
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              marginTop: 10,
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef444418';
              e.currentTarget.style.borderColor = '#ef444444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0f172a';
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            {'\u{2BBF}'}
          </button>
        )}
      </div>
    </div>
  );
}
