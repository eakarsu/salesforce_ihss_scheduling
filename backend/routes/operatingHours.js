const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'description',
  'timezone',
  'monday_start',
  'monday_end',
  'tuesday_start',
  'tuesday_end',
  'wednesday_start',
  'wednesday_end',
  'thursday_start',
  'thursday_end',
  'friday_start',
  'friday_end',
  'saturday_start',
  'saturday_end',
  'sunday_start',
  'sunday_end',
  'status'
];

module.exports = createCrudRouter('operating_hours', columns);
