import type { Option } from '../components/ui/SelectField';

export type ProjectValues = {
  fullName: string;
  company: string;
  role: string;
  email: string;
  salesZone: string;
  market: string;
  quantity: string;
  positioning: string;
  workedWithGivaudan: string;
  description: string;
};

export type ProjectErrors = Partial<Record<keyof ProjectValues, string>>;

export type ProjectStep = 'general' | 'description';

export const initialProject: ProjectValues = {
  fullName: '',
  company: '',
  role: '',
  email: '',
  salesZone: '',
  market: '',
  quantity: '',
  positioning: '',
  workedWithGivaudan: '',
  description: '',
};

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

export const quantityOptions: Option[] = [
  { value: 'sample', label: 'Échantillon ou test' },
  { value: 'small', label: 'Petite série' },
  { value: 'medium', label: 'Série moyenne' },
  { value: 'large', label: 'Grande série' },
];

export const positioningOptions: Option[] = [
  { value: 'entry', label: 'Entrée de gamme' },
  { value: 'mid', label: 'Milieu de gamme' },
  { value: 'premium', label: 'Premium' },
];

export const workedWithOptions: Option[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
];

export const MAX_DESCRIPTION_LENGTH = 4000;
export const MIN_DESCRIPTION_LENGTH = 20;

function isOneOf(options: Option[], value: string) {
  return options.some((option) => option.value === value);
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
  if (!isOneOf(salesZoneOptions, values.salesZone))
    errors.salesZone = 'Choisissez où vous souhaitez vendre.';
  if (!isOneOf(marketOptions, values.market))
    errors.market = 'Choisissez le marché visé.';
  if (!isOneOf(quantityOptions, values.quantity))
    errors.quantity = 'Choisissez une quantité envisagée.';
  if (!isOneOf(positioningOptions, values.positioning))
    errors.positioning = 'Choisissez un positionnement.';
  if (!isOneOf(workedWithOptions, values.workedWithGivaudan))
    errors.workedWithGivaudan = 'Répondez à cette question.';
  return errors;
}

export function validateDescription(values: ProjectValues): ProjectErrors {
  const length = values.description.trim().length;
  if (length < MIN_DESCRIPTION_LENGTH)
    return {
      description: `Décrivez votre projet en au moins ${MIN_DESCRIPTION_LENGTH} caractères.`,
    };
  if (length > MAX_DESCRIPTION_LENGTH)
    return {
      description: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`,
    };
  return {};
}

export function validateStep(
  step: ProjectStep,
  values: ProjectValues,
): ProjectErrors {
  return step === 'general'
    ? validateGeneral(values)
    : validateDescription(values);
}
