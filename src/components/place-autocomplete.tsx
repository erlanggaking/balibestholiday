'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane, MapPin, Loader2 } from 'lucide-react';

export type Place = {
  id: string;
  iata_code: string;
  name: string;
  city_name: string | null;
  iata_country_code?: string;
  type: 'airport' | 'city';
};

interface Props {
  value: Place | null;
  onChange: (p: Place | null) => void;
  placeholder?: string;
  label?: string;
  endpoint?: string;
  icon?: React.ReactNode;
}

export function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  endpoint = '/api/duffel/places',
  icon,
}: Props) {
  const [query, setQuery] = useState(value ? formatPlace(value) : '');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, endpoint]);

  const select = (p: Place) => {
    onChange(p);
    setQuery(formatPlace(p));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon ?? <Plane className="h-4 w-4" />}
        </span>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder={placeholder ?? 'City or airport'}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-brand-50"
            >
              <span className="mt-0.5 text-slate-400">
                {p.type === 'airport' ? <Plane className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </span>
              <span className="flex-1 text-sm">
                <div className="font-medium text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">
                  {p.city_name && <span>{p.city_name} · </span>}
                  {p.iata_country_code} · {p.iata_code}
                </div>
              </span>
              {p.type === 'airport' && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                  {p.iata_code}
                </span>
              )}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

function formatPlace(p: Place): string {
  return `${p.city_name ?? p.name} (${p.iata_code})`;
}
