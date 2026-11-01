"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Ticket, ChevronRight, ChevronLeft, Calendar, MapPin } from "lucide-react";

type Event = {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  city: string | null;
  venueName: string | null;
  organizationId: string;
  organizationName: string;
  createdAt: string;
};

type PagedResponse = {
  data: Event[];
  total: number;
  page: number;
  totalPages: number;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft:     { bg: "bg-muted",       text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Draft" },
  published: { bg: "bg-emerald-50",  text: "text-emerald-700",      dot: "bg-emerald-500",      label: "Published" },
};

const FILTER_OPTIONS = [
  { value: "",          label: "All" },
  { value: "draft",     label: "Draft" },
  { value: "published", label: "Published" },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isFetching, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["admin-events", { status: statusFilter, page }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const r = await fetch(`/api/events?${params}`, { signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: keepPreviousData,
  });

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const events = result?.data ?? [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        {result && (
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter
              ? `${result.total} ${STATUS_STYLES[statusFilter]?.label.toLowerCase() ?? statusFilter}`
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
          <p className="text-sm font-medium">Failed to load events</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-48 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-28 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-24 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
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
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Ticket className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {statusFilter ? `No ${STATUS_STYLES[statusFilter]?.label.toLowerCase() ?? statusFilter} events` : "No events yet"}
          </p>
          {statusFilter && (
            <button
              onClick={() => handleFilterChange("")}
              className="mt-2 text-xs text-[#2a8af6] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className={isFetching ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${ev.name}`}
                    className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a8af6]"
                    onClick={() => router.push(`/events/${ev.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/events/${ev.id}`); }}
                  >
                    <td className="px-4 py-3 max-w-0 w-full">
                      <p className="font-medium truncate">{ev.name}</p>
                      {(ev.venueName || ev.city) && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 shrink-0" />
                          {[ev.venueName, ev.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {ev.organizationName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 shrink-0" />
                        {formatDate(ev.startsAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={ev.status} />
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
              <p className="text-muted-foreground">Page {page} of {result.totalPages}</p>
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
