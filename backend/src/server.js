import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { seedDemoData } from '../scripts/seed.js';

const PORT = env.PORT || 4000;

async function startServer() {
  try {
    // Auto-seed demo accounts in development/demo mode
    if (env.DEMO_MODE) {
      await seedDemoData();
      logger.info('Demo seed data populated successfully.');
    }

    app.listen(PORT, () => {
      logger.info(`GUARDIANPAY Backend listening on http://localhost:${PORT}`);
      logger.info(`Health check accessible at http://localhost:${PORT}/api/health`);
      logger.info(`Environment: ${env.NODE_ENV} | DEMO_MODE: ${env.DEMO_MODE}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

startServer();
