import crypto from 'node:crypto';
import { repository } from '../store/repository.js';
import { generateId, generateUtr } from '../utils/idGenerator.js';
import { canonicalJson } from '../utils/canonicalJson.js';
import { verifyUserPin } from './authService.js';
import { riskEngine } from './riskEngine.js';
import { policyService } from './policyService.js';
import { aiService } from './aiService.js';
import { auditService } from './auditService.js';
import { LIMITS } from '../config/limits.js';
import {
  ERROR_CODES,
  TRANSACTION_STATUS,
  POLICY_ACTION,
  AUDIT_EVENT_TYPE,
  USER_ROLE,
} from '../config/constants.js';

export class PaymentService {
  /**
   * The canonical 10-step payment processing pipeline.
   */
  async createPayment({ senderUser, idempotencyKey, receiverUpiId, amountPaise, note, pin }) {
    // 1. Validate Idempotency Key presence
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 64) {
      throw new Error(ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED);
    }

    // 2. Compute canonical payload hash (EXCLUDING secret PIN)
    const payloadForHashing = {
      amountPaise,
      note: note || '',
      receiverUpiId: receiverUpiId.toLowerCase().trim(),
    };
    const payloadHash = crypto
      .createHash('sha256')
      .update(canonicalJson(payloadForHashing))
      .digest('hex');

    // 3. Check Idempotency Store
    const existingIdemp = await repository.getIdempotencyRecord(senderUser.id, idempotencyKey);
    if (existingIdemp) {
      if (existingIdemp.status === 'in_progress') {
        throw new Error(ERROR_CODES.REQUEST_IN_PROGRESS);
      }
      if (existingIdemp.payloadHash !== payloadHash) {
        throw new Error(ERROR_CODES.IDEMPOTENCY_CONFLICT);
      }
      // Replay stored response
      return {
        ...existingIdemp.response,
        replayed: true,
      };
    }

    // Mark as in-progress to prevent race duplicates
    await repository.saveIdempotencyRecord(senderUser.id, idempotencyKey, {
      payloadHash,
      response: null,
      status: 'in_progress',
    });

