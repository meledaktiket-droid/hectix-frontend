import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import type { OperationalMode } from '../types/scanner';

export const MODE_OPTIONS: {
  id: OperationalMode;
  title: string;
  description: string;
  badgeColor: string;
  icon: typeof RefreshCw;
}[] = [
  {
    id: 'redemption',
    title: 'Pos Penukaran E-Ticket',
    description: 'Scan QR Order / E-Ticket dan pasangkan ke gelang fisik',
    badgeColor: 'bg-blue-100 text-hectix-blue',
    icon: RefreshCw,
  },
  {
    id: 'gate_in',
    title: 'Gate Masuk (Gate-In)',
    description: 'Validasi gelang/tiket pengunjung masuk area acara',
    badgeColor: 'bg-emerald-100 text-status-success',
    icon: ArrowDownRight,
  },
  {
    id: 'gate_out',
    title: 'Gate Keluar (Gate-Out)',
    description: 'Catat pengunjung keluar untuk re-entry atau kontrol okupansi',
    badgeColor: 'bg-amber-100 text-status-warning',
    icon: ArrowUpRight,
  },
];
