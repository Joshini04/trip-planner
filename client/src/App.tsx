import { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type Place = {
  id: number;
  name: string;
  district: string;
  category: string;
  budget_level: string | null;
  best_season: string | null;
};
type Stop = { place: Place; tip: string };
type Day = { day: number; theme: string; stops: Stop[] };
type Itinerary = { title: string; summary: string; days: Day[] };

export default function App() {
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(2);
  const [plan, setPlan] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch(`${API}/api/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, days }),
      });
      if (!res.ok) throw new Error("Request failed");
      setPlan(await res.json());
    } catch {
      setError("Could not build a plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Trip Planner</h1>
        <p className="mt-1 text-slate-600">
          Describe your trip in Tamil Nadu and get a day-by-day plan.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-indigo-500"
            placeholder="e.g. quiet hill stations and waterfalls, low budget"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
          >
            {loading ? "Planning..." : "Plan trip"}
          </button>
        </div>

        {loading && (
          <p className="mt-6 text-slate-600">
            Finding places and building your itinerary. This can take up to a minute...
          </p>
        )}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {plan && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">{plan.title}</h2>
            <p className="mt-1 text-slate-600">{plan.summary}</p>

            <div className="mt-6 space-y-6">
              {plan.days.map((d) => (
                <div key={d.day} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold">
                    Day {d.day}: {d.theme}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {d.stops.map((s) => (
                      <div key={s.place.id} className="border-l-4 border-indigo-500 pl-4">
                        <p className="font-medium">{s.place.name}</p>
                        <p className="text-sm text-slate-500">
                          {s.place.district} · {s.place.category}
                          {s.place.budget_level ? ` · ${s.place.budget_level} budget` : ""}
                          {s.place.best_season ? ` · best: ${s.place.best_season}` : ""}
                        </p>
                        <p className="mt-1 text-slate-700">{s.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}