import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { ERROR_CODES } from '../config/constants.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Exception in [${req.method} ${req.originalUrl}]: ${err.message}`, {
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  // Handle standard repository error codes thrown as strings or Error(code)
  if (ERROR_CODES[err.message]) {
    const code = err.message;
    const statusMap = {
      [ERROR_CODES.INSUFFICIENT_FUNDS]: 400,
      [ERROR_CODES.INVALID_PIN]: 400,
      [ERROR_CODES.PIN_LOCKED]: 423,
      [ERROR_CODES.LIMIT_EXCEEDED]: 400,
      [ERROR_CODES.SELF_TRANSFER]: 400,
      [ERROR_CODES.RECEIVER_NOT_FOUND]: 404,
      [ERROR_CODES.NOT_FOUND]: 404,
      [ERROR_CODES.IDEMPOTENCY_CONFLICT]: 409,
      [ERROR_CODES.REQUEST_IN_PROGRESS]: 409,
      [ERROR_CODES.EMAIL_TAKEN]: 409,
      [ERROR_CODES.INVALID_STATE]: 400,
    };

    const messageMap = {
      [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Wallet balance is less than requested transfer amount.',
      [ERROR_CODES.INVALID_PIN]: 'Transaction PIN is incorrect.',
      [ERROR_CODES.PIN_LOCKED]: '5 failed PIN attempts in 15 minutes; temporarily locked.',
      [ERROR_CODES.LIMIT_EXCEEDED]: 'Transfer amount exceeds per-transaction (₹50,000) or daily (₹1,00,000) limit.',
      [ERROR_CODES.SELF_TRANSFER]: 'Sender and receiver UPI IDs cannot be identical.',
      [ERROR_CODES.RECEIVER_NOT_FOUND]: 'Payee UPI ID does not exist in GuardianPay.',
      [ERROR_CODES.IDEMPOTENCY_CONFLICT]: 'Idempotency key reused with a different request payload.',
      [ERROR_CODES.REQUEST_IN_PROGRESS]: 'Request with this idempotency key is currently processing.',
      [ERROR_CODES.EMAIL_TAKEN]: 'Email address is already registered.',
      [ERROR_CODES.INVALID_STATE]: 'Action not allowed for current entity status.',
    };

    return sendError(
      res,
      {
        code,
        message: err.customMessage || messageMap[code] || err.message,
        details: err.details || {},
      },
      statusMap[code] || 400
    );
  }

  // Syntax errors from malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(
      res,
      {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Malformed JSON payload in request body.',
        details: {},
      },
      400
    );
  }

  return sendError(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      details: {},
    },
    500
  );
}
