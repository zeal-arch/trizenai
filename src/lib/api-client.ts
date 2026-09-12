import { createClient } from "@/lib/supabase/client";

/**
 * Authenticated client-side fetch helper.
 * Automatically attaches the Supabase session access token as an `Authorization: Bearer <token>`
 * header alongside standard same-origin cookies.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  try {
    if (typeof window !== "undefined") {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }
    }
  } catch (err) {
    console.warn("[authFetch] Failed to retrieve session access token:", err);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
