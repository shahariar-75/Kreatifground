import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { pollSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from("commands")
    .select("id, type, payload")
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
