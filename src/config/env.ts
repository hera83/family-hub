/**
 * Centralized environment configuration.
 * All env access goes through this module – components never read import.meta.env directly.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. ` +
      `Please set it in your .env file or Docker environment.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return import.meta.env[key] || fallback;
}

export const env = {
  /** Base URL for FamilyHub REST API, e.g. https://hub.ramskov.pro */
  apiBaseUrl: requireEnv("VITE_FAMILYHUB_API_BASE_URL"),
  /** API key sent as x-api-key header */
  apiKey: requireEnv("VITE_FAMILYHUB_API_KEY"),
  /** Supabase URL – kept for storage / auth if still needed */
  supabaseUrl: optionalEnv("VITE_SUPABASE_URL", ""),
  supabaseAnonKey: optionalEnv("VITE_SUPABASE_PUBLISHABLE_KEY", ""),
} as const;
