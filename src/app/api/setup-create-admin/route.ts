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

  let bodyPassword: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.password === "string" && body.password.length >= 8) {
      bodyPassword = body.password;
    }
  } catch {
    // ignore
  }

  const supabase = getSupabaseAdmin();
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUser = listData?.users?.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (existingUser) {
    const newPassword = bodyPassword ?? INITIAL_PASSWORD;
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: newPassword },
    );
    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      message: "Admin password has been reset. Sign in at /login.",
      email: ADMIN_EMAIL,
      password: newPassword,
      hint: "Change your password from Settings after first login.",
    });
  }

  const password = bodyPassword ?? INITIAL_PASSWORD;
  const { error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
  });

  if (createError) {
    return NextResponse.json(
      { ok: false, error: createError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Admin user created. Sign in at /login.",
    email: ADMIN_EMAIL,
    password,
    hint: "Change your password from Settings after first login.",
  });
}
