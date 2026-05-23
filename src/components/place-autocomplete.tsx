'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane, MapPin, Loader2, Clock, TrendingUp } from 'lucide-react';

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
  /** localStorage key used to persist recent picks (default: bbh_recent_places) */
  recentKey?: string;
}

/**
 * Curated list of popular Indonesian + Southeast Asian airports shown when the
 * input is focused but empty (mirrors Traveloka's "popular destinations" UX).
 * Real-time results from /api/duffel/places replace this once the user types.
 */
const POPULAR_PLACES: Place[] = [
  { id: 'arp_cgk_id', iata_code: 'CGK', name: 'Soekarno-Hatta International Airport', city_name: 'Jakarta', iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_dps_id', iata_code: 'DPS', name: 'Ngurah Rai International Airport',     city_name: 'Denpasar',  iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_sub_id', iata_code: 'SUB', name: 'Juanda International Airport',          city_name: 'Surabaya',  iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_kno_id', iata_code: 'KNO', name: 'Kualanamu International Airport',       city_name: 'Medan',     iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_jog_id', iata_code: 'JOG', name: 'Adisucipto International Airport',      city_name: 'Yogyakarta', iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_upg_id', iata_code: 'UPG', name: 'Sultan Hasanuddin International',       city_name: 'Makassar',  iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_bdo_id', iata_code: 'BDO', name: 'Husein Sastranegara Airport',           city_name: 'Bandung',   iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_blr_id', iata_code: 'LOP', name: 'Lombok International Airport',          city_name: 'Lombok',    iata_country_code: 'ID', type: 'airport' },
  { id: 'arp_sin_sg', iata_code: 'SIN', name: 'Singapore Changi Airport',              city_name: 'Singapore', iata_country_code: 'SG', type: 'airport' },
  { id: 'arp_kul_my', iata_code: 'KUL', name: 'Kuala Lumpur International Airport',    city_name: 'Kuala Lumpur', iata_country_code: 'MY', type: 'airport' },
];

export function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  endpoint = '/api/duffel/places',
  icon,
  recentKey = 'bbh_recent_places',
}: Props) {
  const [query, setQuery] = useState(value ? formatPlace(value) : '');
  const [results, setResults] = useState<Place[]>([]);
  const [recents, setRecents] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load recents from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(recentKey);
      if (raw) {
        const parsed: Place[] = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecents(parsed.slice(0, 5));
      }
    } catch {
      /* ignore parse errors */
    }
  }, [recentKey]);

  // Click-outside closes dropdown
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Debounced server-side search
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
    // Persist to recents (dedupe + cap 5)
    try {
      const next = [p, ...recents.filter((r) => r.iata_code !== p.iata_code)].slice(0, 5);
      setRecents(next);
      localStorage.setItem(recentKey, JSON.stringify(next));
    } catch {
      /* localStorage may be unavailable */
    }
  };

  const isTyping = query.trim().length >= 2;
  const showSuggestions = open && !isTyping;
  const showResults = open && isTyping;

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon ?? <Plane className="h-4 w-4" />}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder={placeholder ?? 'City or airport'}
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
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

      {/* Suggestions panel: shown when input focused but empty */}
      {showSuggestions && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
          {recents.length > 0 && (
            <>
              <SectionHeader icon={<Clock className="h-3.5 w-3.5" />} title="Pencarian Terakhir" />
              {recents.map((p) => (
                <PlaceRow key={`r-${p.id}`} place={p} onSelect={select} accent="recent" />
              ))}
              <div className="my-1 border-t border-slate-100" />
            </>
          )}
          <SectionHeader icon={<TrendingUp className="h-3.5 w-3.5" />} title="Tujuan Populer" />
          {POPULAR_PLACES.map((p) => (
            <PlaceRow key={`p-${p.id}`} place={p} onSelect={select} accent="popular" />
          ))}
        </div>
      )}

      {/* Live API results: shown once user types ≥2 chars */}
      {showResults && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {results.map((p) => (
            <PlaceRow key={p.id} place={p} onSelect={select} highlight={query} />
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {icon}
      <span>{title}</span>
    </div>
  );
}

function PlaceRow({
  place,
  onSelect,
  highlight,
  accent,
}: {
  place: Place;
  onSelect: (p: Place) => void;
  highlight?: string;
  accent?: 'recent' | 'popular';
}) {
  const isAirport = place.type === 'airport';
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-brand-50"
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          accent === 'recent'
            ? 'bg-slate-100 text-slate-500'
            : isAirport
              ? 'bg-brand-100 text-brand-700'
              : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {isAirport ? <Plane className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate font-semibold text-slate-900">
            {highlight ? <Highlighted text={place.city_name ?? place.name} highlight={highlight} /> : place.city_name ?? place.name}
            {place.city_name && (
              <span className="ml-1 text-slate-400">({place.iata_code})</span>
            )}
          </div>
        </div>
        <div className="truncate text-xs text-slate-500">
          {place.name}
          {place.iata_country_code && ` · ${place.iata_country_code}`}
        </div>
      </span>
      <span className="shrink-0 self-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-slate-600">
        {place.iata_code}
      </span>
    </button>
  );
}

function Highlighted({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(highlight)})`, 'i');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark key={i} className="bg-yellow-100 px-0.5 text-slate-900">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatPlace(p: Place): string {
  return `${p.city_name ?? p.name} (${p.iata_code})`;
}
