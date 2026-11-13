import assert from 'node:assert/strict';
import { randomUUID, scryptSync } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import pg from 'pg';
import express from 'express';
import { projectsRouter } from '../dist/projects.js';
import { createClaudeScorer, createScorer } from '../dist/scoring.js';

const execFileAsync = promisify(execFile);

test('le scoring utilise un délai de 120 secondes et signale les erreurs', async (t) => {
  const project = {
    fullName: 'Test', company: 'Exemple', email: 'test@example.com',
    role: 'marketing', salesZone: 'europe', market: 'agro', quantity: 'small',
    positioning: 'mid', productType: 'boisson gazeuse', budgetPerKg: 5,
    annualVolumeKg: 100, projectStage: 'testing', launchTiming: '6-12-months',
    workedWithGivaudan: false, description: 'Un projet de démonstration.',
  };
  const timeout = t.mock.method(AbortSignal, 'timeout', () => new AbortController().signal);
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('{"score":65}'));
  const score = createScorer('http://localhost:8000');
  assert.equal(await score(project), 65);
  assert.equal(await score({ ...project, annualVolumeKg: 100, positioning: 'entry' }), 55);
  assert.equal(await score({ ...project, annualVolumeKg: 5000, positioning: 'premium' }), 55);
  assert.equal(await score({ ...project, annualVolumeKg: 100, positioning: 'premium' }), 65);
  assert.equal(await score({ ...project, annualVolumeKg: 5000, positioning: 'mid' }), 65);
  assert.equal(await score({ ...project, annualVolumeKg: null, positioning: 'entry' }), 65);
  assert.equal(timeout.mock.calls[0].arguments[0], 120_000);
  fetchMock.mock.mockImplementation(async () => { throw new Error('Délai dépassé'); });
  await assert.rejects(score(project), /Délai dépassé/);
});

test('le scoring Claude envoie les seuls critères et lit le JSON du modèle', async (t) => {
  const project = {
    fullName: 'Test', company: 'Exemple', email: 'test@example.com',
    role: 'marketing', salesZone: 'europe', market: 'agro', quantity: 'small',
    positioning: 'mid', productType: 'boisson gazeuse', budgetPerKg: 5,
    annualVolumeKg: 100, projectStage: 'testing', launchTiming: '6-12-months',
    workedWithGivaudan: false, description: 'Un projet de démonstration.',
  };
  const replies = ['{"score": 72}', '```json\n{"score": 72}\n```'];
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(_url, 'https://api.anthropic.com/v1/messages');
    assert.equal(init.headers['x-api-key'], 'claude-key');
    assert.equal(init.headers['anthropic-version'], '2023-06-01');
    const body = JSON.parse(init.body);
    const criteria = JSON.parse(body.messages[0].content);
    assert.equal('fullName' in criteria, false);
    assert.equal('email' in criteria, false);
    assert.equal('company' in criteria, false);
    assert.equal(body.model, 'test-model');
    return new Response(JSON.stringify({ content: [{ type: 'text', text: replies.shift() }] }));
  });
  const score = createClaudeScorer('claude-key', 'test-model');
  assert.equal(await score(project), 72);
  assert.equal(await score(project), 72);
  assert.equal(fetchMock.mock.calls.length, 2);
});

test('le scoring Claude réessaie les indisponibilités temporaires et signale les autres erreurs', async (t) => {
  const project = {
    fullName: 'Test', company: 'Exemple', email: 'test@example.com',
    role: 'marketing', salesZone: 'europe', market: 'agro', quantity: 'small',
    positioning: 'mid', productType: 'boisson gazeuse', budgetPerKg: 5,
    annualVolumeKg: 100, projectStage: 'testing', launchTiming: '6-12-months',
    workedWithGivaudan: false, description: 'Un projet de démonstration.',
  };
  const statuses = [503, 529, 200, 503, 503, 503, 401];
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    const status = statuses.shift();
    return new Response(status === 200 ? JSON.stringify({
      content: [{ type: 'text', text: '{"score": 72}' }],
    }) : '', { status });
  });
  const score = createClaudeScorer('claude-key', 'test-model');

  assert.equal(await score(project), 72);
  assert.equal(fetchMock.mock.calls.length, 3);
  await assert.rejects(score(project), /Claude scoring : HTTP 503/);
  assert.equal(fetchMock.mock.calls.length, 6);
  await assert.rejects(score(project), /Claude scoring : HTTP 401/);
  assert.equal(fetchMock.mock.calls.length, 7);
});

