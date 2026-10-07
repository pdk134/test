/* =========================================================
 * 经期小助手 - 核心逻辑
 * 数据存储：localStorage（仅保存在本机浏览器）
 * ========================================================= */

'use strict';

/* ---------- 常量 ---------- */
const STORAGE_KEY = 'periodTracker.v1';
const DEFAULT_CYCLE = 28;   // 数据不足时的默认周期长度
const DEFAULT_PERIOD = 5;   // 数据不足时的默认经期长度
const LUTEAL_PHASE = 14;    // 黄体期（排卵到下次经期）固定约 14 天

const SYMPTOMS = [
  { id: 'cramps',   label: '😖 腹痛' },
  { id: 'backache', label: '🙇‍♀️ 腰酸' },
  { id: 'headache', label: '🤕 头痛' },
  { id: 'breast',   label: '💢 乳房胀痛' },
  { id: 'fatigue',  label: '🥱 疲劳' },
  { id: 'acne',     label: '😩 痘痘' },
  { id: 'nausea',   label: '🤢 恶心' },
  { id: 'insomnia', label: '🌙 失眠' }
];

const MOODS = [
  { id: 'happy',     emoji: '😊', label: '开心' },
  { id: 'calm',      emoji: '😌', label: '平静' },
  { id: 'anxious',   emoji: '😟', label: '焦虑' },
  { id: 'irritable', emoji: '😤', label: '烦躁' },
  { id: 'sad',       emoji: '😢', label: '低落' },
  { id: 'tired',     emoji: '😪', label: '疲惫' }
];

/* ---------- 日期工具 ---------- */
function fmt(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
function parseDate(s) {
  const parts = s.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function addDays(d, n) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}
function diffDays(a, b) {
  return Math.round((b - a) / 86400000);
}
function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function fmtCN(d) {
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}
function fmtShort(d) {
  return (d.getMonth() + 1) + '/' + d.getDate();
}

/* ---------- 状态与持久化 ---------- */
const state = {
  periodDays: new Set(),   // Set<'YYYY-MM-DD'> 所有被标记为经期的日期
  dailyLogs: {},           // { 'YYYY-MM-DD': { symptoms:[], mood:'', note:'' } }
  viewMonth: today(),      // 日历当前显示的月份
  selectedDate: fmt(today())
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.periodDays = new Set(data.periodDays || []);
    state.dailyLogs = data.dailyLogs || {};
  } catch (e) {
    console.warn('读取本地数据失败，已重置。', e);
  }
}

