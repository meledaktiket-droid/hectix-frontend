import { useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import type { GateScanResult } from '../types/scanner';
import { cleanTicketName } from '../lib/formatTicketName';

interface ScanResultOverlayProps {
  result: GateScanResult | null;
  onDismiss: () => void;
}

export function ScanResultOverlay({ result, onDismiss }: ScanResultOverlayProps) {
  const isApprovedIn = result?.outcome === 'approved_in';
  const isApprovedOut = result?.outcome === 'approved_out';
  const isApproved = isApprovedIn || isApprovedOut;

  // Auto-reset 1.5 detik untuk scan berhasil (sesuai keputusan desain)
  useEffect(() => {
    if (!result || !isApproved) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 1500);
    return () => clearTimeout(timer);
  }, [result, isApproved, onDismiss]);

  if (!result) return null;

  const bgClass = isApprovedIn
    ? 'bg-status-success'
    : isApprovedOut
      ? 'bg-status-warning'
      : 'bg-status-danger';

  const Icon = isApprovedIn
    ? CheckCircle2
    : isApprovedOut
      ? ArrowUpRight
      : XCircle;

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto flex w-full flex-col items-center justify-center p-6 text-center text-white md:max-w-lg ${bgClass}`}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-14 w-14 text-white" />
      </div>

      <h2 className="font-heading mt-5 text-2xl font-bold tracking-tight">
        {result.title}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/90">
        {result.message}
      </p>

      <div className="mt-6 w-full max-w-xs space-y-2 rounded-2xl bg-black/20 p-4 text-left text-xs">
        <div className="flex items-center justify-between">
          <span className="text-white/75">Kode QR</span>
          <span className="font-mono font-bold text-white">{result.code}</span>
        </div>
        {result.holderName && (
          <div className="flex items-center justify-between">
            <span className="text-white/75">Pemegang</span>
            <span className="font-semibold text-white">{result.holderName}</span>
          </div>
        )}
        {result.tierName && (
          <div className="flex items-center justify-between">
            <span className="text-white/75">Kategori</span>
            <span className="font-semibold text-white">{cleanTicketName(result.tierName)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white/75">Waktu</span>
          <span className="font-mono text-white">{result.timestamp}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-7 min-h-13 w-full max-w-xs rounded-xl bg-white px-5 text-sm font-bold text-slate-900 shadow-md active:scale-[0.98]"
      >
        {isApproved ? 'Scan Berikutnya (Auto 1.5s)' : 'Tutup & Scan Lagi'}
      </button>
    </div>
  );
}
