export const LIMITS = {
  // Monetary Limits (in paise: 1 INR = 100 paise)
  MAX_TXN_PAISE: 5000000, // ₹50,000
  MAX_DAILY_PAISE: 10000000, // ₹1,00,000

  // Security Timings (ms)
  PIN_LOCKOUT_ATTEMPTS: 5,
  PIN_LOCKOUT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  PIN_LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  STEP_UP_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  IDEMPOTENCY_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Rate Limits (windowMs & max) - relaxed for development/demo environment
  RATE_LIMIT: {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 200 },
    REGISTER: { windowMs: 60 * 60 * 1000, max: 200 },
    PAYMENT: { windowMs: 10 * 60 * 1000, max: 500 },
    CONFIRM_STEP_UP: { windowMs: 15 * 60 * 1000, max: 200 },
    SCAM_CHECK: { windowMs: 10 * 60 * 1000, max: 200 },
    WALLET_LOOKUP: { windowMs: 10 * 60 * 1000, max: 500 },
  },
};

/**
 * Returns current date string (YYYY-MM-DD) evaluated specifically in Asia/Kolkata timezone
 * to synchronize daily reset boundaries strictly with Indian banking days.
 */
export function getKolkataDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}
