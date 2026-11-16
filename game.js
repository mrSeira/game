'use strict';
// Алиса и Искорка: три звёздочки — прототип (пролог + поляна Шуршика)
const W = 1280, H = 720, GY = 610;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const IMG = {};

// ---------- загрузка ----------
function loadAll(done) {
  const names = Object.keys(ASSETS); let left = names.length;
  names.forEach(n => { const i = new Image(); i.onload = i.onerror = () => { if (--left === 0) done(); }; i.src = ASSETS[n]; IMG[n] = i; });
}

// ---------- звук и голос ----------
let AC = null;
function audioInit() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); }
function beep(freq, dur, type, vol, delay) {
  if (!AC) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), v = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vol || 0.15, t + 0.02); v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(v); v.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  jump() { beep(520, 0.15, 'sine', 0.08); beep(700, 0.12, 'sine', 0.06, 0.06); },
  star() { beep(1047, 0.2, 'triangle', 0.12); beep(1568, 0.3, 'triangle', 0.1, 0.08); },
  boing() { beep(300, 0.25, 'sine', 0.12); beep(600, 0.25, 'sine', 0.1, 0.08); },
  chime() { [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.5, 'triangle', 0.1, i * 0.12)); },
  click() { beep(660, 0.08, 'square', 0.04); },
  plop() { beep(400, 0.3, 'sine', 0.1); beep(250, 0.3, 'sine', 0.1, 0.1); }
};
let sub = null;
const VOICE = { 'Шуршик': 1.6, 'Искорка': 1.4, 'Алиса': 1.3, 'Мама': 1.0, 'Совушка': 0.9 };
function say(who, text) {
  sub = { who, text, t: Math.max(3, text.length * 0.085) };
  try {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ru-RU'; u.rate = 0.9; u.pitch = VOICE[who] || 1.1;
      speechSynthesis.speak(u);
    }
  } catch (e) {}
}

