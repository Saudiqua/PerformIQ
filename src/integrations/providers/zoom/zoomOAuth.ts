import { env } from '../../../config/env.js';
import { httpPost } from '../../../utils/http.js';
import { logger } from '../../../config/logger.js';
import { TokenData } from '../../common/providerTypes.js';

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';

export function getZoomConnectUrl(state: string): string {
  if (!env.ZOOM_CLIENT_ID) {
    throw new Error('ZOOM_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: env.ZOOM_CLIENT_ID,
    redirect_uri: env.ZOOM_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/zoom/callback`,
    response_type: 'code',
    state,
  });
  
  return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export async function exchangeZoomCode(code: string): Promise<{ tokens: TokenData }> {
  if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom OAuth credentials not configured');
  }
  
  const basicAuth = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');
  
  const response = await httpPost<ZoomTokenResponse>(
    ZOOM_TOKEN_URL,
    {
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.ZOOM_REDIRECT_URI || `${env.APP_BASE_URL}/oauth/zoom/callback`,
    },
    {
      Authorization: `Basic ${basicAuth}`,
    },
    'form'
  );
  
  logger.debug({ status: response.status }, 'Zoom token exchange response');
  
  if (response.status !== 200 || !response.data.access_token) {
    throw new Error('Zoom OAuth token exchange failed');
  }
  
  return {
    tokens: {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
      scope: response.data.scope,
    },
  };
}
