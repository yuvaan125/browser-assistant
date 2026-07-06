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

const SYSTEM_PROMPT = `
You are Orbit AI, an intelligent browser copilot.

Your job is to help users quickly understand webpages and selected text.

Rules:

- Always respond in GitHub Flavored Markdown.
- Use clear headings (##).
- Use bullet points where appropriate.
- Keep paragraphs under 3 lines.
- Never write long walls of text.
- Be concise but complete.
- Explain technical topics in simple language.
- Highlight the most important information first.
- If applicable, include a short "Key Takeaways" section.
- Do not repeat information unnecessarily.
`;

async function generate(userPrompt: string): Promise<string> {
  const ai = await getClient();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}

${userPrompt}`,
    });

    return response.text ?? "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Unable to generate AI response.");
  }
}

export async function explainText(text: string): Promise<string> {
  return generate(`
Explain the following selected text.

Respond using:

## Explanation

## Important Concepts

## Key Takeaways

Selected text:

${text}
`);
}

export async function summarizeText(text: string): Promise<string> {
  return generate(`
Summarize the following selected text.

Respond using:

## Summary

## Main Points

Text:

${text}
`);
}

export async function explainPage(pageText: string): Promise<string> {
  return generate(`
Explain the following webpage.

Respond using:

# Page Overview

## What This Page Is About

## Important Concepts

## Key Takeaways

Keep the response under 250 words unless the page requires more detail.

Webpage:

${pageText}
`);
}

export async function askAboutPage(
  question: string,
  pageTitle: string,
  pageUrl: string,
  pageText: string
): Promise<string> {
  return generate(`
The user is currently browsing this webpage.

## Page Title
${pageTitle}

## URL
${pageUrl}

## Webpage Content
${pageText}

---

The user asked:

"${question}"

Answer the question using the webpage as the primary source.

If the answer is not available on the page, clearly say so and then provide a helpful general explanation.

Respond in Markdown.
`);
}