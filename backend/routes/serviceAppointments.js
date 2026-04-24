const createCrudRouter = require('./crudFactory');
const { aiQuery } = require('../openrouter');
const auth = require('../middleware/auth');

const columns = [
  'appointment_number',
  'work_order_number',
  'subject',
  'status',
  'scheduled_start',
  'scheduled_end',
  'actual_start',
  'actual_end',
  'duration_minutes',
  'resource_name',
  'territory_name',
  'address',
  'city',
  'state'
];

const router = createCrudRouter('service_appointments', columns);

router.post('/ai-optimize', auth, async (req, res) => {
  try {
    const { territory_name, date_range, constraints, optimization_goal } = req.body;

    const systemPrompt = `You are an expert Lowe's Home Improvement installation services scheduling optimization advisor.
You specialize in optimizing residential installation appointment scheduling to maximize installer utilization, minimize travel time,
and ensure customer satisfaction. Analyze the provided territory, date range, constraints, and optimization goals to
recommend the best scheduling strategy for home improvement installations. Provide actionable recommendations including appointment sequencing,
installer assignments, time slot optimization, and travel route efficiency. Consider factors like installer skill matching (appliance, flooring, kitchen/bath, roofing, etc.),
store territory boundaries, operating hours, installer availability, and installation project priorities.`;

    const userPrompt = `Optimize scheduling for the following scenario:
Territory: ${territory_name || 'Not specified'}
Date Range: ${date_range || 'Not specified'}
Constraints: ${constraints || 'None specified'}
Optimization Goal: ${optimization_goal || 'Maximize efficiency'}

Please provide a detailed optimization plan with specific scheduling recommendations.`;

    const aiResult = await aiQuery(systemPrompt, userPrompt);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
