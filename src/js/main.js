async function loadData() {
  // 优先加载真实数据，其次回退到示例数据
  try {
    const res = await fetch('data/records.json', { cache: 'no-store' });
    if (res.ok) return res.json();
    console.warn('records.json 不可用，状态：', res.status, '，尝试加载 records.example.json');
  } catch (e) {
    console.warn('加载 records.json 失败，尝试加载 records.example.json：', e);
  }
  const fallback = await fetch('data/records.example.json', { cache: 'no-store' });
  if (!fallback.ok) throw new Error('无法加载数据（records.json 与 records.example.json 均不可用）：' + fallback.status);
  return fallback.json();
}

function parseDate(s) {
  // 支持 YYYY-MM 或 YYYY-MM-DD
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date(s);
}

function formatDate(s) {
  if (!s) return '';
  const d = parseDate(s);
  if (!d || Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderStats(list) {
  const total = list.length;
  const withTags = new Set(list.flatMap(r => r.tags || []));
  const stats = document.getElementById('stats');
  stats.textContent = i18n.t('stats', { total, tags: withTags.size });
}

function renderTagFilter(list) {
  const select = document.getElementById('tagFilter');
  const tags = Array.from(new Set(list.flatMap(r => r.tags || []))).sort((a,b)=>a.localeCompare(b,'zh'));
  select.innerHTML = `<option value="">${i18n.t('allTags')}</option>` + tags.map(t => `<option value="${t}">${t}</option>`).join('');
}

function recordKey(r) {
  return [r.name || '', (r.tags||[]).join(','), r.notes || ''].join('\n').toLowerCase();
}

function filterRecords(list, { q = '', tag = '' } = {}) {
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

function sortRecords(list, order = 'desc') {
  const by = (r) => parseDate(r.startDate)?.getTime() || 0;
  const sorted = [...list].sort((a,b) => by(b) - by(a));
  return order === 'asc' ? sorted.reverse() : sorted;
}

function createCard(r, index) {
  const el = document.createElement('article');
  el.className = 'card';
  const dateRange = [formatDate(r.startDate), formatDate(r.endDate)].filter(Boolean).join(' ~ ');
  const tags = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const links = (r.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noreferrer noopener">${l.title||'链接'}</a>`).join(' · ');
  el.innerHTML = `
    <header class="card-header">
      <h3 class="name">${r.name || '未知'}</h3>
      ${dateRange ? `<div class="dates">${dateRange}</div>` : ''}
    </header>
    ${tags ? `<div class="tags">${tags}</div>` : ''}
    ${r.notes ? `<p class="notes">${r.notes}</p>` : ''}
    ${links ? `<div class="links">${links}</div>` : ''}
    <div class="card-actions">
      <button class="btn small" data-action="edit" data-index="${index}">${i18n.t('edit')}</button>
      <button class="btn small danger" data-action="delete" data-index="${index}">${i18n.t('delete')}</button>
    </div>
  `;
  return el;
}

function renderList(list) {
  const mount = document.getElementById('cardList');
  mount.innerHTML = '';
  list.forEach((r, i) => mount.appendChild(createCard(r, i)));
  mount.querySelectorAll('button[data-action]')?.forEach(btn => {
    const idx = Number(btn.dataset.index);
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'edit') openEditor(state.records[idx], idx);
      if (action === 'delete') deleteRecord(idx);
    });
  });
}

// ---- i18n ----
const I18N = {
  zh: {
    searchPH: '搜索：姓名、标签、备注…',
    allTags: '所有标签',
    sortNewOld: '按时间排序（新→旧）',
    sortOldNew: '按时间排序（旧→新）',
    stats: ({ total, tags }) => `总计 ${total} 条 · 标签数 ${tags}`,
    import: '导入 JSON',
    export: '导出 JSON',
    add: '新增记录',
    theme: '切换主题',
    charts: '统计图表',
    editor: '编辑记录',
    name: '姓名', start: '开始日期', end: '结束日期', tagsLbl: '标签（逗号分隔）', tags: '标签（逗号分隔）', notes: '备注',
    save: '保存', cancel: '取消', edit: '编辑', delete: '删除',
  },
  en: {
    searchPH: 'Search: name, tags, notes…',
    allTags: 'All tags',
    sortNewOld: 'Sort by time (New→Old)',
    sortOldNew: 'Sort by time (Old→New)',
    stats: ({ total, tags }) => `Total ${total} · Tags ${tags}`,
    import: 'Import JSON',
    export: 'Export JSON',
    add: 'Add Record',
    theme: 'Toggle Theme',
    charts: 'Charts',
    editor: 'Edit Record',
    name: 'Name', start: 'Start Date', end: 'End Date', tagsLbl: 'Tags (comma separated)', tags: 'Tags (comma separated)', notes: 'Notes',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
  }
};

const i18n = {
  lang: 'zh',
  t(key, params) {
    const dict = I18N[this.lang];
    const v = dict[key];
    return typeof v === 'function' ? v(params||{}) : (v ?? key);
  },
  apply() {
    // 按 data-i18n 设置文本
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      el.textContent = i18n.t(k);
    });
    // 占位符
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = i18n.t('searchPH');
    // sort 按钮
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) sortBtn.textContent = sortBtn.dataset.order === 'desc' ? i18n.t('sortNewOld') : i18n.t('sortOldNew');
    // 过滤器首项
    renderTagFilter(state.records);
    // 重新渲染列表和统计
    state.refresh();
  }
};

