import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { format } from 'date-fns';

export const metadata = { title: 'Blog' };

export default async function BlogPage() {
  const posts = await prisma.blogPost
    .findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' } })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Travel Blog</h1>
      <p className="mb-8 text-slate-600">Stories, tips & inspiration from Bali</p>

      {posts.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-500">
          No blog posts yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}` as any}
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              {p.coverImage && (
                <div className="relative aspect-[16/9]">
                  <Image src={p.coverImage} alt={p.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <p className="mb-1 text-xs text-slate-500">
                  {format(new Date(p.publishedAt), 'd MMM yyyy')}
                </p>
                <h2 className="mb-2 font-bold group-hover:text-brand-600">{p.title}</h2>
                <p className="line-clamp-2 text-sm text-slate-600">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
