import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  orgId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }
    
    const token = authHeader.slice(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn({ error }, 'Auth validation failed');
      throw new AppError('Invalid or expired token', 401);
    }
    
    req.user = {
      id: user.id,
      email: user.email || '',
    };
    
    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error({ err }, 'Auth middleware error');
    res.status(500).json({ error: 'Authentication error' });
  }
}
