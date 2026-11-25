import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanTicketName } from './formatTicketName.ts';

test('cleanTicketName removes sold-out suffixes case-insensitively', () => {
  assert.equal(cleanTicketName('Early Bird (Sudah Habis)'), 'Early Bird');
  assert.equal(cleanTicketName('Presale 2 (sudah habis)'), 'Presale 2');
  assert.equal(cleanTicketName('VIP (Sold Out)'), 'VIP');
  assert.equal(cleanTicketName('Festival (Habis)'), 'Festival');
});

test('cleanTicketName preserves normal ticket names and handles empty values', () => {
  assert.equal(cleanTicketName('Regular Ticket (Limited)'), 'Regular Ticket (Limited)');
  assert.equal(cleanTicketName('2-Day VIP'), '2-Day VIP');
  assert.equal(cleanTicketName(''), '');
  assert.equal(cleanTicketName(null), '');
});
