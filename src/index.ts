import { app } from './app.js';
import { logger } from './config/logger.js';
import { startJobRunner } from './jobs/jobRunner.js';
import { isSupabaseConfigured } from './config/env.js';
import { setupVite, serveStatic, log } from './vite.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function main() {
  if (isSupabaseConfigured()) {
    startJobRunner();
  } else {
    logger.warn('Supabase not configured - job runner disabled');
  }

  const server = app;

  if (process.env.NODE_ENV === 'production') {
    serveStatic(server);
  } else {
    await setupVite(server);
  }

  server.listen(PORT, '0.0.0.0', () => {
    log(`PerformIQ server running on port ${PORT}`);
    logger.info({ port: PORT }, 'PerformIQ server running');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
