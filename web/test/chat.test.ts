import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadChat, sendChatMessage } from '../src/lib/chat.ts';

const access = { id: '550e8400-e29b-41d4-a716-446655440000', accessToken: 'a'.repeat(43) };
const project = {
  market: 'agro', productType: 'boisson gazeuse', budgetPerKg: 5,
  annualVolumeKg: 100, salesZone: 'europe', positioning: 'mid',
  projectStage: 'testing', launchTiming: '6-12-months', description: 'Une boisson.',
};

test('charge le brief et les messages avec le jeton du projet', async (t) => {
  const messages = [{ role: 'user', content: 'Bonjour' }, { role: 'assistant', content: 'Bonjour !' }];
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ project, messages }));
  assert.deepEqual(await loadChat(access, new AbortController().signal), { project, messages });
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, `/api/projects/${access.id}/chat`);
  assert.deepEqual(options?.headers, { Authorization: `Bearer ${access.accessToken}` });
  assert.equal(options?.cache, 'no-store');
  fetchMock.mock.mockImplementation(async () => Response.json({ project, messages: [{ role: 'system', content: 'x' }] }));
  await assert.rejects(loadChat(access, new AbortController().signal), /invalide/);
});

test('envoie un message et rejette une réponse IA invalide ou une erreur HTTP', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ answer: 'Bonjour !' }));
  assert.equal(await sendChatMessage(access, 'Bonjour'), 'Bonjour !');
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, `/api/projects/${access.id}/chat`);
  assert.equal(options?.method, 'POST');
  assert.deepEqual(JSON.parse(String(options?.body)), { message: 'Bonjour' });
  assert.deepEqual(options?.headers, {
    Authorization: `Bearer ${access.accessToken}`, 'Content-Type': 'application/json',
  });
  fetchMock.mock.mockImplementation(async () => Response.json({ answer: ' ' }));
  await assert.rejects(sendChatMessage(access, 'Bonjour'), /invalide/);
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 502 }));
  await assert.rejects(sendChatMessage(access, 'Bonjour'), /impossible/);
});
