import type { Option } from '../components/ui/SelectField';

export type ProjectValues = {
  fullName: string;
  company: string;
  role: string;
  email: string;
  salesZone: string;
  market: string;
  productType: string;
  budgetPerKg: string;
  annualVolumeKg: string;
  positioning: string;
  workedWithGivaudan: string;
  projectStage: string;
  launchTiming: string;
};

export type ProjectErrors = Partial<Record<keyof ProjectValues, string>>;
export type ProjectStep =
  | 'general'
  | 'product'
  | 'budget'
  | 'volume'
  | 'salesZone'
  | 'stage'
  | 'launch'
  | 'positioning';

export const initialProject: ProjectValues = {
  fullName: '',
  company: '',
  role: '',
  email: '',
  salesZone: '',
  market: '',
  productType: '',
  budgetPerKg: '',
  annualVolumeKg: '',
  positioning: '',
  workedWithGivaudan: '',
  projectStage: '',
  launchTiming: '',
};

export const projectSteps: ProjectStep[] = [
  'general',
  'product',
  'budget',
  'volume',
  'salesZone',
  'stage',
  'launch',
  'positioning',
];

export const projectStepLabels = [
  'Votre projet',
  'Produit',
  'Budget',
  'Volume annuel',
  'Zone de vente',
  'Avancement',
  'Lancement',
  'Positionnement',
];

// Les listes d'options sont provisoires, à confirmer avec le produit.
export const roleOptions: Option[] = [
  { value: 'rd', label: 'R&D / Formulation' },
  { value: 'marketing', label: 'Marketing / Produit' },
  { value: 'purchasing', label: 'Achats' },
  { value: 'management', label: 'Direction' },
  { value: 'other', label: 'Autre' },
];

export const marketOptions: Option[] = [
  { value: 'agro', label: 'Agroalimentaire' },
  { value: 'perfume', label: 'Parfumerie' },
  { value: 'beauty', label: 'Beauté et soins' },
  { value: 'home', label: 'Entretien et maison' },
  { value: 'other', label: 'Autre' },
];

export const salesZoneOptions: Option[] = [
  { value: 'france', label: 'France' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'Amérique du Nord' },
  { value: 'asia', label: 'Asie' },
  { value: 'other', label: 'Autre zone' },
];

export const positioningOptions: Option[] = [
  { value: 'entry', label: 'Entrée de gamme' },
  { value: 'mid', label: 'Milieu de gamme' },
  { value: 'premium', label: 'Premium' },
];

export const projectStageOptions: Option[] = [
  { value: 'idea', label: 'Idée en cours de définition' },
  { value: 'development', label: 'Développement du produit' },
  { value: 'testing', label: 'Prototype ou tests' },
  { value: 'ready', label: 'Prêt à être lancé' },
  { value: 'launched', label: 'Produit déjà lancé' },
  { value: 'unknown', label: 'Pas encore défini' },
];

export const launchTimingOptions: Option[] = [
  { value: 'under-6-months', label: 'Dans moins de 6 mois' },
  { value: '6-12-months', label: 'Dans 6 à 12 mois' },
  { value: '1-2-years', label: 'Dans 1 à 2 ans' },
  { value: 'over-2-years', label: 'Dans plus de 2 ans' },
  { value: 'unknown', label: 'Date pas encore définie' },
];

export const workedWithOptions: Option[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
];

const MAX_PRODUCT_TYPE_LENGTH = 200;
const MAX_BUDGET_PER_KG = 1_000_000;
const MAX_ANNUAL_VOLUME_KG = 1_000_000_000;

function isOneOf(options: Option[], value: string) {
  return options.some((option) => option.value === value);
}

function numericValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function validateGeneral(values: ProjectValues): ProjectErrors {
  const errors: ProjectErrors = {};
  const text = (value: string) => value.trim().length;
  const email = values.email.trim();

  if (!text(values.fullName) || text(values.fullName) > 200)
    errors.fullName = 'Indiquez votre prénom et votre nom.';
  if (!text(values.company) || text(values.company) > 200)
    errors.company = "Indiquez le nom de votre entreprise.";
  if (!isOneOf(roleOptions, values.role))
    errors.role = 'Choisissez votre rôle.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Indiquez un email professionnel valide.';
  if (!isOneOf(workedWithOptions, values.workedWithGivaudan))
    errors.workedWithGivaudan = 'Répondez à cette question.';
  return errors;
}

export function validateProjectStep(
  step: Exclude<ProjectStep, 'general'>,
  values: ProjectValues,
): ProjectErrors {
  switch (step) {
    case 'product':
      return {
        ...(!isOneOf(marketOptions, values.market)
          ? { market: 'Choisissez le secteur du produit.' }
          : {}),
        ...(!values.productType.trim() || values.productType.trim().length > MAX_PRODUCT_TYPE_LENGTH
          ? { productType: 'Précisez le type de produit (200 caractères maximum).' }
          : {}),
      };
    case 'budget': {
      if (!values.budgetPerKg.trim()) return {};
      const budget = numericValue(values.budgetPerKg);
      return budget === null || budget > MAX_BUDGET_PER_KG
        ? { budgetPerKg: 'Indiquez un budget supérieur à 0 €/kg, ou laissez vide s’il n’est pas encore défini.' }
        : {};
    }
    case 'volume': {
      if (!values.annualVolumeKg.trim()) return {};
      const volume = numericValue(values.annualVolumeKg);
      return volume === null || volume > MAX_ANNUAL_VOLUME_KG
        ? { annualVolumeKg: 'Indiquez un volume supérieur à 0 kg/an, ou laissez vide s’il n’est pas encore défini.' }
        : {};
    }
    case 'salesZone':
      return isOneOf(salesZoneOptions, values.salesZone)
        ? {}
        : { salesZone: 'Choisissez où le produit sera vendu.' };
    case 'stage':
      return isOneOf(projectStageOptions, values.projectStage)
        ? {}
        : { projectStage: 'Indiquez l’avancement du projet.' };
    case 'launch':
      return isOneOf(launchTimingOptions, values.launchTiming)
        ? {}
        : { launchTiming: 'Indiquez quand vous souhaitez lancer le produit.' };
    case 'positioning':
      return isOneOf(positioningOptions, values.positioning)
        ? {}
        : { positioning: 'Choisissez le positionnement du produit.' };
  }
}

export function validateStep(step: ProjectStep, values: ProjectValues): ProjectErrors {
  return step === 'general' ? validateGeneral(values) : validateProjectStep(step, values);
}
