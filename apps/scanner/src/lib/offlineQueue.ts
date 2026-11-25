export interface QueuedGateScan {
  id: string;
  action: 'in' | 'out';
  code: string;
  eventId: string;
  sessionId: string;
  queuedAt: string;
}

const DB_NAME = 'hectix_scanner_offline';
const STORE_NAME = 'scan_queue';
const DB_VERSION = 1;
const QUEUE_EVENT = 'hectix-offline-queue-change';

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notifyQueueChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(QUEUE_EVENT));
  }
}

export function subscribeQueueChange(listener: () => void): () => void {
  window.addEventListener(QUEUE_EVENT, listener);
  return () => window.removeEventListener(QUEUE_EVENT, listener);
}

export async function enqueueOfflineScan(
  scan: Omit<QueuedGateScan, 'id' | 'queuedAt'>
): Promise<QueuedGateScan> {
  const item: QueuedGateScan = {
    ...scan,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  };

  const db = await openQueueDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notifyQueueChange();
  return item;
}

export async function listOfflineScans(): Promise<QueuedGateScan[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openQueueDb();
  const items = await new Promise<QueuedGateScan[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as QueuedGateScan[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

export async function removeOfflineScan(id: string): Promise<void> {
  const db = await openQueueDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notifyQueueChange();
}

export async function flushOfflineQueue(
  syncFn: (item: QueuedGateScan) => Promise<void>
): Promise<{ synced: number; remaining: number }> {
  const items = await listOfflineScans();
  let synced = 0;

  for (const item of items) {
    try {
      await syncFn(item);
      await removeOfflineScan(item.id);
      synced += 1;
    } catch {
      // Stop on network failure and retry next online event
      break;
    }
  }

  const remaining = (await listOfflineScans()).length;
  return { synced, remaining };
}
