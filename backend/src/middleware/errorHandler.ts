import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn('request_error', err.message, { code: err.code, statusCode: err.statusCode });
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error('unhandled_error', err instanceof Error ? err.message : 'Unknown error', {
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: 'Internal server error' });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
