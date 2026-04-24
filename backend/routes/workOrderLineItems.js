const createCrudRouter = require('./crudFactory');

const columns = [
  'work_order_number',
  'line_item_number',
  'description',
  'work_type_name',
  'status',
  'start_date',
  'end_date',
  'duration_minutes',
  'asset_name',
  'notes'
];

module.exports = createCrudRouter('work_order_line_items', columns);
