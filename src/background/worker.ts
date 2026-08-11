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
  name: string | null;
  avatarUrl: string | null;
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

  const metadata = data.user.user_metadata ?? {};

  const orbitUser = {
    id: data.user.id,
    email: data.user.email ?? null,
    name: (metadata.full_name as string | undefined) ?? null,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? null,
  };

  await chrome.storage.local.set({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    orbitUser,
  });

  return orbitUser;
}

async function refreshAccessToken(): Promise<string> {
  const stored = await chrome.storage.local.get("refreshToken");
  const refreshToken = stored.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    await chrome.storage.local.remove([
      "accessToken",
      "refreshToken",
      "orbitUser",
    ]);
    throw new Error(error?.message ?? "Failed to refresh session.");
  }

  await chrome.storage.local.set({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });

  return data.session.access_token;
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
  action: "explain" | "explainPage" | "summarize" | "translate" | "ask";
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  context: OrbitContext;
  question?: string;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return parsed.error;
  } catch {
    // not JSON, fall through to raw text
  }

  return text || `Request failed with status ${response.status}`;
}

// Inlined by Vite at build time. Unset (local dev) falls back to localhost;
// production builds run with VITE_BACKEND_URL set to the deployed origin.
// vite.config.ts reads the same variable to keep manifest host_permissions
// in sync — they must agree or the fetch is blocked by the extension sandbox.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

async function authedFetch(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  const stored = await chrome.storage.local.get("accessToken");
  const accessToken = stored.accessToken as string | undefined;

  const send = (token: string | undefined) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await send(accessToken);

  if (response.status === 401) {
    console.log("Access token rejected, attempting refresh...");

    try {
      response = await send(await refreshAccessToken());
    } catch (refreshError) {
      console.error("Session refresh failed:", refreshError);
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    console.error("Backend error:", message);
    throw new Error(message);
  }

  return response.json();
}

async function generateWithBackend(
  action: string,
  payload: Record<string, unknown>
): Promise<string> {
  const data = (await authedFetch("/ai", {
    method: "POST",
    body: JSON.stringify({ action, ...payload }),
  })) as { result: string };

  return data.result;
}

interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
}

async function fetchUsage(): Promise<UsageStats> {
  return (await authedFetch("/ai/usage")) as UsageStats;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_USAGE") {
    return;
  }

  fetchUsage()
    .then((usage) => sendResponse({ success: true, usage }))
    .catch((error) =>
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    );

  return true;
});

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

        case "explainPage":
          result = await generateWithBackend("explainPage", {
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
