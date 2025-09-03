import { renderTimeline } from './timeline.js';
import { parseDate, formatDate, filterRecords, sortRecords } from './utils.js';
import { i18n, I18N } from './i18n.js';
import { renderCharts } from './charts.js';
import { openEditor, closeEditor, bindEditorEvents } from './editor.js';
import { exportJSON, importJSON } from './storage.js';
import { AVATAR_DIR, ALBUM_DIR, DEFAULT_AVATAR } from './constants.js';
import { renderStats, renderTagFilter } from './ui.js';
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

// 常量与 UI 渲染已解耦到 constants.js 与 ui.js

// 过滤/排序等工具已移动到 utils.js

function createCard(r, index) {
  const el = document.createElement('article');
  el.className = 'card';
  const dateRange = [formatDate(r.startDate), formatDate(r.endDate)].filter(Boolean).join(' ~ ');
  const tags = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const baseLinks = (r.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noreferrer noopener">${l.title||'链接'}</a>`);
  const albumLink = r.album ? [`<a href="${ALBUM_DIR}/${r.album}" target="_blank" rel="noreferrer noopener">相册</a>`] : [];
  const links = [...baseLinks, ...albumLink].join(' · ');
  el.innerHTML = `
    <header class="card-header">
      <div class="person">
        <img class="avatar" src="${r.avatar ? `${AVATAR_DIR}/${r.avatar}` : DEFAULT_AVATAR}" alt="${r.name||''}"
             onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'" />
        <h3 class="name">${r.name || '未知'}</h3>
      </div>
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

// i18n 已移动到 i18n.js

// ---- 主题 ----
function toggleTheme() {
  const root = document.documentElement;
  const cur = root.getAttribute('data-theme') || 'dark';
  root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
}

// ---- 编辑器（已拆分至 editor.js） ----

function deleteRecord(index) {
  if (index < 0 || index >= state.records.length) return;
  state.records.splice(index, 1);
  state.onDataChanged();
}

// 导入/导出（已拆分至 storage.js）

// 图表渲染已移动到 charts.js

// ---- 全局状态 ----
const state = {
  records: [],
  scale: 0.5,
  get searchInput() { return document.getElementById('searchInput'); },
  get tagFilter() { return document.getElementById('tagFilter'); },
  get sortBtn() { return document.getElementById('sortBtn'); },
  get scaleSelect() { return document.getElementById('scaleSelect'); },
  refresh() {
    const filtered = filterRecords(this.records, { q: this.searchInput.value.trim(), tag: this.tagFilter.value });
    const ordered = sortRecords(filtered, this.sortBtn.dataset.order);
    renderStats(ordered, i18n);
    
    // 根据当前激活的标签决定显示哪个视图
    const activeTab = document.querySelector('.tab-btn.active');
    const currentView = activeTab?.dataset.view || 'timeline';
    
    if (currentView === 'timeline') {
      document.getElementById('timeline')?.removeAttribute('hidden');
      document.getElementById('charts')?.setAttribute('hidden', '');
      document.getElementById('cardList')?.setAttribute('hidden', '');
      renderTimeline(ordered, { i18n, AVATAR_DIR, DEFAULT_AVATAR, formatDate, parseDate, openEditor, deleteRecord, state, scale: this.scale });
    } else if (currentView === 'charts') {
      document.getElementById('timeline')?.setAttribute('hidden', '');
      document.getElementById('charts')?.removeAttribute('hidden');
      document.getElementById('cardList')?.setAttribute('hidden', '');
      renderCharts(ordered, { parseDate });
    }
  },
  onDataChanged() {
    renderTagFilter(this.records, i18n);
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

  renderStats(state.records, i18n);
  renderTagFilter(state.records, i18n);

  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const sortBtn = document.getElementById('sortBtn');
  const btnImport = document.getElementById('btnImport');
  const fileInput = document.getElementById('fileInput');
  const btnExport = document.getElementById('btnExport');
  const btnAdd = document.getElementById('btnAdd');
  const langSelect = document.getElementById('langSelect');
  const themeToggle = document.getElementById('themeToggle');
  const scaleSelect = document.getElementById('scaleSelect');
  const timelineTab = document.getElementById('timelineTab');
  const chartsTab = document.getElementById('chartsTab');
  // 绑定编辑器提交/取消
  bindEditorEvents(state);

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

  // 时间缩放初始化与变更
  const savedScale = localStorage.getItem('timeline_scale');
  if (savedScale && !isNaN(Number(savedScale))) state.scale = Number(savedScale);
  if (scaleSelect) {
    scaleSelect.value = String(state.scale);
    scaleSelect.addEventListener('change', () => {
      const val = Number(scaleSelect.value);
      if (!isNaN(val) && val > 0) {
        state.scale = val;
        localStorage.setItem('timeline_scale', String(val));
        refresh();
      }
    });
  }

  // 视图切换逻辑
  function switchView(viewName) {
    const timeline = document.getElementById('timeline');
    const charts = document.getElementById('charts');
    const cardList = document.getElementById('cardList');
    
    // 更新标签状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // 切换视图显示
    if (viewName === 'timeline') {
      timeline?.removeAttribute('hidden');
      charts?.setAttribute('hidden', '');
      cardList?.setAttribute('hidden', '');
    } else if (viewName === 'charts') {
      timeline?.setAttribute('hidden', '');
      charts?.removeAttribute('hidden');
      cardList?.setAttribute('hidden', '');
    }
    
    // 切换后重新渲染当前视图
    refresh();
  }

  // 绑定切换器事件
  timelineTab?.addEventListener('click', () => switchView('timeline'));
  chartsTab?.addEventListener('click', () => switchView('charts'));

  // 导入/导出/新增
  btnImport?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importJSON(file, state);
      fileInput.value = '';
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  });
  btnExport?.addEventListener('click', () => exportJSON(state));
  btnAdd?.addEventListener('click', () => openEditor());

  // 多语言
  langSelect.value = i18n.lang;
  langSelect.addEventListener('change', () => {
    i18n.lang = langSelect.value;
    localStorage.setItem('lang', i18n.lang);
    i18n.apply(state);
    renderTagFilter(state.records, i18n);
    state.refresh();
  });
  i18n.apply(state);
  renderTagFilter(state.records, i18n);

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
