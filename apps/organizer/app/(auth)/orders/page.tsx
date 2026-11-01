"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@repo/ui/dropdown-menu";
import { ShoppingCart, Download } from "lucide-react";

type OrderItem = { ticketTypeName: string; quantity: number };
type Order = {
  id: string;
  status: string;
  subtotal: number;
  voucherCode: string | null;
  voucherDiscount: number;
  paymentMethod: string;
  bank: string | null;
  createdAt: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  referenceNumber: string;
  items: OrderItem[];
};

type OrdersResponse = {
  orders: Order[];
  total: number;
  summary: { revenue: number; counts: Record<string, number>; voucherCount: number; discountTotal: number };
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  pending_payment: "Pending",
  cancelled: "Cancelled",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending_payment: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-500",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function paymentLabel(method: string, bank: string | null) {
  if (method === "qris") return "QRIS";
  if (method === "va_bank") return bank ? `${bank.toUpperCase()} VA` : "Bank Transfer";
  return method;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function OrdersPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qs = searchParams.toString();

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders", activeOrg?.id, qs],
    queryFn: () => fetch(`/api/orders?${qs}`).then((r) => r.json()),
    enabled: !!activeOrg?.id,
    placeholderData: keepPreviousData,
  });

  const { data: eventsData } = useQuery<{ events: { id: string; name: string }[] }>({
    queryKey: ["events-min", activeOrg?.id],
    queryFn: () => fetch("/api/events").then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary ?? { revenue: 0, counts: {}, voucherCount: 0, discountTotal: 0 };
  const paidCount = summary.counts.paid ?? 0;
  const pendingCount = summary.counts.pending_payment ?? 0;

  const params = new URLSearchParams(qs);

  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasFilters = ["status", "eventId", "from", "to", "q"].some((k) => params.get(k));

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(qs);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function setParams(entries: Record<string, string | null>) {
    const next = new URLSearchParams(qs);
    for (const [key, value] of Object.entries(entries)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  useEffect(() => {
    if (searchInput === (params.get("q") ?? "")) return;
    const t = setTimeout(() => setParam("q", searchInput || null), 300);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(preset: string) {
    const today = new Date();
    const iso = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
    if (preset === "all") { setParams({ from: null, to: null }); return; }
    if (preset === "today") { setParams({ from: iso(today), to: iso(today) }); return; }
    if (preset === "7d") {
      const from = new Date(today); from.setDate(from.getDate() - 6);
      setParams({ from: iso(from), to: iso(today) }); return;
    }
    if (preset === "month") {
      setParams({ from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) });
      return;
    }
    if (preset === "year") {
      setParams({ from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) });
      return;
    }
  }

  const datePreset = (() => {
    const from = params.get("from");
    const to = params.get("to");
    if (!from && !to) return "all";
    const today = new Date();
    const iso = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
    const t = iso(today);
    if (from === t && to === t) return "today";
    const week = new Date(today); week.setDate(week.getDate() - 6);
    if (from === iso(week) && to === t) return "7d";
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (from === iso(monthStart) && to === t) return "month";
    const yearStart = new Date(today.getFullYear(), 0, 1);
    if (from === iso(yearStart) && to === t) return "year";
    return "custom";
  })();

  const [exporting, setExporting] = useState<null | "xlsx" | "pdf">(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format); setExportError(null);
    try {
      const res = await fetch(`/api/orders/export?format=${format}&${qs}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch {
      setExportError("Export failed — please try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All ticket orders across your events.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={total === 0 || exporting !== null}>
                <Download className="size-4 mr-1.5" />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Export to Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Export to PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {exportError ? <p className="text-xs text-red-600">{exportError}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Revenue (paid)</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(summary.revenue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-2xl font-semibold mt-1">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{paidCount} paid</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">awaiting payment</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Vouchers used</p>
          <p className="text-2xl font-semibold mt-1">{summary.voucherCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(summary.discountTotal)} total discount</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search buyer or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select value={params.get("status") ?? "all"}
          onValueChange={(v) => setParam("status", v === "all" ? null : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending_payment">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={params.get("eventId") ?? "all"}
          onValueChange={(v) => setParam("eventId", v === "all" ? null : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {(eventsData?.events ?? []).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={datePreset} onValueChange={applyPreset}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="year">This year</SelectItem>
            <SelectItem value="custom">Custom…</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input type="date" value={params.get("from") ?? ""}
            onChange={(e) => setParam("from", e.target.value || null)}
            className="rounded-md border px-2 py-1 text-sm" />
          <span className="text-sm text-muted-foreground">to</span>
          <input type="date" value={params.get("to") ?? ""}
            onChange={(e) => setParam("to", e.target.value || null)}
            className="rounded-md border px-2 py-1 text-sm" />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  {hasFilters ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">No orders match these filters</p>
                      <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); router.replace(pathname); }}>
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <ShoppingCart className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No orders yet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Orders will appear here once tickets are purchased.
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{order.buyerName}</span>
                      <span className="text-xs text-muted-foreground">{order.buyerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{order.eventName}</TableCell>
                  <TableCell className="text-sm">
                    {order.items.map((i) => `${i.quantity}× ${i.ticketTypeName}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {paymentLabel(order.paymentMethod, order.bank)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.voucherCode ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{order.voucherCode}</span>
                        {order.voucherDiscount > 0 && (
                          <span className="text-xs text-muted-foreground">−{formatCurrency(order.voucherDiscount)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(order.subtotal)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
        <span>{total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => setParam("page", String(page - 1))}>Prev</Button>
          <span>Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" disabled={page >= pageCount}
            onClick={() => setParam("page", String(page + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
