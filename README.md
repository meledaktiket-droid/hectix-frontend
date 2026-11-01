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

## 4. Cara Menjalankan Mode Development (Lokal)

### A. Instalasi Dependensi
Pastikan Node.js (`>=18`, disarankan `v22`) dan `pnpm@10.19.0` sudah aktif (via `corepack enable`):
```bash
corepack enable
pnpm install
```
*(Catatan untuk pengguna Node 22 dengan Corepack versi lama: jika muncul error signature key saat pertama kali menjalankan `corepack`, set environment variable `COREPACK_INTEGRITY_KEYS=0`).*

### B. Menyiapkan File `.env.local` (Opsional di Lokal)
Secara default, jika `API_INTERNAL_URL` tidak diset, ketiga aplikasi sudah otomatis mengarah ke `http://localhost:8080`. Namun disarankan membuat file `.env.local` di masing-masing folder aplikasi:
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/organizer/.env.example apps/organizer/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```
Isi dengan:
- `API_INTERNAL_URL=http://localhost:8080`
- `NEXT_PUBLIC_WEB_URL=http://localhost:3000` (pada `apps/organizer/.env.local`)

### C. Menjalankan Dev Server
Pastikan server Go Backend sudah berjalan di `http://localhost:8080`, lalu jalankan dari root `hectix-frontend`:

```bash
# Menjalankan ke-3 aplikasi secara bersamaan via Turborepo:
# - web       : http://localhost:3000
# - organizer : http://localhost:3001
# - admin     : http://localhost:3002
pnpm dev
```

Jika ingin menjalankan salah satu aplikasi saja:
```bash
pnpm --filter web dev        # Hanya web (:3000)
pnpm --filter organizer dev  # Hanya organizer (:3001)
pnpm --filter admin dev      # Hanya admin (:3002)
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

### Langkah 1: Set Environment Variables & Build Aplikasi
Pastikan `API_INTERNAL_URL` dan `NEXT_PUBLIC_WEB_URL` sudah diset sebelum menjalankan `pnpm build` (karena `rewrites()` di `next.config` dibaca saat build):

```bash
# 1. Install seluruh dependensi workspace
corepack enable
pnpm install --frozen-lockfile

# 2. Set variabel environment untuk build (contoh produksi atau lokal)
export API_INTERNAL_URL=https://api.hectix.id
export NEXT_PUBLIC_WEB_URL=https://hectix.id

# 3. Build seluruh aplikasi (atau gunakan --filter=<app> untuk build satu per satu)
pnpm build
```

### Langkah 2: Menjalankan Server Produksi Tanpa Docker
Karena `next.config` pada ketiga aplikasi menggunakan `output: "standalone"`, Anda bisa memilih salah satu dari 2 cara berikut untuk menjalankannya:

#### Cara A: Menggunakan `pnpm --filter <app> start` (`next start`)
Jalankan masing-masing aplikasi di port berbeda (`3000`, `3001`, `3002`):
```bash
# Terminal / Service 1 — Web (Port 3000)
API_INTERNAL_URL=https://api.hectix.id PORT=3000 pnpm --filter web start

# Terminal / Service 2 — Organizer (Port 3001)
API_INTERNAL_URL=https://api.hectix.id PORT=3001 pnpm --filter organizer start

# Terminal / Service 3 — Admin (Port 3002)
API_INTERNAL_URL=https://api.hectix.id PORT=3002 pnpm --filter admin start
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
API_INTERNAL_URL=https://api.hectix.id HOSTNAME=0.0.0.0 PORT=3000 node apps/web/.next/standalone/apps/web/server.js
API_INTERNAL_URL=https://api.hectix.id HOSTNAME=0.0.0.0 PORT=3001 node apps/organizer/.next/standalone/apps/organizer/server.js
API_INTERNAL_URL=https://api.hectix.id HOSTNAME=0.0.0.0 PORT=3002 node apps/admin/.next/standalone/apps/admin/server.js
```

### Langkah 3: Konfigurasi Caddy Native (Tanpa Docker)
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

Pada server produksi (seperti AWS EC2 Instance Frontend), deployment menggunakan `deploy/Dockerfile.next` dan `deploy/frontend/docker-compose.yml`.

`deploy/Dockerfile.next` menggunakan multi-stage build:
1. Stage `prune`: Menjalankan `pnpm dlx turbo@2.8.20 prune ${APP} --docker` untuk mengisolasi hanya dependensi yang dibutuhkan oleh aplikasi `${APP}`.
2. Stage `build`: Menginstal dependensi dengan `pnpm install --frozen-lockfile` dan mem-build output standalone Next.js (`pnpm turbo run build --filter=${APP} --env-mode=loose`).
3. Stage `runtime`: Menjalankan `node apps/${APP}/server.js` pada port internal container `3000` menggunakan user non-root `node`.

### Langkah Deploy di Server:
1. Masuk ke folder `deploy/frontend` dan siapkan file `.env`:
   ```bash
   cd deploy/frontend
   cp .env.example .env
   nano .env
   ```
2. Jalankan script `deploy.sh` (akan menjalankan `git pull --ff-only`, `docker compose build`, `docker compose up -d --remove-orphans`, dan membersihkan image lama):
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
