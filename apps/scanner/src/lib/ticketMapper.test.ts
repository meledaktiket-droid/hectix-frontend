import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPhysicalTicketRow, type RawPhysicalTicket } from './ticketMapper.ts';

const baseRow: RawPhysicalTicket = {
  id: 'pt-1',
  code: 'HXP-001',
  validityStatus: 'ACTIVE',
  usageState: 'NOT_ENTERED',
  orderRef: 'ORD-1',
  customerName: 'Budi',
  batchName: 'VIP Batch',
  activatedAt: '2026-11-24T01:00:00Z',
  activatedByName: 'Admin Pembuat',
  lastActorName: '-',
  lastInAt: null,
  lastOutAt: null,
};

test('mapPhysicalTicketRow maps statuses mutually exclusively including VOID and REVOKED', () => {
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'STOCK' }).status, 'stock');
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'ACTIVE', usageState: 'NOT_ENTERED' }).status, 'active');
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'ACTIVE', usageState: 'INSIDE' }).status, 'inside');
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'ACTIVE', usageState: 'EXITED' }).status, 'outside');
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'VOID' }).status, 'void');
  assert.equal(mapPhysicalTicketRow({ ...baseRow, validityStatus: 'REVOKED' }).status, 'void');
});

test('mapPhysicalTicketRow uses gate lastActorName only and formats lastTapAt in WIB without ISO T/Z', () => {
  const notScanned = mapPhysicalTicketRow(baseRow);
  assert.equal(notScanned.scannerName, '-');
  assert.equal(notScanned.timeline.length, 0);
  assert.equal(notScanned.lastTapAt, null);

  const scanned = mapPhysicalTicketRow({
    ...baseRow,
    usageState: 'INSIDE',
    lastActorName: 'Petugas Gate 1',
    lastInAt: '2026-11-24T05:00:00Z', // 05:00 UTC = 12:00 WIB
  });
  assert.equal(scanned.scannerName, 'Petugas Gate 1');
  assert.equal(scanned.timeline.length, 1);
  assert.equal(scanned.timeline[0]?.label, 'Tap Masuk Gate');
  // 05:00 UTC + 7 hours = 12:00 WIB
  assert.equal(scanned.timeline[0]?.timestamp, '12:00 WIB');
  assert.equal(scanned.lastTapAt, '12:00 WIB');
});
