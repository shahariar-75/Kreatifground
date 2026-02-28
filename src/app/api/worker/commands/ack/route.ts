import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { ackSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ackSchema);
  if (parsed.error) return parsed.error;

  const { instance_id, command_id, success, error_message, result, logs_tail } =
    parsed.data;

  const auth = await verifyWorkerRequest(
    request.headers.get("authorization"),
    instance_id,
  );
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: commandError } = await supabase
    .from("commands")
    .update({
      status: success ? "success" : "failed",
      completed_at: now,
      error_message: error_message ?? null,
      result: result ?? null,
    })
    .eq("id", command_id)
    .eq("instance_id", instance_id)
    .in("status", ["claimed", "running"]);

  if (commandError) {
    return NextResponse.json(
      { ok: false, error: "Failed to acknowledge command." },
      { status: 500 },
    );
  }

  if (logs_tail) {
    const { error: eventError } = await supabase.from("events").insert({
      instance_id,
      ts: now,
      level: success ? "info" : "error",
      source: "worker",
      message: `Command ${command_id} logs tail`,
      data: {
        logs_tail,
      },
    });

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: "Command acknowledged but logs tail insert failed." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
