const SOLD_OUT_SUFFIX_RE = /\s*\((?:sudah\s+habis|sold\s+out|habis)\)\s*$/i;

export function cleanTicketName(name?: string | null): string {
  const raw = (name ?? '').trim();
  if (!raw) return '';
  const cleaned = raw.replace(SOLD_OUT_SUFFIX_RE, '').trim();
  return cleaned || raw;
}
