import { AlertCircle, ArrowLeft, Minus, Plus, Ticket, User } from 'lucide-react';
import type { RedemptionOrderLookup } from '../types/scanner';
import { cleanTicketName } from '../lib/formatTicketName';

interface TicketDetailCardProps {
  lookup: RedemptionOrderLookup;
  quantities: Record<string, number>;
  isSubmitting?: boolean;
  onChangeQty: (orderItemId: string, nextQty: number) => void;
  onCancel: () => void;
  onProceed: () => void;
}

export function TicketDetailCard({
  lookup,
  quantities,
  isSubmitting = false,
  onChangeQty,
  onCancel,
  onProceed,
}: TicketDetailCardProps) {
  const totalSelected = lookup.items.reduce(
    (sum, item) => sum + (quantities[item.orderItemId] ?? 0),
    0
  );

  const fullyRedeemed = lookup.summary.totalRemaining === 0;

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="flex items-center gap-3 border-b border-border-subtle bg-white px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Kembali ke kamera"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Rincian Pesanan
          </p>
          <p className="font-mono truncate text-sm font-bold text-hectix-navy">
            {lookup.order.referenceNumber}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Buyer Info */}
        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-hectix-blue">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {lookup.order.buyerName}
              </p>
              <p className="truncate text-xs text-slate-500">{lookup.order.buyerEmail}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
            <div>
              <p className="text-[10px] text-slate-500">Dibeli</p>
              <p className="font-heading text-base font-bold text-slate-900">
                {lookup.summary.totalBought}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Sudah Tukar</p>
              <p className="font-heading text-base font-bold text-slate-600">
                {lookup.summary.totalRedeemed}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Sisa Tukar</p>
              <p
                className={`font-heading text-base font-bold ${
                  fullyRedeemed ? 'text-status-danger' : 'text-status-success'
                }`}
              >
                {lookup.summary.totalRemaining}
              </p>
            </div>
          </div>
        </div>

        {fullyRedeemed && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-status-danger-bg p-3.5 text-status-danger">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-xs font-bold">Semua Tiket Sudah Ditukar</p>
              <p className="mt-0.5 text-xs opacity-90">
                Pesanan ini tidak memiliki sisa tiket untuk ditukarkan ke gelang fisik.
              </p>
            </div>
          </div>
        )}

        {/* Item Steppers (UI13) */}
        <div className="space-y-2.5">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
            Pilih Jumlah Penukaran
          </h3>

          {lookup.items.map((item) => {
            const qty = quantities[item.orderItemId] ?? 0;
            const disabled = item.remainingQty === 0;
            return (
              <div
                key={item.orderItemId}
                className={`rounded-2xl border p-3.5 ${
                  disabled
                    ? 'border-slate-200 bg-slate-100/70 opacity-65'
                    : 'border-border-subtle bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 shrink-0 text-hectix-navy" />
                      <p className="truncate text-sm font-bold text-slate-900">
                        {cleanTicketName(item.ticketTypeName)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Sisa belum ditukar:{' '}
                      <span className="font-semibold text-slate-800">
                        {item.remainingQty}
                      </span>{' '}
                      dari {item.boughtQty}
                    </p>
                  </div>

                  {/* Stepper Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={disabled || qty <= 0}
                      onClick={() => onChangeQty(item.orderItemId, Math.max(0, qty - 1))}
                      aria-label="Kurangi jumlah"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-slate-50 text-slate-700 disabled:opacity-35"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-heading w-7 text-center text-lg font-bold text-slate-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={disabled || qty >= item.remainingQty}
                      onClick={() =>
                        onChangeQty(
                          item.orderItemId,
                          Math.min(item.remainingQty, qty + 1)
                        )
                      }
                      aria-label="Tambah jumlah"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-hectix-navy text-white disabled:opacity-35"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="space-y-3 border-t border-border-subtle bg-white p-4">
        <button
          type="button"
          disabled={totalSelected === 0 || isSubmitting}
          onClick={onProceed}
          className="flex min-h-13 w-full items-center justify-center rounded-xl bg-status-success px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isSubmitting
            ? 'Menyimpan Penukaran...'
            : `Tukar Tiket / Akses (${totalSelected})`}
        </button>
      </div>
    </div>
  );
}
