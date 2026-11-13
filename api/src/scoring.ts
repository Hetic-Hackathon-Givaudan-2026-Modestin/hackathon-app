import { HIGH_VOLUME_MIN_KG, LOW_VOLUME_MAX_KG, type ProjectInput } from './project.js';

export type Scorer = (project: ProjectInput) => Promise<number>;

const TIMEOUT_MS = 120_000;
// Provisional ROI thresholds and deduction; validate with the business team.
const ROI_MISMATCH_PENALTY = 10;
const DEFAULT_CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

type Criteria = Omit<ProjectInput, 'fullName' | 'email' | 'company'>;

const claudeScoringPrompt = `Tu évalues la viabilité commerciale d'un projet pour une démonstration.
Attribue un score entier de 0 à 100 à partir des critères fournis :
- cohérence marché, volume et positionnement ;
- précision du produit, du budget, de la zone de vente, de l'avancement et du lancement ;
- le fait d'avoir déjà travaillé avec Givaudan.

Réponds uniquement avec un objet JSON valide de la forme {"score": 0}. N'ajoute ni texte, ni balises Markdown.`;

function criteriaFor(project: ProjectInput): Criteria {
  const { fullName: _name, email: _email, company: _company, ...criteria } = project;
  return criteria;
}

// Claude ajoute parfois une balise Markdown ou une phrase autour du JSON malgré la consigne.
function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start !== -1 && end > start ? text.slice(start, end + 1) : text;
}

function validatedScore(data: unknown): number {
  const score = (data as { score?: unknown } | null)?.score;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)
    throw new Error('Scoring : score invalide.');
  return Math.round(score);
}

function withRoiPenalty(score: number, project: ProjectInput): number {
  const roiMismatch =
    project.annualVolumeKg !== null &&
    ((project.annualVolumeKg <= LOW_VOLUME_MAX_KG && project.positioning === 'entry') ||
      (project.annualVolumeKg >= HIGH_VOLUME_MIN_KG && project.positioning === 'premium'));
  return Math.max(0, score - (roiMismatch ? ROI_MISMATCH_PENALTY : 0));
}

// Contrat provisoire : le service de scoring ne reçoit ni nom, email ni entreprise.
export function createScorer(baseUrl: string | undefined, apiKey = ''): Scorer {
  return async (project) => {
    if (!baseUrl) throw new Error("SCORING_BASE_URL n'est pas configuré.");
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(criteriaFor(project)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Scoring : HTTP ${response.status}`);
    return withRoiPenalty(validatedScore(await response.json()), project);
  };
}

export function createClaudeScorer(apiKey: string | undefined, model = DEFAULT_CLAUDE_MODEL): Scorer {
  return async (project) => {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY n'est pas configurée.");
    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: claudeScoringPrompt,
        messages: [{ role: 'user', content: JSON.stringify(criteriaFor(project)) }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    };
    let response = await fetch('https://api.anthropic.com/v1/messages', request);
    for (let attempt = 0; attempt < 2 && (response.status === 503 || response.status === 529); attempt++) {
      console.warn(`Claude scoring : HTTP ${response.status}, nouvelle tentative.`);
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      response = await fetch('https://api.anthropic.com/v1/messages', request);
    }
    if (!response.ok) throw new Error(`Claude scoring : HTTP ${response.status}`);
    const data: unknown = await response.json();
    const content = (data as { content?: unknown } | null)?.content;
    if (!Array.isArray(content) || content.length !== 1 || !content[0] ||
        typeof content[0] !== 'object' || !('type' in content[0]) ||
        content[0].type !== 'text' || !('text' in content[0]) ||
        typeof content[0].text !== 'string')
      throw new Error('Claude scoring : réponse invalide.');
    let scoreData: unknown;
    try {
      scoreData = JSON.parse(extractJsonObject(content[0].text));
    } catch {
      const stopReason = (data as { stop_reason?: unknown }).stop_reason;
      console.error(`Claude scoring : réponse non JSON (stop_reason=${String(stopReason)}) : ${content[0].text.slice(0, 200)}`);
      throw new Error('Claude scoring : JSON invalide.');
    }
    return withRoiPenalty(validatedScore(scoreData), project);
  };
}
