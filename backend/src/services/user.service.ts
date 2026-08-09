import { supabase } from "../config/supabase";

export interface AppUser {
  id: string;
  email: string | null;
  created_at: string;
  last_seen_at: string;
}

export async function getOrCreateUser(supabaseUser: {
  id: string;
  email?: string;
}): Promise<AppUser> {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert user: ${error.message}`);
  }

  return data as AppUser;
}
