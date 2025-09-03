// i18n dictionaries and instance
export const I18N = {
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

export const i18n = {
  lang: 'zh',
  t(key, params) {
    const dict = I18N[this.lang];
    const v = dict[key];
    return typeof v === 'function' ? v(params||{}) : (v ?? key);
  },
  apply(state) {
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
    if (state) state && state.records && state.records.length >= 0 && typeof state.refresh === 'function' && typeof state.onDataChanged === 'function';
  }
};
