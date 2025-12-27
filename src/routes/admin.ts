import { Router, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { runSyncForOrg } from '../jobs/jobs.js';

const router = Router();

router.post('/jobs/run', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    
    logger.info({ orgId }, 'Manual sync triggered');
    
    const results = await runSyncForOrg(orgId);
    
    res.json({ success: true, results });
  } catch (err) {
    logger.error({ err }, 'Failed to run manual sync');
    res.status(500).json({ error: 'Failed to run sync' });
  }
});

router.get('/jobs/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    
    const { data: syncStates, error } = await supabase
      .from('sync_state')
      .select('*')
      .eq('org_id', orgId);
    
    if (error) {
      logger.error({ error, orgId }, 'Failed to fetch sync states');
      res.status(500).json({ error: 'Failed to fetch sync status' });
      return;
    }
    
    res.json({ syncStates: syncStates || [] });
  } catch (err) {
    logger.error({ err }, 'Error fetching sync status');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
