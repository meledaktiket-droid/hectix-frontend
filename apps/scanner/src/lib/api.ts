import type {
  GateScanResult,
  InviteInspectResponse,
  PhysicalWristband,
  ReconciliationSummary,
  RedeemResult,
  RedemptionOrderLookup,
  ScannerEvent,
  ScannerSession,
  ScannerUser,
  StaffRole,
} from '../types/scanner';
import { mapGateError } from './scannerErrors';
import { mapPhysicalTicketRow, type RawPhysicalTicket } from './ticketMapper';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function nextRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
      else if (data?.message) msg = String(data.message);
    } catch {
      // Non-JSON error bodies fall back to HTTP status.
    }
    throw new ApiError(res.status, msg);
  }

  return res.json() as Promise<T>;
}

export async function getSession(): Promise<ScannerUser | null> {
  const data = await apiFetch<{ user?: ScannerUser } | null>('/api/auth/get-session');
  return data?.user ?? null;
}

export async function startGoogleLogin(callbackURL = '/'): Promise<void> {
  const data = await apiFetch<{ url?: string }>('/api/auth/sign-in/social', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'google',
      callbackURL,
      errorCallbackURL: '/login',
    }),
  });
  if (!data?.url) {
    throw new Error('Gagal mendapatkan URL login Google.');
  }
  window.location.href = data.url;
}

export async function signOutScanner(): Promise<void> {
  try {
    await apiFetch('/api/auth/sign-out', { method: 'POST', body: '{}' });
  } finally {
    window.location.href = '/login';
  }
}

export async function getScannerEvents(): Promise<{
  events: ScannerEvent[];
  role: StaffRole;
}> {
  const data = await apiFetch<{ events?: ScannerEvent[]; role?: StaffRole }>(
    '/api/scanner/events'
  );
  return {
    events: data?.events ?? [],
    role: data?.role ?? 'scanner',
  };
}

export async function getScannerSessions(eventId: string): Promise<ScannerSession[]> {
  const data = await apiFetch<{ sessions?: ScannerSession[] }>(
    `/api/scanner/sessions?eventId=${encodeURIComponent(eventId)}`
  );
  return data?.sessions ?? [];
}

export async function getReconciliation(
  eventId: string
): Promise<ReconciliationSummary> {
  const data = await apiFetch<{
    summary?: {
      totalETicketsPaid?: number;
      totalETicketsRedeemed?: number;
      currentInside?: number;
      uniqueEntered?: number;
      totalExited?: number;
      totalWristbandsVoid?: number;
    };
  }>(`/api/scanner/reconciliation?eventId=${encodeURIComponent(eventId)}`);

  return {
    totalSold: data.summary?.totalETicketsPaid ?? 0,
    totalRedeemed: data.summary?.totalETicketsRedeemed ?? 0,
    currentlyInside: data.summary?.currentInside ?? 0,
    totalGateIn: data.summary?.uniqueEntered ?? 0,
    totalGateOut: data.summary?.totalExited ?? 0,
    totalVoidReplaced: data.summary?.totalWristbandsVoid ?? 0,
  };
}

export async function lookupEticket(
  code: string,
  eventId: string
): Promise<RedemptionOrderLookup> {
  return apiFetch<RedemptionOrderLookup>('/api/scanner/lookup-eticket', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim(), eventId }),
  });
}

export async function redeemTickets(payload: {
  orderId: string;
  eventId: string;
  mode?: 'LINKED' | 'UNLINKED';
  items: { orderItemId: string; quantity: number }[];
  wristbands: string[];
  buyerName: string;
  totalRemainingBefore: number;
}): Promise<RedeemResult> {
  const mode = payload.mode ?? 'LINKED';
  let offset = 0;
  const goItems = payload.items.map((item) => {
    const physicalCodes =
      mode === 'LINKED'
        ? payload.wristbands.slice(offset, offset + item.quantity)
        : [];
    offset += item.quantity;
    return {
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      physicalCodes,
    };
  });

  const res = await apiFetch<{
    redeemedCount?: number;
    remainingAfter?: number;
  }>('/api/scanner/redeem', {
    method: 'POST',
    body: JSON.stringify({
      requestId: nextRequestId('redeem'),
      orderId: payload.orderId,
      eventId: payload.eventId,
      mode,
      items: goItems,
    }),
  });

  const redeemedCount =
    res.redeemedCount ?? payload.items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    success: true,
    redeemedCount,
    remainingAfter:
      res.remainingAfter ??
      Math.max(0, payload.totalRemainingBefore - redeemedCount),
    wristbands: payload.wristbands,
    buyerName: payload.buyerName,
  };
}

