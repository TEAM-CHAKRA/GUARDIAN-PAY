import { Router } from 'express';
import { getWallet, lookupPayee } from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { walletLookupLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', authenticate, getWallet);
router.get('/me', authenticate, getWallet);
router.get('/lookup/:upiId', authenticate, walletLookupLimiter, lookupPayee);

export default router;
