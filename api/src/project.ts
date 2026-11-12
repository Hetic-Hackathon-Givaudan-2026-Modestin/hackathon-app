export type ProjectInput = {
  fullName: string;
  company: string;
  role: string;
  email: string;
  salesZone: string;
  market: string;
  quantity: string;
  positioning: string;
  workedWithGivaudan: boolean;
  description: string;
};

// Mêmes valeurs que web/src/lib/project.ts ; listes provisoires (ticket de définition des champs).
const allowed = {
  role: ['rd', 'marketing', 'purchasing', 'management', 'other'],
  salesZone: ['france', 'europe', 'north-america', 'asia', 'other'],
  market: ['agro', 'perfume', 'beauty', 'home', 'other'],
  quantity: ['sample', 'small', 'medium', 'large'],
  positioning: ['entry', 'mid', 'premium'],
} as const;

export const MIN_DESCRIPTION_LENGTH = 20;
export const MAX_DESCRIPTION_LENGTH = 4000;

type ParseResult = { value: ProjectInput } | { fields: string[] };

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
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
  const description = text(input.description, MAX_DESCRIPTION_LENGTH);
  if (!fullName) fields.push('fullName');
  if (!company) fields.push('company');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.push('email');
  if (!description || description.length < MIN_DESCRIPTION_LENGTH)
    fields.push('description');
  if (typeof input.workedWithGivaudan !== 'boolean')
    fields.push('workedWithGivaudan');

  const choices = {} as Record<keyof typeof allowed, string>;
  for (const key of Object.keys(allowed) as (keyof typeof allowed)[]) {
    const value = input[key];
    if (typeof value === 'string' && (allowed[key] as readonly string[]).includes(value))
      choices[key] = value;
    else fields.push(key);
  }

  if (fields.length > 0) return { fields };
  return {
    value: {
      fullName: fullName!,
      company: company!,
      email: email!,
      description: description!,
      workedWithGivaudan: input.workedWithGivaudan as boolean,
      ...choices,
    },
  };
}
