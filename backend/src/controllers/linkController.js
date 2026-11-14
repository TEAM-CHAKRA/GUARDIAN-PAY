import { linkSecurityService } from '../services/linkSecurityService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export async function verifyLink(req, res) {
  try {
    const { url } = req.body;
    const result = await linkSecurityService.analyzeLink(url);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(
      res,
      {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: err.message || 'Failed to analyze payment link',
        details: {},
      },
      400
    );
  }
}

export async function handleRedirect(req, res) {
  try {
    const { token, acknowledgeWarning } = req.query;

    const validation = linkSecurityService.validateVerificationToken(token);
    if (!validation.valid) {
      return sendError(
        res,
        {
          code: ERROR_CODES.FORBIDDEN,
          message: validation.error || 'Destination verification failed',
          details: {},
        },
        403
      );
    }

    // If warning level, require explicit acknowledgment
    if (validation.action === 'warn' && acknowledgeWarning !== 'true') {
      return sendError(
        res,
        {
          code: 'WARNING_CONFIRMATION_REQUIRED',
          message: 'Security warning acknowledgment required prior to external redirection.',
          details: { url: validation.url, score: validation.score },
        },
        400
      );
    }

    // If request asks for JSON or Accept includes application/json
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return sendSuccess(res, {
        redirectUrl: validation.url,
        action: validation.action,
        score: validation.score,
      });
    }

    // Direct HTTP 302 safe redirect
    return res.redirect(302, validation.url);
  } catch (err) {
    return sendError(
      res,
      {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: err.message || 'Redirect handling error',
        details: {},
      },
      500
    );
  }
}
