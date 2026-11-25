import { CalendarDays, Check, Download, LogOut, Smartphone, Volume2 } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { signOutScanner } from '../lib/api';
import { playScanError, playScanSuccess } from '../lib/feedback';

export function SettingsPage() {
  const { user, events, activeEvent, setActiveEventById, openModeModal } = useScanner();
  const { canPromptInstall, isInstalled, isIos, promptInstall } = usePwaInstall();

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-2xl border border-border-subtle bg-white p-4">
        <p className="text-xs font-medium text-slate-500">Akun Petugas</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="font-heading text-base font-bold text-slate-900">
              {user?.name ?? 'Kru Scanner'}
            </p>
            <p className="text-xs text-slate-500">{user?.email ?? 'staff@hectix.id'}</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase text-hectix-navy">
            {user?.role ?? 'scanner'}
          </span>
        </div>
      </section>

      {/* Event Switcher (UI05) */}
      <section className="rounded-2xl border border-border-subtle bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-hectix-navy" />
          <h2 className="font-heading text-sm font-bold text-slate-900">
            Acara Ditugaskan
          </h2>
        </div>

        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada acara yang ditugaskan.</p>
          ) : (
            events.map((evt) => {
              const selected = evt.id === activeEvent?.id;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setActiveEventById(evt.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-hectix-blue bg-blue-50/70'
                      : 'border-border-subtle bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{evt.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {evt.venueName || evt.status}
                    </p>
                  </div>
                  {selected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-hectix-blue text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Quick Tools */}
      <section className="rounded-2xl border border-border-subtle bg-white p-4">
        <h2 className="font-heading mb-3 text-sm font-bold text-slate-900">
          Alat &amp; Diagnosa Perangkat
        </h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={openModeModal}
            className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border-subtle px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>Ubah Mode Operasional</span>
            <span className="text-hectix-blue">Pilih</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={playScanSuccess}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-status-success-bg px-3 text-xs font-semibold text-status-success"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Bunyi Sukses
            </button>
            <button
              type="button"
              onClick={playScanError}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-status-danger-bg px-3 text-xs font-semibold text-status-danger"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Bunyi Ditolak
            </button>
          </div>
        </div>
      </section>

      {/* PWA Install Card */}
      <section className="rounded-2xl border border-border-subtle bg-white p-4">
        <div className="flex items-start gap-2.5">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-hectix-navy" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900">
              Aplikasi Scanner (PWA)
            </p>
            {isInstalled ? (
              <p className="mt-0.5 text-xs text-status-success font-medium">
                Sudah terpasang di perangkat (Mode Standalone).
              </p>
            ) : canPromptInstall ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-hectix-navy px-3.5 text-xs font-semibold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install ke Layar Utama
                </button>
              </div>
            ) : isIos ? (
              <p className="mt-0.5 text-xs text-slate-500">
                Di Safari iPhone: ketuk ikon <strong>Share</strong> lalu pilih{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-500">
                Buka menu browser (&#8942;) &rarr; <strong>Install App / Tambahkan ke Layar Utama</strong>.
              </p>
            )}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={signOutScanner}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-status-danger hover:bg-status-danger-bg"
      >
        <LogOut className="h-4 w-4" />
        Keluar Akun Petugas
      </button>
    </div>
  );
}
