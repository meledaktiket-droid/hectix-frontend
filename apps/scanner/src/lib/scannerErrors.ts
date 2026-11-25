import type { GateScanOutcome } from '../types/scanner';

interface MappedGateError {
  outcome: GateScanOutcome;
  title: string;
  message: string;
}

export function mapGateError(rawMessage: string): MappedGateError {
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('already inside') ||
    lower.includes('sudah digunakan') ||
    lower.includes('sudah masuk') ||
    lower.includes('duplicate')
  ) {
    return {
      outcome: 'rejected_duplicate',
      title: 'Tiket Sudah Digunakan',
      message: rawMessage || 'Gelang/tiket ini sudah tercatat masuk di dalam venue.',
    };
  }

  if (
    lower.includes('not activated') ||
    lower.includes('belum aktif') ||
    lower.includes('belum ditukar') ||
    lower.includes('unredeemed')
  ) {
    return {
      outcome: 'rejected_not_activated',
      title: 'Tiket Belum Aktif',
      message:
        rawMessage ||
        'Pengunjung harus menukarkan e-ticket di Pos Penukaran terlebih dahulu.',
    };
  }

  if (
    lower.includes('wrong session') ||
    lower.includes('wrong event') ||
    lower.includes('salah sesi') ||
    lower.includes('salah acara')
  ) {
    return {
      outcome: 'rejected_wrong_session',
      title: 'Salah Sesi / Gate',
      message: rawMessage || 'Tiket ini tidak berlaku untuk sesi atau pintu gate ini.',
    };
  }

  if (lower.includes('quota') || lower.includes('full') || lower.includes('penuh')) {
    return {
      outcome: 'rejected_quota_full',
      title: 'Kuota Sesi Penuh',
      message: rawMessage || 'Kapasitas okupansi sesi saat ini sudah mencapai batas maksimal.',
    };
  }

  if (lower.includes('re-entry') || lower.includes('reentry') || lower.includes('keluar')) {
    return {
      outcome: 'rejected_no_reentry',
      title: 'Re-entry Tidak Diizinkan',
      message: rawMessage || 'Sesi ini tidak mengizinkan pengunjung masuk kembali setelah keluar.',
    };
  }

  return {
    outcome: 'rejected_generic',
    title: 'Scan Ditolak',
    message: rawMessage || 'Kode gelang atau tiket tidak valid untuk aksi ini.',
  };
}
