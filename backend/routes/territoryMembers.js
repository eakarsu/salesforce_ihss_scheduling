const createCrudRouter = require('./crudFactory');

const columns = [
  'resource_name',
  'territory_name',
  'membership_type',
  'effective_start',
  'effective_end',
  'status'
];

module.exports = createCrudRouter('territory_members', columns);
