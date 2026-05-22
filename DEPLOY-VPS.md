# 🐳 Deploy Bali Best Holiday — Self-hosted VPS (Docker Compose)

Full self-hosted stack: Next.js + PostgreSQL + PgBouncer + Redis + Nginx + HTTPS, semua di satu VPS.

**Estimasi waktu:** ~30 menit. **Biaya:** $9-12/mo (Cloud VPS 20).

---

## 📋 Yang lu butuhkan

- [ ] **VPS** — minimum 8 GB RAM / 4 vCPU / 75 GB NVMe (Cloud VPS 10).
      **Direkomendasikan: 12 GB RAM / 6 vCPU (Cloud VPS 20)** untuk full self-host comfort.
- [ ] **Domain** sudah pointing ke IP VPS (A record ke `balibestholiday.com` & `www`)
- [ ] Akses **SSH** ke VPS (Ubuntu 22.04+ atau Debian 12+)
- [ ] **Token Duffel** (test atau production)

---

## 1️⃣ Setup VPS dasar (~5 menit)

SSH ke server lu sebagai root (atau sudo user):

```bash
ssh root@<vps-ip>

# Update system
apt update && apt upgrade -y

# Install Docker + Docker Compose plugin (official one-liner)
curl -fsSL https://get.docker.com | sh

# Verifikasi
docker --version
docker compose version

# Firewall (kalau pakai UFW)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# (opsional) bikin user non-root
adduser bbh
usermod -aG docker bbh
su - bbh
```

---

## 2️⃣ Clone repo + buat .env (~3 menit)

```bash
cd ~
git clone https://github.com/erlanggaking/balibestholiday.git
cd balibestholiday

# Buat .env dari template
cp .env.example .env

# Generate password DB acak
DB_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Edit .env — ganti nilainya:
nano .env
```

Isi `.env` minimal seperti ini:

```bash
# --- Postgres (di-host di docker-compose, bukan Supabase) ---
POSTGRES_USER=bbh
POSTGRES_PASSWORD=<paste DB_PW di atas>
POSTGRES_DB=balibestholiday

# DATABASE_URL & DIRECT_URL akan otomatis di-set oleh docker-compose.yml
# Jangan diubah di sini — biarkan kosong, akan di-override container

# --- NextAuth ---
NEXTAUTH_URL=https://balibestholiday.com
NEXTAUTH_SECRET=<paste NEXTAUTH_SECRET di atas>

# --- Duffel ---
DUFFEL_ACCESS_TOKEN=duffel_test_xxx  # atau duffel_live_xxx

# --- Public site ---
NEXT_PUBLIC_SITE_URL=https://balibestholiday.com
NEXT_PUBLIC_SITE_NAME=Bali Best Holiday

# --- Optional ---
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# SMTP_HOST=
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=
```

---

## 3️⃣ Konfigurasi domain di Nginx (~2 menit)

Default config ada di `deploy/nginx/conf.d/balibestholiday.conf`. Edit kalau pakai domain berbeda:

```bash
sed -i 's/balibestholiday\.com/<DOMAIN-LU>/g' deploy/nginx/conf.d/balibestholiday.conf
```

---

## 4️⃣ Build & start stack (~5-10 menit pertama kali)

```bash
docker compose up -d --build

# Tunggu DB ready (~15 detik), lalu jalankan migration + seed:
docker compose exec app sh -c "npx prisma migrate deploy"
docker compose exec app sh -c "npm run db:seed"

# Cek semua container hidup
docker compose ps
```

Output yang lu mau lihat:

```
NAME                        STATUS         PORTS
bbh-app-1                   Up (healthy)
bbh-db-1                    Up (healthy)
bbh-pgbouncer-1             Up
bbh-redis-1                 Up (healthy)
bbh-nginx-1                 Up             0.0.0.0:80->80/tcp, 443->443/tcp
bbh-certbot-1               Up
```

Test HTTP (HTTPS belum aktif sampai step 5):

```bash
curl -I http://<vps-ip>
# Expected: 301 Redirect ke HTTPS (atau langsung 200 kalau pas DNS belum propagate)
```

---

## 5️⃣ Issue HTTPS certificate (~3 menit)

Pastikan DNS udah propagate (cek `dig balibestholiday.com` dari laptop lu — harus return IP VPS).

