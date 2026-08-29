import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client using anonymous/publishable credentials.
 * Safe for use inside React Client Components ('use client').
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
