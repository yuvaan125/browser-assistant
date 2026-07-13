import { AIRequest } from "../types";

export function buildPrompt(request: AIRequest): string {
  switch (request.action) {

    case "explain":
      return `
Explain the highlighted text.

Rules:
- Maximum 40 words.
- One short paragraph.
- No headings.
- No markdown.
- No bullet points.
- Simple English.

Text:
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