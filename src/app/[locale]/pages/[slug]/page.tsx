import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Public CMS page renderer: /pages/{slug}
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page
    .findUnique({ where: { slug }, select: { title: true } })
    .catch(() => null);
  return { title: page?.title ?? 'Page' };
}

export default async function CmsPublicPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.page
    .findUnique({ where: { slug, isPublished: true } as any })
    .catch(() => null);
  if (!page || !page.isPublished) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">{page.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated {page.updatedAt.toLocaleDateString()}
        </p>
      </header>
      <div
        className="prose prose-lg max-w-none [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-brand-400 [&_blockquote]:bg-brand-50/30 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:my-3 [&_img]:rounded-lg [&_img]:my-4"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </article>
  );
}
