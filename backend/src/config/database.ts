import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';

let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    // @ts-expect-error - Drizzle Neon type compatibility issue
    db = drizzle(sql, { schema });
  } catch (error) {
    console.warn('Failed to connect to database, running without database:', error);
    db = null;
  }
} else {
  console.warn('DATABASE_URL not set, running without database');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Please check DATABASE_URL environment variable.');
  }
  
  return db as any;
}

export { db };