function saveState() {
  const data = {
    periodDays: [...state.periodDays],
    dailyLogs: state.dailyLogs
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------- 周期计算 ---------- */
// 把离散的经期日合并为连续的经期段 [{start, end}]
function getPeriods() {
  const days = [...state.periodDays].sort();
  const periods = [];
  let cur = null;
  for (const s of days) {
    if (cur && diffDays(parseDate(cur.end), parseDate(s)) === 1) {
      cur.end = s;
    } else {
      cur = { start: s, end: s };
      periods.push(cur);
    }
  }
  return periods;
}

// 平均周期长度（相邻经期开始日的间隔，最多取最近 6 个间隔）
function getAvgCycle(periods) {
  if (periods.length < 2) return DEFAULT_CYCLE;
  const gaps = [];
  for (let i = 1; i < periods.length; i++) {
    gaps.push(diffDays(parseDate(periods[i - 1].start), parseDate(periods[i].start)));
  }
  const recent = gaps.slice(-6);
  const sum = recent.reduce((a, b) => a + b, 0);
  return Math.round(sum / recent.length);
}

// 平均经期长度
function getAvgPeriodLen(periods) {
  if (periods.length === 0) return DEFAULT_PERIOD;
  const lens = periods.slice(-6).map(p => diffDays(parseDate(p.start), parseDate(p.end)) + 1);
  const sum = lens.reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round(sum / lens.length));
}

// 预测：下次经期、排卵日、易孕期
function getPrediction(periods) {
  if (periods.length === 0) return null;
  const avgCycle = getAvgCycle(periods);
  const avgPeriodLen = getAvgPeriodLen(periods);
  const lastStart = parseDate(periods[periods.length - 1].start);
  const nextStart = addDays(lastStart, avgCycle);
  const nextEnd = addDays(nextStart, avgPeriodLen - 1);
  const ovulation = addDays(nextStart, -LUTEAL_PHASE);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  return { avgCycle, avgPeriodLen, nextStart, nextEnd, ovulation, fertileStart, fertileEnd };
}

function isInRange(d, a, b) {
  return d >= a && d <= b;
}

/* ---------- DOM 引用 ---------- */
const $ = id => document.getElementById(id);
const els = {
  statusCard: $('statusCard'),
  monthLabel: $('monthLabel'),
  calendarGrid: $('calendarGrid'),
  logDateLabel: $('logDateLabel'),
  logDateSub: $('logDateSub'),
  periodToggle: $('periodToggle'),
  symptomChips: $('symptomChips'),
  moodRow: $('moodRow'),
  noteInput: $('noteInput'),
  saveHint: $('saveHint'),
  statAvgCycle: $('statAvgCycle'),
  statAvgPeriod: $('statAvgPeriod'),
  statCount: $('statCount'),
  nextCard: $('nextCard'),
  cycleChart: $('cycleChart'),
  historyList: $('historyList')
};

/* ---------- 渲染：状态卡片 ---------- */
function renderStatus() {
  const periods = getPeriods();
  const t = today();
  const tStr = fmt(t);

  if (periods.length === 0) {
    els.statusCard.innerHTML =
      '<div class="status-main">👋 欢迎使用</div>' +
      '<div class="status-sub">还没有经期记录，点击日历中的日期，把经期标记上吧～</div>';
    return;
  }

  const pred = getPrediction(periods);
  const last = periods[periods.length - 1];

  // 今天是否在经期内
  const inPeriod = periods.some(p => isInRange(t, parseDate(p.start), parseDate(p.end)));

  let mainHtml, subHtml, tagHtml;

  if (inPeriod) {
    const dayNum = diffDays(parseDate(last.start), t) + 1;
    mainHtml = '经期第 <span class="big-num">' + dayNum + '</span> 天';
    subHtml = '本次经期从 ' + fmtShort(parseDate(last.start)) + ' 开始，注意保暖休息哦 🫖';
    tagHtml = '<span class="phase-tag">经期中</span>';
  } else {
    const cycleDay = diffDays(parseDate(last.start), t) + 1;
    const untilNext = diffDays(t, pred.nextStart);

    if (untilNext > 0) {
      mainHtml = '距离下次经期约 <span class="big-num">' + untilNext + '</span> 天';
    } else if (untilNext === 0) {
      mainHtml = '预计<span class="big-num">今天</span>来经期';
    } else {
      mainHtml = '经期可能推迟 <span class="big-num">' + (-untilNext) + '</span> 天';
    }
    subHtml = '当前为周期第 ' + cycleDay + ' 天（周期约 ' + pred.avgCycle + ' 天）';

    // 阶段标签
    if (fmt(pred.ovulation) === tStr) {
      tagHtml = '<span class="phase-tag purple">排卵日</span>';
    } else if (isInRange(t, pred.fertileStart, pred.fertileEnd)) {
      tagHtml = '<span class="phase-tag purple">易孕期</span>';
    } else if (t < pred.ovulation) {
      tagHtml = '<span class="phase-tag">卵泡期</span>';
    } else {
      tagHtml = '<span class="phase-tag">黄体期</span>';
    }
  }

  els.statusCard.innerHTML =
    '<div class="status-main">' + mainHtml + '</div>' +
    '<div class="status-sub">' + subHtml + '</div>' + tagHtml;
}

/* ---------- 渲染：日历 ---------- */
function renderCalendar() {
  const y = state.viewMonth.getFullYear();
  const m = state.viewMonth.getMonth();
  els.monthLabel.textContent = y + '年' + (m + 1) + '月';

  const periods = getPeriods();
  const pred = getPrediction(periods);
  const tStr = fmt(today());

  // 周一为一周的开始
  const first = new Date(y, m, 1);
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const gridStart = addDays(first, -startOffset);

  let html = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    const s = fmt(d);
    const classes = ['day-cell'];

    if (d.getMonth() !== m) classes.push('other-month');
    if (s === tStr) classes.push('today');
    if (s === state.selectedDate) classes.push('selected');

    if (state.periodDays.has(s)) {
      classes.push('is-period');
    } else if (pred) {
      if (s === fmt(pred.ovulation)) {
        classes.push('is-ovulation');
      } else if (isInRange(d, pred.nextStart, pred.nextEnd)) {
        classes.push('is-predicted');
      } else if (isInRange(d, pred.fertileStart, pred.fertileEnd)) {
        classes.push('is-fertile');
      }
    }

    const hasLog = !!state.dailyLogs[s];
    html += '<button class="' + classes.join(' ') + '" data-date="' + s + '">' +
      d.getDate() +
      (hasLog ? '<span class="log-dot"></span>' : '') +
      '</button>';
  }
  els.calendarGrid.innerHTML = html;
}

