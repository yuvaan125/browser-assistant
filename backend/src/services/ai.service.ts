import { gemini } from "../config/gemini";
import { buildPrompt } from "../utils/prompts";
import { AIRequest } from "../types";

export async function processAIRequest(
  request: AIRequest
): Promise<string> {

  const prompt = buildPrompt(request);

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text ?? "No response generated.";

}