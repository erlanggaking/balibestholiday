# 🚀 Quickstart — Deploy ke VPS lu

**Konfigurasi spesifik:**
- IP server: `62.146.236.190`
- Region: Singapore (SIN)
- Domain: `balibestholiday.com`
- OS: Ubuntu (Cloud VPS 20)

Total waktu: **~30 menit** dari sini ke production HTTPS.

---

## 📍 Step 0 — DNS A Record (lakukan SEKARANG, biar sambil propagate)

DNS butuh waktu propagate (5-30 menit), jadi mulai dari sini dulu.

Login ke registrar/dashboard DNS lu (Cloudflare, Namecheap, GoDaddy, Niagahoster, dll). Tambah **2 records**:

| Type | Name / Host | Value | TTL | Proxy (Cloudflare) |
|---|---|---|---|---|
| `A` | `@` (atau `balibestholiday.com`) | `62.146.236.190` | 300 (atau Auto) | **DNS only** (non-proxied) |
| `A` | `www` | `62.146.236.190` | 300 (atau Auto) | **DNS only** (non-proxied) |

⚠️ **Kalau pakai Cloudflare**: matiin proxy (orange cloud → grey cloud) saat issue cert pertama. Setelah HTTPS jalan, baru aktifin proxy lagi.

**Verifikasi propagate** (di laptop lu, bukan server):

```bash
dig +short balibestholiday.com
# Should return: 62.146.236.190

dig +short www.balibestholiday.com
# Should return: 62.146.236.190
```

Atau buka https://dnschecker.org/#A/balibestholiday.com — minimal 5 region udah balik IP yang benar.

---

## 📍 Step 1 — SSH ke server (~3 menit)

Cek email dari Contabo/IONOS — biasanya subjek "Your VPS is ready" atau "Server access details". Cari **root password** di email itu.

Di terminal laptop lu:

```bash
ssh root@62.146.236.190
# Saat ditanya password, paste root password dari email
# Saat ditanya "Are you sure you want to continue connecting (yes/no)?", ketik: yes
```

**Pertama kali login, langsung ganti password:**

```bash
passwd
# Masukin password baru (catat di password manager — 1Password/Bitwarden)
```

**Tip mempermudah:** kalau lu mau login tanpa ngetik password tiap kali, dari terminal **laptop**:

```bash
# Generate SSH key (kalau belum ada)
ssh-keygen -t ed25519 -C "your@email.com"
# Tekan Enter 3x (default location, no passphrase)

# Copy public key ke server
ssh-copy-id root@62.146.236.190
# Masukin password sekali lagi

# Coba login lagi — sekarang langsung masuk tanpa password
ssh root@62.146.236.190
```

---

## 📍 Step 2 — Setup server (~5 menit)

Sekarang lu udah di dalam server (`root@vmi3317982:~#`). Copy-paste blok ini:

```bash
# Update OS
apt update && apt upgrade -y

# Install Docker (one-liner resmi)
curl -fsSL https://get.docker.com | sh

# Verifikasi
docker --version
docker compose version

# Setup firewall
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install useful tools
apt install -y git nano htop
```

---

## 📍 Step 3 — Clone repo + setup .env (~3 menit)

```bash
cd ~
git clone https://github.com/erlanggaking/balibestholiday.git
cd balibestholiday

# Generate password DB & secret acak
DB_PW=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
SECRET=$(openssl rand -base64 32)
echo "DB password: $DB_PW"
echo "NextAuth secret: $SECRET"
# Catat dua-duanya — lu butuh kalau mau access DB langsung pakai psql

# Bikin .env
cp .env.example .env
nano .env
```

Di `nano`, ganti baris-baris ini (paste nilai yang udah di-generate atas):

```env
POSTGRES_USER=bbh
POSTGRES_PASSWORD=<paste DB_PW>
POSTGRES_DB=balibestholiday

NEXTAUTH_URL=https://balibestholiday.com
NEXTAUTH_SECRET=<paste SECRET>

DUFFEL_ACCESS_TOKEN=duffel_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=https://balibestholiday.com
NEXT_PUBLIC_SITE_NAME=Bali Best Holiday
```

⚠️ **Hapus baris `DATABASE_URL=...` dan `DIRECT_URL=...` di file `.env`** — biarkan kosong. Docker Compose akan otomatis set ulang ke alamat container internal.

Save: tekan `Ctrl+O`, Enter, lalu `Ctrl+X` untuk exit nano.

---

## 📍 Step 4 — Build & start stack (~8-12 menit pertama kali)

