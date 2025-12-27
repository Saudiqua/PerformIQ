import express from 'express';
import healthRouter from './routes/health.js';
import integrationsRouter from './routes/integrations.js';
import oauthRouter from './routes/oauth.js';
import eventsRouter from './routes/events.js';
import adminRouter from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { orgMiddleware } from './middleware/org.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

app.use('/health', healthRouter);

app.use('/oauth', rateLimitMiddleware, oauthRouter);

app.use('/api', rateLimitMiddleware);
app.use('/api/integrations', authMiddleware, orgMiddleware, integrationsRouter);
app.use('/api/events', authMiddleware, orgMiddleware, eventsRouter);
app.use('/api/admin', authMiddleware, orgMiddleware, adminRouter);

app.use(errorHandler);
