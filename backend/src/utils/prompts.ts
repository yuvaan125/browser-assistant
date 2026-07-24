import { AIRequest } from "../types";

export function buildPrompt(request: AIRequest): string {
  switch (request.action) {

    case "explain":
  return `
The user is reading a webpage and highlighted a specific passage.

Use the webpage as background context, but explain ONLY the highlighted text.

If information elsewhere on the page helps explain the highlighted text, include it naturally.

Do not summarize the webpage.
Do not repeat the highlighted text.
Do not explain unrelated sections.

Rules:
- Maximum 50 words.
- One short paragraph.
- No headings.
- No markdown.
- No bullet points.
- Use simple English.

Page Title:
${request.pageTitle}

Page URL:
${request.pageUrl}

Reference Webpage:
${request.pageText}

--------------------------------

Highlighted Text:
${request.selectedText}
`;

    case "summarize":
      return `
Summarize the highlighted text.

Rules:
- Maximum 40 words.
- One short paragraph.
- No headings.
- No markdown.
- No bullet points.

Text:
${request.selectedText}
`;

    case "translate":
      return `
Translate the highlighted text into simple English.

Return only the translated text.

Text:
${request.selectedText}
`;

    case "ask":
      return `
The user is viewing this webpage.

Title:
${request.pageTitle}

URL:
${request.pageUrl}

Content:
${request.pageText}

Question:
${request.question ?? request.selectedText}

Answer using the webpage first.
If the answer isn't present, clearly state that before answering generally.

Maximum 80 words.
`;

    default:
      throw new Error("Unsupported action.");
  }
}