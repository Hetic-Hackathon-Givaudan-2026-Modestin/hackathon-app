import { readFile } from 'node:fs/promises';
import pg from 'pg';

try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL est requis pour la migration.');
}

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const name of ['001-users.sql', '002-sessions.sql']) {
    const migration = await readFile(
      new URL(`../../db/migrations/${name}`, import.meta.url),
      'utf8',
    );
    await db.query(migration);
    console.log(`Migration ${name} appliquée.`);
  }
} finally {
  await db.end();
}
