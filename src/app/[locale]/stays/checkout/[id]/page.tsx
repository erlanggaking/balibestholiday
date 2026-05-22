import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';
import { notFound } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';
import { StayCheckoutForm } from '@/components/stay-checkout-form';
import { Price } from '@/components/price';

export const metadata = { title: 'Confirm hotel booking' };

export default async function StayCheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  let result: any = null;
  try {
    // Fetch stays search result
    const res = await (duffel as any).stays.searchResults.get(id);
    result = res?.data;
  } catch {}

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl py-16 px-4 text-center">
        <h1 className="mb-3 font-display text-2xl font-bold">Stay no longer available</h1>
        <p className="text-slate-600">
          Search results expire quickly with live inventory. Please run a new search.
        </p>
      </div>
    );
  }

  const acc = result.accommodation ?? {};
  const cheapestRate = result.cheapest_rate ?? acc.cheapest_rate;
  const baseAmount = parseFloat(result.cheapest_rate_total_amount ?? '0');
  const finalAmount = await priceWithMarkup(baseAmount, 'hotel');

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-display text-3xl font-bold">Confirm your stay</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <StayCheckoutForm
            rateId={result.cheapest_rate_id ?? cheapestRate?.id}
            checkInDate={result.check_in_date}
            checkOutDate={result.check_out_date}
            accommodationName={acc.name}
          />

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {acc.photos?.[0]?.url && (
                <div
                  className="mb-4 h-44 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${acc.photos[0].url})` }}
                />
              )}
              <div className="mb-1 flex items-center gap-1">
                {Array.from({ length: acc.rating ?? 3 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h2 className="font-display text-lg font-bold">{acc.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {acc.location?.address?.line_one}, {acc.location?.address?.city_name}
              </p>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in</span>
                  <span>{result.check_in_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out</span>
                  <span>{result.check_out_date}</span>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-brand-700">
                    <Price amountUSD={finalAmount} fromCurrency={result.cheapest_rate_currency} />
                  </span>
                </div>
                <div className="mt-1 text-right text-xs text-slate-500">all-in price</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
