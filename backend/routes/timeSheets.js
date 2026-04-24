const createCrudRouter = require('./crudFactory');

const columns = [
  'resource_name',
  'start_date',
  'end_date',
  'total_hours',
  'status',
  'approved_by',
  'notes'
];

module.exports = createCrudRouter('time_sheets', columns);
