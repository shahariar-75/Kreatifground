# BotOps Dashboard

Web dashboard for monitoring and controlling many Windows RDP instances, where each instance runs one worker + one Python agent.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase Postgres
- Token-based auth:
  - Worker API: `Authorization: Bearer <worker_token>`
  - Admin/Clawbot API: `Authorization: Bearer <ADMIN_TOKEN>`

## Local setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Create `.env.local` from `.env.example` and set real values.

3. Create a Supabase project and run SQL migrations in order:

- `supabase/migrations/20260227_init_botops.sql`
- `supabase/migrations/20260227_agents_hierarchy.sql`
- `supabase/migrations/20260227_agents_image.sql`

4. **Create the admin login user** (once). Call the setup API with your `ADMIN_TOKEN`:

```bash
curl -X POST http://localhost:3000/api/setup-create-admin -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This creates a Supabase Auth user:

- **Email:** `mr.shahariar.joy@gmail.com`
- **Temporary password:** `BotOpsAdmin2025!`

Sign in at `/login`, then change your password from **Settings → Change password**.

5. Run dev server:

```bash
corepack pnpm dev
```

Open `http://localhost:3000`. Unauthenticated visitors are redirected to `/login`.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_TOKEN=
```

## Data model

Tables created by migration:

- `agents`
- `instances`
- `heartbeats`
- `commands`
- `events`
- `incidents` (optional but included)

Includes indexes for:

- instance recency (`last_seen`)
- heartbeat/event timelines
- command queue operations by `instance_id` + `status`

Also includes `claim_command(...)` SQL function for safe claim behavior.

## API endpoints

### Worker endpoints

- `POST /api/worker/register`
- `POST /api/worker/heartbeat`
- `GET /api/worker/commands/poll?instance_id=...`
- `POST /api/worker/commands/claim`
- `POST /api/worker/commands/ack`
- `POST /api/worker/events`

### Admin / Clawbot endpoints

- `GET /api/admin/instances`
- `GET /api/admin/instances/:id`
- `POST /api/admin/commands`
- `GET /api/admin/events?instance_id=&limit=`
- `POST /api/admin/instances/:id/mark-offline`

## Worker onboarding

Recommended Windows folders:

- `C:\Bots\repo`
- `C:\Bots\config\instance.json`
- `C:\Bots\logs\`

Example `instance.json`:

```json
{
  "agent_id": "main-agent",
  "instance_id": "rdp-01",
  "dashboard_url": "https://your-dashboard.com",
  "worker_token": "replace-with-strong-secret",
  "agent_cmd": "python -m agent.main",
  "agent_cwd": "C:\\Bots\\repo",
  "log_path": "C:\\Bots\\logs\\agent.log"
}
```

Configure Windows Task Scheduler to run worker at startup.

## Command queue behavior

This project enforces one active command per instance:

- active = `claimed` or `running`
- workers poll queued commands, then claim one command
- no second command can be claimed for the same instance until active command is acknowledged as `success` or `failed`

This avoids conflicting actions (for example, `update_repo` and `restart_agent` racing).

## Agent profile UX

- Agent name is auto-created from `agent_id` (default agent is `main-agent`).
- You can rename agents directly from the UI using the edit icon.
- You can upload an agent image from the upload icon (stored in Supabase Storage bucket `agent-images`).
