import { NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/auth";
import { computeOnlineStatus } from "@/lib/dashboard";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const auth = verifyAdminToken(request.headers.get("authorization"));
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data: instance, error: instanceError }, { data: heartbeats, error: hbError }] =
    await Promise.all([
      supabase.from("instances").select("*").eq("instance_id", id).maybeSingle(),
      supabase
        .from("heartbeats")
        .select("*")
        .eq("instance_id", id)
        .order("ts", { ascending: false })
        .limit(50),
    ]);

  if (instanceError || hbError) {
    return NextResponse.json(
      { ok: false, error: "Failed to load instance detail." },
      { status: 500 },
    );
  }

  if (!instance) {
    return NextResponse.json({ ok: false, error: "Instance not found." }, { status: 404 });
  }

  const [{ data: events, error: eventsError }, { data: commands, error: commandsError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("instance_id", id)
        .order("ts", { ascending: false })
        .limit(100),
      supabase
        .from("commands")
        .select("*")
        .eq("instance_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (eventsError || commandsError) {
    return NextResponse.json(
      { ok: false, error: "Failed to load events or commands." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    item: {
      ...instance,
      status: computeOnlineStatus(instance.last_seen),
      current_agent_status: heartbeats[0]?.agent_status ?? "unknown",
      current_pid: heartbeats[0]?.pid ?? null,
      heartbeats,
      events,
      commands,
    },
  });
}
