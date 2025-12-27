import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AppError } from './errorHandler.js';
import { AuthenticatedRequest } from './auth.js';

export async function orgMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      throw new AppError('Missing X-Org-Id header', 400);
    }
    
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    
    const { data: membership, error } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !membership) {
      logger.warn({ userId: req.user.id, orgId }, 'User not a member of organization');
      throw new AppError('Not a member of this organization', 403);
    }
    
    req.orgId = orgId;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error({ err }, 'Org middleware error');
    res.status(500).json({ error: 'Organization validation error' });
  }
}
