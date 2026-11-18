"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Download,
  Plus,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

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
  organizationId: string;
  organizationName: string;
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
  generatedAt: string;
  exportedAt: string | null;
  exportCount: number;
  stockCount: number;
  activeCount: number;
  voidCount: number;
};

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

export default function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"main" | "batches">("main");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [accessType, setAccessType] = useState("DAY_1");
  const [quantity, setQuantity] = useState("100");
  const [batchName, setBatchName] = useState("");
  const [purpose, setPurpose] = useState("ALLOCATION");
  const [activationMode, setActivationMode] = useState("ON_HANDOVER");
  const [generating, setGenerating] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [downloadingBatchId, setDownloadingBatchId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: () => fetch(`/api/events/${id}`).then((r) => r.json()),
  });

  const { data: batchesData } = useQuery<{ batches: PhysicalBatch[] }>({
    queryKey: ["admin-event-batches", id],
    queryFn: () => fetch(`/api/events/${id}/batches`).then((r) => r.json()),
  });

  const ev: EventDetail | undefined = data?.event;
  const stats: TicketStat[] = data?.stats ?? [];
  const buyers: Buyer[] = data?.buyers ?? [];
  const batches: PhysicalBatch[] = batchesData?.batches ?? [];

  async function handleGenerateBatch(e: React.FormEvent) {
    e.preventDefault();
    setBatchError(null);
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1 || qty > 10000) {
      setBatchError("Jumlah tiket harus antara 1 sampai 10.000");
      return;
    }
    setGenerating(true);
    try {
      const requestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `batch-${Date.now()}`;
      const res = await fetch(`/api/events/${id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          name: batchName.trim(),
          accessType,
          purpose,
          activationMode,
          quantity: qty,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBatchError(json.error || "Gagal membuat batch tiket fisik");
        return;
      }
      setBatchName("");
      setGenerateOpen(false);
      setActiveTab("batches");
      queryClient.invalidateQueries({ queryKey: ["admin-event-batches", id] });
    } catch {
      setBatchError("Gagal menghubungi server");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportBatch(batch: PhysicalBatch) {
    setDownloadingBatchId(batch.id);
    setBatchError(null);
    try {
      const res = await fetch(`/api/events/${id}/batches/${batch.id}/export`);
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hectix-qr-${batch.accessType.toLowerCase()}-${batch.id.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["admin-event-batches", id] });
    } catch {
      setBatchError("Gagal mengunduh file Excel QR");
    } finally {
      setDownloadingBatchId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="space-y-4">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Events
        </Link>
        <p className="text-sm text-muted-foreground">Event tidak ditemukan.</p>
      </div>
    );
  }

  const totalSold = stats.reduce((sum, t) => sum + t.sold, 0);
  const totalCapacity = stats.reduce((sum, t) => sum + t.capacity, 0);
  const totalRevenue = stats.reduce((sum, t) => sum + t.revenue, 0);

  const totalPages = Math.max(1, Math.ceil(buyers.length / BUYERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedBuyers = buyers.slice((currentPage - 1) * BUYERS_PAGE_SIZE, currentPage * BUYERS_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        Events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{ev.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ev.status === "published" ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-muted text-muted-foreground ring-border"}`}>
              {ev.status === "published" ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              setBatchError(null);
              setGenerateOpen(true);
            }}
          >
            <Plus className="size-4 mr-1.5" />
            Generate Tiket
          </Button>
          <Link
            href={`/orgs/${ev.organizationId}`}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Building2 className="size-4" />
            {ev.organizationName}
          </Link>
        </div>
      </div>

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
            <span>List Gen Tiket</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {batches.length}
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
              {buyers.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {batchError && !generateOpen && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {batchError}
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
                  Klik tombol Generate Tiket untuk membuat kode QR fisik dan mengunduh file Excel siap cetak.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setBatchError(null);
                    setGenerateOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-1.5" />
                  Generate Tiket
                </Button>
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
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Waktu Dibuat</th>
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
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {formatDate(b.generatedAt)}
                        {b.exportCount > 0 && ` (${b.exportCount}× unduh)`}
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
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tiket Fisik (QR)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerateBatch} className="space-y-4 pt-2">
            {batchError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {batchError}
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="batch-access-type" className="text-sm font-medium">
                Jenis Tiket / Akses
              </label>
              <Select value={accessType} onValueChange={setAccessType}>
                <SelectTrigger id="batch-access-type" className="w-full">
                  <SelectValue placeholder="Pilih jenis tiket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_1">Day 1</SelectItem>
                  <SelectItem value="DAY_2">Day 2</SelectItem>
                  <SelectItem value="ALL_DAYS">2-Day / All Days</SelectItem>
                  {stats.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="batch-quantity" className="text-sm font-medium">
                Jumlah Tiket (Quantity)
              </label>
              <Input
                id="batch-quantity"
                type="number"
                min={1}
                max={10000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Contoh: 100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="batch-purpose" className="text-sm font-medium">
                  Tujuan Batch
                </label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger id="batch-purpose" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOCATION">Alokasi Utama</SelectItem>
                    <SelectItem value="RESERVE">Cadangan (Buffer)</SelectItem>
                    <SelectItem value="REPLACEMENT">Pengganti (Replacement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="batch-activation" className="text-sm font-medium">
                  Mode Aktivasi
                </label>
                <Select value={activationMode} onValueChange={setActivationMode}>
                  <SelectTrigger id="batch-activation" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_HANDOVER">Aktif Saat Penukaran / OTS</SelectItem>
                    <SelectItem value="READY_ON_GENERATE">Langsung Aktif Sejak Dicetak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="batch-name" className="text-sm font-medium">
                Label Batch (Opsional)
              </label>
              <Input
                id="batch-name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Misal: Gelang Tahap 1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={generating}>
                {generating ? "Membuat…" : "Generate Tiket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
