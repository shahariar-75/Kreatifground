import { getSupabaseAdmin } from "@/lib/supabase";
import type { CommandType } from "@/lib/types";

export async function createQueuedCommand(
  instanceId: string,
  type: CommandType,
  payload: Record<string, unknown> = {},
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("commands")
    .insert({
      instance_id: instanceId,
      type,
      payload,
      status: "queued",
    })
    .select("id, instance_id, type, status, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function computeOnlineStatus(lastSeen: string | null) {
  if (!lastSeen) return "offline";
  const ageMs = Date.now() - new Date(lastSeen).getTime();
  return ageMs <= 30_000 ? "online" : "offline";
}
