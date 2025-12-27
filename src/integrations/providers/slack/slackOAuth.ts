import { env } from '../../../config/env.js';
import { httpPost } from '../../../utils/http.js';
import { logger } from '../../../config/logger.js';
import { TokenData } from '../../common/providerTypes.js';

const SLACK_OAUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';

const SLACK_SCOPES = [
  'channels:history',
  'channels:read',
  'groups:history',
  'groups:read',
  'im:history',
  'im:read',
  'mpim:history',
  'mpim:read',
  'users:read',
  'team:read',
].join(',');

export function getSlackConnectUrl(state: string): string {
  if (!env.SLACK_CLIENT_ID) {
    throw new Error('SLACK_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    scope: SLACK_SCOPES,
    redirect_uri: env.SLACK_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/slack/callback`,
    state,
  });
  
  return `${SLACK_OAUTH_URL}?${params.toString()}`;
}

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
  };
}

export async function exchangeSlackCode(code: string): Promise<{ tokens: TokenData; teamId: string; teamName: string }> {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    throw new Error('Slack OAuth credentials not configured');
  }
  
  const response = await httpPost<SlackOAuthResponse>(
    SLACK_TOKEN_URL,
    {
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: env.SLACK_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/slack/callback`,
    },
    {},
    'form'
  );
  
  logger.debug({ status: response.status, ok: response.data.ok }, 'Slack token exchange response');
  
  if (!response.data.ok || !response.data.access_token) {
    throw new Error(`Slack OAuth failed: ${response.data.error || 'Unknown error'}`);
  }
  
  return {
    tokens: {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      scope: response.data.scope,
    },
    teamId: response.data.team?.id || '',
    teamName: response.data.team?.name || '',
  };
}
