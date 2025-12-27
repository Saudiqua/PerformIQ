import { env } from '../../../config/env.js';
import { httpPost } from '../../../utils/http.js';
import { logger } from '../../../config/logger.js';
import { TokenData } from '../../common/providerTypes.js';

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

const OUTLOOK_SCOPES = [
  'openid',
  'profile',
  'email',
  'Mail.Read',
  'offline_access',
].join(' ');

const TEAMS_SCOPES = [
  'openid',
  'profile',
  'email',
  'Chat.Read',
  'ChannelMessage.Read.All',
  'offline_access',
].join(' ');

export function getOutlookConnectUrl(state: string): string {
  if (!env.MS_CLIENT_ID) {
    throw new Error('MS_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    redirect_uri: env.MS_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/outlook/callback`,
    response_type: 'code',
    scope: OUTLOOK_SCOPES,
    state,
  });
  
  return `${MS_AUTH_URL}?${params.toString()}`;
}

export function getTeamsConnectUrl(state: string): string {
  if (!env.MS_CLIENT_ID) {
    throw new Error('MS_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    redirect_uri: env.MS_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/teams/callback`,
    response_type: 'code',
    scope: TEAMS_SCOPES,
    state,
  });
  
  return `${MS_AUTH_URL}?${params.toString()}`;
}

interface MSTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export async function exchangeMSCode(code: string, provider: 'outlook' | 'teams'): Promise<{ tokens: TokenData; email: string }> {
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    throw new Error('Microsoft OAuth credentials not configured');
  }
  
  const scopes = provider === 'outlook' ? OUTLOOK_SCOPES : TEAMS_SCOPES;
  const redirectUri = env.MS_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/${provider}/callback`;
  
  const response = await httpPost<MSTokenResponse>(
    MS_TOKEN_URL,
    {
      client_id: env.MS_CLIENT_ID,
      client_secret: env.MS_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: scopes,
    },
    {},
    'form'
  );
  
  logger.debug({ status: response.status, provider }, 'MS token exchange response');
  
  if (response.status !== 200 || !response.data.access_token) {
    throw new Error(`MS OAuth token exchange failed for ${provider}`);
  }
  
  return {
    tokens: {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
      scope: response.data.scope,
    },
    email: '',
  };
}
