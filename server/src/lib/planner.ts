import { pool } from "../db/client";
import { embedTexts, toVector } from "./embed";
import { generateJson } from "./gemini";

export type PlaceRow = {
  id: number;
  name: string;
  district: string;
  category: string;
  description: string;
  budget_level: string | null;
  best_season: string | null;
  tags: string[];
  score: number;
};

type RawPlan = {
  title: string;
  summary: string;
  days: { day: number; theme: string; stops: { place_id: number; tip: string }[] }[];
};

export async function searchPlaces(query: string, limit = 8): Promise<PlaceRow[]> {
  const [vec] = await embedTexts([query], "RETRIEVAL_QUERY");
  const { rows } = await pool.query(
    `SELECT id, name, district, category, description, budget_level, best_season, tags,
            ROUND((1 - (embedding <=> $1::vector))::numeric, 3)::float AS score
       FROM places
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [toVector(vec), limit]
  );
  return rows;
}

export async function buildItinerary(query: string, days: number) {
  const numDays = Math.min(Math.max(Math.round(days), 1), 7);
const places = await searchPlaces(query, Math.min(numDays * 4, 14));  if (places.length === 0) throw new Error("No places found");

  const list = places
    .map(
      (p) =>
        `- id ${p.id}: ${p.name} (${p.category}, ${p.district}). ${p.description} Budget: ${p.budget_level ?? "n/a"}. Best season: ${p.best_season ?? "n/a"}.`
    )
    .join("\n");

    const prompt = `You are a Tamil Nadu trip planner. Plan a ${numDays}-day trip for this request: "${query}".

Use ONLY the places listed below. Do not invent places. Put places in the same or nearby districts on the same day, with 2 to 3 stops per day. Each day should have at least 2 stops when enough places are available. You do not have to use every place.

Places:
${list}

Return only JSON in exactly this shape:
{"title": string, "summary": string, "days": [{"day": number, "theme": string, "stops": [{"place_id": number, "tip": string}]}]}`;

  const plan = await generateJson<RawPlan>(prompt);
  if (!Array.isArray(plan.days)) throw new Error("Model returned an unexpected format");

  // Only keep stops that point to places we actually retrieved
  const byId = new Map(places.map((p) => [p.id, p]));
  return {
    title: plan.title,
    summary: plan.summary,
    days: plan.days.map((d) => ({
      day: d.day,
      theme: d.theme,
      stops: (d.stops ?? [])
        .filter((s) => byId.has(s.place_id))
        .map((s) => ({ place: byId.get(s.place_id)!, tip: s.tip })),
    })),
  };
}