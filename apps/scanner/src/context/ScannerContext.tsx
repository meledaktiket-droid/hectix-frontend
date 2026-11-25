import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getScannerEvents, getScannerSessions, getSession } from '../lib/api';
import type { AppTab, OperationalMode } from '../types/scanner';
import { ScannerContext } from './scannerStore';

const STORAGE_KEYS = {
  eventId: 'hectix_scanner_event_id',
  sessionId: 'hectix_scanner_session_id',
  mode: 'hectix_scanner_mode',
} as const;

export function ScannerProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.eventId) || ''
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.sessionId) || ''
  );

  const [operationalMode, setOperationalModeState] = useState<OperationalMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.mode);
    if (saved === 'redemption' || saved === 'gate_in' || saved === 'gate_out') {
      return saved;
    }
    return 'gate_in';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sessionQuery = useQuery({
    queryKey: ['scanner-auth-session'],
    queryFn: getSession,
  });

  const user = sessionQuery.data ?? null;

  const eventsQuery = useQuery({
    queryKey: ['scanner-events', user?.id],
    queryFn: getScannerEvents,
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
  });

  const events = eventsQuery.data?.events ?? [];
  const activeEvent =
    events.find((e) => e.id === selectedEventId) ?? events[0] ?? null;

  const sessionsQuery = useQuery({
    queryKey: ['scanner-sessions', activeEvent?.id],
    queryFn: () => getScannerSessions(activeEvent!.id),
    enabled: Boolean(user && activeEvent?.id),
  });

  const sessions = sessionsQuery.data ?? [];
  const activeSession =
    sessions.find((s) => s.id === selectedSessionId) ?? sessions[0] ?? null;

  const setActiveEventById = (id: string) => {
    setSelectedEventId(id);
    localStorage.setItem(STORAGE_KEYS.eventId, id);
  };

  const setActiveSessionById = (id: string) => {
    setSelectedSessionId(id);
    localStorage.setItem(STORAGE_KEYS.sessionId, id);
  };

  const setOperationalMode = (mode: OperationalMode) => {
    setOperationalModeState(mode);
    localStorage.setItem(STORAGE_KEYS.mode, mode);
  };

  return (
    <ScannerContext.Provider
      value={{
        user,
        staffRole: eventsQuery.data?.role ?? user?.role ?? 'scanner',
        isAuthLoading: sessionQuery.isLoading,
        isEventsLoading: eventsQuery.isLoading,
        isOnline,
        events,
        sessions,
        activeEvent,
        activeSession,
        operationalMode,
        activeTab,
        isSessionModalOpen,
        isModeModalOpen,
        setActiveEventById,
        setActiveSessionById,
        setOperationalMode,
        setActiveTab,
        openSessionModal: () => setIsSessionModalOpen(true),
        closeSessionModal: () => setIsSessionModalOpen(false),
        openModeModal: () => setIsModeModalOpen(true),
        closeModeModal: () => setIsModeModalOpen(false),
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
}