/* ---------- 渲染：记录页 ---------- */
function getLog(dateStr) {
  if (!state.dailyLogs[dateStr]) {
    state.dailyLogs[dateStr] = { symptoms: [], mood: '', note: '' };
  }
  return state.dailyLogs[dateStr];
}

function cleanEmptyLog(dateStr) {
  const log = state.dailyLogs[dateStr];
  if (log && log.symptoms.length === 0 && !log.mood && !log.note.trim()) {
    delete state.dailyLogs[dateStr];
  }
}

function renderLog() {
  const d = parseDate(state.selectedDate);
  const isToday = state.selectedDate === fmt(today());
  els.logDateLabel.textContent = fmtCN(d);

  if (isToday) {
    els.logDateSub.textContent = '今天';
  } else {
    const diff = diffDays(today(), d);
    els.logDateSub.textContent = diff < 0 ? (-diff + ' 天前') : (diff + ' 天后');
  }

  // 经期开关
  const isPeriod = state.periodDays.has(state.selectedDate);
  els.periodToggle.classList.toggle('on', isPeriod);
  els.periodToggle.textContent = isPeriod ? '🩸 这一天是经期（点击取消）' : '🩸 标记这一天为经期';

  // 症状
  const log = state.dailyLogs[state.selectedDate] || { symptoms: [], mood: '', note: '' };
  els.symptomChips.innerHTML = SYMPTOMS.map(s =>
    '<button class="chip' + (log.symptoms.includes(s.id) ? ' on' : '') + '" data-symptom="' + s.id + '">' +
    s.label + '</button>'
  ).join('');

  // 心情
  els.moodRow.innerHTML = MOODS.map(mo =>
    '<button class="mood-btn' + (log.mood === mo.id ? ' on' : '') + '" data-mood="' + mo.id + '">' +
    mo.emoji + '<small>' + mo.label + '</small></button>'
  ).join('');

  // 备注
  els.noteInput.value = log.note || '';
}

let saveHintTimer = null;
function showSaved() {
  els.saveHint.classList.add('show');
  clearTimeout(saveHintTimer);
  saveHintTimer = setTimeout(() => els.saveHint.classList.remove('show'), 1200);
}

function afterLogChange() {
  cleanEmptyLog(state.selectedDate);
  saveState();
  renderCalendar();
  renderStatus();
  renderStats();
  showSaved();
}

