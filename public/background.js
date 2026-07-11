// ======================================
// Orbit AI Background Service
// Part 1/3
// ======================================

const API_KEY_STORAGE = "gemini_api_key";

const SYSTEM_PROMPT = `
You are Orbit AI, an intelligent browser copilot.

The user is already reading the webpage.
Your job is to continue their understanding, not teach a lesson.

Write like a knowledgeable friend sitting beside them.

Rules:

- Maximum 35 words unless absolutely necessary.
- Write exactly one short paragraph.
- Never use headings.
- Never use bullet points.
- Never use markdown.
- Never repeat the selected text.
- Never explain every keyword separately.
- Never define obvious terms.
- Combine ideas into one smooth explanation.
- Don't sound like a teacher or textbook.
- Don't start with "This means..." or "The text explains..."
- Get straight to the point.
`;

async function getApiKey() {
  const result = await chrome.storage.local.get(API_KEY_STORAGE);

  return result[API_KEY_STORAGE] || null;
}

async function generateWithGemini(prompt) {

  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured."
    );
  }

  console.log("Calling Gemini...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}

${prompt}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {

    const error = await response.text();

    console.error(error);

    throw new Error(error);

  }

  const data = await response.json();

  console.log("Gemini Response:", data);

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No response generated."
  );
}

// ======================================
// Prompt Builders
// ======================================

function explainPrompt(text) {

  return `
The following text has been highlighted by someone reading a webpage.

Continue their understanding naturally.

Don't summarize.
Don't paraphrase.
Don't lecture.

Imagine they asked:
"So what does this actually mean?"

Respond with one short paragraph of no more than 35 words.

Highlighted text:

${text}
`;

}

function summarizePrompt(text) {

  return `
Summarize the following selected text.

Respond using:

Summary:

Main Points:

Text:

${text}
`;

}

function translatePrompt(text) {

  return `
Translate the following text into simple English.

Text:

${text}
`;

}

function askPrompt(
  question,
  pageTitle,
  pageUrl,
  pageText
) {

  return `
The user is viewing this webpage.

Title:
${pageTitle}

URL:
${pageUrl}

Content:
${pageText}

Question:

${question}

Answer using the webpage first.

If the answer isn't on the page,
say so and then answer generally.
`;

}
// ======================================
// Orbit Message Handler
// Part 2/3
// ======================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type !== "ORBIT_ACTION") {
    return;
  }

  (async () => {

    try {

      const {
        action,
        selectedText,
        pageTitle,
        pageUrl,
        pageText,
        question,
      } = message;

      console.log("Orbit Action:", action);

      let result = "";

      switch (action) {

        case "explain":

          result = await generateWithGemini(
            explainPrompt(selectedText)
          );

          break;

        case "summarize":

          result = await generateWithGemini(
            summarizePrompt(selectedText)
          );

          break;

        case "translate":

          result = await generateWithGemini(
            translatePrompt(selectedText)
          );

          break;

        case "ask orbit":

          result = await generateWithGemini(
            askPrompt(
              question || selectedText,
              pageTitle,
              pageUrl,
              pageText
            )
          );

          break;

        default:

          result = "Unknown action.";

      }

      sendResponse({
        success: true,
        result,
      });

    } catch (error) {

      console.error("Orbit Error:", error);

      sendResponse({
        success: false,
        result:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  })();

  return true;

});
// ======================================
// Background Startup
// Part 3/3
// ======================================

console.log("=================================");
console.log("🚀 Orbit AI Background Started");
console.log("=================================");

// Wake-up message
chrome.runtime.onInstalled.addListener(() => {
  console.log("Orbit AI installed.");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Orbit AI started.");
});

// Keep service worker alive while requests are running
self.addEventListener("unhandledrejection", (event) => {
  console.error(
    "Unhandled Promise Rejection:",
    event.reason
  );
});

self.addEventListener("error", (event) => {
  console.error(
    "Background Error:",
    event.error || event.message
  );
});

// ======================================
// Utility Functions
// ======================================

function success(result) {
  return {
    success: true,
    result,
  };
}

function failure(error) {
  return {
    success: false,
    result:
      error instanceof Error
        ? error.message
        : String(error),
  };
}

console.log("✅ Orbit Background Ready");