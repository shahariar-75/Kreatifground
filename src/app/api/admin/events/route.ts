import { NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = verifyAdminToken(request.headers.get("authorization"));
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");
  const limit = Number(searchParams.get("limit") ?? "200");
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(Math.round(limit), 500))
    : 200;

  const supabase = getSupabaseAdmin();
  const query = supabase
    .from("events")
    .select("*")
    .order("ts", { ascending: false })
    .limit(safeLimit);

  if (instanceId) {
    query.eq("instance_id", instanceId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to load events." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, items: data });
}
