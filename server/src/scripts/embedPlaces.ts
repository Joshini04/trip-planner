import { pool } from "../db/client";
import { embedTexts, toVector } from "../lib/embed";

const BATCH = 8;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { rows } = await pool.query(
    "SELECT id, name, district, category, description, tags FROM places WHERE embedding IS NULL ORDER BY id"
  );
  console.log(`${rows.length} places need embeddings`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const texts = batch.map(
      (p) =>
        `${p.name} (${p.category}) in ${p.district}, Tamil Nadu. ${p.description} Tags: ${(p.tags ?? []).join(", ")}.`
    );

    const vectors = await embedTexts(texts, "RETRIEVAL_DOCUMENT");
    if (vectors.length !== batch.length) {
      throw new Error("Embedding count did not match the batch size");
    }

    for (let j = 0; j < batch.length; j++) {
      await pool.query("UPDATE places SET embedding = $1::vector WHERE id = $2", [
        toVector(vectors[j]),
        batch[j].id,
      ]);
    }
    console.log(`Embedded ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
    await sleep(1500);
  }

  await pool.end();
  console.log("Done");
}

main().catch((e) => {
  console.error("Error:", e.message ?? e);
  process.exit(1);
});