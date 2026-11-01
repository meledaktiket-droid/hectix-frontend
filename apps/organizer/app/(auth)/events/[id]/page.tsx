"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "../../../../lib/auth-client";
import { Calendar, MapPin, Edit2, Users, ChevronLeft, ChevronRight } from "lucide-react";

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
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [page, setPage] = useState(1);

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

  const ev: EventDetail | undefined = eventData?.event;
  const stats: TicketStat[] = ordersData?.stats ?? [];
  const buyers: Buyer[] = ordersData?.buyers ?? [];

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
  );
}
