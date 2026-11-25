import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useScanner } from '../context/scannerStore';
import { gateScan } from '../lib/api';
import {
  flushOfflineQueue,
  listOfflineScans,
  subscribeQueueChange,
} from '../lib/offlineQueue';

export function OfflineBanner() {
  const { isOnline } = useScanner();
  const queryClient = useQueryClient();

  const queueQuery = useQuery({
    queryKey: ['offline-queue-count'],
    queryFn: async () => (await listOfflineScans()).length,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      flushOfflineQueue(async (item) => {
        await gateScan({
          action: item.action,
          code: item.code,
          eventId: item.eventId,
          sessionId: item.sessionId,
        });
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['offline-queue-count'] });
    },
  });

  useEffect(() => {
    return subscribeQueueChange(() => {
      queryClient.invalidateQueries({ queryKey: ['offline-queue-count'] });
    });
  }, [queryClient]);

  const pendingCount = queueQuery.data ?? 0;
  const isSyncing = syncMutation.isPending;

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncMutation.mutate();
    }
  }, [isOnline, pendingCount, isSyncing, syncMutation]);

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-2 text-xs font-semibold ${
        !isOnline
          ? 'bg-amber-500 text-slate-950'
          : 'bg-hectix-blue text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 shrink-0" />
        ) : (
          <RefreshCw
            className={`h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
          />
        )}
        <span>
          {!isOnline
            ? `Mode Offline — ${pendingCount} scan antre`
            : isSyncing
              ? `Menyinkronkan ${pendingCount} scan...`
              : `${pendingCount} scan belum tersinkron`}
        </span>
      </div>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={() => syncMutation.mutate()}
          className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold hover:bg-white/30"
        >
          Sinkronkan
        </button>
      )}
    </div>
  );
}
