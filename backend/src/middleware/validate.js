import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      const details = {};
      if (err.errors) {
        for (const e of err.errors) {
          const path = e.path.join('.') || 'root';
          details[path] = e.message;
        }
      }
      return sendError(
        res,
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Request payload validation failed.',
          details,
        },
        400
      );
    }
  };
}
