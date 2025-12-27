import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { syncSlack } from '../integrations/providers/slack/slackSync.js';
import { syncGmail } from '../integrations/providers/gmail/gmailSync.js';
import { syncOutlook, syncTeams } from '../integrations/providers/msgraph/msgraphSync.js';
import { syncZoom } from '../integrations/providers/zoom/zoomSync.js';
import { Provider, SyncResult } from '../integrations/common/providerTypes.js';

interface IntegrationAccount {
  id: string;
  org_id: string;
  provider: Provider;
  token_encrypted: string;
}

export async function runSyncForOrg(orgId: string): Promise<Record<string, SyncResult>> {
  const results: Record<string, SyncResult> = {};
  
  const { data: accounts, error } = await supabase
    .from('integration_accounts')
    .select('id, org_id, provider, token_encrypted')
    .eq('org_id', orgId);
  
  if (error) {
    logger.error({ error, orgId }, 'Failed to fetch integration accounts');
    return results;
  }
  
  if (!accounts || accounts.length === 0) {
    logger.info({ orgId }, 'No integration accounts found for org');
    return results;
  }
  
  for (const account of accounts as IntegrationAccount[]) {
    logger.info({ provider: account.provider, orgId }, 'Running sync for provider');
    
    try {
      let result: SyncResult;
      
      switch (account.provider) {
        case 'slack':
          result = await syncSlack(account.org_id, account.id, account.token_encrypted);
          break;
        case 'gmail':
          result = await syncGmail(account.org_id, account.id, account.token_encrypted);
          break;
        case 'outlook':
          result = await syncOutlook(account.org_id, account.id, account.token_encrypted);
          break;
        case 'teams':
          result = await syncTeams(account.org_id, account.id, account.token_encrypted);
          break;
        case 'zoom':
          result = await syncZoom(account.org_id, account.id, account.token_encrypted);
          break;
        default:
          result = { success: false, eventsProcessed: 0, error: 'Unknown provider' };
      }
      
      results[account.provider] = result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ err, provider: account.provider, orgId }, 'Sync failed');
      results[account.provider] = { success: false, eventsProcessed: 0, error: errorMessage };
    }
  }
  
  return results;
}

export async function runSyncForAllOrgs(): Promise<void> {
  const { data: accounts, error } = await supabase
    .from('integration_accounts')
    .select('org_id')
    .limit(1000);
  
  if (error) {
    logger.error({ error }, 'Failed to fetch integration accounts for scheduled sync');
    return;
  }
  
  const orgIds = [...new Set((accounts || []).map(a => a.org_id))];
  
  logger.info({ orgCount: orgIds.length }, 'Running scheduled sync for all orgs');
  
  for (const orgId of orgIds) {
    try {
      await runSyncForOrg(orgId);
    } catch (err) {
      logger.error({ err, orgId }, 'Scheduled sync failed for org');
    }
  }
}
