"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Barcode } from "@/components/histori/barcode";
import { formatDateID } from "@/lib/format";

type Detail = {
  referenceNumber: string | null;
  barcode: string | null;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  eventBannerUrl: string | null;
  eventVenueName: string | null;
  eventCity: string | null;
  buyerName: string;
  items: { ticketTypeName: string; price: number; quantity: number }[];
  comment: { content: string; createdAt: string } | null;
};

export function ProfileActivityDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery<Detail>({
    queryKey: ["profile-ticket", orderId],
    queryFn: () => fetch(`/api/profile/ticket/${orderId}`).then((r) => r.json()),
  });

  if (isLoading || !data) return <div className="py-20 text-center text-neutral-500">Memuat…</div>;
  const ticketCount = data.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-2xl bg-white/60 p-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 font-semibold text-[#0C2D57]">
          <ChevronLeft className="h-5 w-5" /> Kembali
        </button>
        <span className="text-xl font-bold text-[#0C2D57]">Aktivitas Anda</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
            <div className="border-r border-border pr-4 text-lg font-bold text-[#2a8af6]">{ticketCount} Tiket</div>
            {data.eventBannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.eventBannerUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div>
              <h2 className="text-xl font-bold">{data.eventName}</h2>
              <p className="text-[#424242]">
                {data.items.map((i) => i.ticketTypeName).join(", ")}{" "}
                <span className="font-semibold text-[#a853ba]">x{ticketCount}</span>
              </p>
              <p className="text-sm text-neutral-500">{formatDateID(data.eventStartsAt)}</p>
            </div>
          </div>

          <h3 className="mt-6 text-xl font-bold text-[#0C2D57]">Komentar Anda</h3>
          <div className="mt-2 rounded-xl bg-neutral-100 p-4">
            {data.comment ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Komentar Anda :</span>
                  <span className="rounded-md bg-neutral-300 px-2 py-0.5 text-xs font-semibold text-[#0C2D57]">{data.eventName}</span>
                </div>
                <p className="text-[#424242]">“{data.comment.content}”</p>
                <p className="mt-2 text-right text-sm text-neutral-500">{formatDateID(data.comment.createdAt)}</p>
              </>
            ) : (
              <p className="text-neutral-500">Anda belum menulis komentar untuk acara ini.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-b from-[#0C2D57] to-[#324a6e] p-5 text-white">
          <h3 className="text-center font-bold">{data.eventName}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/80">
            <div><p>Nama</p><p className="font-semibold text-white">{data.buyerName}</p></div>
            <div><p>Tanggal</p><p className="font-semibold text-white">{formatDateID(data.eventStartsAt)}</p></div>
            <div><p>Lokasi</p><p className="font-semibold text-white">{data.eventVenueName}</p><p>{data.eventCity}</p></div>
            <div><p>Jumlah</p><p className="font-semibold text-white">{ticketCount} Tiket</p></div>
          </div>
          {data.barcode ? (
            <div className="mt-6 rounded-lg bg-white p-3">
              <Barcode value={data.barcode} />
              <p className="mt-1 text-center text-xs font-semibold text-[#2a8af6]">{data.referenceNumber}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-white/10 p-6 text-center text-sm">Tiket sedang disiapkan…</div>
          )}
        </div>
      </div>
    </div>
  );
}
