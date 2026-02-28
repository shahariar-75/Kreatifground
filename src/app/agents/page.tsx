import Link from "next/link";

import { AgentTitleEditor } from "@/components/agent-title-editor";
import { StatusPill } from "@/components/status-pill";
import { getAgentsList } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgentsList();

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Agents</h1>
        <p className="mt-1 text-sm text-slate-300">
          Select an agent to manage all its instances.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No agents found yet. Register a worker with `agent_id` to create one automatically.
          </div>
        )}

        {agents.map((agent) => (
          <article
            key={agent.agent_id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <Link
              href={`/agents/${agent.agent_id}`}
              aria-label={`Open ${agent.display_name ?? agent.agent_id}`}
              className="absolute inset-0 z-10"
            />
            <div className="pointer-events-none aspect-[4/3] w-full overflow-hidden bg-slate-900/80">
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
            <div className="relative z-20 space-y-3 p-4 pointer-events-none">
              <div className="flex items-start justify-between gap-2">
                <AgentTitleEditor
                  agentId={agent.agent_id}
                  displayName={agent.display_name}
                  imageUrl={agent.image_url}
                />
                <StatusPill
                  status={
                    agent.instances > 0 && agent.online === agent.instances
                      ? "online"
                      : "offline"
                  }
                />
              </div>

              <p className="text-sm text-slate-300">
                Instances: {agent.instances} | Online: {agent.online} |{" "}
                <span className="text-amber-200">Alerts: {agent.alerts}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
