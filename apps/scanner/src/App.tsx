import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { OfflineBanner } from './components/OfflineBanner';
import { SessionSelectorModal } from './components/SessionSelectorModal';
import { TopBar } from './components/TopBar';
import { ScannerProvider } from './context/ScannerContext';
import { useScanner } from './context/scannerStore';
import { unlockAudio } from './lib/feedback';
import { signOutScanner } from './lib/api';
import { DashboardPage } from './pages/DashboardPage';
import { GateScanPage } from './pages/GateScanPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { LoginPage } from './pages/LoginPage';
import { RedemptionPage } from './pages/RedemptionPage';
import { SettingsPage } from './pages/SettingsPage';
import { WristbandListPage } from './pages/WristbandListPage';

function ScannerShell() {
  const { user, isAuthLoading, isEventsLoading, activeEvent, activeTab, operationalMode } =
    useScanner();

  if (isAuthLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full flex-col items-center justify-center bg-slate-50 p-6 md:max-w-lg md:border-x md:border-border-subtle">
        <img
          src="/logo-dark.png"
          alt="Hectix"
          className="h-12 w-12 animate-pulse rounded-xl object-contain"
        />
        <p className="mt-3 text-xs font-medium text-slate-500">
          Memeriksa sesi petugas...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!isEventsLoading && !activeEvent) {
    return (
      <div className="mx-auto flex min-h-dvh w-full flex-col bg-slate-50 md:max-w-lg md:border-x md:border-border-subtle">
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <img
            src="/logo-dark.png"
            alt="Hectix"
            className="mb-4 h-12 w-12 rounded-xl object-contain"
          />
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Akses Scanner Tidak Tersedia
          </h2>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
            Akun Anda (<strong>{user.email}</strong>) belum terdaftar sebagai petugas atau
            volunteer di acara mana pun. Silakan logout dan masuk dengan akun petugas, atau
            terima undangan dari email Anda.
          </p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
            <button
              type="button"
              onClick={signOutScanner}
              className="min-h-11 w-full rounded-xl bg-hectix-navy px-5 text-xs font-semibold text-white"
            >
              Logout / Ganti Akun
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-white px-5 text-xs font-semibold text-slate-700"
            >
              Muat Ulang
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-dvh w-full flex-col bg-slate-50 text-slate-900 md:max-w-lg md:border-x md:border-border-subtle"
      onPointerDown={unlockAudio}
    >
      <TopBar />
      <OfflineBanner />

      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeTab === 'home' && <DashboardPage />}

        {activeTab === 'scan' && operationalMode === 'redemption' && <RedemptionPage />}

        {activeTab === 'scan' && operationalMode !== 'redemption' && <GateScanPage />}

        {activeTab === 'wristbands' && <WristbandListPage />}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <BottomNav />
      <SessionSelectorModal />
      <ModeSelectorModal />
    </div>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPathname(new URL(to, window.location.origin).pathname);
  };

  if (pathname === '/invite/accept') {
    return <InviteAcceptPage onGoHome={() => navigate('/')} />;
  }

  if (pathname === '/login') {
    return <LoginPage />;
  }

  return (
    <ScannerProvider>
      <ScannerShell />
    </ScannerProvider>
  );
}
