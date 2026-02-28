import { NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = verifyAdminToken(request.headers.get("authorization"));
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("instances")
    .update({ status: "offline" } as never)
    .eq("instance_id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to mark instance offline." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
