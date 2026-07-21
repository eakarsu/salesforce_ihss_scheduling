function fail(message, status = 422, code = 'VALIDATION_ERROR') {
  const error = new Error(message); error.status = status; error.code = code; throw error;
}
function text(value, name, { min = 1, max = 255, optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return null;
  if (typeof value !== 'string') fail(`${name} is required`);
  const result = value.trim();
  if (result.length < min || result.length > max) fail(`${name} must be ${min}-${max} characters`);
  return result;
}
function integer(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${name} must be an integer from ${min} to ${max}`);
  return value;
}
function email(value, name = 'email', optional = true) {
  const result = text(value, name, { min: 3, max: 255, optional });
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(`${name} is invalid`);
  return result?.toLowerCase() || null;
}
module.exports = { email, fail, integer, text };
