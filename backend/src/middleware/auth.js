import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repository } from '../store/repository.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check httpOnly cookie
    if (req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      if (env.DEMO_MODE) {
        const demoUserId = req.query.userId || req.headers['x-user-id'];
        let user = null;
        if (demoUserId) {
          user = await repository.getUserById(demoUserId);
        }
        if (!user) {
          const users = await repository.listUsers();
          user = users[0];
        }
        if (user) {
          const { passwordHash, pinHash, ...sanitizedUser } = user;
          req.user = sanitizedUser;
          req.sessionJti = 'demo-session';
          return next();
        }
      }

      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_AUTHENTICATED,
          message: 'Authentication required. Please log in.',
          details: {},
        },
        401
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Check session revocation by jti
    if (decoded.jti && (await repository.isSessionRevoked(decoded.jti))) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_AUTHENTICATED,
          message: 'Session has been revoked. Please log in again.',
          details: {},
        },
        401
      );
    }

    // Fetch user
    let user = await repository.getUserById(decoded.userId);
    if (!user && env.DEMO_MODE) {
      const users = await repository.listUsers();
      if (decoded.role === 'admin') {
        user = users.find((u) => u.role === 'admin') || users[0];
      } else {
        user = users.find((u) => u.upiId === 'aarav@aegis') || users[0];
      }
    }

    if (!user) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_AUTHENTICATED,
          message: 'User account not found.',
          details: {},
        },
        401
      );
    }

    // Sanitize user (strip hashes)
    const { passwordHash, pinHash, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    req.sessionJti = decoded.jti;

    next();
  } catch (err) {
    return sendError(
      res,
      {
        code: ERROR_CODES.NOT_AUTHENTICATED,
        message: 'Invalid or expired session token.',
        details: {},
      },
      401
    );
  }
}
