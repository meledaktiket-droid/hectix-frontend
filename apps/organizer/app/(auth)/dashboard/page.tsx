"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { ArrowRight, Ticket, ShoppingCart, CalendarDays, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type DashboardData = {
  stats: { totalRevenue: number; totalOrders: number; totalEvents: number; totalTicketsSold: number };
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topEvents: { eventName: string; revenue: number }[];
  upcomingEvents: { id: string; name: string; startsAt: string; city: string | null; sold: number; capacity: number }[];
};

const BLUE = "#2a8af6";
const PURPLE = "#a853ba";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function trim(x: number) {
  return x.toFixed(1).replace(/\.0$/, "").replace(".", ",");
}
function formatShortCurrency(n: number) {
  if (n >= 1_000_000_000_000) return `Rp ${trim(n / 1_000_000_000_000)}T`;
  if (n >= 1_000_000_000) return `Rp ${trim(n / 1_000_000_000)}M`;
  if (n >= 1_000_000) return `Rp ${trim(n / 1_000_000)}jt`;
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`;
  return `Rp ${n}`;
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  paid: { color: EMERALD, label: "Lunas" },
  pending_payment: { color: AMBER, label: "Menunggu" },
  cancelled: { color: "#9ca3af", label: "Dibatalkan" },
  expired: { color: "#d1d5db", label: "Kedaluwarsa" },
};

function CreateOrgPrompt() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Buat organisasi dulu</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Organisasi adalah ruang kerja tim kamu.
      </p>
      <Link href="/create-org" className="mt-8 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Mulai <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["organizer-dashboard", activeOrg?.id],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    enabled: !!activeOrg?.id,
  });

  if (isPending) return <DashboardSkeleton />;
  if (!activeOrg) return <CreateOrgPrompt />;

  if (isLoading || !data) return <DashboardSkeleton name={activeOrg.name} />;

  const { stats, revenueByDay, ordersByStatus, topEvents, upcomingEvents } = data;

  const activity = [
    { icon: Ticket, label: "Tiket terjual", value: stats.totalTicketsSold },
    { icon: ShoppingCart, label: "Pesanan lunas", value: stats.totalOrders },
    { icon: CalendarDays, label: "Acara", value: stats.totalEvents },
  ];

  const statusTotal = ordersByStatus.reduce((acc, s) => acc + s.count, 0);
  const maxEventRevenue = topEvents.reduce((acc, e) => Math.max(acc, e.revenue), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">{activeOrg.name}</p>
      </header>

      <section className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total pendapatan</p>
          <p className="mt-1.5 text-4xl font-semibold tracking-tight tabular-nums" style={{ color: BLUE }}>
            {formatShortCurrency(stats.totalRevenue)}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {activity.map((a) => (
            <div key={a.label} className="flex items-center gap-2.5">
              <a.icon className="size-4 shrink-0 text-muted-foreground/70" />
              <div className="flex items-baseline gap-1.5">
                <dd className="text-lg font-semibold leading-none tabular-nums">{a.value.toLocaleString("id-ID")}</dd>
                <dt className="text-sm text-muted-foreground">{a.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t pt-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Pendapatan</h2>
          <span className="text-xs text-muted-foreground">30 hari terakhir</span>
        </div>
        {revenueByDay.length === 0 ? (
          <EmptyPanel>Belum ada pendapatan dalam 30 hari terakhir.</EmptyPanel>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="oklch(0.922 0 0)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date" tickLine={false} axisLine={false}
                tick={{ fontSize: 11, fill: "oklch(0.556 0 0)" }}
                tickFormatter={formatDay} minTickGap={24}
              />
              <YAxis
                tickLine={false} axisLine={false} width={56}
                tick={{ fontSize: 11, fill: "oklch(0.556 0 0)" }}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip
                cursor={{ stroke: "oklch(0.922 0 0)" }}
                contentStyle={{ borderRadius: 10, border: "1px solid oklch(0.922 0 0)", fontSize: 12, boxShadow: "0 4px 12px oklch(0 0 0 / 0.06)" }}
                formatter={(v) => [formatCurrency(v as number), "Pendapatan"]}
                labelFormatter={(l) => formatDay(l as string)}
              />
              <Area type="monotone" dataKey="revenue" stroke={BLUE} strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium">Acara mendatang</h2>
          <ul className="overflow-hidden rounded-xl border divide-y">
            {upcomingEvents.map((ev) => {
              const through = ev.capacity > 0 ? Math.min(100, (ev.sold / ev.capacity) * 100) : 0;
              return (
                <li key={ev.id}>
                  <Link href={`/events/${ev.id}`} className="group block px-4 py-3.5 transition-colors hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ev.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(ev.startsAt)}{ev.city ? ` · ${ev.city}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {ev.sold.toLocaleString("id-ID")}
                            <span className="text-muted-foreground"> / {ev.capacity.toLocaleString("id-ID")}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{through.toFixed(0)}% terjual</p>
                        </div>
                        <ChevronRight className="size-4 text-foreground/30 transition-colors group-hover:text-foreground/60" />
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full" style={{ width: `${through}%`, background: BLUE }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Pesanan menurut status</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{statusTotal.toLocaleString("id-ID")} total</span>
          </div>
          {statusTotal === 0 ? (
            <EmptyPanel>Belum ada pesanan.</EmptyPanel>
          ) : (
            <ul className="space-y-3.5">
              {ordersByStatus
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const meta = STATUS_META[s.status] ?? { color: "#d1d5db", label: s.status };
                  const share = statusTotal > 0 ? (s.count / statusTotal) * 100 : 0;
                  return (
                    <li key={s.status} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 truncate text-foreground">{meta.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full" style={{ width: `${share}%`, background: meta.color }} />
                      </div>
                      <span className="w-12 shrink-0 text-right tabular-nums">{s.count.toLocaleString("id-ID")}</span>
                      <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{share.toFixed(0)}%</span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium">Acara teratas</h2>
          {topEvents.length === 0 ? (
            <EmptyPanel>Belum ada data acara.</EmptyPanel>
          ) : (
            <ul className="space-y-3.5">
              {topEvents.map((e, i) => {
                const share = maxEventRevenue > 0 ? (e.revenue / maxEventRevenue) * 100 : 0;
                return (
                  <li key={e.eventName} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <span className="mr-2 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                        {e.eventName}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatShortCurrency(e.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full" style={{ width: `${share}%`, background: PURPLE }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function DashboardSkeleton({ name }: { name?: string }) {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {name ? (
          <p className="mt-1 text-sm text-muted-foreground">{name}</p>
        ) : (
          <div className="mt-1 h-4 w-32 animate-pulse rounded bg-muted" />
        )}
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-9 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-5 w-28 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
      <div className="border-t pt-8">
        <div className="h-60 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
