import { Router } from 'express';
import { z } from 'zod';
import {
  createPayment,
  getPayments,
  getPaymentById,
  confirmStepUp,
} from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { paymentLimiter, confirmStepUpLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createPaymentSchema = z
  .object({
    receiverUpiId: z.string().trim().min(3).max(100).optional(),
    receiverVpa: z.string().trim().min(3).max(100).optional(),
    amountPaise: z.number().int().positive('Amount must be positive integer paise').optional(),
    amount: z.number().positive().optional(),
    note: z.string().trim().max(200).optional().default(''),
    pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional().default('1234'),
    idempotencyKey: z.string().optional(),
  })
  .transform((data) => {
    const receiverUpiId = (data.receiverUpiId || data.receiverVpa || '').trim();
    let amountPaise = data.amountPaise;
    if (amountPaise === undefined && data.amount !== undefined) {
      amountPaise = Math.round(data.amount * 100);
    }
    return {
      ...data,
      receiverUpiId,
      amountPaise,
    };
  })
  .refine((data) => Boolean(data.receiverUpiId && data.receiverUpiId.length >= 3), {
    message: 'receiverUpiId is required',
    path: ['receiverUpiId'],
  })
  .refine((data) => Number.isInteger(data.amountPaise) && (data.amountPaise || 0) > 0, {
    message: 'amountPaise must be positive integer paise',
    path: ['amountPaise'],
  });

const confirmStepUpSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

router.post('/', authenticate, paymentLimiter, validate(createPaymentSchema), createPayment);
router.post('/transfer', authenticate, paymentLimiter, validate(createPaymentSchema), createPayment);
router.get('/', authenticate, getPayments);
router.get('/transactions', authenticate, getPayments);
router.get('/:id', authenticate, getPaymentById);
router.get('/transactions/:id', authenticate, getPaymentById);
router.post(
  '/:id/confirm',
  authenticate,
  confirmStepUpLimiter,
  validate(confirmStepUpSchema),
  confirmStepUp
);

export default router;
