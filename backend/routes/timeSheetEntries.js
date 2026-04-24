const createCrudRouter = require('./crudFactory');

const columns = [
  'time_sheet_id',
  'resource_name',
  'work_order_number',
  'type',
  'start_time',
  'end_time',
  'duration_hours',
  'description',
  'status'
];

module.exports = createCrudRouter('time_sheet_entries', columns);
