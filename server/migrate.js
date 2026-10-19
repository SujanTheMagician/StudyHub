// Sujan – create or update the database tables
//
// Runs on every Netlify deploy (npm run build) and can be run by hand with
// `npm run db:migrate`. Each file in server/migrations runs once, in name
// order, and is remembered in the schema_migrations table.
// To change the database, add a NEW file (0002_..., 0003_...). Never edit a
// file that is already live.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "./db.js";

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

const pool = getPool();
const client = await pool.connect();

try {
  // Only one deploy at a time may run migrations
  await client.query("SELECT pg_advisory_lock(424242)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (" +
      "name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );

  const applied = new Set(
    (await client.query("SELECT name FROM schema_migrations")).rows.map(
      function (row) {
        return row.name;
      },
    ),
  );
  const files = fs
    .readdirSync(migrationsDir)
    .filter(function (file) {
      return file.endsWith(".sql");
    })
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Migration " + file + " failed: " + error.message);
    }
    console.log("Applied migration " + file);
    count++;
  }
  console.log(
    count === 0
      ? "Database is up to date"
      : "Applied " + count + " migration(s)",
  );
} finally {
  await client.query("SELECT pg_advisory_unlock(424242)").catch(function () {});
  client.release();
  await pool.end();
}
