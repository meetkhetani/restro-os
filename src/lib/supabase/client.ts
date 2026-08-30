import { createBrowserClient } from "@supabase/ssr";

function sanitizeEnvVar(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/[^\x00-\x7F]/g, "").replace(/^["']|["']$/g, "");
}

function sanitizeHeaderString(str: string): string {
  // Percent-encode any character outside the ISO-8859-1 range (code point > 255)
  return str.replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c));
}

function extractSanitizedHeaders(
  headers: HeadersInit,
  target: Record<string, string>
) {
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    headers.forEach((val, key) => {
      target[sanitizeHeaderString(key)] = sanitizeHeaderString(val);
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, val]) => {
      target[sanitizeHeaderString(key)] = sanitizeHeaderString(String(val));
    });
  } else if (typeof headers === "object" && headers !== null) {
    Object.entries(headers).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        target[sanitizeHeaderString(key)] = sanitizeHeaderString(String(val));
      }
    });
  }
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

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        let reqInit: RequestInit = init ? { ...init } : {};
        const cleanHeaders: Record<string, string> = {};

        if (typeof Request !== "undefined" && input instanceof Request) {
          input.headers.forEach((val, key) => {
            cleanHeaders[sanitizeHeaderString(key)] = sanitizeHeaderString(val);
          });
          if (reqInit.headers) {
            extractSanitizedHeaders(reqInit.headers, cleanHeaders);
          }
          reqInit.headers = cleanHeaders;
          input = input.url;
        } else if (reqInit.headers) {
          extractSanitizedHeaders(reqInit.headers, cleanHeaders);
          reqInit.headers = cleanHeaders;
        }

        return fetch(input, reqInit);
      },
    },
  });
}
