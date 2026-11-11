import type { Option } from '../components/ui/SelectField';

export type RegistrationValues = {
  fullName: string;
  email: string;
  company: string;
  sector: string;
  role: string;
  password: string;
  acceptTerms: boolean;
};

export type RegistrationErrors = Partial<
  Record<keyof RegistrationValues, string>
>;

export const initialRegistration: RegistrationValues = {
  fullName: '',
  email: '',
  company: '',
  sector: '',
  role: '',
  password: '',
  acceptTerms: false,
};

export const sectorOptions: Option[] = [
  { value: 'flavors', label: 'Arômes Alimentaires (Flavors)' },
  { value: 'fragrance', label: 'Parfumerie & Beauté' },
];

// Liste provisoire, à confirmer avec le produit.
export const roleOptions: Option[] = [
  { value: 'rd', label: 'R&D / Formulation' },
  { value: 'marketing', label: 'Marketing / Produit' },
  { value: 'purchasing', label: 'Achats' },
  { value: 'management', label: 'Direction' },
  { value: 'other', label: 'Autre' },
];

export const MIN_PASSWORD_LENGTH = 8;

export function validateRegistration(
  values: RegistrationValues,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!values.fullName.trim() || values.fullName.trim().length > 200)
    errors.fullName = 'Indiquez votre prénom et nom.';
  if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Indiquez un email valide.';
  if (!values.company.trim() || values.company.trim().length > 200)
    errors.company = "Indiquez le nom de l'entreprise.";
  if (!sectorOptions.some((option) => option.value === values.sector))
    errors.sector = "Choisissez un secteur d'activité.";
  if (!roleOptions.some((option) => option.value === values.role))
    errors.role = 'Choisissez votre rôle.';
  if (values.password.length < MIN_PASSWORD_LENGTH || values.password.length > 256)
    errors.password = `Entre ${MIN_PASSWORD_LENGTH} et 256 caractères.`;
  return errors;
}
