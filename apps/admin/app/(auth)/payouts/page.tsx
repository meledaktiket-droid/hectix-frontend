"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Wallet, ChevronRight, ChevronLeft } from "lucide-react";

type Payout = {
  id: string;
  orgName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: string;
  createdAt: string;
};

type PagedResponse = {
  data: Payout[];
  total: number;
  page: number;
  totalPages: number;
};

type StatusStyle = { bg: string; text: string; dot: string; label: string };

const STATUS_STYLES: Record<string, StatusStyle> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending" },
  processed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Processed" },
  rejected:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Rejected" },
};

const FALLBACK_STYLE: StatusStyle = { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" };

const FILTER_OPTIONS = [
  { value: "",          label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "rejected",  label: "Rejected" },
];

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? FALLBACK_STYLE;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function PayoutsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isFetching, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["admin-payouts", { status: statusFilter, page }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const r = await fetch(`/api/payouts?${params}`, { signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: keepPreviousData,
  });

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const payouts = result?.data ?? [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        {result && (
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter
              ? `${result.total} ${(STATUS_STYLES[statusFilter] ?? FALLBACK_STYLE).label.toLowerCase()}`
              : `${result.total} total`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1 ${
              statusFilter === opt.value
                ? "bg-[#2a8af6] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">Failed to load payouts</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-2"
            style={{ backgroundColor: "#2a8af6" }}
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bank</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requested</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-32 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-24 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-28 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-20 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-16 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : payouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Wallet className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {statusFilter
              ? `No ${(STATUS_STYLES[statusFilter] ?? FALLBACK_STYLE).label.toLowerCase()} payouts`
              : "No payouts yet"}
          </p>
          {statusFilter ? (
            <button
              onClick={() => handleFilterChange("")}
              className="mt-2 text-xs text-[#2a8af6] hover:underline focus-visible:outline-none focus-visible:underline"
            >
              Clear filter
            </button>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              When organizers request payouts, they&apos;ll appear here.
            </p>
          )}
        </div>
      ) : (
        <div className={isFetching ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bank</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requested</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr
                    key={p.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View payout for ${p.orgName}`}
                    className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a8af6]"
                    onClick={() => router.push(`/payouts/${p.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/payouts/${p.id}`); }}
                  >
                    <td className="px-4 py-3 max-w-0 w-full">
                      <p className="font-medium truncate">{p.orgName}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {p.bankName} · ••••{p.accountNumber.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 w-px">
                      <ChevronRight className="size-4 text-foreground/35" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && result.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Page {page} of {result.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === result.totalPages}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
