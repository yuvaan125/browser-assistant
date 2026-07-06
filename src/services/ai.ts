import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./settings";

let client: GoogleGenAI | null = null;

async function getClient(): Promise<GoogleGenAI> {
  if (client) return client;

  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key not configured.");
  }

  client = new GoogleGenAI({
    apiKey,
  });

  return client;
}

async function generate(prompt: string): Promise<string> {
  const ai = await getClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text ?? "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Unable to generate AI response.");
  }
}

export async function explainText(text: string): Promise<string> {
  return generate(`
Explain the following text in a clear, beginner-friendly way.

${text}
`);
}

export async function summarizeText(text: string): Promise<string> {
  return generate(`
Summarize the following text into concise bullet points.

${text}
`);
}

export async function explainPage(pageText: string): Promise<string> {
  return generate(`
You are an AI browser assistant.

Explain this webpage to the user.

Your answer should include:

- What this page is about
- The important concepts
- Key takeaways

Keep the explanation concise.

${pageText}
`);
}
