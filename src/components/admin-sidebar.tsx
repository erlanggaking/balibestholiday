'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Building2,
  Car,
  Plane,
  Bus,
  ShieldCheck,
  Users,
  Tag,
  FileText,
  Settings,
  DollarSign,
  Star,
  ImageIcon,
  ChevronRight,
  Sparkles,
  Wand2,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
      { href: '/admin/custom-requests', label: 'Custom Requests', icon: Wand2 },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/tours', label: 'Packages', icon: MapPin },
      { href: '/admin/activities', label: 'Activities', icon: Sparkles },
      { href: '/admin/hotels', label: 'Hotels', icon: Building2 },
      { href: '/admin/cars', label: 'Cars', icon: Car },
      { href: '/admin/buses', label: 'Bus Travel', icon: Bus },
      { href: '/admin/flights', label: 'Flights (local)', icon: Plane },
      { href: '/admin/insurance', label: 'Insurance', icon: ShieldCheck },
      { href: '/admin/destinations', label: 'Destinations', icon: MapPin },
    ],
  },
  {
    label: 'CMS & Marketing',
    items: [
      { href: '/admin/cms', label: 'CMS Pages', icon: FileText },
      { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
      { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
      { href: '/admin/faq', label: 'FAQ', icon: FileText },
      { href: '/admin/promo', label: 'Promo Codes', icon: Tag },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/markup', label: 'Markup (Duffel)', icon: DollarSign },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  // Strip locale prefix for active matching: /en/admin/bookings -> /admin/bookings
  const stripped = pathname.replace(/^\/[a-z]{2}/, '');

  const isActive = (href: string) => {
    if (href === '/admin') return stripped === '/admin' || stripped === '/admin/';
    return stripped.startsWith(href);
  };

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="sticky top-0 h-screen overflow-y-auto py-6">
        <div className="px-5 pb-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-ocean-500" />
            <div>
              <p className="font-display text-sm font-bold leading-tight">Bali Best</p>
              <p className="text-xs text-slate-500">Admin panel</p>
            </div>
          </Link>
        </div>

        <nav className="space-y-6 px-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as any}
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition ${
                          active
                            ? 'bg-brand-50 font-semibold text-brand-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-500'}`} />
                          {item.label}
                        </span>
                        {active && <ChevronRight className="h-3.5 w-3.5" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 border-t border-slate-200 px-5 pt-4">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </aside>
  );
}
