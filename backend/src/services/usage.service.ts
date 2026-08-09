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
