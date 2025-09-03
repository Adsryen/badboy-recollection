// Timeline (horizontal) renderer with lane assignment
// Exported API: renderTimeline(list, deps)
// deps: { i18n, AVATAR_DIR, DEFAULT_AVATAR, formatDate, parseDate, openEditor, deleteRecord, state, scale }

function createBranchNode(record, index, item, color, deps) {
  const node = document.createElement('div');
  node.className = 'branch-node';
  node.style.position = 'absolute';
  // 以左边缘对齐时间位置，使连接线落在卡片左侧
  node.style.left = `${item.x}px`;
  node.style.top = `${item.y}px`;
  node.style.width = `${item.width}px`;
  node.style.height = `${item.height}px`;
  node.style.borderLeft = `4px solid ${color}`;
  node.dataset.index = index;

  const tags = (record.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  node.innerHTML = `
    <div class="node-header">
      <img class="avatar" src="${record.avatar ? `${deps.AVATAR_DIR}/${record.avatar}` : deps.DEFAULT_AVATAR}" 
           alt="${record.name || ''}" onerror="this.onerror=null;this.src='${deps.DEFAULT_AVATAR}'" />
      <div class="node-info">
        <h3 class="node-name">${record.name || '未知'}</h3>
      </div>
    </div>
    <div class="node-popover">
      <div class="node-content">
        <div class="node-tags">${tags}</div>
        <p class="node-notes">${record.notes || ''}</p>
      </div>
      <div class="node-actions">
        <button type="button" data-action="edit" data-index="${index}" class="btn-edit">编辑</button>
        <button type="button" data-action="delete" data-index="${index}" class="btn-delete">删除</button>
      </div>
    </div>
  `;

  // 悬浮时将卡片整体置顶，确保tag与描述不被其它元素遮挡
  node.addEventListener('mouseenter', () => {
    node.style.zIndex = '1000';
  });
  node.addEventListener('mouseleave', () => {
    node.style.zIndex = '';
  });

  return node;
}

function normalizeInterval(r, deps) {
  const s = deps.parseDate(r.startDate);
  const e = deps.parseDate(r.endDate || r.startDate);
  const start = s ? s.getTime() : 0;
  const end = e ? e.getTime() : start;
  return { start, end };
}

// 车道分配（按时间避免同一行重叠）
function calculateBranchLayout(list, deps) {
  const items = list.map((r, idx) => ({
    idx,
    record: r,
    ...normalizeInterval(r, deps),
    height: 80, // 节点高度
    width: 200  // 节点宽度
  }));

  // 按开始时间排序
  items.sort((a, b) => a.start - b.start);

  // 贪心分配“车道”（行）
  const laneEnds = []; // 每条车道的最后结束时间
  items.forEach(item => {
    let lane = 0;
    for (; lane < laneEnds.length; lane++) {
      if (item.start >= laneEnds[lane]) break; // 不重叠即可复用该车道
    }
    item.laneIndex = lane;
    laneEnds[lane] = Math.max(item.end, laneEnds[lane] ?? 0);
  });

  return { items, lanes: Math.max(1, laneEnds.length) };
}

function formatYMD(input, deps){
  // 优先使用原字符串前10位（若已含日）
  if (typeof input === 'string') {
    if (input.length >= 10) return input.slice(0,10);
  }
  const d = deps.parseDate(input);
  if (!d) return String(input ?? '');
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function createTimelineItem(r, index, isLast, deps, trackIndex, layout) {
  const el = document.createElement('div');
  el.className = 'tl-item';
  const dateRange = [deps.formatDate(r.startDate), deps.formatDate(r.endDate)].filter(Boolean).join(' ~ ');
  const tags = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const { onRight, topPx, segColor, sideIndex } = layout;
  el.classList.toggle('side-right', onRight);
  el.classList.toggle('side-left', !onRight);
  el.style.top = `${topPx}px`;
  if (typeof sideIndex === 'number') el.style.setProperty('--side-offset', `calc(var(--indent,12px) * ${sideIndex})`);

  el.innerHTML = `
    <span class="tl-dot" style="border-color: ${segColor}"></span>
    <span class="tl-time">${formatYMD(r.startDate, deps)}</span>
    <div class="tl-compact" aria-expanded="false">
      <img class="avatar sm" src="${r.avatar ? `${deps.AVATAR_DIR}/${r.avatar}` : deps.DEFAULT_AVATAR}" alt="${r.name||''}"
           onerror="this.onerror=null;this.src='${deps.DEFAULT_AVATAR}'" />
      <span class="name">${r.name || '未知'}</span>
    </div>
    <div class="tl-popover">
      <article class="tl-card">
        <header class="card-header">
          <div class="person">
            <img class="avatar" src="${r.avatar ? `${deps.AVATAR_DIR}/${r.avatar}` : deps.DEFAULT_AVATAR}" alt="${r.name||''}"
                 onerror="this.onerror=null;this.src='${deps.DEFAULT_AVATAR}'" />
          <h3 class="name">${r.name || '未知'}</h3>
          </div>
          ${dateRange ? `<div class="dates">${dateRange}</div>` : ''}
        </header>
        ${tags ? `<div class="tags">${tags}</div>` : ''}
        ${r.notes ? `<p class="notes">${r.notes}</p>` : ''}
        <div class="card-actions">
          <button class="btn small" data-action="edit" data-index="${index}">${deps.i18n.t('edit')}</button>
          <button class="btn small danger" data-action="delete" data-index="${index}">${deps.i18n.t('delete')}</button>
        </div>
      </article>
    </div>
  `;
  // 点击切换展开
  const compact = el.querySelector('.tl-compact');
  compact?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const isOpen = el.classList.toggle('open');
    if (compact) compact.setAttribute('aria-expanded', String(isOpen));
  });
  // 阻止在弹出层内点击冒泡（编辑/删除按钮）
  el.querySelector('.tl-popover')?.addEventListener('click', (ev) => ev.stopPropagation());
  // 悬浮时将卡片整体置顶（备用：如果启动了该模式）
  el.addEventListener('mouseenter', () => {
    el.style.zIndex = '1000';
  });
  el.addEventListener('mouseleave', () => {
    el.style.zIndex = '';
  });
  return el;
}

