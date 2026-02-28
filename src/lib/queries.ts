import { computeOnlineStatus } from "@/lib/dashboard";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CommandType } from "@/lib/types";

export async function getDashboardOverview() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: agents },
    { data: instances },
    { data: heartbeats },
    { data: events },
    { data: incidents },
  ] = await Promise.all([
    supabase.from("agents").select("agent_id"),
    supabase.from("instances").select("instance_id, last_seen"),
      supabase
        .from("heartbeats")
        .select("instance_id, agent_status, ts")
        .order("ts", { ascending: false })
        .limit(500),
      supabase
        .from("events")
        .select("id, level, ts, instance_id, message")
        .gte("ts", oneDayAgo)
        .order("ts", { ascending: false })
        .limit(200),
      supabase
        .from("incidents")
        .select("id, severity, title, status, created_at, instance_id")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const latestHeartbeat = new Map<string, string>();
  for (const hb of heartbeats ?? []) {
    if (!latestHeartbeat.has(hb.instance_id)) {
      latestHeartbeat.set(hb.instance_id, hb.agent_status);
    }
  }

  const total = instances?.length ?? 0;
  const online =
    instances?.filter((item) => computeOnlineStatus(item.last_seen) === "online").length ?? 0;
  const running = Array.from(latestHeartbeat.values()).filter(
    (status) => status === "running",
  ).length;

  return {
    totalAgents: agents?.length ?? 0,
    total,
    online,
    offline: total - online,
    running,
    recentErrors: (events ?? []).filter((event) => event.level === "error"),
    incidents: incidents ?? [],
  };
}

export async function getAgentsList() {
  const supabase = getSupabaseAdmin();
  const [{ data: agents }, { data: instances }, { data: errors }] = await Promise.all([
    supabase.from("agents").select("*").order("created_at", { ascending: true }),
    supabase
      .from("instances")
      .select("instance_id, agent_id, display_name, last_seen")
      .order("instance_id", { ascending: true }),
    supabase
      .from("events")
      .select("instance_id")
      .eq("level", "error")
      .order("ts", { ascending: false })
      .limit(2000),
  ]);

  const grouped = new Map<
    string,
    {
      agent_id: string;
      display_name: string | null;
      image_url: string | null;
      created_at: string;
      instances: number;
      online: number;
      alerts: number;
    }
  >();

  for (const agent of agents ?? []) {
    grouped.set(agent.agent_id, {
      ...agent,
      instances: 0,
      online: 0,
      alerts: 0,
    });
  }

  const instanceToAgent = new Map<string, string>();
  for (const instance of instances ?? []) {
    const agent = grouped.get(instance.agent_id);
    if (!agent) continue;
    instanceToAgent.set(instance.instance_id, instance.agent_id);
    agent.instances += 1;
    if (computeOnlineStatus(instance.last_seen) === "online") {
      agent.online += 1;
    }
  }

  for (const errorEvent of errors ?? []) {
    const mappedAgentId = instanceToAgent.get(errorEvent.instance_id);
    if (!mappedAgentId) continue;
    const agent = grouped.get(mappedAgentId);
    if (!agent) continue;
    agent.alerts += 1;
  }

  return Array.from(grouped.values());
}

export async function getInstancesList(agentId?: string) {
  const supabase = getSupabaseAdmin();
  const instancesQuery = supabase
    .from("instances")
    .select("instance_id, agent_id, display_name, status, last_seen, metadata")
    .order("instance_id", { ascending: true });

  if (agentId) {
    instancesQuery.eq("agent_id", agentId);
  }

  const [{ data: instances, error }, { data: heartbeats }, { data: events }] = await Promise.all([
    instancesQuery,
      supabase
        .from("heartbeats")
        .select("instance_id, agent_status, ts")
        .order("ts", { ascending: false }),
      supabase
        .from("events")
        .select("instance_id, level, message, ts")
        .eq("level", "error")
        .order("ts", { ascending: false })
        .limit(300),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const latestHeartbeat = new Map<string, string>();
  for (const hb of heartbeats ?? []) {
    if (!latestHeartbeat.has(hb.instance_id)) {
      latestHeartbeat.set(hb.instance_id, hb.agent_status);
    }
  }

  const latestError = new Map<string, string>();
  for (const event of events ?? []) {
    if (!latestError.has(event.instance_id)) {
      latestError.set(event.instance_id, event.message);
    }
  }

  return (instances ?? []).map((instance) => ({
    ...instance,
    status: computeOnlineStatus(instance.last_seen),
    agent_status: latestHeartbeat.get(instance.instance_id) ?? "unknown",
    last_error: latestError.get(instance.instance_id) ?? null,
  }));
}

export async function getInstanceDetail(instanceId: string) {
  const supabase = getSupabaseAdmin();
  const [instanceRes, heartbeatsRes, commandsRes, eventsRes] = await Promise.all([
    supabase.from("instances").select("*").eq("instance_id", instanceId).maybeSingle(),
    supabase
      .from("heartbeats")
      .select("*")
      .eq("instance_id", instanceId)
      .order("ts", { ascending: false })
      .limit(50),
    supabase
      .from("commands")
      .select("*")
      .eq("instance_id", instanceId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("events")
      .select("*")
      .eq("instance_id", instanceId)
      .order("ts", { ascending: false })
      .limit(100),
  ]);

  if (instanceRes.error) {
    throw new Error(instanceRes.error.message);
  }

  return {
    instance: instanceRes.data
      ? {
          ...instanceRes.data,
          status: computeOnlineStatus(instanceRes.data.last_seen),
        }
      : null,
    heartbeats: heartbeatsRes.data ?? [],
    commands: commandsRes.data ?? [],
    events: eventsRes.data ?? [],
  };
}

export async function getAgentDetail(agentId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: agent }, instances] = await Promise.all([
    supabase.from("agents").select("*").eq("agent_id", agentId).maybeSingle(),
    getInstancesList(agentId),
  ]);

  return {
    agent: agent ?? null,
    instances,
  };
}

export async function getCommandsList() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("commands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Creates a worker command for the given instance (e.g. start_agent, stop_agent).
 * Stored with status "queued" so GET /api/worker/commands/poll?instance_id=... can return it.
 */
export async function enqueueCommand(instanceId: string, type: CommandType) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("commands")
    .insert({
      instance_id: instanceId,
      type,
      payload: {},
      status: "queued",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data?.id ?? null;
}

export async function updateAgentProfile(
  agentId: string,
  updates: {
    displayName?: string;
    imageUrl?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();
  const payload: { display_name?: string; image_url?: string | null } = {};

  if (updates.displayName !== undefined) {
    payload.display_name = updates.displayName || agentId;
  }
  if (updates.imageUrl !== undefined) {
    payload.image_url = updates.imageUrl;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("agents")
    .update(payload)
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(error.message);
  }
}
