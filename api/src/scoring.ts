import type { ProjectInput } from './project.js';

export type Scorer = (project: ProjectInput) => Promise<number>;

const TIMEOUT_MS = 30_000;

// Contrat provisoire avec l'équipe data : POST {SCORING_BASE_URL}/score avec le
// projet, réponse { "score": <nombre de 0 à 100> }. À aligner une fois le contrat validé.
export function createScorer(baseUrl: string | undefined, apiKey = ''): Scorer {
  return async (project) => {
    if (!baseUrl) throw new Error("SCORING_BASE_URL n'est pas configuré.");
    // Les données d'identité (nom, email, entreprise) ne quittent pas notre API.
    const { fullName: _name, email: _email, company: _company, ...criteria } = project;
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(criteria),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Scoring : HTTP ${response.status}`);
    const data: unknown = await response.json();
    const score = (data as { score?: unknown } | null)?.score;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)
      throw new Error('Scoring : score invalide.');
    return Math.round(score);
  };
}
