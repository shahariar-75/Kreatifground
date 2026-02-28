import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { workerEventSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, workerEventSchema);
  if (parsed.error) return parsed.error;

  const auth = await verifyWorkerRequest(
    request.headers.get("authorization"),
    parsed.data.instance_id,
  );
  if (auth.error) return auth.error;

  const { instance_id, level, source, message, data } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("events").insert({
    instance_id,
    level,
    source,
    message,
    data: data ?? null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to store event." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
