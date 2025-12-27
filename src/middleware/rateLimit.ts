import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let entry = rateLimits.get(ip);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimits.set(ip, entry);
  }
  
  entry.count++;
  
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
  
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(ip);
    }
  }
}, 60000);
