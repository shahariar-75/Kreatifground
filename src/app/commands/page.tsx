import { retryCommandAction } from "@/app/actions";
import { StatusPill } from "@/components/status-pill";
import { formatTimestamp } from "@/lib/format";
import { getCommandsList } from "@/lib/queries";

export const revalidate = 3;
export const dynamic = "force-dynamic";

export default async function CommandsPage() {
  const commands = await getCommandsList();

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Commands</h1>
        <p className="mt-1 text-sm text-slate-300">
          Queue state across all instances. Failed commands can be retried.
        </p>
      </header>

      <div className="space-y-2">
        {commands.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            No commands yet.
          </div>
        )}

        {commands.map((command) => (
          <article
            key={command.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-100">{command.type}</p>
                <p className="text-xs text-slate-400">{command.instance_id}</p>
              </div>
              <StatusPill status={command.status} />
            </div>

            <p className="text-xs text-slate-400">
              Created: {formatTimestamp(command.created_at)}
            </p>
            {command.completed_at && (
              <p className="text-xs text-slate-400">
                Completed: {formatTimestamp(command.completed_at)}
              </p>
            )}
            {command.error_message && (
              <p className="mt-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {command.error_message}
              </p>
            )}

            {command.status === "failed" && (
              <form action={retryCommandAction} className="mt-3">
                <input type="hidden" name="instance_id" value={command.instance_id} />
                <input type="hidden" name="type" value={command.type} />
                <button
                  type="submit"
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/20"
                >
                  Retry
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
