/**
 * Recursively serializes an object with deterministic, sorted keys.
 * Required for RFC 8785 JSON Canonicalization and SHA-256 audit chaining.
 */
export function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJson(item));
    return `[${items.join(',')}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const entries = [];

  for (const key of sortedKeys) {
    const value = obj[key];
    if (value !== undefined && typeof value !== 'function') {
      entries.push(`${JSON.stringify(key)}:${canonicalJson(value)}`);
    }
  }

  return `{${entries.join(',')}}`;
}
