import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const DIMS = 768;

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

export async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[][]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await withTimeout(
        ai.models.embedContent({
          model: EMBED_MODEL,
          contents: texts,
          config: { taskType, outputDimensionality: DIMS },
        }),
        20000
      );
      return (res.embeddings ?? []).map((e) => e.values ?? []);
    } catch (err) {
      lastError = err;
      console.warn(`Embedding attempt ${attempt} failed, retrying...`);
      await sleep(2000 * attempt);
    }
  }
  throw lastError;
}

// pgvector expects a string like "[0.1,0.2,...]"
export const toVector = (v: number[]) => `[${v.join(",")}]`;