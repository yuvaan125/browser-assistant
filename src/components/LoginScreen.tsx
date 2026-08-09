import { useState } from "react";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);

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
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <button onClick={handleGoogleLogin} disabled={loading}>
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
    </div>
  );
}
