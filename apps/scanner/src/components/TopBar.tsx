import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useScanner } from '../context/scannerStore';

export function TopBar() {
  const { activeEvent, activeSession, isOnline, openSessionModal } = useScanner();

  return (
    <header className="sticky top-0 z-30 bg-hectix-navy px-4 py-3 text-white shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading truncate text-sm font-bold tracking-tight">
            {activeEvent?.name ?? 'Scanner by Hectix'}
          </h1>
          {activeSession && (
            <button
              type="button"
              onClick={openSessionModal}
              className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-left text-xs font-medium text-blue-100 transition hover:bg-white/15 active:scale-[0.98]"
            >
              <span className="truncate">{activeSession.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
          )}
        </div>

        <div className="shrink-0 pt-0.5">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
              <Wifi className="h-3 w-3 text-emerald-400" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-100">
              <WifiOff className="h-3 w-3 text-red-300" />
              Offline
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
