import { supabase } from "../config/supabase";

export async function recordUsage(
  userId: string,
  action: string
): Promise<void> {
  const { error } = await supabase
    .from("usage_events")
    .insert({ user_id: userId, action });

  if (error) {
    console.error("Failed to record usage:", error.message);
  }
}

export async function getUsageCountSince(
  userId: string,
  sinceIso: string
): Promise<number> {
  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);

  if (error) {
    throw new Error(`Failed to read usage: ${error.message}`);
  }

  return count ?? 0;
}
