"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../../../../lib/auth-client";
import {
  Calendar,
  MapPin,
  Edit2,
  Users,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@repo/ui/button";

const BUYERS_PAGE_SIZE = 10;

type TicketStat = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  revenue: number;
};

type BuyerItem = {
  ticketTypeName: string;
  quantity: number;
};

type Buyer = {
  orderId: string;
  status: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  items: BuyerItem[];
};

type EventDetail = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string | null;
  city: string | null;
  status: string;
};

type PhysicalBatch = {
  id: string;
  eventId: string;
  requestId: string;
  name: string;
  accessType: string;
  ticketTypeId: string | null;
  purpose: string;
  activationMode: string;
  quantity: number;
  merchantRef: string | null;
  generatedByName: string;
  generatedByEmail: string;
  generatedAt: string;
  exportedByName: string | null;
  exportedByEmail: string | null;
  exportedAt: string | null;
  exportCount: number;
  stockCount: number;
  activeCount: number;
  voidCount: number;
};

type BatchHistoryEntry = {
  id: string;
  action: "generated" | "exported";
  batchId: string;
  batchName: string;
  accessType: string;
  quantity: number;
  purpose: string;
  note: string | null;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

type EventVolunteer = {
  id: string;
  eventId: string;
  userId: string | null;
  userName: string | null;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  invitedByEmail: string;
  createdAt: string;
  acceptedAt: string | null;
};

type VolunteerHistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  volunteerEmail: string;
  volunteerName: string | null;
  note: string | null;
  actorType: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs || unit === "second") {
      return rtf.format(-Math.round(diffSec / secs), unit);
    }
  }
  return "baru saja";
}

