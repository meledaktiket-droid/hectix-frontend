import type { PhysicalWristband, WristbandStatus } from '../types/scanner.ts';

export function formatWibDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return (
      d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        })
        .replace('.', ':') + ' WIB'
    );
  } catch {
    return null;
  }
}

export interface RawPhysicalTicket {
  id: string;
  code: string;
  validityStatus: string;
  usageState: string;
  orderRef: string | null;
  customerName: string | null;
  batchName: string | null;
  activatedAt: string | null;
  activatedByName?: string | null;
  lastActorName?: string | null;
  lastInAt: string | null;
  lastOutAt: string | null;
}

export function mapPhysicalTicketRow(t: RawPhysicalTicket): PhysicalWristband {
  let status: WristbandStatus = 'active';
  if (t.validityStatus === 'VOID' || t.validityStatus === 'REVOKED') status = 'void';
  else if (t.validityStatus === 'STOCK') status = 'stock';
  else if (t.usageState === 'INSIDE') status = 'inside';
  else if (t.usageState === 'EXITED') status = 'outside';

  const scannerName =
    (t.lastActorName && t.lastActorName !== '-' ? t.lastActorName : '') || '-';

  const timeline = [];
  if (t.lastOutAt) {
    timeline.push({
      id: `${t.id}-out`,
      label: 'Tap Keluar Gate',
      detail: scannerName !== '-' ? `Oleh ${scannerName}` : 'Tercatat keluar venue',
      timestamp: formatWibDateTime(t.lastOutAt) ?? '-',
    });
  }
  if (t.lastInAt) {
    timeline.push({
      id: `${t.id}-in`,
      label: 'Tap Masuk Gate',
      detail: scannerName !== '-' ? `Oleh ${scannerName}` : 'Tercatat masuk venue',
      timestamp: formatWibDateTime(t.lastInAt) ?? '-',
    });
  }

  const rawLastTap = t.lastInAt ?? t.lastOutAt;

  return {
    id: t.id,
    code: t.code,
    status,
    holderName: t.customerName || 'Pemegang Tiket',
    scannerName,
    orderRef: t.orderRef || '-',
    tierName: t.batchName || 'Tiket Fisik',
    redeemedAt: t.activatedAt ?? '-',
    lastTapAt: formatWibDateTime(rawLastTap),
    timeline,
  };
}
