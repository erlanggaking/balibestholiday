import { prisma } from '@/lib/prisma';
import { CustomPackageBuilder } from '@/components/custom-package-builder';
import { Wand2 } from 'lucide-react';

export const revalidate = 600;
export const metadata = {
  title: 'Build Your Custom Bali Package · Bali Best Holiday',
  description: 'Pick destinations, choose activities, get a tailored quote.',
};

export default async function CustomPackagePage() {
  const [destinations, activities] = await Promise.all([
    prisma.destination.findMany({ where: {}, orderBy: { name: 'asc' }, select: { id: true, name: true, imageUrl: true, region: true } }).catch(() => []),
    prisma.activity.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } },
      take: 30,
    }).catch(() => []),
  ]);

  return (
    <div className="bg-gradient-to-b from-brand-50 via-white to-sunset-50/30 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sunset-100 px-4 py-1.5 text-xs font-semibold text-sunset-700">
            <Wand2 className="h-3.5 w-3.5" /> Tailor-made for you
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Build Your Bali Package</h1>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Tell us when you&apos;re traveling and what you love. Our team will hand-craft
            a perfect itinerary and send a quote within 24 hours.
          </p>
        </header>

        <CustomPackageBuilder
          destinations={destinations as any}
          activities={activities.map((a) => ({ ...a, image: a.images[0]?.url ?? null })) as any}
        />
      </div>
    </div>
  );
}
