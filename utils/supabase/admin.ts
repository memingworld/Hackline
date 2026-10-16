import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase client with administrative / service-role capabilities
 * for background webhooks and cron dispatches where no user session cookies exist.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-hackline.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey && process.env.NODE_ENV === "production") {
    console.error("[SECURITY MISCONFIGURATION] SUPABASE_SERVICE_ROLE_KEY is missing in live deployment.");
  }

  const key =
    serviceKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
