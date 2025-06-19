// lib/db1.ts
// Minimal PostgreSQL connection pool utility for API routes
// Requires environment variables: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
// If you see a type error for 'pg', run: npm install pg @types/pg
// @ts-ignore
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
});

export async function getConnection1() {
  return pool.connect();
} 