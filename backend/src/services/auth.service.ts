import { supabase } from "../config/supabase";

/**
 * Verifies a Supabase access token issued to the extension.
 *
 * Sign-in itself happens entirely in the extension (chrome.identity +
 * signInWithIdToken in the background worker); the backend only ever
 * validates the resulting token.
 */
export async function verifyAccessToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}
