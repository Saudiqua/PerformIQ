import { app } from './app.js';
import { logger } from './config/logger.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'PerformIQ server running');
});
