const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'type',
  'parent_territory',
  'operating_hours_name',
  'description',
  'city',
  'state',
  'country',
  'latitude',
  'longitude',
  'is_active',
  'status'
];

module.exports = createCrudRouter('service_territories', columns);