export async function gateScan(payload: {
  action: 'in' | 'out';
  code: string;
  eventId: string;
  sessionId: string;
  gateLabel?: string;
}): Promise<GateScanResult> {
  const code = payload.code.trim();
  const endpoint =
    payload.action === 'in' ? '/api/scanner/gate-in' : '/api/scanner/gate-out';
  const nowLabel = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  try {
    const res = await apiFetch<{
      result?: string;
      message?: string;
      holderName?: string;
      attendeeName?: string;
      ticketTypeName?: string;
      tierName?: string;
    }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        requestId: nextRequestId('gate'),
        code,
        eventId: payload.eventId,
        sessionId: payload.sessionId,
        gateLabel: payload.gateLabel ?? '',
      }),
    });

    return {
      outcome: payload.action === 'in' ? 'approved_in' : 'approved_out',
      code,
      title:
        payload.action === 'in'
          ? 'Berhasil Masuk'
          : 'Berhasil Keluar',
      message:
        res.message ||
        (payload.action === 'in'
          ? 'Pengunjung diizinkan masuk area venue.'
          : 'Pengunjung tercatat keluar area venue.'),
      holderName: res.holderName ?? res.attendeeName ?? 'Pemegang Tiket',
      tierName: res.tierName ?? res.ticketTypeName ?? 'Tiket Aktif',
      timestamp: nowLabel,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan ditolak oleh server.';
    const mapped = mapGateError(msg);
    return {
      outcome: mapped.outcome,
      code,
      title: mapped.title,
      message: mapped.message,
      timestamp: nowLabel,
    };
  }
}

export async function getPhysicalTicketList(params: {
  eventId: string;
  status?: import('../types/scanner').WristbandStatus | 'all';
  query?: string;
}): Promise<{ tickets: PhysicalWristband[]; stats: import('../types/scanner').PhysicalTicketStats }> {
  const qs = new URLSearchParams({ eventId: params.eventId });
  if (params.status && params.status !== 'all') {
    const goStatus =
      params.status === 'inside'
        ? 'INSIDE'
        : params.status === 'outside'
          ? 'EXITED'
          : params.status.toUpperCase();
    qs.set('status', goStatus);
  }
  if (params.query?.trim()) qs.set('q', params.query.trim());

  const data = await apiFetch<{
    stats?: Partial<import('../types/scanner').PhysicalTicketStats>;
    tickets?: RawPhysicalTicket[];
  }>(`/api/scanner/physical-tickets?${qs.toString()}`);

  const tickets: PhysicalWristband[] = (data?.tickets ?? []).map(mapPhysicalTicketRow);

  const s = data?.stats;
  return {
    tickets,
    stats: {
      totalTickets: s?.totalTickets ?? tickets.length,
      stock: s?.stock ?? 0,
      active: s?.active ?? 0,
      inside: s?.inside ?? 0,
      exited: s?.exited ?? 0,
      enteredCount: s?.enteredCount ?? ((s?.inside ?? 0) + (s?.exited ?? 0)),
      totalCapacity: s?.totalCapacity ?? (s?.totalTickets ?? tickets.length),
    },
  };
}

export async function getPhysicalWristbands(params: {
  eventId: string;
  status?: import('../types/scanner').WristbandStatus | 'all';
  query?: string;
}): Promise<PhysicalWristband[]> {
  const res = await getPhysicalTicketList(params);
  return res.tickets;
}

export async function getRedeemedEtickets(params: {
  eventId: string;
  status?: 'all' | 'unredeemed' | 'redeemed';
  query?: string;
}): Promise<{
  etickets: import('../types/scanner').RedeemedEticketItem[];
  stats: import('../types/scanner').RedeemedEticketStats;
}> {
  const qs = new URLSearchParams({ eventId: params.eventId });
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.query?.trim()) qs.set('q', params.query.trim());

  const data = await apiFetch<{
    stats?: Partial<import('../types/scanner').RedeemedEticketStats>;
    etickets?: import('../types/scanner').RedeemedEticketItem[];
  }>(`/api/scanner/etickets?${qs.toString()}`);

  const etickets = data?.etickets ?? [];
  return {
    etickets,
    stats: {
      totalRedeemed: data?.stats?.totalRedeemed ?? 0,
      totalCapacity: data?.stats?.totalCapacity ?? 0,
    },
  };
}

export async function replaceWristband(payload: {
  eventId: string;
  oldCode: string;
  newCode: string;
  reason: string;
}): Promise<{ success: boolean; message: string }> {
  const oldCode = payload.oldCode.trim();
  const newCode = payload.newCode.trim();

  const res = await apiFetch<{ message?: string }>('/api/scanner/supervisor/replace', {
    method: 'POST',
    body: JSON.stringify({
      requestId: nextRequestId('replace'),
      eventId: payload.eventId,
      oldCode,
      newCode,
      reason: payload.reason,
    }),
  });

  return {
    success: true,
    message: res.message || `Gelang ${oldCode} berhasil diganti ke ${newCode}.`,
  };
}

export async function inspectInvite(inviteId: string): Promise<InviteInspectResponse> {
  return apiFetch<InviteInspectResponse>('/api/invitations/inspect', {
    method: 'POST',
    body: JSON.stringify({ id: inviteId }),
  });
}

export async function acceptInvite(inviteId: string): Promise<void> {
  await apiFetch('/api/auth/organization/accept-invitation', {
    method: 'POST',
    body: JSON.stringify({ invitationId: inviteId }),
  });
}

export async function rejectInvite(inviteId: string): Promise<void> {
  await apiFetch('/api/auth/organization/reject-invitation', {
    method: 'POST',
    body: JSON.stringify({ invitationId: inviteId }),
  });
}
