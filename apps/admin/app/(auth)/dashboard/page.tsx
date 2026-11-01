"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Ticket, Users, ShoppingCart } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type DashboardData = {
  stats: {
    totalOrgs: number;
    totalEvents: number;
    totalUsers: number;
    totalOrders: number;
    totalGmv: number;
    ticketSales: number;
    taxCollected: number;
    serviceFeeProfit: number;
    platformFeeProfit: number;
    estimatedMidtransCost: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topEvents: { eventName: string; revenue: number }[];
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

const STATUS_META: Record<string, { color: string; label: string }> = {
  paid: { color: EMERALD, label: "Lunas" },
  pending_payment: { color: AMBER, label: "Menunggu" },
  cancelled: { color: "#9ca3af", label: "Dibatalkan" },
  expired: { color: "#d1d5db", label: "Kedaluwarsa" },
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const { stats, revenueByDay, ordersByStatus, topEvents } = data;

  const grossProfit = stats.serviceFeeProfit + stats.platformFeeProfit;
  const netProfit = grossProfit - stats.estimatedMidtransCost;
  const takeRate = stats.totalGmv > 0 ? (netProfit / stats.totalGmv) * 100 : 0;
  const pct = (n: number) => (stats.totalGmv > 0 ? (n / stats.totalGmv) * 100 : 0);

  const scale = [
    { icon: Building2, label: "Organizer", value: stats.totalOrgs, href: "/orgs" },
    { icon: Ticket, label: "Acara", value: stats.totalEvents, href: "/events" },
    { icon: Users, label: "Pengguna", value: stats.totalUsers, href: "/users" },
    { icon: ShoppingCart, label: "Pesanan lunas", value: stats.totalOrders, href: "/orders" },
  ];

  const statusTotal = ordersByStatus.reduce((acc, s) => acc + s.count, 0);
  const maxEventRevenue = topEvents.reduce((acc, e) => Math.max(acc, e.revenue), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ringkasan platform sepanjang waktu</p>
        </div>
      </header>

      <section>
        <div className="grid gap-8 sm:grid-cols-3">
          <Figure
            label="GMV"
            big={formatShortCurrency(stats.totalGmv)}
            exact={formatCurrency(stats.totalGmv)}
            note="Total uang yang mengalir"
          />
          <Figure
            label="Profit bersih"
            big={formatShortCurrency(netProfit)}
            exact={formatCurrency(netProfit)}
            accent={BLUE}
          >
            <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
              <LedgerRow label="Biaya layanan" value={formatCurrency(stats.serviceFeeProfit)} sign="+" />
              <LedgerRow label="Biaya platform" value={formatCurrency(stats.platformFeeProfit)} sign="+" />
              <LedgerRow label="Biaya Midtrans (est.)" value={formatCurrency(stats.estimatedMidtransCost)} sign="−" />
            </dl>
          </Figure>
          <Figure
            label="Take rate"
            big={`${takeRate.toFixed(1).replace(".", ",")}%`}
            note="Profit bersih ÷ GMV"
          />
        </div>

        {stats.totalGmv > 0 && (
          <div className="mt-7">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <span className="h-full" style={{ width: `${pct(stats.ticketSales)}%`, background: EMERALD }} title="Penyelenggara" />
              <span className="h-full" style={{ width: `${pct(stats.taxCollected)}%`, background: AMBER }} title="Pajak" />
              <span className="h-full" style={{ width: `${pct(stats.serviceFeeProfit)}%`, background: BLUE }} title="Biaya layanan" />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <LegendItem color={EMERALD} label="Penyelenggara" value={formatCurrency(stats.ticketSales)} />
              <LegendItem color={AMBER} label="Pajak" value={formatCurrency(stats.taxCollected)} />
              <LegendItem color={BLUE} label="Biaya layanan" value={formatCurrency(stats.serviceFeeProfit)} />
            </div>
          </div>
        )}
      </section>

      <section className="border-t pt-6">
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          {scale.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-2.5 rounded-md transition-colors hover:text-[#2a8af6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-2"
            >
              <s.icon className="size-4 shrink-0 text-muted-foreground/70" />
              <div className="flex items-baseline gap-1.5">
                <dd className="text-lg font-semibold leading-none tabular-nums">{s.value.toLocaleString("id-ID")}</dd>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
              </div>
            </Link>
          ))}
        </dl>
      </section>

      <section>
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

function Figure({
  label, big, exact, note, accent, children,
}: {
  label: string; big: string; exact?: string; note?: string; accent?: string; children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className="mt-1.5 text-4xl font-semibold tracking-tight tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {big}
      </p>
      {exact && <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{exact}</p>}
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      {children}
    </div>
  );
}

function LedgerRow({ label, value, sign }: { label: string; value: string; sign: "+" | "−" }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{sign}{value}</span>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
      <span className="tabular-nums text-foreground">{value}</span>
    </span>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
            <div className="h-9 w-32 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
          </div>
        ))}
      </div>
      <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
      <div className="border-t pt-6">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-28 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
      <div className="h-60 w-full animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3.5">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-2 w-full animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
