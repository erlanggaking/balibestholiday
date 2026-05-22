import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Public CMS page renderer: /pages/{slug}
// Falls back to built-in default content for known slugs (about, contact, terms,
// privacy, cancellation) so footer links never 404 when the DB is empty.
export const revalidate = 60;

type Defaults = Record<string, { title: string; content: string }>;

const DEFAULTS: Defaults = {
  about: {
    title: 'About Bali Best Holiday',
    content: `
      <p>Bali Best Holiday is a full-service online travel agent built to make exploring
      Bali — and the rest of Indonesia and beyond — effortless. From curated tours and
      activities to hotels, flights, car rental and bespoke private packages, every booking
      is handled by our team of local specialists.</p>

      <h2>What we do</h2>
      <ul>
        <li>Real-time flight search across global carriers via Duffel</li>
        <li>Hand-picked tours, day trips and unique experiences</li>
        <li>Verified hotels and villas across every region of Bali</li>
        <li>Self-drive and chauffeur-driven car rental</li>
        <li>Private custom packages built around your itinerary</li>
      </ul>

      <h2>Why travelers choose us</h2>
      <ul>
        <li><strong>Best-price guarantee</strong> on every booking</li>
        <li><strong>24/7 support</strong> in 20 languages</li>
        <li><strong>Local vendors</strong> with verified reviews from real travelers</li>
        <li><strong>Secure payments</strong> via Stripe with full PCI compliance</li>
      </ul>

      <p>Have questions? <a href="/pages/contact">Get in touch</a> any time.</p>
    `,
  },
  contact: {
    title: 'Contact us',
    content: `
      <p>Our team is available 24/7 to help with bookings, modifications and travel advice.</p>

      <h2>Get in touch</h2>
      <ul>
        <li><strong>Email:</strong> hello@balibestholiday.com</li>
        <li><strong>Bookings:</strong> bookings@balibestholiday.com</li>
        <li><strong>WhatsApp:</strong> +62 811 0000 0000</li>
        <li><strong>Phone:</strong> +62 361 000 0000</li>
      </ul>

      <h2>Office</h2>
      <p>Jl. Pantai Kuta No. 1<br/>Kuta, Badung 80361<br/>Bali, Indonesia</p>

      <h2>Business hours</h2>
      <p>Customer support is available 24 hours a day, 7 days a week.<br/>
      Office hours (in-person): Mon–Sat, 09:00–18:00 WITA.</p>
    `,
  },
  terms: {
    title: 'Terms of service',
    content: `
      <p><em>Last updated: January 2026</em></p>

      <h2>1. Acceptance of terms</h2>
      <p>By using balibestholiday.com you agree to these terms in full. If you do not agree,
      please do not use the service.</p>

      <h2>2. Bookings</h2>
      <p>All bookings are subject to availability and confirmation. Prices shown include taxes
      and any applicable markups but exclude optional extras unless explicitly stated. A
      booking is only complete once payment is processed and a confirmation email has been
      sent.</p>

      <h2>3. Payment</h2>
      <p>Payments are processed by Stripe. We accept major credit and debit cards, plus local
      payment methods supported in your region. All charges are made in your selected
      currency at the prevailing exchange rate.</p>

      <h2>4. Cancellation and refunds</h2>
      <p>See our <a href="/pages/cancellation">cancellation policy</a> for details by product.
      Refunds are issued to the original payment method within 5–10 business days.</p>

      <h2>5. Liability</h2>
      <p>Bali Best Holiday acts as an intermediary between you and the operators (airlines,
      hotels, tour providers, etc.). We are not liable for service interruptions, weather,
      force majeure, or actions of third-party suppliers, but we will assist you with
      rebooking and refund claims wherever possible.</p>

      <h2>6. Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Indonesia. Any disputes will
      be resolved in the courts of Denpasar, Bali.</p>
    `,
  },
  privacy: {
    title: 'Privacy policy',
    content: `
      <p><em>Last updated: January 2026</em></p>

      <h2>What we collect</h2>
      <ul>
        <li>Account information (name, email, phone) when you register</li>
        <li>Booking details (passenger names, travel dates, preferences)</li>
        <li>Payment metadata (we do <strong>not</strong> store full card numbers — Stripe handles those)</li>
        <li>Usage data (pages visited, language, currency) via cookies</li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To process and confirm your bookings</li>
        <li>To send booking confirmations and travel reminders</li>
        <li>To improve the site and personalise your experience</li>
        <li>To comply with applicable laws and tax requirements</li>
      </ul>

      <h2>Sharing</h2>
      <p>We share booking data only with the operators required to fulfil your reservation
      (airlines, hotels, tour providers). We do not sell your personal data.</p>

      <h2>Your rights</h2>
      <p>You can request a copy of your data, correction of inaccuracies, or deletion at any
      time by emailing <a href="mailto:privacy@balibestholiday.com">privacy@balibestholiday.com</a>.</p>

      <h2>Cookies</h2>
      <p>We use cookies to remember your language, currency and login. You can disable them
      in your browser settings, though some features may not work correctly without them.</p>
    `,
  },
  cancellation: {
    title: 'Cancellation policy',
    content: `
      <p>Each product type has its own cancellation rules. Always check the specific terms
      shown at checkout before confirming your booking.</p>

      <h2>Tours and activities</h2>
      <ul>
        <li><strong>Free cancellation</strong> up to 24 hours before the start time — full refund</li>
        <li>Less than 24 hours: 50% refund</li>
        <li>No-show: no refund</li>
      </ul>

      <h2>Hotels</h2>
      <p>Most hotels allow free cancellation up to 48 hours before check-in. Non-refundable
      rates are clearly marked at booking and cannot be cancelled or modified.</p>

      <h2>Flights</h2>
      <p>Flight cancellations follow the individual airline fare rules, shown before
      checkout. Most economy fares are non-refundable but may be changeable for a fee.</p>

      <h2>Car rental</h2>
      <p>Free cancellation up to 24 hours before pickup. After that, the first day's rental
      is non-refundable.</p>

      <h2>Custom packages</h2>
      <p>Custom packages are quoted individually; the cancellation terms agreed at booking
      take precedence.</p>

      <h2>How to cancel</h2>
      <p>Sign in to your account, open the booking, and click <em>Cancel</em>. Or email
      <a href="mailto:bookings@balibestholiday.com">bookings@balibestholiday.com</a> with your
      booking reference.</p>
    `,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbPage = await prisma.page
    .findUnique({ where: { slug }, select: { title: true } })
    .catch(() => null);
  return { title: dbPage?.title ?? DEFAULTS[slug]?.title ?? 'Page' };
}

export default async function CmsPublicPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;

  const dbPage = await prisma.page
    .findUnique({ where: { slug, isPublished: true } as any })
    .catch(() => null);

  // Use DB page if published; otherwise fall back to built-in default for known slugs.
  let title: string;
  let content: string;
  let updatedAt: Date | null = null;

  if (dbPage && dbPage.isPublished) {
    title = dbPage.title;
    content = dbPage.content;
    updatedAt = dbPage.updatedAt;
  } else if (DEFAULTS[slug]) {
    title = DEFAULTS[slug].title;
    content = DEFAULTS[slug].content;
  } else {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">{title}</h1>
        {updatedAt && (
          <p className="mt-2 text-sm text-slate-500">
            Last updated {updatedAt.toLocaleDateString()}
          </p>
        )}
      </header>
      <div
        className="prose prose-lg max-w-none [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-brand-400 [&_blockquote]:bg-brand-50/30 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:my-3 [&_img]:rounded-lg [&_img]:my-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
