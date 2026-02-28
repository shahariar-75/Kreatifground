import { NextResponse } from "next/server";

import { verifyWorkerRequest } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { claimSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, claimSchema);
  if (parsed.error) return parsed.error;

  const { instance_id, command_id } = parsed.data;
  const auth = await verifyWorkerRequest(
    request.headers.get("authorization"),
    instance_id,
  );
  if (auth.error) return auth.error;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("claim_command", {
    p_instance_id: instance_id,
    p_command_id: command_id,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to claim command." },
      { status: 500 },
    );
  }

  const claimResult = data?.[0];
  if (!claimResult?.claimed) {
    return NextResponse.json(
      { ok: false, error: "Command not claimable." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
