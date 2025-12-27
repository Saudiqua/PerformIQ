import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createOAuthState } from '../integrations/oauthState.js';
import { getSlackConnectUrl } from '../integrations/providers/slack/slackOAuth.js';
import { getGmailConnectUrl } from '../integrations/providers/gmail/gmailOAuth.js';
import { getOutlookConnectUrl, getTeamsConnectUrl } from '../integrations/providers/msgraph/msgraphOAuth.js';
import { getZoomConnectUrl } from '../integrations/providers/zoom/zoomOAuth.js';
import { Provider } from '../integrations/common/providerTypes.js';
import { canEncrypt } from '../utils/crypto.js';
import { isSupabaseConfigured } from '../config/env.js';

const router = Router();

const providerSchema = z.enum(['slack', 'gmail', 'outlook', 'teams', 'zoom']);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId;
    
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('id, provider, status, connected_at, settings')
      .eq('org_id', orgId);
    
    if (error) {
      logger.error({ error, orgId }, 'Failed to fetch integrations');
      res.status(500).json({ error: 'Failed to fetch integrations' });
      return;
    }
    
    const oauthEnabled = canEncrypt() && isSupabaseConfigured();
    
    res.json({ 
      integrations: integrations || [],
      oauthEnabled,
    });
  } catch (err) {
    logger.error({ err }, 'Error fetching integrations');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:provider/connect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!canEncrypt()) {
      logger.warn('OAuth connect attempted without encryption configured');
      res.status(503).json({ 
        error: 'OAuth is not available',
        message: 'Token encryption is not configured. Please set ENCRYPTION_KEY_BASE64 environment variable.',
      });
      return;
    }
    
    if (!isSupabaseConfigured()) {
      logger.warn('OAuth connect attempted without Supabase configured');
      res.status(503).json({ 
        error: 'OAuth is not available',
        message: 'Database is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
      });
      return;
    }
    
    const orgId = req.orgId!;
    const provider = providerSchema.parse(req.params.provider) as Provider;
    
    const state = createOAuthState(orgId, provider);
    
    let url: string;
    switch (provider) {
      case 'slack':
        url = getSlackConnectUrl(state);
        break;
      case 'gmail':
        url = getGmailConnectUrl(state);
        break;
      case 'outlook':
        url = getOutlookConnectUrl(state);
        break;
      case 'teams':
        url = getTeamsConnectUrl(state);
        break;
      case 'zoom':
        url = getZoomConnectUrl(state);
        break;
      default:
        res.status(400).json({ error: 'Unknown provider' });
        return;
    }
    
    logger.info({ provider, orgId }, 'Generated OAuth connect URL');
    res.json({ url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid provider' });
      return;
    }
    logger.error({ err }, 'Error generating connect URL');
    res.status(500).json({ error: 'Failed to generate connect URL' });
  }
});

router.post('/:provider/disconnect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const provider = providerSchema.parse(req.params.provider);
    
    const { error } = await supabase
      .from('integrations')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('provider', provider);
    
    if (error) {
      logger.error({ error, orgId, provider }, 'Failed to disconnect integration');
      res.status(500).json({ error: 'Failed to disconnect' });
      return;
    }
    
    logger.info({ provider, orgId }, 'Integration disconnected');
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid provider' });
      return;
    }
    logger.error({ err }, 'Error disconnecting integration');
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
