import { Home, QrCode, ListChecks, SlidersHorizontal } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import type { AppTab } from '../types/scanner';

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'scan', label: 'Scan', icon: QrCode },
  { id: 'wristbands', label: 'Daftar Tiket', icon: ListChecks },
  { id: 'settings', label: 'Opsi', icon: SlidersHorizontal },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useScanner();

  return (
    <nav
      aria-label="Navigasi Utama Scanner"
      className="sticky bottom-0 z-30 border-t border-border-subtle bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition ${
                isActive
                  ? 'text-hectix-navy font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-blue-50 text-hectix-blue' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
