import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Clock, Search, Ticket, TicketX, User, X } from 'lucide-react';
import { WristbandDetailSheet } from '../components/WristbandDetailSheet';
import { useScanner } from '../context/scannerStore';
import { getPhysicalTicketList, getRedeemedEtickets, redeemTickets } from '../lib/api';
import { cleanTicketName } from '../lib/formatTicketName';
import { WRISTBAND_STATUS_STYLE } from '../lib/wristbandBadge';
import type { PhysicalWristband, RedeemedEticketItem, WristbandStatus } from '../types/scanner';

const FILTER_TABS: { id: WristbandStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'inside', label: 'Di Dalam' },
  { id: 'active', label: 'Aktif' },
  { id: 'outside', label: 'Keluar' },
  { id: 'void', label: 'Void' },
];

type ListTab = 'eticket' | 'physical';
type EticketFilter = 'all' | 'unredeemed' | 'redeemed';

const ETICKET_FILTER_TABS: { id: EticketFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'unredeemed', label: 'Belum Ditukar' },
  { id: 'redeemed', label: 'Sudah Ditukar' },
];

export function WristbandListPage() {
  const { activeEvent } = useScanner();
  const queryClient = useQueryClient();
  const [listTab, setListTab] = useState<ListTab>('eticket');
  const [eticketFilter, setEticketFilter] = useState<EticketFilter>('all');
  const [statusFilter, setStatusFilter] = useState<WristbandStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWristband, setSelectedWristband] =
    useState<PhysicalWristband | null>(null);
  const [selectedEticket, setSelectedEticket] =
    useState<RedeemedEticketItem | null>(null);
  const [redeemingEticket, setRedeemingEticket] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const eticketQuery = useQuery({
    queryKey: ['scanner-etickets', activeEvent?.id, eticketFilter, searchQuery],
    queryFn: () =>
      getRedeemedEtickets({
        eventId: activeEvent!.id,
        status: eticketFilter,
        query: searchQuery,
      }),
    enabled: Boolean(activeEvent?.id) && listTab === 'eticket',
  });

  const listQuery = useQuery({
    queryKey: ['scanner-wristbands', activeEvent?.id, statusFilter, searchQuery],
    queryFn: () =>
      getPhysicalTicketList({
        eventId: activeEvent!.id,
        status: statusFilter,
        query: searchQuery,
      }),
    enabled: Boolean(activeEvent?.id) && listTab === 'physical',
  });

  const etickets = eticketQuery.data?.etickets ?? [];
  const eticketStats = eticketQuery.data?.stats;
  const wristbands = listQuery.data?.tickets ?? [];
  const physicalStats = listQuery.data?.stats;

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* Header + Tabs + Search */}
      <div className="space-y-3 border-b border-border-subtle bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              Daftar Tiket
            </h2>
            {listTab === 'eticket' && eticketStats && (
              <p className="text-xs font-medium text-slate-500">
                Ditukar: <span className="font-bold text-hectix-navy">{eticketStats.totalRedeemed} / {eticketStats.totalCapacity}</span> tiket
              </p>
            )}
            {listTab === 'physical' && physicalStats && (
              <p className="text-xs font-medium text-slate-500">
                Masuk / Keluar: <span className="font-bold text-hectix-navy">{physicalStats.enteredCount} / {physicalStats.totalCapacity}</span> tiket
              </p>
            )}
          </div>
        </div>

        {/* E-Ticket vs Tiket Fisik Tabs */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setListTab('eticket')}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              listTab === 'eticket'
                ? 'bg-white text-hectix-navy shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-Ticket
          </button>
          <button
            type="button"
            onClick={() => setListTab('physical')}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              listTab === 'physical'
                ? 'bg-white text-hectix-navy shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tiket Fisik
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              listTab === 'eticket'
                ? 'Cari invoice, barcode, nama pembeli, atau tipe tiket...'
                : 'Cari kode tiket, nama, atau invoice...'
            }
            className="w-full rounded-xl border border-border-subtle bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none focus:border-hectix-blue focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        {listTab === 'eticket' ? (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {ETICKET_FILTER_TABS.map((tab) => {
              const active = eticketFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEticketFilter(tab.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-hectix-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTER_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-hectix-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2.5 p-4">
        {listTab === 'eticket' ? (
          etickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <TicketX className="h-10 w-10 text-slate-300" />
              <p className="font-heading mt-3 text-sm font-bold text-slate-700">
                Data E-Ticket Kosong
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tidak ada e-ticket yang cocok dengan filter atau pencarian Anda.
              </p>
            </div>
          ) : (
            etickets.map((et) => (
              <button
                key={et.orderItemId}
                type="button"
                onClick={() => {
                  setRedeemError(null);
                  setSelectedEticket(et);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-white p-3.5 text-left transition hover:bg-slate-50 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-hectix-navy">
                      {et.orderRef}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        et.redeemedQty === 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {et.redeemedQty === 0
                        ? `Belum Ditukar (0/${et.boughtQty})`
                        : `${et.redeemedQty}/${et.boughtQty} Ditukar`}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                    {et.customerName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {cleanTicketName(et.ticketTypeName)}
                  </p>
                  {et.redeemedQty > 0 && (
                    <p className="mt-0.5 truncate text-[11px] font-medium text-hectix-blue">
                      Scanner: {et.scannerName || '-'}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))
          )
        ) : wristbands.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <TicketX className="h-10 w-10 text-slate-300" />
            <p className="font-heading mt-3 text-sm font-bold text-slate-700">
              Data Tiket Kosong
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tidak ada tiket fisik yang cocok dengan filter atau pencarian Anda.
            </p>
          </div>
        ) : (
          wristbands.map((wb) => {
            const badge = WRISTBAND_STATUS_STYLE[wb.status];
            return (
              <button
                key={wb.id}
                type="button"
                onClick={() => setSelectedWristband(wb)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-white p-3.5 text-left transition hover:bg-slate-50 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-hectix-navy">
                      {wb.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                    {wb.holderName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {wb.tierName} &middot; {wb.orderRef}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-hectix-blue">
                    Scanner: {wb.scannerName || '-'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })
        )}
      </div>

      {/* E-Ticket Detail Sheet */}
      {selectedEticket && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[1px]"
          onClick={() => setSelectedEticket(null)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-hectix-navy">
                    {selectedEticket.orderRef}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {selectedEticket.redeemedQty}/{selectedEticket.boughtQty} Ditukar
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {cleanTicketName(selectedEticket.ticketTypeName)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEticket(null)}
                aria-label="Tutup detail e-ticket"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">Pembeli</p>
                  <p className="truncate font-semibold text-slate-900">
                    {selectedEticket.customerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">Sisa Belum Ditukar</p>
                  <p className="truncate font-semibold text-slate-900">
                    {selectedEticket.remainingQty} tiket
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-200/70 pt-2">
                <User className="h-4 w-4 shrink-0 text-hectix-blue" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">Petugas Scanner</p>
                  <p className="truncate font-semibold text-slate-900">
                    {selectedEticket.scannerName || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-200/70 pt-2">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">
                    {selectedEticket.redeemedQty > 0 ? 'Waktu Tukar' : 'Waktu Order'}
                  </p>
                  <p className="truncate font-semibold text-slate-900">
                    {new Date(selectedEticket.redeemedAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta',
                    }).replace('.', ':') + ' WIB'}
                  </p>
                </div>
              </div>
            </div>

            {redeemError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {redeemError}
              </p>
            )}

            {selectedEticket.remainingQty > 0 && activeEvent && (
              <button
                type="button"
                disabled={redeemingEticket}
                onClick={async () => {
                  setRedeemingEticket(true);
                  setRedeemError(null);
                  try {
                    await redeemTickets({
                      eventId: activeEvent.id,
                      orderId: selectedEticket.orderId,
                      mode: 'UNLINKED',
                      wristbands: [],
                      buyerName: selectedEticket.customerName,
                      totalRemainingBefore: selectedEticket.remainingQty,
                      items: [
                        {
                          orderItemId: selectedEticket.orderItemId,
                          quantity: selectedEticket.remainingQty,
                        },
                      ],
                    });
                    setSelectedEticket(null);
                    await queryClient.invalidateQueries({ queryKey: ['scanner-etickets'] });
                  } catch (err) {
                    setRedeemError(
                      err instanceof Error ? err.message : 'Gagal menukar e-ticket'
                    );
                  } finally {
                    setRedeemingEticket(false);
                  }
                }}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-status-success px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                {redeemingEticket
                  ? 'Memproses Penukaran...'
                  : `Tukar Tiket / Akses (${selectedEticket.remainingQty})`}
              </button>
            )}
          </div>
        </div>
      )}

      <WristbandDetailSheet
        wristband={selectedWristband}
        onClose={() => setSelectedWristband(null)}
      />
    </div>
  );
}
