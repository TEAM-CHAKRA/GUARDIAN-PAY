import { Router } from 'express';
import {
  listTransactions,
  getTransactionById,
  getTransactionSummary,
  approveTransaction,
  rejectTransaction,
  getStats,
  listAudit,
  verifyAudit,
  tamperAudit,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { env } from '../config/env.js';

const router = Router();

// Enforce admin authentication on all admin endpoints
router.use(authenticate, requireAdmin);

router.get('/transactions', listTransactions);
router.get('/transactions/:id', getTransactionById);
router.get('/transactions/:id/summary', getTransactionSummary);
router.post('/transactions/:id/approve', approveTransaction);
router.post('/transactions/:id/reject', rejectTransaction);
router.get('/stats', getStats);
router.get('/audit', listAudit);
router.get('/audit/verify', verifyAudit);

// Demo-only tamper route: Mounted ONLY when DEMO_MODE=true and in development
if (env.DEMO_MODE && env.NODE_ENV === 'development') {
  router.post('/dev/tamper', tamperAudit);
}

export default router;
