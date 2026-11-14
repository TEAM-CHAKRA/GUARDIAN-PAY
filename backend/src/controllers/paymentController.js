import { paymentService } from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export async function createPayment(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const { receiverUpiId, amountPaise, note, pin } = req.body;

    const result = await paymentService.createPayment({
      senderUser: req.user,
      idempotencyKey,
      receiverUpiId,
      amountPaise,
      note,
      pin,
    });

    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getPayments(req, res, next) {
  try {
    const { status, limit } = req.query;
    const transactions = await paymentService.getTransactionsByUser(req.user.id, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return sendSuccess(res, { transactions });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await paymentService.getTransactionById(req.user.id, id, req.user.role);

    if (!transaction) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Transaction not found.',
          details: { id },
        },
        404
      );
    }

    return sendSuccess(res, { transaction });
  } catch (err) {
    next(err);
  }
}

export async function confirmStepUp(req, res, next) {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    const result = await paymentService.confirmStepUpPayment({
      userId: req.user.id,
      transactionId: id,
      pin,
    });

    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}
