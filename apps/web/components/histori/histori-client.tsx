"use client"

import Image from "next/image"
import { useInfiniteQuery } from "@tanstack/react-query"
import { OrderCard, type HistoriOrder } from "./order-card"
import { FavoriteCard, type FavoriteEvent } from "./favorite-card"

const PAGE_SIZE = 5

const EMPTY_STATES = {
  aktif: {
    icon: "/3dicons-notebook.png",
    title: "Tiket Aktif Kosong",
    lines: ["Belum ada tiket untuk event mendatang.", "Jelajahi event dan pesan tiket Anda sekarang."],
  },
  selesai: {
    icon: "/3dicons-play.png",
    title: "Belum Ada Riwayat Event",
    lines: ["Anda belum memiliki riwayat event.", "Tiket yang sudah digunakan akan muncul di sini."],
  },
  favorit: {
    icon: "/3dicons-heart.png",
    title: "Belum Ada Riwayat Event",
    lines: ["Anda belum memiliki riwayat event.", "Tiket yang sudah digunakan akan muncul di sini."],
  },
} as const

function EmptyState({ state }: { state: (typeof EMPTY_STATES)[keyof typeof EMPTY_STATES] }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <Image src={state.icon} width={96} height={96} alt="" className="h-24 w-24 object-contain" />
      <h2 className="mt-8 text-2xl md:text-3xl font-bold text-[#0C2D57]">{state.title}</h2>
      <div className="mt-4 text-[#303030]">
        {state.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="py-20 text-center text-neutral-500">{text}</div>
}

function LoadMore({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-full border border-[#0C2D57] px-6 py-2.5 font-semibold text-[#0C2D57] transition-colors hover:bg-[#0C2D57] hover:text-white disabled:opacity-60"
      >
        {loading ? "Memuat…" : "Muat Lebih Banyak"}
      </button>
    </div>
  )
}

export function HistoriClient({ tab }: { tab: string }) {
  if (tab === "favorit") return <FavoritesList />
  return <OrdersList tab={tab} />
}

type OrdersPage = { orders: HistoriOrder[]; nextOffset: number | null }

function OrdersList({ tab }: { tab: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["histori", tab],
    queryFn: ({ pageParam }): Promise<OrdersPage> =>
      fetch(`/api/histori?tab=${tab}&limit=${PAGE_SIZE}&offset=${pageParam}`).then((r) => r.json()),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })

  const orders = data?.pages.flatMap((p) => p.orders) ?? []

  if (isLoading) return <Empty text="Memuat…" />
  if (orders.length === 0)
    return <EmptyState state={tab === "selesai" ? EMPTY_STATES.selesai : EMPTY_STATES.aktif} />

  return (
    <div>
      <div className="space-y-4">
        {orders.map((o) => (
          <OrderCard key={o.orderId} order={o} done={tab === "selesai"} />
        ))}
      </div>
      {hasNextPage && <LoadMore onClick={() => fetchNextPage()} loading={isFetchingNextPage} />}
    </div>
  )
}

type FavoritesPage = { favorites: FavoriteEvent[]; nextOffset: number | null }

function FavoritesList() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["favorites"],
    queryFn: ({ pageParam }): Promise<FavoritesPage> =>
      fetch(`/api/favorites?limit=${PAGE_SIZE}&offset=${pageParam}`).then((r) => r.json()),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })

  const favorites = data?.pages.flatMap((p) => p.favorites) ?? []

  if (isLoading) return <Empty text="Memuat…" />
  if (favorites.length === 0) return <EmptyState state={EMPTY_STATES.favorit} />

  return (
    <div>
      <div className="space-y-4">
        {favorites.map((f) => (
          <FavoriteCard key={f.eventId} fav={f} />
        ))}
      </div>
      {hasNextPage && <LoadMore onClick={() => fetchNextPage()} loading={isFetchingNextPage} />}
    </div>
  )
}
