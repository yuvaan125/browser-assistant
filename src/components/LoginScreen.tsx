import { supabase } from "../auth/auth";

// Web OAuth client ID from Google Cloud Console (Credentials > OAuth client ID > Web application).
// Must be a "Web application" client, NOT a "Chrome extension" client, because we're driving
// the OAuth flow manually with chrome.identity.launchWebAuthFlow instead of getAuthToken().
const GOOGLE_CLIENT_ID = "479032247416-c2j19ric6dnnm0cb5eljk6m7845m67hr.apps.googleusercontent.com";

export default function LoginScreen() {
  async function handleGoogleLogin() {
    try {
      // e.g. https://<extension-id>.chromiumapp.org/
      // Register this exact URL as an Authorized redirect URI on the Google OAuth client.
      const redirectUri = chrome.identity.getRedirectURL();

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("response_type", "id_token");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set("nonce", crypto.randomUUID());
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
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      console.log("Signed in:", data.user?.email);
      // onAuthStateChange (in session.ts) fires from this call and saves
      // accessToken into chrome.storage.local for background.js to use.
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert(err instanceof Error ? err.message : String(err));
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
      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
}