// ---- 主题 ----
function toggleTheme() {
  const root = document.documentElement;
  const cur = root.getAttribute('data-theme') || 'dark';
  root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
}

// ---- 编辑器 ----
function openEditor(rec = { name: '', startDate: '', endDate: '', tags: [], notes: '' }, index = -1) {
  const panel = document.getElementById('editorPanel');
  const form = document.getElementById('editorForm');
  panel.hidden = false;
  form.dataset.index = String(index);
  document.getElementById('fName').value = rec.name || '';
  document.getElementById('fStart').value = rec.startDate || '';
  document.getElementById('fEnd').value = rec.endDate || '';
  document.getElementById('fTags').value = (rec.tags || []).join(', ');
  document.getElementById('fNotes').value = rec.notes || '';
}

function closeEditor() {
  const panel = document.getElementById('editorPanel');
  const form = document.getElementById('editorForm');
  form.reset();
  form.dataset.index = '-1';
  panel.hidden = true;
}

function deleteRecord(index) {
  if (index < 0 || index >= state.records.length) return;
  state.records.splice(index, 1);
  state.onDataChanged();
}

function exportJSON() {
  const payload = { records: state.records };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'records.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importJSON(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || !Array.isArray(obj.records)) throw new Error('Invalid JSON schema');
  state.records = obj.records;
  state.onDataChanged();
}

// ---- 图表 ----
function renderCharts(list) {
  renderYearChart(list);
  renderTagChart(list);
}

function renderYearChart(list) {
  const mount = document.getElementById('yearChart');
  if (!mount) return;
  const counts = {};
  list.forEach(r => {
    const d = parseDate(r.startDate);
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

// ---- 全局状态 ----
const state = {
  records: [],
  get searchInput() { return document.getElementById('searchInput'); },
  get tagFilter() { return document.getElementById('tagFilter'); },
  get sortBtn() { return document.getElementById('sortBtn'); },
  refresh() {
    const filtered = filterRecords(this.records, { q: this.searchInput.value.trim(), tag: this.tagFilter.value });
    const ordered = sortRecords(filtered, this.sortBtn.dataset.order);
    renderStats(ordered);
    renderList(ordered);
    renderCharts(ordered);
  },
  onDataChanged() {
    renderTagFilter(this.records);
    this.refresh();
  }
};

async function main() {
  // 初始语言与主题
  const savedLang = localStorage.getItem('lang');
  if (savedLang && (savedLang in I18N)) i18n.lang = savedLang;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  const data = await loadData();
  state.records = data?.records || [];

  renderStats(state.records);
  renderTagFilter(state.records);

  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const sortBtn = document.getElementById('sortBtn');
  const btnImport = document.getElementById('btnImport');
  const fileInput = document.getElementById('fileInput');
  const btnExport = document.getElementById('btnExport');
  const btnAdd = document.getElementById('btnAdd');
  const langSelect = document.getElementById('langSelect');
  const themeToggle = document.getElementById('themeToggle');
  const editorForm = document.getElementById('editorForm');
  const btnCancel = document.getElementById('btnCancel');

  function refresh() {
    state.refresh();
  }

  searchInput.addEventListener('input', refresh);
  tagFilter.addEventListener('change', refresh);
  sortBtn.addEventListener('click', () => {
    sortBtn.dataset.order = sortBtn.dataset.order === 'desc' ? 'asc' : 'desc';
    sortBtn.textContent = sortBtn.dataset.order === 'desc' ? i18n.t('sortNewOld') : i18n.t('sortOldNew');
    refresh();
  });

  // 导入/导出/新增
  btnImport?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importJSON(file);
      fileInput.value = '';
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  });
  btnExport?.addEventListener('click', exportJSON);
  btnAdd?.addEventListener('click', () => openEditor());

  // 编辑表单提交/取消
  editorForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = Number(editorForm.dataset.index || -1);
    const rec = {
      name: document.getElementById('fName').value.trim(),
      startDate: document.getElementById('fStart').value.trim(),
      endDate: document.getElementById('fEnd').value.trim(),
      tags: document.getElementById('fTags').value.split(',').map(s=>s.trim()).filter(Boolean),
      notes: document.getElementById('fNotes').value.trim()
    };
    if (idx >= 0) state.records[idx] = rec; else state.records.push(rec);
    closeEditor();
    state.onDataChanged();
  });
  btnCancel?.addEventListener('click', () => closeEditor());

  // 多语言
  langSelect.value = i18n.lang;
  langSelect.addEventListener('change', () => {
    i18n.lang = langSelect.value;
    localStorage.setItem('lang', i18n.lang);
    i18n.apply();
  });
  i18n.apply();

  // 主题切换
  themeToggle.addEventListener('click', () => {
    toggleTheme();
    localStorage.setItem('theme', document.documentElement.getAttribute('data-theme') || 'dark');
  });

  refresh();
}

main().catch(err => {
  console.error(err);
  const mount = document.getElementById('cardList');
  mount.innerHTML = `<div class="error">加载失败：${err.message}</div>`;
});
