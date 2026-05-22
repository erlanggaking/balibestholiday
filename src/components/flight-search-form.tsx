'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Plane, Users, Search } from 'lucide-react';
import { PlaceAutocomplete, type Place } from './place-autocomplete';

interface Props {
  initial?: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    cabinClass?: string;
    tripType?: 'oneway' | 'roundtrip';
  };
  compact?: boolean;
}

export function FlightSearchForm({ initial, compact }: Props) {
  const router = useRouter();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>(initial?.tripType ?? 'roundtrip');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departureDate, setDepartureDate] = useState(initial?.departureDate ?? defaultDate(7));
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? defaultDate(10));
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const [cabinClass, setCabinClass] = useState(initial?.cabinClass ?? 'economy');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin?.iata_code || !destination?.iata_code) return;
    const params = new URLSearchParams({
      origin: origin.iata_code,
      destination: destination.iata_code,
      departureDate,
      adults: String(adults),
      children: String(children),
      cabinClass,
    });
    if (tripType === 'roundtrip') params.set('returnDate', returnDate);
    router.push(`/flights/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 ${compact ? '' : 'p-6'}`}
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTripType('roundtrip')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tripType === 'roundtrip'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Round trip
        </button>
        <button
          type="button"
          onClick={() => setTripType('oneway')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tripType === 'oneway'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          One way
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <PlaceAutocomplete
          value={origin}
          onChange={setOrigin}
          label="From"
          placeholder="Origin city or airport"
          icon={<Plane className="h-4 w-4 rotate-45" />}
        />
        <PlaceAutocomplete
          value={destination}
          onChange={setDestination}
          label="To"
          placeholder="Destination city or airport"
          icon={<Plane className="h-4 w-4 -rotate-45" />}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Departure</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              required
              value={departureDate}
              min={today()}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        {tripType === 'roundtrip' ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Return</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={returnDate}
                min={departureDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cabin</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <PassengerStepper label="Adults (12+)" value={adults} min={1} max={9} onChange={setAdults} />
        <PassengerStepper label="Children (2-11)" value={children} min={0} max={6} onChange={setChildren} />
        {tripType === 'roundtrip' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cabin</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={!origin || !destination}
          className="flex h-[46px] items-center justify-center gap-2 self-end rounded-xl bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-1 md:col-start-4"
        >
          <Search className="h-4 w-4" /> Search Flights
        </button>
      </div>
    </form>
  );
}

function PassengerStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <Users className="h-4 w-4 text-slate-400" />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => value > min && onChange(value - 1)}
            className="h-7 w-7 rounded-full border border-slate-200 hover:bg-slate-100"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">{value}</span>
          <button
            type="button"
            onClick={() => value < max && onChange(value + 1)}
            className="h-7 w-7 rounded-full border border-slate-200 hover:bg-slate-100"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
