import { NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/auth";
import { createQueuedCommand } from "@/lib/dashboard";
import { parseJsonBody } from "@/lib/http";
import { adminCommandSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const auth = verifyAdminToken(request.headers.get("authorization"));
  if (auth.error) return auth.error;

  const parsed = await parseJsonBody(request, adminCommandSchema);
  if (parsed.error) return parsed.error;

  try {
    const command = await createQueuedCommand(
      parsed.data.instance_id,
      parsed.data.type,
      parsed.data.payload ?? {},
    );

    return NextResponse.json({ ok: true, command });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create command." },
      { status: 500 },
    );
  }
}
