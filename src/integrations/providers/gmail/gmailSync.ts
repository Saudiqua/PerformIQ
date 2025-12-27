import { supabase } from '../../../config/supabase.js';
import { logger } from '../../../config/logger.js';
import { httpGet } from '../../../utils/http.js';
import { decryptTokens } from '../../../utils/crypto.js';
import { gmailInternalDateToDate } from '../../../utils/time.js';
import { normalizeGmailMessage } from './gmailNormalize.js';
import { SyncResult, TokenData } from '../../common/providerTypes.js';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePayload {
  headers: GmailHeader[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: GmailMessagePayload;
}

export async function syncGmail(
  orgId: string,
  accountId: string,
  tokenEncrypted: string
): Promise<SyncResult> {
  let eventsProcessed = 0;
  
  try {
    const tokens = decryptTokens(tokenEncrypted) as TokenData;
    const accessToken = tokens.access_token;
    
    if (!accessToken) {
      throw new Error('No access token found');
    }
    
    const headers = { Authorization: `Bearer ${accessToken}` };
    
    const listResponse = await httpGet<GmailListResponse>(
      `${GMAIL_API}/users/me/messages?q=newer_than:7d&maxResults=100`,
      headers
    );
    
    if (!listResponse.data.messages) {
      logger.info({ orgId }, 'No Gmail messages found');
      await updateSyncState(orgId, accountId, null);
      return { success: true, eventsProcessed: 0 };
    }
    
    logger.info({ messageCount: listResponse.data.messages.length, orgId }, 'Found Gmail messages');
    
    for (const msgRef of listResponse.data.messages) {
      try {
        const msgResponse = await httpGet<GmailMessage>(
          `${GMAIL_API}/users/me/messages/${msgRef.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject`,
          headers
        );
        
        const message = msgResponse.data;
        const occurredAt = gmailInternalDateToDate(message.internalDate);
        
        const { error: rawError } = await supabase
          .from('raw_events')
          .upsert({
            org_id: orgId,
            provider: 'gmail',
            event_type: 'email',
            occurred_at: occurredAt.toISOString(),
            external_id: message.id,
            payload: message,
          }, { onConflict: 'org_id,provider,external_id' });
        
        if (rawError) {
          logger.warn({ error: rawError, messageId: message.id }, 'Failed to upsert raw Gmail event');
        }
        
        const normalizedEvent = normalizeGmailMessage(orgId, message);
        
        const { error: eventError } = await supabase
          .from('events')
          .upsert({
            org_id: normalizedEvent.orgId,
            provider: normalizedEvent.provider,
            type: normalizedEvent.type,
            occurred_at: normalizedEvent.occurredAt.toISOString(),
            actor_email: normalizedEvent.actorEmail,
            channel_or_thread_id: normalizedEvent.channelOrThreadId,
            external_id: normalizedEvent.externalId,
            subject: normalizedEvent.subject,
            body_preview: normalizedEvent.bodyPreview,
            participants: normalizedEvent.participants,
            metadata: normalizedEvent.metadata,
          }, { onConflict: 'org_id,provider,external_id' });
        
        if (eventError) {
          logger.warn({ error: eventError, messageId: message.id }, 'Failed to upsert Gmail event');
        } else {
          eventsProcessed++;
        }
      } catch (err) {
        logger.error({ err, messageId: msgRef.id }, 'Error processing Gmail message');
      }
    }
    
    await updateSyncState(orgId, accountId, null);
    
    logger.info({ eventsProcessed, orgId }, 'Gmail sync completed');
    
    return { success: true, eventsProcessed };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, orgId }, 'Gmail sync failed');
    
    await updateSyncState(orgId, accountId, errorMessage);
    
    return { success: false, eventsProcessed, error: errorMessage };
  }
}

async function updateSyncState(orgId: string, accountId: string, error: string | null) {
  await supabase
    .from('sync_state')
    .upsert({
      org_id: orgId,
      provider: 'gmail',
      integration_account_id: accountId,
      last_synced_at: new Date().toISOString(),
      last_success_at: error ? undefined : new Date().toISOString(),
      last_error: error,
    }, { onConflict: 'org_id,provider,integration_account_id' });
}
