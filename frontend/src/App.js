// === Batch 11 Gaps & Frontend Mounts ===
import GapClientNoshowPredictionPage from './pages/gap/GapClientNoshowPredictionPage'
import GapWorkforceAttritionPage from './pages/gap/GapWorkforceAttritionPage'
import GapIncidentSummarizerPage from './pages/gap/GapIncidentSummarizerPage'
import GapMobileRnClientPage from './pages/gap/GapMobileRnClientPage'
import GapClientPortalPage from './pages/gap/GapClientPortalPage'
import GapPayrollConnectorPage from './pages/gap/GapPayrollConnectorPage'
import GapComplianceTrackerPage from './pages/gap/GapComplianceTrackerPage'
import GapRateAnalyticsPage from './pages/gap/GapRateAnalyticsPage'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import SchedulingPage from './pages/SchedulingPage';
import AIAdvisors from './pages/AIAdvisors';
import CustomViewsPage from './pages/CustomViewsPage';
import Sidebar from './components/Sidebar';

const features = [
  {
    key: 'service-territories',
    label: 'Service Territories',
    icon: '\u{1F5FA}\uFE0F',
    color: '#3b82f6',
    api: '/api/service-territories',
    columns: ['name','type','parent_territory','operating_hours_name','description','city','state','country','latitude','longitude','is_active','status'],
    tableColumns: ['name','type','city','state','is_active','status'],
  },
  {
    key: 'operating-hours',
    label: 'Operating Hours',
    icon: '\u{1F550}',
    color: '#8b5cf6',
    api: '/api/operating-hours',
    columns: ['name','description','timezone','monday_start','monday_end','tuesday_start','tuesday_end','wednesday_start','wednesday_end','thursday_start','thursday_end','friday_start','friday_end','saturday_start','saturday_end','sunday_start','sunday_end','status'],
    tableColumns: ['name','timezone','monday_start','monday_end','friday_end','status'],
  },
  {
    key: 'service-resources',
    label: 'Service Resources',
    icon: '\u{1F477}',
    color: '#10b981',
    api: '/api/service-resources',
    columns: ['name','resource_type','email','phone','description','is_active','territory_name','home_address','efficiency_rating','travel_speed','max_travel_distance','status'],
    tableColumns: ['name','resource_type','email','territory_name','efficiency_rating','status'],
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: '\u{1F3AF}',
    color: '#f59e0b',
    api: '/api/skills',
    columns: ['name','skill_type','description','is_active','status'],
    tableColumns: ['name','skill_type','is_active','status'],
  },
  {
    key: 'service-resource-skills',
    label: 'Resource Skills',
    icon: '\u{1F527}',
    color: '#ef4444',
    api: '/api/service-resource-skills',
    columns: ['resource_name','skill_name','skill_level','effective_start','effective_end','status'],
    tableColumns: ['resource_name','skill_name','skill_level','status'],
  },
  {
    key: 'territory-members',
    label: 'Territory Members',
    icon: '\u{1F465}',
    color: '#06b6d4',
    api: '/api/territory-members',
    columns: ['resource_name','territory_name','membership_type','effective_start','effective_end','status'],
    tableColumns: ['resource_name','territory_name','membership_type','status'],
  },
  {
    key: 'work-types',
    label: 'Work Types',
    icon: '\u{1F4CB}',
    color: '#ec4899',
    api: '/api/work-types',
    columns: ['name','description','estimated_duration_minutes','duration_type','skill_requirement','block_time_before','block_time_after','auto_create_appointment','status'],
    tableColumns: ['name','estimated_duration_minutes','duration_type','skill_requirement','status'],
  },
  {
    key: 'work-orders',
    label: 'Work Orders',
    icon: '\u{1F4DD}',
    color: '#f97316',
    api: '/api/work-orders',
    columns: ['work_order_number','subject','description','account_name','contact_name','contact_phone','contact_email','budget','region','district','market','territory_name','work_type_name','priority','status','start_date','end_date','address','city','state','latitude','longitude'],
    tableColumns: ['work_order_number','subject','region','district','market','contact_name','priority','status'],
  },
  {
    key: 'work-order-line-items',
    label: 'WO Line Items',
    icon: '\u{1F4C4}',
    color: '#84cc16',
    api: '/api/work-order-line-items',
    columns: ['work_order_number','line_item_number','description','work_type_name','status','start_date','end_date','duration_minutes','asset_name','notes'],
    tableColumns: ['work_order_number','line_item_number','work_type_name','status','duration_minutes'],
  },
  {
    key: 'service-appointments',
    label: 'Service Appointments',
    icon: '\u{1F4C5}',
    color: '#6366f1',
    api: '/api/service-appointments',
    columns: ['appointment_number','work_order_number','subject','status','scheduled_start','scheduled_end','actual_start','actual_end','duration_minutes','resource_name','territory_name','address','city','state'],
    tableColumns: ['appointment_number','subject','resource_name','scheduled_start','status'],
    ai: {
      endpoint: '/api/service-appointments/ai-optimize',
      fields: [
        { name: 'territory_name', label: 'Territory', options: ['West Region','East Region','Central Region','South Region','Northwest Territory','Southwest Territory','Northeast Territory','Southeast Territory','Midwest Territory','Mountain Territory','Pacific Territory','Gulf Coast Territory','Great Lakes Territory','Mid-Atlantic Territory'] },
        { name: 'date_range', label: 'Date Range', options: ['Today','Tomorrow','This Week','Next Week','This Month','Next Month','Next 2 Weeks','Next 30 Days'] },
        { name: 'constraints', label: 'Constraints', options: ['Minimize Travel Time','Skill Match Required','Same Resource Preferred','Shortest Wait Time','Earliest Available','Within Budget','Emergency Priority','No Overtime'] },
        { name: 'optimization_goal', label: 'Optimization Goal', options: ['Maximize Utilization','Minimize Cost','Fastest Completion','Best Skill Match','Balanced Workload','Customer Satisfaction','Reduce Travel Distance','Priority First'] },
      ],
      title: 'AI Schedule Optimizer',
    },
  },
  {
    key: 'resource-absences',
    label: 'Resource Absences',
    icon: '\u{1F6AB}',
    color: '#ef4444',
    api: '/api/resource-absences',
    columns: ['resource_name','type','start_time','end_time','description','approved_by','status'],
    tableColumns: ['resource_name','type','start_time','end_time','status'],
  },
  {
    key: 'time-sheets',
    label: 'Time Sheets',
    icon: '\u{23F1}\uFE0F',
    color: '#14b8a6',
    api: '/api/time-sheets',
    columns: ['resource_name','start_date','end_date','total_hours','status','approved_by','notes'],
    tableColumns: ['resource_name','start_date','end_date','total_hours','status'],
  },
  {
    key: 'time-sheet-entries',
    label: 'Time Sheet Entries',
    icon: '\u{1F4CA}',
    color: '#a855f7',
    api: '/api/time-sheet-entries',
    columns: ['time_sheet_id','resource_name','work_order_number','type','start_time','end_time','duration_hours','description','status'],
    tableColumns: ['resource_name','work_order_number','type','duration_hours','status'],
  },
  {
    key: 'shifts',
    label: 'Shifts',
    icon: '\u{1F504}',
    color: '#0ea5e9',
    api: '/api/shifts',
    columns: ['territory_name','label','start_time','end_time','time_slot_type','resource_name','status','notes'],
    tableColumns: ['label','territory_name','resource_name','time_slot_type','status'],
    ai: {
      endpoint: '/api/shifts/ai-dispatch',
      fields: [
        { name: 'territory_name', label: 'Territory', options: ['West Region','East Region','Central Region','South Region','Northwest Territory','Southwest Territory','Northeast Territory','Southeast Territory','Midwest Territory','Mountain Territory','Pacific Territory','Gulf Coast Territory','Great Lakes Territory','Mid-Atlantic Territory'] },
        { name: 'work_orders_pending', label: 'Pending Work Orders', options: ['1-3 Orders','4-6 Orders','7-10 Orders','11-15 Orders','15+ Orders','Emergency Only','Mixed Priority'] },
        { name: 'available_resources', label: 'Available Resources', options: ['1 Technician','2-3 Technicians','4-5 Technicians','6+ Technicians','Full Crew','Partial Crew','Contractors Available'] },
        { name: 'optimization_priority', label: 'Optimization Priority', options: ['Speed - Fastest Dispatch','Cost - Minimize Expense','Skill Match - Best Fit','Distance - Nearest Resource','Priority - Critical First','Balanced - All Factors','Customer SLA - Meet Deadlines'] },
      ],
      title: 'AI Dispatch Advisor',
    },
  },
  {
    key: 'service-crews',
    label: 'Service Crews',
    icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}',
    color: '#d946ef',
    api: '/api/service-crews',
    columns: ['name','description','crew_size','lead_name','territory_name','specialization','status'],
    tableColumns: ['name','crew_size','lead_name','territory_name','specialization','status'],
  },
  {
    key: 'assets',
    label: 'Assets',
    icon: '\u{1F3D7}\uFE0F',
    color: '#78716c',
    api: '/api/assets',
    columns: ['name','serial_number','account_name','product_name','install_date','warranty_end','status','territory_name','address','last_service_date'],
    tableColumns: ['name','serial_number','product_name','territory_name','status'],
  },
  {
    key: 'maintenance-plans',
    label: 'Maintenance Plans',
    icon: '\u{1F6E0}\uFE0F',
    color: '#ea580c',
    api: '/api/maintenance-plans',
    columns: ['title','description','work_type_name','account_name','asset_name','frequency','next_suggested_date','territory_name','status','notes'],
    tableColumns: ['title','work_type_name','frequency','next_suggested_date','status'],
  },
  {
    key: 'scheduling-policies',
    label: 'Scheduling Policies',
    icon: '\u{2699}\uFE0F',
    color: '#64748b',
    api: '/api/scheduling-policies',
    columns: ['name','description','policy_type','travel_time_optimization','skill_matching','priority_weight','territory_preference','max_travel_distance','same_day_policy','emergency_override','status'],
    tableColumns: ['name','policy_type','travel_time_optimization','skill_matching','status'],
    ai: {
      endpoint: '/api/scheduling-policies/ai-capacity',
      fields: [
        { name: 'territory_name', label: 'Territory Name', options: ['West Region','East Region','Central Region','South Region','Northwest Territory','Southeast Territory','Midwest Territory','Northeast Territory','Southwest Territory','Pacific Territory','Mountain Territory','Gulf Coast Territory','Great Lakes Territory','Mid-Atlantic Territory','Plains Territory'] },
        { name: 'time_period', label: 'Time Period', options: ['This Week','Next Week','This Month','Next Month','This Quarter','Next Quarter','Next 6 Months','This Year'] },
        { name: 'work_order_volume', label: 'Work Order Volume', options: ['Low (1-10 per week)','Medium (11-25 per week)','High (26-50 per week)','Very High (50+ per week)','Seasonal Peak','Emergency Surge'] },
        { name: 'resource_count', label: 'Resource Count', options: ['1-3 Technicians','4-6 Technicians','7-10 Technicians','11-15 Technicians','16-20 Technicians','20+ Technicians'] },
      ],
      title: 'AI Capacity Planner',
    },
  },
];

