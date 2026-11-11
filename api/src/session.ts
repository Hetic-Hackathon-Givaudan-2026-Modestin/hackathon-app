import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

const cookieName = 'givbot_session';
export const sessionDurationMs = 12 * 60 * 60 * 1000;

export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionToken(req: Request): string | null {
  const cookies = (req.headers.cookie ?? '').split(';');
  const matches = cookies.map((cookie) => cookie.trim()).filter((cookie) => cookie.startsWith(`${cookieName}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionDurationMs });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(cookieName, cookieOptions);
}
