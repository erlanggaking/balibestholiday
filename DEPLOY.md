# 🚀 Deploy Bali Best Holiday — Vercel + Supabase

Panduan langkah-by-langkah deploy ke production. Estimasi: **~25 menit**.

---

## 📋 Yang lu butuhkan sebelum mulai

- [ ] Akun **GitHub** (repo udah di-push ✅)
- [ ] Akun **Supabase** (free tier OK) — https://supabase.com
- [ ] Akun **Vercel** (free tier OK) — https://vercel.com
- [ ] Token **Duffel** (test atau production) — https://duffel.com/dashboard
- [ ] _(opsional)_ Stripe API keys + Google/Facebook OAuth

---

## 1️⃣ Bikin Database di Supabase

1. Login ke https://supabase.com → **New project**
2. Isi:
   - Name: `balibestholiday`
   - Database password: **catat password ini** — bakal dipakai di connection string
   - Region: **Singapore (Southeast Asia)** — paling deket Indo
3. Tunggu ~2 menit sampai project ready.
4. Buka **Project Settings → Database → Connection string** (atau **Connect** di header).
5. Lu butuh **2 connection string** berbeda:

   **DATABASE_URL** (Connection pooling, port 6543)
   - Pilih tab **Transaction** mode (atau **Connection pooling**)
   - Format: `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
   - **Tambahkan**: `?pgbouncer=true&connection_limit=1` di akhir
   - Final: `postgresql://postgres.xxxx:YOUR_PW@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

   **DIRECT_URL** (Direct connection, port 5432)
   - Pilih tab **Session** mode
   - Format: `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - Tanpa parameter tambahan

   > 💡 **Kenapa dua URL?** PgBouncer (port 6543) cepat tapi ga support prepared statements yang dibutuhkan Prisma Migrate. Jadi runtime pakai 6543, migration pakai 5432.

6. Simpan kedua URL ini sementara — bakal dipakai di step 3.

---

## 2️⃣ Setup Migration & Seed (sekali aja, dari laptop lu)

Karena kita switch dari SQLite ke Postgres, generate migration baseline:

```bash
# Set env sementara di shell
export DATABASE_URL="postgresql://postgres.xxxx:PW@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://postgres.xxxx:PW@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Bikin migration awal & apply ke Supabase
npx prisma migrate dev --name init

# Seed data master (20 bahasa, 20 mata uang, sample tours, admin user)
npm run db:seed
```

**Cek di Supabase Dashboard → Table Editor:** harus muncul semua tabel (User, Tour, Hotel, Booking, Language, Currency, dll).

> ✅ Admin login default setelah seed: `admin@balibestholiday.com` / `admin12345`. **Ganti password ini setelah deploy!**

Commit migration files:

```bash
git add prisma/migrations
git commit -m "Add initial Postgres migration"
git push
```

---

## 3️⃣ Deploy ke Vercel

### A. Import project

1. Login ke https://vercel.com → **Add New → Project**
2. **Import** repo `erlanggaking/balibestholiday`
3. Framework Preset otomatis ke-detect: **Next.js**
4. Root directory: `.`
5. Build & Output Settings: biarkan default (sudah dioverride via `vercel.json`)

### B. Environment Variables

Klik **Environment Variables** dan isi semua. Apply ke **Production, Preview, dan Development**:

| Key | Value | Required |
|---|---|---|
| `DATABASE_URL` | _Supabase pooled URL (port 6543, ?pgbouncer=true&connection_limit=1)_ | ✅ |
| `DIRECT_URL` | _Supabase direct URL (port 5432)_ | ✅ |
| `NEXTAUTH_URL` | `https://balibestholiday.vercel.app` _(ganti dengan domain final-mu)_ | ✅ |
| `NEXTAUTH_SECRET` | _Run `openssl rand -base64 32` di terminal_ | ✅ |
| `DUFFEL_ACCESS_TOKEN` | `duffel_test_...` atau `duffel_live_...` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | sama dengan `NEXTAUTH_URL` | ✅ |
| `NEXT_PUBLIC_SITE_NAME` | `Bali Best Holiday` | ✅ |
| `STRIPE_SECRET_KEY` | `sk_test_...` atau `sk_live_...` | opsional |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | opsional |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` atau `pk_live_...` | opsional |
| `GOOGLE_CLIENT_ID` / `_SECRET` | dari Google Cloud Console | opsional |
| `FACEBOOK_CLIENT_ID` / `_SECRET` | dari Facebook Developers | opsional |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_FROM` | SMTP credentials | opsional |

