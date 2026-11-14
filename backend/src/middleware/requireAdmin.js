import { sendError } from '../utils/response.js';
import { ERROR_CODES, USER_ROLE } from '../config/constants.js';

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== USER_ROLE.ADMIN) {
    return sendError(
      res,
      {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Administrative privileges required for this action.',
        details: {},
      },
      403
    );
  }
  next();
}