test('le mode démo accepte sans scoring et ne modifie pas le comportement normal', async () => {
  const project = {
    fullName: 'Test', company: 'Exemple', email: 'test@example.com',
    role: 'marketing', salesZone: 'europe', market: 'agro',
    positioning: 'mid', productType: 'boisson gazeuse', budgetPerKg: 5,
    annualVolumeKg: 100, projectStage: 'testing', launchTiming: '6-12-months',
    workedWithGivaudan: false,
  };
  for (const demoMode of [true, false]) {
    let saved;
    let scoringCalls = 0;
    const db = { query: async (_sql, values) => {
      saved = values;
      return { rows: [{ id: 'test', status: values[16] }] };
    } };
    const app = express();
    app.use(express.json());
    app.use('/api', projectsRouter(db, async () => { scoringCalls++; return 40; }, demoMode));
    const server = http.createServer(app);
    const port = await listen(server);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.status, demoMode ? 'accepted' : 'rejected');
      assert.equal(body.demoMode, demoMode ? true : undefined);
      assert.equal(scoringCalls, demoMode ? 0 : 1);
      assert.equal(saved[17], demoMode ? null : 40);
      assert.equal(saved[18], demoMode ? null : 'score');
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }
});

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function availablePort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function waitForApi(url, child, output) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`L'API s'est arrêtée avant de démarrer : ${output()}`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // L'API peut ne pas encore écouter pendant son démarrage.
    }
    await delay(100);
  }
  throw new Error(`Délai de démarrage de l'API dépassé : ${output()}`);
}

