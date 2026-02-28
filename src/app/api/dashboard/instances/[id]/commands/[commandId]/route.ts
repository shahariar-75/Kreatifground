import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = Promise<{ id: string; commandId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: instanceId, commandId } = await params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("commands")
    .select("id, type, status, error_message, result, completed_at")
    .eq("id", commandId)
    .eq("instance_id", instanceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
