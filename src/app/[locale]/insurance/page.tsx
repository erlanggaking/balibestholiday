import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { Price } from '@/components/price';
import { ShieldCheck, Check } from 'lucide-react';

export const metadata = { title: 'Travel Insurance' };

export default async function InsurancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });

  const plans = await prisma.insurancePlan
    .findMany({ where: { isActive: true }, include: { translations: true } })
    .catch(() => []);

  const tr = (item: any, key: string) =>
    item.translations.find((x: any) => x.languageCode === locale)?.[key];

  const parseList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === 'string') {
      try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
    }
    return [];
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">{t('insurance')}</h1>
      <p className="mb-8 text-slate-600">Protect your trip with comprehensive coverage</p>

      {plans.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No plans yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="mb-1 text-sm font-medium text-brand-600">{p.provider}</div>
              <h3 className="mb-2 text-xl font-bold">{tr(p, 'name') ?? p.name}</h3>
              <p className="mb-4 text-sm text-slate-600">{tr(p, 'shortDesc') ?? p.shortDesc}</p>

              <ul className="mb-4 space-y-2 text-sm">
                {parseList(tr(p, 'benefits') ?? p.benefits).slice(0, 5).map((b: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-end justify-between border-t pt-4">
                <div>
                  <div className="text-xs text-slate-500">From</div>
                  <div className="font-display text-2xl font-bold text-brand-700">
                    <Price amountUSD={Number(p.pricePerDay)} />
                  </div>
                  <div className="text-xs text-slate-500">per day</div>
                </div>
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Get Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
