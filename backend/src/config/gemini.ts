import { GoogleGenAI } from "@google/genai";

console.log("GEMINI_API_KEY exists =", !!process.env.GEMINI_API_KEY);

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});