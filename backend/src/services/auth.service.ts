import { supabase } from "../config/supabase";

export async function getGoogleLoginUrl() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });

  if (error) {
    throw error;
  }

  return data.url;
}