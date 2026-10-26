import { Router } from "express";
import { searchPlaces, buildItinerary } from "../lib/planner";

const router = Router();

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing q" });
    return;
  }
  try {
    res.json(await searchPlaces(q, 8));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Search failed" });
  }
});

router.post("/itinerary", async (req, res) => {
  const query = String(req.body?.query ?? "").trim();
  const days = Number(req.body?.days) || 2;
  if (!query) {
    res.status(400).json({ error: "Missing query" });
    return;
  }
  try {
    res.json(await buildItinerary(query, days));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not build itinerary" });
  }
});

export default router;