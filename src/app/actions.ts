"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { hashToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enqueueCommand, updateAgentProfile } from "@/lib/queries";
import type { CommandType } from "@/lib/types";

export async function generateWorkerTokenAction(formData: FormData): Promise<
  | { error: string }
  | { token: string; instance_id: string; agent_id: string }
> {
  const instanceId = String(formData.get("instance_id") ?? "").trim().slice(0, 120);
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120) || instanceId;
  const agentId = String(formData.get("agent_id") ?? "main-agent").trim().slice(0, 120) || "main-agent";

  if (!instanceId) {
    return { error: "Instance ID is required." };
  }

  const token = randomBytes(32).toString("hex");
  const workerTokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { error: agentError } = await supabase.from("agents").upsert(
    {
      agent_id: agentId,
      display_name: agentId === "main-agent" ? "Main Agent" : agentId,
    },
    { onConflict: "agent_id" },
  );
  if (agentError) {
    return { error: "Failed to ensure agent exists." };
  }

  const { error: instanceError } = await supabase.from("instances").insert({
    instance_id: instanceId,
    agent_id: agentId,
    display_name: displayName,
    worker_token_hash: workerTokenHash,
    status: "offline",
    metadata: {},
  });

  if (instanceError) {
    if (instanceError.code === "23505") {
      return { error: "This instance ID already exists. Use a different one or use the existing token from when you first created it." };
    }
    return { error: instanceError.message };
  }

  revalidatePath("/");
  revalidatePath("/agents");
  revalidatePath("/settings");

  return { token, instance_id: instanceId, agent_id: agentId };
}

export async function queueCommandAction(
  prevOrFormData: FormData | { commandId?: string; instanceId?: string; type?: string } | null,
  formData?: FormData,
): Promise<{ commandId?: string; instanceId?: string; type?: string } | null> {
  const data = formData ?? (prevOrFormData instanceof FormData ? prevOrFormData : null);
  if (!data) return null;

  const instanceId = String(data.get("instance_id") ?? "");
  const type = String(data.get("type") ?? "") as CommandType;

  if (!instanceId || !type) return null;

  const commandId = await enqueueCommand(instanceId, type);
  revalidatePath("/");
  revalidatePath("/agents");
  revalidatePath("/commands");
  revalidatePath(`/instances/${instanceId}`);
  return commandId ? { commandId, instanceId, type } : null;
}

export async function retryCommandAction(formData: FormData) {
  const instanceId = String(formData.get("instance_id") ?? "");
  const type = String(formData.get("type") ?? "") as CommandType;

  if (!instanceId || !type) return;

  await enqueueCommand(instanceId, type);
  revalidatePath("/commands");
  revalidatePath(`/instances/${instanceId}`);
}

export async function updateAgentProfileAction(formData: FormData) {
  const agentId = String(formData.get("agent_id") ?? "").trim();
  if (!agentId) return;
  const updates: { displayName?: string; imageUrl?: string | null } = {};

  const displayNameEntry = formData.get("display_name");
  if (typeof displayNameEntry === "string") {
    updates.displayName = displayNameEntry.trim() || agentId;
  }

  const imageFile = formData.get("image_file");
  if (imageFile instanceof File && imageFile.size > 0) {
    const supabase = getSupabaseAdmin();
    const bucket = "agent-images";

    const bucketCreate = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (
      bucketCreate.error &&
      !bucketCreate.error.message.toLowerCase().includes("already exists")
    ) {
      throw new Error(bucketCreate.error.message);
    }

    const ext = imageFile.name.includes(".")
      ? imageFile.name.split(".").pop() ?? "png"
      : "png";
    const path = `${agentId}/${Date.now()}.${ext}`;
    const bytes = Buffer.from(await imageFile.arrayBuffer());

    const upload = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: imageFile.type || "application/octet-stream",
      upsert: true,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path);
    updates.imageUrl = publicUrl.data.publicUrl;
  }

  await updateAgentProfile(agentId, updates);
  revalidatePath("/");
  revalidatePath("/agents");
  revalidatePath(`/agents/${agentId}`);
}
