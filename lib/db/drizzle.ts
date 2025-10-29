import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PGHOST && !process.env.PGPORT && !process.env.PGDATABASE && !process.env.PGUSER && !process.env.PGPASSWORD) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const ssl =
  process.env.NODE_ENV === "production"
    ? "require"
    : { rejectUnauthorized: false }; // DEV ONLY

export const client = postgres({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '6543'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl,
});
export const db = drizzle(client, { schema });
