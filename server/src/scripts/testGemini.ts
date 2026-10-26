import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY;
console.log("Key loaded:", key ? `yes (${key.length} chars)` : "NO");

const ai = new GoogleGenAI({ apiKey: key! });

async function main() {
  console.log("Calling Gemini...");
  const res = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: "Say hello in one short sentence.",
  });
  console.log("Reply:", res.text);
}

main().catch((e) => console.error(e));