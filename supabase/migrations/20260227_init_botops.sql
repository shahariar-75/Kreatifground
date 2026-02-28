create extension if not exists pgcrypto;

create table if not exists public.instances (
  instance_id text primary key,
  display_name text,
  worker_token_hash text not null,
  status text not null default 'offline' check (status in ('online', 'offline')),
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.heartbeats (
  id uuid primary key default gen_random_uuid(),
  instance_id text not null references public.instances(instance_id) on delete cascade,
  ts timestamptz not null default now(),
  agent_status text not null check (agent_status in ('running', 'stopped', 'unknown')),
  pid integer,
  cpu numeric,
  ram numeric,
  note text
);

create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  instance_id text not null references public.instances(instance_id) on delete cascade,
  type text not null check (type in (
    'start_agent',
    'stop_agent',
    'restart_agent',
    'update_repo',
    'health_check',
    'collect_logs',
    'set_config'
  )),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'claimed', 'running', 'success', 'failed')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  error_message text,
  result jsonb
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  instance_id text not null references public.instances(instance_id) on delete cascade,
  ts timestamptz not null default now(),
  level text not null check (level in ('info', 'warn', 'error', 'debug')),
  source text not null check (source in ('worker', 'agent')),
  message text not null,
  data jsonb
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  instance_id text not null references public.instances(instance_id) on delete cascade,
  created_at timestamptz not null default now(),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  details jsonb,
  status text not null default 'open' check (status in ('open', 'ack', 'resolved'))
);

create index if not exists idx_instances_last_seen on public.instances(last_seen desc);
create index if not exists idx_heartbeats_instance_ts on public.heartbeats(instance_id, ts desc);
create index if not exists idx_commands_instance_status_created on public.commands(instance_id, status, created_at asc);
create index if not exists idx_commands_status_created on public.commands(status, created_at desc);
create index if not exists idx_events_instance_ts on public.events(instance_id, ts desc);
create index if not exists idx_events_level_ts on public.events(level, ts desc);
create index if not exists idx_incidents_instance_created on public.incidents(instance_id, created_at desc);

create or replace function public.claim_command(
  p_instance_id text,
  p_command_id uuid
)
returns table (claimed boolean, command_id uuid, status text)
language plpgsql
as $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.commands
  where instance_id = p_instance_id
    and public.commands.status in ('claimed', 'running');

  if active_count > 0 then
    return query select false, p_command_id, 'blocked'::text;
    return;
  end if;

  update public.commands
  set status = 'claimed',
      claimed_at = now()
  where public.commands.id = p_command_id
    and public.commands.instance_id = p_instance_id
    and public.commands.status = 'queued';

  if found then
    return query select true, p_command_id, 'claimed'::text;
  else
    return query select false, p_command_id, 'not_found'::text;
  end if;
end;
$$;
