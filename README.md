# Hectix Frontend (`hectix`)

Monorepo frontend untuk platform ticketing **Hectix** yang dikelola menggunakan **pnpm Workspaces** dan **Turborepo**. Berisi 3 aplikasi Next.js (`web`, `organizer`, `admin`), pustaka komponen internal (`packages/*`), serta suite pengujian End-to-End Playwright (`e2e`).

---

## 1. Spesifikasi Runtime & Tooling Utama

Berdasarkan root `package.json`, `pnpm-workspace.yaml`, dan `deploy/Dockerfile.next`:

| Tool / Runtime | Versi di Repo | Sumber Konfigurasi |
|---|---|---|
| **Node.js** | `>=18` (Target Docker produksi: **`node:22-alpine`** / Node 22 LTS) | `package.json` (`engines`), `deploy/Dockerfile.next` |
| **Package Manager** | **`pnpm@10.19.0`** | `package.json` (`packageManager`), `pnpm-lock.yaml` |
| **Build System** | **`turbo@^2.8.20`** (Turborepo `2.8.20`) | `package.json`, `turbo.json`, `deploy/Dockerfile.next` |
| **Code Formatter** | `prettier@^3.6.0` + `prettier-plugin-tailwindcss@^0.7.1` | `package.json` |
| **Global Override** | `zod: "^4.3.6"` | `package.json` (`pnpm.overrides`) |
| **Reverse Proxy (Prod)** | Caddy `2` (`caddy:2`) | `deploy/frontend/docker-compose.yml` |

---

## 2. Struktur Folder & Spesifikasi Tiap Workspace

```text
hectix-frontend/
├── apps/
│   ├── web/                 # Aplikasi publik untuk pembeli tiket (Port dev: 3000)
│   ├── organizer/           # Dashboard manajemen event & keuangan untuk EO (Port dev: 3001)
│   └── admin/               # Backoffice internal untuk staff & super_admin (Port dev: 3002)
├── packages/
│   ├── ui/                  # (@repo/ui) Komponen UI bersama berbasis Radix UI & Tailwind
│   ├── tailwind-config/     # (@repo/tailwind-config) Shared CSS & PostCSS config
│   ├── typescript-config/   # (@repo/typescript-config) Base tsconfig untuk Next.js & React library
│   └── eslint-config/       # (@repo/eslint-config) Konfigurasi ESLint 9 bersama
├── e2e/                     # Pengujian End-to-End menggunakan Playwright
├── deploy/
│   ├── Dockerfile.next      # Multi-stage Dockerfile (turbo prune + Next.js standalone)
│   └── frontend/            # Docker Compose, Caddyfile, deploy.sh, dan .env.example untuk produksi
├── package.json             # Konfigurasi script root & packageManager
├── pnpm-lock.yaml           # Lockfile dependensi pnpm
├── pnpm-workspace.yaml      # Definisi workspace (apps/*, packages/*, e2e)
└── turbo.json               # Pipeline task Turborepo (build, dev, lint, check-types)
```

### Detail Spesifikasi & Versi per Folder

#### A. `apps/web` (`web@0.0.1`)
- **Fungsi**: Halaman utama penjelajahan event, pencarian, detail event, komentar wall, favorit, checkout tiket (QRIS & Virtual Account), histori transaksi, profil pengguna, dan unduh PDF E-Ticket.
- **Port Development**: `3000` (`next dev --turbopack`)
- **Output Build**: `standalone` (`apps/web/next.config.mjs`)
- **Spesifikasi Dependensi Utama (`apps/web/package.json`)**:
  - `next`: `16.1.7`
  - `react` & `react-dom`: `^19.2.4`
  - `typescript`: `^5.9.3`
  - `tailwindcss` & `@tailwindcss/postcss`: `^4.2.1`
  - `@tanstack/react-query`: `5.97.0`
  - `radix-ui`: `^1.4.3`, `shadcn`: `^4.2.0`, `lucide-react`: `^0.513.0`
  - `embla-carousel-react` & `embla-carousel-autoplay`: `8.6.0`
  - `jsbarcode`: `^3.12.3`, `sanitize-html`: `^2.18.0`, `next-themes`: `^0.4.6`
  - Workspace internal: `@repo/tailwind-config`

