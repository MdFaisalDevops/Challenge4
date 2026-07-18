import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  body: any;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * Thread-safe memory caching middleware
 * Configures TTL (Time To Live) in milliseconds.
 * Reduces Firestore reads on high-frequency requests.
 */
export const memoryCacheMiddleware = (ttlMs: number = 5000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = req.originalUrl;
    const now = Date.now();
    const cached = memoryCache.get(key);

    if (cached && cached.expiresAt > now) {
      console.log(`[memory-cache]: Hit for "${key}" (Served from memory)`);
      res.json(cached.body);
      return;
    }

    console.log(`[memory-cache]: Miss for "${key}" (Fetching from database...)`);

    // Override res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Only cache successful requests
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(key, {
          body,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

// Clear target cache key on database writes to maintain data fresh state
export const invalidateCacheKey = (key: string) => {
  memoryCache.delete(key);
};

// Clear entire cache on major mutations
export const invalidateAllCache = () => {
  memoryCache.clear();
  console.log('[memory-cache]: In-memory cache successfully flushed.');
};

// Evict expired entries periodically to prevent memory leaks from URL permutations
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    let evictedCount = 0;
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key);
        evictedCount++;
      }
    }
    if (evictedCount > 0) {
      console.log(`[memory-cache]: Garbage collection swept ${evictedCount} expired cache records.`);
    }
  }, 60000); // Run eviction scan every 60 seconds
}
