import type { Request, Response, NextFunction } from 'express';

export interface SessionUser {
  id: string;
  email: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function getSessionUser(req: Request): SessionUser | undefined {
  return req.session.user;
}
