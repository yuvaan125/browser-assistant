// ======================================
// Orbit AI Background Service
// Part 1/3
// ======================================

const API_KEY_STORAGE = "gemini_api_key";

const SYSTEM_PROMPT = `
You are Orbit AI, an intelligent browser copilot.

Your job is to help users understand webpages quickly.

Rules:

- Respond in GitHub Markdown.
- Be concise.
- Use headings.
- Prefer bullet points.
- Never write huge paragraphs.
- Explain difficult concepts simply.
- Always answer based on the supplied content.
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
Explain the following selected text.

Respond using:

## Explanation

## Important Concepts

## Key Takeaways

Selected Text:

${text}
`;

}

function summarizePrompt(text) {

  return `
Summarize the following selected text.

Respond using:

## Summary

## Main Points

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