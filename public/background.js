// ======================================
// Orbit AI Background Service
// Part 1/3
// ======================================

async function generateWithBackend(action, payload) {

  const { accessToken } = await chrome.storage.local.get("accessToken");

  console.log("Access Token:", accessToken);

  const response = await fetch(
    "http://localhost:3000/ai",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },

      body: JSON.stringify({
        action,
        ...payload,
      }),
    }
  );

  console.log("Response Status:", response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error("Backend Response:", text);
    throw new Error(`Backend ${response.status}: ${text}`);
  }

  const data = await response.json();

  return data.result;
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

          result = await generateWithBackend("explain", {
  selectedText,
  pageTitle,
  pageUrl,
  pageText,
});

          break;

        case "summarize":

          result = await generateWithBackend("summarize", {
  selectedText,
});

          break;

        case "translate":

          result = await generateWithBackend("translate", {
  selectedText,
});

          break;

        case "ask":

          result = await generateWithBackend("ask", {
  question: question || selectedText,
  pageTitle,
  pageUrl,
  pageText,
});

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
        error:
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
    error:
      error instanceof Error
        ? error.message
        : String(error),
  };
}

console.log("✅ Orbit Background Ready");