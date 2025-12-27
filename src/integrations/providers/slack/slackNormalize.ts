import { NormalizedEvent } from '../../common/providerTypes.js';
import { truncate } from '../../common/normalizeCommon.js';
import { slackTsToDate } from '../../../utils/time.js';

interface SlackChannel {
  id: string;
  name: string;
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

export function normalizeSlackMessage(
  orgId: string,
  channel: SlackChannel,
  message: SlackMessage
): NormalizedEvent {
  const externalId = `${channel.id}:${message.ts}`;
  const channelOrThreadId = message.thread_ts 
    ? `${channel.id}:${message.thread_ts}`
    : channel.id;
  
  const reactionCount = message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
  
  return {
    orgId,
    provider: 'slack',
    type: 'message_event',
    occurredAt: slackTsToDate(message.ts),
    actorExternalId: message.user,
    channelOrThreadId,
    externalId,
    bodyPreview: truncate(message.text, 500),
    metadata: {
      channelName: channel.name,
      replyCount: message.reply_count || 0,
      reactionCount,
      subtype: message.subtype,
      isThreadReply: !!message.thread_ts && message.thread_ts !== message.ts,
    },
  };
}
