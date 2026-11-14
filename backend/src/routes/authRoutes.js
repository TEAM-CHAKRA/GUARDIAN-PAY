import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, getMe, verifyOtp, setPin } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional().default('123456'),
  phone: z.string().optional(),
  vpa: z.string().optional(),
});

const loginSchema = z
  .object({
    email: z.string().trim().max(100).optional(),
    identifier: z.string().trim().max(100).optional(),
    password: z.string().min(1, 'Password is required').max(100),
  })
  .refine((data) => data.email || data.identifier, {
    message: 'Email or identifier is required',
  });

const verifyOtpSchema = z.object({
  userId: z.string().optional(),
  otp: z.string().min(4).max(10),
});

const setPinSchema = z.object({
  userId: z.string().optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/set-pin', validate(setPinSchema), setPin);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
