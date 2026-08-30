import { createBrowserClient } from "@supabase/ssr";

function sanitizeEnvVar(val?: string): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

/**
 * Creates a browser-side Supabase client using anonymous/publishable credentials.
 * Safe for use inside React Client Components ('use client').
 */
export function createClient() {
  const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined."
    );
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid URL protocol");
    }
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL format");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
