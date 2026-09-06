import { createBrowserClient } from '@supabase/ssr'
import { logger } from '../logger'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Provide dummy keys during SSR/Build phase to prevent build crashes
    if (typeof window === "undefined") {
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-anon-key"
      );
    }

    logger.error(
      "Supabase environment variables are not configured. Check your .env.local file.",
      {
        url: !!url,
        key: !!key,
      }
    );

    // Still return a placeholder on the client to avoid crash if variables are missing
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient(url!, key!);
}
