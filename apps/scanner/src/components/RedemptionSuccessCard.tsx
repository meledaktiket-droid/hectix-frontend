import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { RedeemResult } from '../types/scanner';

interface RedemptionSuccessCardProps {
  result: RedeemResult;
  onDone: () => void;
}

export function RedemptionSuccessCard({ result, onDone }: RedemptionSuccessCardProps) {
  // Auto-advance 1.5 detik sesuai keputusan desain
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-status-success p-6 text-center text-white">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
        <CheckCircle2 className="h-12 w-12 text-white" />
      </div>

      <h2 className="font-heading mt-4 text-2xl font-bold tracking-tight">
        Penukaran Berhasil!
      </h2>
      <p className="mt-1 text-sm text-emerald-100">
        {result.wristbands.length > 0
          ? `${result.redeemedCount} gelang diaktifkan untuk `
          : `${result.redeemedCount} tiket ditukar tanpa gelang untuk `}
        <span className="font-semibold text-white">{result.buyerName}</span>
      </p>

      <div className="mt-5 w-full max-w-xs space-y-1.5 rounded-2xl bg-black/15 p-3.5 text-left">
        {result.wristbands.length > 0 ? (
          result.wristbands.map((wb) => (
            <div
              key={wb}
              className="flex items-center justify-between text-xs font-medium"
            >
              <span className="text-emerald-100">Gelang Aktif</span>
              <span className="font-mono font-bold text-white">{wb}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-emerald-100">Mode Penukaran</span>
            <span className="font-semibold text-white">Tanpa Gelang Fisik</span>
          </div>
        )}
        <div className="mt-2 border-t border-white/15 pt-2 text-xs text-emerald-100">
          Sisa tiket belum ditukar:{' '}
          <span className="font-bold text-white">{result.remainingAfter}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-6 min-h-12 w-full max-w-xs rounded-xl bg-white px-5 text-sm font-bold text-status-success shadow-sm active:scale-[0.98]"
      >
        Scan Berikutnya (Auto 1.5s)
      </button>
    </div>
  );
}
