import { duffel } from '@/lib/duffel';
import { priceWithMarkup } from '@/lib/markup';
import { notFound } from 'next/navigation';
import { Plane, Clock } from 'lucide-react';
import { FlightCheckoutForm } from '@/components/flight-checkout-form';
import { Price } from '@/components/price';

export const metadata = { title: 'Confirm flight booking' };

export default async function FlightCheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  let offer: any = null;
  try {
    offer = (await duffel.offers.get(id)).data;
  } catch {
    notFound();
  }
  if (!offer) notFound();

  const baseAmount = parseFloat(offer.total_amount);
  const finalAmount = await priceWithMarkup(baseAmount, 'flight');

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-display text-3xl font-bold">Confirm your flight</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div>
            <FlightCheckoutForm
              offerId={id}
              passengers={offer.passengers}
              identityRequired={offer.passenger_identity_documents_required ?? false}
            />
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                {offer.owner?.logo_symbol_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.owner.logo_symbol_url} alt="" className="h-8 w-8 rounded" />
                )}
                <div className="font-semibold">{offer.owner?.name}</div>
              </div>

              <div className="space-y-3">
                {offer.slices?.map((s: any, i: number) => {
                  const seg = s.segments?.[0];
                  const lastSeg = s.segments?.[s.segments.length - 1];
                  return (
                    <div key={i} className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs uppercase text-slate-500">
                        {i === 0 ? 'Outbound' : 'Return'}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                        <Plane className="h-4 w-4" />
                        {seg?.origin?.iata_code} → {lastSeg?.destination?.iata_code}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {new Date(seg?.departing_at).toLocaleString()} —{' '}
                        {new Date(lastSeg?.arriving_at).toLocaleString()}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDuration(s.duration)} · {s.segments.length === 1 ? 'Direct' : `${s.segments.length - 1} stop`}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Fare ({offer.passengers?.length} pax)</span>
                  <span><Price amountUSD={finalAmount} fromCurrency={offer.total_currency} /></span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-brand-700">
                    <Price amountUSD={finalAmount} fromCurrency={offer.total_currency} />
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatDuration(iso?: string) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ?? '0';
  const min = m[2] ?? '0';
  return `${h}h ${min}m`;
}
