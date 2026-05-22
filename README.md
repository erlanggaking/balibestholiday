# 🌴 Bali Best Holiday

Online Travel Agent (OTA) super-app: **Tours · Hotels · Car Rentals · Flights · Travel Insurance**, with **20 international languages** and **20 currencies**.

Built with Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, NextAuth, Stripe, and Tailwind CSS.

---

## ✨ Features

| Domain | Highlights |
|--------|------------|
| **Tours** | Multi-vendor, schedule-based, child pricing, gallery, itinerary, reviews |
| **Hotels** | Star rating, rooms with daily inventory, amenities, geo coordinates |
| **Car Rental** | With/without driver, multiple categories (MPV, SUV, Scooter, Luxury) |
| **Flights** | Airlines, airports, schedule, cabin class, seats |
| **Insurance** | Multiple coverage tiers (Basic / Standard / Premium) |
| **i18n** | 20 languages with full UI translation + per-product translation tables |
| **Currency** | 20 currencies, live conversion display, base USD pricing |
| **Auth** | Email/password + Google + Facebook OAuth (NextAuth) with RBAC |
| **Roles** | `ADMIN`, `STAFF`, `VENDOR`, `CUSTOMER` |
| **Payments** | Stripe Checkout + webhook for booking status |
| **Admin** | Dashboard, stats, recent bookings, CRUD links |
| **CMS** | Blog, FAQ, Pages, Banners, Promo codes |
| **SEO** | Per-locale URLs, OpenGraph, sitemap-ready |
| **A11y** | Semantic HTML, keyboard nav, ARIA labels |
| **RTL** | Arabic, Persian fully supported |

### 🌐 Languages (20)

English · Indonesian · Chinese · Japanese · Korean · Arabic · Russian · French · German · Spanish · Portuguese · Italian · Dutch · Turkish · Hindi · Thai · Vietnamese · Malay · Polish · Persian

### 💱 Currencies (20)

USD · EUR · GBP · JPY · CNY · AUD · CAD · CHF · HKD · SGD · KRW · INR · IDR · THB · MYR · PHP · VND · AED · SAR · RUB

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### 2. Clone & install

```bash
cd balibestholiday
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bali_best_holiday?schema=public"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional — leave empty during local dev
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Set up the database

Make sure PostgreSQL is running, create the database:

```bash
createdb bali_best_holiday
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

Seed sample data:

```bash
npm run db:seed
```

This populates:
- 20 languages, 20 currencies
- 6 destinations, 4 categories
- 6 tours, 5 hotels (+rooms), 5 cars, 3 insurance plans, 4 flights
- Admin user — `admin@balibestholiday.com` / `admin12345`

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Test Stripe webhook (optional)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`.

---

## 🏗️ Project Structure

```
balibestholiday/
├── prisma/
│   ├── schema.prisma            # Full ERD (30+ models)
│   └── seed.ts                  # Sample data
├── src/
│   ├── app/
│   │   ├── [locale]/            # All locale-aware pages
│   │   │   ├── page.tsx         # Home
│   │   │   ├── tours/           # Tours listing & detail
│   │   │   ├── hotels/
│   │   │   ├── cars/
│   │   │   ├── flights/
│   │   │   ├── insurance/
│   │   │   ├── auth/            # Sign in / sign up
│   │   │   ├── account/         # User dashboard
│   │   │   ├── checkout/        # Success & detail
│   │   │   ├── admin/           # Admin dashboard
│   │   │   └── blog/
│   │   ├── api/
│   │   │   ├── auth/            # NextAuth + register
│   │   │   ├── checkout/        # Create booking + Stripe session
│   │   │   └── stripe/webhook/  # Payment events
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/              # Reusable UI
│   ├── i18n/                    # next-intl config + 20 locales
│   ├── lib/                     # prisma, auth, stripe, currencies, utils
│   ├── messages/                # 20 JSON translation files
│   ├── types/
│   └── middleware.ts            # locale routing
├── package.json
├── tailwind.config.ts
├── next.config.mjs
└── tsconfig.json
```

---

## 🧩 Key models (Prisma)

| Model | Purpose |
|-------|---------|
| `User` + `Account` + `Session` | NextAuth + custom RBAC |
| `Vendor` | Multi-vendor marketplace |
| `Language`, `Currency` | i18n & FX rates |
| `Destination`, `Category` | Taxonomy with translations |
| `Tour`, `Hotel`, `Room`, `Car`, `Flight`, `InsurancePlan` | Products |
| `*Translation` | Per-locale fields (title, description, highlights…) |
| `*Image`, `RoomInventory`, `TourSchedule` | Inventory & media |
| `Booking`, `BookingItem`, `Payment` | Cart → checkout → invoice |
| `Review`, `WishlistItem` | UGC |
| `Page`, `BlogPost`, `Faq`, `Banner`, `PromoCode`, `Setting` | CMS |
| `Airline`, `Airport` | Flight metadata |

All product entities use **USD as base currency** and convert at display time. Bookings store both `totalAmount` (USD) and `displayAmount` + `currency` snapshot.

---

## 🔐 Roles & Access

```ts
enum UserRole { ADMIN, STAFF, VENDOR, CUSTOMER }
```

- `ADMIN` — full backoffice
- `STAFF` — booking management & support
- `VENDOR` — manages own products
- `CUSTOMER` — book & review

Admin pages live under `/{locale}/admin/*` and check `session.user.role === 'ADMIN'`.

---

## 🧪 Common commands

```bash
npm run dev                # start dev server
npm run build              # production build
npm run start              # production server
npm run lint               # ESLint
npm run prisma:studio      # GUI for the database
npm run prisma:migrate     # apply schema migrations
npm run db:seed            # seed sample data
```

---

## 🌍 Adding a new language

1. Add ISO code to `src/i18n/config.ts` (`locales` + `languages` arrays).
2. Create `src/messages/<code>.json` (copy `en.json` and translate).
3. Re-run `npm run db:seed` to insert language row.

## 💱 Updating exchange rates

`src/lib/currencies.ts` holds approximate static rates as a fallback. To wire up live rates:

1. Get a free API key from [exchangeratesapi.io](https://exchangeratesapi.io) or similar.
2. Set `EXCHANGE_RATE_API_KEY` in `.env`.
3. Implement a cron route (e.g. Vercel Cron) at `/api/cron/refresh-rates` to update `Currency.rateToBase` daily.

---

## 🚢 Deployment

### Vercel (recommended)

1. Push to GitHub.
2. Import repo into Vercel.
3. Add environment variables (especially `DATABASE_URL`, `NEXTAUTH_SECRET`, OAuth & Stripe keys).
4. Add a Postgres add-on (Vercel Postgres / Supabase / Neon).
5. Add a build command: `prisma migrate deploy && next build` (already set in `package.json`).
6. Set `STRIPE_WEBHOOK_SECRET` from the Stripe dashboard webhook endpoint pointing to `https://yourdomain/api/stripe/webhook`.

---

## 📜 License

MIT — feel free to ship it and rebrand for any region.

Made with ❤ in Bali.
