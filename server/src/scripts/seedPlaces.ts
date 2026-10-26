import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../db/client";

type Place = {
  name: string;
  district: string;
  category: string;
  description: string;
  budget_level?: string;
  best_season?: string;
  tags?: string[];
};

async function main() {
  const file = join(process.cwd(), "data", "tamilnadu.json");
  const places: Place[] = JSON.parse(readFileSync(file, "utf-8"));

  let inserted = 0;
  for (const p of places) {
    const res = await pool.query(
      `INSERT INTO places
         (name, state, district, category, description, budget_level, best_season, tags)
       VALUES ($1, 'Tamil Nadu', $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name, state) DO NOTHING`,
      [p.name, p.district, p.category, p.description, p.budget_level ?? null, p.best_season ?? null, p.tags ?? []]
    );
    inserted += res.rowCount ?? 0;
  }

  const total = await pool.query("SELECT COUNT(*) FROM places");
  console.log(`Inserted ${inserted} new places. Total in table: ${total.rows[0].count}`);
  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});