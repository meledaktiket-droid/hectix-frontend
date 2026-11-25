import { useCallback, useState } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { lookupEticket, redeemTickets } from '../lib/api';
import { playScanError, playScanSuccess } from '../lib/feedback';
import type { RedeemResult, RedemptionOrderLookup } from '../types/scanner';
import { CameraViewfinder } from '../components/CameraViewfinder';
import { ManualCodeModal } from '../components/ManualCodeModal';
import { RedemptionSuccessCard } from '../components/RedemptionSuccessCard';
import { TicketDetailCard } from '../components/TicketDetailCard';
import { WristbandPairingView } from '../components/WristbandPairingModal';

type RedemptionStep =
  | { name: 'scan_ticket' }
  | { name: 'select_qty'; lookup: RedemptionOrderLookup }
  | { name: 'pair_wristband'; lookup: RedemptionOrderLookup; quantities: Record<string, number> }
  | { name: 'success'; result: RedeemResult };

export function RedemptionPage() {
  const { activeEvent, openModeModal } = useScanner();
  const [step, setStep] = useState<RedemptionStep>({ name: 'scan_ticket' });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [manualOpen, setManualOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetToScan = useCallback(() => {
    setStep({ name: 'scan_ticket' });
    setQuantities({});
    setErrorMsg(null);
    setIsLoading(false);
  }, []);

  const handleLookupCode = useCallback(
    async (code: string) => {
      if (isLoading || !activeEvent) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await lookupEticket(code, activeEvent.id);
        const initQty: Record<string, number> = {};
        for (const item of data.items) {
          initQty[item.orderItemId] = item.remainingQty > 0 ? 1 : 0;
        }
        if (data.summary.totalRemaining === 0) {
          playScanError();
        } else {
          playScanSuccess();
        }
        setQuantities(initQty);
        setStep({ name: 'select_qty', lookup: data });
      } catch (err) {
        playScanError();
        setErrorMsg(err instanceof Error ? err.message : 'Gagal membaca e-ticket.');
      } finally {
        setIsLoading(false);
      }
    },
    [activeEvent, isLoading]
  );

  const handleConfirmRedeem = async (
    lookup: RedemptionOrderLookup,
    selectedQty: Record<string, number>,
    wristbands: string[],
    mode: 'LINKED' | 'UNLINKED' = 'LINKED'
  ) => {
    if (!activeEvent) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = Object.entries(selectedQty)
        .filter(([, q]) => q > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

      const result = await redeemTickets({
        orderId: lookup.order.id,
        eventId: activeEvent.id,
        mode,
        items,
        wristbands,
        buyerName: lookup.order.buyerName,
        totalRemainingBefore: lookup.summary.totalRemaining,
      });
      playScanSuccess();
      setStep({ name: 'success', result });
    } catch (err) {
      playScanError();
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses penukaran.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step.name === 'select_qty') {
    return (
      <div className="flex flex-1 flex-col">
        {errorMsg && (
          <div className="bg-status-danger px-4 py-2 text-center text-xs font-semibold text-white">
            {errorMsg}
          </div>
        )}
        <TicketDetailCard
          lookup={step.lookup}
          quantities={quantities}
          isSubmitting={isLoading}
          onChangeQty={(id, nextQty) =>
            setQuantities((prev) => ({ ...prev, [id]: nextQty }))
          }
          onCancel={resetToScan}
          onProceed={() => handleConfirmRedeem(step.lookup, quantities, [], 'UNLINKED')}
        />
      </div>
    );
  }

  if (step.name === 'pair_wristband') {
    const targetCount = Object.values(step.quantities).reduce((s, q) => s + q, 0);
    return (
      <WristbandPairingView
        buyerName={step.lookup.order.buyerName}
        targetCount={targetCount}
        isSubmitting={isLoading}
        onBack={() => setStep({ name: 'select_qty', lookup: step.lookup })}
        onConfirm={(wristbands) =>
          handleConfirmRedeem(step.lookup, step.quantities, wristbands, 'LINKED')
        }
      />
    );
  }

  if (step.name === 'success') {
    return <RedemptionSuccessCard result={step.result} onDone={resetToScan} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-white px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-hectix-blue">
          <RefreshCw className="h-3.5 w-3.5" />
          POS PENUKARAN
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openModeModal}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowRightLeft className="h-3 w-3" />
            Mode
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-status-danger px-4 py-2.5 text-center text-xs font-semibold text-white">
          {errorMsg}
        </div>
      )}

      <CameraViewfinder
        guideText="Arahkan kamera ke QR Code E-Ticket untuk Tukar Tiket / Akses"
        accentColor="blue"
        paused={manualOpen || isLoading}
        onScan={handleLookupCode}
        onManualInput={() => setManualOpen(true)}
      />

      <ManualCodeModal
        open={manualOpen}
        title="Input Kode E-Ticket"
        placeholder="Masukkan kode order / e-ticket"
        onClose={() => setManualOpen(false)}
        onSubmit={handleLookupCode}
      />
    </div>
  );
}
