const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'description',
  'crew_size',
  'lead_name',
  'territory_name',
  'specialization',
  'status'
];

module.exports = createCrudRouter('service_crews', columns);
