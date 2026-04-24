const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'resource_type',
  'email',
  'phone',
  'description',
  'is_active',
  'territory_name',
  'home_address',
  'efficiency_rating',
  'travel_speed',
  'max_travel_distance',
  'status'
];

module.exports = createCrudRouter('service_resources', columns);
