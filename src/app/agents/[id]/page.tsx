import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentTitleEditor } from "@/components/agent-title-editor";
import { CommandActions } from "@/components/command-actions";
import { StatusPill } from "@/components/status-pill";
import { formatRelative } from "@/lib/format";
import { getAgentDetail } from "@/lib/queries";

type Params = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: Params) {
  const { id } = await params;
  const { agent, instances } = await getAgentDetail(id);

  if (!agent) notFound();

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-900/70">
            {agent.image_url ? (
              <img
                src={agent.image_url}
                alt={agent.display_name ?? agent.agent_id}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/25 to-indigo-700/25 text-sm text-slate-200">
                No Image
              </div>
            )}
          </div>
          <div>
            <AgentTitleEditor
              agentId={agent.agent_id}
              displayName={agent.display_name}
              imageUrl={agent.image_url}
            />
            <p className="mt-2 text-sm text-slate-300">
              Manage all instances for this agent from one place.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3">
        {instances.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No instances for this agent yet.
          </div>
        )}

        {instances.map((instance) => (
          <article
            key={instance.instance_id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/instances/${instance.instance_id}`} className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-100">
                  {instance.display_name ?? instance.instance_id}
                </p>
                <p className="truncate text-xs text-slate-400">{instance.instance_id}</p>
              </Link>
              <div className="flex items-center gap-2">
                <StatusPill status={instance.status} />
                <StatusPill status={instance.agent_status} />
              </div>
            </div>

            <p className="mb-3 text-xs text-slate-300">
              Last seen: {formatRelative(instance.last_seen)}
            </p>

            {instance.last_error && (
              <p className="mb-3 line-clamp-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {instance.last_error}
              </p>
            )}

            <CommandActions instanceId={instance.instance_id} />
          </article>
        ))}
      </div>
    </div>
  );
}