    try {
      // 4. Verify PIN (with sliding 5-failure lockout enforcement)
      await verifyUserPin(senderUser.id, pin);

      // 5. Receiver Validation
      const cleanReceiverUpi = receiverUpiId.toLowerCase().trim();
      if (cleanReceiverUpi === senderUser.upiId.toLowerCase()) {
        throw new Error(ERROR_CODES.SELF_TRANSFER);
      }

      let receiverUser = await repository.getUserByUpiId(cleanReceiverUpi);
      if (!receiverUser) {
        // In demo / NPCI federated mode, automatically resolve any valid UPI format
        if (cleanReceiverUpi.includes('@') && cleanReceiverUpi.length >= 4) {
          const extId = generateId('USR');
          const extRawName = cleanReceiverUpi.split('@')[0].replace(/[._-]/g, ' ');
          const extName = extRawName.charAt(0).toUpperCase() + extRawName.slice(1) || 'External Payee';
          receiverUser = await repository.createUser({
            id: extId,
            name: extName,
            email: `${cleanReceiverUpi.replace('@', '.')}@external.upi`,
            role: USER_ROLE.USER,
            upiId: cleanReceiverUpi,
            passwordHash: '$argon2id$external',
            pinHash: '$argon2id$external',
            pinFailedAt: [],
            pinLockedUntil: null,
            createdAt: new Date().toISOString(),
          });
          await repository.createWallet({
            userId: extId,
            upiId: cleanReceiverUpi,
            balancePaise: 10000000,
            heldPaise: 0,
            dailySpentPaise: 0,
            dailyResetDate: new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString(),
          });
        } else {
          throw new Error(ERROR_CODES.RECEIVER_NOT_FOUND);
        }
      }

      // 6. Hard Limit Validations
      if (amountPaise > LIMITS.MAX_TXN_PAISE) {
        const err = new Error(ERROR_CODES.LIMIT_EXCEEDED);
        err.details = { maxPerTransactionPaise: LIMITS.MAX_TXN_PAISE };
        throw err;
      }

      const senderWallet = await repository.getWallet(senderUser.id);
      if (!senderWallet) {
        throw new Error(ERROR_CODES.NOT_FOUND);
      }

      if (senderWallet.dailySpentPaise + amountPaise > LIMITS.MAX_DAILY_PAISE) {
        const err = new Error(ERROR_CODES.LIMIT_EXCEEDED);
        err.details = {
          dailySpentPaise: senderWallet.dailySpentPaise,
          attemptedAmountPaise: amountPaise,
          maxDailyPaise: LIMITS.MAX_DAILY_PAISE,
        };
        throw err;
      }

      // 7. Balance Check
      if (senderWallet.balancePaise < amountPaise) {
        const err = new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
        err.details = {
          balancePaise: senderWallet.balancePaise,
          requiredPaise: amountPaise,
        };
        throw err;
      }

      // 8. Dynamic 6-Signal Fraud Risk Scoring
      const riskEvaluation = await riskEngine.evaluateTransactionRisk({
        senderUser,
        senderWallet,
        receiverUpiId: cleanReceiverUpi,
        amountPaise,
      });

      const policyOutcome = policyService.determineAction(riskEvaluation.score);

      // Mask receiver for privacy
      const maskedReceiver = cleanReceiverUpi.replace(/(.{2})(.*)(@.*)/, '$1***$3');

      // AI Risk Intelligence (runs for score >= 30, with deterministic template fallback)
      const aiReview = await aiService.reviewTransactionRisk({
        score: riskEvaluation.score,
        level: riskEvaluation.level,
        policyAction: policyOutcome.action,
        signals: riskEvaluation.signals,
        amountPaise,
        maskedReceiverUpiId: maskedReceiver,
      });

      // 9. Construct Transaction Record
      const txnId = generateId('TXN');
      const utr = generateUtr();
      const now = new Date().toISOString();

      const transactionRecord = {
        id: txnId,
        utr,
        senderUserId: senderUser.id,
        senderName: senderUser.name,
        senderUpiId: senderUser.upiId,
        receiverUserId: receiverUser.id,
        receiverName: receiverUser.name,
        receiverUpiId: receiverUser.upiId,
        amountPaise,
        currency: 'INR',
        note: note || '',
        status: TRANSACTION_STATUS.INITIATED,
        risk: {
          score: riskEvaluation.score,
          level: riskEvaluation.level,
          action: policyOutcome.action,
          signals: riskEvaluation.signals,
          coverage: riskEvaluation.coverage,
          criticalCombinationApplied: riskEvaluation.criticalCombinationApplied,
        },
        ai: aiReview,
        createdAt: now,
        updatedAt: now,
      };

      await auditService.appendAudit({
        type: AUDIT_EVENT_TYPE.TXN_CREATED,
        actorId: senderUser.id,
        subjectId: txnId,
        data: {
          amountPaise,
          receiverUpiId: cleanReceiverUpi,
          riskScore: riskEvaluation.score,
          action: policyOutcome.action,
        },
      });

      // 10. Execute Policy Action
      let finalTransaction = null;

      switch (policyOutcome.action) {
        case POLICY_ACTION.ALLOW: {
          const transferResult = await repository.executeTransfer({
            transaction: transactionRecord,
            mode: 'settle',
          });
          finalTransaction = transferResult.transaction;

          await auditService.appendAudit({
            type: AUDIT_EVENT_TYPE.TXN_SUCCESS,
            actorId: senderUser.id,
            subjectId: txnId,
            data: { amountPaise, utr },
          });
          break;
        }

        case POLICY_ACTION.STEP_UP: {
          transactionRecord.status = TRANSACTION_STATUS.PENDING_VERIFICATION;
          transactionRecord.expiresAt = new Date(Date.now() + LIMITS.STEP_UP_TIMEOUT_MS).toISOString();
          transactionRecord.stepUpRequired = true;
          finalTransaction = await repository.createTransaction(transactionRecord);

          await auditService.appendAudit({
            type: AUDIT_EVENT_TYPE.TXN_STEP_UP_REQUIRED,
            actorId: senderUser.id,
            subjectId: txnId,
            data: { expiresAt: transactionRecord.expiresAt },
          });
          break;
        }

        case POLICY_ACTION.HOLD: {
          const transferResult = await repository.executeTransfer({
            transaction: transactionRecord,
            mode: 'hold',
          });
          finalTransaction = transferResult.transaction;

          await auditService.appendAudit({
            type: AUDIT_EVENT_TYPE.TXN_HELD,
            actorId: senderUser.id,
            subjectId: txnId,
            data: { amountPaise, reason: 'High fraud score quarantine' },
          });
          break;
        }

        case POLICY_ACTION.BLOCK: {
          transactionRecord.status = TRANSACTION_STATUS.BLOCKED;
          finalTransaction = await repository.createTransaction(transactionRecord);

          await auditService.appendAudit({
            type: AUDIT_EVENT_TYPE.TXN_BLOCKED,
            actorId: senderUser.id,
            subjectId: txnId,
            data: { amountPaise, reason: 'Critical anomaly signature' },
          });
          break;
        }
      }

      const responsePayload = {
        transaction: finalTransaction,
        message: policyOutcome.userFacingMessage,
      };

      // Save completed idempotency record
      await repository.saveIdempotencyRecord(senderUser.id, idempotencyKey, {
        payloadHash,
        response: responsePayload,
        status: 'completed',
      });

      return responsePayload;
    } catch (err) {
      // On failure before commit, clean up in-progress idempotency key so retry is possible
      await repository.deleteIdempotencyRecord(senderUser.id, idempotencyKey);
      throw err;
    }
  }

  /**
   * Completes a Step-Up challenge for pending_verification transactions.
   */
  async confirmStepUpPayment({ userId, transactionId, pin }) {
    const txn = await repository.getTransaction(transactionId);
    if (!txn) {
      throw new Error(ERROR_CODES.NOT_FOUND);
    }

    if (txn.senderUserId !== userId) {
      throw new Error(ERROR_CODES.FORBIDDEN);
    }

    if (txn.status !== TRANSACTION_STATUS.PENDING_VERIFICATION) {
      throw new Error(ERROR_CODES.INVALID_STATE);
    }

    // Check expiry (5 minutes)
    if (new Date() > new Date(txn.expiresAt)) {
      txn.status = TRANSACTION_STATUS.FAILED;
      txn.statusReason = 'STEP_UP_EXPIRED';
      await repository.updateTransaction(txn.id, txn);

      await auditService.appendAudit({
        type: AUDIT_EVENT_TYPE.TXN_FAILED,
        actorId: userId,
        subjectId: txn.id,
        data: { reason: 'Step-up challenge window expired' },
      });

      const err = new Error(ERROR_CODES.STEP_UP_EXPIRED);
      err.details = { expiredAt: txn.expiresAt };
      throw err;
    }

    // Verify PIN with lockout
    await verifyUserPin(userId, pin);

    // Atomically settle transfer
    const transferResult = await repository.executeTransfer({
      transaction: txn,
      mode: 'settle',
    });

    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.TXN_SUCCESS,
      actorId: userId,
      subjectId: txn.id,
      data: { verifiedVia: 'STEP_UP_PIN', amountPaise: txn.amountPaise },
    });

    return {
      transaction: transferResult.transaction,
      message: 'Step-up challenge completed; payment settled successfully.',
    };
  }

  async getTransactionsByUser(userId, { status, limit = 50 } = {}) {
    return repository.listTransactionsByUser(userId, { status, limit });
  }

  async getTransactionById(userId, transactionId, userRole) {
    const txn = await repository.getTransaction(transactionId);
    if (!txn) return null;

    // Sender, receiver, or admin can inspect
    if (userRole !== USER_ROLE.ADMIN && txn.senderUserId !== userId && txn.receiverUserId !== userId) {
      throw new Error(ERROR_CODES.FORBIDDEN);
    }

    return txn;
  }
}

export const paymentService = new PaymentService();