// ---------- ввод ----------
const keys = {}, tapq = {};
const K = c => !!(keys[c] || tapq[c]);
addEventListener('keydown', e => { keys[e.code] = true; tapq[e.code] = true; audioInit(); if (/^(Arrow|Space|Enter)/.test(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('pointerdown', () => { audioInit(); keys.Tap = true; setTimeout(() => keys.Tap = false, 120); });
function pads() { const a = navigator.getGamepads ? navigator.getGamepads() : []; const r = []; for (let i = 0; i < a.length; i++) if (a[i] && a[i].connected) r.push(a[i]); return r; }
function padIn(p) {
  if (!p) return { x: 0, jump: false, act: false };
  const b = n => !!(p.buttons[n] && p.buttons[n].pressed);
  let x = p.axes[0] || 0; if (Math.abs(x) < 0.35) x = 0; else x = Math.sign(x);
  if (b(14)) x = -1; if (b(15)) x = 1;
  return { x, jump: b(0), act: b(2) || b(1) || b(3) };
}
const prev = [{}, {}];
function readInput() {
  const ps = pads(), a = padIn(ps[0]), b = padIn(ps[1]);
  const k1 = { x: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), jump: K('Space') || K('ArrowUp') || K('Enter') || K('NumpadEnter') || K('Tap'), act: K('KeyX') || K('KeyZ') || K('ArrowDown') };
  const k2 = { x: (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), jump: K('KeyW'), act: K('KeyS') };
  for (const c in tapq) delete tapq[c];
  const mk = (p, k, pr) => {
    const o = { x: p.x || k.x, jump: p.jump || k.jump, act: p.act || k.act };
    o.jumpHit = o.jump && !pr.jump; o.actHit = o.act && !pr.act; o.any = o.jumpHit || o.actHit;
    pr.jump = o.jump; pr.act = o.act; return o;
  };
  if (ps.length && (a.jump || a.act)) audioInit();
  return [mk(a, k1, prev[0]), mk(b, k2, prev[1]), ps.length];
}

// ---------- рисование ----------
function spr(name, x, y, h, flip, rot, sx, sy) { // якорь: низ по центру
  const im = IMG[name]; if (!im || !im.width) return;
  const w = h * im.width / im.height;
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale((flip ? -1 : 1) * (sx || 1), sy || 1);
  g.drawImage(im, -w / 2, -h, w, h); g.restore();
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function text(s, x, y, size, color, align, stroke) {
  g.font = '800 ' + size + 'px "Trebuchet MS","Segoe UI",Roboto,Arial,sans-serif'; g.textAlign = align || 'center'; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = size / 5; g.lineJoin = 'round'; g.strokeStyle = stroke; g.strokeText(s, x, y); }
  g.fillStyle = color; g.fillText(s, x, y);
}
function layer(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
let L = {};
function buildLayers() {
  L.sky = layer(W, H, c => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7fc8ff'); gr.addColorStop(0.55, '#d9c9ff'); gr.addColorStop(1, '#ffd9ec'); c.fillStyle = gr; c.fillRect(0, 0, W, H); });
  const hills = (col, base, amp, k) => layer(2048, 420, c => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 420);
    for (let x = 0; x <= 2048; x += 16) c.lineTo(x, base - amp * Math.sin(x * Math.PI * 2 * k / 2048) - amp * 0.5 * Math.sin(x * Math.PI * 2 * (k * 2 + 1) / 2048 + 1));
    c.lineTo(2048, 420); c.fill();
  });
  L.far = hills('#b9a6f0', 190, 60, 2); L.mid = hills('#8fd98a', 250, 45, 3); L.near = hills('#63c768', 320, 30, 5);
  L.cloud = layer(260, 110, c => { c.fillStyle = 'rgba(255,255,255,.9)'; [[60, 70, 50], [120, 50, 55], [180, 70, 50], [120, 80, 60]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], q[2] * 0.8, 0, 7); c.fill(); }); });
  L.glow = layer(128, 128, c => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,245,170,.9)'); gr.addColorStop(1, 'rgba(255,245,170,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
}
function tile(c, off, y) { const w = c.width; let x = -(((off % w) + w) % w); for (; x < W; x += w) g.drawImage(c, x, y); }
function heart(x, y, s, a) { g.save(); g.globalAlpha = a; g.fillStyle = '#ff5fa2'; g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-14, -6, -6, -16, 0, -7); g.bezierCurveTo(6, -16, 14, -6, 0, 6); g.fill(); g.restore(); }
function padIcon(x, y, which, t) { // ромб кнопок: какая подсвечена ('down' | 'left')
  const pos = { up: [0, -20], right: [20, 0], down: [0, 20], left: [-20, 0] }, pulse = 1 + 0.15 * Math.sin(t * 6);
  g.fillStyle = 'rgba(40,30,80,.55)'; g.beginPath(); g.arc(x, y, 44, 0, 7); g.fill();
  for (const k in pos) { const on = k === which; g.fillStyle = on ? '#ffd83a' : 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x + pos[k][0], y + pos[k][1], on ? 12 * pulse : 9, 0, 7); g.fill(); }
}

