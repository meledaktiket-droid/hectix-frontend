import { Check, X } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { MODE_OPTIONS } from '../lib/modes';

export function ModeSelectorModal() {
  const {
    isModeModalOpen,
    closeModeModal,
    operationalMode,
    setOperationalMode,
  } = useScanner();

  if (!isModeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[1px]"
      onClick={closeModeModal}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              Pilih Mode Operasional
            </h2>
            <p className="text-xs text-slate-500">
              Sesuaikan fungsi kamera dengan tugas pos Anda
            </p>
          </div>
          <button
            type="button"
            onClick={closeModeModal}
            aria-label="Tutup modal mode"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            const selected = mode.id === operationalMode;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setOperationalMode(mode.id);
                  closeModeModal();
                }}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                  selected
                    ? 'border-hectix-blue bg-blue-50/70'
                    : 'border-border-subtle bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mode.badgeColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{mode.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {mode.description}
                    </p>
                  </div>
                </div>
                {selected && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hectix-blue text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