```bash
docker compose up -d --build

# Tunggu DB ready (~20 detik)
sleep 25

# Apply migration + seed master data (20 bahasa, 20 mata uang, sample tours, admin)
docker compose exec app sh -c "npx prisma migrate deploy"
docker compose exec app sh -c "npm run db:seed"

# Cek semua service hidup
docker compose ps
```

**Yang harus muncul:**

```
NAME                          STATUS
balibestholiday-app-1         Up (healthy)
balibestholiday-db-1          Up (healthy)
balibestholiday-pgbouncer-1   Up
balibestholiday-redis-1       Up (healthy)
balibestholiday-nginx-1       Up
balibestholiday-certbot-1     Up
```

**Test HTTP (HTTPS belum aktif sampai Step 5):**

```bash
curl -I http://balibestholiday.com
# Expected: HTTP/1.1 301 Moved Permanently  (redirect ke https)
```

Atau buka di browser laptop lu: http://balibestholiday.com — bakal nge-redirect ke https tapi cert belum ada → browser warning. **Itu normal.** Lanjut ke Step 5.

---

## 📍 Step 5 — Issue HTTPS certificate (~3 menit)

Pastikan DNS udah propagate (cek di Step 0).

**Test pakai staging dulu** (Let's Encrypt punya rate limit ketat — kalau ulangi 5x dalam 1 jam, lu bakal di-block):

```bash
DOMAIN=balibestholiday.com
EMAIL=your@email.com  # GANTI dengan email lu

docker compose run --rm certbot \
  sh -c "certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL --agree-tos --no-eff-email --staging"
```

Output yang lu mau lihat: `Successfully received certificate.` Kalau success, hapus staging cert dan ulangi tanpa `--staging`:

```bash
docker compose run --rm certbot certbot delete --cert-name balibestholiday.com --non-interactive

docker compose run --rm certbot \
  sh -c "certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL --agree-tos --no-eff-email"

# Reload Nginx pakai cert real
docker compose exec nginx nginx -s reload
```

Auto-renewal udah jalan via container `certbot` (cek tiap 12 jam).

---

## 📍 Step 6 — Verifikasi production (~2 menit)

```bash
# HTTPS works?
curl -I https://balibestholiday.com
# Expected: HTTP/2 200

# Health check?
curl https://balibestholiday.com/health
# → "ok"

# Live flight search?
curl -sI "https://balibestholiday.com/flights/search?origin=LHR&destination=JFK&departureDate=2026-08-15&adults=1" | head -1
# Expected: HTTP/2 200
```

**Buka di browser:**

✅ https://balibestholiday.com — homepage dengan padlock 🔒

✅ https://balibestholiday.com/flights — search form

✅ https://balibestholiday.com/auth/signin — login dengan `admin@balibestholiday.com` / `admin12345`

---

## 📍 Step 7 — GANTI password admin (penting!)

Setelah login admin, buat **user kedua** untuk lu sendiri:

1. Buka https://balibestholiday.com/auth/signup → daftar dengan email pribadi lu
2. Promote user lu ke ADMIN role:

```bash
docker compose exec db psql -U bbh -d balibestholiday \
  -c "UPDATE \"User\" SET role='ADMIN' WHERE email='YOUR-EMAIL@gmail.com';"
```

3. Logout, login pakai user baru lu, lalu hapus user default `admin@balibestholiday.com`:

```bash
docker compose exec db psql -U bbh -d balibestholiday \
  -c "DELETE FROM \"User\" WHERE email='admin@balibestholiday.com';"
```

---

## 🆘 Kalau ada masalah

Cek log:

```bash
docker compose logs -f app       # Next.js logs (tekan Ctrl+C untuk exit)
docker compose logs -f db        # Postgres logs
docker compose logs nginx --tail=50    # Nginx logs
```

Restart 1 service:

```bash
docker compose restart app
```

Restart semua:

```bash
docker compose down
docker compose up -d
```

Daftar masalah umum & fix-nya: lihat **`DEPLOY-VPS.md`** section "Troubleshooting".

---

## 🎉 Setelah deploy

- ✅ Production live di https://balibestholiday.com
- ✅ HTTPS otomatis renew (Certbot loop tiap 12 jam)
- ✅ Auto backup VPS harian (lu udah subscribe)
- 🔁 Update aplikasi: `cd ~/balibestholiday && git pull && docker compose up -d --build app`
- 💾 Backup DB harian: tambah cron sesuai panduan di `DEPLOY-VPS.md`
- 📊 Monitor: `docker stats` (lihat RAM/CPU per service)

🌴 **Selamat go-live!**
