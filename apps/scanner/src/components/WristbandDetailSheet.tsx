import { Clock, Ticket, User, X } from 'lucide-react';
import { WRISTBAND_STATUS_STYLE } from '../lib/wristbandBadge';
import type { PhysicalWristband } from '../types/scanner';

interface WristbandDetailSheetProps {
  wristband: PhysicalWristband | null;
  onClose: () => void;
}

export function WristbandDetailSheet({
  wristband,
  onClose,
}: WristbandDetailSheetProps) {
  if (!wristband) return null;

  const badge = WRISTBAND_STATUS_STYLE[wristband.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-hectix-navy">
                {wristband.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Order {wristband.orderRef} &middot; {wristband.tierName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail gelang"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Holder & Scanner Info */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Pemegang</p>
              <p className="truncate font-semibold text-slate-900">
                {wristband.holderName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Tap Terakhir</p>
              <p className="truncate font-semibold text-slate-900">
                {wristband.lastTapAt ?? 'Belum tap gate'}
              </p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 border-t border-slate-200/70 pt-2">
            <User className="h-4 w-4 shrink-0 text-hectix-blue" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Petugas Scanner</p>
              <p className="truncate font-semibold text-slate-900">
                {wristband.scannerName || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline (UI32) */}
        <div className="mb-5">
          <h3 className="font-heading mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Riwayat Aktivitas
          </h3>

          <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
            {wristband.timeline.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-center text-xs text-slate-400">
                Belum ada aktivitas scan gate.
              </p>
            ) : (
              wristband.timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{evt.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{evt.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] font-medium text-slate-400">
                    {evt.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
