export type ProjectInput = {
  fullName: string;
  company: string;
  role: string;
  email: string;
  salesZone: string;
  market: string;
  quantity: string;
  positioning: string;
  productType: string;
  budgetPerKg: number | null;
  annualVolumeKg: number | null;
  projectStage: string;
  launchTiming: string;
  workedWithGivaudan: boolean;
  description: string;
};

// Mêmes valeurs que web/src/lib/project.ts ; listes provisoires (ticket de définition des champs).
const allowed = {
  role: ['rd', 'marketing', 'purchasing', 'management', 'other'],
  salesZone: ['france', 'europe', 'north-america', 'asia', 'other'],
  market: ['agro', 'perfume', 'beauty', 'home', 'other'],
  positioning: ['entry', 'mid', 'premium'],
  projectStage: ['idea', 'development', 'testing', 'ready', 'launched', 'unknown'],
  launchTiming: ['under-6-months', '6-12-months', '1-2-years', 'over-2-years', 'unknown'],
} as const;

const labels: Record<string, Record<string, string>> = {
  market: {
    agro: 'Agroalimentaire', perfume: 'Parfumerie', beauty: 'Beauté et soins',
    home: 'Entretien et maison', other: 'Autre',
  },
  salesZone: {
    france: 'France', europe: 'Europe', 'north-america': 'Amérique du Nord',
    asia: 'Asie', other: 'Autre zone',
  },
  positioning: { entry: 'Entrée de gamme', mid: 'Milieu de gamme', premium: 'Premium' },
  projectStage: {
    idea: 'Idée en cours de définition', development: 'Développement du produit',
    testing: 'Prototype ou tests', ready: 'Prêt à être lancé',
    launched: 'Produit déjà lancé', unknown: 'Pas encore défini',
  },
  launchTiming: {
    'under-6-months': 'Dans moins de 6 mois', '6-12-months': 'Dans 6 à 12 mois',
    '1-2-years': 'Dans 1 à 2 ans', 'over-2-years': 'Dans plus de 2 ans',
    unknown: 'Date pas encore définie',
  },
};

type ParseResult = { value: ProjectInput } | { fields: string[] };

export const LOW_VOLUME_MAX_KG = 100;
export const HIGH_VOLUME_MIN_KG = 5_000;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function positiveNumber(value: unknown, max: number): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max)
    return undefined;
  return value;
}

export function parseProject(body: unknown): ParseResult {
  const input = (body && typeof body === 'object' ? body : {}) as Record<
    string,
    unknown
  >;
  const fields: string[] = [];

  const fullName = text(input.fullName, 200);
  const company = text(input.company, 200);
  const email = text(input.email, 254)?.toLowerCase() ?? null;
  const productType = text(input.productType, 200);
  const budgetPerKg = positiveNumber(input.budgetPerKg, 1_000_000);
  const annualVolumeKg = positiveNumber(input.annualVolumeKg, 1_000_000_000);
  if (!fullName) fields.push('fullName');
  if (!company) fields.push('company');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.push('email');
  if (!productType) fields.push('productType');
  if (budgetPerKg === undefined) fields.push('budgetPerKg');
  if (annualVolumeKg === undefined) fields.push('annualVolumeKg');
  if (typeof input.workedWithGivaudan !== 'boolean')
    fields.push('workedWithGivaudan');

  const choices = {} as Record<keyof typeof allowed, string> & { quantity: string };
  for (const key of Object.keys(allowed) as (keyof typeof allowed)[]) {
    const value = input[key];
    if (typeof value === 'string' && (allowed[key] as readonly string[]).includes(value))
      choices[key] = value;
    else fields.push(key);
  }

  // The scoring service still uses legacy volume bands; unknown volume gets the neutral band.
  choices.quantity =
    annualVolumeKg == null ? 'medium' :
      annualVolumeKg <= LOW_VOLUME_MAX_KG ? 'small' :
        annualVolumeKg >= HIGH_VOLUME_MIN_KG ? 'large' : 'medium';

  if (fields.length > 0) return { fields };
  const budget =
    budgetPerKg === null ? 'Pas encore défini' : `${budgetPerKg} €/kg`;
  const volume =
    annualVolumeKg === null ? 'Pas encore défini' : `${annualVolumeKg} kg/an`;
  const description = [
    `Type de produit : ${productType}`,
    `Secteur : ${labels.market![choices.market!]}`,
    `Budget prévu par kg d'arôme : ${budget}`,
    `Volume annuel d'arôme acheté : ${volume}`,
    `Zone de vente : ${labels.salesZone![choices.salesZone!]}`,
    `Avancement du projet : ${labels.projectStage![choices.projectStage!]}`,
    `Lancement souhaité : ${labels.launchTiming![choices.launchTiming!]}`,
    `Positionnement : ${labels.positioning![choices.positioning!]}`,
  ].join('\n');
  return {
    value: {
      fullName: fullName!,
      company: company!,
      email: email!,
      description,
      productType: productType!,
      budgetPerKg: budgetPerKg!,
      annualVolumeKg: annualVolumeKg!,
      workedWithGivaudan: input.workedWithGivaudan as boolean,
      ...choices,
    },
  };
}
