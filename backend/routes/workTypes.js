const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'description',
  'estimated_duration_minutes',
  'duration_type',
  'skill_requirement',
  'block_time_before',
  'block_time_after',
  'auto_create_appointment',
  'status'
];

module.exports = createCrudRouter('work_types', columns);