test('API : base PostgreSQL et service IA simulé', { timeout: 60000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL est requis pour les tests');
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let mock;
  let scoring;
  let child;
  let schemaCreated = false;
  let output = '';

  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    const databaseUrl = new URL(process.env.DATABASE_URL);
    databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
    const db = new pg.Pool({ connectionString: databaseUrl.toString() });
    try {
      const sql = await readFile(new URL('../../db/init/001-schema.sql', import.meta.url), 'utf8');
      await db.query(sql);
      await db.query("INSERT INTO questions (question, answer) VALUES ('existant', 'conservé')");
      for (let i = 0; i < 2; i++) {
        await execFileAsync(process.execPath, ['dist/migrate.js'], {
          cwd: new URL('..', import.meta.url),
          env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
        });
      }
      const preserved = await db.query('SELECT question, answer FROM questions');
      assert.deepEqual(preserved.rows, [{ question: 'existant', answer: 'conservé' }]);
      await db.query('DELETE FROM questions');
    } finally {
      await db.end();
    }

    const requests = [];
    let failAi = false;
    mock = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      requests.push({
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString()),
      });
      res.setHeader('content-type', 'application/json');
      if (failAi) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'Service indisponible' }));
        return;
      }
      res.end(JSON.stringify({ choices: [{ message: { content: 'Paris.' } }] }));
    });
    const mockPort = await listen(mock);
    const scoringRequests = [];
    const chatRequests = [];
    let chatFailure = false;
    let malformedChat = false;
    let scoringResponse = { status: 200, body: { score: 80 } };
    scoring = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (req.url === '/ask') {
        chatRequests.push({
          authorization: req.headers.authorization,
          body: JSON.parse(Buffer.concat(chunks).toString()),
        });
        res.setHeader('content-type', 'application/json');
        if (chatFailure) {
          res.writeHead(503);
          res.end(JSON.stringify({ error: 'indisponible' }));
        } else if (malformedChat) {
          res.end(JSON.stringify({ conversation_id: 123, answer: '' }));
        } else {
          res.end(JSON.stringify({
            conversation_id: chatRequests.at(-1).body.conversation_id ?? 123,
            answer: 'Quel parfum souhaitez-vous ?',
          }));
        }
        return;
      }
      scoringRequests.push({
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString()),
      });
      res.setHeader('content-type', 'application/json');
      res.writeHead(scoringResponse.status);
      res.end(JSON.stringify(scoringResponse.body));
    });
    const scoringPort = await listen(scoring);
    const port = await availablePort();
    const apiUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['dist/index.js'], {
      cwd: new URL('..', import.meta.url),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl.toString(),
        AI_BASE_URL: `http://127.0.0.1:${mockPort}/v1`,
        AI_MODEL: 'test-model',
        AI_API_KEY: 'test-key',
        SCORING_BASE_URL: `http://127.0.0.1:${scoringPort}/`,
        SCORING_API_KEY: 'scoring-key',
        PORT: String(port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { output += data.toString(); });
    await waitForApi(apiUrl, child, () => output);

    await t.test('vérifie la connexion à la base', async () => {
      const response = await fetch(`${apiUrl}/api/health`);
      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.status, 'ok');
      assert.match(data.db, /PostgreSQL/);
    });

    const registration = {
      fullName: '  Camille Exemple  ',
      email: '  Camille@Exemple.fr ',
      company: ' Exemple ',
      sector: 'flavors',
      role: 'rd',
      password: 'mot-de-passe-test',
    };
    const register = (body) => fetch(`${apiUrl}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    await t.test('crée un compte avec un mot de passe haché', async () => {
      const response = await register(registration);
      assert.equal(response.status, 201);
      const user = await response.json();
      assert.equal(user.fullName, 'Camille Exemple');
      assert.equal(user.email, 'camille@exemple.fr');
      assert.equal(user.company, 'Exemple');
      assert.ok(user.id);
      assert.ok(user.createdAt);
      assert.equal('password' in user, false);
      assert.equal('password_hash' in user, false);

      const db = new pg.Pool({ connectionString: databaseUrl.toString() });
      try {
        const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
        const [algorithm, n, r, p, salt, hash] = rows[0].password_hash.split('$');
        assert.equal(algorithm, 'scrypt');
        const actual = scryptSync(registration.password, Buffer.from(salt, 'hex'), 64, {
          N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
        });
        assert.equal(actual.toString('hex'), hash);
        assert.notEqual(rows[0].password_hash, registration.password);
      } finally {
        await db.end();
      }
    });

    await t.test('refuse un email déjà utilisé même avec une casse différente', async () => {
      const response = await register({ ...registration, email: 'CAMILLE@EXEMPLE.FR' });
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { error: 'Cette adresse email est déjà utilisée.' });
    });

    await t.test('refuse les données invalides', async () => {
      for (const value of [
        null,
        { ...registration, email: 'invalide' },
        { ...registration, fullName: ' ' },
        { ...registration, company: '' },
        { ...registration, sector: 'inconnu' },
        { ...registration, role: 'inconnu' },
        { ...registration, password: 'court' },
        { ...registration, password: 'x'.repeat(257) },
        { ...registration, email: 123 },
      ]) {
        const response = await register(value);
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Les informations d'inscription sont invalides." });
      }
      const malformed = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      });
      assert.equal(malformed.status, 400);
      assert.deepEqual(await malformed.json(), { error: "Les informations d'inscription sont invalides." });
    });

    await t.test('empêche deux inscriptions simultanées pour le même email', async () => {
      const body = { ...registration, email: 'nouveau@exemple.fr' };
      const responses = await Promise.all([register(body), register(body)]);
      assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    });

    const login = (body, cookie) => fetch(`${apiUrl}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    });
    const session = (cookie) => fetch(`${apiUrl}/api/session`, {
      headers: cookie ? { cookie } : {},
    });
    const logout = (cookie) => fetch(`${apiUrl}/api/session`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    let cookie;

    await t.test('refuse les identifiants invalides sans révéler si le compte existe', async () => {
      const wrong = await login({ email: registration.email, password: 'incorrect' });
      const missing = await login({ email: 'absent@example.fr', password: 'incorrect' });
      assert.equal(wrong.status, 401);
      assert.equal(missing.status, 401);
      assert.deepEqual(await wrong.json(), await missing.json());
      assert.equal((await session()).status, 401);
    });

    await t.test('connecte, crée une session de 12 h et retourne le profil', async () => {
      const response = await login({ email: registration.email, password: registration.password });
      assert.equal(response.status, 204);
      const setCookie = response.headers.get('set-cookie');
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Strict/i);
      assert.match(setCookie, /Max-Age=43200/i);
      cookie = setCookie.split(';')[0];
      const profile = await session(cookie);
      assert.equal(profile.status, 200);
      assert.equal(profile.headers.get('cache-control'), 'no-store');
      const user = await profile.json();
      assert.equal(user.email, 'camille@exemple.fr');
      assert.equal(user.fullName, 'Camille Exemple');
      assert.equal('password_hash' in user, false);
      const db = new pg.Pool({ connectionString: databaseUrl.toString() });
      try {
        const { rows } = await db.query('SELECT token_hash, expires_at, created_at FROM user_sessions');
        assert.equal(rows.length, 1);
        assert.notEqual(rows[0].token_hash, cookie.split('=')[1]);
        const duration = rows[0].expires_at - rows[0].created_at;
        assert.ok(duration > 43199000 && duration <= 43200000);
      } finally {
        await db.end();
      }
    });

    await t.test('renouvelle la session et invalide l’ancien cookie', async () => {
      const previous = cookie;
      const response = await login({ email: registration.email, password: registration.password }, previous);
      assert.equal(response.status, 204);
      cookie = response.headers.get('set-cookie').split(';')[0];
      assert.notEqual(cookie, previous);
      assert.equal((await session(previous)).status, 401);
      assert.equal((await session(cookie)).status, 200);
    });

    await t.test('refuse les requêtes de déconnexion cross-site', async () => {
      const response = await fetch(`${apiUrl}/api/session`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site', cookie },
        body: '{}',
      });
      assert.equal(response.status, 403);
      assert.equal((await session(cookie)).status, 200);
    });

    await t.test('déconnecte et invalide le cookie côté serveur', async () => {
      const response = await logout(cookie);
      assert.equal(response.status, 204);
      assert.match(response.headers.get('set-cookie'), /Expires=/i);
      assert.equal((await session(cookie)).status, 401);
    });

    await t.test('refuse une session expirée', async () => {
      const response = await login({ email: registration.email, password: registration.password });
      cookie = response.headers.get('set-cookie').split(';')[0];
      const db = new pg.Pool({ connectionString: databaseUrl.toString() });
      try {
        await db.query("UPDATE user_sessions SET expires_at = now() - interval '1 second'");
      } finally {
        await db.end();
      }
      assert.equal((await session(cookie)).status, 401);
    });

    await t.test('limite les tentatives de connexion', async () => {
      for (let i = 0; i < 10; i++) {
        assert.equal((await login({ email: registration.email, password: 'incorrect' })).status, 401);
      }
      const response = await login({ email: registration.email, password: registration.password });
      assert.equal(response.status, 429);
      assert.ok(Number(response.headers.get('retry-after')) > 0);
    });

    await t.test('refuse une question vide sans appeler l’IA', async () => {
      const response = await fetch(`${apiUrl}/api/questions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: '  ' }),
      });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: 'Question manquante' });
      assert.equal(requests.length, 0);
    });

    await t.test('enregistre et retrouve une réponse', async () => {
      const response = await fetch(`${apiUrl}/api/questions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: '  Capitale ?  ' }),
      });
      assert.equal(response.status, 201);
      const saved = await response.json();
      assert.equal(saved.question, 'Capitale ?');
      assert.equal(saved.answer, 'Paris.');
      assert.deepEqual(requests[0], {
        method: 'POST',
        url: '/v1/chat/completions',
        authorization: 'Bearer test-key',
        body: {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Capitale ?' }],
        },
      });

      const list = await fetch(`${apiUrl}/api/questions`);
      assert.equal(list.status, 200);
      const rows = await list.json();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, saved.id);
      assert.equal(rows[0].answer, 'Paris.');
    });

    await t.test('ne sauvegarde rien si le service IA échoue', async () => {
      failAi = true;
      const response = await fetch(`${apiUrl}/api/questions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'Autre question' }),
      });
      assert.equal(response.status, 500);
      const list = await fetch(`${apiUrl}/api/questions`);
      assert.equal((await list.json()).length, 1);
    });

    const project = {
      fullName: ' Camille Exemple ',
      company: 'Exemple SA',
      role: 'marketing',
      email: 'Camille@Exemple.fr',
      salesZone: 'europe',
      market: 'perfume',
      productType: "parfum d'intérieur",
      budgetPerKg: 5,
      annualVolumeKg: 75,
      positioning: 'premium',
      projectStage: 'testing',
      launchTiming: '6-12-months',
      workedWithGivaudan: false,
    };
    const createProject = (body) => fetch(`${apiUrl}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const readProject = (id, token) => fetch(`${apiUrl}/api/projects/${id}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const projectRow = async (id) => {
      const db = new pg.Pool({ connectionString: databaseUrl.toString() });
      try {
        return (await db.query('SELECT * FROM projects WHERE id = $1', [id])).rows[0];
      } finally {
        await db.end();
      }
    };

    await t.test('accepte un projet dont le score atteint 65', async () => {
      scoringResponse = { status: 200, body: { score: 65 } };
      const response = await createProject(project);
      assert.equal(response.status, 201);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const created = await response.json();
      assert.equal(created.status, 'accepted');
      assert.ok(created.accessToken.length >= 40);
      assert.deepEqual(Object.keys(created).sort(), ['accessToken', 'id', 'status']);

      const call = scoringRequests.at(-1);
      assert.equal(call.url, '/score');
      assert.equal(call.authorization, 'Bearer scoring-key');
      assert.equal(call.body.market, 'perfume');
      assert.equal(call.body.productType, "parfum d'intérieur");
      assert.equal(call.body.budgetPerKg, 5);
      assert.equal(call.body.annualVolumeKg, 75);
      assert.equal(call.body.quantity, 'small');
      assert.equal(call.body.projectStage, 'testing');
      assert.equal(call.body.launchTiming, '6-12-months');
      assert.match(call.body.description, /Volume annuel d'arôme acheté : 75 kg\/an/);
      assert.equal(call.body.workedWithGivaudan, false);
      assert.equal('email' in call.body, false);
      assert.equal('fullName' in call.body, false);
      assert.equal('company' in call.body, false);

      const row = await projectRow(created.id);
      assert.equal(row.score, 65);
      assert.equal(row.decision_reason, 'score');
      assert.equal(row.email, 'camille@exemple.fr');
      assert.equal(row.product_type, "parfum d'intérieur");
      assert.equal(Number(row.budget_per_kg), 5);
      assert.equal(Number(row.annual_volume_kg), 75);
      assert.notEqual(row.access_token_hash, created.accessToken);
      assert.ok(row.decided_at);
    });

    await t.test('refuse un projet dont le score est inférieur à 65', async () => {
      scoringResponse = { status: 200, body: { score: 64 } };
      const created = await (await createProject(project)).json();
      assert.equal(created.status, 'rejected');
      assert.equal((await projectRow(created.id)).score, 64);
    });

    await t.test('applique la pénalité provisoire faible volume et entrée de gamme', async () => {
      scoringResponse = { status: 200, body: { score: 70 } };
      const created = await (await createProject({
        ...project, annualVolumeKg: 100, positioning: 'entry',
      })).json();
      assert.equal(created.status, 'rejected');
      assert.equal((await projectRow(created.id)).score, 60);
    });

    await t.test('valide directement un client existant sans appeler le scoring', async () => {
      const before = scoringRequests.length;
      const created = await (await createProject({
        ...project, workedWithGivaudan: true, annualVolumeKg: null, budgetPerKg: null,
      })).json();
      assert.equal(created.status, 'accepted');
      assert.equal(scoringRequests.length, before);
      const row = await projectRow(created.id);
      assert.equal(row.decision_reason, 'existing-client');
      assert.equal(row.score, null);
      assert.equal(row.quantity, 'medium');
      assert.equal(row.annual_volume_kg, null);
      assert.equal(row.budget_per_kg, null);
    });

    await t.test('conserve le projet en attente si le scoring échoue', async () => {
      for (const failure of [
        { status: 503, body: { error: 'indisponible' } },
        { status: 200, body: { score: 101 } },
        { status: 200, body: { score: 'élevé' } },
      ]) {
        scoringResponse = failure;
        const response = await createProject(project);
        assert.equal(response.status, 201);
        const created = await response.json();
        assert.equal(created.status, 'pending');
        const row = await projectRow(created.id);
        assert.equal(row.score, null);
        assert.equal(row.decided_at, null);
      }
    });

    await t.test('refuse un projet invalide sans le scorer ni l’enregistrer', async () => {
      const before = scoringRequests.length;
      const response = await createProject({
        ...project,
        market: 'inconnu',
        email: 'pas-un-email',
        productType: '',
        workedWithGivaudan: 'oui',
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.deepEqual(body.fields.sort(), ['email', 'market', 'productType', 'workedWithGivaudan']);
      assert.equal(scoringRequests.length, before);
      const badNumbers = await createProject({
        ...project, budgetPerKg: -1, annualVolumeKg: 0,
      });
      assert.equal(badNumbers.status, 400);
      assert.deepEqual((await badNumbers.json()).fields.sort(), ['annualVolumeKg', 'budgetPerKg']);
    });

    await t.test('retrouve le statut avec le jeton secret uniquement', async () => {
      scoringResponse = { status: 200, body: { score: 90 } };
      const created = await (await createProject(project)).json();

      const ok = await readProject(created.id, created.accessToken);
      assert.equal(ok.status, 200);
      const data = await ok.json();
      assert.equal(data.status, 'accepted');
      assert.equal('score' in data, false);
      assert.equal('email' in data, false);

      assert.equal((await readProject(created.id)).status, 401);
      assert.equal((await readProject(created.id, 'mauvais-jeton')).status, 401);
      assert.equal((await readProject('pas-un-uuid', created.accessToken)).status, 401);
      const other = await (await createProject(project)).json();
      assert.equal((await readProject(created.id, other.accessToken)).status, 401);
    });

    await t.test('chat réservé aux projets acceptés et protégé par leur jeton', async () => {
      const accepted = await (await createProject({ ...project, workedWithGivaudan: true })).json();
      const acceptedProject = await projectRow(accepted.id);
      scoringResponse = { status: 200, body: { score: 30 } };
      const rejected = await (await createProject(project)).json();
      scoringResponse = { status: 503, body: { error: 'indisponible' } };
      const pending = await (await createProject(project)).json();
      const chat = (access, method = 'GET', message = 'Bonjour') => fetch(
        `${apiUrl}/api/projects/${access.id}/chat`,
        {
          method,
          headers: { authorization: `Bearer ${access.accessToken}`, 'content-type': 'application/json' },
          ...(method === 'POST' ? { body: JSON.stringify({ message }) } : {}),
        },
      );
      assert.equal((await chat({ ...accepted, accessToken: rejected.accessToken })).status, 401);
      assert.equal((await fetch(`${apiUrl}/api/projects/${accepted.id}/chat`)).status, 401);
      assert.equal((await chat(rejected)).status, 403);
      assert.equal((await chat(rejected, 'POST')).status, 403);
      assert.equal((await chat(pending)).status, 403);
      assert.equal((await chat(pending, 'POST')).status, 403);
      assert.equal((await chat(accepted, 'POST', '   ')).status, 400);
      const first = await chat(accepted, 'POST', ' Bonjour ');
      assert.equal(first.status, 200);
      assert.equal((await first.json()).answer, 'Quel parfum souhaitez-vous ?');
      assert.equal(chatRequests.at(-1).body.question, 'Bonjour');
      assert.equal(chatRequests.at(-1).body.conversation_id, null);
      assert.equal(chatRequests.at(-1).body.context, acceptedProject.description);
      assert.equal(chatRequests.at(-1).authorization, 'Bearer scoring-key');
      assert.equal('email' in chatRequests.at(-1).body, false);
      assert.equal((await chat(accepted, 'POST', 'Une pêche.')).status, 200);
      assert.equal(chatRequests.at(-1).body.conversation_id, 123);
      const history = await (await chat(accepted)).json();
      assert.deepEqual(history.messages.map(({ role }) => role), ['user', 'assistant', 'user', 'assistant']);
      assert.equal(history.project.description, acceptedProject.description);
      chatFailure = true;
      assert.equal((await chat(accepted, 'POST', 'Autre question')).status, 502);
      assert.equal((await (await chat(accepted)).json()).messages.length, 4);
      chatFailure = false;
      malformedChat = true;
      assert.equal((await chat(accepted, 'POST', 'Autre question')).status, 502);
      assert.equal((await (await chat(accepted)).json()).messages.length, 4);
      malformedChat = false;
    });
  } finally {
    if (scoring?.listening) {
      scoring.closeAllConnections();
      await new Promise((resolve, reject) =>
        scoring.close((error) => (error ? reject(error) : resolve())),
      );
    }
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    if (mock?.listening) {
      mock.closeAllConnections();
      await new Promise((resolve, reject) =>
        mock.close((error) => (error ? reject(error) : resolve())),
      );
    }
    try {
      if (schemaCreated) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await admin.end();
    }
  }
});
