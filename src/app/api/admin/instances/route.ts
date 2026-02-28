import { NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/auth";
import { computeOnlineStatus } from "@/lib/dashboard";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = verifyAdminToken(request.headers.get("authorization"));
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { data: instances, error: instancesError } = await supabase
    .from("instances")
    .select("instance_id, agent_id, display_name, status, last_seen, metadata")
    .order("instance_id", { ascending: true });

  if (instancesError) {
    return NextResponse.json(
      { ok: false, error: "Failed to load instances." },
      { status: 500 },
    );
  }

  const ids = instances.map((item) => item.instance_id);
  const { data: heartbeats, error: heartbeatError } = await supabase
    .from("heartbeats")
    .select("instance_id, agent_status, ts")
    .in("instance_id", ids.length === 0 ? ["__none__"] : ids)
    .order("ts", { ascending: false });

  if (heartbeatError) {
    return NextResponse.json(
      { ok: false, error: "Failed to load heartbeat states." },
      { status: 500 },
    );
  }

  const latestHeartbeat = new Map<string, { agent_status: string; ts: string }>();
  for (const hb of heartbeats) {
    if (!latestHeartbeat.has(hb.instance_id)) {
      latestHeartbeat.set(hb.instance_id, {
        agent_status: hb.agent_status,
        ts: hb.ts,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    items: instances.map((instance) => ({
      ...instance,
      status: computeOnlineStatus(instance.last_seen),
      agent_status:
        latestHeartbeat.get(instance.instance_id)?.agent_status ?? "unknown",
    })),
  });
}
