const SECRET_KEY_REGEX = /(pin|password|token|secret|key|authorization|cookie)/i;

function redactSecrets(data, seen = new WeakSet()) {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (seen.has(data)) {
    return '[CIRCULAR]';
  }
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item, seen));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SECRET_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSecrets(value, seen);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  info: (message, meta = {}) => {
    const safeMeta = redactSecrets(meta);
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(safeMeta).length ? safeMeta : '');
  },
  warn: (message, meta = {}) => {
    const safeMeta = redactSecrets(meta);
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, Object.keys(safeMeta).length ? safeMeta : '');
  },
  error: (message, meta = {}) => {
    const safeMeta = redactSecrets(meta);
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, Object.keys(safeMeta).length ? safeMeta : '');
  },
};
