/**
 * 学习背景音乐（BGM）
 * 用 Web Audio API 实时合成一段舒缓的循环氛围音：低音 + 和弦垫 + 五声音阶铃音。
 * 优点：不需要任何音频文件，单文件版/离线也能播，体积极小，永远不重复听腻（带随机）。
 */
window.Bgm = (function () {
  var ctx = null, master = null, filter = null;
  var timer = null, playing = false, pending = false;
  var vol = 0.35;
  var nextTime = 0, chordIdx = 0;

  // Am7 → Fmaj7 → Cmaj7 → G，柔和的四和弦循环
  var CHORDS = [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [48, 52, 55, 59],
    [55, 59, 62, 64]
  ];
  // A 小调五声音阶，铃音从这里随机取音，怎么弹都不会难听
  var PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88];
  var BAR = 4.0;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.4;
    master.connect(filter);
    filter.connect(ctx.destination);
    return ctx;
  }

  function tone(note, t, dur, peak, type, detune) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = mtof(note);
    if (detune) o.detune.value = detune;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function pad(chord, t, dur) {
    for (var i = 0; i < chord.length; i++) {
      tone(chord[i], t, dur, 0.035, 'triangle', -5);
      tone(chord[i], t, dur, 0.028, 'sine', 6);
    }
  }

  function bass(root, t, dur) {
    tone(root, t, dur * 0.95, 0.075, 'sine', 0);
  }

  function bell(note, t) {
    tone(note, t, 2.2, 0.05, 'sine', 0);
  }

  function schedule() {
    if (!ctx) return;
    var horizon = ctx.currentTime + 2.5;
    while (nextTime < horizon) {
      var ch = CHORDS[chordIdx % CHORDS.length];
      pad(ch, nextTime, BAR);
      bass(ch[0] - 24, nextTime, BAR);
      for (var s = 0; s < 8; s++) {
        if (Math.random() < 0.5) {
          bell(PENTA[Math.floor(Math.random() * PENTA.length)], nextTime + s * (BAR / 8));
        }
      }
      nextTime += BAR;
      chordIdx++;
    }
  }

  function fade(to, sec) {
    if (!master) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(to, now + sec);
  }

  function start() {
    if (!ensure()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return true;
    playing = true;
    pending = false;
    nextTime = ctx.currentTime + 0.2;
    chordIdx = 0;
    fade(vol, 1.5);
    schedule();
    timer = setInterval(schedule, 500);
    return true;
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    timer = null;
    fade(0.0001, 0.8);
  }

  function armGesture() {
    if (pending) return;
    pending = true;
    var go = function () {
      document.removeEventListener('pointerdown', go);
      document.removeEventListener('keydown', go);
      start();
    };
    document.addEventListener('pointerdown', go);
    document.addEventListener('keydown', go);
  }

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { if (playing) ctx.suspend(); }
    else if (playing) ctx.resume();
  });

  return {
    start: start,
    stop: stop,
    /** 浏览器要求先有用户手势才能出声：没手势时先挂起，等第一次点击/按键再放 */
    startWhenAllowed: function () {
      if (!ensure()) return;
      if (ctx.state === 'running') start();
      else armGesture();
    },
    toggle: function () { if (playing) { stop(); return false; } start(); return true; },
    isOn: function () { return playing; },
    setVolume: function (v) {
      vol = Math.max(0, Math.min(1, v));
      if (playing) fade(vol, 0.25);
    }
  };
})();
