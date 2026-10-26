import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timed out")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// Tries the main model twice, then the fallback model twice.
export async function generateJson<T>(prompt: string): Promise<T> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" },
          }),
          20000
        );
        const text = (res.text ?? "").replace(/```json|```/g, "").trim();
        return JSON.parse(text) as T;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini ${model} attempt ${attempt} failed: ${(err as Error).message}`);
        await sleep(1500);
      }
    }
  }
  throw lastError;
}