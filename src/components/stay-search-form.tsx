'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, MapPin, Users, Search, BedDouble } from 'lucide-react';
import { PlaceAutocomplete, type Place } from './place-autocomplete';

interface Props {
  initial?: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    rooms?: number;
    adults?: number;
    children?: number;
  };
}

export function StaySearchForm({ initial }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState<Place | null>(null);
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? defaultDate(7));
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? defaultDate(10));
  const [rooms, setRooms] = useState(initial?.rooms ?? 1);
  const [adults, setAdults] = useState(initial?.adults ?? 2);
  const [children, setChildren] = useState(initial?.children ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location?.iata_code) return;
    const params = new URLSearchParams({
      location: location.iata_code,
      lat: String((location as any).latitude ?? ''),
      lng: String((location as any).longitude ?? ''),
      name: location.city_name ?? location.name,
      checkIn,
      checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    });
    router.push(`/stays/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <PlaceAutocomplete
            value={location}
            onChange={setLocation}
            label="Where to?"
            placeholder="City or destination"
            endpoint="/api/duffel/places"
            icon={<MapPin className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Check-in</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              required
              value={checkIn}
              min={today()}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Check-out</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              required
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stepper label="Rooms" icon={<BedDouble className="h-4 w-4 text-slate-400" />} value={rooms} min={1} max={6} onChange={setRooms} />
        <Stepper label="Adults" icon={<Users className="h-4 w-4 text-slate-400" />} value={adults} min={1} max={12} onChange={setAdults} />
        <Stepper label="Children" icon={<Users className="h-4 w-4 text-slate-400" />} value={children} min={0} max={6} onChange={setChildren} />
        <button
          type="submit"
          disabled={!location}
          className="flex h-[46px] items-center justify-center gap-2 self-end rounded-xl bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" /> Search Stays
        </button>
      </div>
    </form>
  );
}

function Stepper({
  label,
  icon,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        {icon}
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
