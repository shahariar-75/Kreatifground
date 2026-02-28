import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { pollSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/worker/commands/poll?instance_id=<instance_id>
 *
 * Returns the oldest queued command for the given instance_id (same value the worker sends).
 * Response: { "command": { "id", "type", "payload" } } or { "command": null } if none or one is already active.
 * One active command per instance (claimed/running); queued commands are returned in created_at order.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = pollSchema.safeParse({
    instance_id: searchParams.get("instance_id"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid instance_id query parameter." },
      { status: 400 },
    );
  }

  const instanceId = parsed.data.instance_id;
  const auth = await verifyWorkerRequest(
    request.headers.get("authorization"),
    instanceId,
  );
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();

  // One active command per instance: do not return a new one while one is claimed/running
  const { data: activeData, error: activeError } = await supabase
    .from("commands")
    .select("id")
    .eq("instance_id", instanceId)
    .in("status", ["claimed", "running"])
    .limit(1);

  if (activeError) {
    return NextResponse.json(
      { ok: false, error: "Failed to check active commands." },
      { status: 500 },
    );
  }

  if (activeData.length > 0) {
    return NextResponse.json({ command: null });
  }

  // Oldest queued command for this instance (include created_at so worker can ignore old commands)
  const { data, error } = await supabase
    .from("commands")
    .select("id, type, payload, created_at")
    .eq("instance_id", instanceId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to poll commands." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    command: data ?? null,
  });
}
