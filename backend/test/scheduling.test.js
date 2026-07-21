const test = require('node:test');
const assert = require('node:assert/strict');
const { subtractIntervals, timeToMinutes, validateBookingWindow } = require('../lib/scheduling');

test('subtractIntervals merges overlaps and returns free operating windows', () => {
  assert.deepEqual(
    subtractIntervals(480, 1020, [{ start: 500, end: 600 }, { start: 580, end: 660 }, { start: 900, end: 930 }]),
    [{ start: 480, end: 500 }, { start: 660, end: 900 }, { start: 930, end: 1020 }]
  );
});

test('timeToMinutes rejects malformed time values', () => {
  assert.equal(timeToMinutes('07:30'), 450);
  assert.equal(timeToMinutes('25:00'), null);
  assert.equal(timeToMinutes('07:30:59'), null);
});

test('validateBookingWindow rejects reverse and excessive windows', () => {
  assert.equal(validateBookingWindow('2026-08-01T11:00:00Z', '2026-08-01T10:00:00Z').valid, false);
  assert.equal(validateBookingWindow('bad', 'also bad').valid, false);
  assert.equal(validateBookingWindow('2026-08-01T10:00:00Z', '2026-08-01T11:30:00Z').durationMinutes, 90);
  assert.equal(validateBookingWindow('2026-08-01T10:00:30Z', '2026-08-01T11:00:00Z').valid, false);
});

test('subtractIntervals clips malformed out-of-window intervals', () => {
  assert.deepEqual(subtractIntervals(480, 600, [{ start: 0, end: 500 }, { start: 590, end: 900 }]), [{ start: 500, end: 590 }]);
});
