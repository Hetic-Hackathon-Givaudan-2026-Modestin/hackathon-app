import express, { type NextFunction, type Request, type Response } from 'express';
import pg from 'pg';
import { hashPassword, parseRegistration } from './registration.js';
import { authRouter } from './auth.js';
import { projectsRouter } from './projects.js';
import { createScorer } from './scoring.js';

// En dev, la configuration vient de api/.env ; en production, de l'hébergeur
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde l'environnement tel quel
}

const {
  DATABASE_URL,
  AI_BASE_URL,
  AI_MODEL,
  AI_API_KEY = '',
  SCORING_BASE_URL,
  SCORING_API_KEY = '',
} = process.env;
const PORT = Number(process.env.PORT ?? 3000);

const db = new pg.Pool({ connectionString: DATABASE_URL });
const app = express();

app.use('/api/users', express.json({ strict: false }));
app.use('/api/users', (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (
    error instanceof SyntaxError &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ error: "Les informations d'inscription sont invalides." });
    return;
  }
  next(error);
});

app.post('/api/users', async (req, res) => {
  const registration = parseRegistration(req.body);
  if (!registration) {
    res
      .status(400)
      .json({ error: "Les informations d'inscription sont invalides." });
    return;
  }

  const passwordHash = await hashPassword(registration.password);
  try {
    const { rows } = await db.query(
      `INSERT INTO users (full_name, email, company, sector, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name AS "fullName", email, company, sector, role, created_at AS "createdAt"`,
      [
        registration.fullName,
        registration.email,
        registration.company,
        registration.sector,
        registration.role,
        passwordHash,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (
      error instanceof pg.DatabaseError &&
      error.code === '23505' &&
      error.constraint === 'users_email_unique'
    ) {
      res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
      return;
    }
    throw error;
  }
});

app.use(express.json());

app.use('/api', authRouter(db));
app.use('/api', projectsRouter(db, createScorer(SCORING_BASE_URL, SCORING_API_KEY)));

app.get('/api/health', async (_req, res) => {
  const { rows } = await db.query('SELECT version()');
  res.json({ status: 'ok', db: rows[0].version });
});

app.get('/api/questions', async (_req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM questions ORDER BY id DESC LIMIT 10',
  );
  res.json(rows);
});

app.post('/api/questions', async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (!question) {
    res.status(400).json({ error: 'Question manquante' });
    return;
  }
  const answer = await ask(question);
  const { rows } = await db.query(
    'INSERT INTO questions (question, answer) VALUES ($1, $2) RETURNING *',
    [question, answer],
  );
  res.status(201).json(rows[0]);
});

// Même appel pour Ollama, Mistral, OpenAI… : seule la configuration change
async function ask(question: string): Promise<string> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: question }],
    }),
  });
  if (!response.ok) {
    throw new Error(`IA : ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// Sans adresse, Node écoute sur toutes les interfaces : joignable hors du conteneur
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
