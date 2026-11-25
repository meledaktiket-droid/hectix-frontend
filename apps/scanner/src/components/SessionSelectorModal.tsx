import { Check, DoorOpen, X } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { cleanTicketName } from '../lib/formatTicketName';

function formatSessionDates(startsAt?: string, endsAt?: string): string | null {
  if (!startsAt) return null;
  const sDay = startsAt.slice(0, 10);
  const eDay = endsAt ? endsAt.slice(0, 10) : sDay;
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    });
  return sDay === eDay ? fmt(sDay) : `${fmt(sDay)} – ${fmt(eDay)}`;
}

export function SessionSelectorModal() {
  const {
    isSessionModalOpen,
    closeSessionModal,
    sessions,
    activeSession,
    setActiveSessionById,
  } = useScanner();

  if (!isSessionModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[1px]"
      onClick={closeSessionModal}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              Pilih Sesi &amp; Pintu Gate
            </h2>
            <p className="text-xs text-slate-500">
              Tentukan sesi aktif untuk pencatatan scan
            </p>
          </div>
          <button
            type="button"
            onClick={closeSessionModal}
            aria-label="Tutup modal sesi"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {sessions.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              Belum ada sesi untuk acara ini.
            </p>
          ) : (
            sessions.map((session) => {
              const selected = session.id === activeSession?.id;
              const dateRange = formatSessionDates(session.startsAt, session.endsAt);
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setActiveSessionById(session.id);
                    closeSessionModal();
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                    selected
                      ? 'border-hectix-blue bg-blue-50/70'
                      : 'border-border-subtle bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        selected
                          ? 'bg-hectix-navy text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {cleanTicketName(session.name)}
                        </p>
                        {dateRange && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {dateRange}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {session.currentInside} / {session.quotaLimit} di dalam &middot;{' '}
                        {session.allowReentry ? 'Re-entry Aktif' : 'Sekali Masuk'}
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
