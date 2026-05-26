import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let storageAdminClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Supabase Storage operations`);
  }
  return value;
}

export function getSupabaseStorageAdminClient(): SupabaseClient {
  if (storageAdminClient) {
    return storageAdminClient;
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for Supabase Storage operations");
  }

  storageAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return storageAdminClient;
}
