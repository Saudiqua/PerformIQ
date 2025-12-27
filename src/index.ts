import { app } from './app.js';
import { logger } from './config/logger.js';
import { startJobRunner } from './jobs/jobRunner.js';
import { isSupabaseConfigured } from './config/env.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

if (isSupabaseConfigured()) {
  startJobRunner();
} else {
  logger.warn('Supabase not configured - job runner disabled');
}

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'PerformIQ server running');
});
