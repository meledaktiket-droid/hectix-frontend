"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDateID } from "@/lib/format";
import type { ProfileActivity } from "./profile-client";

const PAGE_SIZE = 5;

type ActivityPage = { activity: ProfileActivity[]; nextOffset: number | null };

export function ProfileActivityList({ onOpen }: { onOpen: (orderId: string) => void }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["profile-activity"],
      queryFn: ({ pageParam }): Promise<ActivityPage> =>
        fetch(`/api/profile/activity?limit=${PAGE_SIZE}&offset=${pageParam}`).then((r) => r.json()),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    });

  const activity = data?.pages.flatMap((p) => p.activity) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-2xl font-bold text-[#0C2D57]">Aktivitas Anda</h2>
      <div className="mt-4 space-y-4 border-t border-border pt-4">
        {isLoading && <p className="py-12 text-center text-neutral-500">Memuat…</p>}
        {!isLoading && activity.length === 0 && (
          <p className="py-12 text-center text-neutral-500">Belum ada aktivitas tiket.</p>
        )}
        {activity.map((o) => (
          <div
            key={o.orderId}
            onClick={() => onOpen(o.orderId)}
            className="cursor-pointer rounded-xl border border-border bg-white transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-4 p-4">
              {o.eventBannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.eventBannerUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-bold text-neutral-900">{o.eventName}</h3>
                {o.tiers.map((t, i) => (
                  <p key={i} className="text-[#424242]">
                    {t.ticketTypeName} <span className="font-semibold text-[#a853ba]">x{t.quantity}</span>
                  </p>
                ))}
                <p className="text-sm text-neutral-500">{formatDateID(o.eventStartsAt)}</p>
              </div>
              <div className="hidden shrink-0 flex-col items-center gap-2 border-l border-border pl-6 md:flex md:w-56">
                <span className="text-lg font-bold text-[#2a8af6]">{o.ticketCount} Tiket</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(o.orderId);
                  }}
                  className="w-full rounded-full bg-[#0C2D57] px-8 py-2.5 font-bold text-white hover:bg-slate-900"
                >
                  Lihat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full border border-[#0C2D57] px-6 py-2.5 font-semibold text-[#0C2D57] transition-colors hover:bg-[#0C2D57] hover:text-white disabled:opacity-60"
          >
            {isFetchingNextPage ? "Memuat…" : "Muat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
}
