const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'serial_number',
  'account_name',
  'product_name',
  'install_date',
  'warranty_end',
  'status',
  'territory_name',
  'address',
  'last_service_date'
];

module.exports = createCrudRouter('assets', columns);
