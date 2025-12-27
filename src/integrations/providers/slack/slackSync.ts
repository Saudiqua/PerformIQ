import { supabase } from '../../../config/supabase.js';
import { logger } from '../../../config/logger.js';
import { httpGet } from '../../../utils/http.js';
import { decryptTokens } from '../../../utils/crypto.js';
import { daysAgo, slackTsToDate, dateToSlackTs } from '../../../utils/time.js';
import { normalizeSlackMessage } from './slackNormalize.js';
import { SyncResult, TokenData } from '../../common/providerTypes.js';

const SLACK_API = 'https://slack.com/api';

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
}

interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: { name: string; count: number }[];
  subtype?: string;
}

interface SlackConversationsListResponse {
  ok: boolean;
  channels?: SlackChannel[];
  error?: string;
}

interface SlackHistoryResponse {
  ok: boolean;
  messages?: SlackMessage[];
  has_more?: boolean;
  response_metadata?: { next_cursor?: string };
  error?: string;
}

export async function syncSlack(
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
    
    const channelsResponse = await httpGet<SlackConversationsListResponse>(
      `${SLACK_API}/conversations.list?types=public_channel,private_channel&limit=200`,
      headers
    );
    
    if (!channelsResponse.data.ok) {
      throw new Error(`Slack API error: ${channelsResponse.data.error}`);
    }
    
    const channels = channelsResponse.data.channels || [];
    logger.info({ channelCount: channels.length, orgId }, 'Fetched Slack channels');
    
    const oldest = dateToSlackTs(daysAgo(7));
    
    for (const channel of channels.slice(0, 10)) {
      try {
        const historyResponse = await httpGet<SlackHistoryResponse>(
          `${SLACK_API}/conversations.history?channel=${channel.id}&oldest=${oldest}&limit=200`,
          headers
        );
        
        if (!historyResponse.data.ok) {
          logger.warn({ error: historyResponse.data.error, channel: channel.id }, 'Failed to fetch channel history');
          continue;
        }
        
        const messages = historyResponse.data.messages || [];
        logger.debug({ channel: channel.name, messageCount: messages.length }, 'Fetched channel messages');
        
        for (const message of messages) {
          if (!message.user || message.subtype === 'channel_join' || message.subtype === 'channel_leave') {
            continue;
          }
          
          const externalId = `${channel.id}:${message.ts}`;
          const occurredAt = slackTsToDate(message.ts);
          
          const { error: rawError } = await supabase
            .from('raw_events')
            .upsert({
              org_id: orgId,
              provider: 'slack',
              event_type: 'message',
              occurred_at: occurredAt.toISOString(),
              external_id: externalId,
              payload: message,
            }, { onConflict: 'org_id,provider,external_id' });
          
          if (rawError) {
            logger.warn({ error: rawError, externalId }, 'Failed to upsert raw event');
          }
          
          const normalizedEvent = normalizeSlackMessage(orgId, channel, message);
          
          const { error: eventError } = await supabase
            .from('events')
            .upsert({
              org_id: normalizedEvent.orgId,
              provider: normalizedEvent.provider,
              type: normalizedEvent.type,
              occurred_at: normalizedEvent.occurredAt.toISOString(),
              actor_external_id: normalizedEvent.actorExternalId,
              channel_or_thread_id: normalizedEvent.channelOrThreadId,
              external_id: normalizedEvent.externalId,
              body_preview: normalizedEvent.bodyPreview,
              metadata: normalizedEvent.metadata,
            }, { onConflict: 'org_id,provider,external_id' });
          
          if (eventError) {
            logger.warn({ error: eventError, externalId }, 'Failed to upsert event');
          } else {
            eventsProcessed++;
          }
        }
      } catch (err) {
        logger.error({ err, channel: channel.id }, 'Error processing channel');
      }
    }
    
    await supabase
      .from('sync_state')
      .upsert({
        org_id: orgId,
        provider: 'slack',
        integration_account_id: accountId,
        last_synced_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
      }, { onConflict: 'org_id,provider,integration_account_id' });
    
    logger.info({ eventsProcessed, orgId }, 'Slack sync completed');
    
    return { success: true, eventsProcessed };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, orgId }, 'Slack sync failed');
    
    await supabase
      .from('sync_state')
      .upsert({
        org_id: orgId,
        provider: 'slack',
        integration_account_id: accountId,
        last_synced_at: new Date().toISOString(),
        last_error: errorMessage,
      }, { onConflict: 'org_id,provider,integration_account_id' });
    
    return { success: false, eventsProcessed, error: errorMessage };
  }
}
