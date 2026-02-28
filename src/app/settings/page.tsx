import { ChangePasswordForm } from "./change-password-form";

export default function SettingsPage() {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";
  const adminToken = process.env.ADMIN_TOKEN ?? "not-configured";

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Settings & Onboarding</h1>
        <p className="mt-1 text-sm text-slate-300">
          API menu, keys, account, and onboarding instructions.
        </p>
      </header>

      <nav className="sticky top-2 z-10 grid gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2 backdrop-blur sm:grid-cols-5">
        <a href="#account" className="rounded-lg px-3 py-2 text-center text-xs text-slate-200 hover:bg-white/10">
          Account
        </a>
        <a href="#api-menu" className="rounded-lg px-3 py-2 text-center text-xs text-slate-200 hover:bg-white/10">
          API Menu
        </a>
        <a href="#keys" className="rounded-lg px-3 py-2 text-center text-xs text-slate-200 hover:bg-white/10">
          Keys
        </a>
        <a href="#worker" className="rounded-lg px-3 py-2 text-center text-xs text-slate-200 hover:bg-white/10">
          Worker Setup
        </a>
        <a href="#example" className="rounded-lg px-3 py-2 text-center text-xs text-slate-200 hover:bg-white/10">
          instance.json
        </a>
      </nav>

      <section id="account" className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-semibold">Change password</h2>
        <p className="mb-3 text-sm text-slate-300">
          Update your login password. You will use the new password next time you sign in.
        </p>
        <ChangePasswordForm />
      </section>

      <section id="api-menu" className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-semibold">API Menu</h2>
        <p className="text-sm text-slate-300">Base URL: `{dashboardUrl}`</p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200">
{`Worker APIs
POST /api/worker/register
POST /api/worker/heartbeat
GET  /api/worker/commands/poll?instance_id=...
POST /api/worker/commands/claim
POST /api/worker/commands/ack
POST /api/worker/events

Clawbot/Admin APIs
GET  /api/admin/instances
GET  /api/admin/instances/:id
POST /api/admin/commands
GET  /api/admin/events?instance_id=&limit=
POST /api/admin/instances/:id/mark-offline`}
        </pre>
      </section>

      <section id="keys" className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-semibold">Keys For Sharing</h2>
        <p className="text-sm text-slate-300">
          Admin key for Clawbot/API admin calls:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-cyan-100">
{adminToken}
        </pre>
        <p className="mt-3 text-xs text-slate-400">
          Worker tokens are per-instance and should be shared only inside each worker `instance.json`.
        </p>
      </section>

      <section id="worker" className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-semibold">Worker Folder Structure (Windows)</h2>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200">
{`C:\\Bots\\repo
C:\\Bots\\config\\instance.json
C:\\Bots\\logs\\`}
        </pre>
      </section>

      <section id="example" className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-semibold">Example instance.json</h2>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200">
{`{
  "agent_id": "main-agent",
  "instance_id": "rdp-01",
  "dashboard_url": "${dashboardUrl}",
  "worker_token": "replace-with-strong-secret",
  "agent_cmd": "python -m agent.main",
  "agent_cwd": "C:\\\\Bots\\\\repo",
  "log_path": "C:\\\\Bots\\\\logs\\\\agent.log"
}`}
        </pre>
        <p className="mt-3 text-sm text-slate-300">
          Configure Task Scheduler to run your worker at startup.
        </p>
      </section>
    </div>
  );
}