### C. Deploy

Klik **Deploy**. Tunggu build (~2-3 menit).

Build script (`vercel.json`) bakal jalankan:
1. `npm install` → install deps + auto `prisma generate` (postinstall)
2. `prisma migrate deploy` → apply migrations ke Supabase prod
3. `next build` → build Next.js

**Jika ada error**, biasanya karena:
- ❌ `DIRECT_URL` salah → migration gagal
- ❌ `?pgbouncer=true` lupa di `DATABASE_URL` → "prepared statement already exists"
- ❌ `NEXTAUTH_SECRET` kosong → NextAuth crash

---

## 4️⃣ Post-deploy checklist

- [ ] Buka domain Vercel-mu, cek homepage load 200 OK
- [ ] Test search flight: `/flights` → search route apa aja → harus return offers live dari Duffel
- [ ] Login admin: `/auth/signin` → `admin@balibestholiday.com` / `admin12345` → buka `/admin` dashboard
- [ ] **Ganti password admin** via signup user baru + manual update role di Supabase Table Editor (atau via `/admin/users`)
- [ ] Aktifkan **Custom Domain** di Vercel → Settings → Domains kalau lu udah punya domain `balibestholiday.com`. Jangan lupa update `NEXTAUTH_URL` & `NEXT_PUBLIC_SITE_URL` ke domain custom.

---

## 🔄 Update setelah deploy pertama

Tinggal `git push origin main` → Vercel auto-deploy. Migration baru otomatis ke-apply via `prisma migrate deploy` di build step.

```bash
# Bikin migration baru setelah edit schema.prisma
npx prisma migrate dev --name add_some_field

# Push
git add prisma/migrations
git commit -m "Add some field"
git push
```

---

## 🆘 Troubleshooting

### Build error: `Can't reach database server`
→ Cek `DIRECT_URL` benar, password ga ada karakter spesial yang belum di-URL-encode (`@`, `#`, `:` harus jadi `%40`, `%23`, `%3A`).

### Runtime error: `prepared statement "s0" already exists`
→ Lupa tambah `?pgbouncer=true&connection_limit=1` di `DATABASE_URL`. Tambahkan, lalu redeploy.

### NextAuth error: `[next-auth][error][NO_SECRET]`
→ Set `NEXTAUTH_SECRET` di Vercel env vars (32 char random).

### Duffel: HTTP 401
→ Token salah/expired. Generate baru di Duffel dashboard → Developers.

### Stays HTTP 403 di production
→ Ekspektasi. Duffel Stays gated; request akses di https://duffel.com/contact-us. Kode udah handle gracefully — banner kuning muncul ke user.

### Build timeout
→ Vercel free tier batas build 45 menit. Kalau Prisma migrate stuck, coba:
1. Lokal: `DATABASE_URL=$DIRECT_URL npx prisma db push` (hindari migration)
2. Ganti `vercel.json` build command ke `prisma generate && next build` (skip migrate, lu apply manual lokal)

---

## 💰 Biaya estimasi

| Service | Free tier | Bulanan kalau lewat |
|---|---|---|
| **Vercel** | 100GB bandwidth, unlimited deploys | $20/mo (Pro) |
| **Supabase** | 500MB DB, 2GB transfer, 50K MAU | $25/mo (Pro) |
| **Duffel** | Test sandbox gratis | Markup-based, no monthly |
| **Total** | $0/mo (kalau traffic kecil) | ~$45/mo |

---

## 🔐 Production hardening (recommended)

1. **Rotate `NEXTAUTH_SECRET`** kalau pernah ke-expose
2. **Enable RLS** (Row Level Security) di Supabase untuk tabel sensitif
3. **Set up Vercel Analytics** atau Plausible buat tracking
4. **Add rate limiting** di `/api/duffel/*` (sangat dianjurkan — Duffel charge per call)
5. **Custom domain + HTTPS** (Vercel auto-issue Let's Encrypt cert)
6. **Backup Supabase**: Settings → Database → Backups (PIT recovery di Pro)

---

🌴 **Selamat deploy!** Kalo nyangkut, balik ke chat aja.
