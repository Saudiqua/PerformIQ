export type Provider = 'slack' | 'gmail' | 'outlook' | 'teams' | 'zoom';

export type EventType = 'message_event' | 'email_event' | 'meeting_event' | 'call_event';

export interface OAuthState {
  orgId: string;
  provider: Provider;
  createdAt: number;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  [key: string]: unknown;
}

export interface NormalizedEvent {
  orgId: string;
  provider: Provider;
  type: EventType;
  occurredAt: Date;
  actorExternalId?: string;
  actorEmail?: string;
  channelOrThreadId?: string;
  externalId: string;
  subject?: string;
  bodyPreview?: string;
  participants?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  eventsProcessed: number;
  cursor?: string;
  error?: string;
}
