import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import { Plus, FileText } from 'lucide-react';

const SUGGESTED_PAGES = [
  { slug: 'about', title: 'About Us' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'contact', title: 'Contact Us' },
  { slug: 'cancellation', title: 'Cancellation Policy' },
];

export default async function AdminCmsPagesIndex() {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } }).catch(() => []);
  const existingSlugs = new Set(pages.map((p) => p.slug));
  const missing = SUGGESTED_PAGES.filter((p) => !existingSlugs.has(p.slug));

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">CMS Pages</h1>
          <p className="text-sm text-slate-500">Static content pages (About, Terms, Privacy, etc.)</p>
        </div>
        <Link
          href="/admin/cms/new"
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New page
        </Link>
      </div>

      {missing.length > 0 && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-brand-700">Quick start</p>
          <p className="mb-2 text-sm text-slate-700">Create these recommended pages:</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <Link
                key={m.slug}
                href={`/admin/cms/new?slug=${m.slug}&title=${encodeURIComponent(m.title)}` as any}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              >
                + {m.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/admin/cms/${p.id}` as any}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {p.isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">/{p.slug}</p>
            <p className="mt-2 text-xs text-slate-500">
              Updated {p.updatedAt.toLocaleDateString()}
            </p>
          </Link>
        ))}
        {pages.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
            No pages yet. Use the suggestions above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
