import { z } from "zod";

const commandTypes = [
  "start_agent",
  "stop_agent",
  "restart_agent",
  "update_repo",
  "health_check",
  "collect_logs",
  "set_config",
] as const;

const eventLevels = ["info", "warn", "error", "debug"] as const;
const eventSources = ["worker", "agent"] as const;

export const registerSchema = z.object({
  agent_id: z.string().min(1).max(120).optional(),
  instance_id: z.string().min(1).max(120),
  worker_token: z.string().min(16),
  display_name: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const heartbeatSchema = z.object({
  instance_id: z.string().min(1).max(120),
  agent_status: z.enum(["running", "stopped", "unknown"]),
  pid: z.number().int().nullable().optional(),
  cpu: z.number().min(0).max(100).nullable().optional(),
  ram: z.number().min(0).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const pollSchema = z.object({
  instance_id: z.string().min(1).max(120),
});

export const claimSchema = z.object({
  instance_id: z.string().min(1).max(120),
  command_id: z.uuid(),
});

export const ackSchema = z.object({
  instance_id: z.string().min(1).max(120),
  command_id: z.uuid(),
  success: z.boolean(),
  error_message: z.string().max(2000).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
  logs_tail: z.string().max(12000).optional(),
});

export const workerEventSchema = z.object({
  instance_id: z.string().min(1).max(120),
  level: z.enum(eventLevels),
  source: z.enum(eventSources),
  message: z.string().min(1).max(4000),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const adminCommandSchema = z.object({
  instance_id: z.string().min(1).max(120),
  type: z.enum(commandTypes),
  payload: z.record(z.string(), z.unknown()).optional(),
});
