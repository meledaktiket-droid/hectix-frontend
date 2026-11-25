import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { replaceWristband } from '../lib/api';
import { playScanError, playScanSuccess } from '../lib/feedback';

interface SupervisorReplacementModalProps {
  open: boolean;
  initialOldCode?: string;
  onClose: () => void;
}

const REASONS = [
  'Gelang Robek / Putus',
  'QR Rusak / Tidak Terbaca',
  'Gelang Hilang di Area Venue',
];

export function SupervisorReplacementModal({
  open,
  initialOldCode = '',
  onClose,
}: SupervisorReplacementModalProps) {
  if (!open) return null;

  return (
    <SupervisorReplacementForm
      key={initialOldCode || 'blank'}
      initialOldCode={initialOldCode}
      onClose={onClose}
    />
  );
}

function SupervisorReplacementForm({
  initialOldCode,
  onClose,
}: {
  initialOldCode: string;
  onClose: () => void;
}) {
  const { activeEvent } = useScanner();
  const queryClient = useQueryClient();

  const [oldCode, setOldCode] = useState(initialOldCode);
  const [newCode, setNewCode] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !oldCode.trim() || !newCode.trim() || !pin.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await replaceWristband({
        eventId: activeEvent.id,
        oldCode,
        newCode,
        reason,
      });
      playScanSuccess();
      setSuccessMsg(res.message);
      await queryClient.invalidateQueries({ queryKey: ['scanner-wristbands'] });
    } catch (err) {
      playScanError();
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengganti gelang fisik.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-warning-bg text-status-warning">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Ganti Tiket Supervisor
              </h2>
              <p className="text-xs text-slate-500">
                Gelang lama akan di-VOID otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form supervisor"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {successMsg ? (
          <div className="space-y-4 py-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-status-success" />
            <div>
              <p className="font-heading text-base font-bold text-slate-900">
                Penggantian Berhasil
              </p>
              <p className="mt-1 text-xs text-slate-600">{successMsg}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 w-full rounded-xl bg-hectix-navy text-sm font-semibold text-white"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <div className="rounded-xl bg-status-danger-bg px-3.5 py-2.5 text-xs font-semibold text-status-danger">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Kode Gelang Lama (Rusak / Hilang)
              </label>
              <input
                type="text"
                required
                value={oldCode}
                onChange={(e) => setOldCode(e.target.value)}
                placeholder="HXP-..."
                className="font-mono w-full rounded-xl border border-border-subtle bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-hectix-blue focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Kode Gelang Baru (Pengganti)
              </label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="HXP-..."
                className="font-mono w-full rounded-xl border border-border-subtle bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-hectix-blue focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Alasan Penggantian
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-hectix-blue focus:bg-white"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                PIN Otorisasi Supervisor
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Minimal 4 digit (contoh: 1234)"
                className="font-mono w-full rounded-xl border border-border-subtle bg-slate-50 px-3.5 py-2.5 text-sm tracking-widest outline-none focus:border-hectix-blue focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !oldCode.trim() || !newCode.trim() || !pin.trim()}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              {isSubmitting ? 'Memproses...' : 'Otorisasi & Ganti Gelang'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
