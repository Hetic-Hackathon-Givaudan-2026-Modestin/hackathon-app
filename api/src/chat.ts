import { createHash } from 'node:crypto';
import { Router, type Request } from 'express';
import type pg from 'pg';

type ChatAnswer = { conversationId: number; answer: string };
type ChatService = (question: string, context: string, conversationId: number | null) => Promise<ChatAnswer>;

export function createChatService(baseUrl: string | undefined, apiKey: string): ChatService {
  return async (question, context, conversationId) => {
    if (!baseUrl) throw new Error("SCORING_BASE_URL n'est pas configuré.");
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ question, context, conversation_id: conversationId }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Chat : HTTP ${response.status}`);
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' ||
        !('answer' in result) || typeof result.answer !== 'string' || !result.answer.trim() ||
        !('conversation_id' in result) || typeof result.conversation_id !== 'number' ||
        !Number.isSafeInteger(result.conversation_id) || result.conversation_id < 1 ||
        (conversationId !== null && result.conversation_id !== conversationId)) {
      throw new Error('Chat : réponse invalide.');
    }
    return { answer: result.answer.trim(), conversationId: result.conversation_id };
  };
}

function credentials(req: Request): { id: string; tokenHash: string } | null {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('Authorization') ?? '');
  const id = req.params.id;
  if (!match || typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  return { id, tokenHash: createHash('sha256').update(match[1]).digest('hex') };
}

export function chatRouter(db: pg.Pool, ask: ChatService): Router {
  const router = Router();
  router.use('/projects/:id/chat', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/projects/:id/chat', async (req, res) => {
    const auth = credentials(req);
    if (!auth) {
      res.status(401).json({ error: 'Accès au projet refusé.' });
      return;
    }
    const project = await db.query(
      `SELECT status, market, product_type AS "productType",
         budget_per_kg::float8 AS "budgetPerKg",
         annual_volume_kg::float8 AS "annualVolumeKg",
         sales_zone AS "salesZone", positioning, project_stage AS "projectStage",
         launch_timing AS "launchTiming", description
       FROM projects WHERE id = $1 AND access_token_hash = $2`,
      [auth.id, auth.tokenHash],
    );
    if (!project.rows[0]) {
      res.status(401).json({ error: 'Accès au projet refusé.' });
      return;
    }
    if (project.rows[0].status !== 'accepted') {
      res.status(403).json({ error: 'Le chat est réservé aux projets acceptés.' });
      return;
    }
    const messages = await db.query(
      'SELECT role, content FROM project_messages WHERE project_id = $1 ORDER BY id',
      [auth.id],
    );
    const {
      market, productType, budgetPerKg, annualVolumeKg, salesZone,
      positioning, projectStage, launchTiming, description,
    } = project.rows[0];
    res.json({
      project: {
        market, productType, budgetPerKg, annualVolumeKg, salesZone,
        positioning, projectStage, launchTiming, description,
      },
      messages: messages.rows,
    });
  });

  router.post('/projects/:id/chat', async (req, res) => {
    const auth = credentials(req);
    if (!auth) {
      res.status(401).json({ error: 'Accès au projet refusé.' });
      return;
    }
    const message = req.body?.message;
    if (!req.is('application/json') || typeof message !== 'string' ||
        !message.trim() || message.length > 4000) {
      res.status(400).json({ error: 'Indiquez un message de 1 à 4000 caractères.' });
      return;
    }
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT status, description, chat_conversation_id FROM projects WHERE id = $1 AND access_token_hash = $2 FOR UPDATE',
        [auth.id, auth.tokenHash],
      );
      if (!rows[0] || rows[0].status !== 'accepted') {
        await client.query('ROLLBACK');
        res.status(rows[0] ? 403 : 401).json({ error: rows[0] ? 'Le chat est réservé aux projets acceptés.' : 'Accès au projet refusé.' });
        return;
      }
      let result: ChatAnswer;
      try {
        result = await ask(message.trim(), rows[0].description, rows[0].chat_conversation_id);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Chat indisponible', error);
        res.status(502).json({ error: 'Le chat est indisponible. Réessayez plus tard.' });
        return;
      }
      await client.query('UPDATE projects SET chat_conversation_id = $1 WHERE id = $2', [result.conversationId, auth.id]);
      await client.query(
        "INSERT INTO project_messages (project_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)",
        [auth.id, message.trim(), result.answer],
      );
      await client.query('COMMIT');
      res.json({ answer: result.answer });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  return router;
}
