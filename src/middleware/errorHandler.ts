import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logger.warn({ errors: err.errors }, 'Validation error');
    res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ message: err.message, statusCode: err.statusCode }, 'Application error');
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  logger.error({ err, stack: err.stack }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error',
  });
}
