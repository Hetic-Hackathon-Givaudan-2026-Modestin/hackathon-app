import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const sectors = ['flavors', 'fragrance'];
const roles = ['rd', 'marketing', 'purchasing', 'management', 'other'];

export type Registration = {
  fullName: string;
  email: string;
  company: string;
  sector: string;
  role: string;
  password: string;
};

export function parseRegistration(input: unknown): Registration | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }
  const data = input as Record<string, unknown>;
  const { fullName, email, company, sector, role, password } = data;
  if (
    typeof fullName !== 'string' ||
    typeof email !== 'string' ||
    typeof company !== 'string' ||
    typeof sector !== 'string' ||
    typeof role !== 'string' ||
    typeof password !== 'string'
  ) {
    return null;
  }

  const name = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCompany = company.trim();
  if (
    !name ||
    name.length > 200 ||
    !normalizedCompany ||
    normalizedCompany.length > 200 ||
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    !sectors.includes(sector) ||
    !roles.includes(role) ||
    password.length < 8 ||
    password.length > 256
  ) {
    return null;
  }
  return {
    fullName: name,
    email: normalizedEmail,
    company: normalizedCompany,
    sector,
    role,
    password,
  };
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivePassword(password, salt);
  return `scrypt$32768$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (
    parts.length !== 6 ||
    parts[0] !== 'scrypt' ||
    parts[1] !== '32768' ||
    parts[2] !== '8' ||
    parts[3] !== '1' ||
    !/^[0-9a-f]{32}$/.test(parts[4]) ||
    !/^[0-9a-f]{128}$/.test(parts[5])
  ) {
    throw new Error('Format de hachage du mot de passe invalide.');
  }
  const key = await derivePassword(password, Buffer.from(parts[4], 'hex'));
  return timingSafeEqual(key, Buffer.from(parts[5], 'hex'));
}
