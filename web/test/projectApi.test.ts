import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createProject,
  getProjectStatus,
  ProjectApiError,
  readProjectAccess,
  saveProjectAccess,
} from '../src/lib/projectApi.ts';
import { initialProject } from '../src/lib/project.ts';

const access = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  accessToken: 'a'.repeat(43),
};
const values = {
  ...initialProject,
  fullName: 'Camille Exemple', company: 'Exemple', role: 'marketing',
  email: 'camille@example.fr', salesZone: 'europe', market: 'agro',
  productType: 'boisson au citron', budgetPerKg: '5',
  annualVolumeKg: '100', positioning: 'mid', workedWithGivaudan: 'yes',
  projectStage: 'testing', launchTiming: '6-12-months',
};

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() { return this.items.size; }
  clear() { this.items.clear(); }
  getItem(key: string) { return this.items.get(key) ?? null; }
  key(index: number) { return [...this.items.keys()][index] ?? null; }
  removeItem(key: string) { this.items.delete(key); }
  setItem(key: string, value: string) { this.items.set(key, value); }
}

test('envoie le formulaire et convertit la réponse déjà client en booléen', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ ...access, status: 'accepted' }, { status: 201 }));
  const result = await createProject(values);
  assert.equal(result.status, 'accepted');
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/projects');
  assert.equal(options?.method, 'POST');
  const body = JSON.parse(String(options?.body));
  assert.equal(body.workedWithGivaudan, true);
  assert.equal(body.productType, values.productType);
  assert.equal(body.budgetPerKg, 5);
  assert.equal(body.annualVolumeKg, 100);
  assert.equal('quantity' in body, false);
  assert.equal('description' in body, false);
});

test('accepte les trois états et refuse les réponses malformées', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ ...access, status: 'accepted' }, { status: 201 }));
  for (const status of ['accepted', 'rejected', 'pending']) {
    mock.mock.mockImplementation(async () => Response.json({ ...access, status }, { status: 201 }));
    assert.equal((await createProject({ ...values, workedWithGivaudan: 'no' })).status, status);
    const options = mock.mock.calls.at(-1)?.arguments[1];
    assert.equal(JSON.parse(String(options?.body)).workedWithGivaudan, false);
  }
  mock.mock.mockImplementation(async () => Response.json({ ...access, status: 'unknown' }));
  await assert.rejects(createProject(values), (error: unknown) =>
    error instanceof ProjectApiError && error.uncertain);
});

test('signale erreurs HTTP et résultat incertain sans réessai automatique', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 400 }));
  await assert.rejects(createProject(values), (error: unknown) =>
    error instanceof ProjectApiError && !error.uncertain);
  mock.mock.mockImplementation(async () => new Response(null, { status: 429 }));
  await assert.rejects(createProject(values), /Trop de demandes/);
  mock.mock.mockImplementation(async () => new Response(null, { status: 503 }));
  await assert.rejects(createProject(values), (error: unknown) =>
    error instanceof ProjectApiError && error.uncertain);
  mock.mock.mockImplementation(async () => { throw new Error('réseau'); });
  await assert.rejects(createProject(values), (error: unknown) =>
    error instanceof ProjectApiError && error.uncertain);
  assert.equal(mock.mock.callCount(), 4);
});

test('conserve uniquement l’accès puis retrouve le statut avec le jeton', async (t) => {
  const storage = new MemoryStorage();
  assert.equal(readProjectAccess(storage), null);
  saveProjectAccess(storage, access);
  assert.deepEqual(readProjectAccess(storage), access);
  const mock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ id: access.id, status: 'pending', createdAt: '2026-01-01' }));
  assert.equal(await getProjectStatus(access), 'pending');
  const [url, options] = mock.mock.calls[0].arguments;
  assert.equal(url, `/api/projects/${access.id}`);
  assert.deepEqual(options?.headers, { Authorization: `Bearer ${access.accessToken}` });
  mock.mock.mockImplementation(async () => new Response(null, { status: 401 }));
  await assert.rejects(getProjectStatus(access), /Impossible/);
  mock.mock.mockImplementation(async () => Response.json({ id: access.id, status: 'invalid' }));
  await assert.rejects(getProjectStatus(access), /invalide/);
  storage.setItem('givbot.project', '{"id":"invalid"}');
  assert.throws(() => readProjectAccess(storage), /invalide/);
  t.mock.method(storage, 'setItem', () => { throw new Error('stockage indisponible'); });
  assert.throws(() => saveProjectAccess(storage, access), /stockage indisponible/);
});
