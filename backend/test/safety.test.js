const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('normal startup never installs, seeds, migrates forward, creates databases, or kills processes', () => {
  const launcher = read('start.sh');
  assert.doesNotMatch(launcher, /npm (install|ci)|seed\.js|createdb|CREATE DATABASE|kill -9|pkill|npm run migrate\b/);
  assert.match(launcher, /migrate\.js --check/);
  assert.match(read('backend/config.js'), /127\.0\.0\.1/);
  assert.doesNotMatch(read('backend/seed.js'), /DROP TABLE|TRUNCATE|DELETE FROM|CREATE TABLE/i);
});

test('only the bounded scheduling and audit workflow is executable', () => {
  const server = read('backend/server.js');
  assert.match(server, /routes\/scheduling/);
  assert.match(server, /routes\/auditLogs/);
  assert.doesNotMatch(server, /routes\/(ai|crudFactory|shifts|serviceAppointments|gap|evv)/);
  const app = read('frontend/src/App.js');
  assert.match(app, /SchedulingPage/);
  assert.doesNotMatch(app, /AIAdvisors|FeaturePage|Dashboard|Gap|EVV|FHIR|IHSS/);
});

test('regulated-domain boundary, ignored secrets, and immutable audit controls are explicit', () => {
  assert.match(read('SECURITY.md'), /does not claim healthcare.*FHIR.*IHSS.*regulated clinical-data compliance/is);
  assert.match(read('.gitignore'), /^\.env$/m);
  assert.match(read('backend/db/migrations/001_bounded_scheduling.sql'), /scheduling_audit_immutable/);
  assert.doesNotMatch(read('backend/config.js'), /password123|fallback.*secret|your_openrouter/i);
});
