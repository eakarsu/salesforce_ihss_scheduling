const createCrudRouter = require('./crudFactory');

const columns = [
  'resource_name',
  'type',
  'start_time',
  'end_time',
  'description',
  'approved_by',
  'status'
];

module.exports = createCrudRouter('resource_absences', columns);
