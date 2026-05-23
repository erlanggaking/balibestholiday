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
  Sparkles,
  Wand2,
  CreditCard,
  Globe,
  BookOpen,
  KeyRound,
} from 'lucide-react';

export const metadata = { title: 'User Manual · Admin' };

export default function AdminManualPage() {
  return (
    <div className="mx-auto max-w-4xl px-2 pb-16">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
          <BookOpen className="h-4 w-4" />
          Panduan Penggunaan
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 md:text-4xl">
          User Manual — Bali Best Holiday
        </h1>
        <p className="mt-2 text-slate-600">
          Panduan lengkap mengelola website OTA Bali Best Holiday. Halaman ini hanya bisa diakses
          admin. Cetak/save sebagai bookmark untuk akses cepat.
        </p>
      </header>

      {/* TOC */}
      <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daftar isi
        </h2>
        <ol className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
          {[
            ['#login', '1. Login & Akses Admin'],
            ['#dashboard', '2. Dashboard'],
            ['#bookings', '3. Mengelola Booking'],
            ['#users', '4. Mengelola User'],
            ['#catalog', '5. Mengelola Katalog'],
            ['#tours', '5a. Paket Wisata (Tours)'],
            ['#hotels', '5b. Hotel'],
            ['#cars', '5c. Sewa Mobil'],
            ['#activities', '5d. Aktivitas'],
            ['#buses', '5e. Bus Travel'],
            ['#insurance', '5f. Asuransi'],
            ['#destinations', '5g. Destinasi'],
            ['#cms', '6. CMS, Banner, Blog & FAQ'],
            ['#promo', '7. Promo Code'],
            ['#flights', '8. Flights & Hotels (Duffel)'],
            ['#markup', '9. Markup Pricing'],
            ['#payments', '10. Pembayaran (Stripe)'],
            ['#currencies', '11. Mata Uang & Bahasa'],
            ['#settings', '12. Settings'],
            ['#troubleshoot', '13. Troubleshoot'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-brand-700 hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="login" icon={<KeyRound className="h-5 w-5" />} title="1. Login & Akses Admin">
        <p>
          Admin panel hanya bisa diakses oleh user dengan role <Code>ADMIN</Code>. Login lewat
          halaman publik <Code>/auth/signin</Code> dengan email & password admin yang sudah dibuat.
        </p>
        <ol>
          <li>Buka <Code>https://balibestholiday.com</Code> dan klik <strong>Masuk</strong> di kanan atas.</li>
          <li>Masukkan email & password admin.</li>
          <li>Setelah login berhasil, akses admin panel di <Code>/admin</Code>.</li>
        </ol>
        <Tip>
          <strong>Lupa password?</strong> Reset langsung di database (kolom <Code>User.password</Code>{' '}
          adalah hash bcrypt). Atau jalankan <Code>npm run reset-admin</Code> di server (akan
          ditambahkan kemudian).
        </Tip>
      </Section>

      <Section id="dashboard" icon={<LayoutDashboard className="h-5 w-5" />} title="2. Dashboard">
        <p>
          Halaman pertama saat login. Menampilkan:
        </p>
        <ul>
          <li><strong>Total revenue</strong> bulan berjalan dan all-time</li>
          <li><strong>Bookings count</strong> per status (PENDING, CONFIRMED, PAID, CANCELLED, COMPLETED)</li>
          <li><strong>Latest bookings</strong> 10 terbaru dengan link cepat ke detail</li>
          <li><strong>Top tours/hotels</strong> by revenue</li>
        </ul>
        <p>
          Gunakan dashboard untuk monitor harian. Klik chart/table untuk drill down ke laporan
          detail.
        </p>
      </Section>

      <Section id="bookings" icon={<Calendar className="h-5 w-5" />} title="3. Mengelola Booking">
        <p>Menu <strong>Operations → Bookings</strong>.</p>
        <h3>Lifecycle status booking</h3>
        <ul>
          <li><Status color="amber">PENDING</Status> — booking dibuat, belum bayar</li>
          <li><Status color="emerald">PAID</Status> — Stripe webhook sudah konfirmasi pembayaran</li>
          <li><Status color="blue">CONFIRMED</Status> — admin sudah konfirmasi vendor (manual)</li>
          <li><Status color="slate">COMPLETED</Status> — perjalanan/check-in selesai</li>
          <li><Status color="rose">CANCELLED</Status> — dibatalkan customer atau admin</li>
        </ul>
        <h3>Aksi yang bisa dilakukan</h3>
        <ol>
          <li>Klik baris booking → buka detail</li>
          <li>Lihat data customer, items, total, payment status</li>
          <li>Update status booking (mis. PENDING → CONFIRMED setelah konfirmasi vendor)</li>
          <li>Tambah catatan internal (notes) untuk komunikasi tim</li>
          <li>Trigger refund (kalau status PAID) — refund Stripe diproses otomatis via API</li>
        </ol>
        <Tip>
          <strong>Search:</strong> kotak search bar atas mendukung pencarian by booking code,
          email customer, atau nama. Filter by status di sidebar kanan.
        </Tip>
      </Section>

      <Section id="users" icon={<Users className="h-5 w-5" />} title="4. Mengelola User">
        <p>Menu <strong>Operations → Users</strong>.</p>
        <h3>Roles</h3>
        <ul>
          <li><strong>USER</strong> — customer biasa, bisa pesan & lihat booking sendiri</li>
          <li><strong>ADMIN</strong> — full access ke admin panel</li>
        </ul>
        <h3>Aksi</h3>
        <ol>
          <li>Lihat daftar semua user yang pernah register/order (termasuk guest checkout)</li>
          <li>Klik baris user → lihat profile, history booking, total spending</li>
          <li>Ubah role USER → ADMIN (atau sebaliknya) lewat tombol <Code>Change role</Code></li>
          <li>Suspend user (set <Code>isActive=false</Code>) untuk blokir akses tanpa hapus data</li>
        </ol>
        <Tip>
          Sebelum hapus user, pastikan tidak ada booking aktif. Sistem akan menolak hapus
          dengan referensi.
        </Tip>
      </Section>

      <Section id="catalog" icon={<MapPin className="h-5 w-5" />} title="5. Mengelola Katalog">
        <p>
          Katalog terdiri dari produk-produk yang dijual di website. Setiap produk punya halaman
          CRUD sendiri di sidebar grup <strong>Catalog</strong>.
        </p>
        <p>
          Workflow umum semua produk:
        </p>
        <ol>
          <li>Klik <strong>+ New</strong> di pojok kanan atas list page</li>
          <li>Isi form (judul, deskripsi, harga, foto, dll)</li>
          <li>Klik <strong>Save</strong> — produk langsung muncul di publik kalau toggle <Code>isActive</Code> ON</li>
          <li>Edit kapan aja dengan klik baris di list</li>
        </ol>
      </Section>

      <Section id="tours" icon={<MapPin className="h-5 w-5" />} title="5a. Paket Wisata (Tours)">
        <p>Menu <strong>Catalog → Packages</strong>.</p>
        <h3>Field penting</h3>
        <ul>
          <li><strong>Title & slug</strong> — judul + URL friendly (auto-generate dari title)</li>
          <li><strong>Destination</strong> — pilih dari list destinasi yang sudah dibuat</li>
          <li><strong>Category</strong> — Adventure / Cultural / Nature / Luxury / Family</li>
          <li><strong>Duration</strong> — dalam hari (untuk multi-day) atau jam (single day)</li>
          <li><strong>Base price (USD)</strong> — harga per orang, currency conversion otomatis</li>
          <li><strong>Child price</strong> — opsional, kalau berbeda dengan adult</li>
          <li><strong>Max group size</strong> — kapasitas per departure</li>
          <li><strong>Highlights</strong> — list bullet point hal menarik</li>
          <li><strong>Included / Excluded</strong> — list yang termasuk dan tidak termasuk paket</li>
          <li><strong>Images</strong> — upload multiple, urutan diatur drag</li>
          <li><strong>isFeatured</strong> — kalau ON, muncul di homepage section "Featured Tours"</li>
          <li><strong>isActive</strong> — kalau OFF, hidden dari publik</li>
        </ul>
        <h3>Multi-language</h3>
        <p>
          Setelah save tour, klik tab <strong>Translations</strong> untuk isi terjemahan title,
          description, highlights di 19 bahasa lain. Kalau kosong, akan fallback ke EN.
        </p>
      </Section>

      <Section id="hotels" icon={<Building2 className="h-5 w-5" />} title="5b. Hotel">
        <p>Menu <strong>Catalog → Hotels</strong>.</p>
        <p>
          Hotel bersifat <strong>local catalog</strong> — yang muncul di homepage & listing
          adalah hotel yang lu input manual di admin. Untuk pencarian hotel real-time pakai
          API Duffel, lihat section <a href="#flights" className="text-brand-700 underline">Flights & Hotels (Duffel)</a>.
        </p>
        <h3>Field</h3>
        <ul>
          <li>Nama hotel, slug, deskripsi</li>
          <li>Star rating (1-5), review rating, review count</li>
          <li>Destination & alamat lengkap</li>
          <li>Base price per malam (USD)</li>
          <li>Amenities (WiFi, pool, breakfast, dll)</li>
          <li>Multiple room types dengan harga & kapasitas</li>
          <li>Foto-foto + virtual tour link (opsional)</li>
        </ul>
      </Section>

      <Section id="cars" icon={<Car className="h-5 w-5" />} title="5c. Sewa Mobil">
        <p>Menu <strong>Catalog → Cars</strong>.</p>
        <h3>Field</h3>
        <ul>
          <li>Nama (e.g. "Toyota Avanza 2023"), slug</li>
          <li>Category — Economy / Compact / SUV / Van / Luxury / Scooter</li>
          <li>Year, seats, luggage capacity, transmission, fuel type</li>
          <li>Daily price (USD)</li>
          <li>With driver toggle — kalau ON, harga sudah include driver</li>
          <li>Pickup locations — list lokasi yang tersedia</li>
          <li>Features list (AC, GPS, child seat, dll)</li>
        </ul>
      </Section>

      <Section id="activities" icon={<Sparkles className="h-5 w-5" />} title="5d. Aktivitas">
        <p>Menu <strong>Catalog → Activities</strong>.</p>
        <p>
          Aktivitas single-instance (bukan paket multi-hari). Contoh: surfing lesson, cooking
          class, snorkeling trip, spa session.
        </p>
        <h3>Beda dengan Tour</h3>
        <ul>
          <li>Tour = paket lengkap dengan transport & guide, biasanya multi-stop</li>
          <li>Activity = pengalaman tunggal, datang sendiri ke lokasi</li>
        </ul>
      </Section>

      <Section id="buses" icon={<Bus className="h-5 w-5" />} title="5e. Bus Travel">
        <p>Menu <strong>Catalog → Bus Travel</strong>.</p>
        <p>
          Setup bus operator + rute. Satu operator bisa punya banyak rute (e.g. Perama: Kuta→Ubud,
          Kuta→Lovina, dll).
        </p>
        <h3>Workflow</h3>
        <ol>
          <li>Buat <strong>Bus Operator</strong> dulu (Perama, Kura-Kura, dll)</li>
          <li>Klik operator → tab <strong>Routes</strong></li>
          <li>Add route: origin, destination, departure time, duration, price, capacity</li>
          <li>Aktifkan toggle untuk membuat rute live</li>
        </ol>
      </Section>

      <Section id="insurance" icon={<ShieldCheck className="h-5 w-5" />} title="5f. Asuransi">
        <p>Menu <strong>Catalog → Insurance</strong>.</p>
        <p>
          Plan asuransi perjalanan yang bisa di-add saat checkout sebagai add-on. Field:
        </p>
        <ul>
          <li>Plan name (Basic / Standard / Premium)</li>
          <li>Coverage details (medical, baggage, cancellation, dll)</li>
          <li>Daily price atau flat trip price</li>
          <li>Provider name (mis. Allianz, AXA)</li>
        </ul>
      </Section>

      <Section id="destinations" icon={<MapPin className="h-5 w-5" />} title="5g. Destinasi">
        <p>Menu <strong>Catalog → Destinations</strong>.</p>
        <p>
          Destinasi adalah lokasi (Ubud, Kuta, Seminyak, dll) yang dipakai sebagai filter di Tour
          dan Hotel. Setiap destinasi punya halaman publik di <Code>/destinations/&#123;slug&#125;</Code>.
        </p>
        <h3>Field</h3>
        <ul>
          <li>Name, slug, country (default Indonesia), region (Bali)</li>
          <li>Hero image — muncul di banner halaman destinasi</li>
          <li>Description — paragraf intro</li>
          <li><strong>isFeatured</strong> — kalau ON, muncul di section "Top destinations" homepage</li>
        </ul>
      </Section>

      <Section id="cms" icon={<FileText className="h-5 w-5" />} title="6. CMS, Banner, Blog & FAQ">
        <h3>CMS Pages</h3>
        <p>
          Halaman statis seperti <Code>/pages/about</Code>, <Code>/pages/contact</Code>,{' '}
          <Code>/pages/terms</Code>, <Code>/pages/privacy</Code>, <Code>/pages/cancellation</Code>.
          Editor pakai rich-text WYSIWYG. Toggle <Code>isPublished</Code> untuk publish/draft.
        </p>
        <Tip>
          Kalau row CMS belum dibuat, sistem otomatis pakai konten default bawaan agar footer
          tidak 404. Kamu bisa override dengan create row baru.
        </Tip>

        <h3>Banners</h3>
        <p>
          Banner promosi yang muncul di hero homepage. Set image, link target, schedule (start/end
          date), dan urutan. Multiple banner akan di-rotate sebagai carousel.
        </p>

        <h3>Blog Posts</h3>
        <p>
          Artikel travel guide, news, tips. Field: title, slug, cover image, excerpt, body
          (rich-text), author, category, publish date.
        </p>

        <h3>FAQ</h3>
        <p>
          Pertanyaan & jawaban yang muncul di halaman <Code>/faq</Code>. Field: question, answer,
          category, sort order. Kalau belum ada FAQ ter-publish, sistem pakai 7 default FAQ
          bawaan.
        </p>
      </Section>

      <Section id="promo" icon={<Tag className="h-5 w-5" />} title="7. Promo Code">
        <p>Menu <strong>CMS & Marketing → Promo Codes</strong>.</p>
        <h3>Tipe diskon</h3>
        <ul>
          <li><strong>PERCENTAGE</strong> — % off dari subtotal (mis. 10% off, max IDR 100k)</li>
          <li><strong>FIXED</strong> — potongan tetap (mis. USD 25 off)</li>
        </ul>
        <h3>Constraint</h3>
        <ul>
          <li>Min order amount</li>
          <li>Max discount cap (untuk percentage)</li>
          <li>Max usage total & per-user</li>
          <li>Valid date range</li>
          <li>Restrict to product types (TOUR / HOTEL / dll)</li>
        </ul>
        <p>
          Customer apply code di halaman checkout sebelum Pay. Kalau valid, total ter-update
          otomatis sebelum kirim ke Stripe.
        </p>
      </Section>

      <Section id="flights" icon={<Plane className="h-5 w-5" />} title="8. Flights & Hotels (Duffel)">
        <p>
          Untuk <strong>flight search real-time</strong> dan <strong>hotel inventory global</strong>{' '}
          (di luar local catalog), kami pakai API <strong>Duffel</strong>.
        </p>
        <h3>Status saat ini</h3>
        <ul>
          <li><strong>Flights:</strong> aktif (sandbox token), 1200+ hasil per search</li>
          <li><strong>Stays/Hotels:</strong> butuh Duffel approval terpisah, kalau belum aktif tampilkan banner info</li>
        </ul>
        <h3>Cara kerja flight booking</h3>
        <ol>
          <li>Customer search di homepage atau <Code>/flights</Code></li>
          <li>API panggil Duffel, return offers real-time</li>
          <li>Customer pilih offer, klik <strong>Select</strong></li>
          <li>Halaman checkout: isi pax details (name, DOB, passport)</li>
          <li>Bayar lewat Stripe — booking dibuat di DB + Duffel order created</li>
          <li>E-ticket muncul di account customer & email</li>
        </ol>
        <h3>Go-live Duffel</h3>
        <p>
          Sandbox sekarang <strong>tidak issue tiket asli</strong>. Untuk production:
        </p>
        <ol>
          <li>Verifikasi business account di Duffel (KYB lewat Stripe)</li>
          <li>Top up Duffel balance atau enable card-as-payment</li>
          <li>Switch <Code>DUFFEL_ACCESS_TOKEN</Code> dari <Code>duffel_test_*</Code> ke <Code>duffel_live_*</Code></li>
          <li>Restart container</li>
        </ol>
      </Section>

      <Section id="markup" icon={<DollarSign className="h-5 w-5" />} title="9. Markup Pricing">
        <p>Menu <strong>System → Markup (Duffel)</strong>.</p>
        <p>
          Set markup % atas harga Duffel sebagai profit margin. Markup di-apply otomatis di server
          sebelum harga ditampilkan ke customer.
        </p>
        <h3>Markup per produk</h3>
        <ul>
          <li>Flight markup (%)</li>
          <li>Hotel markup (%)</li>
        </ul>
        <Tip>
          <strong>Best practice:</strong> mulai dari 5-10% untuk competitive pricing. Markup di-stack
          di atas harga Duffel, tidak terlihat oleh customer (mereka cuma lihat harga akhir).
        </Tip>
      </Section>

      <Section id="payments" icon={<CreditCard className="h-5 w-5" />} title="10. Pembayaran (Stripe)">
        <p>
          Semua transaksi di-handle Stripe Checkout. Kode siap, tinggal config 3 environment vars
          di server: <Code>STRIPE_SECRET_KEY</Code>, <Code>STRIPE_PUBLISHABLE_KEY</Code>,{' '}
          <Code>STRIPE_WEBHOOK_SECRET</Code>.
        </p>
        <h3>Flow</h3>
        <ol>
          <li>Customer klik Pay → API <Code>/api/checkout</Code> bikin booking PENDING</li>
          <li>Buat Stripe Checkout Session, redirect customer ke <Code>checkout.stripe.com</Code></li>
          <li>Customer bayar dengan card/Google Pay/Apple Pay</li>
          <li>Stripe kirim webhook ke <Code>/api/stripe/webhook</Code></li>
          <li>Server update booking status → PAID, bikin record di tabel Payment</li>
          <li>Customer di-redirect ke <Code>/checkout/success</Code></li>
        </ol>
        <h3>Test mode</h3>
        <p>
          Saat ini pakai test keys. Card test: <Code>4242 4242 4242 4242</Code>, exp <Code>12/34</Code>,
          CVC <Code>123</Code>. Tidak ada potongan duit beneran.
        </p>
        <h3>Refund</h3>
        <p>
          Buka detail booking → klik <strong>Process refund</strong>. Refund full atau partial.
          Stripe akan return uang ke kartu customer dalam 5-10 hari kerja.
        </p>
      </Section>

      <Section id="currencies" icon={<Globe className="h-5 w-5" />} title="11. Mata Uang & Bahasa">
        <h3>20 Bahasa support</h3>
        <p>
          EN, ID, ZH, JA, KO, AR, RU, FR, DE, ES, PT, IT, NL, TR, HI, TH, VI, MS, PL, FA. UI
          terjemahan ada di <Code>src/messages/&#123;locale&#125;.json</Code>. Konten produk di-translate via
          tab Translations di setiap form CRUD.
        </p>

        <h3>20 Currency support</h3>
        <p>
          USD, EUR, IDR, JPY, GBP, AUD, SGD, CNY, KRW, HKD, INR, THB, MYR, PHP, VND, CAD, CHF,
          AED, SAR, RUB. Semua harga di-store dalam USD; conversion otomatis pakai exchange rate
          (refresh setiap 6 jam dari open API).
        </p>
        <p>
          Default display currency = IDR. Customer bisa switch lewat selector di header. Pilihan
          tersimpan di cookie selama 30 hari.
        </p>
      </Section>

      <Section id="settings" icon={<Settings className="h-5 w-5" />} title="12. Settings">
        <p>Menu <strong>System → Settings</strong>.</p>
        <ul>
          <li>Site name, logo, favicon</li>
          <li>Contact info (email, phone, address) — muncul di footer</li>
          <li>Social media links</li>
          <li>Default currency & language</li>
          <li>SEO meta tags global</li>
          <li>Email templates (booking confirmation, refund, dll)</li>
          <li>SMTP credentials untuk transactional email</li>
        </ul>
      </Section>

      <Section id="troubleshoot" icon={<Star className="h-5 w-5" />} title="13. Troubleshoot">
        <h3>Pertanyaan umum</h3>
        <Faq q="Foto tidak ke-upload?">
          Cek ukuran file (max 5MB), format (JPG/PNG/WebP), dan koneksi. Image disimpan di volume
          Docker <Code>/app/public/uploads</Code> di server.
        </Faq>
        <Faq q="Customer bilang harga di-display tidak match dengan invoice email?">
          Kemungkinan exchange rate berubah antara saat browsing dan saat checkout. Email selalu
          pakai harga final di moment payment confirmed (yang sama dengan yang dicharge Stripe).
        </Faq>
        <Faq q="Booking stuck di PENDING padahal customer bilang sudah bayar?">
          Webhook Stripe gagal sampai. Cek di Stripe Dashboard → Developers → Webhooks → klik
          endpoint kita → tab Recent deliveries. Klik failed event → Retry. Atau force-update
          status manual via admin booking detail.
        </Faq>
        <Faq q="Search flight return error 'Couldn\'t fetch flights'?">
          Cek <Code>DUFFEL_ACCESS_TOKEN</Code> di .env masih valid. Sandbox token kadang
          rate-limited, tunggu 1 menit dan coba lagi.
        </Faq>
        <Faq q="Translation tidak muncul di bahasa tertentu?">
          Sistem fallback ke EN kalau translasi kosong. Buka tab Translations di form produk dan
          isi field yang kosong.
        </Faq>

        <h3>Kontak teknis</h3>
        <p>
          Bug report atau request fitur: kirim email ke{' '}
          <a href="mailto:dev@balibestholiday.com" className="text-brand-700 underline">
            dev@balibestholiday.com
          </a>
          {' '}atau buka issue di repo internal.
        </p>
      </Section>
    </div>
  );
}

/* ----------------------- helpers ----------------------- */

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </span>
        {title}
      </h2>
      <div className="prose prose-sm max-w-none text-slate-700 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-brand-700 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800">
      {children}
    </code>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      💡 {children}
    </div>
  );
}

function Status({
  color,
  children,
}: {
  color: 'amber' | 'emerald' | 'blue' | 'slate' | 'rose';
  children: React.ReactNode;
}) {
  const cls: Record<typeof color, string> = {
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    slate: 'bg-slate-200 text-slate-800',
    rose: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-xs ${cls[color]}`}>
      {children}
    </span>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group my-2 rounded-lg border border-slate-200 bg-white p-3 open:bg-slate-50">
      <summary className="cursor-pointer list-none font-semibold text-slate-900">
        <span className="mr-2 text-brand-600 group-open:rotate-90 inline-block transition">▸</span>
        {q}
      </summary>
      <div className="mt-2 pl-6 text-sm text-slate-600">{children}</div>
    </details>
  );
}
