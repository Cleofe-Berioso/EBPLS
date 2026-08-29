import type { PoolConfig } from "pg";

/** Pool config for PrismaPg — handles Supabase TLS on Node (Windows). */
export function buildPrismaPgPoolConfig(dbUrl: string): PoolConfig {
  const isSupabase = dbUrl.includes("supabase.com");
  if (!isSupabase) {
    return { connectionString: dbUrl };
  }

  const url = new URL(dbUrl);
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 8,
    idleTimeoutMillis: 20_000,
  };
}
