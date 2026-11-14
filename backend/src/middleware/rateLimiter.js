import rateLimit from 'express-rate-limit';
import { LIMITS } from '../config/limits.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

function createLimiter(config, message = 'Too many requests. Please try again later.') {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(
        res,
        {
          code: ERROR_CODES.RATE_LIMITED,
          message,
          details: { retryAfterSeconds: Math.ceil(config.windowMs / 1000) },
        },
        429
      );
    },
  });
}

export const loginLimiter = createLimiter(LIMITS.RATE_LIMIT.LOGIN, 'Too many login attempts. Please wait 15 minutes.');
export const registerLimiter = createLimiter(LIMITS.RATE_LIMIT.REGISTER, 'Registration velocity limit reached.');
export const paymentLimiter = createLimiter(LIMITS.RATE_LIMIT.PAYMENT, 'Payment velocity limit reached. Please wait a few minutes.');
export const confirmStepUpLimiter = createLimiter(LIMITS.RATE_LIMIT.CONFIRM_STEP_UP, 'Too many confirmation attempts.');
export const scamCheckLimiter = createLimiter(LIMITS.RATE_LIMIT.SCAM_CHECK, 'Scam check analysis quota reached. Please wait.');
export const walletLookupLimiter = createLimiter(LIMITS.RATE_LIMIT.WALLET_LOOKUP, 'Payee lookup rate limit reached.');
export const linkVerifyLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 60 }, 'Link verification rate limit exceeded.');
