"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Pencil, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateAgentProfileAction } from "@/app/actions";

type AgentTitleEditorProps = {
  agentId: string;
  displayName: string | null;
  imageUrl?: string | null;
};

export function AgentTitleEditor({
  agentId,
  displayName,
  imageUrl,
}: AgentTitleEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(displayName ?? agentId);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("agent_id", agentId);
      formData.set("display_name", name.trim() || agentId);
      await updateAgentProfileAction(formData);
      setIsEditing(false);
      router.refresh();
    });
  };

  const uploadImage = (file: File) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("agent_id", agentId);
      formData.set("display_name", name.trim() || agentId);
      formData.set("image_file", file);
      await updateAgentProfileAction(formData);
      router.refresh();
    });
  };

  return (
    <div className="min-w-0 pointer-events-auto">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          uploadImage(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
            placeholder="Agent name"
            disabled={isPending}
          />
        ) : (
          <p className="truncate text-lg font-semibold text-slate-100">{name}</p>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="rounded-md border border-white/15 bg-white/10 p-1.5 text-slate-100 transition hover:bg-white/20 disabled:opacity-50"
          aria-label="Upload agent image"
          title={imageUrl ? "Change image" : "Upload image"}
        >
          <Upload size={14} />
        </button>

        {isEditing ? (
          <>
            <button
              type="button"
              onClick={saveName}
              disabled={isPending}
              className="rounded-md border border-white/15 bg-white/10 p-1.5 text-slate-100 transition hover:bg-white/20 disabled:opacity-50"
              aria-label="Save name"
              title="Save"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setName(displayName ?? agentId);
                setIsEditing(false);
              }}
              disabled={isPending}
              className="rounded-md border border-white/15 bg-white/10 p-1.5 text-slate-100 transition hover:bg-white/20 disabled:opacity-50"
              aria-label="Cancel editing"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="rounded-md border border-white/15 bg-white/10 p-1.5 text-slate-100 transition hover:bg-white/20 disabled:opacity-50"
            aria-label="Rename agent"
            title="Rename"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <p className="mt-1 truncate text-xs text-slate-400">{agentId}</p>
    </div>
  );
}
