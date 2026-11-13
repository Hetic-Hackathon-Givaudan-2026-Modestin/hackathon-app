import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type pg from 'pg';
import { parseProject } from './project.js';
import type { Scorer } from './scoring.js';

export const MIN_ACCEPTED_SCORE = 65;

const limitWindowMs = 15 * 60 * 1000;
const maxCreations = 20;

type Status = 'pending' | 'accepted' | 'rejected';

const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export function projectsRouter(db: pg.Pool, score: Scorer, demoMode = false): Router {
  const router = Router();
  const attempts = new Map<string, { count: number; expires: number }>();

  router.use('/projects', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/projects', async (req, res) => {
    if (!req.is('application/json')) {
      res.status(415).json({ error: 'Le contenu doit être au format JSON.' });
      return;
    }

    const now = Date.now();
    for (const [ip, entry] of attempts) {
      if (entry.expires <= now) attempts.delete(ip);
    }
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const entry = attempts.get(ip) ?? { count: 0, expires: now + limitWindowMs };
    if (entry.count >= maxCreations) {
      res.set('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      res.status(429).json({ error: 'Trop de projets envoyés. Réessayez plus tard.' });
      return;
    }
    entry.count += 1;
    attempts.set(ip, entry);

    const parsed = parseProject(req.body);
    if ('fields' in parsed) {
      res.status(400).json({
        error: 'Les informations du projet sont invalides.',
        fields: parsed.fields,
      });
      return;
    }
    const project = parsed.value;

    let status: Status = 'pending';
    let projectScore: number | null = null;
    let reason: 'existing-client' | 'score' | null = null;
    if (demoMode) {
      status = 'accepted';
    } else if (project.workedWithGivaudan) {
      status = 'accepted';
      reason = 'existing-client';
    } else {
      try {
        projectScore = await score(project);
        status = projectScore >= MIN_ACCEPTED_SCORE ? 'accepted' : 'rejected';
        reason = 'score';
      } catch (error) {
        // Le projet est conservé en attente plutôt que perdu.
        console.error('Évaluation impossible', error);
      }
    }

    const token = randomBytes(32).toString('base64url');
    const { rows } = await db.query(
      `INSERT INTO projects (access_token_hash, full_name, company, role, email,
         sales_zone, market, product_type, quantity, positioning, budget_per_kg,
         annual_volume_kg, project_stage, launch_timing, worked_with_givaudan,
         description, status, score, decision_reason, decided_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
         $15, $16, $17, $18, $19,
         CASE WHEN $17 = 'pending' THEN NULL ELSE now() END)
       RETURNING id, status`,
      [
        hash(token),
        project.fullName,
        project.company,
        project.role,
        project.email,
        project.salesZone,
        project.market,
        project.productType,
        project.quantity,
        project.positioning,
        project.budgetPerKg,
        project.annualVolumeKg,
        project.projectStage,
        project.launchTiming,
        project.workedWithGivaudan,
        project.description,
        status,
        projectScore,
        reason,
      ],
    );
    res.status(201).json({
      id: rows[0].id,
      status: rows[0].status,
      accessToken: token,
      ...(demoMode ? { demoMode: true } : {}),
    });
  });

  router.get('/projects/:id', async (req, res) => {
    const match = /^Bearer (\S+)$/.exec(req.get('Authorization') ?? '');
    const id = req.params.id;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!match || typeof id !== 'string' || !uuid.test(id)) {
      res.status(401).json({ error: 'Accès au projet refusé.' });
      return;
    }
    const { rows } = await db.query(
      'SELECT id, status, access_token_hash, created_at AS "createdAt" FROM projects WHERE id = $1',
      [id],
    );
    const row = rows[0];
    const expected = Buffer.from(row?.access_token_hash ?? '0'.repeat(64));
    const given = Buffer.from(hash(match[1]!));
    if (!row || expected.length !== given.length || !timingSafeEqual(expected, given)) {
      res.status(401).json({ error: 'Accès au projet refusé.' });
      return;
    }
    res.json({ id: row.id, status: row.status, createdAt: row.createdAt });
  });

  return router;
}
