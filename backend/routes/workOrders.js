const createCrudRouter = require('./crudFactory');

const columns = [
  'work_order_number',
  'subject',
  'description',
  'account_name',
  'contact_name',
  'contact_phone',
  'contact_email',
  'budget',
  'region',
  'district',
  'market',
  'territory_name',
  'work_type_name',
  'priority',
  'status',
  'start_date',
  'end_date',
  'address',
  'city',
  'state',
  'latitude',
  'longitude'
];

module.exports = createCrudRouter('work_orders', columns);
