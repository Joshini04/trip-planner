import { readdirSync, readFileSync } from "fs";
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

// District -> region (keys are lowercase)
const REGIONS: Record<string, string> = {
  // North
  chennai: "North", chengalpattu: "North", kanchipuram: "North", tiruvallur: "North",
  ranipet: "North", vellore: "North", tirupathur: "North", tiruvannamalai: "North",
  viluppuram: "North", villupuram: "North", kallakurichi: "North",
  // Central (Cauvery delta and around)
  cuddalore: "Central", thanjavur: "Central", tiruvarur: "Central", nagapattinam: "Central",
  mayiladuthurai: "Central", tiruchirappalli: "Central", trichy: "Central", ariyalur: "Central",
  perambalur: "Central", karur: "Central", pudukkottai: "Central",
  // West (Kongu and the Nilgiris)
  coimbatore: "West", tiruppur: "West", erode: "West", salem: "West", namakkal: "West",
  dharmapuri: "West", krishnagiri: "West", "the nilgiris": "West", nilgiris: "West",
  // South
  madurai: "South", dindigul: "South", theni: "South", sivaganga: "South",
  virudhunagar: "South", ramanathapuram: "South", thoothukudi: "South", tuticorin: "South",
  tirunelveli: "South", tenkasi: "South", kanyakumari: "South",
};

function regionFor(district: string): string | null {
  return REGIONS[district.trim().toLowerCase()] ?? null;
}

async function main() {
  // Add the region column if it is not there yet
  await pool.query("ALTER TABLE places ADD COLUMN IF NOT EXISTS region TEXT");

  const dir = join(process.cwd(), "data");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  console.log("Data files:", files.join(", "));

  let inserted = 0;
  const unmapped = new Set<string>();

  for (const f of files) {
    const places: Place[] = JSON.parse(readFileSync(join(dir, f), "utf-8"));
    for (const p of places) {
      const region = regionFor(p.district);
      if (!region) unmapped.add(p.district);

      const res = await pool.query(
        `INSERT INTO places
           (name, state, district, category, description, budget_level, best_season, tags, region)
         VALUES ($1, 'Tamil Nadu', $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name, state) DO UPDATE SET region = EXCLUDED.region
         RETURNING (xmax = 0) AS inserted`,
        [
          p.name,
          p.district,
          p.category,
          p.description,
          p.budget_level ?? null,
          p.best_season ?? null,
          p.tags ?? [],
          region,
        ]
      );
      if (res.rows[0]?.inserted) inserted++;
    }
  }

  const total = await pool.query("SELECT COUNT(*) FROM places");
  console.log(`Inserted ${inserted} new places. Total in table: ${total.rows[0].count}`);
  if (unmapped.size > 0) {
    console.log("Districts with no region yet:", [...unmapped].join(", "));
  }
  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});