#### B. `apps/organizer` (`organizer@1.0.0`)
- **Fungsi**: Pembuatan & verifikasi organisasi (KTP/NIB), pembuatan/edit/publish event, pengaturan jenis tiket, voucher diskon, daftar performer, laporan pesanan (export XLSX & PDF), pengajuan payout keuangan, dan undangan anggota tim.
- **Port Development**: `3001` (`next dev --port 3001`)
- **Output Build**: `standalone` (`apps/organizer/next.config.ts`)
- **Spesifikasi Dependensi Utama (`apps/organizer/package.json`)**:
  - `next`: `16.2.1`
  - `react`: `^19.2.0`, `react-dom`: `^19.1.0`
  - `typescript`: `5.9.2`
  - `tailwindcss` & `@tailwindcss/postcss`: `^4.1.5`
  - `@tanstack/react-query`: `^5.97.0`
  - `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`: `^3.26.0` (Rich Text Editor deskripsi event)
  - `@dnd-kit/core`: `^6.3.1`, `@dnd-kit/sortable`: `^10.0.0` (Drag & drop urutan tiket/performer)
  - `recharts`: `^3.8.1`, `sonner`: `^2.0.7`, `lucide-react`: `^0.513.0`
  - Workspace internal: `@repo/ui`, `@repo/tailwind-config`, `@repo/typescript-config`, `@repo/eslint-config`

#### C. `apps/admin` (`admin@1.0.0`)
- **Fungsi**: Dashboard metrik platform, manajemen banner homepage, moderasi/verifikasi organisasi (`approve`/`reject`/`suspend`), pemantauan seluruh event & order (export CSV), pemrosesan pencairan dana (payout) beserta upload bukti transfer, pengaturan pajak & biaya layanan (`site_setting`), serta manajemen akun staff/admin.
- **Port Development**: `3002` (`next dev --port 3002`)
- **Output Build**: `standalone` (`apps/admin/next.config.ts`)
- **Spesifikasi Dependensi Utama (`apps/admin/package.json`)**:
  - `next`: `16.2.1`
  - `react`: `^19.2.0`, `react-dom`: `^19.1.0`
  - `typescript`: `5.9.2`
  - `tailwindcss` & `@tailwindcss/postcss`: `^4.1.5`
  - `@tanstack/react-query`: `^5.97.0`
  - `recharts`: `^3.8.1`, `lucide-react`: `^0.513.0`
  - Workspace internal: `@repo/ui`, `@repo/tailwind-config`, `@repo/typescript-config`, `@repo/eslint-config`

