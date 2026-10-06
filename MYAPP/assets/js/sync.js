/**
 * 云端同步层（Supabase）
 * - 账号：邮箱 + 密码（Supabase Auth）
 * - 数据：每个用户一行 { user_id, data(jsonb), updated_at }，靠 RLS 保证只能读写自己的那一行
 * - 冲突策略：每个用户只存一条整份快照，按 updatedAt 取最新的（last-write-wins）
 */
window.Sync = (function () {
  var CFG_KEY = 'arch-term-supabase-config';
  var TABLE = 'progress';
  var client = null;
  var cfg = null;
  var user = null;
  var listeners = [];
  var pushTimer = null;
  var state = { status: 'off', message: '', lastSync: 0, email: '' };

  function emit(msg) {
    if (msg) state.message = msg;
    for (var i = 0; i < listeners.length; i++) listeners[i](state);
  }

  function loadConfig() {
    try { cfg = JSON.parse(localStorage.getItem(CFG_KEY)) || null; } catch (e) { cfg = null; }
    if (!cfg || !cfg.url || !cfg.key) {
      var d = window.SUPABASE_CONFIG || {};
      cfg = (d.url && d.anonKey) ? { url: d.url, key: d.anonKey } : null;
    }
    return cfg;
  }

  function setConfig(url, key) {
    localStorage.setItem(CFG_KEY, JSON.stringify({ url: (url || '').trim(), key: (key || '').trim() }));
    client = null;
    loadConfig();
  }

  function clientNow() {
    if (!cfg) { state.status = 'off'; return null; }
    if (!window.supabase || !window.supabase.createClient) {
      state.status = 'error';
      state.message = 'Supabase SDK 未加载，请联网后重试';
      return null;
    }
    if (!client) client = window.supabase.createClient(cfg.url, cfg.key);
    return client;
  }

  function fail(e) {
    state.status = 'error';
    state.message = (e && (e.message || e.error_description || e)) || '请求失败';
    emit();
  }

  /* ---------------- 拉取 / 推送 ---------------- */
  async function pull(fromInit) {
    var c = clientNow();
    if (!c || !user) return false;
    try {
      var res = await c.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
      if (res.error) { fail(res.error); return false; }
      var remote = res.data;
      var localTs = Store.data.updatedAt || 0;
      if (!remote) {
        await push(true);
        state.lastSync = Date.now();
        emit('云端还没有数据，已上传本机进度');
      } else if (remote.updated_at > localTs + 1000) {
        Store.replace(remote.data);
        state.lastSync = Date.now();
        emit(fromInit ? '已从云端恢复进度' : '已同步（采用云端最新数据）');
      } else if (remote.updated_at + 1000 < localTs) {
        await push(true);
        state.lastSync = Date.now();
        emit('已上传本机最新进度');
      } else {
        state.lastSync = Date.now();
        emit('两端数据一致');
      }
      state.status = 'ready';
      emit();
      return true;
    } catch (e) { fail(e); return false; }
  }

  async function push(force) {
    var c = clientNow();
    if (!c || !user) return false;
    try {
      var res = await c.from(TABLE).upsert(
        { user_id: user.id, data: Store.data, updated_at: Store.data.updatedAt || Date.now() },
        { onConflict: 'user_id' }
      );
      if (res.error) { fail(res.error); return false; }
      state.lastSync = Date.now();
      if (force) emit('已上传到云端');
      else emit();
      return true;
    } catch (e) { fail(e); return false; }
  }

  function schedulePush() {
    if (!isReady()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { push(false); }, 2500);
  }

  /* ---------------- 账号 ---------------- */
  async function bootstrap() {
    var c = clientNow();
    if (!c) return;
    state.status = 'syncing';
    emit('正在同步…');
    await pull(true);
  }

  async function signUp(email, password) {
    var c = clientNow();
    if (!c) { state.status = 'error'; state.message = '请先填写 Supabase 配置'; emit(); return false; }
    try {
      var res = await c.auth.signUp({ email: email, password: password });
      if (res.error) { fail(res.error); return false; }
      if (!res.data.session) {
        state.status = 'ready';
        state.message = '注册成功，请先到邮箱点确认链接后再登录（也可在 Supabase 后台关闭邮箱验证）';
        emit();
        return false;
      }
      user = res.data.user;
      state.email = user.email;
      await bootstrap();
      return true;
    } catch (e) { fail(e); return false; }
  }

  async function signIn(email, password) {
    var c = clientNow();
    if (!c) { state.status = 'error'; state.message = '请先填写 Supabase 配置'; emit(); return false; }
    try {
      var res = await c.auth.signInWithPassword({ email: email, password: password });
      if (res.error) { fail(res.error); return false; }
      user = res.data.user;
      state.email = user.email;
      await bootstrap();
      return true;
    } catch (e) { fail(e); return false; }
  }

  async function signOut() {
    var c = clientNow();
    user = null;
    state.status = 'off';
    state.email = '';
    state.message = '已退出登录，数据仍保留在本机';
    if (c) { try { await c.auth.signOut(); } catch (e) {} }
    emit();
  }

  /* ---------------- 初始化 ---------------- */
  var inited = false;
  async function init() {
    if (inited) { loadConfig(); client = null; clientNow(); emit(); return; }
    inited = true;
    loadConfig();
    var c = clientNow();
    if (!c) { emit(state.message || '未配置 Supabase，当前为纯本地模式'); return; }
    try {
      var res = await c.auth.getSession();
      user = (res.data && res.data.session && res.data.session.user) || null;
      state.email = user ? user.email : '';
      if (user) { await bootstrap(); } else { state.status = 'ready'; emit('未登录，数据只存在本机'); }
    } catch (e) { fail(e); }
    c.auth.onAuthStateChange(function (_e, session) {
      user = session ? session.user : null;
      state.email = user ? user.email : '';
      if (user) bootstrap(); else { state.status = 'ready'; emit('未登录，数据只存在本机'); }
    });

    setInterval(function () {
      if (isReady() && document.visibilityState === 'visible') pull(false);
    }, 120000);
    document.addEventListener('visibilitychange', function () {
      if (isReady() && document.visibilityState === 'visible') pull(false);
    });
    window.addEventListener('pagehide', function () { if (isReady()) push(true); });
  }

  function isReady() { return !!(cfg && user && client); }

  return {
    init: init,
    state: function () { return state; },
    isReady: isReady,
    hasConfig: function () { return !!cfg; },
    config: function () { return cfg; },
    setConfig: setConfig,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    pull: function () { return pull(false); },
    push: function () { return push(true); },
    schedulePush: schedulePush,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
