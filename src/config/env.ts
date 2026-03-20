/**
 * Centralized environment configuration.
 * All env access goes through this module – components never read import.meta.env directly.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(
      `Missing environment variable: ${key}. ` +
      `Please set it in your .env file or Docker environment.`
    );
    return "";
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return import.meta.env[key] || fallback;
}

export const env = {
  /** Base URL for FamilyHub REST API, e.g. https://hub.ramskov.pro */
  apiBaseUrl: optionalEnv("VITE_FAMILYHUB_API_BASE_URL", "https://hub.ramskov.pro"),
  /** API key sent as x-api-key header */
  apiKey: optionalEnv("VITE_FAMILYHUB_API_KEY", "7d750d7c-b55b-4f31-b79f-7a839a4f5477"),
} as const;
