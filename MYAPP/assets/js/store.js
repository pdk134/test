/**
 * 本地存储层：所有学习记录保存在 localStorage，刷新/关闭浏览器不丢。
 * 数据结构：
 * {
 *   v: 1,
 *   cards: { [术语]: { box, iv, due, reps, lapses, wrong, ease, last } },
 *   stats: { reviewed, correct, streak, lastDay, daily: { 'YYYY-MM-DD': { n, r, ok } } },
 *   settings: { dailyNew, dailyReview, autoSpeak, theme }
 * }
 */
window.Store = (function () {
  var KEY = 'arch-term-trainer-v1';
  var DAY = 86400000;

  function empty() {
    return {
      v: 1,
      updatedAt: 0,
      cards: {},
      stats: { reviewed: 0, correct: 0, streak: 0, lastDay: '', daily: {} },
      settings: { dailyNew: 10, dailyReview: 60, autoSpeak: false, theme: 'dark', bgm: false, bgmVol: 35, sfx: true, sfxVol: 60 }
    };
  }

  /** 老数据 / 云端数据缺少新增设置项时补齐默认值 */
  function fillSettings(s) {
    var def = empty().settings, k;
    for (k in def) if (s[k] === undefined) s[k] = def[k];
    return s;
  }

  var data;
  try {
    data = JSON.parse(localStorage.getItem(KEY)) || empty();
  } catch (e) {
    data = empty();
  }
  if (!data.cards) data.cards = {};
  if (!data.stats) data.stats = empty().stats;
  if (!data.stats.daily) data.stats.daily = {};
  data.settings = fillSettings(data.settings || {});

  var saveTimer = null, notify = true;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }, 120);
    if (notify && window.Sync && window.Sync.isReady()) window.Sync.schedulePush();
  }

  /** 数据发生变化时调用：刷新时间戳 + 落盘 + 通知云端同步 */
  function touch() {
    data.updatedAt = Date.now();
    save();
  }

  /** 用云端数据整体替换本地（不触发反向推送） */
  function replace(remote) {
    data = remote;
    if (!data.cards) data.cards = {};
    if (!data.stats) data.stats = empty().stats;
    if (!data.stats.daily) data.stats.daily = {};
    data.settings = fillSettings(data.settings || {});
    notify = false;
    save();
    notify = true;
  }

  function dayKey(ts) {
    var d = ts ? new Date(ts) : new Date();
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (dd < 10 ? '0' + dd : dd);
  }

  function card(id) {
    if (!data.cards[id]) {
      data.cards[id] = { box: 0, iv: 0, due: 0, reps: 0, lapses: 0, wrong: 0, ease: 2.5, last: 0 };
    }
    return data.cards[id];
  }

  function today() {
    var k = dayKey();
    if (!data.stats.daily[k]) data.stats.daily[k] = { n: 0, r: 0, ok: 0 };
    return data.stats.daily[k];
  }

  /** 记录一次学习结果：kind = 'new' | 'review'，ok = 是否判为认识 */
  function record(kind, ok) {
    var s = data.stats, t = today(), k = dayKey();
    s.reviewed++;
    if (ok) s.correct++;
    if (kind === 'new') t.n++; else t.r++;
    if (ok) t.ok++;

    if (s.lastDay !== k) {
      var y = dayKey(Date.now() - DAY);
      s.streak = s.lastDay === y ? s.streak + 1 : 1;
      s.lastDay = k;
    }
    touch();
  }

  function dailyCounts() {
    var t = today();
    return { n: t.n, r: t.r, ok: t.ok, streak: data.stats.streak };
  }

  function last7() {
    var arr = [];
    for (var i = 6; i >= 0; i--) {
      var k = dayKey(Date.now() - i * DAY);
      var d = data.stats.daily[k] || { n: 0, r: 0, ok: 0 };
      arr.push({ key: k, label: k.slice(5), total: d.n + d.r });
    }
    return arr;
  }

  var api = {
    save: save,
    touch: touch,
    replace: replace,
    card: card,
    raw: function (id) { return data.cards[id] || null; },
    record: record,
    dailyCounts: dailyCounts,
    last7: last7,
    dayKey: dayKey,
    reset: function () { data = empty(); touch(); },
    load: function (obj) {
      if (obj && obj.cards) { replace(obj); touch(); return true; }
      return false;
    },
    exportText: function () { return JSON.stringify(data, null, 2); }
  };

  // data 指向会随「云端数据替换」变化，这里用 getter 保证外部始终拿到最新对象
  Object.defineProperty(api, 'data', { get: function () { return data; } });
  return api;
})();
