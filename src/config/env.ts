/**
 * Central environment configuration.
 * Controls whether the app uses Supabase (cloud/Lovable) or a local REST API.
 *
 * VITE_APP_MODE:
 *   - "supabase" (default) → uses Supabase client
 *   - "local"              → uses REST API at VITE_API_BASE_URL
 */

export const config = {
  appMode: (import.meta.env.VITE_APP_MODE || "supabase") as "supabase" | "local",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  apiKey: import.meta.env.VITE_API_KEY || "",
};

export const isLocalMode = config.appMode === "local";
export const isSupabaseMode = config.appMode === "supabase";
