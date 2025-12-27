import { supabase } from '../../../config/supabase.js';
import { logger } from '../../../config/logger.js';
import { SyncResult } from '../../common/providerTypes.js';

export async function syncZoom(
  orgId: string,
  accountId: string,
  _tokenEncrypted: string
): Promise<SyncResult> {
  logger.info({ orgId, accountId }, 'Zoom sync not implemented');
  
  await supabase
    .from('sync_state')
    .upsert({
      org_id: orgId,
      provider: 'zoom',
      integration_account_id: accountId,
      last_synced_at: new Date().toISOString(),
      last_error: 'Not implemented',
    }, { onConflict: 'org_id,provider,integration_account_id' });
  
  return { success: true, eventsProcessed: 0, error: 'Not implemented' };
}
