import { supabase } from "../config/supabase";

export async function getGoogleLoginUrl() {
  const redirectTo = "http://localhost:3000/auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.url) {
    throw new Error("Failed to generate Google login URL.");
  }

  return data.url;
}

export async function verifyAccessToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}