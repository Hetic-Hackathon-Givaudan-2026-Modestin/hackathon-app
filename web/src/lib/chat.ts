import type { ProjectAccess } from './projectApi';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ChatData = {
  project: {
    market: string;
    productType: string;
    budgetPerKg: number | null;
    annualVolumeKg: number | null;
    salesZone: string;
    positioning: string;
    projectStage: string;
    launchTiming: string;
    description: string;
  };
  messages: ChatMessage[];
};

function endpoint(access: ProjectAccess) {
  return `/api/projects/${encodeURIComponent(access.id)}/chat`;
}

export async function loadChat(access: ProjectAccess, signal: AbortSignal): Promise<ChatData> {
  const response = await fetch(endpoint(access), {
    headers: { Authorization: `Bearer ${access.accessToken}` },
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error('Chat indisponible.');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('project' in data) || !('messages' in data) ||
      !data.project || typeof data.project !== 'object' ||
      !('market' in data.project) || typeof data.project.market !== 'string' ||
      !('productType' in data.project) || typeof data.project.productType !== 'string' ||
      !('budgetPerKg' in data.project) ||
      (data.project.budgetPerKg !== null && typeof data.project.budgetPerKg !== 'number') ||
      !('annualVolumeKg' in data.project) ||
      (data.project.annualVolumeKg !== null && typeof data.project.annualVolumeKg !== 'number') ||
      !('salesZone' in data.project) || typeof data.project.salesZone !== 'string' ||
      !('positioning' in data.project) || typeof data.project.positioning !== 'string' ||
      !('projectStage' in data.project) || typeof data.project.projectStage !== 'string' ||
      !('launchTiming' in data.project) || typeof data.project.launchTiming !== 'string' ||
      !('description' in data.project) || typeof data.project.description !== 'string' ||
      !Array.isArray(data.messages) || !data.messages.every(
        (item: unknown) => item && typeof item === 'object' && 'role' in item &&
          (item.role === 'user' || item.role === 'assistant') &&
          'content' in item && typeof item.content === 'string',
      )) throw new Error('Conversation invalide.');
  return {
    project: {
      market: data.project.market,
      productType: data.project.productType,
      budgetPerKg: data.project.budgetPerKg,
      annualVolumeKg: data.project.annualVolumeKg,
      salesZone: data.project.salesZone,
      positioning: data.project.positioning,
      projectStage: data.project.projectStage,
      launchTiming: data.project.launchTiming,
      description: data.project.description,
    },
    messages: data.messages,
  };
}

export async function sendChatMessage(access: ProjectAccess, message: string): Promise<string> {
  const response = await fetch(endpoint(access), {
    method: 'POST',
    headers: { Authorization: `Bearer ${access.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(135_000),
  });
  if (!response.ok) throw new Error('Envoi impossible.');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('answer' in data) ||
      typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Réponse invalide.');
  return data.answer;
}
