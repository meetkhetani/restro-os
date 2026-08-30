import { createBrowserClient } from "@supabase/ssr";

function sanitizeEnvVar(val?: string): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function sanitizeHeaderString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x00-\x7F]/g, (c) => encodeURIComponent(c));
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

// Global browser Headers constructor patch to sanitize all new Headers() creations
if (typeof window !== "undefined" && typeof window.Headers !== "undefined") {
  const NativeHeaders = window.Headers;
  const globalObj = window as unknown as { _headersPatched?: boolean };

  if (!globalObj._headersPatched) {
    globalObj._headersPatched = true;

    class SanitizedHeaders extends NativeHeaders {
      constructor(init?: HeadersInit) {
        if (!init) {
          super();
          return;
        }

        const cleanInit: Record<string, string> = {};
        if (init instanceof NativeHeaders) {
          init.forEach((val, key) => {
            cleanInit[sanitizeHeaderString(key)] = sanitizeHeaderString(val);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, val]) => {
            cleanInit[sanitizeHeaderString(key)] = sanitizeHeaderString(String(val));
          });
        } else if (typeof init === "object" && init !== null) {
          Object.entries(init).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
              cleanInit[sanitizeHeaderString(key)] = sanitizeHeaderString(String(val));
            }
          });
        }

        super(cleanInit);
      }

      append(name: string, value: string): void {
        super.append(sanitizeHeaderString(name), sanitizeHeaderString(value));
      }

      set(name: string, value: string): void {
        super.set(sanitizeHeaderString(name), sanitizeHeaderString(value));
      }

      get(name: string): string | null {
        return super.get(sanitizeHeaderString(name));
      }

      has(name: string): boolean {
        return super.has(sanitizeHeaderString(name));
      }

      delete(name: string): void {
        super.delete(sanitizeHeaderString(name));
      }
    }

    window.Headers = SanitizedHeaders as unknown as typeof Headers;
  }
}

// Global browser fetch patch to intercept all window.fetch calls
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch;
  const globalObj = window as unknown as { _fetchPatched?: boolean };
  if (!globalObj._fetchPatched) {
    globalObj._fetchPatched = true;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
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

      return nativeFetch.call(this, input, reqInit);
    };
  }
}

/**
 * Creates a browser-side Supabase client using anonymous/publishable credentials.
 * Safe for use inside React Client Components ('use client').
 */
export function createClient() {
  const supabaseUrl =
    sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://placeholder.supabase.co";
  const supabaseAnonKey =
    sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholderKey";

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
