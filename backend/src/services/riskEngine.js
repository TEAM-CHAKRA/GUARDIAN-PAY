import { SIGNAL_IDS, SIGNAL_STATUS, TRANSACTION_STATUS } from '../config/constants.js';
import { getPolicyForScore } from '../config/policy.js';
import { repository } from '../store/repository.js';
import { LIMITS } from '../config/limits.js';

export class RiskEngine {
  /**
   * Evaluates the 6 deterministic signals against the transfer context.
   */
  async evaluateTransactionRisk({
    senderUser,
    senderWallet,
    receiverUpiId,
    amountPaise,
    now = new Date(),
  }) {
    const signals = [];
    let completedCount = 0;

    // 1. AMOUNT ANOMALY (Max 30)
    const amountSignal = await this._evaluateAmountAnomaly(senderUser.id, amountPaise);
    signals.push(amountSignal);
    if (amountSignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // 2. VELOCITY (Max 20)
    const velocitySignal = await this._evaluateVelocity(senderUser.id, now);
    signals.push(velocitySignal);
    if (velocitySignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // 3. NEW PAYEE (Max 15)
    const newPayeeSignal = await this._evaluateNewPayee(senderUser.id, receiverUpiId, amountPaise);
    signals.push(newPayeeSignal);
    if (newPayeeSignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // 4. ODD HOURS (Max 10)
    const oddHoursSignal = this._evaluateOddHours(now);
    signals.push(oddHoursSignal);
    if (oddHoursSignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // 5. FAILED PIN ATTEMPTS (Max 15)
    const pinSignal = this._evaluateFailedPinAttempts(senderUser, now);
    signals.push(pinSignal);
    if (pinSignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // 6. BALANCE DRAIN (Max 10)
    const drainSignal = this._evaluateBalanceDrain(senderWallet, amountPaise);
    signals.push(drainSignal);
    if (drainSignal.status !== SIGNAL_STATUS.NOT_EVALUATED) completedCount++;

    // Sum points
    let rawScore = signals.reduce((sum, s) => sum + (s.points || 0), 0);

    // CRITICAL COMBINATION RULE:
    // new_payee triggered + amount_anomaly triggered + odd_hours triggered => floor score at 60 (HOLD)
    const hasNewPayee = newPayeeSignal.status === SIGNAL_STATUS.TRIGGERED;
    const hasAmountAnomaly = amountSignal.status === SIGNAL_STATUS.TRIGGERED;
    const hasOddHours = oddHoursSignal.status === SIGNAL_STATUS.TRIGGERED;

    let criticalCombinationApplied = false;
    if (hasNewPayee && hasAmountAnomaly && hasOddHours) {
      if (rawScore < 60) {
        rawScore = 60;
        criticalCombinationApplied = true;
      }
    }

    const finalScore = Math.min(100, Math.max(0, rawScore));
    const policy = getPolicyForScore(finalScore);

    return {
      score: finalScore,
      level: policy.level,
      action: policy.action,
      signals,
      coverage: {
        completed: completedCount,
        total: 6,
      },
      criticalCombinationApplied,
      analyzedAt: now.toISOString(),
    };
  }

  // --- Individual Signal Evaluators ---

  async _evaluateAmountAnomaly(senderUserId, amountPaise) {
    const pastTxns = await repository.listTransactionsByUser(senderUserId, {
      limit: 20,
      status: TRANSACTION_STATUS.SUCCESS,
    });

    const outgoing = pastTxns.filter((t) => t.senderUserId === senderUserId);

    // Baseline requires at least 3 historical transfers
    if (outgoing.length < 3) {
      // With < 3 past payments use absolute threshold: >= ₹10,000 (1,000,000 paise): 15 pts
      if (amountPaise >= 1000000) {
        return {
          id: SIGNAL_IDS.AMOUNT_ANOMALY,
          status: SIGNAL_STATUS.TRIGGERED,
          points: 15,
          detail: 'High initial transaction value (>= ₹10,000) with limited profile history',
        };
      }
      return {
        id: SIGNAL_IDS.AMOUNT_ANOMALY,
        status: SIGNAL_STATUS.COMPLETED,
        points: 0,
        detail: 'Initial transaction value within safe introductory envelope',
      };
    }

    // Use last 10 outgoing payments to compute average
    const recent = outgoing.slice(0, 10);
    const sum = recent.reduce((acc, t) => acc + t.amountPaise, 0);
    const avg = sum / recent.length;
    const ratio = amountPaise / avg;

    if (ratio >= 5.0) {
      return {
        id: SIGNAL_IDS.AMOUNT_ANOMALY,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 30,
        detail: `Amount is ${ratio.toFixed(1)}x greater than sender's recent transaction average`,
      };
    }

    if (ratio >= 3.0) {
      return {
        id: SIGNAL_IDS.AMOUNT_ANOMALY,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 20,
        detail: `Amount is ${ratio.toFixed(1)}x greater than sender's recent transaction average`,
      };
    }

    return {
      id: SIGNAL_IDS.AMOUNT_ANOMALY,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Amount is consistent with sender historical patterns',
    };
  }

  async _evaluateVelocity(senderUserId, now) {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentTxns = await repository.listTransactionsByUser(senderUserId, { limit: 10 });

    const recentOutgoing = recentTxns.filter(
      (t) => t.senderUserId === senderUserId && new Date(t.createdAt) >= fiveMinutesAgo
    );

    const count = recentOutgoing.length;

    if (count >= 5) {
      return {
        id: SIGNAL_IDS.VELOCITY,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 20,
        detail: `High transaction frequency (${count} transfers initiated in past 5 minutes)`,
      };
    }

    if (count >= 3) {
      return {
        id: SIGNAL_IDS.VELOCITY,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 10,
        detail: `Elevated transaction frequency (${count} transfers initiated in past 5 minutes)`,
      };
    }

    return {
      id: SIGNAL_IDS.VELOCITY,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Transaction velocity is normal',
    };
  }

  async _evaluateNewPayee(senderUserId, receiverUpiId, amountPaise) {
    const pastTxns = await repository.listTransactionsByUser(senderUserId, {
      limit: 50,
      status: TRANSACTION_STATUS.SUCCESS,
    });

    const hasPaidBefore = pastTxns.some(
      (t) =>
        t.senderUserId === senderUserId &&
        t.receiverUpiId.toLowerCase() === receiverUpiId.toLowerCase()
    );

    if (!hasPaidBefore) {
      // First payment to this receiver
      if (amountPaise >= 500000) {
        // >= ₹5,000
        return {
          id: SIGNAL_IDS.NEW_PAYEE,
          status: SIGNAL_STATUS.TRIGGERED,
          points: 15,
          detail: 'First-time transfer to recipient with substantial amount (>= ₹5,000)',
        };
      }
      return {
        id: SIGNAL_IDS.NEW_PAYEE,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 5,
        detail: 'First-time transfer to this recipient',
      };
    }

    return {
      id: SIGNAL_IDS.NEW_PAYEE,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Recipient is an established counterparty',
    };
  }

  _evaluateOddHours(now) {
    // Evaluated in Asia/Kolkata timezone: 00:00 to 05:00
    const kolkataHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(now);

    const hour = parseInt(kolkataHourStr, 10);

    if (hour >= 0 && hour < 5) {
      return {
        id: SIGNAL_IDS.ODD_HOURS,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 10,
        detail: `Transfer initiated during nocturnal window (${hour}:00 IST)`,
      };
    }

    return {
      id: SIGNAL_IDS.ODD_HOURS,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Transfer initiated during standard operating hours',
    };
  }

  _evaluateFailedPinAttempts(senderUser, now) {
    const windowStart = now.getTime() - LIMITS.PIN_LOCKOUT_WINDOW_MS;
    const failures = (senderUser.pinFailedAt || []).filter(
      (iso) => new Date(iso).getTime() > windowStart
    );

    const count = failures.length;

    if (count >= 3) {
      return {
        id: SIGNAL_IDS.FAILED_PIN_ATTEMPTS,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 15,
        detail: `Multiple failed PIN attempts (${count}) recorded prior to this transfer`,
      };
    }

    if (count >= 1) {
      return {
        id: SIGNAL_IDS.FAILED_PIN_ATTEMPTS,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 5,
        detail: `Recent failed PIN attempt (${count}) recorded`,
      };
    }

    return {
      id: SIGNAL_IDS.FAILED_PIN_ATTEMPTS,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Zero anomalous authentication credentials recorded',
    };
  }

  _evaluateBalanceDrain(senderWallet, amountPaise) {
    if (!senderWallet || senderWallet.balancePaise <= 0) {
      return {
        id: SIGNAL_IDS.BALANCE_DRAIN,
        status: SIGNAL_STATUS.NOT_EVALUATED,
        points: 0,
        detail: 'Unable to evaluate balance drain due to empty balance',
      };
    }

    const drainRatio = amountPaise / senderWallet.balancePaise;

    if (drainRatio >= 0.95) {
      return {
        id: SIGNAL_IDS.BALANCE_DRAIN,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 10,
        detail: `Payment drains ${(drainRatio * 100).toFixed(0)}% of total liquid wallet capital`,
      };
    }

    if (drainRatio >= 0.8) {
      return {
        id: SIGNAL_IDS.BALANCE_DRAIN,
        status: SIGNAL_STATUS.TRIGGERED,
        points: 5,
        detail: `Payment drains ${(drainRatio * 100).toFixed(0)}% of total liquid wallet capital`,
      };
    }

    return {
      id: SIGNAL_IDS.BALANCE_DRAIN,
      status: SIGNAL_STATUS.COMPLETED,
      points: 0,
      detail: 'Transfer preserves wallet liquidity reserve',
    };
  }
}

export const riskEngine = new RiskEngine();
