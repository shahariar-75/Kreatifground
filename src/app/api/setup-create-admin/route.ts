import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "mr.shahariar.joy@gmail.com";
const INITIAL_PASSWORD = "BotOpsAdmin2025!";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Use Authorization: Bearer <ADMIN_TOKEN>." },
      { status: 401 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users?.some(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );
  if (alreadyExists) {
    return NextResponse.json({
      ok: true,
      message: "Admin user already exists. Sign in at /login.",
    });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: INITIAL_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Admin user created. Sign in at /login.",
    email: ADMIN_EMAIL,
    temporaryPassword: INITIAL_PASSWORD,
    hint: "Change your password from Settings after first login.",
  });
}
