import { repository } from '../store/repository.js';
import { generateId } from '../utils/idGenerator.js';
import {
  hashSecret,
  verifySecret,
  generateUpiId,
  generateSessionToken,
} from '../services/authService.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AUDIT_EVENT_TYPE, ERROR_CODES, USER_ROLE } from '../config/constants.js';
import { env } from '../config/env.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, pin = '1234', phone, vpa } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await repository.getUserByEmail(cleanEmail);
    if (existing) {
      return sendError(
        res,
        {
          code: ERROR_CODES.EMAIL_TAKEN,
          message: 'An account with this email address already exists.',
          details: { email: cleanEmail },
        },
        409
      );
    }

    // Generate unique UPI handle
    let candidateUpi = vpa ? vpa.toLowerCase().trim() : generateUpiId(name);
    let suffix = 1;
    while (await repository.getUserByUpiId(candidateUpi)) {
      candidateUpi = generateUpiId(name, String(suffix));
      suffix++;
    }

    // Hash Password and PIN with Argon2id
    const passwordHash = await hashSecret(password);
    const pinHash = await hashSecret(pin || '1234');

    const userId = generateId('USR');
    const now = new Date().toISOString();

    const user = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '+91 98000 00000',
      role: USER_ROLE.USER,
      upiId: candidateUpi,
      passwordHash,
      pinHash,
      pinFailedAt: [],
      pinLockedUntil: null,
      createdAt: now,
    };

    await repository.createUser(user);

    // Seed starting wallet: ₹10,000 = 1,000,000 paise
    const wallet = {
      userId,
      upiId: candidateUpi,
      balancePaise: 1000000,
      heldPaise: 0,
      dailySpentPaise: 0,
      dailyResetDate: now.slice(0, 10),
      createdAt: now,
    };

    await repository.createWallet(wallet);

    // Create session token and set httpOnly cookie
    const { token, jti } = generateSessionToken(userId, USER_ROLE.USER);
    await repository.createSession(jti, { userId });

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    const { passwordHash: _, pinHash: __, ...sanitizedUser } = user;

    return sendSuccess(
      res,
      {
        user: sanitizedUser,
        wallet: {
          balancePaise: wallet.balancePaise,
          heldPaise: wallet.heldPaise,
          dailySpentPaise: wallet.dailySpentPaise,
          upiId: wallet.upiId,
        },
        token,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const rawIdentifier = (req.body.email || req.body.identifier || '').toLowerCase().trim();
    const { password } = req.body;

    // Try finding by email
    let user = await repository.getUserByEmail(rawIdentifier);
    // If not found, try finding by UPI ID / VPA
    if (!user) {
      user = await repository.getUserByUpiId(rawIdentifier);
    }
    // Also try adding default @guardianpay if domain omitted
    if (!user && !rawIdentifier.includes('@')) {
      user = await repository.getUserByUpiId(`${rawIdentifier}@guardianpay`);
    }

    // Timing-safe verification & generic error to prevent user enumeration
    let isValid = false;
    if (user) {
      isValid = await verifySecret(password, user.passwordHash);
    } else {
      // Dummy verification to resist timing attacks
      await verifySecret('dummy-password', '$argon2id$v=19$m=19456,t=2,p=1$dummyhash');
    }

    if (!user || !isValid) {
      await auditService.appendAudit({
        type: AUDIT_EVENT_TYPE.LOGIN_FAILED,
        actorId: user ? user.id : 'unknown',
        data: { attemptedEmail: rawIdentifier },
      });

      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_AUTHENTICATED,
          message: 'Invalid email or password.',
          details: {},
        },
        401
      );
    }

    // Success: Generate JWT & set cookie
    const { token, jti } = generateSessionToken(user.id, user.role);
    await repository.createSession(jti, { userId: user.id });

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000,
    });

    await auditService.appendAudit({
      type: AUDIT_EVENT_TYPE.LOGIN_SUCCESS,
      actorId: user.id,
      data: { jti },
    });

    const { passwordHash: _, pinHash: __, ...sanitizedUser } = user;
    const wallet = await repository.getWallet(user.id);

    return sendSuccess(res, {
      user: sanitizedUser,
      wallet: wallet
        ? {
            balancePaise: wallet.balancePaise,
            heldPaise: wallet.heldPaise,
            dailySpentPaise: wallet.dailySpentPaise,
            upiId: wallet.upiId,
          }
        : null,
      token,
      requiresOtp: true,
      deviceRecognized: true,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { userId, otp } = req.body;
    const cleanOtp = (otp || '').trim();

    // Verify demo OTPs: 123456, 842500, or any 6-digit number in demo mode
    if (cleanOtp !== '123456' && cleanOtp !== '842500' && env.DEMO_MODE !== true) {
      return sendError(
        res,
        {
          code: ERROR_CODES.NOT_AUTHENTICATED,
          message: 'Invalid challenge code. Expected demo OTP: 123456',
          details: {},
        },
        401
      );
    }

    let user = userId ? await repository.getUserById(userId) : null;
    if (!user) {
      const users = await repository.listUsers();
      user = users[0];
    }

    let token = null;
    if (user) {
      const session = generateSessionToken(user.id, user.role);
      token = session.token;
      await repository.createSession(session.jti, { userId: user.id });
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000,
      });
    }

    const { passwordHash: _, pinHash: __, ...sanitizedUser } = user || {};

    return sendSuccess(res, {
      verified: true,
      user: sanitizedUser,
      token,
      nextStep: 'DASHBOARD',
    });
  } catch (err) {
    next(err);
  }
}

export async function setPin(req, res, next) {
  try {
    const { userId, pin } = req.body;
    const cleanPin = (pin || '').trim();

    const user = userId ? await repository.getUserById(userId) : (req.user || null);
    if (user) {
      user.pinHash = await hashSecret(cleanPin);
      await repository.updateUser(user.id, user);
    }

    return sendSuccess(res, {
      success: true,
      message: 'UPI PIN set successfully.',
      nextStep: 'DASHBOARD',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.sessionJti) {
      await repository.revokeSession(req.sessionJti);
    }

    res.clearCookie('session_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return sendSuccess(res, {
      message: 'Logged out successfully; session revoked.',
    });
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  return sendSuccess(res, {
    user: req.user,
  });
}
