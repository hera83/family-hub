/**
 * Centralized environment configuration.
 * All env access goes through this module – components never read import.meta.env directly.
 */

function optionalEnv(key: string, fallback: string): string {
  return import.meta.env[key] || fallback;
}

const isDev = import.meta.env.DEV;

export const env = {
  /** Base URL for FamilyHub REST API.
   *  In dev mode, use empty string so requests go through Vite proxy (avoids CORS).
   *  In production/Docker, use the full URL from env. */
  apiBaseUrl: isDev ? "" : optionalEnv("VITE_FAMILYHUB_API_BASE_URL", "https://hub.ramskov.pro"),
  /** API key sent as x-api-key header */
  apiKey: optionalEnv("VITE_FAMILYHUB_API_KEY", "7d750d7c-b55b-4f31-b79f-7a839a4f5477"),
} as const;