#### D. `packages/*` (Internal Shared Packages)
- **`packages/ui` (`@repo/ui`)**: Komponen UI bersama (`badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `tooltip`). Menggunakan `radix-ui@^1.4.3`, `@tanstack/react-table@^8.21.3`, `@tanstack/react-query@^5.97.0`, `lucide-react@^0.513.0`, dan `tailwindcss@^4.1.5`.
- **`packages/tailwind-config` (`@repo/tailwind-config`)**: Menyediakan `shared-styles.css`, `prose-event.css`, dan `postcss.config.js` (`tailwindcss@^4.1.5`, `postcss@^8.5.3`).
- **`packages/typescript-config` (`@repo/typescript-config`)**: Menyediakan konfigurasi dasar TypeScript (`base.json`, `nextjs.json`, `react-library.json`).
- **`packages/eslint-config` (`@repo/eslint-config`)**: Konfigurasi ESLint 9 (`eslint@^9.39.1`, `typescript-eslint@^8.39.0`, `@next/eslint-plugin-next@^16.2.0`).

#### E. `e2e` (End-to-End Tests)
- Berisi 9 spec pengujian Playwright (`01-web-browse.spec.ts` s/d `09-uploads.spec.ts`) menggunakan `@playwright/test@^1.64.0`, `pg@8.20.0`, `tsx@^4.21.0`, dan `typescript@5.9.2`.

---

## 3. Variabel Environment

Ketiga aplikasi Next.js meneruskan request `/api/:path*` dan `/uploads/:path*` ke server Go Backend melalui konfigurasi `rewrites()` di `next.config` serta helper `callApi` di `lib/api.ts`:

| File Lokasi | Variabel | Default di Kode | Keterangan |
|---|---|---|---|
| `apps/web/.env.local` | `API_INTERNAL_URL` | `http://localhost:8080` | URL internal menuju Go Backend API |
| `apps/organizer/.env.local` | `API_INTERNAL_URL`<br/>`NEXT_PUBLIC_WEB_URL` | `http://localhost:8080`<br/>`""` | URL menuju Go Backend API<br/>URL publik aplikasi `web` untuk membuat tautan preview event |
| `apps/admin/.env.local` | `API_INTERNAL_URL` | `http://localhost:8080` | URL internal menuju Go Backend API |

Untuk deployment produksi di `deploy/frontend/.env`:
- `WEB_HOST`: Domain untuk aplikasi `web` (contoh: `hectix.id`)
- `ORGANIZER_HOST`: Domain untuk aplikasi `organizer` (contoh: `organizer.hectix.id`)
- `ADMIN_HOST`: Domain untuk aplikasi `admin` (contoh: `admin.hectix.id`)
- `API_INTERNAL_URL`: URL Go Backend (contoh: `https://api.hectix.id`)
- `NEXT_PUBLIC_WEB_URL`: URL publik aplikasi `web` (contoh: `https://hectix.id`)

> **Penting**: Karena `rewrites()` di `next.config` dievaluasi pada saat proses build (`next build`), variabel `API_INTERNAL_URL` dan `NEXT_PUBLIC_WEB_URL` **wajib sudah terisi sebelum menjalankan `pnpm build` atau `docker compose build`**.

---

## 4. Cara Menjalankan Mode Development (Tanpa Docker / Native Lokal)

Mode development untuk seluruh aplikasi frontend berjalan **100% tanpa Docker**, cukup menggunakan **Node.js (`v22`)** dan **`pnpm@10.19.0`** langsung di terminal lokal Anda.

### A. Instalasi Dependensi
Dari root folder `hectix-frontend`:
```bash
corepack enable
pnpm install
```
*(Catatan untuk pengguna Node 22 dengan Corepack versi lama: jika muncul error signature key saat pertama kali menjalankan `corepack`, jalankan:
- Linux/macOS/Git Bash: `COREPACK_INTEGRITY_KEYS=0 corepack enable && COREPACK_INTEGRITY_KEYS=0 corepack pnpm install`
- Windows PowerShell: `$env:COREPACK_INTEGRITY_KEYS="0"; corepack enable; corepack pnpm install`)*

### B. Menyiapkan File `.env.local` di Tiap Aplikasi
Secara default, jika `API_INTERNAL_URL` tidak diset, ketiga aplikasi sudah otomatis meneruskan request `/api/*` dan `/uploads/*` ke `http://localhost:8080`. Untuk konfigurasi eksplisit di lokal:
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/organizer/.env.example apps/organizer/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```
Isi masing-masing file:
- `apps/web/.env.local`:
  ```dotenv
  API_INTERNAL_URL=http://localhost:8080
  ```
- `apps/organizer/.env.local`:
  ```dotenv
  NEXT_PUBLIC_WEB_URL=http://localhost:3000
  API_INTERNAL_URL=http://localhost:8080
  ```
- `apps/admin/.env.local`:
  ```dotenv
  API_INTERNAL_URL=http://localhost:8080
  ```

### C. Menjalankan Dev Server Tanpa Docker
Pastikan server Go Backend sudah berjalan di `http://localhost:8080`, lalu pilih salah satu cara berikut:

#### 1. Menjalankan Ketiga Aplikasi Sekaligus dari Root (`pnpm dev`)
```bash
# Menjalankan semua dev server secara paralel via Turborepo:
# - web       : http://localhost:3000
# - organizer : http://localhost:3001
# - admin     : http://localhost:3002
pnpm dev
```
*(Jika terminal Anda tidak mendukung tampilan interaktif TUI Turborepo, gunakan `pnpm turbo run dev --ui=stream`).*

#### 2. Menjalankan Satu Aplikasi Spesifik dari Root (`--filter`)
```bash
pnpm --filter web dev        # Hanya web di http://localhost:3000
pnpm --filter organizer dev  # Hanya organizer di http://localhost:3001
pnpm --filter admin dev      # Hanya admin di http://localhost:3002
```

#### 3. Menjalankan Langsung dari Dalam Folder Aplikasi (`next dev`)
Anda juga bisa masuk langsung ke masing-masing folder aplikasi dan menjalankan perintah `pnpm dev` / `npx next dev` bawaannya:
```bash
# Aplikasi Web (Port 3000 — next dev --turbopack)
cd apps/web && pnpm dev

# Aplikasi Organizer (Port 3001 — next dev --port 3001)
cd apps/organizer && pnpm dev

# Aplikasi Admin (Port 3002 — next dev --port 3002)
cd apps/admin && pnpm dev
```

---

## 5. Cara Build, Lint, & Check Types

Dari root `hectix-frontend`, perintah-perintah berikut didefinisikan di `package.json` dan `turbo.json`:

```bash
# Build seluruh aplikasi untuk produksi (.next/standalone)
pnpm build

# Build satu aplikasi spesifik
pnpm turbo run build --filter=web
pnpm turbo run build --filter=organizer
pnpm turbo run build --filter=admin

# Menjalankan ESLint di seluruh workspace
pnpm lint

# Menjalankan pengecekan tipe TypeScript
pnpm check-types

# Merapikan format kode dengan Prettier
pnpm format
```

---

## 6. Cara Build & Menjalankan Tanpa Docker (Perintah Langsung / Native)

Jika Anda ingin mem-build dan menjalankan ketiga aplikasi Next.js (`web`, `organizer`, `admin`) secara langsung di OS server atau lokal tanpa Docker, pastikan **Node.js v22** dan **pnpm@10.19.0** sudah terpasang.

Karena ketiga aplikasi berjalan di satu mesin yang sama (`localhost`), masing-masing aplikasi **wajib dijalankan pada port yang berbeda** (misalnya `3000`, `3001`, dan `3002`).

### Langkah 1: Persiapan Swap (Wajib untuk Server `2 vCPU / 2 GB RAM` / `t3.small`)
Satu proses `next build` membutuhkan sekitar `~1,2 – 1,5 GB RAM`. Pada server dengan RAM 2 GB (`2c2g`), aktifkan **Swap 4 GB** terlebih dahulu agar proses build tidak pernah terhenti karena kehabisan memori (`OOM Killed`):
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Langkah 2: Set Environment Variables & Build Aplikasi Secara Berurutan
Pastikan `API_INTERNAL_URL` dan `NEXT_PUBLIC_WEB_URL` sudah diset sebelum menjalankan `pnpm build` (karena `rewrites()` di `next.config` dibaca saat build):
- Jika menggunakan **Opsi Jalur 1 (Private IP Backend)**: isi `API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080`
- Jika menggunakan **Opsi Jalur 2 (Domain API via Caddy)**: isi `API_INTERNAL_URL=https://api.hectix.id`

```bash
# 1. Install seluruh dependensi workspace
corepack enable
pnpm install --frozen-lockfile

# 2. Set variabel environment untuk build + batas memori Node.js agar aman di RAM 2 GB
export API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080   # atau https://api.hectix.id
export NEXT_PUBLIC_WEB_URL=https://hectix.id
export NODE_OPTIONS="--max-old-space-size=1536"

# 3. Build satu per satu (--concurrency=1) agar tidak melebihi RAM 2 GB
pnpm turbo run build --concurrency=1
```

### Langkah 3: Menjalankan Server Produksi Tanpa Docker
Karena `next.config` pada ketiga aplikasi menggunakan `output: "standalone"`, Anda bisa memilih salah satu dari 2 cara berikut untuk menjalankannya:

#### Cara A: Menggunakan `pnpm --filter <app> start` (`next start`)
Jalankan masing-masing aplikasi di port berbeda (`3000`, `3001`, `3002`):
```bash
# Terminal / Service 1 — Web (Port 3000)
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 PORT=3000 pnpm --filter web start

# Terminal / Service 2 — Organizer (Port 3001)
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 PORT=3001 pnpm --filter organizer start

# Terminal / Service 3 — Admin (Port 3002)
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 PORT=3002 pnpm --filter admin start
```

#### Cara B: Menggunakan Output Standalone (`node server.js` — Sesuai `deploy/Dockerfile.next`)
Pada mode `output: "standalone"`, folder `.next/static` dan `public` perlu disalin ke dalam folder `.next/standalone/apps/<app>/` terlebih dahulu sebelum dijalankan dengan `node`:
```bash
# 1. Salin aset statis ke dalam folder standalone masing-masing aplikasi
for app in web organizer admin; do
  cp -r apps/$app/.next/static apps/$app/.next/standalone/apps/$app/.next/static
  cp -r apps/$app/public apps/$app/.next/standalone/apps/$app/public
done

# 2. Jalankan masing-masing server standalone dengan Node.js di port berbeda
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 HOSTNAME=0.0.0.0 PORT=3000 node apps/web/.next/standalone/apps/web/server.js
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 HOSTNAME=0.0.0.0 PORT=3001 node apps/organizer/.next/standalone/apps/organizer/server.js
API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080 HOSTNAME=0.0.0.0 PORT=3002 node apps/admin/.next/standalone/apps/admin/server.js
```

### Langkah 4: Konfigurasi Caddy Native (Tanpa Docker)
Jika Caddy di-install langsung di OS server (bukan di dalam container Docker), arahkan `reverse_proxy` di `/etc/caddy/Caddyfile` ke port `localhost` masing-masing aplikasi (`3000`, `3001`, `3002`):
```caddyfile
hectix.id {
	encode zstd gzip
	reverse_proxy localhost:3000
}

organizer.hectix.id {
	encode zstd gzip
	reverse_proxy localhost:3001
}

admin.hectix.id {
	encode zstd gzip
	reverse_proxy localhost:3002
}
```

---

## 7. Cara Build & Deploy dengan Docker Compose (`deploy/frontend`)

Pada server produksi (AWS EC2 Instance Frontend `2c2g`), deployment menggunakan `deploy/Dockerfile.next` dan `deploy/frontend/docker-compose.yml`.

`deploy/Dockerfile.next` menggunakan multi-stage build:
1. Stage `prune`: Menjalankan `pnpm dlx turbo@2.8.20 prune ${APP} --docker` untuk mengisolasi hanya dependensi yang dibutuhkan oleh aplikasi `${APP}`.
2. Stage `build`: Menginstal dependensi dengan `pnpm install --frozen-lockfile` dan mem-build output standalone Next.js (`pnpm turbo run build --filter=${APP} --env-mode=loose`) dengan batas memori `NODE_OPTIONS="--max-old-space-size=1536"`.
3. Stage `runtime`: Menjalankan `node apps/${APP}/server.js` pada port internal container `3000` menggunakan user non-root `node` (~120 MB RAM per container saat runtime).

### A. Skenario Awal: 3 Aplikasi Digabung dalam 1 Instance `frontend-aws` (`2c2g`)
1. Pastikan **Swap 4 GB** sudah aktif di server (lihat bagian 6 Langkah 1).
2. Masuk ke folder `deploy/frontend` dan siapkan file `.env`:
   ```bash
   cd deploy/frontend
   cp .env.example .env
   nano .env
   ```
   Contoh isi `.env`:
   ```dotenv
   WEB_HOST=hectix.id
   ORGANIZER_HOST=organizer.hectix.id
   ADMIN_HOST=admin.hectix.id

   # Pilih salah satu: Private IP Backend (:8080) ATAU https://api.hectix.id
   API_INTERNAL_URL=http://<PRIVATE_IP_BACKEND>:8080
   NEXT_PUBLIC_WEB_URL=https://hectix.id
   ```
3. Jalankan script `deploy.sh` (otomatis mem-build `web`, `organizer`, dan `admin` **satu per satu secara berurutan** agar RAM 2 GB tidak penuh, lalu menyalakan `web`, `organizer`, `admin`, dan `caddy`):
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

---

### B. Skenario Ekspansi: Ketika Frontend Dipecah Menjadi 3 Instance Terpisah (`web`, `organizer`, `admin`)
Script `deploy.sh` sudah mendukung parameter nama aplikasi (`./deploy.sh <app>`), sehingga ketika nanti Anda memisahkan `organizer` dan `admin` ke instance AWS masing-masing:

1. **Pengaturan jaringan ke `backend-aws`**:
   - **Jika memakai Private IP (`http://<PRIVATE_IP_BACKEND>:8080`)**: Cukup masukkan ketiga instance frontend ke dalam AWS Security Group `sg-frontend` yang sama (tidak perlu mengubah apa pun di server backend).
   - **Jika memakai `https://api.hectix.id`**: Tambahkan ketiga Elastic IP publik instance frontend (dipisahkan spasi) ke variabel `FRONTEND_IP="IP_WEB IP_ORGANIZER IP_ADMIN"` pada `deploy/.env` di `backend-aws` lalu restart Caddy backend.
2. **Di masing-masing instance Frontend**:
   - **Instance 1 (`web` — `hectix.id`)**:
     - Ubah `deploy/frontend/Caddyfile` agar hanya menyisakan blok `{$WEB_HOST}`.
     - Jalankan: `./deploy.sh web` (hanya mem-build & menyalakan container `web` + `caddy`).
   - **Instance 2 (`organizer` — `organizer.hectix.id`)**:
     - Ubah `deploy/frontend/Caddyfile` agar hanya menyisakan blok `{$ORGANIZER_HOST}`.
     - Jalankan: `./deploy.sh organizer` (hanya mem-build & menyalakan container `organizer` + `caddy`).
   - **Instance 3 (`admin` — `admin.hectix.id`)**:
     - Ubah `deploy/frontend/Caddyfile` agar hanya menyisakan blok `{$ADMIN_HOST}`.
     - Jalankan: `./deploy.sh admin` (hanya mem-build & menyalakan container `admin` + `caddy`).
3. **Di Hostinger DNS**: Arahkan record `A` `organizer` ke Elastic IP Instance 2, dan record `A` `admin` ke Elastic IP Instance 3.
