'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plane, Briefcase, Clock, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Price } from './price';

export type NormalizedOffer = {
  id: string;
  total_amount: number;
  total_amount_with_markup: number;
  total_currency: string;
  passenger_count: number;
  total_emissions_kg?: string | null;
  conditions: {
    refund_before_departure: boolean | null;
    change_before_departure: boolean | null;
  };
  owner: { iata_code: string; name: string; logo: string | null };
  baggages_per_passenger: { type: string; quantity: number }[];
  slices: {
    duration: string;
    stops: number;
    origin_iata: string;
    origin_city?: string;
    destination_iata: string;
    destination_city?: string;
    departing_at: string;
    arriving_at: string;
    fare_brand_name: string | null;
    segments: {
      departing_at: string;
      arriving_at: string;
      origin_iata: string;
      destination_iata: string;
      duration: string;
      marketing_carrier: string;
      marketing_carrier_iata: string;
      flight_number: string;
      aircraft?: string;
    }[];
  }[];
};

type Carrier = { iata_code: string; name: string; logo: string | null };
type SortKey = 'price' | 'duration' | 'departure' | 'fewest_stops';
type StopFilter = 'any' | '0' | '1' | '2+';

interface Props {
  offers: NormalizedOffer[];
  route: { origin: string; destination: string };
  carriers: Carrier[];
}

const PAGE_SIZE = 20;

export function FlightResultsClient({ offers, route, carriers }: Props) {
  const [sort, setSort] = useState<SortKey>('price');
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set());
  const [stopFilter, setStopFilter] = useState<StopFilter>('any');
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const cheapest = offers.length ? Math.min(...offers.map((o) => o.total_amount_with_markup)) : 0;
  const mostExpensive = offers.length ? Math.max(...offers.map((o) => o.total_amount_with_markup)) : 0;

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (selectedCarriers.size > 0 && !selectedCarriers.has(o.owner.iata_code)) return false;
      if (stopFilter !== 'any') {
        const maxStops = Math.max(...o.slices.map((s) => s.stops));
        if (stopFilter === '0' && maxStops !== 0) return false;
        if (stopFilter === '1' && maxStops !== 1) return false;
        if (stopFilter === '2+' && maxStops < 2) return false;
      }
      if (refundableOnly && !o.conditions.refund_before_departure) return false;
      if (maxPrice !== null && o.total_amount_with_markup > maxPrice) return false;
      return true;
    });
  }, [offers, selectedCarriers, stopFilter, refundableOnly, maxPrice]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === 'price') copy.sort((a, b) => a.total_amount_with_markup - b.total_amount_with_markup);
    else if (sort === 'duration')
      copy.sort((a, b) => parseDuration(a.slices[0]?.duration) - parseDuration(b.slices[0]?.duration));
    else if (sort === 'departure')
      copy.sort(
        (a, b) =>
          new Date(a.slices[0]?.departing_at).getTime() -
          new Date(b.slices[0]?.departing_at).getTime(),
      );
    else if (sort === 'fewest_stops')
      copy.sort(
        (a, b) =>
          Math.max(...a.slices.map((s) => s.stops)) - Math.max(...b.slices.map((s) => s.stops)),
      );
    return copy;
  }, [filtered, sort]);

  const visible = sorted.slice(0, page * PAGE_SIZE);
  const carrierCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of offers) map.set(o.owner.iata_code, (map.get(o.owner.iata_code) ?? 0) + 1);
    return map;
  }, [offers]);

  const toggleCarrier = (code: string) => {
    setSelectedCarriers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedCarriers(new Set());
    setStopFilter('any');
    setRefundableOnly(false);
    setMaxPrice(null);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filters */}
      <aside className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-brand-600 hover:underline"
          >
            Reset
          </button>
        </div>

        <FilterSection title="Stops">
          <div className="space-y-1">
            {(
              [
                ['any', 'Any'],
                ['0', 'Direct only'],
                ['1', '1 stop'],
                ['2+', '2+ stops'],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={stopFilter === v}
                  onChange={() => {
                    setStopFilter(v);
                    setPage(1);
                  }}
                  className="text-brand-600"
                />
                {label}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={`Airlines (${carriers.length})`}>
          <div className="max-h-56 space-y-1 overflow-auto pr-1">
            {carriers
              .sort((a, b) => (carrierCounts.get(b.iata_code) ?? 0) - (carrierCounts.get(a.iata_code) ?? 0))
              .map((c) => (
                <label key={c.iata_code} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCarriers.has(c.iata_code)}
                    onChange={() => toggleCarrier(c.iata_code)}
                    className="rounded text-brand-600"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-slate-400">{carrierCounts.get(c.iata_code) ?? 0}</span>
                </label>
              ))}
          </div>
        </FilterSection>

        <FilterSection title="Max price">
          <input
            type="range"
            min={Math.floor(cheapest)}
            max={Math.ceil(mostExpensive)}
            value={maxPrice ?? Math.ceil(mostExpensive)}
            onChange={(e) => {
              setMaxPrice(parseFloat(e.target.value));
              setPage(1);
            }}
            className="w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              <Price amountUSD={cheapest} fromCurrency={offers[0]?.total_currency} />
            </span>
            <span className="font-semibold text-slate-700">
              <Price amountUSD={maxPrice ?? mostExpensive} fromCurrency={offers[0]?.total_currency} />
            </span>
          </div>
        </FilterSection>

        <FilterSection title="Conditions">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={refundableOnly}
              onChange={() => {
                setRefundableOnly((v) => !v);
                setPage(1);
              }}
              className="rounded text-brand-600"
            />
            Refundable only
          </label>
        </FilterSection>
      </aside>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="font-display text-lg font-bold">
              {route.origin} → {route.destination}
            </h2>
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{sorted.length}</span> of{' '}
              {offers.length} live results from {carriers.length} airline
              {carriers.length === 1 ? '' : 's'}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="price">Cheapest</option>
              <option value="duration">Shortest duration</option>
              <option value="departure">Earliest departure</option>
              <option value="fewest_stops">Fewest stops</option>
            </select>
          </label>
        </div>

        {sorted.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            No flights match your filters.{' '}
            <button onClick={resetFilters} className="text-brand-600 hover:underline">
              Reset
            </button>
          </div>
        )}

        {visible.map((o) => (
          <FlightOfferCard key={o.id} offer={o} />
        ))}

        {visible.length < sorted.length && (
          <div className="text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-2.5 font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Show {Math.min(PAGE_SIZE, sorted.length - visible.length)} more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center justify-between text-sm font-semibold"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && children}
    </div>
  );
}

