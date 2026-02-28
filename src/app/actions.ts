"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseAdmin } from "@/lib/supabase";
import { enqueueCommand, updateAgentProfile } from "@/lib/queries";
import type { CommandType } from "@/lib/types";

export async function queueCommandAction(formData: FormData) {
  const instanceId = String(formData.get("instance_id") ?? "");
  const type = String(formData.get("type") ?? "") as CommandType;

  if (!instanceId || !type) return;

  await enqueueCommand(instanceId, type);
  revalidatePath("/");
  revalidatePath("/instances");
  revalidatePath("/commands");
  revalidatePath(`/instances/${instanceId}`);
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
