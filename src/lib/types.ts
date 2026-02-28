export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CommandType =
  | "start_agent"
  | "stop_agent"
  | "restart_agent"
  | "update_repo"
  | "health_check"
  | "collect_logs"
  | "set_config";

export type CommandStatus =
  | "queued"
  | "claimed"
  | "running"
  | "success"
  | "failed";

export type AgentStatus = "running" | "stopped" | "unknown";
export type EventLevel = "info" | "warn" | "error" | "debug";
export type EventSource = "worker" | "agent";

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          agent_id: string;
          display_name: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          agent_id: string;
          display_name?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          image_url?: string | null;
        };
      };
      instances: {
        Row: {
          instance_id: string;
          agent_id: string;
          display_name: string | null;
          worker_token_hash: string;
          status: "online" | "offline";
          last_seen: string | null;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          instance_id: string;
          agent_id?: string;
          display_name?: string | null;
          worker_token_hash: string;
          status?: "online" | "offline";
          last_seen?: string | null;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          agent_id?: string;
          display_name?: string | null;
          worker_token_hash?: string;
          status?: "online" | "offline";
          last_seen?: string | null;
          metadata?: Json | null;
        };
      };
      heartbeats: {
        Row: {
          id: string;
          instance_id: string;
          ts: string;
          agent_status: AgentStatus;
          pid: number | null;
          cpu: number | null;
          ram: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          instance_id: string;
          ts?: string;
          agent_status: AgentStatus;
          pid?: number | null;
          cpu?: number | null;
          ram?: number | null;
          note?: string | null;
        };
        Update: {
          agent_status?: AgentStatus;
          pid?: number | null;
          cpu?: number | null;
          ram?: number | null;
          note?: string | null;
        };
      };
      commands: {
        Row: {
          id: string;
          instance_id: string;
          type: CommandType;
          payload: Json;
          status: CommandStatus;
          created_at: string;
          claimed_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          result: Json | null;
        };
        Insert: {
          id?: string;
          instance_id: string;
          type: CommandType;
          payload?: Json;
          status?: CommandStatus;
          created_at?: string;
          claimed_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          result?: Json | null;
        };
        Update: {
          status?: CommandStatus;
          claimed_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          result?: Json | null;
        };
      };
      events: {
        Row: {
          id: string;
          instance_id: string;
          ts: string;
          level: EventLevel;
          source: EventSource;
          message: string;
          data: Json | null;
        };
        Insert: {
          id?: string;
          instance_id: string;
          ts?: string;
          level: EventLevel;
          source: EventSource;
          message: string;
          data?: Json | null;
        };
        Update: {
          level?: EventLevel;
          source?: EventSource;
          message?: string;
          data?: Json | null;
        };
      };
      incidents: {
        Row: {
          id: string;
          instance_id: string;
          created_at: string;
          severity: "low" | "medium" | "high" | "critical";
          title: string;
          details: Json | null;
          status: "open" | "ack" | "resolved";
        };
        Insert: {
          id?: string;
          instance_id: string;
          created_at?: string;
          severity: "low" | "medium" | "high" | "critical";
          title: string;
          details?: Json | null;
          status?: "open" | "ack" | "resolved";
        };
        Update: {
          severity?: "low" | "medium" | "high" | "critical";
          title?: string;
          details?: Json | null;
          status?: "open" | "ack" | "resolved";
        };
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      claim_command: {
        Args: {
          p_instance_id: string;
          p_command_id: string;
        };
        Returns: {
          claimed: boolean;
          command_id: string;
          status: CommandStatus;
        }[];
      };
    };
  };
}
