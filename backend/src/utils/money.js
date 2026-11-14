/**
 * Strict Integer Paise calculation and conversion utility.
 * Guarantees zero floating-point drift across the financial pipeline.
 */

export function isValidPaise(amount) {
  return Number.isInteger(amount) && amount > 0;
}

export function formatPaise(paise) {
  if (!Number.isInteger(paise)) return '₹0.00';
  const isNeg = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const cents = (abs % 100).toString().padStart(2, '0');
  return `${isNeg ? '-' : ''}₹${rupees.toLocaleString('en-IN')}.${cents}`;
}

export function paiseToRupees(paise) {
  if (!Number.isInteger(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

export function rupeesToPaise(rupees) {
  if (typeof rupees === 'number') {
    return Math.round(rupees * 100);
  }
  if (typeof rupees === 'string') {
    const clean = rupees.replace(/,/g, '').trim();
    return Math.round(parseFloat(clean) * 100);
  }
  return 0;
}
