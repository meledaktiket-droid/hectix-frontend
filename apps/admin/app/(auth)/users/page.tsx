"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Users as UsersIcon, ChevronRight, ChevronLeft } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

type PagedResponse = {
  data: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

const AVATAR_COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-700"    },
  { bg: "bg-purple-100",  text: "text-purple-700"  },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-indigo-100",  text: "text-indigo-700"  },
];

function avatarColor(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQ(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: result, isLoading, isFetching, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ["admin-users", { q, page }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set("q", q);
      const r = await fetch(`/api/users?${params}`, { signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: keepPreviousData,
  });

  const users = result?.data ?? [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        {result && (
          <p className="mt-1 text-sm text-muted-foreground">
            {q ? `${result.total} matching` : `${result.total} total`}
          </p>
        )}
      </div>

      <input
        type="search"
        placeholder="Search name or email…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a8af6] focus-visible:ring-offset-1"
      />

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">Failed to load users</p>
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
        <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <UsersIcon className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">{q ? "No users match your search" : "No users yet"}</p>
          {q && (
            <button
              onClick={() => setSearchInput("")}
              className="mt-2 text-xs text-[#2a8af6] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className={isFetching ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Orders</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total spent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const avatar = avatarColor(u.id);
                  return (
                    <tr
                      key={u.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${u.name}`}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a8af6]"
                      onClick={() => router.push(`/users/${u.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/users/${u.id}`); }}
                    >
                      <td className="px-4 py-3 max-w-0 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          {u.image ? (
                            <img src={u.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatar.bg} ${avatar.text}`}>
                              {u.name[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize text-muted-foreground">{u.role}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{u.orderCount}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{formatCurrency(u.totalSpent)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("id-ID")}
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
              <p className="text-muted-foreground">Page {page} of {result.totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === result.totalPages}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
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
