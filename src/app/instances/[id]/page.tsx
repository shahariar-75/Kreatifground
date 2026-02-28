import { notFound } from "next/navigation";

import { CommandActions } from "@/components/command-actions";
import { StatusPill } from "@/components/status-pill";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatTimestamp } from "@/lib/format";
import { getInstanceDetail } from "@/lib/queries";

type Params = {
  params: Promise<{ id: string }>;
};

export const revalidate = 3;
export const dynamic = "force-dynamic";

export default async function InstanceDetailPage({ params }: Params) {
  const { id } = await params;
  const data = await getInstanceDetail(id);
  const instance = data.instance;

  if (!instance) notFound();

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={3000} />
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">
              {instance.display_name ?? instance.instance_id}
            </h1>
            <p className="text-xs text-slate-400">{instance.instance_id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Worker</span>
              <StatusPill status={instance.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Agent</span>
              <StatusPill status={data.heartbeats[0]?.agent_status ?? "unknown"} />
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Last seen: {formatTimestamp(instance.last_seen)}
          {typeof data.heartbeats[0]?.pid === "number" && (
            <> · Agent PID: {data.heartbeats[0].pid}</>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {data.heartbeats[0]?.agent_status === "running"
            ? "Agent process is running on the worker."
            : data.heartbeats[0]?.agent_status === "stopped"
              ? "Agent process is stopped."
              : "Agent status unknown until next heartbeat."}
        </p>
        <div className="mt-3">
          <CommandActions instanceId={instance.instance_id} />
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold">Command History (50)</h2>
          <div className="space-y-2">
            {data.commands.length === 0 && (
              <p className="text-sm text-slate-400">No commands yet.</p>
            )}
            {data.commands.map((command) => (
              <article key={command.id} className="rounded-xl border border-white/10 p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{command.type}</p>
                  <StatusPill status={command.status} />
                </div>
                <p className="text-xs text-slate-400">
                  Created: {formatTimestamp(command.created_at)}
                </p>
                {command.error_message && (
                  <p className="mt-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-2 py-1 text-xs text-rose-100">
                    {command.error_message}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold">Live-ish Logs / Events</h2>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {data.events.length === 0 && (
              <p className="text-sm text-slate-400">No events yet.</p>
            )}
            {data.events.map((event) => (
              <article key={event.id} className="rounded-xl border border-white/10 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusPill status={event.level} />
                    <p className="text-[11px] uppercase text-slate-300">{event.source}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">{formatTimestamp(event.ts)}</p>
                </div>
                <p className="text-sm text-slate-100">{event.message}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
