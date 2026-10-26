import { pool } from "../db/client";

async function main() {
  const now = await pool.query("SELECT NOW() AS now");
  console.log("DB connected:", now.rows[0].now);

  const ext = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname = 'vector'"
  );
  console.log("pgvector enabled:", ext.rowCount === 1);

  await pool.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});