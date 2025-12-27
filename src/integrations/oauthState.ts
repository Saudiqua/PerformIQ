import { randomBytes } from 'crypto';
import { OAuthState, Provider } from './common/providerTypes.js';
import { logger } from '../config/logger.js';

const STATE_EXPIRY_MS = 10 * 60 * 1000;

const stateStore = new Map<string, OAuthState>();

export function createOAuthState(orgId: string, provider: Provider): string {
  const state = randomBytes(32).toString('hex');
  
  stateStore.set(state, {
    orgId,
    provider,
    createdAt: Date.now(),
  });
  
  logger.debug({ provider, orgId }, 'Created OAuth state');
  
  return state;
}

export function validateOAuthState(state: string): OAuthState | null {
  const stored = stateStore.get(state);
  
  if (!stored) {
    logger.warn({ state }, 'OAuth state not found');
    return null;
  }
  
  stateStore.delete(state);
  
  const isExpired = Date.now() - stored.createdAt > STATE_EXPIRY_MS;
  if (isExpired) {
    logger.warn({ state, provider: stored.provider }, 'OAuth state expired');
    return null;
  }
  
  return stored;
}

setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_EXPIRY_MS) {
      stateStore.delete(state);
    }
  }
}, 60000);
