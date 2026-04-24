const createCrudRouter = require('./crudFactory');

const columns = [
  'resource_name',
  'skill_name',
  'skill_level',
  'effective_start',
  'effective_end',
  'status'
];

module.exports = createCrudRouter('service_resource_skills', columns);
