// Charts rendering
// Exported: renderCharts(list, deps)
// deps: { parseDate }

function renderYearChart(list, deps) {
  const mount = document.getElementById('yearChart');
  if (!mount) return;
  const counts = {};
  list.forEach(r => {
    const d = deps.parseDate(r.startDate);
    if (!d || Number.isNaN(d)) return;
    const y = d.getFullYear();
    counts[y] = (counts[y] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a,b)=>Number(a[0])-Number(b[0]));
  const max = Math.max(1, ...entries.map(([,v])=>v));
  mount.innerHTML = entries.map(([y,v])=>
    `<div class="bar" title="${y}: ${v}"><span class="bar-fill" style="width:${(v/max)*100}%"></span><span class="bar-label">${y} (${v})</span></div>`
  ).join('') || `<div class="muted">-</div>`;
}

function renderTagChart(list) {
  const mount = document.getElementById('tagChart');
  if (!mount) return;
  const counts = {};
  list.forEach(r => (r.tags||[]).forEach(t => counts[t] = (counts[t]||0)+1));
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 20);
  const max = Math.max(1, ...entries.map(([,v])=>v));
  mount.innerHTML = entries.map(([t,v])=>
    `<div class="bar" title="${t}: ${v}"><span class="bar-fill" style="width:${(v/max)*100}%"></span><span class="bar-label">${t} (${v})</span></div>`
  ).join('') || `<div class="muted">-</div>`;
}

export function renderCharts(list, deps) {
  renderYearChart(list, deps);
  renderTagChart(list);
}
