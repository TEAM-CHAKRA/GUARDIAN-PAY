import crypto from 'node:crypto';

export function generateId(prefix = 'ID') {
  const hex = crypto.randomBytes(8).toString('hex').toLowerCase(); // 16 hex chars
  if (prefix === 'TXN') {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TXN-${today}-${hex}`;
  }
  return `${prefix}-${hex}`;
}

export function generateUtr() {
  // 12-digit numeric simulated UTR
  const digits = crypto.randomInt(100000000000, 999999999999).toString();
  return digits;
}
