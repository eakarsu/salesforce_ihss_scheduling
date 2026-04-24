const createCrudRouter = require('./crudFactory');
const { aiQuery } = require('../openrouter');
const auth = require('../middleware/auth');

const columns = [
  'name',
  'description',
  'policy_type',
  'travel_time_optimization',
  'skill_matching',
  'priority_weight',
  'territory_preference',
  'max_travel_distance',
  'same_day_policy',
  'emergency_override',
  'status'
];

const router = createCrudRouter('scheduling_policies', columns);

router.post('/ai-capacity', auth, async (req, res) => {
  try {
    const { territory_name, time_period, work_order_volume, resource_count } = req.body;

    const systemPrompt = `You are an expert Lowe's Home Improvement installation services capacity planning advisor.
You specialize in store territory capacity analysis, installer demand forecasting, and workforce optimization for residential installations.
Analyze the provided store territory data, time periods, installation work order volumes, and installer counts to provide
comprehensive capacity planning recommendations. Consider factors like seasonal demand patterns (spring/summer peaks for roofing, decks, fencing),
installer utilization rates, skill distribution (appliance, flooring, kitchen/bath, etc.), travel time overhead, break and absence allowances, and growth
projections. Provide actionable insights on whether the territory is over or under-resourced, recommended
staffing levels, workload distribution strategies, and contingency plans for demand spikes.`;

    const userPrompt = `Analyze capacity for the following scenario:
Territory: ${territory_name || 'Not specified'}
Time Period: ${time_period || 'Not specified'}
Work Order Volume: ${work_order_volume || 'Not specified'}
Resource Count: ${resource_count || 'Not specified'}

Please provide a detailed capacity analysis with staffing recommendations and optimization strategies.`;

    const aiResult = await aiQuery(systemPrompt, userPrompt);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
