/**
 * Redis cache layer for high-traffic OTA workloads.
 *
 * Why this exists:
 * - Duffel's offerRequests endpoint costs us money + has a 50 req/min rate limit.
 *   Without caching, 1,000 concurrent users searching CGK→DPS = ~5,000 hits to
 *   Duffel and a guaranteed throttle. With a 90s cache, 1,000 users sharing the
 *   same query collapse to 1 upstream call.
 * - DB queries for catalog data (tours/hotels/destinations) are stable —
 *   re-running them on every request wastes Postgres connections.
 *
 * Design notes:
 * - Single shared client (one TCP conn, lazy-connected) — multiple imports OK.
 * - All operations are best-effort: cache miss/error never breaks the request.
 * - Stampede protection: `getOrSet()` uses SET NX + short TTL on the in-flight
 *   key, so 1,000 simultaneous misses → 1 upstream call.
 * - JSON-encoded values (text protocol is cheaper than RESP3 binary for our sizes).
 */

import Redis, { type RedisOptions } from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __bbhRedis: Redis | undefined;
  // eslint-disable-next-line no-var
  var __bbhInflight: Map<string, Promise<unknown>> | undefined;
}

const URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const opts: RedisOptions = {
  // Don't crash the app if redis is briefly unreachable — fall back to upstream.
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  lazyConnect: true,
  // Keep connections healthy under low traffic
  keepAlive: 30_000,
  reconnectOnError: (err) => err.message.includes('READONLY'),
};

export const redis: Redis =
  global.__bbhRedis ??
  (() => {
    const r = new Redis(URL, opts);
    r.on('error', (e) => {
      // Only log once per error to avoid log spam if redis is down
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[redis]', e.message);
      }
    });
    return r;
  })();

if (process.env.NODE_ENV !== 'production') global.__bbhRedis = redis;

const inflight: Map<string, Promise<unknown>> = global.__bbhInflight ?? new Map();
if (process.env.NODE_ENV !== 'production') global.__bbhInflight = inflight;

/**
 * Read a JSON-serialized value. Returns `null` on miss or any error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON-serialized value with a TTL (seconds). Best-effort.
 */
export async function cacheSet<T>(key: string, value: T, ttlSec: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', Math.max(1, Math.floor(ttlSec)));
  } catch {
    /* swallow — cache is optional */
  }
}

/**
 * Delete one or more keys. Pattern-deletes (e.g. `bbh:offers:*`) use SCAN.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length === 0) return;
    await redis.del(...keys);
  } catch {
    /* ignore */
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const batch: string[] = [];
    for await (const chunk of stream as unknown as AsyncIterable<string[]>) {
      batch.push(...chunk);
      if (batch.length >= 500) {
        await redis.del(...batch.splice(0, 500));
      }
    }
    if (batch.length > 0) await redis.del(...batch);
  } catch {
    /* ignore */
  }
}

/**
 * Cache-aside with single-flight protection.
 *
 * If two requests miss the cache simultaneously, only one runs `loader()`;
 * the rest await the same in-flight promise. Prevents stampedes against
 * upstream APIs (Duffel, Stripe, etc.).
 */
export async function getOrSet<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = (async () => {
    try {
      const fresh = await loader();
      // Don't cache `null` / `undefined` — usually means upstream failed.
      if (fresh != null) await cacheSet(key, fresh, ttlSec);
      return fresh;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/**
 * Cache key namespaces. Use these instead of free-form strings to avoid
 * collisions and to make pattern-deletes reliable (`bbh:duffel:*`, etc.).
 */
export const cacheKey = {
  duffelPlaces: (q: string) => `bbh:duffel:places:${q.toLowerCase()}`,
  duffelOffers: (
    origin: string,
    dest: string,
    departureDate: string,
    returnDate: string | undefined,
    pax: string,
    cabin: string,
  ) =>
    `bbh:duffel:offers:${origin}:${dest}:${departureDate}:${returnDate ?? '_'}:${pax}:${cabin}`,
  duffelOfferDetail: (offerId: string) => `bbh:duffel:offer:${offerId}`,
  duffelStays: (
    locationId: string,
    checkIn: string,
    checkOut: string,
    guests: string,
  ) => `bbh:duffel:stays:${locationId}:${checkIn}:${checkOut}:${guests}`,
  duffelStayLocations: (q: string) => `bbh:duffel:locations:${q.toLowerCase()}`,
  catalogTours: (locale: string) => `bbh:catalog:tours:${locale}`,
  catalogDestinations: (locale: string) => `bbh:catalog:destinations:${locale}`,
  catalogFeaturedHomepage: (locale: string) => `bbh:catalog:home:${locale}`,
  fxRate: (from: string, to: string) => `bbh:fx:${from}:${to}`,
  markup: (cat: string) => `bbh:markup:${cat}`,
};

/**
 * Default TTLs (seconds). Tuned per data-volatility profile.
 */
export const cacheTTL = {
  duffelPlaces: 24 * 60 * 60, // 24h — IATA list is stable
  duffelOffers: 90, // 90s — fares move fast, but 90s saves lots of cost
  duffelOfferDetail: 60, // 60s — checkout-only, must stay close to live
  duffelStays: 5 * 60, // 5min — hotels availability slower than flights
  duffelStayLocations: 24 * 60 * 60, // 24h
  catalog: 5 * 60, // 5min — admin edits propagate within 5min (acceptable)
  catalogHomepage: 60, // 1min — front page should feel "live"
  fxRate: 5 * 60, // 5min — FX moves slowly
  markup: 5 * 60, // 5min — admin can change markup, propagate quickly
};