function FeatureRoute() {
  const { feature } = useParams();
  const f = features.find((ft) => ft.key === feature);
  if (!f) return <div style={{ padding: 40, color: '#ef4444', fontSize: 18, fontWeight: 600 }}>Feature not found</div>;
  return <FeaturePage key={f.key} feature={f} />;
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar features={features} onLogout={handleLogout} />
      <main style={{ flex: 1, overflowY: 'auto', height: '100vh' }}>
        <Routes>
          <Route path="/" element={<Dashboard features={features} />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/ai-advisors" element={<AIAdvisors />} />
          <Route path="/custom-views" element={<CustomViewsPage />} />
          {/* === Batch 11 Gaps & Frontend Mounts === */}
          <Route path="/gap/client-noshow-prediction" element={<GapClientNoshowPredictionPage />} />
          <Route path="/gap/workforce-attrition" element={<GapWorkforceAttritionPage />} />
          <Route path="/gap/incident-summarizer" element={<GapIncidentSummarizerPage />} />
          <Route path="/gap/mobile-rn-client" element={<GapMobileRnClientPage />} />
          <Route path="/gap/client-portal" element={<GapClientPortalPage />} />
          <Route path="/gap/payroll-connector" element={<GapPayrollConnectorPage />} />
          <Route path="/gap/compliance-tracker" element={<GapComplianceTrackerPage />} />
          <Route path="/gap/rate-analytics" element={<GapRateAnalyticsPage />} />
          <Route path="/:feature" element={<FeatureRoute />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
