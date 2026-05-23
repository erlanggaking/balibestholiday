import { prisma } from './prisma';
import { cacheGet, cacheSet, cacheDel, cacheKey, cacheTTL } from './cache';

export type MarkupCategory = 'flight' | 'hotel' | 'tour' | 'car' | 'insurance';

const DEFAULTS: Record<MarkupCategory, number> = {
  flight: 5, // 5%
  hotel: 10, // 10%
  tour: 0,
  car: 0,
  insurance: 0,
};

const KEY = (cat: MarkupCategory) => `markup_pct_${cat}`;

// Two-tier cache: in-process Map (per-request fast path, ~0.1ms) +
// Redis (cross-container consistency, ~1ms). DB hit only on cold cache.
const lru: Partial<Record<MarkupCategory, { value: number; expires: number }>> = {};
const PROC_TTL_MS = 30_000;

export async function getMarkupPct(cat: MarkupCategory): Promise<number> {
  const now = Date.now();
  const lc = lru[cat];
  if (lc && lc.expires > now) return lc.value;

  // Tier 2: Redis (shared across all app containers)
  const redisVal = await cacheGet<number>(cacheKey.markup(cat));
  if (typeof redisVal === 'number') {
    lru[cat] = { value: redisVal, expires: now + PROC_TTL_MS };
    return redisVal;
  }

  // Tier 3: Postgres (cold path)
  let value = DEFAULTS[cat];
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY(cat) } });
    if (row) {
      const parsed = parseFloat(row.value);
      if (!Number.isNaN(parsed)) value = parsed;
    }
  } catch {
    // db unreachable — fall back to defaults silently
  }
  lru[cat] = { value, expires: now + PROC_TTL_MS };
  await cacheSet(cacheKey.markup(cat), value, cacheTTL.markup);
  return value;
}

export async function setMarkupPct(cat: MarkupCategory, pct: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY(cat) },
    update: { value: pct.toString() },
    create: { key: KEY(cat), value: pct.toString() },
  });
  // Invalidate both tiers so the new value propagates to all containers.
  lru[cat] = { value: pct, expires: Date.now() + PROC_TTL_MS };
  await cacheDel(cacheKey.markup(cat));
}

export function applyMarkup(amount: number, pct: number): number {
  return amount * (1 + pct / 100);
}

export async function priceWithMarkup(amount: number, cat: MarkupCategory): Promise<number> {
  const pct = await getMarkupPct(cat);
  return applyMarkup(amount, pct);
}
