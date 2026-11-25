import { createContext, useContext } from 'react';
import type {
  AppTab,
  OperationalMode,
  ScannerEvent,
  ScannerSession,
  ScannerUser,
  StaffRole,
} from '../types/scanner';

export interface ScannerContextValue {
  user: ScannerUser | null;
  staffRole: StaffRole;
  isAuthLoading: boolean;
  isEventsLoading: boolean;
  isOnline: boolean;
  events: ScannerEvent[];
  sessions: ScannerSession[];
  activeEvent: ScannerEvent | null;
  activeSession: ScannerSession | null;
  operationalMode: OperationalMode;
  activeTab: AppTab;
  isSessionModalOpen: boolean;
  isModeModalOpen: boolean;
  setActiveEventById: (id: string) => void;
  setActiveSessionById: (id: string) => void;
  setOperationalMode: (mode: OperationalMode) => void;
  setActiveTab: (tab: AppTab) => void;
  openSessionModal: () => void;
  closeSessionModal: () => void;
  openModeModal: () => void;
  closeModeModal: () => void;
}

export const ScannerContext = createContext<ScannerContextValue | null>(null);

export function useScanner(): ScannerContextValue {
  const ctx = useContext(ScannerContext);
  if (!ctx) {
    throw new Error('useScanner must be used inside ScannerProvider');
  }
  return ctx;
}
