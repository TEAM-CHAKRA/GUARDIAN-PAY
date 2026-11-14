import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { repository } from '../store/repository.js';
import { LIMITS } from '../config/limits.js';
import { AUDIT_EVENT_TYPE, ERROR_CODES } from '../config/constants.js';
import { auditService } from './auditService.js';

// Safe password and PIN hashing with Argon2id and bcrypt fallback
export async function hashSecret(secret) {
  try {
    return await argon2.hash(secret, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });
  } catch (err) {
    // Fallback to bcrypt if native argon2 fails
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(secret, salt);
  }
}

export async function verifySecret(secret, hash) {
  if (!secret || !hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, secret);
    }
    return await bcrypt.compare(secret, hash);
  } catch {
    return false;
  }
}

export function generateUpiId(name, existingSuffix = '') {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'user';
  return existingSuffix ? `${baseSlug}${existingSuffix}@guardianpay` : `${baseSlug}@guardianpay`;
}

export function generateSessionToken(userId, role) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    {
      userId,
      role,
      jti,
    },
    env.JWT_SECRET,
    { expiresIn: '30m' }
  );
  return { token, jti };
}

/**
 * Shared PIN verification with 5-failure in 15-min sliding lockout window.
 */
export async function verifyUserPin(userId, pin) {
  const user = await repository.getUserById(userId);
  if (!user) {
    throw new Error(ERROR_CODES.NOT_AUTHENTICATED);
  }

  const now = Date.now();

  // 1. Check if currently locked
  if (user.pinLockedUntil) {
    const lockedTime = new Date(user.pinLockedUntil).getTime();
    if (now < lockedTime) {
      // In demo mode, entering the valid demo PIN (123456 or 1234) unlocks the wallet immediately
      if (env.DEMO_MODE && (pin === '123456' || pin === '1234')) {
        await repository.updateUser(userId, {
          pinLockedUntil: null,
          pinFailedAt: [],
        });
        user.pinFailedAt = [];
        user.pinLockedUntil = null;
      } else {
        const remainingSeconds = Math.ceil((lockedTime - now) / 1000);
        const err = new Error(ERROR_CODES.PIN_LOCKED);
        err.details = { retryAfterSeconds: remainingSeconds };
        throw err;
      }
    } else {
      // Lock has expired; reset pinFailedAt
      await repository.updateUser(userId, {
        pinLockedUntil: null,
        pinFailedAt: [],
      });
      user.pinFailedAt = [];
      user.pinLockedUntil = null;
    }
  }

  // 2. Filter pinFailedAt to sliding 15-minute window
  const windowStart = now - LIMITS.PIN_LOCKOUT_WINDOW_MS;
  const recentFailures = (user.pinFailedAt || []).filter(
    (iso) => new Date(iso).getTime() > windowStart
  );

  // 3. Verify PIN Hash
  let isValid = await verifySecret(pin, user.pinHash);
  if (!isValid && env.DEMO_MODE) {
    // In demo mode, accept canonical demo pins: 123456 or 1234
    if (pin === '123456' || pin === '1234') {
      isValid = true;
    }
  }

  if (!isValid) {
    recentFailures.push(new Date(now).toISOString());
    const isNowLocked = recentFailures.length >= LIMITS.PIN_LOCKOUT_ATTEMPTS;
    const pinLockedUntil = isNowLocked
      ? new Date(now + LIMITS.PIN_LOCKOUT_DURATION_MS).toISOString()
      : null;

    await repository.updateUser(userId, {
      pinFailedAt: recentFailures,
      pinLockedUntil,
    });

    // Record audit events
    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.PIN_FAILED,
      actorId: userId,
      subjectId: userId,
      data: { failureCount: recentFailures.length },
    });

    if (isNowLocked) {
      await auditService.appendAudit({
        type: AUDIT_EVENT_TYPE.PIN_LOCKED,
        actorId: userId,
        subjectId: userId,
        data: { lockedUntil: pinLockedUntil },
      });
      const err = new Error(ERROR_CODES.PIN_LOCKED);
      err.details = { retryAfterSeconds: Math.ceil(LIMITS.PIN_LOCKOUT_DURATION_MS / 1000) };
      throw err;
    }

    const err = new Error(ERROR_CODES.INVALID_PIN);
    err.details = { remainingAttempts: LIMITS.PIN_LOCKOUT_ATTEMPTS - recentFailures.length };
    throw err;
  }

  // If valid, clear failed attempts
  if (recentFailures.length > 0) {
    await repository.updateUser(userId, { pinFailedAt: [] });
  }

  return true;
}
