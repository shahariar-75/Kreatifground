import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { heartbeatSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, heartbeatSchema);
  if (parsed.error) return parsed.error;

  const auth = await verifyWorkerRequest(
    request.headers.get("authorization"),
    parsed.data.instance_id,
  );
  if (auth.error) return auth.error;

  const { instance_id, agent_status, pid, cpu, ram, note } = parsed.data;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const [{ error: instanceError }, { error: heartbeatError }] = await Promise.all([
    supabase
      .from("instances")
      .update({
        status: "online",
        last_seen: now,
      })
      .eq("instance_id", instance_id),
    supabase.from("heartbeats").insert({
      instance_id,
      ts: now,
      agent_status,
      pid: pid ?? null,
      cpu: cpu ?? null,
      ram: ram ?? null,
      note: note ?? null,
    }),
  ]);

  if (instanceError || heartbeatError) {
    return NextResponse.json(
      { ok: false, error: "Failed to write heartbeat." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
