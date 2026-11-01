"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Building2, ChevronRight, ChevronLeft } from "lucide-react";

type Org = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  logo: string | null;
  createdAt: string;
};

type PagedResponse = {
  data: Org[];
  total: number;
  page: number;
  totalPages: number;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending" },
  review:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "In Review" },
  active:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Active" },
  rejected:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Rejected" },
  suspended: { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  label: "Suspended" },
};

const FILTER_OPTIONS = [
  { value: "",          label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "review",    label: "In Review" },
  { value: "active",    label: "Active" },
  { value: "rejected",  label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const AVATAR_COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-700"    },
  { bg: "bg-purple-100",  text: "text-purple-700"  },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-indigo-100",  text: "text-indigo-700"  },
];

function orgAvatarColor(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function OrgsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isFetching, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["admin-orgs", { status: statusFilter, page }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const r = await fetch(`/api/orgs?${params}`, { signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: keepPreviousData,
  });

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const orgs = result?.data ?? [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
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
          <p className="text-sm font-medium">Failed to load organizations</p>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 shrink-0 rounded-md bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                        <div className="h-2.5 w-20 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                      </div>
                    </div>
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
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Building2 className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {statusFilter
              ? `No ${STATUS_STYLES[statusFilter]?.label.toLowerCase() ?? statusFilter} organizations`
              : "No organizations have registered yet"}
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
              Once organizations complete onboarding, they'll appear here.
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const avatar = orgAvatarColor(org.id);
                  return (
                    <tr
                      key={org.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${org.name}`}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a8af6]"
                      onClick={() => router.push(`/orgs/${org.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/orgs/${org.id}`); }}
                    >
                      <td className="px-4 py-3 max-w-0 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt=""
                              className="size-8 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${avatar.bg} ${avatar.text}`}>
                              {org.name[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{org.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{org.slug ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(org.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="px-4 py-3 w-px">
                        <ChevronRight className="size-4 text-foreground/35" />
                      </td>
                    </tr>
                  );
                })}
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
