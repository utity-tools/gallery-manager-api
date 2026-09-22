import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createError, ERRORS } from "../errors/AppErrors";

let client: SupabaseClient | undefined;

/**
 * Server-only client using the service_role key, which bypasses Storage RLS.
 * This app has no Supabase Auth session to satisfy auth.role() = 'authenticated'
 * policies, so uploads rely on our own requireAuth + ownership checks instead.
 * Never expose this client or its key to the frontend.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw createError(ERRORS.INTERNAL_ERROR, {
        message:
          "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured",
      });
    }

    client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return client;
}
