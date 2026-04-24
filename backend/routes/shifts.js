const createCrudRouter = require('./crudFactory');
const { aiQuery } = require('../openrouter');
const auth = require('../middleware/auth');

const columns = [
  'territory_name',
  'label',
  'start_time',
  'end_time',
  'time_slot_type',
  'resource_name',
  'status',
  'notes'
];

const router = createCrudRouter('shifts', columns);

router.post('/ai-dispatch', auth, async (req, res) => {
  try {
    const { territory_name, work_orders_pending, available_resources, optimization_priority } = req.body;

    const systemPrompt = `You are an intelligent Lowe's Home Improvement installation services dispatch advisor.
You specialize in real-time dispatch decisions for residential installation operations. Analyze pending installation work orders,
available installers, store territory constraints, and optimization priorities to recommend the best dispatch strategy.
Consider factors like installer skills (appliance, flooring, kitchen/bath, roofing, etc.), current locations, travel time, installation urgency, customer deadlines,
shift schedules, and workload balancing. Provide specific installer-to-work-order assignments with reasoning
for each recommendation, estimated completion times, and contingency plans.`;

    const userPrompt = `Create a dispatch plan for the following scenario:
Territory: ${territory_name || 'Not specified'}
Pending Work Orders: ${work_orders_pending || 'Not specified'}
Available Resources: ${available_resources || 'Not specified'}
Optimization Priority: ${optimization_priority || 'Balanced efficiency'}

Please provide specific dispatch assignments and a prioritized action plan.`;

    const aiResult = await aiQuery(systemPrompt, userPrompt);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
