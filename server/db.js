// Sujan – connection to the Postgres database (Neon)
//
// DATABASE_URL is set in Netlify → Project configuration → Environment variables.
// Never put it in the code or commit it.

import pg from "pg";

let pool = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // A Netlify Function handles one request at a time, so a few connections are enough
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}
