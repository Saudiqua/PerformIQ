import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(['message_event', 'email_event', 'meeting_event', 'call_event']).optional(),
  provider: z.enum(['slack', 'gmail', 'outlook', 'teams', 'zoom']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.errors });
      return;
    }
    
    const { from, to, type, provider, limit, cursor } = parsed.data;
    
    let query = supabase
      .from('events')
      .select('*')
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(limit);
    
    if (from) {
      query = query.gte('occurred_at', from);
    }
    
    if (to) {
      query = query.lte('occurred_at', to);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    if (cursor) {
      query = query.lt('occurred_at', cursor);
    }
    
    const { data: events, error } = await query;
    
    if (error) {
      logger.error({ error, orgId }, 'Failed to fetch events');
      res.status(500).json({ error: 'Failed to fetch events' });
      return;
    }
    
    const nextCursor = events && events.length === limit 
      ? events[events.length - 1].occurred_at 
      : null;
    
    res.json({
      events: events || [],
      pagination: {
        limit,
        hasMore: events?.length === limit,
        nextCursor,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Error fetching events');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
