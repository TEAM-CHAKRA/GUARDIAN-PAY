import { Router } from 'express';
import { z } from 'zod';
import { verifyLink, handleRedirect } from '../controllers/linkController.js';
import { validate } from '../middleware/validate.js';
import { linkVerifyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const verifyLinkSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').max(2048, 'URL exceeds maximum length of 2048 characters'),
});

router.post('/verify', linkVerifyLimiter, validate(verifyLinkSchema), verifyLink);
router.get('/redirect', handleRedirect);

export default router;
