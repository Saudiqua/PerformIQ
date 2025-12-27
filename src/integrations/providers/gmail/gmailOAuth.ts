import { env } from '../../../config/env.js';
import { httpPost, httpGet } from '../../../utils/http.js';
import { logger } from '../../../config/logger.js';
import { TokenData } from '../../common/providerTypes.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_PROFILE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ');

export function getGmailConnectUrl(state: string): string {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/gmail/callback`,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface GmailProfileResponse {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export async function exchangeGmailCode(code: string): Promise<{ tokens: TokenData; email: string }> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  const tokenResponse = await httpPost<GoogleTokenResponse>(
    GOOGLE_TOKEN_URL,
    {
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: env.GOOGLE_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/gmail/callback`,
      grant_type: 'authorization_code',
    },
    {},
    'form'
  );
  
  logger.debug({ status: tokenResponse.status }, 'Gmail token exchange response');
  
  if (tokenResponse.status !== 200 || !tokenResponse.data.access_token) {
    throw new Error('Gmail OAuth token exchange failed');
  }
  
  const profileResponse = await httpGet<GmailProfileResponse>(
    GMAIL_PROFILE_URL,
    {
      Authorization: `Bearer ${tokenResponse.data.access_token}`,
    }
  );
  
  if (profileResponse.status !== 200) {
    throw new Error('Failed to fetch Gmail profile');
  }
  
  return {
    tokens: {
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
      expires_in: tokenResponse.data.expires_in,
      token_type: tokenResponse.data.token_type,
      scope: tokenResponse.data.scope,
    },
    email: profileResponse.data.emailAddress,
  };
}
