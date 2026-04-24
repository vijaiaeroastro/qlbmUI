export function nearestPowerOfTwo(value, { minimum = 2, maximum = 256 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return minimum;
  }

  const clamped = Math.max(minimum, Math.min(maximum, Math.round(numeric)));
  const exponent = Math.round(Math.log2(clamped));
  const snapped = 2 ** exponent;
  return Math.max(minimum, Math.min(maximum, snapped));
}

export function powerOptions({ minimum = 2, maximum = 256 } = {}) {
  const options = [];
  const firstExponent = Math.ceil(Math.log2(Math.max(1, minimum)));
  const lastExponent = Math.floor(Math.log2(Math.max(1, maximum)));

  for (let exponent = firstExponent; exponent <= lastExponent; exponent += 1) {
    options.push(2 ** exponent);
  }

  return options;
}
