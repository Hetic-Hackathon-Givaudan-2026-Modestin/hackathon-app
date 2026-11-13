import type { ProjectValues } from './project.ts';

export type ProjectStatus = 'accepted' | 'rejected' | 'pending';
export type ProjectAccess = { id: string; accessToken: string };
export type CreatedProject = ProjectAccess & { status: ProjectStatus };

const STORAGE_KEY = 'givbot.project';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const token = /^[A-Za-z0-9_-]{43}$/;

export class ProjectApiError extends Error {
  readonly uncertain: boolean;

  constructor(message: string, uncertain = false) {
    super(message);
    this.uncertain = uncertain;
  }
}

function isStatus(value: unknown): value is ProjectStatus {
  return value === 'accepted' || value === 'rejected' || value === 'pending';
}

function isAccess(value: unknown): value is ProjectAccess {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && uuid.test(record.id) &&
    typeof record.accessToken === 'string' && token.test(record.accessToken);
}

export function readProjectAccess(storage: Storage): ProjectAccess | null {
  const value = storage.getItem(STORAGE_KEY);
  if (value === null) return null;
  const parsed: unknown = JSON.parse(value);
  if (!isAccess(parsed)) throw new Error('Accès au projet invalide.');
  return parsed;
}

export function saveProjectAccess(storage: Storage, access: ProjectAccess): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ id: access.id, accessToken: access.accessToken }));
}

export async function createProject(values: ProjectValues): Promise<CreatedProject> {
  let response: Response;
  try {
    response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        budgetPerKg: values.budgetPerKg.trim() ? Number(values.budgetPerKg) : null,
        annualVolumeKg: values.annualVolumeKg.trim() ? Number(values.annualVolumeKg) : null,
        workedWithGivaudan: values.workedWithGivaudan === 'yes',
      }),
      signal: AbortSignal.timeout(135_000),
    });
  } catch {
    throw new ProjectApiError(
      'La réponse n’a pas été reçue. Le projet a peut-être été enregistré : un nouvel envoi pourrait créer un doublon.',
      true,
    );
  }
  if (!response.ok) {
    if (response.status === 400)
      throw new ProjectApiError('Les informations ont été refusées par le serveur. Vérifiez le formulaire.');
    if (response.status === 429)
      throw new ProjectApiError('Trop de demandes. Réessayez plus tard.');
    throw new ProjectApiError(
      'Le serveur n’a pas confirmé l’enregistrement. Le projet a peut-être été enregistré : un nouvel envoi pourrait créer un doublon.',
      true,
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ProjectApiError('La réponse du serveur est illisible. Le projet a peut-être été enregistré.', true);
  }
  if (!isAccess(data) || !('status' in data) || !isStatus(data.status)) {
    throw new ProjectApiError('La réponse du serveur est invalide. Le projet a peut-être été enregistré.', true);
  }
  return { id: data.id, accessToken: data.accessToken, status: data.status };
}

export async function getProjectStatus(access: ProjectAccess, signal?: AbortSignal): Promise<ProjectStatus> {
  const timeout = AbortSignal.timeout(15_000);
  const response = await fetch(`/api/projects/${encodeURIComponent(access.id)}`, {
    headers: { Authorization: `Bearer ${access.accessToken}` },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Impossible de retrouver le statut du projet.');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('id' in data) ||
      data.id !== access.id || !('status' in data) || !isStatus(data.status)) {
    throw new Error('Réponse de statut invalide.');
  }
  return data.status;
}
