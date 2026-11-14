import { Router } from 'express';
import { z } from 'zod';
import { checkScam } from '../controllers/scamController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { scamCheckLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const scamCheckSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
});

router.post('/', authenticate, scamCheckLimiter, validate(scamCheckSchema), checkScam);

export default router;
