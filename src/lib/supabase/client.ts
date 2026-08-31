import { createBrowserClient } from "@supabase/ssr";

function sanitizeEnvVar(val?: string): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

const FALLBACK_URL = "https://ylseyqvhnvghyjihhezz.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsc2V5cXZobnZnaHlqaWhoZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjIzMTYsImV4cCI6MjEwMzU5ODMxNn0.aXs0MqNftHd2y79pKgkLEdY3xxQAOHYmUZtCmU2cBT8";

/**
 * Creates a browser-side Supabase client using anonymous/publishable credentials.
 * Safe for use inside React Client Components ('use client').
 */
export function createClient() {
  const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL) || FALLBACK_URL;
  const supabaseAnonKey = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || FALLBACK_ANON_KEY;

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize browser Supabase client:", err);
    return createBrowserClient(FALLBACK_URL, FALLBACK_ANON_KEY);
  }
}
