import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a privileged Supabase client using the Service Role Key.
 * EXCLUSIVELY FOR SERVER-SIDE USE (e.g. system provisioning, background webhooks).
 * DO NOT import or execute this inside any Client Component or export it to browser context.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY ERROR: Privileged Supabase Admin Client cannot be instantiated on the browser client."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase Service Role environment variables: SUPABASE_SERVICE_ROLE_KEY is required for admin operations."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
