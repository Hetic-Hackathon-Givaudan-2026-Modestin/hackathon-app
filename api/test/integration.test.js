import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import pg from 'pg';

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

test('API : base PostgreSQL et service IA simulé', { timeout: 30000 }, async (t) => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL est requis pour les tests');
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let mock;
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
  } finally {
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
