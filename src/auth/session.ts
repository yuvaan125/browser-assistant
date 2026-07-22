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
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}