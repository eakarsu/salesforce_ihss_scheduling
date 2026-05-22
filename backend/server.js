const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Lowe's Installation Services routes
app.use('/api/service-territories', require('./routes/serviceTerritories'));
app.use('/api/operating-hours', require('./routes/operatingHours'));
app.use('/api/service-resources', require('./routes/serviceResources'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/service-resource-skills', require('./routes/serviceResourceSkills'));
app.use('/api/territory-members', require('./routes/territoryMembers'));
app.use('/api/work-types', require('./routes/workTypes'));
app.use('/api/work-orders', require('./routes/workOrders'));
app.use('/api/work-order-line-items', require('./routes/workOrderLineItems'));
app.use('/api/service-appointments', require('./routes/serviceAppointments'));
app.use('/api/resource-absences', require('./routes/resourceAbsences'));
app.use('/api/time-sheets', require('./routes/timeSheets'));
app.use('/api/time-sheet-entries', require('./routes/timeSheetEntries'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/service-crews', require('./routes/serviceCrews'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/maintenance-plans', require('./routes/maintenancePlans'));
app.use('/api/scheduling-policies', require('./routes/schedulingPolicies'));
app.use('/api/scheduling', require('./routes/scheduling'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-extras', require('./routes/ai-extras'));
app.use('/api/evv-visit-verification', require('./routes/evvVisitVerification'));

const PORT = process.env.BACKEND_PORT || 4003;
app.use('/api', require('./routes/gap-features')); // === Batch 11 Gaps & Frontend Mounts ===

// Custom Views (4 endpoints) — mounted BEFORE 404 fallback
app.use('/api/custom-views', require('./routes/customViews'));

// Health check (also used by deploy probes)
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// 404 fallback (must be last)
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.path }));

app.listen(PORT, () => console.log(`Lowe's Install Services Backend running on port ${PORT}`));
