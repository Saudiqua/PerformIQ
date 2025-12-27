import { request } from 'undici';
import { logger } from '../config/logger.js';

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string | string[] | undefined>;
}

export async function httpGet<T = unknown>(
  url: string,
  headers: Record<string, string> = {}
): Promise<HttpResponse<T>> {
  const { statusCode, headers: respHeaders, body } = await request(url, {
    method: 'GET',
    headers,
  });
  
  const data = await body.json() as T;
  
  return {
    status: statusCode,
    data,
    headers: respHeaders as unknown as Record<string, string | string[] | undefined>,
  };
}

export async function httpPost<T = unknown>(
  url: string,
  payload: Record<string, unknown> | string,
  headers: Record<string, string> = {},
  contentType: 'json' | 'form' = 'json'
): Promise<HttpResponse<T>> {
  let body: string;
  let finalHeaders = { ...headers };
  
  if (contentType === 'form') {
    if (typeof payload === 'string') {
      body = payload;
    } else {
      body = new URLSearchParams(payload as Record<string, string>).toString();
    }
    finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    finalHeaders['Content-Type'] = 'application/json';
  }
  
  logger.debug({ url, contentType }, 'HTTP POST request');
  
  const { statusCode, headers: respHeaders, body: respBody } = await request(url, {
    method: 'POST',
    headers: finalHeaders,
    body,
  });
  
  const data = await respBody.json() as T;
  
  return {
    status: statusCode,
    data,
    headers: respHeaders as unknown as Record<string, string | string[] | undefined>,
  };
}
