import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { playScanError, playScanSuccess } from '../lib/feedback';
import { CameraViewfinder } from './CameraViewfinder';
import { ManualCodeModal } from './ManualCodeModal';

interface WristbandPairingProps {
  buyerName: string;
  targetCount: number;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: (wristbands: string[]) => void;
}

export function WristbandPairingView({
  buyerName,
  targetCount,
  isSubmitting,
  onBack,
  onConfirm,
}: WristbandPairingProps) {
  const [wristbands, setWristbands] = useState<string[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);

  const isComplete = wristbands.length >= targetCount;

  const handleAddWristband = (raw: string) => {
    const code = raw.trim();
    if (!code) return;

    if (wristbands.includes(code)) {
      playScanError();
      setDuplicateMsg(`Gelang ${code} sudah dipindai dalam daftar ini.`);
      return;
    }

    setDuplicateMsg(null);
    playScanSuccess();
    setWristbands((prev) => [...prev, code]);
  };

  const handleRemove = (code: string) => {
    setWristbands((prev) => prev.filter((c) => c !== code));
    setDuplicateMsg(null);
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            aria-label="Kembali pilih jumlah"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pairing Tiket Fisik
            </p>
            <p className="text-sm font-bold text-slate-900">{buyerName}</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-heading text-xs font-bold text-hectix-blue">
          {wristbands.length} / {targetCount}
        </span>
      </div>

      {duplicateMsg && (
        <div className="bg-status-danger px-4 py-2 text-center text-xs font-semibold text-white">
          {duplicateMsg}
        </div>
      )}

      {/* Camera when still need wristbands, or Summary Review (UI15) when complete */}
      {!isComplete ? (
        <div className="relative flex min-h-[280px] flex-1 flex-col">
          <CameraViewfinder
            guideText={`Pindai QR Gelang Fisik ke-${wristbands.length + 1} dari ${targetCount}`}
            accentColor="blue"
            paused={manualOpen}
            onScan={handleAddWristband}
            onManualInput={() => setManualOpen(true)}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center p-4">
          <div className="rounded-2xl border border-emerald-200 bg-status-success-bg p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-status-success" />
            <h3 className="font-heading mt-2 text-base font-bold text-slate-900">
              Semua Tiket Siap Diserahkan
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Periksa kembali daftar kode gelang sebelum konfirmasi aktivasi.
            </p>
          </div>
        </div>
      )}

      {/* Paired Wristbands List */}
      {wristbands.length > 0 && (
        <div className="max-h-44 space-y-1.5 overflow-y-auto border-t border-border-subtle bg-white px-4 py-3">
          {wristbands.map((code, idx) => (
            <div
              key={code}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-hectix-navy text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {code}
                </span>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRemove(code)}
                aria-label={`Hapus ${code}`}
                className="p-1 text-slate-400 hover:text-status-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Footer (UI15) */}
      <div className="border-t border-border-subtle bg-white p-4">
        <button
          type="button"
          disabled={!isComplete || isSubmitting}
          onClick={() => onConfirm(wristbands)}
          className="flex min-h-13 w-full items-center justify-center rounded-xl bg-status-success px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isSubmitting
            ? 'Menyimpan Penukaran...'
            : `Konfirmasi & Serahkan (${wristbands.length}/${targetCount})`}
        </button>
      </div>

      <ManualCodeModal
        open={manualOpen}
        title="Input Kode Gelang Fisik"
        placeholder="Masukkan kode QR gelang"
        onClose={() => setManualOpen(false)}
        onSubmit={handleAddWristband}
      />
    </div>
  );
}