function BatchActionBadge({ action }: { action: "generated" | "exported" }) {
  const isGen = action === "generated";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isGen ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isGen ? "bg-emerald-500" : "bg-blue-500"}`} />
      {isGen ? "Generated" : "Exported Excel"}
    </span>
  );
}

const DEFAULT_VOLUNTEER_STYLE = {
  label: "Pending Invite",
  bg: "bg-amber-50",
  text: "text-amber-700",
  dot: "bg-amber-500",
};

const VOLUNTEER_STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: DEFAULT_VOLUNTEER_STYLE,
  accepted: { label: "Diterima (Aktif)", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Ditolak", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  revoked: { label: "Revoked", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function VolunteerStatusBadge({ status }: { status: string }) {
  const s = VOLUNTEER_STATUS_STYLES[status] ?? DEFAULT_VOLUNTEER_STYLE;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function BatchHistoryCard({ history }: { history: BatchHistoryEntry[] }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-medium">Riwayat generate &amp; unduh tiket</p>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas batch tiket.</p>
      ) : (
        <ol className="space-y-4">
          {history.map((h) => (
            <li key={h.id} className="flex gap-3">
              <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <BatchActionBadge action={h.action} />
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                    {h.accessType}
                  </span>
                  <span className="text-xs font-medium text-foreground">{h.batchName}</span>
                  <span
                    className="ml-auto text-xs text-muted-foreground"
                    title={new Date(h.createdAt).toLocaleString("id-ID")}
                  >
                    {timeAgo(h.createdAt)}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium" title={h.actorEmail ?? undefined}>
                    {h.actorName || h.actorEmail || "Unknown user"}
                  </span>
                  <span className="text-muted-foreground"> · {h.actorType}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({h.action === "generated" ? `generate ${h.quantity} tiket` : "cetak excel QR"})
                  </span>
                </p>
                {h.note && <p className="text-xs text-muted-foreground italic">&ldquo;{h.note}&rdquo;</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function VolunteerHistoryCard({ history }: { history: VolunteerHistoryEntry[] }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <p className="text-sm font-medium">Riwayat invite &amp; revoke volunteer</p>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas volunteer.</p>
      ) : (
        <ol className="space-y-4">
          {history.map((h) => {
            const actionLabel =
              h.toStatus === "revoked"
                ? "revoked"
                : h.toStatus === "rejected"
                  ? "declined invite"
                  : h.fromStatus === "pending" && h.toStatus === "accepted"
                    ? "accepted invite"
                    : h.fromStatus === "revoked" || h.fromStatus === "rejected"
                      ? "re-invited"
                      : "invited";
            return (
              <li key={h.id} className="flex gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.fromStatus && (
                      <>
                        <VolunteerStatusBadge status={h.fromStatus} />
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <VolunteerStatusBadge status={h.toStatus} />
                    <span className="text-xs font-medium text-foreground">
                      {h.volunteerName ? `${h.volunteerName} (${h.volunteerEmail})` : h.volunteerEmail}
                    </span>
                    <span
                      className="ml-auto text-xs text-muted-foreground"
                      title={new Date(h.createdAt).toLocaleString("id-ID")}
                    >
                      {timeAgo(h.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium" title={h.actorEmail ?? undefined}>
                      {h.actorName || h.actorEmail || "Unknown user"}
                    </span>
                    <span className="text-muted-foreground"> · {h.actorType}</span>
                    <span className="text-muted-foreground"> ({actionLabel})</span>
                  </p>
                  {h.note && <p className="text-xs text-muted-foreground italic">&ldquo;{h.note}&rdquo;</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Lunas", cls: "bg-green-50 text-green-700 ring-green-600/20" },
    pending_payment: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    cancelled: { label: "Dibatalkan", cls: "bg-muted text-muted-foreground ring-border" },
    expired: { label: "Kedaluwarsa", cls: "bg-muted text-muted-foreground ring-border" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground ring-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"main" | "batches" | "volunteers">("main");
  const [downloadingBatchId, setDownloadingBatchId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetch(`/api/events/${id}`).then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["event-orders", id],
    queryFn: () => fetch(`/api/events/${id}/orders`).then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  const {
    data: batchesData,
    error: batchesQueryError,
  } = useQuery<{
    batches: PhysicalBatch[];
    history: BatchHistoryEntry[];
    summary?: { enteredCount: number; totalCapacity: number };
  }>({
    queryKey: ["event-batches", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/batches`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat batch tiket fisik");
      }
      return res.json();
    },
    enabled: !!activeOrg?.id,
  });

  const {
    data: volunteersData,
    error: volunteersQueryError,
  } = useQuery<{ volunteers: EventVolunteer[]; history: VolunteerHistoryEntry[] }>({
    queryKey: ["event-volunteers", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/volunteers`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memuat daftar volunteer");
      }
      return res.json();
    },
    enabled: !!activeOrg?.id,
  });

  const ev: EventDetail | undefined = eventData?.event;
  const stats: TicketStat[] = ordersData?.stats ?? [];
  const buyers: Buyer[] = ordersData?.buyers ?? [];
  const batches: PhysicalBatch[] = batchesData?.batches ?? [];
  const batchHistory: BatchHistoryEntry[] = batchesData?.history ?? [];
  const volunteers: EventVolunteer[] = volunteersData?.volunteers ?? [];
  const volunteerHistory: VolunteerHistoryEntry[] = volunteersData?.history ?? [];

  async function handleExportBatch(batch: PhysicalBatch) {
    setDownloadingBatchId(batch.id);
    setExportError(null);
    try {
      const res = await fetch(`/api/events/${id}/batches/${batch.id}/export`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunduh file Excel QR");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hectix-qr-${batch.accessType.toLowerCase()}-${batch.id.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["event-batches", id] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh file Excel QR";
      setExportError(msg);
    } finally {
      setDownloadingBatchId(null);
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ev) {
    return <p className="text-sm text-muted-foreground">Event tidak ditemukan.</p>;
  }

  const totalSold = stats.reduce((sum, t) => sum + t.sold, 0);
  const totalCapacity = stats.reduce((sum, t) => sum + t.capacity, 0);
  const totalRevenue = stats.reduce((sum, t) => sum + t.revenue, 0);

  const totalPages = Math.max(1, Math.ceil(buyers.length / BUYERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBuyers = buyers.slice((currentPage - 1) * BUYERS_PAGE_SIZE, currentPage * BUYERS_PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{ev.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ev.status === "published" ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-muted text-muted-foreground ring-border"}`}>
              {ev.status === "published" ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(ev.startsAt)}
              {ev.endsAt && ` – ${formatDate(ev.endsAt)}`}
            </span>
            {(ev.venueName || ev.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[ev.venueName, ev.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/events/${id}/edit`}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shrink-0"
        >
          <Edit2 className="size-4" />
          Edit event
        </Link>
      </div>

      {(() => {
        const missing = (eventData?.tickets ?? []).filter(
          (t: { validDates?: string[] }) => !t.validDates || t.validDates.length === 0
        );
        if (missing.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <span>
              <strong>Perhatian:</strong> Beberapa tipe tiket belum memiliki tanggal berlaku. Lengkapi tanggal tiket di Edit Event agar sesi &amp; generate tiket fisik dapat berjalan.
            </span>
            <Link
              href={`/events/${id}/edit`}
              className="font-semibold underline underline-offset-2 hover:text-amber-950"
            >
              Lengkapi di Edit Event
            </Link>
          </div>
        );
      })()}

      <div className="border-b">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "main"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Utama
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batches")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "batches"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>Daftar Tiket</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {batches.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("volunteers")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "volunteers"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>List Volunteer</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {volunteers.length}
            </span>
          </button>
        </nav>
      </div>

      {activeTab === "main" ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Tiket</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tipe</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Harga</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Terjual</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Belum ada tiket.
                      </td>
                    </tr>
                  ) : (
                    stats.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {t.price === 0 ? "Gratis" : formatCurrency(t.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {t.sold}
                          <span className="text-muted-foreground"> / {t.capacity}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(t.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stats.length > 0 && (
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td className="px-4 py-2.5 font-medium">Total</td>
                      <td />
                      <td className="px-4 py-2.5 text-right font-medium">
                        {totalSold}
                        <span className="text-muted-foreground font-normal"> / {totalCapacity}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Pembeli</h2>
              {buyers.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  {buyers.length} order
                </span>
              )}
            </div>
            <div className="rounded-lg border overflow-hidden">
              {ordersLoading ? (
                <div className="p-8 text-center">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : buyers.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Belum ada pembeli.
                </div>
              ) : (
                <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tiket</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tgl Order</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedBuyers.map((b) => (
                      <tr key={b.orderId} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{b.buyerName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.buyerEmail}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {b.items.map((item, i) => (
                            <span key={`${b.orderId}-${item.ticketTypeName}`}>
                              {item.ticketTypeName} ×{item.quantity}
                              {i < b.items.length - 1 && ", "}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatDate(b.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <OrderStatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
                    <span>
                      Menampilkan {(currentPage - 1) * BUYERS_PAGE_SIZE + 1}–{Math.min(currentPage * BUYERS_PAGE_SIZE, buyers.length)} dari {buyers.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border p-1 hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                        aria-label="Sebelumnya"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="px-1">Hal {currentPage} / {totalPages}</span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-md border p-1 hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                        aria-label="Berikutnya"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "batches" ? (
        <div className="space-y-4">
          {batchesData?.summary && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ringkasan Kehadiran Tiket Fisik (Masuk / Keluar)</p>
                <p className="text-lg font-bold tabular-nums">
                  {batchesData.summary.enteredCount} / {batchesData.summary.totalCapacity}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Total Kapasitas: {batchesData.summary.totalCapacity}
              </span>
            </div>
          )}
          {batchesQueryError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {(batchesQueryError as Error).message || "Gagal memuat batch tiket fisik"}
            </p>
          )}
          {exportError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {exportError}
            </p>
          )}
          <div className="rounded-lg border overflow-hidden">
            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <QrCode className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Belum ada tiket fisik yang di-generate</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Tiket fisik di-generate oleh Admin Hectix. Setelah dibuat, file Excel QR siap cetak dapat diunduh di sini.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama Batch</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Jenis Tiket</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tujuan &amp; Mode</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status Kode</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Dibuat Oleh</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Aksi Excel</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                          {b.accessType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.purpose} • {b.activationMode === "ON_HANDOVER" ? "On Handover" : "Ready"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{b.quantity}</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                        Stock: {b.stockCount} • Active: {b.activeCount}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-foreground" title={b.generatedByEmail || undefined}>
                          {b.generatedByName || b.generatedByEmail || "Admin"}
                        </div>
                        <div className="text-muted-foreground">
                          {formatDate(b.generatedAt)}
                          {b.exportCount > 0 &&
                            ` • ${b.exportCount}× unduh${b.exportedByName ? ` (${b.exportedByName})` : ""}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingBatchId === b.id}
                          onClick={() => handleExportBatch(b)}
                        >
                          <Download className="size-3.5 mr-1.5" />
                          {downloadingBatchId === b.id ? "Menyiapkan…" : "Cetak Excel QR"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <BatchHistoryCard history={batchHistory} />
        </div>
      ) : (
        <div className="space-y-6">
          {volunteersQueryError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {(volunteersQueryError as Error).message || "Gagal memuat daftar volunteer"}
            </p>
          )}
          <div className="rounded-lg border overflow-hidden">
            {volunteers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Belum ada petugas scanner (volunteer)</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Daftar petugas scanner yang ditugaskan pada event ini akan muncul di sini.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama Petugas</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status Akses</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Diundang Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {volunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{v.userName || "Belum login"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.email}</td>
                      <td className="px-4 py-3">
                        <VolunteerStatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-foreground" title={v.invitedByEmail || undefined}>
                          {v.invitedByName || v.invitedByEmail || "Admin"}
                        </div>
                        <div className="text-muted-foreground">{formatDate(v.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <VolunteerHistoryCard history={volunteerHistory} />
        </div>
      )}
    </div>
  );
}
