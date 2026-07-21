function timeToMinutes(timeStr) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(timeStr || ''))) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function extractTime(value) {
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  const datetimeStr = String(value || '');
  if (datetimeStr.includes('T')) return datetimeStr.split('T')[1].substring(0, 5);
  if (datetimeStr.includes(' ')) return datetimeStr.split(' ')[1].substring(0, 5);
  return datetimeStr.substring(0, 5);
}

function subtractIntervals(start, end, busyIntervals) {
  const sorted = busyIntervals
    .map((interval) => ({ start: Math.max(start, interval.start), end: Math.min(end, interval.end) }))
    .filter((interval) => interval.start < interval.end)
    .sort((a, b) => a.start - b.start);
  const merged = [];
  for (const interval of sorted) {
    if (merged.length && interval.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  const free = [];
  let current = start;
  for (const busy of merged) {
    if (busy.start > current) free.push({ start: current, end: busy.start });
    current = Math.max(current, busy.end);
  }
  if (current < end) free.push({ start: current, end });
  return free;
}

function validateBookingWindow(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return { valid: false, error: 'scheduled_start and scheduled_end must be valid timestamps' };
  }
  const durationMilliseconds = end - start;
  if (durationMilliseconds % 60000 !== 0) return { valid: false, error: 'Appointment times must align to whole minutes' };
  const durationMinutes = durationMilliseconds / 60000;
  if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
    return { valid: false, error: 'Appointment end must follow start and duration cannot exceed 24 hours' };
  }
  return { valid: true, start, end, durationMinutes };
}

module.exports = { extractTime, minutesToTime, subtractIntervals, timeToMinutes, validateBookingWindow };
