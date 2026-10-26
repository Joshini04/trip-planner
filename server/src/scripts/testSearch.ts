import { pool } from "../db/client";
import { embedTexts, toVector } from "../lib/embed";

async function main() {
  const q = process.argv.slice(2).join(" ") || "quiet beaches with sunrise views";
  console.log("Query:", q);

  const [vec] = await embedTexts([q], "RETRIEVAL_QUERY");
  const { rows } = await pool.query(
    `SELECT name, district, category,
            ROUND((1 - (embedding <=> $1::vector))::numeric, 3) AS score
       FROM places
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5`,
    [toVector(vec)]
  );
  console.table(rows);
  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});