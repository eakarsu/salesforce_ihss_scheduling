import React, { useState, useEffect } from 'react';
import api from '../api';

const ACCENT = '#10b981';
const ACCENT_DIM = '#10b98133';
const ACCENT_BG = '#10b98111';

const styles = {
  page: {
    padding: '32px 32px',
    maxWidth: 1000,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  headerIcon: { fontSize: 40, marginBottom: 8, display: 'block' },
  headerTitle: { fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#64748b', fontWeight: 500 },

  // Step indicator
  steps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 36,
  },
  stepCircle: (active, completed) => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    background: completed ? ACCENT : active ? ACCENT_BG : '#1e293b',
    color: completed ? '#fff' : active ? ACCENT : '#475569',
    border: `2px solid ${completed || active ? ACCENT : '#334155'}`,
    transition: 'all 0.3s',
    flexShrink: 0,
  }),
  stepLine: (completed) => ({
    width: 48,
    height: 2,
    background: completed ? ACCENT : '#334155',
    transition: 'all 0.3s',
  }),
  stepLabel: (active) => ({
    fontSize: 10,
    fontWeight: 600,
    color: active ? ACCENT : '#475569',
    marginTop: 6,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  }),

  // Card container
  card: {
    background: '#1e293b',
    borderRadius: 14,
    border: `1px solid #334155`,
    padding: '28px 32px',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 16,
  },

  // Form elements
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
  },
  dateInput: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
  },
  textInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box',
  },

  // Detail row
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px 24px',
    marginTop: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 4,
  },

  // Resource card
  resourceCard: (selected) => ({
    background: selected ? ACCENT_BG : '#0f172a',
    borderRadius: 12,
    border: `1px solid ${selected ? ACCENT : '#334155'}`,
    padding: '18px 20px',
    marginBottom: 12,
    transition: 'all 0.2s',
  }),
  resourceName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 2,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
    marginBottom: 12,
  },
  slotsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: (selected) => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${selected ? ACCENT : '#334155'}`,
    background: selected ? ACCENT : '#1e293b',
    color: selected ? '#fff' : '#94a3b8',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),

  // Priority badge
  badge: (color) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
  }),

  // Buttons
  btnPrimary: {
    padding: '12px 32px',
    borderRadius: 10,
    border: 'none',
    background: ACCENT,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '12px 24px',
    borderRadius: 10,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },

  // Loading / Error
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#64748b',
    fontSize: 14,
    fontWeight: 500,
  },
  error: {
    padding: '12px 16px',
    borderRadius: 8,
    background: '#ef444422',
    border: '1px solid #ef444444',
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },

  // Success
  successBox: {
    textAlign: 'center',
    padding: '48px 32px',
  },
  successIcon: { fontSize: 56, marginBottom: 16, display: 'block' },
  successTitle: { fontSize: 24, fontWeight: 800, color: ACCENT, marginBottom: 8 },
  successApptNum: {
    fontSize: 32,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 24,
    letterSpacing: 1,
  },
  summaryBox: {
    background: '#0f172a',
    borderRadius: 12,
    border: '1px solid #334155',
    padding: '20px 28px',
    textAlign: 'left',
    maxWidth: 480,
    margin: '0 auto 28px',
  },

  // Confirm summary
  confirmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #1e293b',
  },
  confirmIcon: { fontSize: 20, flexShrink: 0 },
  confirmLabel: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  confirmValue: { fontSize: 15, color: '#e2e8f0', fontWeight: 600 },
};

const REGION_DISTRICT_MARKET = {
  Southeast: {
    'Carolinas': ['Charlotte Metro', 'Raleigh-Durham', 'Greensboro', 'Wilmington'],
    'Georgia/Alabama': ['Atlanta Metro', 'Savannah', 'Birmingham', 'Augusta'],
    'Florida': ['Miami-Dade', 'Tampa Bay', 'Orlando', 'Jacksonville'],
  },
  Northeast: {
    'Tri-State': ['Manhattan', 'Brooklyn', 'North Jersey', 'Long Island'],
    'New England': ['Boston Metro', 'Hartford', 'Providence', 'Portland ME'],
    'Mid-Atlantic': ['Philadelphia Metro', 'DC Metro', 'Baltimore', 'Pittsburgh'],
  },
  Midwest: {
    'Great Lakes': ['Chicago Metro', 'Detroit Metro', 'Cleveland', 'Milwaukee'],
    'Plains': ['Minneapolis', 'Kansas City', 'Omaha', 'Indianapolis'],
  },
  Southwest: {
    'Texas': ['Dallas-Fort Worth', 'Houston Metro', 'San Antonio', 'Austin'],
    'Desert': ['Phoenix Metro', 'Tucson', 'Las Vegas', 'Albuquerque'],
  },
  'West Coast': {
    'Southern California': ['LA Metro', 'Orange County', 'San Diego', 'Inland Empire'],
    'Northern California': ['SF Bay Area', 'Sacramento', 'San Jose'],
    'Pacific Northwest': ['Seattle Metro', 'Portland Metro', 'Tacoma'],
  },
};

const STEP_LABELS = ['Work Order', 'Date', 'Resource', 'Confirm', 'Booked'];

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#64748b',
};

export default function SchedulingPage() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWO, setSelectedWO] = useState(null);
  const [loadingWO, setLoadingWO] = useState(true);

  // Lead/customer data (editable)
  const [leadData, setLeadData] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    budget: '',
    account_name: '',
    region: '',
    market: '',
    district: '',
  });

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState('');

  // Step 3 state
  const [slotsData, setSlotsData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Step 5 state
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [error, setError] = useState('');

  // Fetch work orders on mount
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  async function fetchWorkOrders() {
    setLoadingWO(true);
    try {
      const res = await api.get('/api/scheduling/work-orders');
      setWorkOrders(res.data);
    } catch (err) {
      setError('Failed to load work orders');
    } finally {
      setLoadingWO(false);
    }
  }

  async function fetchSlots() {
    if (!selectedWO || !selectedDate) return;
    setLoadingSlots(true);
    setError('');
    setSlotsData(null);
    setSelectedResource(null);
    setSelectedSlot(null);
    try {
      const res = await api.post('/api/scheduling/available-slots', {
        work_order_number: selectedWO.work_order_number,
        date: selectedDate,
      });
      setSlotsData(res.data);
      if (res.data.resources.length === 0) {
        setError('No available resources found for this date. Try a different date.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find available slots');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBook() {
    if (!selectedWO || !selectedResource || !selectedSlot) return;
    setBookingLoading(true);
    setError('');
    try {
      const res = await api.post('/api/scheduling/book', {
        work_order_number: selectedWO.work_order_number,
        resource_name: selectedResource.resource_name,
        scheduled_start: selectedSlot.start_datetime,
        scheduled_end: selectedSlot.end_datetime,
        lead_data: leadData,
      });
      setBooking(res.data);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setSelectedWO(null);
    setSelectedDate('');
    setSlotsData(null);
    setSelectedResource(null);
    setSelectedSlot(null);
    setBooking(null);
    setLeadData({ contact_name: '', contact_phone: '', contact_email: '', budget: '', account_name: '', region: '', market: '', district: '' });
    setError('');
    fetchWorkOrders();
  }

  // ─── Step indicator ────────────────────────────────────────────────────────
  function renderSteps() {
    return (
      <div>
        <div style={styles.steps}>
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const active = step === stepNum;
            const completed = step > stepNum;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div style={styles.stepLine(step > stepNum)} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={styles.stepCircle(active, completed)}>
                    {completed ? '\u2713' : stepNum}
                  </div>
                  <div style={styles.stepLabel(active || completed)}>{label}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Step 1: Select Work Order ─────────────────────────────────────────────
  function renderStep1() {
    if (loadingWO) return <div style={styles.loading}>Loading work orders...</div>;

    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Work Order</div>
        <select
          style={styles.select}
          value={selectedWO ? selectedWO.work_order_number : ''}
          onChange={(e) => {
            const wo = workOrders.find(w => w.work_order_number === e.target.value);
            setSelectedWO(wo || null);
            if (wo) {
              setLeadData({
                contact_name: wo.contact_name || '',
                contact_phone: wo.contact_phone || '',
                contact_email: wo.contact_email || '',
                budget: wo.budget || '',
                account_name: wo.account_name || '',
                region: wo.region || '',
                market: wo.market || '',
                district: wo.district || '',
              });
            }
          }}
        >
          <option value="">-- Choose a work order --</option>
          {workOrders.map(wo => (
            <option key={wo.id} value={wo.work_order_number}>
              {wo.work_order_number} - {wo.subject} ({wo.priority})
            </option>
          ))}
        </select>

        {selectedWO && (
          <>
            {/* Editable Client/Lead Info Section */}
            <div style={{
              background: '#0f172a',
              borderRadius: 10,
              border: `1px solid ${ACCENT}33`,
              padding: '16px 20px',
              marginTop: 16,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                Client / Lead Information
              </div>
              <div style={styles.detailGrid}>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Contact Name</label>
                  <input
                    style={styles.textInput}
                    value={leadData.contact_name}
                    onChange={(e) => setLeadData({ ...leadData, contact_name: e.target.value })}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Account / Company</label>
                  <input
                    style={styles.textInput}
                    value={leadData.account_name}
                    onChange={(e) => setLeadData({ ...leadData, account_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Phone</label>
                  <input
                    style={styles.textInput}
                    value={leadData.contact_phone}
                    onChange={(e) => setLeadData({ ...leadData, contact_phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Email</label>
                  <input
                    style={styles.textInput}
                    value={leadData.contact_email}
                    onChange={(e) => setLeadData({ ...leadData, contact_email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Budget ($)</label>
                  <input
                    style={styles.textInput}
                    value={leadData.budget}
                    onChange={(e) => setLeadData({ ...leadData, budget: e.target.value })}
                    placeholder="Enter budget"
                    type="number"
                  />
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Region</label>
                  <select
                    style={styles.textInput}
                    value={leadData.region}
                    onChange={(e) => setLeadData({ ...leadData, region: e.target.value, district: '', market: '' })}
                  >
                    <option value="">-- Select Region --</option>
                    {Object.keys(REGION_DISTRICT_MARKET).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>District</label>
                  <select
                    style={styles.textInput}
                    value={leadData.district}
                    onChange={(e) => setLeadData({ ...leadData, district: e.target.value, market: '' })}
                    disabled={!leadData.region}
                  >
                    <option value="">-- Select District --</option>
                    {leadData.region && REGION_DISTRICT_MARKET[leadData.region] &&
                      Object.keys(REGION_DISTRICT_MARKET[leadData.region]).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 4 }}>Market</label>
                  <select
                    style={styles.textInput}
                    value={leadData.market}
                    onChange={(e) => setLeadData({ ...leadData, market: e.target.value })}
                    disabled={!leadData.district}
                  >
                    <option value="">-- Select Market --</option>
                    {leadData.region && leadData.district &&
                      REGION_DISTRICT_MARKET[leadData.region]?.[leadData.district]?.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <div style={styles.detailLabel}>Location</div>
                  <div style={{ ...styles.detailValue, marginTop: 8 }}>{selectedWO.address}, {selectedWO.city}, {selectedWO.state}</div>
                </div>
              </div>
            </div>

            {/* Work Order Details Section */}
            <div style={styles.detailGrid}>
              <div>
                <div style={styles.detailLabel}>Work Order</div>
                <div style={styles.detailValue}>{selectedWO.work_order_number}</div>
              </div>
              <div>
                <div style={styles.detailLabel}>Priority</div>
                <div><span style={styles.badge(PRIORITY_COLORS[selectedWO.priority] || '#64748b')}>{selectedWO.priority}</span></div>
              </div>
              <div>
                <div style={styles.detailLabel}>Subject</div>
                <div style={styles.detailValue}>{selectedWO.subject}</div>
              </div>
              <div>
                <div style={styles.detailLabel}>Work Type</div>
                <div style={styles.detailValue}>{selectedWO.work_type_name}</div>
              </div>
              <div>
                <div style={styles.detailLabel}>Territory</div>
                <div style={styles.detailValue}>{selectedWO.territory_name}</div>
              </div>
              <div>
                <div style={styles.detailLabel}>Status</div>
                <div style={styles.detailValue}>{selectedWO.status}</div>
              </div>
            </div>
          </>
        )}

        <div style={styles.btnRow}>
          <div />
          <button
            style={{
              ...styles.btnPrimary,
              opacity: selectedWO ? 1 : 0.4,
              cursor: selectedWO ? 'pointer' : 'not-allowed',
            }}
            disabled={!selectedWO}
            onClick={() => setStep(2)}
          >
            Next: Select Date &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Select Date ───────────────────────────────────────────────────
  function renderStep2() {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Date</div>

        {/* Work type info */}
        {selectedWO && (
          <div style={{
            background: '#0f172a',
            borderRadius: 10,
            border: '1px solid #334155',
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={styles.detailLabel}>Work Type</div>
              <div style={styles.detailValue}>{selectedWO.work_type_name}</div>
            </div>
            <div>
              <div style={styles.detailLabel}>Territory</div>
              <div style={styles.detailValue}>{selectedWO.territory_name}</div>
            </div>
          </div>
        )}

        <div>
          <label style={{ ...styles.detailLabel, display: 'block', marginBottom: 8 }}>Appointment Date</label>
          <input
            type="date"
            style={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btnSecondary} onClick={() => setStep(1)}>&larr; Back</button>
          <button
            style={{
              ...styles.btnPrimary,
              opacity: selectedDate ? 1 : 0.4,
              cursor: selectedDate ? 'pointer' : 'not-allowed',
            }}
            disabled={!selectedDate}
            onClick={() => {
              fetchSlots();
              setStep(3);
            }}
          >
            Find Available Resources &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Available Resources ───────────────────────────────────────────
  function renderStep3() {
    if (loadingSlots) return <div style={styles.loading}>Searching for available resources and time slots...</div>;

    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>Available Resources & Time Slots</div>

        {slotsData && slotsData.operating_hours && (
          <div style={{
            fontSize: 12,
            color: '#64748b',
            fontWeight: 500,
            marginBottom: 16,
          }}>
            Operating hours: {slotsData.operating_hours.start} - {slotsData.operating_hours.end}
            {slotsData.work_type && (
              <span> &middot; Duration: {slotsData.work_type.estimated_duration_minutes} min</span>
            )}
            {slotsData.work_type?.skill_requirement && (
              <span> &middot; Required skill: {slotsData.work_type.skill_requirement}</span>
            )}
          </div>
        )}

        {slotsData && slotsData.resources.length === 0 && (
          <div style={{ ...styles.error, background: '#f59e0b22', borderColor: '#f59e0b44', color: '#f59e0b' }}>
            No available resources found for {selectedDate}. Try a different date.
          </div>
        )}

        {slotsData && slotsData.resources.map(resource => {
          const isSelected = selectedResource?.resource_name === resource.resource_name;
          return (
            <div key={resource.resource_name} style={styles.resourceCard(isSelected)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={styles.resourceName}>{resource.resource_name}</div>
                  <div style={styles.resourceMeta}>
                    {resource.resource_type} &middot; Rating: {resource.efficiency_rating}/5
                    {resource.existing_appointments > 0 && (
                      <span> &middot; {resource.existing_appointments} existing appt(s)</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>
                  {resource.slots.length} slot{resource.slots.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={styles.slotsGrid}>
                {resource.slots.map((slot, i) => {
                  const isSlotSelected =
                    selectedResource?.resource_name === resource.resource_name &&
                    selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={i}
                      style={styles.slotBtn(isSlotSelected)}
                      onClick={() => {
                        setSelectedResource(resource);
                        setSelectedSlot(slot);
                      }}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={styles.btnRow}>
          <button style={styles.btnSecondary} onClick={() => { setStep(2); setSelectedResource(null); setSelectedSlot(null); }}>&larr; Back</button>
          <button
            style={{
              ...styles.btnPrimary,
              opacity: selectedResource && selectedSlot ? 1 : 0.4,
              cursor: selectedResource && selectedSlot ? 'pointer' : 'not-allowed',
            }}
            disabled={!selectedResource || !selectedSlot}
            onClick={() => setStep(4)}
          >
            Review & Confirm &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 4: Confirm ──────────────────────────────────────────────────────
  function renderStep4() {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>Confirm Appointment</div>

        <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', padding: '4px 20px 16px' }}>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83D\uDCDD'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Work Order</div>
              <div style={styles.confirmValue}>{selectedWO.work_order_number} - {selectedWO.subject}</div>
            </div>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83D\uDC64'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Client Contact</div>
              <div style={styles.confirmValue}>
                {leadData.contact_name || '—'}
                {leadData.contact_phone && <span style={{ color: '#64748b', fontSize: 13 }}> &middot; {leadData.contact_phone}</span>}
              </div>
              {leadData.contact_email && (
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{leadData.contact_email}</div>
              )}
            </div>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83C\uDFE2'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Account / Location</div>
              <div style={styles.confirmValue}>{leadData.account_name || '—'} &middot; {selectedWO.city}, {selectedWO.state}</div>
              {leadData.budget && leadData.budget !== '0' && (
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Budget: ${Number(leadData.budget).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83D\uDCCD'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Region / District / Market</div>
              <div style={styles.confirmValue}>{leadData.region || '—'} &rarr; {leadData.district || '—'} &rarr; {leadData.market || '—'}</div>
            </div>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83D\uDC77'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Assigned Resource</div>
              <div style={styles.confirmValue}>{selectedResource.resource_name}</div>
            </div>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmIcon}>{'\uD83D\uDCC5'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Date & Time</div>
              <div style={styles.confirmValue}>{selectedDate} &middot; {selectedSlot.start} - {selectedSlot.end}</div>
            </div>
          </div>
          <div style={{ ...styles.confirmRow, borderBottom: 'none' }}>
            <span style={styles.confirmIcon}>{'\u23F1\uFE0F'}</span>
            <div style={{ flex: 1 }}>
              <div style={styles.confirmLabel}>Duration</div>
              <div style={styles.confirmValue}>
                {slotsData?.work_type?.estimated_duration_minutes || '—'} minutes ({selectedWO.work_type_name})
              </div>
            </div>
          </div>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btnSecondary} onClick={() => setStep(3)}>&larr; Back</button>
          <button
            style={{
              ...styles.btnPrimary,
              opacity: bookingLoading ? 0.6 : 1,
              cursor: bookingLoading ? 'wait' : 'pointer',
              padding: '12px 40px',
            }}
            disabled={bookingLoading}
            onClick={handleBook}
          >
            {bookingLoading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 5: Success ──────────────────────────────────────────────────────
  function renderStep5() {
    if (!booking) return null;
    const appt = booking.appointment;
    return (
      <div style={styles.card}>
        <div style={styles.successBox}>
          <span style={styles.successIcon}>{'\u2705'}</span>
          <div style={styles.successTitle}>Appointment Booked!</div>
          <div style={styles.successApptNum}>{appt.appointment_number}</div>

          <div style={styles.summaryBox}>
            <div style={styles.confirmRow}>
              <span style={styles.confirmIcon}>{'\uD83D\uDCDD'}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.confirmLabel}>Work Order</div>
                <div style={styles.confirmValue}>{appt.work_order_number} - {appt.subject}</div>
              </div>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmIcon}>{'\uD83D\uDC77'}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.confirmLabel}>Resource</div>
                <div style={styles.confirmValue}>{appt.resource_name}</div>
              </div>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmIcon}>{'\uD83D\uDCC5'}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.confirmLabel}>Scheduled</div>
                <div style={styles.confirmValue}>{appt.scheduled_start} - {appt.scheduled_end}</div>
              </div>
            </div>
            <div style={{ ...styles.confirmRow, borderBottom: 'none' }}>
              <span style={styles.confirmIcon}>{'\uD83D\uDCCD'}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.confirmLabel}>Location</div>
                <div style={styles.confirmValue}>{appt.address}, {appt.city}, {appt.state}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={styles.btnPrimary} onClick={resetWizard}>
              Schedule Another
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => window.location.href = '/service-appointments'}
            >
              View All Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>{'\uD83D\uDCC5'}</span>
        <div style={styles.headerTitle}>Schedule Appointment</div>
        <div style={styles.headerSub}>Installation Appointment Scheduling Wizard</div>
      </div>

      {renderSteps()}

      {error && <div style={styles.error}>{error}</div>}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}