// ---------- мир ----------
let S = null, T = 0, scene = 'load', fade = 0, fadeTo = null;
function go(name) { fadeTo = name; }
function reset(name) {
  scene = name; sub = null;
  const al = { x: 200, y: GY, vx: 0, vy: 0, face: 1, ground: true, coyote: 0, buf: 0, walk: 0, safeX: 200, safeY: GY, control: true, bubble: 0 };
  if (name === 'title') S = { al };
  if (name === 'room') {
    al.x = 610; al.control = false;
    S = { al, phase: 0, frame: 0, t: 0, plats: [{ x: -100, y: GY, w: 1500, h: 200 }, { x: 930, y: GY - 85, w: 290, h: 85, bed: true }], walls: [0, W] };
    say('Совушка', TV[0]);
  }
  if (name === 'meadow') {
    S = {
      al, ww: 5400, bridge: 0, bridgeOn: false, falls: 0, met: false, hint: false, idle: 0, end: 0, got: 0, hearts: [], p2: 0,
      isk: { x: 760, y: GY, vy: 0, face: -1, walk: 0 }, bf: { x: 420, y: 380 },
      plats: [{ x: -300, y: GY, w: 2900, h: 300 }, { x: 2920, y: GY, w: 2800, h: 300 },
        { x: 900, y: GY - 55, w: 90, h: 55, stump: 1 }, { x: 1300, y: GY - 55, w: 90, h: 55, stump: 1 },
        { x: 1700, y: GY - 70, w: 380, h: 70, hill: 1 }, { x: 3900, y: GY - 55, w: 90, h: 55, stump: 1 }],
      shrooms: [{ x: 2230, t: 0 }, { x: 3450, t: 0 }],
      stars: [[560, 500], [945, 430], [1345, 430], [1790, 420], [1990, 420], [2280, 300], [2760, 520], [3180, 500], [3500, 290], [4300, 500]].map(p => ({ x: p[0], y: p[1], got: false })),
      shur: { x: 4950, mood: 0 }
    };
    S.bridgeP = { x: 2590, y: GY, w: 340, h: 24, off: true }; S.plats.push(S.bridgeP);
    say('Совушка', 'Алиса уснула… и попала в Радужную страну!');
  }
}
const TV = ['У ёжика Шуршика погасло волшебное яблочко.', 'Чтобы оно снова засияло, нужны три звёздочки.', 'Одна звёздочка спряталась в реке.', 'А ещё одну хранит Тётушка Ночка.'];

