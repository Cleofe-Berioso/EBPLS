/**
 * Redis Caching Layer
 * Provides caching for frequently accessed data with automatic fallback
 * when Redis is unavailable (development / single-instance mode).
 */

import IORedis from 'ioredis';

// ============================================================================
// Redis Client (Singleton)
// ============================================================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForCache = globalThis as typeof globalThis & {
  __ebplsRedisClient?: IORedis | null;
  __ebplsRedisAvailable?: boolean;
  __ebplsRedisWarningLogged?: boolean;
};

let redis = globalForCache.__ebplsRedisClient ?? null;
let redisAvailable = globalForCache.__ebplsRedisAvailable ?? true;
let redisWarningLogged = globalForCache.__ebplsRedisWarningLogged ?? false;

function syncCacheGlobals() {
  globalForCache.__ebplsRedisClient = redis;
  globalForCache.__ebplsRedisAvailable = redisAvailable;
  globalForCache.__ebplsRedisWarningLogged = redisWarningLogged;
}

function markRedisUnavailable(reason?: string) {
  redisAvailable = false;

  if (!redisWarningLogged) {
    const suffix = reason ? ` (${reason})` : "";
    console.warn(`[Cache] Redis unavailable; using in-memory cache${suffix}`);
    redisWarningLogged = true;
  }

  if (redis) {
    redis.removeAllListeners();
    redis.disconnect();
    redis = null;
  }

  syncCacheGlobals();
}

function getRedis(): IORedis | null {
  if (!redisAvailable) return null;

  if (!redis) {
    try {
      redis = new IORedis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
          if (times > 3) {
            markRedisUnavailable("retry limit reached");
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
      redis.on('error', (err) => {
        markRedisUnavailable(err.message);
      });
      redis.on('connect', () => {
        redisAvailable = true;
        redisWarningLogged = false;
        syncCacheGlobals();
      });
      redis.connect().catch(() => {
        markRedisUnavailable("connect failed");
      });
      syncCacheGlobals();
    } catch {
      markRedisUnavailable("client init failed");
      return null;
    }
  }

  return redis;
}

// ============================================================================
// In-Memory Cache Fallback (for dev / when Redis is unavailable)
// ============================================================================

interface MemCacheEntry {
  value: string;
  expiresAt: number | null;
}

const memCache = new Map<string, MemCacheEntry>();

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        memCache.delete(key);
      }
    }
  }, 30_000);
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get a cached value
 */
export async function cacheGet<T = string>(key: string): Promise<T | null> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      const value = await client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as unknown as T;
  }
}

/**
 * Set a cached value
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      if (ttlSeconds > 0) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  memCache.set(key, {
    value: serialized,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      await client.del(key);
    } catch {
      // ignore
    }
  }

  memCache.delete(key);
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedis();

  if (client && redisAvailable) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  // In-memory fallback — match simple glob patterns
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`);
  for (const key of memCache.keys()) {
    if (regex.test(key)) {
      memCache.delete(key);
    }
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

// ============================================================================
// Pre-built Cache Keys & Helpers
// ============================================================================

export const CacheKeys = {
  /** Application by ID — 5 min TTL */
  application: (id: string) => `app:${id}`,

  /** Applications list for a user — 2 min TTL */
  userApplications: (userId: string) => `apps:user:${userId}`,

  /** Schedule slots for a date — 10 min TTL */
  scheduleSlots: (date: string) => `schedule:slots:${date}`,

  /** Dashboard stats — 5 min TTL */
  dashboardStats: (role: string) => `dashboard:stats:${role}`,

  /** Analytics data — 15 min TTL */
  analytics: () => 'analytics:overview',

  /** System settings — 30 min TTL */
  systemSettings: () => 'system:settings',

  /** User profile — 10 min TTL */
  userProfile: (userId: string) => `user:profile:${userId}`,

  /** Permit by ID — 10 min TTL */
  permit: (id: string) => `permit:${id}`,

  /** Fee calculation — 1 hour TTL */
  feeCalculation: (type: string, capital: number) => `fee:${type}:${capital}`,
} as const;

export const CacheTTL = {
  SHORT: 120,      // 2 minutes
  MEDIUM: 300,     // 5 minutes
  LONG: 600,       // 10 minutes
  VERY_LONG: 1800, // 30 minutes
  HOUR: 3600,      // 1 hour
} as const;

/**
 * Cache-aside pattern: get from cache, or compute and cache
 */
export async function cacheOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Compute and cache
  const value = await computeFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/**
 * Invalidate user-related caches when their data changes
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  await Promise.all([
    cacheDel(CacheKeys.userApplications(userId)),
    cacheDel(CacheKeys.userProfile(userId)),
  ]);
}

/**
 * Invalidate application-related caches
 */
export async function invalidateApplicationCaches(
  applicationId: string,
  userId?: string
): Promise<void> {
  await cacheDel(CacheKeys.application(applicationId));
  if (userId) {
    await cacheDel(CacheKeys.userApplications(userId));
  }
  // Invalidate dashboard stats for all roles
  await cacheDelPattern('dashboard:stats:*');
}
