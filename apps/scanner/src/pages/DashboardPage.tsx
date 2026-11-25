import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ChevronRight,
  QrCode,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { getPhysicalTicketList, getRedeemedEtickets, getReconciliation } from '../lib/api';
import { cleanTicketName } from '../lib/formatTicketName';
import { MODE_OPTIONS } from '../lib/modes';
import { WRISTBAND_STATUS_STYLE } from '../lib/wristbandBadge';

const EMPTY_SUMMARY = {
  totalSold: 0,
  totalRedeemed: 0,
  currentlyInside: 0,
  totalGateIn: 0,
  totalGateOut: 0,
  totalVoidReplaced: 0,
};

export function DashboardPage() {
  const {
    user,
    staffRole,
    activeEvent,
    activeSession,
    operationalMode,
    openModeModal,
    openSessionModal,
    setActiveTab,
  } = useScanner();

  const metricsQuery = useQuery({
    queryKey: ['scanner-reconciliation', activeEvent?.id],
    queryFn: () => getReconciliation(activeEvent!.id),
    enabled: Boolean(activeEvent?.id),
  });

  const recentQuery = useQuery({
    queryKey: ['scanner-recent-tickets', activeEvent?.id],
    queryFn: () => getPhysicalTicketList({ eventId: activeEvent!.id }),
    enabled: Boolean(activeEvent?.id),
  });

  const recentEticketsQuery = useQuery({
    queryKey: ['scanner-recent-etickets', activeEvent?.id],
    queryFn: () => getRedeemedEtickets({ eventId: activeEvent!.id, status: 'redeemed' }),
    enabled: Boolean(activeEvent?.id),
  });

  const summary = metricsQuery.data ?? EMPTY_SUMMARY;
  const physicalStats = recentQuery.data?.stats;
  const recentWristbands = (recentQuery.data?.tickets ?? [])
    .filter((t) => t.status !== 'stock')
    .slice(0, 5);
  const recentEtickets = (recentEticketsQuery.data?.etickets ?? []).slice(0, 5);
  const activeModeInfo =
    MODE_OPTIONS.find((m) => m.id === operationalMode) ?? MODE_OPTIONS[1];
  const ModeIcon = activeModeInfo.icon;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Petugas Aktif</p>
          <p className="font-heading text-sm font-bold text-slate-900">
            {user?.name || user?.email || 'Kru Lapangan'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-hectix-navy" />
          {staffRole}
        </span>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activeModeInfo.badgeColor}`}
            >
              <ModeIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Mode Aktif
              </span>
              <h2 className="font-heading text-base font-bold text-slate-900">
                {activeModeInfo.title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeSession
                  ? `${cleanTicketName(activeSession.name)} · ${activeSession.allowReentry ? 'Re-entry' : 'Sekali Masuk'}`
                  : 'Memuat sesi aktif...'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={!activeEvent}
            onClick={() => setActiveTab('scan')}
            className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-hectix-navy/95 active:scale-[0.99] disabled:opacity-40"
          >
            <QrCode className="h-5 w-5" />
            Mulai Scan Sekarang
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openModeModal}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Ganti Mode
            </button>
            <button
              type="button"
              disabled={!activeEvent}
              onClick={openSessionModal}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] disabled:opacity-40"
            >
              <Ticket className="h-3.5 w-3.5" />
              Ganti Sesi
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
            Ringkasan Langsung
          </h3>
          <span className="text-[11px] font-medium tabular-nums text-slate-400">
            Total Terjual: {summary.totalSold.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border-subtle bg-white p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Di Dalam Venue</span>
                <Users className="h-3.5 w-3.5 text-status-success" />
              </div>
              <p className="font-heading mt-1 text-2xl font-bold tabular-nums text-status-success">
                {summary.currentlyInside.toLocaleString('id-ID')}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Okupansi saat ini</p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-white p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tiket Ditukar</span>
                <Ticket className="h-3.5 w-3.5 text-hectix-blue" />
              </div>
              <p className="font-heading mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {summary.totalRedeemed.toLocaleString('id-ID')}
              </p>
              <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                {summary.totalSold > 0
                  ? `${Math.round((summary.totalRedeemed / summary.totalSold) * 100)}% dari terjual`
                  : '0% dari terjual'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-border-subtle bg-white py-3 text-center">
            <div className="px-2">
              <p className="text-[11px] text-slate-500">Tap Masuk</p>
              <p className="font-heading mt-0.5 text-base font-bold tabular-nums text-slate-900">
                {summary.totalGateIn.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="px-2">
              <p className="text-[11px] text-slate-500">Tap Keluar</p>
              <p className="font-heading mt-0.5 text-base font-bold tabular-nums text-slate-900">
                {summary.totalGateOut.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="px-2">
              <p className="text-[11px] text-slate-500">Tiket Fisik</p>
              <p className="font-heading mt-0.5 text-base font-bold tabular-nums text-hectix-navy">
                {physicalStats
                  ? `${physicalStats.enteredCount}/${physicalStats.totalCapacity}`
                  : '0/0'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-slate-900">
            Aktivitas Terakhir
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('wristbands')}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-hectix-blue"
          >
            Semua
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentWristbands.length === 0 && recentEtickets.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            {recentQuery.isLoading || recentEticketsQuery.isLoading
              ? 'Memuat aktivitas...'
              : 'Belum ada aktivitas scan.'}
          </p>
        ) : recentWristbands.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentWristbands.map((wb) => {
              const badge = WRISTBAND_STATUS_STYLE[wb.status];
              return (
                <div
                  key={wb.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {wb.holderName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-700">
                        {wb.code}
                      </span>{' '}
                      &middot; {wb.tierName} &middot; {wb.scannerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentEtickets.map((et) => (
              <div
                key={et.orderItemId}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {et.customerName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-700">
                      {et.orderRef}
                    </span>{' '}
                    &middot; {cleanTicketName(et.ticketTypeName)} &middot; {et.scannerName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {et.redeemedQty}/{et.boughtQty} Ditukar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
