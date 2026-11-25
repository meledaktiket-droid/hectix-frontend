import assert from 'node:assert/strict';
import test from 'node:test';
import { mapGateError } from './scannerErrors.ts';

test('mapGateError maps domain errors without leaking UIxx spec codes', () => {
  const cases = [
    ['Ticket already inside', 'rejected_duplicate', 'Tiket Sudah Digunakan'],
    ['Gelang belum aktif', 'rejected_not_activated', 'Tiket Belum Aktif'],
    ['Wrong session for ticket', 'rejected_wrong_session', 'Salah Sesi / Gate'],
    ['Quota full', 'rejected_quota_full', 'Kuota Sesi Penuh'],
    ['Re-entry tidak diizinkan', 'rejected_no_reentry', 'Re-entry Tidak Diizinkan'],
  ] as const;

  for (const [raw, wantOutcome, wantTitle] of cases) {
    const mapped = mapGateError(raw);
    assert.equal(mapped.outcome, wantOutcome);
    assert.equal(mapped.title, wantTitle);
    assert.doesNotMatch(mapped.title, /\(UI\d+\)/);
  }
});
