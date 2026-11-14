import { repository } from '../store/repository.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

function maskName(fullName) {
  if (!fullName) return 'Verified User';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((p, idx) => {
      if (p.length <= 1) return p;
      if (idx === 0) {
        if (p.length <= 2) return p[0] + '*';
        return p.slice(0, 2) + '*'.repeat(p.length - 2);
      }
      return p[0] + '*'.repeat(p.length - 1);
    })
    .join(' ');
}

export async function getWallet(req, res, next) {
  try {
    const wallet = await repository.getWallet(req.user.id);
    if (!wallet) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Wallet not initialized for this account.',
          details: {},
        },
        404
      );
    }

    return sendSuccess(res, {
      wallet: {
        upiId: wallet.upiId,
        balancePaise: wallet.balancePaise,
        heldPaise: wallet.heldPaise,
        dailySpentPaise: wallet.dailySpentPaise,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function lookupPayee(req, res, next) {
  try {
    const { upiId } = req.params;
    if (!upiId) {
      return sendError(
        res,
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Payee UPI ID parameter is required.',
          details: {},
        },
        400
      );
    }

    const payee = await repository.getUserByUpiId(upiId.trim());
    if (!payee) {
      return sendError(
        res,
        {
          code: ERROR_CODES.RECEIVER_NOT_FOUND,
          message: 'The requested UPI ID is not registered on GuardianPay.',
          details: { upiId },
        },
        404
      );
    }

    // Privacy-preserving response: Masked name only, never email
    const masked = maskName(payee.name);
    return sendSuccess(res, {
      maskedName: masked,
      payee: {
        upiId: payee.upiId,
        maskedName: masked,
        verified: true,
      },
    });
  } catch (err) {
    next(err);
  }
}
