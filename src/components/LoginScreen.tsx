import { supabase } from "../auth/auth";

export default function LoginScreen() {
  async function handleGoogleLogin() {
    console.log("Starting Google login...");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    console.log("OAuth Data:", data);
    console.log("OAuth Error:", error);

    if (error) {
      console.error(error);
      alert(error.message);
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