"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Instagram, MapPin } from "lucide-react";

type UserDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    location: string | null;
    gender: string | null;
    instagram: string | null;
    tiktok: string | null;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    totalSpent: number;
  };
  orders: {
    id: string;
    referenceNumber: string;
    status: string;
    total: number;
    createdAt: string;
    eventName: string;
    orgName: string;
  }[];
  ordersPage: number;
  ordersTotalPages: number;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ordersPage, setOrdersPage] = useState(1);

  const { data, isLoading, isError } = useQuery<UserDetail>({
    queryKey: ["admin-user", id, ordersPage],
    queryFn: async ({ signal }) => {
      const r = await fetch(`/api/users/${id}?page=${ordersPage}`, { signal });
      if (r.status === 404) throw new Error("not-found");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6 w-full">
      <button
        onClick={() => router.push("/users")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to users
      </button>

      {isError ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          User not found.
        </div>
      ) : isLoading || !data ? (
        <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="flex items-start gap-4 rounded-lg border bg-white p-5">
            {data.user.image ? (
              <img src={data.user.image} alt="" className="size-14 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                {data.user.name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight truncate">{data.user.name}</h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {data.user.role}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{data.user.email}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {data.user.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {data.user.location}</span>
                )}
                {data.user.instagram && (
                  <span className="inline-flex items-center gap-1"><Instagram className="size-3" /> @{data.user.instagram}</span>
                )}
                <span>Joined {formatDate(data.user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Total orders</p>
              <p className="text-2xl font-semibold mt-1">{data.stats.totalOrders}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Paid orders</p>
              <p className="text-2xl font-semibold mt-1">{data.stats.paidOrders}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold mt-1 text-amber-600">{data.stats.pendingOrders}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(data.stats.totalSpent)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">paid orders</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-2">Orders</h2>
            {data.orders.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{o.eventName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{o.orgName}</td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatCurrency(o.total)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {STATUS_LABELS[o.status] ?? o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.ordersTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Page {ordersPage} of {data.ordersTotalPages}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrdersPage((p) => p - 1)}
                        disabled={ordersPage === 1}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="size-4" /> Prev
                      </button>
                      <button
                        onClick={() => setOrdersPage((p) => p + 1)}
                        disabled={ordersPage >= data.ordersTotalPages}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
