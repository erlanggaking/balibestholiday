import { prisma } from '@/lib/prisma';
import { BannerManager } from '@/components/admin/banner-manager';

export default async function AdminBannersPage() {
  const banners = await prisma.banner
    .findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] })
    .catch(() => []);

  return (
    <div className="px-4 py-8 md:px-8">
      <h1 className="mb-2 font-display text-2xl font-bold">Banners</h1>
      <p className="mb-6 text-sm text-slate-500">
        Hero banners shown on homepage and category pages.
      </p>
      <BannerManager initialBanners={banners as any} />
    </div>
  );
}