function FlightOfferCard({ offer }: { offer: NormalizedOffer }) {
  const [expanded, setExpanded] = useState(false);
  const checked = offer.baggages_per_passenger.find((b) => b.type === 'checked')?.quantity ?? 0;
  const carryOn = offer.baggages_per_passenger.find((b) => b.type === 'carry_on')?.quantity ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1fr_180px]">
        <div className="space-y-3">
          {offer.slices.map((s, i) => (
            <SliceRow
              key={i}
              s={s}
              ownerLogo={offer.owner.logo}
              ownerName={offer.owner.name}
              direction={offer.slices.length === 1 ? null : i === 0 ? 'Outbound' : 'Return'}
            />
          ))}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {(checked > 0 || carryOn > 0) && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {checked > 0 && `${checked} checked`}
                {checked > 0 && carryOn > 0 && ' + '}
                {carryOn > 0 && `${carryOn} carry-on`}
              </span>
            )}
            {offer.conditions.refund_before_departure ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                <RefreshCw className="h-3 w-3" /> Refundable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                <X className="h-3 w-3" /> Non-refundable
              </span>
            )}
            {offer.conditions.change_before_departure && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Changeable</span>
            )}
            {offer.slices[0]?.fare_brand_name && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">
                {offer.slices[0].fare_brand_name.replace(/_/g, ' ').toLowerCase()}
              </span>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-auto text-xs text-brand-600 hover:underline"
            >
              {expanded ? 'Hide details' : 'Flight details'}
            </button>
          </div>

          {expanded && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              {offer.slices.map((s, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 border-t pt-3' : ''}>
                  <div className="mb-1 font-semibold">
                    {offer.slices.length === 1 ? 'Itinerary' : idx === 0 ? 'Outbound' : 'Return'}
                  </div>
                  {s.segments.map((seg, si) => (
                    <div key={si} className="grid grid-cols-[80px_1fr] gap-2 py-1">
                      <span className="font-mono text-slate-500">
                        {formatTime(seg.departing_at)}
                      </span>
                      <span>
                        <strong>{seg.origin_iata}</strong> → <strong>{seg.destination_iata}</strong>
                        {' · '}
                        {seg.marketing_carrier} {seg.marketing_carrier_iata}
                        {seg.flight_number} · {seg.aircraft ?? 'Aircraft TBA'} ·{' '}
                        {formatDuration(seg.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-between gap-2 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-brand-700">
              <Price
                amountUSD={offer.total_amount_with_markup}
                fromCurrency={offer.total_currency}
              />
            </div>
            <div className="text-xs text-slate-500">
              total · {offer.passenger_count} pax
            </div>
            {offer.total_emissions_kg && (
              <div className="mt-1 text-[10px] text-emerald-600">
                CO₂ {offer.total_emissions_kg} kg
              </div>
            )}
          </div>
          <Link
            href={`/flights/checkout/${offer.id}`}
            className="rounded-xl bg-brand-600 px-5 py-2 font-semibold text-white transition hover:bg-brand-700"
          >
            Select
          </Link>
        </div>
      </div>
    </div>
  );
}

function SliceRow({
  s,
  ownerLogo,
  ownerName,
  direction,
}: {
  s: NormalizedOffer['slices'][number];
  ownerLogo: string | null;
  ownerName: string;
  direction: string | null;
}) {
  return (
    <div>
      {direction && <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{direction}</div>}
      <div className="flex items-center gap-4">
        {ownerLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ownerLogo} alt={ownerName} className="h-8 w-8 rounded" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-100 text-brand-700">
            <Plane className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">{formatTime(s.departing_at)}</span>
            <span className="flex-1 border-t border-dashed border-slate-300 px-2 text-center text-xs text-slate-500">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatDuration(s.duration)} ·{' '}
              {s.stops === 0 ? 'Direct' : s.stops === 1 ? '1 stop' : `${s.stops} stops`}
            </span>
            <span className="font-semibold">{formatTime(s.arriving_at)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              {s.origin_iata}
              {s.origin_city && ` · ${s.origin_city}`} · {ownerName}
            </span>
            <span>
              {s.destination_iata}
              {s.destination_city && ` · ${s.destination_city}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(iso?: string) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ?? '0';
  const min = m[2] ?? '0';
  return `${h}h ${min}m`;
}

function parseDuration(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0');
}
