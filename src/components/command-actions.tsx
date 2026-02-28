import { queueCommandAction } from "@/app/actions";
import type { CommandType } from "@/lib/types";

const quickCommands: Array<{ label: string; type: CommandType }> = [
  { label: "Start", type: "start_agent" },
  { label: "Stop", type: "stop_agent" },
  { label: "Restart", type: "restart_agent" },
  { label: "Update", type: "update_repo" },
];

export function CommandActions({ instanceId }: { instanceId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickCommands.map((command) => (
        <form key={command.type} action={queueCommandAction}>
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
