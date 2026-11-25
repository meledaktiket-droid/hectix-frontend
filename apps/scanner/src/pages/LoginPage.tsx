import { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import { startGoogleLogin } from '../lib/api';

interface LoginPageProps {
  redirectTo?: string;
}

export function LoginPage({ redirectTo = '/' }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await startGoogleLogin(redirectTo);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memulai login Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col justify-between bg-slate-50 p-6 md:max-w-lg md:border-x md:border-border-subtle">
      <div className="pt-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo-dark.png"
            alt="Hectix"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-hectix-navy">
              Scanner by Hectix
            </h1>
            <p className="text-xs text-slate-500">Portal Petugas Gate &amp; Penukaran</p>
          </div>
        </div>
      </div>

      <div className="my-auto rounded-3xl border border-border-subtle bg-white p-6 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-hectix-navy">
          <QrCode className="h-6 w-6" />
        </div>

        <h2 className="font-heading mt-4 text-xl font-bold text-slate-900">
          Masuk Akun Petugas
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Gunakan akun Google yang sudah menerima undangan resmi dari Admin atau
          Organizer acara.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-status-danger-bg px-3.5 py-2.5 text-xs font-semibold text-status-danger">
            {errorMsg}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-hectix-navy/95 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            {isLoading ? 'Mengarahkan ke Google...' : 'Masuk dengan Google'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Koneksi terenkripsi &amp; verifikasi peran otomatis</span>
      </div>
    </div>
  );
}
