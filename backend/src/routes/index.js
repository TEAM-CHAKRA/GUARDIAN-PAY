import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import walletRoutes from './walletRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import scamRoutes from './scamRoutes.js';
import adminRoutes from './adminRoutes.js';
import linkRoutes from './linkRoutes.js';
import { seedDemoData } from '../../scripts/seed.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/wallets', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/scam-check', scamRoutes);
router.use('/links', linkRoutes);
router.use('/security/links', linkRoutes);
router.use('/admin', adminRoutes);

// Test/Demo environment reset endpoint to restore store baseline
router.post('/test/reset', async (req, res) => {
  try {
    await seedDemoData();
    res.json({ success: true, message: 'Store reset to clean seed state' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
