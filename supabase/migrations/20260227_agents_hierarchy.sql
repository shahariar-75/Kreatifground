create table if not exists public.agents (
  agent_id text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

insert into public.agents (agent_id, display_name)
values ('main-agent', 'Main Agent')
on conflict (agent_id) do nothing;

alter table public.instances
add column if not exists agent_id text;

update public.instances
set agent_id = 'main-agent'
where agent_id is null;

alter table public.instances
alter column agent_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'instances_agent_id_fkey'
  ) then
    alter table public.instances
      add constraint instances_agent_id_fkey
      foreign key (agent_id) references public.agents(agent_id) on delete restrict;
  end if;
end $$;

create index if not exists idx_instances_agent_id on public.instances(agent_id);
