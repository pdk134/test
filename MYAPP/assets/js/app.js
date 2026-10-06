/* 架构术语学习通 —— 交互逻辑 */
(function () {
  'use strict';

  var TERMS = window.TERMS || [];
  var byId = {};
  var CATS = [];
  var $ = function (s) { return document.querySelector(s); };

  TERMS.forEach(function (t) {
    t.id = t.t;
    byId[t.id] = t;
    if (CATS.indexOf(t.c) < 0) CATS.push(t.c);
  });

  /* ---------------- 通用 ---------------- */
  var VIEWS = {
    learn: ['今日学习', '按间隔重复安排复习，稳步把这些术语变成本能'],
    library: ['术语词库', '浏览、检索全部术语，支持按分类与状态筛选'],
    quiz: ['选择题测试', '术语 ↔ 释义 双向考察，答错自动进入难词本'],
    stats: ['学习统计', '掌握进度、每日学习量与难词本'],
    settings: ['设置', '学习计划、数据备份与快捷键'],
    account: ['账号与同步', '登录后可在手机与电脑之间同步学习进度']
  };

  function switchView(name) {
    var list = document.querySelectorAll('.view');
    for (var i = 0; i < list.length; i++) list[i].classList.toggle('active', list[i].id === 'view-' + name);
    var items = document.querySelectorAll('.nav-item');
    for (var j = 0; j < items.length; j++) items[j].classList.toggle('active', items[j].getAttribute('data-view') === name);
    $('#pageTitle').textContent = VIEWS[name][0];
    $('#pageSub').textContent = VIEWS[name][1];
    if (name === 'learn') { if (!session.items.length) startSession(); else renderCard(); }
    if (name === 'library') renderLibrary();
    if (name === 'stats') renderStats();
    if (name === 'account') renderAccount();
    window.scrollTo(0, 0);
  }

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function statusLabel(id) {
    var c = Store.raw(id), s = SRS.statusOf(c);
    if (s === 'new') return { text: '未学习', cls: '' };
    if (s === 'mastered') return { text: '已掌握', cls: 'mastered' };
    return { text: '学习中', cls: 'learning' };
  }

  function levelText(lv) { return ['', '基础', '进阶', '高阶'][lv] || '基础'; }

  /* ---------------- 学习会话 ---------------- */
  var session = { items: [], idx: 0, newCount: 0, okCount: 0, total: 0 };

  function buildQueue(extra) {
    var now = Date.now(), s = Store.data.settings;
    var due = [], fresh = [];
    TERMS.forEach(function (t) {
      var c = Store.raw(t.id);
      if (!c || c.reps === 0) fresh.push(t.id);
      else if ((c.due || 0) <= now) due.push({ id: t.id, due: c.due });
    });
    due.sort(function (a, b) { return a.due - b.due; });

    var limR = extra ? due.length : s.dailyReview;
    var limN = extra ? s.dailyNew + extra : s.dailyNew;
    var items = due.slice(0, limR).map(function (x) { return { id: x.id, kind: 'review' }; })
      .concat(fresh.slice(0, limN).map(function (id) { return { id: id, kind: 'new' }; }));
    return { items: items, dueTotal: due.length, newTotal: fresh.length };
  }

  function startSession(extra) {
    var q = buildQueue(extra || 0);
    session.items = q.items;
    session.idx = 0;
    session.newCount = 0;
    session.okCount = 0;
    session.total = q.items.length;

    if (!q.items.length) {
      $('#flashcard').classList.add('gone');
      $('#controls').classList.add('hidden');
      $('#rateBar').classList.add('hidden');
      $('#summary').classList.add('hidden');
      $('#learnEmpty').classList.remove('hidden');
      $('#emptyTitle').textContent = q.dueTotal || q.newTotal ? '今天的配额用完了' : '今天的任务完成了';
      $('#emptyText').textContent = '待复习 ' + q.dueTotal + ' 个，未学习 ' + q.newTotal + ' 个。可以去词库预习，或临时加练。';
      $('#learnBar').style.width = '100%';
      $('#learnCounter').textContent = '0 / 0';
      $('#learnChips').innerHTML = '';
      return;
    }

    $('#learnEmpty').classList.add('hidden');
    $('#summary').classList.add('hidden');
    $('#flashcard').classList.remove('gone');
    $('#controls').classList.remove('hidden');
    $('#rateBar').classList.remove('hidden');
    renderCard();
  }

  function renderCard() {
    var i = session.idx;
    if (i >= session.items.length) { showSummary(); return; }

    var item = session.items[i], t = byId[item.id], c = Store.raw(item.id);
    var card = $('#flashcard');
    card.classList.remove('flipped');

    $('#fCat').textContent = t.c;
    $('#fLv').textContent = levelText(t.lv);
    $('#fTerm').textContent = t.t;
    $('#fEn').textContent = t.en || '';

    $('#bTerm').textContent = t.t + (t.en ? '　' + t.en : '');
    $('#bDef').textContent = t.d || '';
    $('#bPoints').innerHTML = (t.p || []).map(function (p) { return '<li>' + p + '</li>'; }).join('');
    $('#bEg').textContent = t.e || '—';
    $('#bRel').innerHTML = (t.r || []).map(function (r) {
      return byId[r] ? '<span class="tag" data-goto="' + r + '">' + r + '</span>' : '';
    }).join('');

    $('#rateBar').classList.add('disabled');
    var pct = Math.round(i / session.total * 100);
    $('#learnBar').style.width = pct + '%';
    $('#learnCounter').textContent = i + ' / ' + session.total;

    var st = statusLabel(item.id);
    $('#learnChips').innerHTML =
      '<span class="chip on">' + (item.kind === 'new' ? '新学' : '复习') + '</span>' +
      '<span class="chip">' + st.text + '</span>' +
      '<span class="chip">' + (c ? SRS.dueText(c) : '未学习') + '</span>';

    if (Store.data.settings.autoSpeak) speak(t.t);
    updateSide();
  }

  function flip(e) {
    if (e && e.target.closest && e.target.closest('[data-goto]')) return; // 点相关术语不翻卡
    var card = $('#flashcard');
    if (card.classList.contains('gone')) return;
    card.classList.toggle('flipped');
    var flipped = card.classList.contains('flipped');
    $('#rateBar').classList.toggle('disabled', !flipped);
    if (flipped && !Store.data.settings.autoSpeak) { /* 翻到背面不自动朗读，避免打断阅读 */ }
  }

  function rate(r) {
    if ($('#rateBar').classList.contains('disabled')) return;
    var item = session.items[session.idx];
    if (!item) return;
    var c = Store.card(item.id);
    SRS.schedule(c, r);
    Store.record(item.kind, r === 2);
    if (r === 2) session.okCount++;
    if (item.kind === 'new') session.newCount++;
    session.idx++;
    renderCard();
  }

  function showSummary() {
    $('#flashcard').classList.add('gone');
    $('#controls').classList.add('hidden');
    $('#rateBar').classList.add('hidden');
    $('#summary').classList.remove('hidden');
    var total = session.total;
    $('#sumTotal').textContent = total;
    $('#sumNew').textContent = session.newCount;
    $('#sumOk').textContent = session.okCount;
    $('#sumAcc').textContent = total ? Math.round(session.okCount / total * 100) + '%' : '0%';
    $('#learnBar').style.width = '100%';
    $('#learnCounter').textContent = total + ' / ' + total;
    updateSide();
  }

  function updateSide() {
    var d = Store.dailyCounts();
    $('#sideNew').textContent = d.n;
    $('#sideRev').textContent = d.r;
    $('#sideStreak').textContent = d.streak;
    var s = Sync.state();
    $('#sideUser').textContent = s.email ? '· ' + s.email.split('@')[0] : '· 本地模式';
  }

  /* ---------------- 账号与同步 ---------------- */
  var STATUS_TEXT = { off: '未同步', ready: '已连接', syncing: '同步中', error: '异常' };
  var lastDataRef = null;

  function renderAccount() {
    var s = Sync.state(), cfg = Sync.config();
    $('#sbUrl').value = cfg ? cfg.url : '';
    $('#sbKey').value = cfg ? cfg.key : '';
    var logged = !!s.email;
    $('#acctAuth').classList.toggle('hidden', logged);
    $('#acctUser').classList.toggle('hidden', !logged);
    if (logged) {
      $('#acctEmailShow').textContent = s.email;
      $('#acctStatus').textContent = STATUS_TEXT[s.status] || s.status;
      var info = s.message ? s.message : '';
      if (s.lastSync) info += ' · 上次同步 ' + new Date(s.lastSync).toLocaleTimeString();
      $('#acctSyncInfo').textContent = info;
    }
    updateSide();
  }

  function afterCloudChange() {
    // 云端数据替换了本地对象时才重绘，避免每次同步消息都刷新界面
    if (Store.data !== lastDataRef) {
      lastDataRef = Store.data;
      applySettings();
      startSession();
      renderLibrary();
      renderStats();
    }
    if ($('#view-account').classList.contains('active')) renderAccount();
  }

  /* ---------------- 词库 ---------------- */
  var libState = { q: '', cat: 'all', status: 'all' };

  function renderLibrary() {
    var chips = '<button class="chip' + (libState.cat === 'all' ? ' on' : '') + '" data-cat="all">全部</button>';
    CATS.forEach(function (c) {
      chips += '<button class="chip' + (libState.cat === c ? ' on' : '') + '" data-cat="' + c + '">' + c + '</button>';
    });
    $('#libCats').innerHTML = chips;

    var q = libState.q.trim().toLowerCase();
    var list = TERMS.filter(function (t) {
      if (libState.cat !== 'all' && t.c !== libState.cat) return false;
      if (libState.status !== 'all' && SRS.statusOf(Store.raw(t.id)) !== libState.status) return false;
      if (!q) return true;
      var hay = (t.t + ' ' + (t.en || '') + ' ' + (t.d || '')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });

    $('#libList').innerHTML = list.map(function (t) {
      var st = statusLabel(t.id);
      return '<div class="lib-item" data-open="' + t.id + '">' +
        '<div class="lib-top"><div><div class="lib-term">' + t.t + '</div>' +
        '<div class="lib-en">' + (t.en || '') + '</div></div>' +
        '<span class="badge ' + st.cls + '">' + st.text + '</span></div>' +
        '<div class="lib-def">' + (t.d || '') + '</div></div>';
    }).join('') || '<p class="muted">没有匹配的术语</p>';
  }

  function openDetail(id) {
    var t = byId[id];
    if (!t) return;
    var c = Store.raw(id);
    var st = statusLabel(id);
    $('#modalBody').innerHTML =
      '<h3>' + t.t + '</h3>' +
      '<p class="sub">' + (t.en || '') + '　·　' + t.c + '　·　' + levelText(t.lv) + '</p>' +
      '<div class="sec"><h4>定义</h4><p class="muted" style="font-size:14px;line-height:1.8">' + (t.d || '') + '</p></div>' +
      '<div class="sec"><h4>要点</h4><ul class="fc-points" style="color:var(--text)">' +
      (t.p || []).map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></div>' +
      '<div class="sec"><h4>典型场景</h4><p class="muted" style="font-size:14px;line-height:1.8">' + (t.e || '—') + '</p></div>' +
      '<div class="sec"><h4>相关术语</h4><div>' +
      (t.r || []).map(function (r) { return byId[r] ? '<span class="tag" data-goto="' + r + '" style="cursor:pointer">' + r + '</span>' : ''; }).join(' ') +
      '</div></div>' +
      '<div class="sec"><h4>学习状态</h4><p class="muted">' + st.text + '　·　' + (c ? SRS.dueText(c) : '未学习') +
      '　·　复习 ' + (c ? c.reps : 0) + ' 次，遗忘 ' + (c ? c.lapses : 0) + ' 次</p></div>';
    $('#modal').classList.remove('hidden');
  }

  /* ---------------- 测试 ---------------- */
  var quiz = { list: [], i: 0, right: 0, wrong: [] };

  function startQuiz(n) {
    var pool = TERMS.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    quiz.list = pool.slice(0, Math.min(n, pool.length)).map(function (t) {
      return { id: t.id, type: Math.random() < 0.5 ? 0 : 1 };
    });
    quiz.i = 0; quiz.right = 0; quiz.wrong = [];

    $('#quizStart').classList.add('hidden');
    $('#quizResult').classList.add('hidden');
    $('#quizPlay').classList.remove('hidden');
    renderQuestion();
  }

  function pickOptions(t, type) {
    var others = TERMS.filter(function (x) { return x.id !== t.id; });
    var same = others.filter(function (x) { return x.c === t.c; });
    var src = same.length >= 3 ? same : others;
    var picked = [], used = {};
    while (picked.length < 3 && picked.length < src.length) {
      var k = Math.floor(Math.random() * src.length);
      if (used[k]) continue;
      used[k] = 1;
      picked.push(src[k]);
    }
    var opts = picked.map(function (x) { return { id: x.id, text: type === 0 ? (x.d || '') : x.t }; });
    opts.push({ id: t.id, text: type === 0 ? (t.d || '') : t.t });
    for (var i = opts.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
    }
    return opts;
  }

  function clip(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s; }

  function renderQuestion() {
    if (quiz.i >= quiz.list.length) { showQuizResult(); return; }
    var q = quiz.list[quiz.i], t = byId[q.id];
    $('#quizBar').style.width = Math.round(quiz.i / quiz.list.length * 100) + '%';
    $('#quizCounter').textContent = quiz.i + ' / ' + quiz.list.length;
    $('#quizQ').textContent = q.type === 0 ? t.t : (t.d || '');
    $('#quizTip').textContent = q.type === 0 ? '选出正确的释义' : '选出对应的术语';
    $('#quizFeedback').classList.add('hidden');
    $('#btnQuizNext').classList.add('hidden');

    $('#quizOptions').innerHTML = pickOptions(t, q.type).map(function (o, i) {
      return '<button class="opt" data-opt="' + i + '" data-id="' + o.id + '">' + clip(o.text, 90) + '</button>';
    }).join('');
  }

  function answer(btn) {
    var q = quiz.list[quiz.i], t = byId[q.id];
    var ok = btn.getAttribute('data-id') === q.id;
    var btns = document.querySelectorAll('#quizOptions .opt');
    for (var i = 0; i < btns.length; i++) {
      btns[i].disabled = true;
      if (btns[i].getAttribute('data-id') === q.id) btns[i].classList.add('right');
    }
    if (!ok) { btn.classList.add('wrong'); quiz.wrong.push(q.id); Store.card(q.id).wrong++; Store.touch(); } else { quiz.right++; }

    $('#quizFeedback').classList.remove('hidden');
    $('#quizFeedback').innerHTML = (ok ? '<b style="color:var(--good)">回答正确</b>' : '<b style="color:var(--bad)">回答错误</b>') +
      '<br>' + t.t + '：' + (t.d || '');
    $('#btnQuizNext').classList.remove('hidden');
  }

  function showQuizResult() {
    $('#quizPlay').classList.add('hidden');
    $('#quizResult').classList.remove('hidden');
    var total = quiz.list.length;
    $('#qTotal').textContent = total;
    $('#qRight').textContent = quiz.right;
    $('#qAcc').textContent = total ? Math.round(quiz.right / total * 100) + '%' : '0%';
    $('#qWrong').textContent = quiz.wrong.length;
    $('#quizScore').textContent = quiz.right === total ? '全部正确，很稳' : '测试完成';
    updateSide();
  }

  /* ---------------- 统计 ---------------- */
  function countStatus() {
    var r = { total: TERMS.length, learned: 0, mastered: 0, due: 0, new: 0 };
    var now = Date.now();
    TERMS.forEach(function (t) {
      var c = Store.raw(t.id), s = SRS.statusOf(c);
      if (s === 'new') r.new++;
      else {
        r.learned++;
        if (s === 'mastered') r.mastered++;
        if ((c.due || 0) <= now) r.due++;
      }
    });
    return r;
  }

  function renderStats() {
    var r = countStatus();
    $('#stTotal').textContent = r.total;
    $('#stLearned').textContent = r.learned;
    $('#stMastered').textContent = r.mastered;
    $('#stDue').textContent = r.due;

    var pct = r.total ? r.mastered / r.total : 0;
    var C = 2 * Math.PI * 52;
    $('#donutFg').style.strokeDasharray = C;
    $('#donutFg').style.strokeDashoffset = C * (1 - pct);
    $('#donutPct').textContent = Math.round(pct * 100) + '%';
    $('#legend').innerHTML =
      '<span><i style="background:var(--good)"></i>已掌握 ' + r.mastered + '</span>' +
      '<span><i style="background:var(--warn)"></i>学习中 ' + (r.learned - r.mastered) + '</span>' +
      '<span><i style="background:var(--line)"></i>未学习 ' + r.new + '</span>';

    var days = Store.last7(), max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.total; })));
    $('#bars').innerHTML = days.map(function (d) {
      var h = Math.round(d.total / max * 130);
      return '<div class="bar-col"><div class="col" style="height:' + h + 'px" title="' + d.total + '"></div><span>' + d.label + '</span></div>';
    }).join('');

    $('#catProgress').innerHTML = CATS.map(function (cat) {
      var all = TERMS.filter(function (t) { return t.c === cat; });
      var m = all.filter(function (t) { return SRS.statusOf(Store.raw(t.id)) === 'mastered'; }).length;
      var p = all.length ? Math.round(m / all.length * 100) : 0;
      return '<div class="cat-row"><span>' + cat + '</span>' +
        '<div class="bar"><i style="width:' + p + '%"></i></div>' +
        '<b>' + m + '/' + all.length + '</b></div>';
    }).join('');

    var hard = TERMS.filter(function (t) {
      var c = Store.raw(t.id);
      return c && (c.lapses > 0 || c.wrong > 0);
    }).sort(function (a, b) {
      return (Store.raw(b.id).lapses + Store.raw(b.id).wrong) - (Store.raw(a.id).lapses + Store.raw(a.id).wrong);
    });
    $('#hardList').innerHTML = hard.length ? hard.map(function (t) {
      var c = Store.raw(t.id);
      return '<div class="lib-item" data-open="' + t.id + '"><div class="lib-top"><div class="lib-term">' + t.t + '</div>' +
        '<span class="badge learning">遗忘 ' + c.lapses + ' · 错 ' + c.wrong + '</span></div>' +
        '<div class="lib-def">' + (t.d || '') + '</div></div>';
    }).join('') : '<p class="muted">还没有难词，保持住</p>';
  }

  /* ---------------- 设置 ---------------- */
  function applySettings() {
    var s = Store.data.settings;
    $('#setNew').value = s.dailyNew;
    $('#setRev').value = s.dailyReview;
    $('#setSpeak').checked = !!s.autoSpeak;
    document.documentElement.setAttribute('data-theme', s.theme);
    $('#themeBtn').textContent = s.theme === 'dark' ? '☾' : '☀';
  }

  /* ---------------- 事件绑定 ---------------- */
  $('#nav').addEventListener('click', function (e) {
    var btn = e.target.closest('.nav-item');
    if (btn) switchView(btn.getAttribute('data-view'));
  });

  document.addEventListener('click', function (e) {
    var jump = e.target.closest('[data-view]');
    if (jump && !jump.classList.contains('nav-item')) switchView(jump.getAttribute('data-view'));
  });

  $('#flashcard').addEventListener('click', flip);
  $('#btnFlip').addEventListener('click', flip);
  $('#btnSpeak').addEventListener('click', function () {
    var item = session.items[session.idx];
    if (item) speak(byId[item.id].t);
  });
  $('#rateBar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (b) rate(+b.getAttribute('data-r'));
  });
  $('#btnMore').addEventListener('click', function () { startSession(); });
  $('#btnExtra').addEventListener('click', function () { startSession(10); });

  $('#libSearch').addEventListener('input', function (e) { libState.q = e.target.value; renderLibrary(); });
  $('#libStatus').addEventListener('change', function (e) { libState.status = e.target.value; renderLibrary(); });
  $('#libCats').addEventListener('click', function (e) {
    var c = e.target.closest('[data-cat]');
    if (!c) return;
    libState.cat = c.getAttribute('data-cat');
    renderLibrary();
  });
  $('#libList').addEventListener('click', function (e) {
    var it = e.target.closest('[data-open]');
    if (it) openDetail(it.getAttribute('data-open'));
  });
  $('#hardList').addEventListener('click', function (e) {
    var it = e.target.closest('[data-open]');
    if (it) openDetail(it.getAttribute('data-open'));
  });

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (g) openDetail(g.getAttribute('data-goto'));
  });
  $('#modalClose').addEventListener('click', function () { $('#modal').classList.add('hidden'); });
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) $('#modal').classList.add('hidden'); });

  $('#btnQuizStart').addEventListener('click', function () { startQuiz(+$('#quizCount').value); });
  $('#quizOptions').addEventListener('click', function (e) {
    var b = e.target.closest('.opt');
    if (b && !b.disabled) answer(b);
  });
  $('#btnQuizNext').addEventListener('click', function () { quiz.i++; renderQuestion(); });
  $('#btnQuizAgain').addEventListener('click', function () { startQuiz(+$('#quizCount').value); });

  $('#setNew').addEventListener('change', function (e) { Store.data.settings.dailyNew = +e.target.value; Store.touch(); });
  $('#setRev').addEventListener('change', function (e) { Store.data.settings.dailyReview = +e.target.value; Store.touch(); });
  $('#setSpeak').addEventListener('change', function (e) { Store.data.settings.autoSpeak = e.target.checked; Store.touch(); });
  $('#themeBtn').addEventListener('click', function () {
    var s = Store.data.settings;
    s.theme = s.theme === 'dark' ? 'light' : 'dark';
    Store.touch();
    applySettings();
  });

  $('#btnSaveCfg').addEventListener('click', function () {
    Sync.setConfig($('#sbUrl').value, $('#sbKey').value);
    Sync.init();
    toast('配置已保存');
    renderAccount();
  });
  $('#btnClearCfg').addEventListener('click', function () {
    Sync.setConfig('', '');
    toast('已清除云端配置，回到本地模式');
    renderAccount();
  });
  $('#btnSignIn').addEventListener('click', function () {
    var email = $('#acctEmail').value.trim(), pwd = $('#acctPwd').value;
    if (!email || pwd.length < 6) { toast('请填写邮箱和至少 6 位密码'); return; }
    Sync.signIn(email, pwd).then(function (ok) {
      renderAccount();
      toast(ok ? '登录成功' : (Sync.state().message || '登录失败'));
    });
  });
  $('#btnSignUp').addEventListener('click', function () {
    var email = $('#acctEmail').value.trim(), pwd = $('#acctPwd').value;
    if (!email || pwd.length < 6) { toast('请填写邮箱和至少 6 位密码'); return; }
    Sync.signUp(email, pwd).then(function (ok) {
      renderAccount();
      toast(ok ? '注册并登录成功' : (Sync.state().message || '注册失败'));
    });
  });
  $('#btnSignOut').addEventListener('click', function () {
    Sync.signOut().then(function () { renderAccount(); toast('已退出登录'); });
  });
  $('#btnSyncNow').addEventListener('click', function () {
    Sync.pull().then(function () { renderAccount(); toast(Sync.state().message || '已同步'); });
  });

  $('#btnExport').addEventListener('click', function () {
    var blob = new Blob([Store.exportText()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arch-terms-' + Store.dayKey() + '.json';
    a.click();
    toast('已导出学习记录');
  });
  $('#btnImport').addEventListener('click', function () { $('#importFile').click(); });
  $('#importFile').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        if (Store.load(JSON.parse(reader.result))) { applySettings(); toast('导入成功'); startSession(); }
        else toast('文件格式不正确');
      } catch (err) { toast('解析失败'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm('确定清空全部学习记录？该操作不可恢复。')) return;
    Store.reset();
    applySettings();
    switchView('settings');
    toast('已清空');
  });

  document.addEventListener('keydown', function (e) {
    var learnActive = $('#view-learn').classList.contains('active');
    if (e.key === 'Escape') { $('#modal').classList.add('hidden'); return; }
    if (!learnActive || $('#modal').classList.contains('hidden') === false) return;
    if (e.code === 'Space') { e.preventDefault(); flip(); }
    else if (e.key === '1') rate(0);
    else if (e.key === '2') rate(1);
    else if (e.key === '3') rate(2);
  });

  /* ---------------- 启动 ---------------- */
  lastDataRef = Store.data;
  Sync.onChange(afterCloudChange);
  applySettings();
  renderLibrary();
  renderStats();
  updateSide();
  startSession();
  switchView('learn');
  Sync.init().then(function () { afterCloudChange(); });
})();
