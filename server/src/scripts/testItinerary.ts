import { buildItinerary } from "../lib/planner";
import { pool } from "../db/client";

async function main() {
  const q = process.argv.slice(2).join(" ") || "beaches and temples, low budget";
  console.log("Request:", q);

  const result = await buildItinerary(q, 2);
  console.log("\n" + result.title);
  console.log(result.summary);
  for (const d of result.days) {
    console.log(`\nDay ${d.day}: ${d.theme}`);
    for (const s of d.stops) {
      console.log(`  - ${s.place.name} (${s.place.district}): ${s.tip}`);
    }
  }
  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});