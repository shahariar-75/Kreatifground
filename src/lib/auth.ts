import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function unauthorized(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

function parseBearerToken(authorization: string | null) {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export async function verifyWorkerRequest(
  authorization: string | null,
  instanceId: string,
) {
  const token = parseBearerToken(authorization);
  if (!token) {
    return { error: unauthorized("Missing Authorization bearer token.") };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("instances")
    .select("worker_token_hash")
    .eq("instance_id", instanceId)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Failed to verify worker token." },
        { status: 500 },
      ),
    };
  }

  if (!data?.worker_token_hash) {
    return { error: unauthorized("Instance not registered.") };
  }

  const incomingHash = hashToken(token);
  const expected = Buffer.from(data.worker_token_hash, "utf-8");
  const incoming = Buffer.from(incomingHash, "utf-8");
  if (expected.length !== incoming.length || !timingSafeEqual(expected, incoming)) {
    return { error: unauthorized("Worker token does not match.") };
  }

  return { token };
}

export function verifyAdminToken(authorization: string | null) {
  const token = parseBearerToken(authorization);
  if (!token) {
    return { error: unauthorized("Missing Authorization bearer token.") };
  }

  const expected = Buffer.from(env.ADMIN_TOKEN, "utf-8");
  const incoming = Buffer.from(token, "utf-8");

  if (expected.length !== incoming.length || !timingSafeEqual(expected, incoming)) {
    return { error: unauthorized("Invalid admin token.") };
  }

  return { token };
}
