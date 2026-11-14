import { repository } from '../store/repository.js';
import { aiService } from '../services/aiService.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AUDIT_EVENT_TYPE, ERROR_CODES, TRANSACTION_STATUS } from '../config/constants.js';
import { env } from '../config/env.js';

export async function listTransactions(req, res, next) {
  try {
    const { status, limit } = req.query;
    const transactions = await repository.listTransactions({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return sendSuccess(res, { transactions });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await repository.getTransaction(id);
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

export async function getTransactionSummary(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await repository.getTransaction(id);
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

    const summary = await aiService.generateAdminCaseSummary(transaction);
    return sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
}

export async function approveTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await repository.getTransaction(id);
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

    if (transaction.status !== TRANSACTION_STATUS.HELD) {
      return sendError(
        res,
        {
          code: ERROR_CODES.INVALID_STATE,
          message: `Cannot approve transaction in status '${transaction.status}'. Only held transactions can be approved.`,
          details: { currentStatus: transaction.status },
        },
        400
      );
    }

    const result = await repository.executeTransfer({
      transaction,
      mode: 'release_to_receiver',
    });

    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.ADMIN_APPROVED,
      actorId: req.user.id,
      subjectId: transaction.id,
      data: {
        amountPaise: transaction.amountPaise,
        receiverUserId: transaction.receiverUserId,
        approvedByAdmin: req.user.email,
      },
    });

    return sendSuccess(res, {
      transaction: result.transaction,
      message: 'Transaction approved; reserved capital released to recipient.',
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await repository.getTransaction(id);
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

    if (transaction.status !== TRANSACTION_STATUS.HELD) {
      return sendError(
        res,
        {
          code: ERROR_CODES.INVALID_STATE,
          message: `Cannot reject transaction in status '${transaction.status}'. Only held transactions can be rejected.`,
          details: { currentStatus: transaction.status },
        },
        400
      );
    }

    const result = await repository.executeTransfer({
      transaction,
      mode: 'return_to_sender',
    });

    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.ADMIN_REJECTED,
      actorId: req.user.id,
      subjectId: transaction.id,
      data: {
        amountPaise: transaction.amountPaise,
        senderUserId: transaction.senderUserId,
        rejectedByAdmin: req.user.email,
      },
    });

    return sendSuccess(res, {
      transaction: result.transaction,
      message: 'Transaction rejected; reserved funds refunded to sender balance.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const allTxns = await repository.listTransactions({ limit: 10000 });

    const statusCounts = {
      success: 0,
      held: 0,
      blocked: 0,
      pending_verification: 0,
      failed: 0,
      reversed: 0,
      initiated: 0,
    };

    const riskLevelCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalHeldPaise = 0;
    let totalBlockedPaise = 0;
    const signalFrequency = {};

    for (const txn of allTxns) {
      if (statusCounts[txn.status] !== undefined) {
        statusCounts[txn.status]++;
      }
      if (txn.status === TRANSACTION_STATUS.HELD) {
        totalHeldPaise += txn.amountPaise;
      }
      if (txn.status === TRANSACTION_STATUS.BLOCKED) {
        totalBlockedPaise += txn.amountPaise;
      }

      if (txn.risk) {
        if (riskLevelCounts[txn.risk.level] !== undefined) {
          riskLevelCounts[txn.risk.level]++;
        }
        if (Array.isArray(txn.risk.signals)) {
          for (const s of txn.risk.signals) {
            if (s.status === 'triggered') {
              signalFrequency[s.id] = (signalFrequency[s.id] || 0) + 1;
            }
          }
        }
      }
    }

    return sendSuccess(res, {
      stats: {
        totalTransactions: allTxns.length,
        statusCounts,
        riskLevelCounts,
        totalHeldPaise,
        totalBlockedPaise,
        topTriggeredSignals: signalFrequency,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAudit(req, res, next) {
  try {
    const { limit } = req.query;
    const entries = await auditService.listAudit({ limit: limit ? parseInt(limit, 10) : 50 });
    return sendSuccess(res, { entries });
  } catch (err) {
    next(err);
  }
}

export async function verifyAudit(req, res, next) {
  try {
    const verification = await auditService.verifyChain();
    return sendSuccess(res, {
      verification,
      ...verification,
    });
  } catch (err) {
    next(err);
  }
}

export async function tamperAudit(req, res, next) {
  try {
    if (!env.DEMO_MODE || env.NODE_ENV !== 'development') {
      return sendError(
        res,
        {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Tamper route is restricted to DEMO_MODE in development environment only.',
          details: {},
        },
        403
      );
    }

    const { seq } = req.body;
    if (!seq || typeof seq !== 'number') {
      return sendError(
        res,
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Sequence number (integer) is required to simulate tamper attack.',
          details: { seq },
        },
        400
      );
    }

    const tampered = await repository.tamperAudit(seq, {
      maliciousActor: 'INJECTED_TAMPER_DEMO',
      alteredAmount: 999999999,
    });

    if (!tampered) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_FOUND,
          message: `Audit entry sequence ${seq} not found.`,
          details: { seq },
        },
        404
      );
    }

    return sendSuccess(res, {
      message: `Audit entry #${seq} modified in storage. Hash-chain verification will now fail.`,
      entry: tampered,
    });
  } catch (err) {
    next(err);
  }
}