/* ---------- 渲染：统计页 ---------- */
function renderStats() {
  const periods = getPeriods();
  const avgCycle = getAvgCycle(periods);
  const avgPeriodLen = getAvgPeriodLen(periods);

  els.statAvgCycle.textContent = periods.length >= 2 ? avgCycle : '--';
  els.statAvgPeriod.textContent = periods.length >= 1 ? avgPeriodLen : '--';
  els.statCount.textContent = periods.length;

  // 下次经期预测卡
  const pred = getPrediction(periods);
  if (pred) {
    const untilNext = diffDays(today(), pred.nextStart);
    let countText;
    if (untilNext > 0) countText = '约 ' + untilNext + ' 天后';
    else if (untilNext === 0) countText = '预计就是今天';
    else countText = '已推迟约 ' + (-untilNext) + ' 天';
    els.nextCard.innerHTML =
      '<div class="next-title">🔮 下次经期预测</div>' +
      '<div class="next-date">' + fmtCN(pred.nextStart) + '</div>' +
      '<div class="next-sub">' + countText + ' · 预计持续 ' + pred.avgPeriodLen + ' 天 · ' +
      '排卵日约 ' + fmtShort(pred.ovulation) + '</div>';
  } else {
    els.nextCard.innerHTML =
      '<div class="next-title">🔮 下次经期预测</div>' +
      '<div class="next-date">暂无数据</div>' +
      '<div class="next-sub">记录至少一次经期后，即可生成预测</div>';
  }

  // 周期长度柱状图（近 6 个间隔）
  const gaps = [];
  for (let i = 1; i < periods.length; i++) {
    gaps.push({
      len: diffDays(parseDate(periods[i - 1].start), parseDate(periods[i].start)),
      label: fmtShort(parseDate(periods[i].start))
    });
  }
  const recentGaps = gaps.slice(-6);
  if (recentGaps.length === 0) {
    els.cycleChart.innerHTML = '<div class="chart-empty">记录 2 次以上经期后显示图表</div>';
  } else {
    const maxLen = Math.max(...recentGaps.map(g => g.len), 1);
    els.cycleChart.innerHTML = recentGaps.map(g => {
      const h = Math.max(6, Math.round(g.len / maxLen * 100));
      return '<div class="bar-item">' +
        '<span class="bar-value">' + g.len + '</span>' +
        '<div class="bar" style="height:' + h + '%"></div>' +
        '<span class="bar-label">' + g.label + '</span>' +
        '</div>';
    }).join('');
  }

  // 经期历史（最近的在前）
  if (periods.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">还没有记录</div>';
  } else {
    els.historyList.innerHTML = periods.slice().reverse().map((p, idx) => {
      const len = diffDays(parseDate(p.start), parseDate(p.end)) + 1;
      const list = periods;
      const realIdx = list.length - 1 - idx;
      let cycleText = '';
      if (realIdx > 0) {
        const cyc = diffDays(parseDate(list[realIdx - 1].start), parseDate(p.start));
        cycleText = ' · 距上次 ' + cyc + ' 天';
      }
      return '<div class="history-item">' +
        '<span class="history-dates">' + fmtShort(parseDate(p.start)) + ' ~ ' + fmtShort(parseDate(p.end)) + '</span>' +
        '<span class="history-meta">持续 ' + len + ' 天' + cycleText + '</span>' +
        '</div>';
    }).join('');
  }
}

/* ---------- 渲染全部 ---------- */
function renderAll() {
  renderStatus();
  renderCalendar();
  renderLog();
  renderStats();
}

/* ---------- 事件绑定 ---------- */
function bindEvents() {
  // 底部 Tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('page-' + btn.dataset.page).classList.add('active');
    });
  });

  // 月份切换
  $('prevMonth').addEventListener('click', () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  $('nextMonth').addEventListener('click', () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  // 日历点击 -> 选中日期并跳到记录页
  els.calendarGrid.addEventListener('click', e => {
    const cell = e.target.closest('.day-cell');
    if (!cell) return;
    state.selectedDate = cell.dataset.date;
    renderCalendar();
    renderLog();
    document.querySelector('.tab-btn[data-page="log"]').click();
  });

  // 记录页：日期前后切换
  $('logPrevDay').addEventListener('click', () => {
    state.selectedDate = fmt(addDays(parseDate(state.selectedDate), -1));
    state.viewMonth = parseDate(state.selectedDate);
    renderCalendar();
    renderLog();
  });
  $('logNextDay').addEventListener('click', () => {
    state.selectedDate = fmt(addDays(parseDate(state.selectedDate), 1));
    state.viewMonth = parseDate(state.selectedDate);
    renderCalendar();
    renderLog();
  });

  // 记录页：经期开关
  els.periodToggle.addEventListener('click', () => {
    if (state.periodDays.has(state.selectedDate)) {
      state.periodDays.delete(state.selectedDate);
    } else {
      state.periodDays.add(state.selectedDate);
    }
    renderLog();
    afterLogChange();
  });

  // 记录页：症状多选
  els.symptomChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const log = getLog(state.selectedDate);
    const id = chip.dataset.symptom;
    const idx = log.symptoms.indexOf(id);
    if (idx >= 0) log.symptoms.splice(idx, 1);
    else log.symptoms.push(id);
    renderLog();
    afterLogChange();
  });

  // 记录页：心情单选（再点一次取消）
  els.moodRow.addEventListener('click', e => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    const log = getLog(state.selectedDate);
    log.mood = (log.mood === btn.dataset.mood) ? '' : btn.dataset.mood;
    renderLog();
    afterLogChange();
  });

  // 记录页：备注
  els.noteInput.addEventListener('input', () => {
    const log = getLog(state.selectedDate);
    log.note = els.noteInput.value;
    afterLogChange();
  });
}

/* ---------- 启动 ---------- */
loadState();
bindEvents();
renderAll();
