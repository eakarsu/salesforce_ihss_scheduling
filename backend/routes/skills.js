const createCrudRouter = require('./crudFactory');

const columns = [
  'name',
  'skill_type',
  'description',
  'is_active',
  'status'
];

module.exports = createCrudRouter('skills', columns);
