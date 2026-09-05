import type { PoolConfig } from "pg";

/**
 * Pool config for PrismaPg.
 * On Vercel/serverless, keep max=1 so many concurrent lambdas do not exhaust
 * Supabase session-mode pooler (EMAXCONNSESSION / pool_size ≈ 15).
 */
export function buildPrismaPgPoolConfig(dbUrl: string): PoolConfig {
  const isSupabase = dbUrl.includes("supabase.com");
  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;

  if (!isSupabase) {
    return {
      connectionString: dbUrl,
      max: isServerless ? 1 : undefined,
      idleTimeoutMillis: isServerless ? 5_000 : undefined,
      connectionTimeoutMillis: 15_000,
    };
  }

  const url = new URL(dbUrl);
  url.searchParams.delete("sslmode");

  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: isServerless ? 1 : 3,
    idleTimeoutMillis: isServerless ? 5_000 : 20_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: isServerless,
  };
}