function physics(al, inp, dt, plats, minX, maxX) {
  const sp = 270;
  al.vx = al.control ? inp.x * sp : 0; if (al.vx) al.face = Math.sign(al.vx);
  al.coyote -= dt; al.buf -= dt; if (al.control && inp.jumpHit) al.buf = 0.15;
  if (al.buf > 0 && (al.ground || al.coyote > 0)) { al.vy = -730; al.ground = false; al.coyote = 0; al.buf = 0; sfx.jump(); }
  al.vy = Math.min(al.vy + 1850 * dt, 1100);
  const hw = 26, hh = 150;
  // по горизонтали
  let nx = Math.max(minX + hw, Math.min(maxX - hw, al.x + al.vx * dt));
  for (const p of plats) { if (p.off) continue; if (nx + hw > p.x && nx - hw < p.x + p.w && al.y > p.y + 4 && al.y - hh < p.y + p.h) { nx = al.vx > 0 ? p.x - hw : p.x + p.w + hw; } }
  al.x = nx;
  // по вертикали
  let ny = al.y + al.vy * dt; const was = al.ground; al.ground = false;
  for (const p of plats) { if (p.off) continue; if (al.x + hw > p.x && al.x - hw < p.x + p.w && al.vy >= 0 && al.y <= p.y + 4 && ny >= p.y) { ny = p.y; al.vy = 0; al.ground = true; al.on = p; } }
  al.y = ny; if (was && !al.ground && al.vy >= 0) al.coyote = 0.13;
  if (al.ground && al.vx) al.walk += dt * 11; else if (al.ground) al.walk = 0;
}
function drawAlisa(al) {
  if (al.bubble > 0) { g.fillStyle = 'rgba(160,220,255,.45)'; g.beginPath(); g.arc(al.x, al.y - 85, 105, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.stroke(); }
  if (al.sit) return spr('alisa_sit', al.x, al.y + 4, 150, al.face < 0);
  if (!al.ground) return spr('alisa_jump', al.x, al.y, 195, al.face < 0, 0);
  if (al.vx) return spr('alisa_side', al.x, al.y - Math.abs(Math.sin(al.walk)) * 9, 185, al.face < 0, Math.sin(al.walk) * 0.07);
  spr('alisa_front', al.x, al.y, 190, false, 0, 1, 1 + Math.sin(T * 2.5) * 0.012);
}

// ---------- сцены ----------
function updTitle(dt, i1) { if (i1.any) { sfx.chime(); go('room'); } }
function drawTitle(n) {
  g.drawImage(L.sky, 0, 0); tile(L.far, T * 8, 250); tile(L.mid, T * 16, 330); tile(L.near, T * 30, 380);
  spr('castle', 1040, 470, 300); spr('rainbow', 300, 330, 190);
  g.fillStyle = '#63c768'; g.fillRect(0, GY, W, H - GY); for (let x = 0; x < W; x += 420) spr('flowerstrip', x + 200, GY + 40, 110);
  spr('isk_side', 820, GY + 10, 300); spr('alisa_front', 520, GY + 10, 280, false, 0, 1, 1 + Math.sin(T * 2.5) * 0.012);
  spr('butterfly', 670 + Math.sin(T) * 40, 330 + Math.sin(T * 2.3) * 20, 70);
  text('Алиса и Искорка', W / 2, 110, 92, '#fff', 'center', '#d6418f'); text('три звёздочки', W / 2, 195, 54, '#ffe45c', 'center', '#7a4bd1');
  if (Math.sin(T * 4) > -0.3) text('Нажми кнопку', W / 2, 668, 40, '#fff', 'center', '#5a3fb0');
  text(n ? 'Геймпад подключён' : 'Геймпад: нажми любую кнопку (или пробел)', W - 24, 30, 22, n ? '#1d7a36' : '#5a3fb0', 'right');
}

function updRoom(dt, i1) {
  const al = S.al; S.t += dt;
  if (S.phase === 0) {
    al.sit = true; al.face = -1;
    if (i1.any && S.t > 0.6) { S.t = 0; sfx.click(); S.frame++; if (S.frame < TV.length) say('Совушка', TV[S.frame]); else { S.phase = 1; al.sit = false; al.control = true; al.face = 1; say('Мама', 'Алиса, пора спать! Запрыгивай в кроватку.'); } }
  } else if (S.phase === 1) {
    physics(al, i1, dt, S.plats, 20, W - 20);
    if (al.ground && al.on && al.on.bed) { S.phase = 2; S.t = 0; al.control = false; al.sit = true; al.x = 1075; sfx.chime(); say('Мама', 'Спокойной ночи, Алиса.'); }
  } else { physics(al, i1, dt, S.plats, 20, W - 20); if (S.t > 6) go('meadow'); }
}
function drawRoom() {
  const al = S.al, dark = S.phase === 2 ? Math.min(S.t / 2, 1) : 0;
  g.fillStyle = '#ffe3ef'; g.fillRect(0, 0, W, GY); g.fillStyle = '#f7c8dc'; for (let x = 40; x < W; x += 120) g.fillRect(x, 0, 14, GY);
  g.fillStyle = '#c98f5a'; g.fillRect(0, GY, W, H - GY); g.fillStyle = '#b57c49'; g.fillRect(0, GY, W, 10);
  // окно
  g.fillStyle = '#fff'; rr(640, 110, 250, 250, 18); g.fill(); g.fillStyle = '#2b2f77'; rr(655, 125, 220, 220, 10); g.fill();
  g.fillStyle = '#ffeaa0'; g.beginPath(); g.arc(820, 180, 28, 0, 7); g.fill(); g.fillStyle = '#2b2f77'; g.beginPath(); g.arc(808, 172, 26, 0, 7); g.fill();
  g.fillStyle = '#fff'; [[690, 160], [730, 250], [790, 300], [850, 260], [700, 310]].forEach((p, i) => { const s = 2 + Math.sin(T * 3 + i) * 1.2; g.fillRect(p[0], p[1], s, s); });
  g.fillStyle = '#fff'; g.fillRect(760, 125, 10, 220); g.fillRect(655, 230, 220, 10);
  // ковёр
  g.fillStyle = '#ff9ec4'; g.beginPath(); g.ellipse(600, GY + 50, 250, 34, 0, 0, 7); g.fill(); g.fillStyle = '#ffd0e2'; g.beginPath(); g.ellipse(600, GY + 50, 190, 22, 0, 0, 7); g.fill();
  // телевизор
  g.fillStyle = '#8a5a3a'; rr(120, GY - 110, 420, 110, 12); g.fill(); g.fillStyle = '#3b3350'; rr(110, GY - 350, 440, 244, 16); g.fill();
  if (S.phase === 0) { g.drawImage(IMG['tv' + (Math.min(S.frame, 3) + 1)], 126, GY - 336, 408, 204); padIcon(590, GY - 300, 'down', T); }
  else { g.fillStyle = '#16131f'; g.fillRect(126, GY - 336, 408, 204); }
  // кровать
  g.fillStyle = '#9a6a45'; rr(915, GY - 190, 30, 190, 8); g.fill(); rr(1210, GY - 130, 26, 130, 8); g.fill();
  g.fillStyle = '#fff'; rr(930, GY - 85, 290, 85, 14); g.fill(); g.fillStyle = '#b79cff'; rr(930, GY - 60, 290, 60, 12); g.fill();
  g.fillStyle = '#fff3a8'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(970 + i * 55, GY - 30, 7, 0, 7); g.fill(); }
  g.fillStyle = '#ffe0ee'; rr(945, GY - 118, 90, 40, 18); g.fill();
  if (S.phase === 1) { spr('butterfly', 1075 + Math.sin(T * 2) * 30, GY - 250 + Math.sin(T * 3) * 14, 60); if (al.x > 700) padIcon(1075, GY - 360, 'down', T); }
  drawAlisa(al);
  if (dark) {
    g.fillStyle = 'rgba(20,16,70,' + dark * 0.72 + ')'; g.fillRect(0, 0, W, H);
    const k = Math.min(Math.max((S.t - 2) / 2.5, 0), 1), bx = 770 + (al.x - 770) * k, by = 230 + (al.y - 230 - 150) * k + Math.sin(T * 4) * 10;
    if (S.t > 2) { g.drawImage(L.glow, bx - 90, by - 120, 180, 180); spr('butterfly', bx, by, 64); }
    for (let i = 0; i < 40 * Math.max(0, (S.t - 3.5) / 2.5); i++) { const a = i * 2.4 + T, r = 30 + i * 9; g.fillStyle = 'rgba(255,240,160,.9)'; g.fillRect(al.x + Math.cos(a) * r, al.y - 90 + Math.sin(a) * r * 0.6, 4, 4); }
  }
}

