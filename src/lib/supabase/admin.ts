import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function sanitizeEnvVar(val?: string): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

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

  const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = sanitizeEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);

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
