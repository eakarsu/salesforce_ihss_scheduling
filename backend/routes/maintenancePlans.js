const createCrudRouter = require('./crudFactory');

const columns = [
  'title',
  'description',
  'work_type_name',
  'account_name',
  'asset_name',
  'frequency',
  'next_suggested_date',
  'territory_name',
  'status',
  'notes'
];

module.exports = createCrudRouter('maintenance_plans', columns);
