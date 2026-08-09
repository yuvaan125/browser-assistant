// ======================================
// Orbit AI Background Service
// ======================================

import { createClient } from "@supabase/supabase-js";

// Web OAuth client ID from Google Cloud Console (Credentials > OAuth client ID > Web application).
// Must be a "Web application" client, NOT a "Chrome extension" client, because we're driving
// the OAuth flow manually with chrome.identity.launchWebAuthFlow instead of getAuthToken().
const GOOGLE_CLIENT_ID =
  "479032247416-c2j19ric6dnnm0cb5eljk6m7845m67hr.apps.googleusercontent.com";

// This client only ever performs the one-off signInWithIdToken exchange below.
// persistSession/detectSessionInUrl are disabled because service workers have no
// localStorage or window — the resulting session is written to chrome.storage.local
// by hand instead, which is what generateWithBackend() already reads from.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signInWithGoogle(): Promise<{
  id: string;
  email: string | null;
}> {
  // e.g. https://<extension-id>.chromiumapp.org/
  // Registered as an Authorized redirect URI on the Google OAuth client.
  const redirectUri = chrome.identity.getRedirectURL();

  // Supabase verifies the id_token's nonce claim the same way Google's own
  // Sign-In library does: Google gets the SHA-256 hash, Supabase gets the raw
  // value and hashes it internally to compare. Passing the same raw value to
  // both sides causes a "Nonces mismatch" error.
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", hashedNonce);
  authUrl.searchParams.set("prompt", "select_account");

  const responseUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          reject(chrome.runtime.lastError ?? new Error("No response from Google."));
          return;
        }
        resolve(redirectedTo);
      }
    );
  });

  const hash = new URL(responseUrl).hash.replace(/^#/, "");
  const idToken = new URLSearchParams(hash).get("id_token");

  if (!idToken) {
    throw new Error("Google did not return an id_token.");
  }

  // Supabase project needs Google enabled under Authentication > Providers,
  // with this same Client ID entered there.
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error("Supabase did not return a session.");
  }

  await chrome.storage.local.set({
    accessToken: data.session.access_token,
    orbitUser: { id: data.user.id, email: data.user.email ?? null },
  });

  return { id: data.user.id, email: data.user.email ?? null };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GOOGLE_LOGIN") {
    return;
  }

  console.log("Google sign-in requested, redirect URL:", chrome.identity.getRedirectURL());

  signInWithGoogle()
    .then((user) => {
      console.log("Google sign-in succeeded:", user);
      sendResponse({ success: true, user });
    })
    .catch((error) => {
      console.error("Google sign-in failed in background:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  return true;
});

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
