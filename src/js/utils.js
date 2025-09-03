// Utility helpers
export function parseDate(s) {
  // 支持 YYYY-MM 或 YYYY-MM-DD
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date(s);
}

export function formatDate(s) {
  if (!s) return '';
  const d = parseDate(s);
  if (!d || Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function recordKey(r) {
  return [r.name || '', (r.tags||[]).join(','), r.notes || ''].join('\n').toLowerCase();
}

export function filterRecords(list, { q = '', tag = '' } = {}) {
  let res = list;
  if (q) {
    const kw = q.toLowerCase();
    res = res.filter(r => recordKey(r).includes(kw));
  }
  if (tag) {
    res = res.filter(r => (r.tags || []).includes(tag));
  }
  return res;
}

export function sortRecords(list, order = 'desc') {
  const by = (r) => parseDate(r.startDate)?.getTime() || 0;
  const sorted = [...list].sort((a,b) => by(b) - by(a));
  return order === 'asc' ? sorted.reverse() : sorted;
}
