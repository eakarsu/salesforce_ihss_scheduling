import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const groups = [
  {
    title: 'Territory Management',
    keys: ['service-territories', 'operating-hours', 'territory-members'],
    color: '#3b82f6',
  },
  {
    title: 'Resource Management',
    keys: ['service-resources', 'skills', 'service-resource-skills', 'service-crews', 'resource-absences'],
    color: '#10b981',
  },
  {
    title: 'Work Management',
    keys: ['work-types', 'work-orders', 'work-order-line-items', 'service-appointments', 'maintenance-plans'],
    color: '#f59e0b',
  },
  {
    title: 'Operations',
    keys: ['time-sheets', 'time-sheet-entries', 'shifts', 'assets', 'scheduling-policies'],
    color: '#8b5cf6',
  },
];

const descriptions = {
  'service-territories': 'Manage Lowe\'s store service zones and coverage areas',
  'operating-hours': 'Configure installation service hours and availability',
  'service-resources': 'Manage installation professionals and contractors',
  'skills': 'Define installer specialties and certifications',
  'service-resource-skills': 'Map installation skills to individual installers',
  'territory-members': 'Assign installers to store service territories',
  'work-types': 'Configure installation service types and durations',
  'work-orders': 'Track residential installation work orders',
  'work-order-line-items': 'Detailed line items within installation orders',
  'service-appointments': 'Schedule and track installation appointments',
  'resource-absences': 'Track installer time-off and unavailability',
  'time-sheets': 'Manage installer time tracking sheets',
  'time-sheet-entries': 'Individual time entries for installations performed',
  'shifts': 'Define and manage installer shift schedules',
  'service-crews': 'Organize installers into installation crews',
  'assets': 'Track installed products and customer equipment',
  'maintenance-plans': 'Configure preventive maintenance and warranty schedules',
  'scheduling-policies': 'Define scheduling optimization rules and constraints',
};

const styles = {
  page: {
    padding: '32px 32px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 40,
    padding: '40px 0 32px',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: 'block',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 500,
    marginBottom: 28,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    flexWrap: 'wrap',
  },
  statCard: (color) => ({
    background: `${color}11`,
    border: `1px solid ${color}33`,
    borderRadius: 12,
    padding: '16px 32px',
    textAlign: 'center',
    minWidth: 140,
  }),
  statValue: (color) => ({
    fontSize: 28,
    fontWeight: 800,
    color: color,
    lineHeight: 1,
    marginBottom: 4,
  }),
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupSection: {
    marginBottom: 36,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  groupDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
  }),
  groupTitle: (color) => ({
    fontSize: 18,
    fontWeight: 700,
    color: color,
    letterSpacing: -0.3,
  }),
  groupLine: (color) => ({
    flex: 1,
    height: 1,
    background: `${color}33`,
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: (color) => ({
    background: '#1e293b',
    borderRadius: 14,
    border: '1px solid #334155',
    padding: '20px 22px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  }),
  cardAccent: (color) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${color}, ${color}88)`,
  }),
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 28,
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e2e8f0',
    flex: 1,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.5,
    fontWeight: 500,
  },
  cardAiBadge: {
    display: 'inline-block',
    marginTop: 10,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #3b82f622, #8b5cf622)',
    color: '#8b5cf6',
    border: '1px solid #8b5cf644',
    letterSpacing: 0.5,
  },
  cardArrow: (color) => ({
    position: 'absolute',
    bottom: 16,
    right: 18,
    fontSize: 18,
    color: `${color}66`,
    transition: 'all 0.2s',
  }),
};

export default function Dashboard({ features }) {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const aiCount = features.filter((f) => f.ai).length;

  return (
    <div style={styles.page}>
      <div style={styles.headerSection}>
        <span style={styles.headerIcon}>{'\u2601\uFE0F'}</span>
        <div style={styles.headerTitle}>Lowe's Home Improvement</div>
        <div style={styles.headerSubtitle}>Installation Services Scheduling</div>
        <div style={styles.statsRow}>
          <div style={styles.statCard('#3b82f6')}>
            <div style={styles.statValue('#3b82f6')}>18</div>
            <div style={styles.statLabel}>Service Objects</div>
          </div>
          <div style={styles.statCard('#8b5cf6')}>
            <div style={styles.statValue('#8b5cf6')}>{aiCount}</div>
            <div style={styles.statLabel}>AI Features</div>
          </div>
          <div style={styles.statCard('#10b981')}>
            <div style={styles.statValue('#10b981')}>270</div>
            <div style={styles.statLabel}>Records</div>
          </div>
        </div>
      </div>

      {/* Scheduling CTA Banner */}
      <Link to="/scheduling" style={{ textDecoration: 'none', display: 'block', marginBottom: 36 }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b98111, #10b98122)',
          border: '1px solid #10b98133',
          borderRadius: 14,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>{'\uD83D\uDCC5'}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
                Schedule Appointment
              </div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                Book installation appointments with skill matching, availability checking, and store territory-based installer assignment
              </div>
            </div>
          </div>
          <div style={{
            padding: '10px 24px',
            borderRadius: 10,
            background: '#10b981',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            Open Wizard &rarr;
          </div>
        </div>
      </Link>

      {groups.map((group) => {
        const groupFeatures = group.keys
          .map((key) => features.find((f) => f.key === key))
          .filter(Boolean);

        return (
          <div key={group.title} style={styles.groupSection}>
            <div style={styles.groupHeader}>
              <div style={styles.groupDot(group.color)} />
              <div style={styles.groupTitle(group.color)}>{group.title}</div>
              <div style={styles.groupLine(group.color)} />
            </div>
            <div style={styles.grid}>
              {groupFeatures.map((feature) => (
                <div
                  key={feature.key}
                  style={{
                    ...styles.card(feature.color),
                    borderColor: hoveredCard === feature.key ? feature.color : '#334155',
                    transform: hoveredCard === feature.key ? 'translateY(-2px)' : 'none',
                    boxShadow: hoveredCard === feature.key ? `0 8px 24px ${feature.color}22` : 'none',
                  }}
                  onClick={() => navigate(`/${feature.key}`)}
                  onMouseEnter={() => setHoveredCard(feature.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={styles.cardAccent(feature.color)} />
                  <div style={styles.cardTop}>
                    <span style={styles.cardIcon}>{feature.icon}</span>
                    <span style={styles.cardLabel}>{feature.label}</span>
                  </div>
                  <div style={styles.cardDescription}>
                    {descriptions[feature.key] || 'Manage and configure records'}
                  </div>
                  {feature.ai && (
                    <span style={styles.cardAiBadge}>AI POWERED</span>
                  )}
                  <span style={{
                    ...styles.cardArrow(feature.color),
                    color: hoveredCard === feature.key ? feature.color : `${feature.color}66`,
                  }}>
                    {'\u2192'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
