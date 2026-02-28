"use client";

import { useActionState, useState } from "react";

import { generateWorkerTokenAction } from "@/app/actions";

type Props = { dashboardUrl: string };

export function GenerateWorkerTokenForm({ dashboardUrl }: Props) {
  const [result, setResult] = useState<{
    token: string;
    instance_id: string;
    agent_id: string;
  } | null>(null);
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const r = await generateWorkerTokenAction(formData);
      if ("error" in r) return r;
      setResult(r);
      return null;
    },
    null as { error?: string } | null,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="instance_id" className="block text-xs font-medium text-slate-300">
            Instance ID <span className="text-rose-300">*</span>
          </label>
          <input
            id="instance_id"
            name="instance_id"
            type="text"
            required
            placeholder="e.g. rdp-01"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          />
        </div>
        <div>
          <label htmlFor="display_name" className="block text-xs font-medium text-slate-300">
            Display name (optional)
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            placeholder="e.g. Office RDP 1"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          />
        </div>
        <div>
          <label htmlFor="agent_id" className="block text-xs font-medium text-slate-300">
            Agent ID (optional)
          </label>
          <input
            id="agent_id"
            name="agent_id"
            type="text"
            placeholder="main-agent"
            defaultValue="main-agent"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-rose-300">{state.error}</p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-cyan-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          Generate worker token
        </button>
      </form>

      {result && (
        <div className="space-y-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-200">
            Worker token created. Copy it into your worker’s <code className="rounded bg-black/20 px-1">instance.json</code>. It won’t be shown again.
          </p>
          <div>
            <p className="mb-1 text-xs text-slate-400">Worker token</p>
            <pre className="overflow-x-auto rounded-lg border border-white/15 bg-slate-950/80 p-3 text-xs text-cyan-100 break-all">
              {result.token}
            </pre>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.token)}
              className="mt-2 text-xs text-cyan-300 hover:underline"
            >
              Copy token
            </button>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">Example instance.json</p>
            <pre className="overflow-x-auto rounded-lg border border-white/15 bg-slate-950/80 p-3 text-xs text-slate-200 whitespace-pre-wrap break-all">
{`{
  "agent_id": "${result.agent_id}",
  "instance_id": "${result.instance_id}",
  "dashboard_url": "${dashboardUrl}",
  "worker_token": "${result.token}",
  "agent_cmd": "python -m agent.main",
  "agent_cwd": "C:\\\\Bots\\\\repo",
  "log_path": "C:\\\\Bots\\\\logs\\\\agent.log"
}`}
            </pre>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(
                    {
                      agent_id: result.agent_id,
                      instance_id: result.instance_id,
                      dashboard_url: dashboardUrl,
                      worker_token: result.token,
                      agent_cmd: "python -m agent.main",
                      agent_cwd: "C:\\Bots\\repo",
                      log_path: "C:\\Bots\\logs\\agent.log",
                    },
                    null,
                    2,
                  ),
                )
              }
              className="mt-2 text-xs text-cyan-300 hover:underline"
            >
              Copy JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
