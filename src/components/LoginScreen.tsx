import { useState } from "react";

import "./LoginScreen.css";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      // The actual OAuth flow runs in the background service worker, not here.
      // chrome.identity.launchWebAuthFlow opens a window that steals focus, which
      // makes Chrome close this extension popup immediately — killing any pending
      // promise in this component. The background keeps running regardless, and
      // writes the resulting session to chrome.storage.local when it's done.
      const response = await chrome.runtime.sendMessage({
        type: "GOOGLE_LOGIN",
      });

      if (!response?.success) {
        throw new Error(response?.error ?? "Sign-in failed.");
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <img src="/icons/icon128.png" alt="" className="login-logo" />

      <h1 className="login-title">Orbit AI</h1>

      <p className="login-subtitle">
        Explain, summarize, and ask questions about any page you're reading.
      </p>

      <div className="login-actions">
        <button
          className="btn btn-block btn-primary"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-footnote">
          Free to use, 50 requests per day.
        </p>
      </div>
    </div>
  );
}
