import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { validateOAuthState } from '../integrations/oauthState.js';
import { exchangeSlackCode } from '../integrations/providers/slack/slackOAuth.js';
import { exchangeGmailCode } from '../integrations/providers/gmail/gmailOAuth.js';
import { exchangeMSCode } from '../integrations/providers/msgraph/msgraphOAuth.js';
import { exchangeZoomCode } from '../integrations/providers/zoom/zoomOAuth.js';
import { encryptTokens, canEncrypt } from '../utils/crypto.js';
import { Provider } from '../integrations/common/providerTypes.js';
import { env, isSupabaseConfigured } from '../config/env.js';

const router = Router();

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

async function handleCallback(
  provider: Provider,
  code: string,
  orgId: string
): Promise<{ integrationId: string; accountId: string }> {
  let externalAccountId: string;
  let externalAccountEmail: string | null = null;
  let tokenEncrypted: string;
  let tokenExpiresAt: string | null = null;
  let hasRefreshToken = false;
  
  switch (provider) {
    case 'slack': {
      const result = await exchangeSlackCode(code);
      externalAccountId = result.teamId;
      externalAccountEmail = null;
      tokenEncrypted = encryptTokens(result.tokens);
      hasRefreshToken = false;
      break;
    }
    case 'gmail': {
      const result = await exchangeGmailCode(code);
      externalAccountId = result.email;
      externalAccountEmail = result.email;
      tokenEncrypted = encryptTokens(result.tokens);
      hasRefreshToken = !!result.tokens.refresh_token;
      if (result.tokens.expires_in) {
        tokenExpiresAt = new Date(Date.now() + result.tokens.expires_in * 1000).toISOString();
      }
      break;
    }
    case 'outlook':
    case 'teams': {
      const result = await exchangeMSCode(code, provider);
      externalAccountId = result.email || 'account';
      externalAccountEmail = result.email || null;
      tokenEncrypted = encryptTokens(result.tokens);
      hasRefreshToken = !!result.tokens.refresh_token;
      if (result.tokens.expires_in) {
        tokenExpiresAt = new Date(Date.now() + (result.tokens.expires_in as number) * 1000).toISOString();
      }
      break;
    }
    case 'zoom': {
      const result = await exchangeZoomCode(code);
      externalAccountId = 'zoom_user';
      tokenEncrypted = encryptTokens(result.tokens);
      hasRefreshToken = !!result.tokens.refresh_token;
      if (result.tokens.expires_in) {
        tokenExpiresAt = new Date(Date.now() + (result.tokens.expires_in as number) * 1000).toISOString();
      }
      break;
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
  
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .single();
  
  let integrationId: string;
  
  if (existingIntegration) {
    integrationId = existingIntegration.id;
    await supabase
      .from('integrations')
      .update({
        status: 'connected',
        connected_at: new Date().toISOString(),
      })
      .eq('id', integrationId);
  } else {
    const { data: newIntegration, error: insertError } = await supabase
      .from('integrations')
      .insert({
        org_id: orgId,
        provider,
        status: 'connected',
        connected_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (insertError || !newIntegration) {
      throw new Error('Failed to create integration');
    }
    integrationId = newIntegration.id;
  }
  
  const { data: existingAccount } = await supabase
    .from('integration_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .eq('external_account_id', externalAccountId)
    .single();
  
  let accountId: string;
  
  if (existingAccount) {
    accountId = existingAccount.id;
    await supabase
      .from('integration_accounts')
      .update({
        token_encrypted: tokenEncrypted,
        token_expires_at: tokenExpiresAt,
        refresh_token_present: hasRefreshToken,
        external_account_email: externalAccountEmail,
      })
      .eq('id', accountId);
  } else {
    const { data: newAccount, error: accountError } = await supabase
      .from('integration_accounts')
      .insert({
        org_id: orgId,
        integration_id: integrationId,
        provider,
        external_account_id: externalAccountId,
        external_account_email: externalAccountEmail,
        token_encrypted: tokenEncrypted,
        token_expires_at: tokenExpiresAt,
        refresh_token_present: hasRefreshToken,
      })
      .select('id')
      .single();
    
    if (accountError || !newAccount) {
      throw new Error('Failed to create integration account');
    }
    accountId = newAccount.id;
  }
  
  return { integrationId, accountId };
}

router.get('/:provider/callback', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as Provider;
    
    if (!['slack', 'gmail', 'outlook', 'teams', 'zoom'].includes(provider)) {
      res.status(400).send('Invalid provider');
      return;
    }
    
    if (!canEncrypt()) {
      logger.error('OAuth callback received but encryption not configured');
      res.status(503).send('OAuth is not available - token encryption not configured');
      return;
    }
    
    if (!isSupabaseConfigured()) {
      logger.error('OAuth callback received but Supabase not configured');
      res.status(503).send('OAuth is not available - database not configured');
      return;
    }
    
    const query = callbackQuerySchema.safeParse(req.query);
    if (!query.success) {
      logger.warn({ query: req.query, errors: query.error }, 'Invalid callback query params');
      res.status(400).send('Invalid callback parameters');
      return;
    }
    
    const stateData = validateOAuthState(query.data.state);
    if (!stateData) {
      res.status(400).send('Invalid or expired state');
      return;
    }
    
    if (stateData.provider !== provider) {
      res.status(400).send('State provider mismatch');
      return;
    }
    
    logger.info({ provider, orgId: stateData.orgId }, 'Processing OAuth callback');
    
    await handleCallback(provider, query.data.code, stateData.orgId);
    
    logger.info({ provider, orgId: stateData.orgId }, 'OAuth callback successful');
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Integration Connected</title></head>
        <body>
          <h1>Successfully connected ${provider}!</h1>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth_complete', provider: '${provider}' }, '${env.APP_BASE_URL}');
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    logger.error({ err, provider: req.params.provider }, 'OAuth callback error');
    res.status(500).send('Failed to complete OAuth flow');
  }
});

export default router;
