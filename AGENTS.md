# AGENTS.md — hectix-frontend (Next.js monorepo, LEGACY MODE)

> Baca juga `../../AGENTS.md` (rule workspace) dan `../hectix-backend/AGENTS.md` (kontrak API).
> Monorepo pnpm 10.19 + Turborepo 2.8. Tiga app Next.js yang **sudah production**. Frontend sepenuhnya bergantung pada bentuk JSON backend Go.

---

## 1. Struktur

```
apps/web/        pembeli (port 3000, next 16.1.7, turbopack, TIDAK pakai @repo/ui, punya lib/utils cn sendiri)
apps/organizer/  dashboard EO (port 3001, next 16.2.1, tiptap, dnd-kit, recharts, @repo/ui)
apps/admin/      backoffice staff (port 3002, next 16.2.1, recharts, @repo/ui)
apps/scanner/    aplikasi gate scanner (port 3003, React + Vite, PWA; bukan Next.js)
packages/ui                @repo/ui (radix + tailwind) — dipakai organizer & admin
packages/tailwind-config   shared-styles.css, prose-event.css
packages/typescript-config, packages/eslint-config
e2e/             Playwright 9 spec (browse, checkout VA, cancel, voucher, last-ticket race, organizer, invite, admin, uploads)
deploy/          Dockerfile.next (turbo prune + standalone), deploy/frontend (compose, Caddyfile, deploy.sh)
```

Untuk tiga app Next.js: `app/` (App Router), `components/`, `lib/` (`api.ts`, `auth-client.ts`, ...); `proxy.ts` hanya ada di organizer/admin (middleware Next 16). `apps/scanner` adalah SPA React + Vite dengan source di `src/`; jangan menerapkan pola App Router atau aturan `proxy.ts` Next ke scanner.

---

## 2. Aturan Legacy Khusus Frontend

1. **Jangan seragamkan antar app.** Versi Next/React/TS, ESLint config, `cn` util, dan pola komponen memang berbeda per app. Ubah hanya app yang diminta.
2. **Jangan upgrade/ tambah dependency** (termasuk shadcn add) tanpa izin. `pnpm-lock.yaml` jangan berubah kecuali task memang soal dependency.
3. **Jangan pindahkan komponen ke `packages/ui`** atau sebaliknya — mengubah 2 app sekaligus.
4. **Ikuti styling yang ada** (Tailwind 4, kelas hex hard-coded seperti `text-[#1A1A1A]`, font `font-ibm`). Jangan perkenalkan design system/CSS-in-JS baru.
5. **Jangan jalankan `pnpm format` di seluruh repo** (Prettier global akan menyentuh ratusan file). Format hanya file yang diubah bila perlu.
6. **Perubahan UI tidak boleh mengubah alur bisnis** (checkout, cancel, voucher, publish event, payout) tanpa task eksplisit.

---

## 3. Komunikasi ke Backend (invariant)

