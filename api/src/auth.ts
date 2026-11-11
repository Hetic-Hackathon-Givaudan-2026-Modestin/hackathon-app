import { Router } from 'express';
import type pg from 'pg';
import { verifyPassword } from './registration.js';
import {
  clearSessionCookie,
  newSessionToken,
  sessionToken,
  setSessionCookie,
  tokenHash,
} from './session.js';

const dummyHash = `scrypt$32768$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;
const limitWindowMs = 15 * 60 * 1000;
const maxAttempts = 10;

export function authRouter(db: pg.Pool): Router {
  const router = Router();
  const attempts = new Map<string, { count: number; expires: number }>();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/session', async (req, res) => {
    if (!req.is('application/json') || req.get('Sec-Fetch-Site') === 'cross-site') {
      res.status(403).json({ error: 'Requête refusée.' });
      return;
    }

    const now = Date.now();
    for (const [ip, entry] of attempts) {
      if (entry.expires <= now) attempts.delete(ip);
    }
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const entry = attempts.get(ip) ?? { count: 0, expires: now + limitWindowMs };
    if (entry.count >= maxAttempts) {
      res.set('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
      return;
    }
    entry.count += 1;
    attempts.set(ip, entry);

    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' ||
        email.length > 254 || password.length > 256 || !email.trim() || !password) {
      res.status(400).json({ error: 'Renseignez un email et un mot de passe valides.' });
      return;
    }
    const { rows } = await db.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    const user = rows[0];
    const valid = await verifyPassword(password, user?.password_hash ?? dummyHash);
    if (!user || !valid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }
    const oldToken = sessionToken(req);
    const token = newSessionToken();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      if (oldToken) {
        await client.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash(oldToken)]);
      }
      await client.query('DELETE FROM user_sessions WHERE expires_at <= now()');
      await client.query(
        "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '12 hours')",
        [tokenHash(token), user.id],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    attempts.delete(ip);
    setSessionCookie(res, token);
    res.status(204).end();
  });

  router.get('/session', async (req, res) => {
    const token = sessionToken(req);
    if (!token) {
      res.status(401).json({ error: 'Vous devez vous connecter.' });
      return;
    }
    const { rows } = await db.query(
      `SELECT users.id, users.full_name AS "fullName", users.email, users.company,
              users.sector, users.role, users.created_at AS "createdAt"
       FROM user_sessions JOIN users ON users.id = user_sessions.user_id
       WHERE user_sessions.token_hash = $1 AND user_sessions.expires_at > now()`,
      [tokenHash(token)],
    );
    if (!rows[0]) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'Vous devez vous connecter.' });
      return;
    }
    res.json(rows[0]);
  });

  router.delete('/session', async (req, res) => {
    if (!req.is('application/json') || req.get('Sec-Fetch-Site') === 'cross-site') {
      res.status(403).json({ error: 'Requête refusée.' });
      return;
    }
    const token = sessionToken(req);
    if (token) await db.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash(token)]);
    clearSessionCookie(res);
    res.status(204).end();
  });

  return router;
}