function updMeadow(dt, i1, i2) {
  const al = S.al, isk = S.isk;
  if (S.end > 0) { S.end += dt; al.control = false; }
  physics(al, i1, dt, S.plats, 30, S.ww - 30);
  if (al.bubble > 0) al.bubble -= dt;
  if (al.ground && al.on && !al.on.stump) { if ((al.x < 2540 || al.x > 2980 || S.bridgeOn)) { al.safeX = al.x; al.safeY = al.y; } }
  if (al.y > H + 40) { S.falls++; sfx.plop(); al.x = al.safeX < 2760 ? Math.min(al.safeX, 2500) : Math.max(al.safeX, 3020); al.y = GY - 120; al.vy = 0; al.bubble = 1.2; if (S.falls >= 2 && !S.bridgeOn) callBridge(true); else if (!S.bridgeOn) say('Искорка', 'Ой! Позови меня, я нарисую мостик!'); }
  // грибы-батуты
  for (const m of S.shrooms) { m.t = Math.max(0, m.t - dt * 3); if (al.vy > 0 && Math.abs(al.x - m.x) < 62 && al.y > GY - 62 && al.y < GY - 20) { al.vy = -1060; al.ground = false; m.t = 1; sfx.boing(); } }
  // искорки
  for (const s of S.stars) if (!s.got && Math.abs(al.x - s.x) < 52 && Math.abs(al.y - 80 - s.y) < 90) { s.got = true; S.got++; sfx.star(); }
  // встреча с Искоркой
  if (!S.met && Math.abs(al.x - isk.x) < 170) { S.met = true; sfx.chime(); for (let i = 0; i < 6; i++) S.hearts.push({ x: (al.x + isk.x) / 2 + (i - 3) * 22, y: GY - 200, t: i * 0.12 }); say('Искорка', 'Привет, Алиса! Я Искорка. Побежали вместе!'); }
  // подсказка у ручья
  if (!S.hint && !S.bridgeOn && al.x > 2330) { S.hint = true; say('Искорка', 'Ручей широкий. Позови меня, я нарисую мостик!'); }
  if (i1.actHit && al.control && S.met) { if (!S.bridgeOn && al.x > 2150 && al.x < 2700) callBridge(); else { sfx.star(); for (let i = 0; i < 4; i++) S.hearts.push({ x: isk.x + (i - 2) * 24, y: isk.y - 210, t: i * 0.1 }); } }
  if (S.bridgeOn && S.bridge < 1) { S.bridge = Math.min(1, S.bridge + dt * 0.9); if (S.bridge >= 1) S.bridgeP.off = false; }
  // Искорка: идёт следом или ею управляет второй игрок
  if (i2.x || i2.jump) S.p2 = 12; else S.p2 -= dt;
  let tx = isk.x;
  if (S.met) {
    if (S.p2 > 0) tx = isk.x + i2.x * 100; else if (S.bridgeOn && S.bridge < 1) tx = 2530; else tx = al.x - 120 * al.face;
    if (S.p2 > 0 && i2.jumpHit && isk.y >= GY) { isk.vy = -620; sfx.jump(); }
    if (!S.bridgeP.off || S.bridge < 1) { if (isk.x <= 2560) tx = Math.min(tx, 2540); else tx = Math.max(tx, 2990); if (!S.bridgeP.off && true) tx = isk.x <= 2560 ? Math.min(tx, 2540) : Math.max(tx, 2990); }
    if (!S.bridgeP.off) tx = S.p2 > 0 ? isk.x + i2.x * 100 : al.x - 120 * al.face;
    if (S.bridgeP.off && isk.x <= 2560 && al.x > 2990) tx = 2540;
    tx = Math.max(60, Math.min(S.ww - 60, tx));
    const d = tx - isk.x, v = Math.sign(d) * Math.min(Math.abs(d) * 4, 330);
    if (Math.abs(d) > 6) { isk.x += v * dt; isk.face = Math.sign(d); isk.walk += dt * 10; } else { isk.walk = 0; if (S.p2 <= 0) isk.face = al.x > isk.x ? 1 : -1; }
  }
  isk.vy += 1700 * dt; isk.y = Math.min(GY, isk.y + isk.vy * dt); if (isk.y >= GY) isk.vy = 0;
  // бабочка-проводник
  S.idle = (al.vx || !al.ground) ? 0 : S.idle + dt;
  let bx = Math.min(al.x + (S.idle > 10 ? 110 : 280), S.bridgeOn ? 4640 : 2760), by = 360 + Math.sin(T * 2.2) * 30;
  S.bf.x += (bx - S.bf.x) * Math.min(1, dt * 2); S.bf.y += (by - S.bf.y) * Math.min(1, dt * 2);
  for (const h of S.hearts) h.t += dt; S.hearts = S.hearts.filter(h => h.t < 2);
  // Шуршик
  if (!S.end && al.x > S.shur.x - 260) { S.end = 0.01; al.face = 1; say('Шуршик', 'Моё яблочко погасло… Ему нужны три звёздочки.'); }
  if (S.end > 6 && S.shur.mood === 0) { S.shur.mood = 1; say('Алиса', 'Не грусти, Шуршик! Мы найдём звёздочки!'); }
  if (S.end > 10.5 && S.shur.mood === 1) { S.shur.mood = 2; sfx.chime(); say('Шуршик', 'Ура! Спасибо, Алиса!'); }
  if (S.end > 15 && i1.any) go('title');
}
function callBridge(auto) { S.bridgeOn = true; sfx.chime(); say('Искорка', auto ? 'Я помогу! Вот тебе радужный мостик.' : 'Радужный мостик готов!'); }
function drawMeadow() {
  const al = S.al, cam = Math.max(0, Math.min(S.ww - W, al.x - 520)); S.cam = cam;
  g.drawImage(L.sky, 0, 0);
  for (let i = 0; i < 5; i++) g.drawImage(L.cloud, ((i * 520 - cam * 0.08 + T * 6) % 2600 + 2600) % 2600 - 300, 40 + (i % 3) * 55);
  spr('castle', 1650 - cam * 0.12, 395, 250); spr('rainbow', 520 - cam * 0.12, 300, 170);
  tile(L.far, cam * 0.15, 210); tile(L.mid, cam * 0.35, 300); tile(L.near, cam * 0.6, 340);
  g.save(); g.translate(-Math.round(cam), 0);
  // вода
  g.fillStyle = '#58c7f2'; g.fillRect(2600, GY + 26, 320, 200); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4;
  for (let i = 0; i < 3; i++) { g.beginPath(); for (let x = 2600; x <= 2920; x += 20) g.lineTo(x, GY + 44 + i * 30 + Math.sin(x * 0.05 + T * 2 + i) * 5); g.stroke(); }
  // земля и платформы
  for (const p of S.plats) {
    if (p === S.bridgeP || p.x + p.w < cam - 50 || p.x > cam + W + 50) continue;
    if (p.stump) { g.fillStyle = '#a8703f'; rr(p.x, p.y, p.w, p.h + 6, 10); g.fill(); g.fillStyle = '#e8c08a'; g.beginPath(); g.ellipse(p.x + p.w / 2, p.y + 6, p.w / 2, 10, 0, 0, 7); g.fill(); g.strokeStyle = '#c99a62'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x + p.w / 2, p.y + 6, p.w / 4, 5, 0, 0, 7); g.stroke(); }
    else { g.fillStyle = '#b9834c'; rr(p.x, p.y, p.w, p.h + 20, 26); g.fill(); g.fillStyle = '#58c44e'; rr(p.x, p.y, p.w, 34, 17); g.fill(); g.fillStyle = '#8be06c'; rr(p.x + 6, p.y + 3, p.w - 12, 10, 5); g.fill(); }
  }
  for (let x = 150; x < S.ww; x += 610) if ((x < 2350 || x > 3150) && x > cam - 300 && x < cam + W + 300) spr('flowerstrip', x, GY + 12, 80);
  // радужный мостик
  if (S.bridge > 0) { const cols = ['#ff5f6d', '#ffa64d', '#ffe45c', '#6fdc6f', '#5cc8ff', '#b388ff'], x0 = 2590, x1 = 2590 + 340 * S.bridge; cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 7; g.beginPath(); g.moveTo(x0, GY - 14 + i * 6); g.quadraticCurveTo((x0 + x1) / 2, GY - 34 + i * 6, x1, GY - 14 + i * 6); g.stroke(); }); }
  // грибы
  for (const m of S.shrooms) { const sq = 1 - m.t * 0.35; g.fillStyle = '#fff6e6'; rr(m.x - 20, GY - 40, 40, 44, 10); g.fill(); g.fillStyle = '#ff5f6d'; g.beginPath(); g.ellipse(m.x, GY - 40, 66, 34 * sq, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; [[-30, -52], [0, -62], [30, -52]].forEach(q => { g.beginPath(); g.arc(m.x + q[0], GY + q[1] * sq + (1 - sq) * -40, 8, 0, 7); g.fill(); }); }
  // искорки
  for (const s of S.stars) if (!s.got && s.x > cam - 60 && s.x < cam + W + 60) { const y = s.y + Math.sin(T * 3 + s.x) * 8; g.drawImage(L.glow, s.x - 46, y - 46, 92, 92); spr('star', s.x, y + 24, 48, false, Math.sin(T * 2 + s.x) * 0.2); }
  // Шуршик
  const sh = S.shur; if (sh.mood < 2) { spr('shur_apple', sh.x, GY + 6, 150, false, 0, 1, 1 + Math.sin(T * 2) * 0.01); } else { g.drawImage(L.glow, sh.x - 130, GY - 190, 260, 260); spr('shur_happy', sh.x, GY + 6 - Math.abs(Math.sin(T * 6)) * 14, 140); }
  if (S.end > 1.5 && sh.mood < 2) { // облачко-мысль
    g.fillStyle = 'rgba(255,255,255,.95)'; rr(sh.x - 190, GY - 400, 300, 170, 60); g.fill(); g.beginPath(); g.arc(sh.x - 20, GY - 205, 14, 0, 7); g.fill(); g.beginPath(); g.arc(sh.x - 5, GY - 180, 8, 0, 7); g.fill();
    spr('apple', sh.x - 40, GY - 305, 70); for (let i = 0; i < 3; i++) { g.globalAlpha = 0.55 + 0.45 * Math.sin(T * 4 + i); spr('star', sh.x - 110 + i * 70, GY - 245, 50); } g.globalAlpha = 1;
  }
  // Искорка, бабочка, Алиса
  const isk = S.isk; spr('isk_side', isk.x, isk.y + 6 - Math.abs(Math.sin(isk.walk)) * 10, 210, isk.face < 0, Math.sin(isk.walk) * 0.04);
  if (S.bridgeOn && S.bridge < 1) g.drawImage(L.glow, isk.x + 20, isk.y - 250, 120, 120);
  if (S.hint && !S.bridgeOn && al.x > 2150) padIcon(isk.x, isk.y - 270, 'left', T);
  if (S.p2 > 0) text('2', isk.x, isk.y - 235, 30, '#fff', 'center', '#7a4bd1');
  drawAlisa(al);
  spr('butterfly', S.bf.x, S.bf.y, 58, false, Math.sin(T * 9) * 0.12, 1 - 0.25 * Math.abs(Math.sin(T * 9)));
  for (const h of S.hearts) if (h.t > 0) heart(h.x, h.y - h.t * 60, 1.6, Math.max(0, 1 - h.t / 2));
  g.restore();
  // HUD
  for (let i = 0; i < 3; i++) { g.globalAlpha = 0.35; spr('star', 60 + i * 66, 84, 58); g.globalAlpha = 1; }
  spr('star', W - 130, 78, 46); text(S.got + '', W - 70, 56, 40, '#fff', 'center', '#b0731a');
  if (S.end > 13) {
    g.fillStyle = 'rgba(60,40,140,' + Math.min((S.end - 13) / 1.5, 0.7) + ')'; g.fillRect(0, 0, W, H);
    text('Продолжение следует…', W / 2, 290, 72, '#fff', 'center', '#d6418f'); text('Искорок собрано: ' + S.got + ' из 10', W / 2, 390, 42, '#ffe45c', 'center', '#5a3fb0');
    if (S.end > 15 && Math.sin(T * 4) > -0.3) text('Нажми кнопку', W / 2, 500, 36, '#fff', 'center', '#5a3fb0');
  }
}
function drawSub(dt) {
  if (!sub) return; sub.t -= dt; if (sub.t <= 0) { sub = null; return; }
  g.font = '700 30px "Trebuchet MS","Segoe UI",Roboto,Arial,sans-serif'; const w = Math.min(1100, Math.max(360, g.measureText(sub.text).width + 80));
  g.fillStyle = 'rgba(255,255,255,.93)'; rr(W / 2 - w / 2, H - 112, w, 84, 28); g.fill(); g.strokeStyle = '#b79cff'; g.lineWidth = 4; g.stroke();
  text(sub.who, W / 2 - w / 2 + 34, H - 112, 22, '#fff', 'left', '#7a4bd1'); text(sub.text, W / 2, H - 66, 30, '#3b2a6b');
}

// ---------- цикл ----------
let last = 0;
function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016); last = ts; T += dt;
  const [i1, i2, n] = readInput();
  if (fadeTo) { fade = Math.min(1, fade + dt * 2.2); if (fade >= 1) { reset(fadeTo); fadeTo = null; } }
  else { fade = Math.max(0, fade - dt * 2.2); if (scene === 'title') updTitle(dt, i1); else if (scene === 'room') updRoom(dt, i1); else if (scene === 'meadow') updMeadow(dt, i1, i2); }
  if (scene === 'title') drawTitle(n); else if (scene === 'room') drawRoom(); else if (scene === 'meadow') drawMeadow();
  drawSub(dt);
  if (fade > 0) { g.fillStyle = 'rgba(255,255,255,' + fade + ')'; g.fillRect(0, 0, W, H); }
  requestAnimationFrame(frame);
}
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
addEventListener('resize', fit); fit();
loadAll(() => { buildLayers(); reset('title'); requestAnimationFrame(frame); });
window.__dbg = { get S() { return S; }, reset, go, keys };
