import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { runSyncForAllOrgs } from './jobs.js';

let isRunning = false;

export function startJobRunner(): void {
  cron.schedule('*/15 * * * *', async () => {
    if (isRunning) {
      logger.info('Sync job already running, skipping');
      return;
    }
    
    isRunning = true;
    logger.info('Starting scheduled sync job');
    
    try {
      await runSyncForAllOrgs();
      logger.info('Scheduled sync job completed');
    } catch (err) {
      logger.error({ err }, 'Scheduled sync job failed');
    } finally {
      isRunning = false;
    }
  });
  
  logger.info('Job runner started - syncing every 15 minutes');
}