export function renderTimeline(list, deps) {
  const mount = document.getElementById('timeline');
  if (!mount) return;
  mount.innerHTML = '';

  if (!list || list.length === 0) return;

  // 计算“车道”与数据基础
  const { items, lanes } = calculateBranchLayout(list, deps);
  const minTime = Math.min(...items.map(item => item.start));
  const maxTime = Math.max(...items.map(item => item.end));
  const timeSpan = Math.max(1, maxTime - minTime);
  const SCALE = typeof deps?.scale === 'number' && deps.scale > 0 ? deps.scale : 0.5;

  // 将时间映射为横向像素（线性，按天）
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const PX_PER_DAY_BASE = 6; // 线性比例的基础缩放（更温和，避免过长）
  const pxPerDay = PX_PER_DAY_BASE * SCALE;

  const paddingLeft = 80;
  const paddingRight = 160;
  const paddingTop = 20;
  const paddingBottom = 28;
  const laneGap = 12;
  const AXIS_GAP = 16; // 固定轴-节点间隙（px）
  // 轴上彩色时段段宽（压缩规则）
  const SEG_BASE = 40;             // 基础段长（px）
  const SEG_PER_DAY = 2 * SCALE;   // 每天额外像素
  const SEG_MAX_EXTRA = 160;       // 额外长度上限

  // 计算车道区域
  const spanDays = timeSpan / MS_PER_DAY;
  const itemHeight = items[0]?.height ?? 80;
  const laneAreaHeight = Math.max(0, lanes * (itemHeight + laneGap) - laneGap);
  const axisY = paddingTop + 20; // 轴放在容器顶部下方固定位置
  const startY = axisY + AXIS_GAP;
  const contentHeight = startY + laneAreaHeight + paddingBottom;

  // 线性时间 -> 像素映射函数
  const effectiveWidth = Math.max(800, Math.round(spanDays * pxPerDay));
  const timeToX = (t) => {
    if (timeSpan === 0) return paddingLeft + effectiveWidth / 2;
    const ratio = (t - minTime) / timeSpan;
    return paddingLeft + ratio * effectiveWidth;
  };

  // 为每个 item 计算几何位置（线性时间映射）
  items.forEach((item) => {
    item.x = timeToX(item.start);
    item.y = startY + item.laneIndex * (itemHeight + laneGap);
  });

  // 内容宽度依据线性比例确定
  const contentWidth = paddingLeft + effectiveWidth + paddingRight;

  // 容器样式（初始高度，后续会根据卡片与浮层自适应修正）
  mount.style.height = `${Math.max(260, contentHeight)}px`;
  mount.style.width = '100%';
  mount.style.position = 'relative';
  mount.style.overflowX = 'auto';
  mount.style.overflowY = 'visible';

  // 创建SVG容器用于绘制连接线与主轴
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tl-svg');
  svg.setAttribute('width', contentWidth);
  svg.setAttribute('height', contentHeight);
  svg.style.width = `${contentWidth}px`;
  svg.style.height = `${contentHeight}px`;
  svg.setAttribute('viewBox', `0 0 ${contentWidth} ${contentHeight}`);
  mount.appendChild(svg);

  // 绘制水平主轴
  const mainAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  mainAxis.setAttribute('x1', paddingLeft);
  mainAxis.setAttribute('y1', axisY);
  mainAxis.setAttribute('x2', contentWidth - paddingRight);
  mainAxis.setAttribute('y2', axisY);
  mainAxis.setAttribute('stroke', 'var(--border)');
  mainAxis.setAttribute('stroke-width', '2');
  svg.appendChild(mainAxis);

  // 在轴上方绘制时间刻度（按跨度选择年/月）
  function drawTimeScale() {
    const spanYears = spanDays / 365;
    const useMonths = spanYears < 2; // 跨度小于2年，用月刻度
    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);
    const labelsY = axisY - 22; // 上移刻度标签，避免与段标签遮挡
    const tickTop = axisY - 6;
    const tickBottom = axisY - 2;

    if (useMonths) {
      // 从起始月的1号开始
      let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (d.getTime() <= endDate.getTime()) {
        const x = timeToX(d.getTime());
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', tickTop);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', tickBottom);
        tick.setAttribute('stroke', 'var(--border)');
        tick.setAttribute('stroke-width', '1');
        svg.appendChild(tick);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        label.setAttribute('x', x + 4);
        label.setAttribute('y', labelsY);
        label.setAttribute('fill', 'var(--muted)');
        label.setAttribute('font-size', '10');
        label.setAttribute('dominant-baseline', 'ideographic');
        svg.appendChild(label);

        // 下一个月
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    } else {
      // 年刻度：每年1月1日
      let year = startDate.getFullYear();
      const lastYear = endDate.getFullYear();
      for (; year <= lastYear; year++) {
        const d = new Date(year, 0, 1);
        const x = timeToX(d.getTime());
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', tickTop);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', tickBottom);
        tick.setAttribute('stroke', 'var(--border)');
        tick.setAttribute('stroke-width', '1');
        svg.appendChild(tick);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.textContent = String(year);
        label.setAttribute('x', x + 4);
        label.setAttribute('y', labelsY);
        label.setAttribute('fill', 'var(--muted)');
        label.setAttribute('font-size', '10');
        label.setAttribute('dominant-baseline', 'ideographic');
        svg.appendChild(label);
      }
    }
  }
  drawTimeScale();

  // 颜色调色板
  const colors = ['#06b6d4', '#a78bfa', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#84cc16'];

  // 渲染节点与纵向连接线
  const segGroups = new Map(); // index -> <g>
  const connectionPaths = new Map(); // index -> <path>
  items.forEach((item, index) => {
    const color = colors[index % colors.length];

    // 在线性时间轴上绘制真实起止的彩色段 + 起止标记与日期
    let segX1 = timeToX(item.start);
    let segX2 = timeToX(item.end);
    if (segX2 < segX1) [segX1, segX2] = [segX2, segX1];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'seg-group');
    g.dataset.index = String(index);
    // 扩大可交互命中区域，保证 hover 能触发
    g.style.pointerEvents = 'all';

    const seg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    seg.setAttribute('x1', segX1);
    seg.setAttribute('y1', axisY);
    seg.setAttribute('x2', segX2);
    seg.setAttribute('y2', axisY);
    seg.setAttribute('stroke', color);
    seg.setAttribute('stroke-width', '6');
    seg.setAttribute('stroke-linecap', 'round');
    g.appendChild(seg);

    // 起点/终点圆点
    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('cx', segX1);
    startDot.setAttribute('cy', axisY);
    startDot.setAttribute('r', '4');
    startDot.setAttribute('fill', color);
    g.appendChild(startDot);

    const endDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endDot.setAttribute('cx', segX2);
    endDot.setAttribute('cy', axisY);
    endDot.setAttribute('r', '4');
    endDot.setAttribute('fill', color);
    g.appendChild(endDot);

    // 起止日期标签（默认隐藏，悬停显示）
    const labelY = axisY - 12;
    const startLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    startLabel.textContent = formatYMD(item.record.startDate, deps);
    startLabel.setAttribute('x', String(segX1 + 2));
    startLabel.setAttribute('y', String(labelY));
    startLabel.setAttribute('fill', 'var(--muted)');
    startLabel.setAttribute('font-size', '10');
    startLabel.setAttribute('opacity', '0');
    g.appendChild(startLabel);

    const endLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    endLabel.textContent = formatYMD(item.record.endDate || item.record.startDate, deps);
    endLabel.setAttribute('x', String(segX2 - 2));
    endLabel.setAttribute('y', String(labelY));
    endLabel.setAttribute('fill', 'var(--muted)');
    endLabel.setAttribute('font-size', '10');
    endLabel.setAttribute('text-anchor', 'end');
    endLabel.setAttribute('opacity', '0');
    g.appendChild(endLabel);

    // 避免短时段标签重叠：段宽很窄时合并为一个中间标签；稍窄时上下错列
    const segWidth = Math.abs(segX2 - segX1);
    const MERGE_THRESHOLD = 48; // px，低于则仅显示一个合并标签
    const STAGGER_THRESHOLD = 84; // px，低于则上下错列
    if (segWidth < MERGE_THRESHOLD) {
      // 只保留一个合并标签，居中显示
      startLabel.setAttribute('display', 'none');
      const startText = formatYMD(item.record.startDate, deps);
      const endText = formatYMD(item.record.endDate || item.record.startDate, deps);
      endLabel.textContent = (startText === endText) ? startText : `${startText} ~ ${endText}`;
      endLabel.setAttribute('text-anchor', 'middle');
      endLabel.setAttribute('x', String((segX1 + segX2) / 2));
    } else if (segWidth < STAGGER_THRESHOLD) {
      // 上下错列，减少视觉重叠
      startLabel.setAttribute('y', String(labelY - 10));
      endLabel.setAttribute('y', String(labelY + 2));
    }

    g.addEventListener('mouseenter', () => {
      g.classList.add('active');
      // 将该段与其连线一起置于最上层，避免与其它重叠段遮挡
      if (svg && svg.appendChild) {
        svg.appendChild(g);
        const cp = connectionPaths.get(index);
        if (cp) svg.appendChild(cp);
      }
    });
    g.addEventListener('mouseleave', () => {
      g.classList.remove('active');
    });

    svg.appendChild(g);
    segGroups.set(index, g);

    // 从主轴到节点的竖向连线
    const connectionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${item.x} ${axisY} L ${item.x} ${item.y - 4}`; // 始终保持固定间隙
    connectionPath.setAttribute('d', pathData);
    connectionPath.setAttribute('stroke', color);
    connectionPath.setAttribute('stroke-width', '2');
    connectionPath.setAttribute('fill', 'none');
    connectionPath.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(connectionPath);
    connectionPaths.set(index, connectionPath);

    // 节点
    const nodeElement = createBranchNode(item.record, index, item, color, deps);
    // 悬停卡片时，同步高亮对应时间段与显示标签
    nodeElement.addEventListener('mouseenter', () => {
      const gg = segGroups.get(index);
      if (gg) {
        gg.classList.add('active');
        // 同步将对应时间段与连线一起置顶
        if (svg && svg.appendChild) {
          svg.appendChild(gg);
          const cp = connectionPaths.get(index);
          if (cp) svg.appendChild(cp);
        }
      }
    });
    nodeElement.addEventListener('mouseleave', () => {
      const gg = segGroups.get(index);
      if (gg) gg.classList.remove('active');
    });
    mount.appendChild(nodeElement);
    // 悬浮展开可能改变可见高度，进入/离开时重算容器高度
    const recalc = () => updateMountHeight();
    nodeElement.addEventListener('mouseenter', recalc);
    nodeElement.addEventListener('mouseleave', recalc);
  });

  // 绑定事件
  mount.querySelectorAll('button[data-action]')?.forEach(btn => {
    const idx = Number(btn.dataset.index);
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'edit') deps.openEditor(deps.state.records[idx], idx);
      if (action === 'delete') deps.deleteRecord(idx);
    });
  });

  // 滚轮横向滚动（隐藏滚动条，但保留滚动能力）
  function onWheel(e){
    if (e.ctrlKey) return; // 允许浏览器缩放
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      e.preventDefault();
      mount.scrollLeft += delta;
    }
  }
  mount.addEventListener('wheel', onWheel, { passive: false });

  // 根据已渲染内容（包含卡片与其浮层）动态计算容器高度
  function updateMountHeight() {
    // 以 lane 区域的理论高度为下限
    let maxBottom = startY + laneAreaHeight;
    // 遍历所有节点，考虑其自身高度与弹出层高度
    mount.querySelectorAll('.branch-node')?.forEach((node) => {
      const baseBottom = node.offsetTop + node.offsetHeight;
      maxBottom = Math.max(maxBottom, baseBottom);
      const pop = node.querySelector('.node-popover');
      if (pop) {
        const popTop = (pop.offsetTop || 0);
        const popBottom = node.offsetTop + popTop + pop.offsetHeight;
        maxBottom = Math.max(maxBottom, popBottom);
      }
    });
    const finalHeight = Math.max(260, maxBottom + paddingBottom + 8); // 额外余量
    mount.style.height = `${finalHeight}px`;
    // 同步 SVG 高度，避免裁剪
    svg.setAttribute('height', finalHeight);
    svg.style.height = `${finalHeight}px`;
    svg.setAttribute('viewBox', `0 0 ${contentWidth} ${finalHeight}`);
  }

  // 初始渲染后计算一次
  updateMountHeight();
  // 窗口尺寸变化时重算
  window.addEventListener('resize', updateMountHeight);

}
