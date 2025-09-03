// UI helpers for stats and filters
// Exports: renderStats(list, i18n), renderTagFilter(list, i18n)

export function renderStats(list, i18n) {
  const total = list.length;
  const withTags = new Set(list.flatMap(r => r.tags || []));
  const stats = document.getElementById('stats');
  if (stats) stats.textContent = i18n.t('stats', { total, tags: withTags.size });
}

export function renderTagFilter(list, i18n) {
  const select = document.getElementById('tagFilter');
  if (!select) return;
  const tags = Array.from(new Set(list.flatMap(r => r.tags || []))).sort((a,b)=>a.localeCompare(b,'zh'));
  select.innerHTML = `<option value="">${i18n.t('allTags')}</option>` + tags.map(t => `<option value="${t}">${t}</option>`).join('');
}
