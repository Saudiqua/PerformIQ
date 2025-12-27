import { NormalizedEvent } from '../../common/providerTypes.js';
import { truncate, extractEmailFromHeader, parseEmailAddresses } from '../../common/normalizeCommon.js';
import { gmailInternalDateToDate } from '../../../utils/time.js';

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: GmailHeader[];
  };
}

function getHeader(headers: GmailHeader[], name: string): string | undefined {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value;
}

export function normalizeGmailMessage(
  orgId: string,
  message: GmailMessage
): NormalizedEvent {
  const headers = message.payload.headers;
  
  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const cc = getHeader(headers, 'Cc');
  const subject = getHeader(headers, 'Subject');
  
  const actorEmail = extractEmailFromHeader(from);
  const toAddresses = parseEmailAddresses(to);
  const ccAddresses = parseEmailAddresses(cc);
  
  const participants = [
    ...(actorEmail ? [{ email: actorEmail, role: 'from' }] : []),
    ...toAddresses.map(email => ({ email, role: 'to' })),
    ...ccAddresses.map(email => ({ email, role: 'cc' })),
  ];
  
  return {
    orgId,
    provider: 'gmail',
    type: 'email_event',
    occurredAt: gmailInternalDateToDate(message.internalDate),
    actorEmail,
    channelOrThreadId: message.threadId,
    externalId: message.id,
    subject: truncate(subject, 500),
    bodyPreview: truncate(message.snippet, 500),
    participants,
    metadata: {
      labelIds: message.labelIds,
      fromHeader: from,
    },
  };
}
