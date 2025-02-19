import type { MessariConfig } from "./types";

/**
 * Default configuration values for the Messari provider
 */
export const DEFAULT_CONFIG: MessariConfig = {
  RECENT_MESSAGES_COUNT: 5,
  API_ENDPOINT: "https://api.messari.io/ai/v1/chat/completions",
  ENV_API_KEY: "MESSARI_API_KEY",
  MEMORY_TTL_HOURS: 24,
} as const;

/**
 * Validates the configuration values
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: MessariConfig): void {
  if (config.RECENT_MESSAGES_COUNT < 1) {
    throw new Error("RECENT_MESSAGES_COUNT must be greater than 0");
  }
  if (config.MEMORY_TTL_HOURS < 1) {
    throw new Error("MEMORY_TTL_HOURS must be greater than 0");
  }
  if (!config.API_ENDPOINT.startsWith("https://")) {
    throw new Error("API_ENDPOINT must be a secure HTTPS URL");
  }
  if (!config.ENV_API_KEY) {
    throw new Error("ENV_API_KEY must be specified");
  }
}
