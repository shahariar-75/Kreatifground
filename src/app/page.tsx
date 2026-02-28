import { Server, Signal, Sparkles } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { formatTimestamp } from "@/lib/format";
import { getDashboardOverview } from "@/lib/queries";

export const revalidate = 5;
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardOverview();
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-200/80">
          <Sparkles size={14} />
          BotOps Command Center
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Overview Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Live view of worker health, agent state, and recent incidents.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Sparkles size={16} />} label="Total Agents" value={data.totalAgents} />
        <StatCard icon={<Server size={16} />} label="Total Instances" value={data.total} />
        <StatCard icon={<Signal size={16} />} label="Online" value={data.online} />
        <StatCard icon={<Sparkles size={16} />} label="Agents Running" value={data.running} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">Recent Errors (24h)</h2>
          <div className="space-y-2">
            {data.recentErrors.length === 0 && (
              <p className="text-sm text-slate-400">No recent errors.</p>
            )}
            {data.recentErrors.slice(0, 8).map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-rose-200">{event.instance_id}</p>
                  <p className="text-[11px] text-rose-100/80">
                    {formatTimestamp(event.ts)}
                  </p>
                </div>
                <p className="text-sm text-rose-100">{event.message}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">Incidents</h2>
          <div className="space-y-2">
            {data.incidents.length === 0 && (
              <p className="text-sm text-slate-400">No incidents recorded.</p>
            )}
            {data.incidents.slice(0, 8).map((incident) => (
              <article key={incident.id} className="rounded-xl border border-white/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <StatusPill status={incident.status} />
                  <p className="text-[11px] text-slate-400">
                    {formatTimestamp(incident.created_at)}
                  </p>
                </div>
                <p className="text-sm text-slate-100">{incident.title}</p>
                <p className="mt-1 text-xs text-slate-400">{incident.instance_id}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 inline-flex rounded-lg bg-white/10 p-2 text-cyan-200">{icon}</div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
