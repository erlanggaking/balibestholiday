import { prisma } from './prisma';

export type MarkupCategory = 'flight' | 'hotel' | 'tour' | 'car' | 'insurance';

const DEFAULTS: Record<MarkupCategory, number> = {
  flight: 5, // 5%
  hotel: 10, // 10%
  tour: 0,
  car: 0,
  insurance: 0,
};

const KEY = (cat: MarkupCategory) => `markup_pct_${cat}`;

const cache: Partial<Record<MarkupCategory, { value: number; expires: number }>> = {};
const TTL_MS = 60_000;

export async function getMarkupPct(cat: MarkupCategory): Promise<number> {
  const now = Date.now();
  const c = cache[cat];
  if (c && c.expires > now) return c.value;

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
  cache[cat] = { value, expires: now + TTL_MS };
  return value;
}

export async function setMarkupPct(cat: MarkupCategory, pct: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY(cat) },
    update: { value: pct.toString() },
    create: { key: KEY(cat), value: pct.toString() },
  });
  cache[cat] = { value: pct, expires: Date.now() + TTL_MS };
}

export function applyMarkup(amount: number, pct: number): number {
  return amount * (1 + pct / 100);
}

export async function priceWithMarkup(amount: number, cat: MarkupCategory): Promise<number> {
  const pct = await getMarkupPct(cat);
  return applyMarkup(amount, pct);
}
