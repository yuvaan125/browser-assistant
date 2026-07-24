import type { User } from "@supabase/supabase-js";
import { supabase } from "./auth";

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {

  console.log("Session:", session);

  if (session?.access_token) {
    console.log("Saving access token...");
    await chrome.storage.local.set({
      accessToken: session.access_token,
    });
  } else {
    console.log("Removing access token...");
    await chrome.storage.local.remove("accessToken");
  }

  callback(session?.user ?? null);
});
}