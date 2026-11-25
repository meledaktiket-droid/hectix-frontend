export type OperationalMode = 'redemption' | 'gate_in' | 'gate_out';

export type AppTab = 'home' | 'scan' | 'wristbands' | 'settings';

export type StaffRole = 'scanner' | 'supervisor' | 'organizer' | 'admin';

export interface ScannerUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface ScannerEvent {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  venueName?: string | null;
}

export interface ScannerSession {
  id: string;
  name: string;
  startsAt?: string;
  endsAt?: string;
  allowReentry: boolean;
  quotaLimit: number;
  currentInside: number;
  uniqueEntered: number;
}

export interface ReconciliationSummary {
  totalSold: number;
  totalRedeemed: number;
  currentlyInside: number;
  totalGateIn: number;
  totalGateOut: number;
  totalVoidReplaced: number;
}

export interface RecentScanItem {
  id: string;
  code: string;
  holderName: string;
  tierName: string;
  action: 'redeem' | 'gate_in' | 'gate_out' | 'rejected';
  timestamp: string;
}

export interface RedemptionItem {
  orderItemId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  boughtQty: number;
  redeemedQty: number;
  remainingQty: number;
  accessType: string;
}

export interface RedemptionOrderLookup {
  order: {
    id: string;
    referenceNumber: string;
    barcode: string;
    status: string;
    total: number;
    buyerName: string;
    buyerEmail: string;
    eventId: string;
    eventName: string;
    createdAt: string;
  };
  summary: {
    totalBought: number;
    totalRedeemed: number;
    totalRemaining: number;
  };
  items: RedemptionItem[];
}

export interface RedeemResult {
  success: boolean;
  redeemedCount: number;
  remainingAfter: number;
  wristbands: string[];
  buyerName: string;
}

export type GateScanOutcome =
  | 'approved_in'
  | 'approved_out'
  | 'rejected_duplicate'
  | 'rejected_wrong_session'
  | 'rejected_not_activated'
  | 'rejected_quota_full'
  | 'rejected_no_reentry'
  | 'rejected_generic';

export interface GateScanResult {
  outcome: GateScanOutcome;
  code: string;
  title: string;
  message: string;
  holderName?: string;
  tierName?: string;
  timestamp: string;
}

export type WristbandStatus = 'stock' | 'active' | 'inside' | 'outside' | 'void';

export interface WristbandTimelineEvent {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
}

export interface PhysicalWristband {
  id: string;
  code: string;
  status: WristbandStatus;
  holderName: string;
  scannerName: string;
  orderRef: string;
  tierName: string;
  redeemedAt: string;
  lastTapAt: string | null;
  replacedByCode?: string;
  timeline: WristbandTimelineEvent[];
}

export interface PhysicalTicketStats {
  totalTickets: number;
  stock: number;
  active: number;
  inside: number;
  exited: number;
  enteredCount: number;
  totalCapacity: number;
}

export interface RedeemedEticketItem {
  orderItemId: string;
  orderId: string;
  orderRef: string;
  barcode: string;
  ticketTypeName: string;
  customerName: string;
  customerEmail: string;
  boughtQty: number;
  redeemedQty: number;
  voidedQty: number;
  remainingQty: number;
  scannerName: string;
  redeemedAt: string;
}

export interface RedeemedEticketStats {
  totalRedeemed: number;
  totalCapacity: number;
}

export type InviteInspectResponse =
  | {
      status: 'needs-signin';
      email: string;
      orgName: string;
      roleLabel: string;
      inviterName: string;
      eventName?: string;
    }
  | {
      status: 'mismatch';
      invitedEmail: string;
      signedInEmail: string;
    }
  | {
      status: 'accepted';
    }
  | {
      status: 'needs-accept';
      isVolunteer: boolean;
      email?: string;
      orgName?: string;
      roleLabel?: string;
      inviterName?: string;
      eventName?: string;
    }
  | {
      status: 'invalid';
      message: string;
    };
