import express from 'express';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

app.use('/health', healthRouter);

app.use(errorHandler);
