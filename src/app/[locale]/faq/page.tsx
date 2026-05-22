import { prisma } from '@/lib/prisma';
import { ChevronDown } from 'lucide-react';

export const revalidate = 600;

const DEFAULT_FAQS: { q: string; a: string }[] = [
  { q: 'How do I book a tour or hotel?', a: 'Browse the catalog, pick a tour, hotel or flight, then click Book Now and complete checkout. You will receive an email confirmation immediately and your booking is also stored in your account.' },
  { q: 'Can I cancel or change a booking?', a: 'Yes — most tours and hotels can be cancelled free of charge up to 24 hours before the start date. Flights follow the airline\'s individual fare rules; cancellation eligibility is shown before checkout.' },
  { q: 'What currencies do you accept?', a: 'We support 20 currencies including USD, EUR, IDR, AUD, SGD, JPY, KRW, CNY, GBP, INR and more. Switch currency from the top-right of every page; prices update instantly.' },
  { q: 'Is my payment secure?', a: 'All payments are processed through Stripe with end-to-end encryption. We never store your card details on our servers.' },
  { q: 'Do you offer custom packages?', a: 'Yes. Use the Custom Package builder to combine flights, hotels, tours and transport into a single itinerary. We will reply within 24 hours with a personalised quote.' },
  { q: 'How does multi-language support work?', a: 'The site automatically detects your browser language and displays content in your preferred locale across 20 languages. You can switch any time using the language selector in the header.' },
  { q: 'How do I contact support?', a: 'Reach us 24/7 through the contact form, by email at hello@balibestholiday.com, or via WhatsApp. Average response time is under 30 minutes during business hours.' },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const dbFaqs = await prisma.faq
    .findMany({
      where: { isPublished: true } as any,
      include: { translations: true },
      orderBy: { sortOrder: 'asc' } as any,
    })
    .catch(() => [] as any[]);

  const items = dbFaqs.length
    ? dbFaqs.map((f: any) => {
        const tr = f.translations.find((x: any) => x.languageCode === locale);
        return { q: tr?.question ?? f.question, a: tr?.answer ?? f.answer };
      })
    : DEFAULT_FAQS;

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">FAQ</h1>
          <p className="mt-2 text-slate-600">
            Common questions about bookings, payment and travel with Bali Best Holiday.
          </p>
        </header>

        <div className="space-y-3">
          {items.map((it: { q: string; a: string }, i: number) => (
            <details
              key={i}
              className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900">
                <span>{it.q}</span>
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
