import { pool } from "../db/client";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS places (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      state         TEXT NOT NULL DEFAULT 'Tamil Nadu',
      district      TEXT NOT NULL,
      category      TEXT NOT NULL,
      description   TEXT NOT NULL,
      budget_level  TEXT,
      best_season   TEXT,
      tags          TEXT[] DEFAULT '{}',
      embedding     vector(768),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (name, state)
    );
  `);
  console.log("places table ready");
  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});