import { NextResponse } from "next/server";

import { hashToken } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { registerSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, registerSchema);
  if (parsed.error) return parsed.error;

  const { agent_id, instance_id, worker_token, display_name, metadata } = parsed.data;
  const safeAgentId = agent_id ?? "main-agent";
  const workerTokenHash = hashToken(worker_token);
  const supabase = getSupabaseAdmin();

  const { error: agentError } = await supabase.from("agents").upsert(
    {
      agent_id: safeAgentId,
      display_name: safeAgentId === "main-agent" ? "Main Agent" : safeAgentId,
    },
    { onConflict: "agent_id" },
  );

  if (agentError) {
    return NextResponse.json(
      { ok: false, error: "Failed to register agent." },
      { status: 500 },
    );
  }

  const existing = await supabase
    .from("instances")
    .select("instance_id, worker_token_hash")
    .eq("instance_id", instance_id)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json(
      { ok: false, error: "Failed to query existing instance." },
      { status: 500 },
    );
  }

  if (
    existing.data &&
    existing.data.worker_token_hash &&
    existing.data.worker_token_hash !== workerTokenHash
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Instance already exists with a different token. Use the current token or rotate manually.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("instances").upsert(
    {
      instance_id,
      agent_id: safeAgentId,
      display_name: display_name ?? instance_id,
      worker_token_hash: workerTokenHash,
      status: "online",
      last_seen: new Date().toISOString(),
      metadata: metadata ?? {},
    },
    { onConflict: "instance_id" },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to register instance." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
