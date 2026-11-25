import { useCallback, useState } from 'react';
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight } from 'lucide-react';
import { CameraViewfinder } from '../components/CameraViewfinder';
import { ManualCodeModal } from '../components/ManualCodeModal';
import { ScanResultOverlay } from '../components/ScanResultOverlay';
import { useScanner } from '../context/scannerStore';
import { gateScan } from '../lib/api';
import { playScanError, playScanSuccess, playScanWarning } from '../lib/feedback';
import { enqueueOfflineScan } from '../lib/offlineQueue';
import type { GateScanResult } from '../types/scanner';

export function GateScanPage() {
  const { activeEvent, activeSession, sessions, operationalMode, isOnline, openModeModal, setOperationalMode } =
    useScanner();
  const isGateIn = operationalMode === 'gate_in';

  const [manualOpen, setManualOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [scanResult, setScanResult] = useState<GateScanResult | null>(null);
  const [shiftCount, setShiftCount] = useState(0);

  const handleScanCode = useCallback(
    async (rawCode: string) => {
      if (isChecking || scanResult || !activeEvent) return;
      setIsChecking(true);
      try {
        if (!isOnline) {
          const code = rawCode.trim();
          await enqueueOfflineScan({
            action: isGateIn ? 'in' : 'out',
            code,
            eventId: activeEvent.id,
            sessionId: activeSession?.id ?? '',
          });
          playScanWarning();
          setShiftCount((c) => c + 1);
          setScanResult({
            outcome: isGateIn ? 'approved_in' : 'approved_out',
            code,
            title: 'Tersimpan Offline',
            message: 'Antre di perangkat. Akan disinkronkan otomatis saat online.',
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });
          return;
        }

        const result = await gateScan({
          action: isGateIn ? 'in' : 'out',
          code: rawCode,
          eventId: activeEvent.id,
          sessionId: activeSession?.id ?? '',
          gateLabel: activeSession?.name ?? '',
        });

        if (result.outcome === 'approved_in') {
          playScanSuccess();
          setShiftCount((c) => c + 1);
        } else if (result.outcome === 'approved_out') {
          playScanWarning();
          setShiftCount((c) => c + 1);
        } else {
          playScanError();
        }

        setScanResult(result);
      } catch {
        playScanError();
      } finally {
        setIsChecking(false);
      }
    },
    [activeEvent, activeSession, isChecking, isGateIn, isOnline, scanResult]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isGateIn
                ? 'bg-status-success-bg text-status-success'
                : 'bg-status-warning-bg text-status-warning'
            }`}
          >
            {isGateIn ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {isGateIn ? 'GATE MASUK' : 'GATE KELUAR'}
          </span>
          <span className="text-xs font-medium text-slate-500">
            Shift: <strong className="text-slate-900">{shiftCount}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={openModeModal}
          className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowRightLeft className="h-3 w-3" />
          Mode
        </button>
      </div>

      <CameraViewfinder
        guideText={
          isChecking
            ? 'Memeriksa validitas tiket...'
            : isGateIn
              ? 'Pindai QR Tiket untuk Gate Masuk'
              : 'Pindai QR Tiket untuk Gate Keluar'
        }
        accentColor={isGateIn ? 'green' : 'amber'}
        paused={manualOpen || isChecking || Boolean(scanResult) || !activeSession}
        onScan={handleScanCode}
        onManualInput={() => setManualOpen(true)}
      />

      {activeEvent && sessions.length === 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-semibold">Belum ada sesi gate / tiket fisik untuk event ini.</p>
          <p className="mt-0.5 text-amber-800">
            Jika event hanya menggunakan E-Ticket, gunakan menu Tukar untuk memverifikasi tiket.
          </p>
          <button
            type="button"
            onClick={() => setOperationalMode('redemption')}
            className="mt-2 inline-flex items-center rounded-lg bg-hectix-navy px-3 py-1.5 text-xs font-semibold text-white"
          >
            Buka Menu Tukar E-Ticket
          </button>
        </div>
      )}

      <ManualCodeModal
        open={manualOpen}
        title={isGateIn ? 'Input Manual Gate Masuk' : 'Input Manual Gate Keluar'}
        placeholder="Masukkan kode QR gelang / tiket"
        onClose={() => setManualOpen(false)}
        onSubmit={handleScanCode}
      />

      <ScanResultOverlay result={scanResult} onDismiss={() => setScanResult(null)} />
    </div>
  );
}
