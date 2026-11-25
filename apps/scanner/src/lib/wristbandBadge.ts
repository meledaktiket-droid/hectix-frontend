import type { WristbandStatus } from '../types/scanner';

export const WRISTBAND_STATUS_STYLE: Record<
  WristbandStatus,
  { label: string; className: string }
> = {
  stock: {
    label: 'STOCK',
    className: 'bg-slate-100 text-slate-600',
  },
  active: {
    label: 'AKTIF',
    className: 'bg-blue-50 text-hectix-blue',
  },
  inside: {
    label: 'DI DALAM',
    className: 'bg-status-success-bg text-status-success',
  },
  outside: {
    label: 'KELUAR',
    className: 'bg-status-warning-bg text-status-warning',
  },
  void: {
    label: 'VOID',
    className: 'bg-status-danger-bg text-status-danger line-through',
  },
};
