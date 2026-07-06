import OpenAI from "openai";
import { getApiKey } from "./settings";

let client: OpenAI | null = null;

async function getClient(): Promise<OpenAI> {
  if (client) {
    return client;
  }

  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }

  client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  return client;
}

async function generate(prompt: string): Promise<string> {
  try {
    const openai = await getClient();

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    return response.output_text;
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new Error("Unable to generate AI response.");
  }
}

export async function explainText(text: string): Promise<string> {
  return generate(`
Explain the following text in simple language.

${text}
`);
}

export async function summarizeText(text: string): Promise<string> {
  return generate(`
Summarize the following text into concise bullet points.

${text}
`);
}