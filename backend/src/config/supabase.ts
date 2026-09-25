import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "./env";

// Master Supabase client with anon key
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws as any,
    },
  }
);

// Helper to create an authenticated client for scoped RLS queries
export function getAuthenticatedSupabaseClient(accessToken?: string): SupabaseClient {
  if (!accessToken) return supabase;

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws as any,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