**Test pakai staging dulu** (Let's Encrypt punya rate limit ketat):

```bash
DOMAIN=balibestholiday.com EMAIL=you@example.com STAGING=1 \
  docker compose run --rm certbot \
  sh -c 'certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email --staging'
```

Kalau sukses, hapus `--staging` dan ulangi buat cert real:

```bash
docker compose run --rm certbot \
  certbot delete --cert-name balibestholiday.com

DOMAIN=balibestholiday.com EMAIL=you@example.com \
  docker compose run --rm certbot \
  sh -c 'certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email'

# Reload Nginx untuk pakai cert baru
docker compose exec nginx nginx -s reload
```

Cert auto-renewal sudah jalan via container `certbot` (cek tiap 12 jam).

---

## 6️⃣ Verifikasi production (~2 menit)

```bash
# HTTPS works?
curl -I https://balibestholiday.com

# Health check?
curl https://balibestholiday.com/health
# → "ok"

# Search live Duffel?
curl -I "https://balibestholiday.com/flights/search?origin=LHR&destination=JFK&departureDate=2026-08-15&adults=1"
# → 200
```

Buka browser: `https://balibestholiday.com` → harus muncul homepage dengan padlock 🔒.

**Login admin:**
- URL: `/auth/signin`
- Email: `admin@balibestholiday.com`
- Password: `admin12345` ← **GANTI!** Buat user baru via `/auth/signup`, lalu di Adminer atau psql:
  ```bash
  docker compose exec db psql -U bbh -d balibestholiday \
    -c "UPDATE \"User\" SET role='ADMIN' WHERE email='your@email.com'"
  ```

---

## 🔄 Update aplikasi setelah deploy

```bash
cd ~/balibestholiday
git pull
docker compose up -d --build app
```

Migration baru otomatis ke-apply via container entrypoint script.

---

## 📊 Monitoring resource VPS

```bash
# Lihat memory + CPU per container (tekan q untuk keluar)
docker stats

# Logs aplikasi
docker compose logs -f app

# Logs DB
docker compose logs -f db

# Disk usage volume
docker system df -v
```

**Yang harus diwaspadai:**
- `db-data` volume tumbuh pelan (~10 MB/bulan untuk 1k bookings)
- Redis pake max 512 MB (configured di docker-compose), evict LRU otomatis
- Next.js rata-rata 500-800 MB per instance

---

## 💾 Backup database

### Manual (cepat)

```bash
docker compose exec db \
  pg_dump -U bbh balibestholiday | gzip > "backup-$(date +%F).sql.gz"

# Test restore
gunzip < backup-2026-01-15.sql.gz | \
  docker compose exec -T db psql -U bbh balibestholiday
```

### Otomatis harian (pakai cron)

Tambah ke crontab user `bbh`:

```bash
crontab -e
```

```cron
# Backup DB setiap jam 2 pagi, simpan 7 hari terakhir
0 2 * * * cd /home/bbh/balibestholiday && docker compose exec -T db pg_dump -U bbh balibestholiday | gzip > /home/bbh/backups/bbh-$(date +\%F).sql.gz && find /home/bbh/backups -name "bbh-*.sql.gz" -mtime +7 -delete
```

**Untuk produksi serius:** sync `backups/` ke S3/Backblaze B2 dengan `rclone`.

---

## 🆘 Troubleshooting

### `permission denied while trying to connect to docker daemon`
→ User belum di group `docker`. Jalankan: `sudo usermod -aG docker $USER && newgrp docker`

### `Cannot connect to db:5432`
→ Container `db` belum healthy. `docker compose logs db` — cek error. Biasanya password salah di `.env`.

### `prepared statement "s0" already exists`
→ Aplikasi connect langsung ke port 5432, bukan ke pgbouncer. Restart app: `docker compose restart app`. URL otomatis di-set di `docker-compose.yml`.

### Build `app` container OOM (out of memory)
→ VPS 10 (8 GB) bisa hit limit saat build. Solusi:
1. Build di laptop lu, push ke registry: `docker buildx build --push -t ghcr.io/erlanggaking/balibestholiday:latest .`
2. Di server, ubah `docker-compose.yml` → `image:` ke registry path, hapus `build:`
3. Atau swap-up VPS sementara saat build, lalu turunkan lagi.

### Certbot fail: "Connection refused"
→ Firewall block port 80. `ufw allow 80/tcp`. Atau DNS belum propagate (`dig +short balibestholiday.com`).

### Disk penuh
→ `docker system prune -af --volumes` (HATI-HATI: hapus semua volume yang ga aktif). Atau cuma image lama: `docker image prune -af`.

---

## 📈 Scaling roadmap

| Traffic | Setup | Total cost |
|---|---|---|
| 0-2k DAU | VPS 20 (single, Docker Compose) | $9/mo |
| 2k-10k DAU | + Cloudflare CDN + Redis tuning | $9/mo |
| 10k-50k DAU | + 2nd VPS as DB only, app horizontal scale (Docker Swarm) | $25/mo |
| 50k+ DAU | k3s/k8s + managed Postgres (Crunchy/RDS) + S3 assets | $150+/mo |

---

## 🔐 Production hardening checklist

- [ ] **fail2ban** untuk SSH brute-force protection
- [ ] **SSH keys only** — disable password login (`PasswordAuthentication no` di `/etc/ssh/sshd_config`)
- [ ] **Auto security updates**: `apt install unattended-upgrades`
- [ ] **Postgres**: limit `max_connections` (default 100 OK karena PgBouncer di depan)
- [ ] **Redis**: set `requirepass` di production (lalu update `REDIS_URL` jadi `redis://:pw@redis:6379`)
- [ ] **Backup S3**: rclone sync harian ke object storage offsite
- [ ] **Monitoring**: pasang Uptime Kuma di subdomain (mis. `status.balibestholiday.com`) — gratis & self-hosted
- [ ] **Rate limit Duffel API** sudah aktif via Nginx (10 req/sec/IP)

---

🌴 Selamat deploy! Kalau VPS lu kepenuhan, balik ke `DEPLOY.md` (Vercel + Supabase) — auto-scale tanpa pusing.
