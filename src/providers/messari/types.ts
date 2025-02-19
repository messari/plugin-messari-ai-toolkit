import type { Memory } from "@elizaos/core";

export interface MessariAPIResponse {
  data: {
    messages: Array<{
      content: string;
      role: string;
    }>;
  };
}

export interface MessariError extends Error {
  status?: number;
  statusText?: string;
  responseText?: string;
}

export interface MessariMemory extends Memory {
  content: {
    text: string;
    source: "messari";
    action: string;
  };
}

export interface MessariConfig {
  RECENT_MESSAGES_COUNT: number;
  API_ENDPOINT: string;
  ENV_API_KEY: string;
  MEMORY_TTL_HOURS: number;
}
