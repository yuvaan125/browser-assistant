// ======================================
// Orbit AI Background Service
// ======================================

interface OrbitContext {
  metadata: { title: string; url: string };
  selectedText: string;
  question?: string;
  retrievedBlocks: { headingPath: string[]; text: string }[];
  headingHierarchy: string[];
}

interface OrbitActionMessage {
  type: "ORBIT_ACTION";
  action: "explain" | "summarize" | "translate" | "ask";
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  context: OrbitContext;
  question?: string;
}

async function generateWithBackend(
  action: string,
  payload: Record<string, unknown>
): Promise<string> {
  const { accessToken } = await chrome.storage.local.get("accessToken");

  console.log("Access Token:", accessToken);

  const response = await fetch("http://localhost:3000/ai", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },

    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

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
// ======================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "ORBIT_ACTION") {
    return;
  }

  const {
    action,
    selectedText,
    pageTitle,
    pageUrl,
    context,
    question,
  } = message as OrbitActionMessage;

  (async () => {
    try {
      console.log("Orbit Action:", action);

      let result = "";

      switch (action) {
        case "explain":
          result = await generateWithBackend("explain", {
            selectedText,
            pageTitle,
            pageUrl,
            context,
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
            context,
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
});

// ======================================
// Background Startup
// ======================================

console.log("=================================");
console.log("🚀 Orbit AI Background Started");
console.log("=================================");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Orbit AI installed.");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Orbit AI started.");
});

// Keep service worker alive while requests are running
self.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

self.addEventListener("error", (event) => {
  console.error("Background Error:", event.error || event.message);
});

console.log("✅ Orbit Background Ready");
