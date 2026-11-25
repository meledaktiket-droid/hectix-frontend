import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MailCheck,
  XCircle,
} from 'lucide-react';
import {
  acceptInvite,
  inspectInvite,
  rejectInvite,
  startGoogleLogin,
} from '../lib/api';

interface InviteAcceptPageProps {
  onGoHome: () => void;
}

export function InviteAcceptPage({ onGoHome }: InviteAcceptPageProps) {
  const params = new URLSearchParams(window.location.search);
  const inviteId = params.get('id') || 'demo-invite';

  const [actionStatus, setActionStatus] = useState<'idle' | 'accepted' | 'rejected'>(
    'idle'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const inspectQuery = useQuery({
    queryKey: ['invite-inspect', inviteId],
    queryFn: () => inspectInvite(inviteId),
  });

  const info = inspectQuery.data;

  const handleAccept = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await acceptInvite(inviteId);
      setActionStatus('accepted');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menerima undangan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await rejectInvite(inviteId);
      setActionStatus('rejected');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menolak undangan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignin = async () => {
    const returnUrl = `/invite/accept?id=${encodeURIComponent(inviteId)}`;
    try {
      await startGoogleLogin(returnUrl);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal membuka login Google.');
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col justify-between bg-slate-50 p-6 md:max-w-lg md:border-x md:border-border-subtle">
      <div className="flex items-center gap-3 pt-4">
        <img
          src="/logo-dark.png"
          alt="Hectix"
          className="h-9 w-9 rounded-xl object-contain"
        />
        <div>
          <h1 className="font-heading text-base font-bold text-hectix-navy">
            Scanner by Hectix
          </h1>
          <p className="text-[11px] text-slate-500">Undangan Kru Lapangan</p>
        </div>
      </div>

      <div className="my-auto rounded-3xl border border-border-subtle bg-white p-6 shadow-xs">
        {inspectQuery.isLoading && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-hectix-navy" />
            <p className="mt-3 text-xs font-medium text-slate-500">
              Memeriksa undangan...
            </p>
          </div>
        )}

        {!inspectQuery.isLoading && actionStatus === 'accepted' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-success-bg text-status-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Undangan Diterima!
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Akun Anda sudah aktif sebagai petugas scanner untuk acara ini.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoHome}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white"
            >
              Buka Beranda Scanner
            </button>
          </div>
        )}

        {!inspectQuery.isLoading && actionStatus === 'rejected' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Undangan Ditolak
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Anda telah menolak undangan tugas petugas scanner ini.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoHome}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-white px-4 text-xs font-semibold text-slate-700"
            >
              Kembali
            </button>
          </div>
        )}

        {!inspectQuery.isLoading &&
          actionStatus === 'idle' &&
          info?.status === 'needs-signin' && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-hectix-blue">
                <MailCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900">
                  Anda Diundang sebagai {info.roleLabel}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  <strong>{info.inviterName}</strong> mengundang{' '}
                  <span className="font-mono font-semibold text-slate-700">
                    {info.email}
                  </span>{' '}
                  {info.eventName ? (
                    <>
                      untuk bertugas di acara <strong>{info.eventName}</strong> (
                      {info.orgName}).
                    </>
                  ) : (
                    <>
                      ke tim <strong>{info.orgName}</strong>.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignin}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white"
              >
                Masuk dengan Google untuk Terima
              </button>
            </div>
          )}

        {!inspectQuery.isLoading &&
          actionStatus === 'idle' &&
          info?.status === 'mismatch' && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-warning-bg text-status-warning">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900">
                  Email Akun Tidak Cocok
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Undangan ditujukan ke{' '}
                  <strong className="font-mono">{info.invitedEmail}</strong>, tetapi
                  Anda login sebagai{' '}
                  <strong className="font-mono">{info.signedInEmail}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignin}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white"
              >
                Ganti Akun Google
              </button>
            </div>
          )}

        {!inspectQuery.isLoading &&
          actionStatus === 'idle' &&
          info?.status === 'needs-accept' && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-hectix-blue">
                <MailCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-hectix-blue">
                  {info.roleLabel ?? 'Volunteer Scanner'}
                </span>
                <h2 className="font-heading mt-2 text-lg font-bold text-slate-900">
                  Terima Tugas Petugas Scanner?
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  <strong>{info.inviterName ?? 'Admin'}</strong> mengundang Anda
                  {info.eventName ? (
                    <>
                      {' '}
                      untuk bertugas di acara <strong>{info.eventName}</strong>
                      {info.orgName ? ` (${info.orgName})` : ''}.
                    </>
                  ) : (
                    <>
                      {' '}
                      bergabung ke <strong>{info.orgName ?? 'Event Hectix'}</strong>.
                    </>
                  )}
                </p>
                {info.eventName && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2.5 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-hectix-blue">
                      Acara Ditugaskan
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {info.eventName}
                    </p>
                  </div>
                )}
              </div>

              {actionError && (
                <div className="rounded-xl bg-status-danger-bg p-3 text-xs font-semibold text-status-danger">
                  {actionError}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAccept}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {isSubmitting ? 'Memproses...' : 'Terima Undangan & Mulai Scan'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-white px-4 text-xs font-semibold text-slate-600"
                >
                  Tolak Undangan
                </button>
              </div>
            </div>
          )}

        {!inspectQuery.isLoading &&
          actionStatus === 'idle' &&
          info?.status === 'accepted' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-status-success" />
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Undangan Sudah Diterima
              </h2>
              <button
                type="button"
                onClick={onGoHome}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white"
              >
                Masuk ke Beranda Scanner
              </button>
            </div>
          )}

        {!inspectQuery.isLoading &&
          actionStatus === 'idle' &&
          info?.status === 'invalid' && (
            <div className="space-y-4 text-center">
              <XCircle className="mx-auto h-12 w-12 text-status-danger" />
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900">
                  Undangan Tidak Berlaku
                </h2>
                <p className="mt-1 text-xs text-slate-500">{info.message}</p>
              </div>
              <button
                type="button"
                onClick={onGoHome}
                className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border-subtle bg-white px-4 text-xs font-semibold text-slate-700"
              >
                Kembali ke Beranda
              </button>
            </div>
          )}
      </div>

      <p className="pb-2 text-center text-[11px] text-slate-400">
        Hectix Operational Scanner Platform
      </p>
    </div>
  );
}