- Browser memanggil path relatif `/api/*` & `/uploads/*`; `next.config` `rewrites().beforeFiles` meneruskan ke `API_INTERNAL_URL` (default `http://localhost:8080`). **`rewrites` dievaluasi saat build** → env harus ada saat `pnpm build`.
- Server-side (RSC/route) memakai `callApi(path, { cookie, host, proto })` di `lib/api.ts`: meneruskan cookie, set `x-forwarded-host` = host app, dan set `origin` untuk method non-GET (lolos `OriginCheck` backend). **Jangan hapus header ini** — backend memilih app (web/organizer/admin) dari host tersebut.
- `apps/scanner` memanggil API relatif `/api/*` lewat `apiFetch()` dengan `credentials: "include"`. Vite dev proxy meneruskan `/api` dan menetapkan `X-Forwarded-Host: scanner-dev.hectix.id`; routing scanner di backend hanya tersedia bila `SCANNER_BASE_URL` dikonfigurasi.
- `lib/auth-client.ts` = klien tulisan tangan yang **meniru API better-auth** (`/api/auth/get-session`, organization/*, sign-in/social). Tipe `User`/`Session`/`Organization` di sana mencerminkan JSON backend — ubah hanya bila backend berubah (dan sebaliknya).
- `proxy.ts` organizer/admin mengecek cookie `__Secure-{app}.session_token` / `{app}.session_token` hanya untuk redirect UX. **Ini bukan security boundary** — otorisasi sebenarnya di backend. Jangan pindahkan logika izin ke frontend saja.
- Jangan simpan token/session di `localStorage`/`sessionStorage` (audit: tidak ada pemakaian — pertahankan).

---

## 4. Uang di UI

- Preview checkout (`apps/web/app/events/[id]/checkout/page.tsx`) menghitung `tax = Math.round(subtotal * taxPercent / 100)` — harus identik dengan `jsRound` backend. Nilai final **selalu dari respons backend**; UI hanya preview.
- Jangan pernah mengirim harga/total ke backend sebagai sumber kebenaran (body checkout hanya `eventId`, `items[{ticketTypeId, quantity}]`, `paymentMethod`, `bank`, `voucherCode`).
- Format Rupiah ikut helper yang sudah ada (`lib/format.ts` di web, util lokal di app lain).

---

## 5. Security Frontend

- HTML deskripsi event (dari tiptap organizer) **hanya** boleh dirender via `sanitizeDescription()` (`apps/web/lib/sanitize.ts`, allowlist tag `h2,h3,p,strong,em,ul,ol,li,a,img,br`, skema `http/https/mailto`). Pemakaian `dangerouslySetInnerHTML` saat ini hanya di `components/event/event-panel.tsx` & `event-detail-body.tsx`. Jangan tambah pemakaian baru tanpa sanitize; jangan longgarkan allowlist tanpa izin.
- Jangan pakai `eval`, `new Function`, atau `innerHTML` dengan data user.
- `next.config` `images.remotePatterns` dibatasi domain hectix + `/uploads/**`. Menambah domain = ask first.
- Jangan commit `apps/*/.env.local`. Hanya `.env.example` yang ter-track.

---

## 6. Verifikasi (dari `hectix/hectix-frontend`)

```powershell
pnpm install --frozen-lockfile           # jangan ubah lockfile
pnpm --filter organizer check-types      # next typegen && tsc --noEmit
pnpm --filter admin check-types
pnpm --filter web exec tsc --noEmit      # web tidak punya script check-types
pnpm --filter <app> lint                 # organizer/admin: --max-warnings 0
pnpm turbo run build --filter=<app>      # butuh API_INTERNAL_URL; RAM ~1.5 GB per build
pnpm --filter scanner build              # menjalankan tsc -b lalu vite build
pnpm --filter scanner lint
pnpm --filter scanner test               # unit tests milik scanner
```

- **Wajib** jalankan check-types manual: organizer & admin memakai `typescript.ignoreBuildErrors: true`, jadi `next build` bisa lolos walau ada type error.
- E2E (`e2e/`, Playwright) butuh backend Go + Postgres jalan dan env e2e; jalankan spec terkait saja: `pnpm --filter e2e test -- tests/02-web-checkout-va.spec.ts`. Jangan arahkan e2e ke production.
- Verifikasi UI dengan metode hypothesis-driven: cek data benar-benar berubah (respons API / DB / list setelah reload), pakai nilai uji yang jelas berbeda.
- Setelah edit: MCP `detect_changes` untuk project frontend.

---

## 7. Dilarang Tanpa Izin Eksplisit

- Mengubah `next.config.*` (rewrites, images, `output: "standalone"`, `ignoreBuildErrors`), `proxy.ts`, `instrumentation.ts`.
- Mengubah `turbo.json`, `pnpm-workspace.yaml`, root `package.json` (termasuk override `zod`), `deploy/*`.
- Mengubah `lib/api.ts` / `lib/auth-client.ts` (dipakai hampir semua halaman — `mutate` fan-in 31 di organizer).
- Menghapus `apps/web/lib/mock-data.ts` atau file yang tampak tidak terpakai — verifikasi dulu dengan `rg` + MCP, lalu tanya.
