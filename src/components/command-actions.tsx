"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { queueCommandAction } from "@/app/actions";
import type { CommandType } from "@/lib/types";

const LABELS: Record<string, string> = {
  start_agent: "Start",
  stop_agent: "Stop",
  restart_agent: "Restart",
  update_repo: "Update",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  start_agent: "Agent started.",
  stop_agent: "Agent stopped.",
  restart_agent: "Agent restarted.",
  update_repo: "Update completed.",
};

const quickCommands: Array<{ label: string; type: CommandType }> = [
  { label: "Start", type: "start_agent" },
  { label: "Stop", type: "stop_agent" },
  { label: "Restart", type: "restart_agent" },
  { label: "Update", type: "update_repo" },
];

export function CommandActions({ instanceId }: { instanceId: string }) {
  const [state, formAction] = useActionState(queueCommandAction, null as {
    commandId?: string;
    instanceId?: string;
    type?: string;
  } | null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state?.commandId || !state?.instanceId || !state?.type) return;

    const typeLabel = LABELS[state.type] ?? state.type;
    toast.loading(`Command sent. Waiting for worker to run "${typeLabel}"...`, {
      id: state.commandId,
    });

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/dashboard/instances/${encodeURIComponent(state.instanceId!)}/commands/${encodeURIComponent(state.commandId!)}`,
        );
        if (!res.ok) return;
        const cmd = await res.json();
        if (cmd.status === "success") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          toast.success(SUCCESS_MESSAGES[state.type!] ?? "Command completed.", {
            id: state.commandId,
          });
        } else if (cmd.status === "failed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          toast.error(cmd.error_message || "Command failed.", {
            id: state.commandId,
          });
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    pollingRef.current = interval;
    const timeout = setTimeout(() => {
      clearInterval(interval);
      pollingRef.current = null;
      toast.info("No response from worker yet. Check command history or instance status.", {
        id: state.commandId,
      });
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      pollingRef.current = null;
    };
  }, [state?.commandId, state?.instanceId, state?.type]);

  return (
    <div className="flex flex-wrap gap-2">
      {quickCommands.map((command) => (
        <form key={command.type} action={formAction}>
          <input type="hidden" name="instance_id" value={instanceId} />
          <input type="hidden" name="type" value={command.type} />
          <button
            type="submit"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/10"
          >
            {command.label}
          </button>
        </form>
      ))}
    </div>
  );
}
