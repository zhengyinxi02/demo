import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url) {
  console.log("[migrate] DATABASE_URL unset — skip (local PGlite applies migrations on boot)");
  process.exit(0);
}

const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

for (const file of files) {
  const id = file;
  const exists = await client.query("SELECT 1 FROM _migrations WHERE id = $1", [id]);
  if (exists.rowCount) continue;
  const sqlText = await readFile(`migrations/${file}`, "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sqlText);
    await client.query("INSERT INTO _migrations (id) VALUES ($1)", [id]);
    await client.query("COMMIT");
    console.log("[migrate] applied", file);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}

await client.end();
console.log("[migrate] done");
