import { createBrowserClient } from '@supabase/ssr';

// Note: createBrowserClient already implements singleton behavior by default in browsers.
// Multiple calls will return the same client instance automatically, which is critical
// for Realtime channel management - channels persist across the singleton instance.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: true  // Explicitly enable singleton behavior
    }
  );
}
