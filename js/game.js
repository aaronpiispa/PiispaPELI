// PiispanPELI · Game flow, modes, wardrobe, themes, achievements, trophies, saving and effects.
'use strict';

// ------------------------------ game flow ------------------------------
function spawnWeights() {
  // the further you get, the bigger the balls you are offered
  const top = Math.min(SPAWN_W.length - 1, Math.max(4, maxLevel - 3));
  const p = clamp((maxLevel - 4) / 8, 0, 1);
  return SPAWN_W.map((w, i) => i > top ? 0 : w * (1 + p * i * 0.6));
}
function randLevel() {
  const w = spawnWeights();
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}

// ======================= game modes =======================
let gmode = 'classic', modeT = 0, shots = 0, missionIdx = -1, gotLevels = new Set(), playT = 0, oneBtnT = 0, mergesThisGame = 0, gravT = 0, gravI = 0, failT = 0, endReason = 'over';
const TIME_LIMIT = 120;
const MODE_INFO = {
  classic: { name: 'Klassinen', desc: 'Peruspeli. Peli päättyy, kun pallot koskettavat molempia nappeja.' },
  time: { name: 'Aikahaaste', desc: 'Kaksi minuuttia aikaa kerätä mahdollisimman paljon pisteitä. Nappeihin ei voi hävitä.', noLose: true },
  daily: { name: 'Päivän haaste', desc: 'Joka päivä sama pallojärjestys kaikille. Saa Ranska mahdollisimman vähillä laukauksilla.' },
  zen: { name: 'Zen', desc: 'Ei häviämistä eikä kiirettä. Pelkkää löllyä ja musiikkia.', noLose: true },
  gravity: { name: 'Painovoima', desc: 'Painovoiman suunta vaihtuu välillä, ja kasa liukuu sivuille.' },
  map: { name: 'Tehtäväkartta', desc: 'Matkaa Euroopan halki. Jokainen maa on oma tehtävänsä.' }
};
const MISSIONS = [
  { c: 0, text: 'Saa Irlanti 15 laukauksella', level: 2, shots: 15 },
  { c: 1, text: 'Saa Unkari 30 laukauksella', level: 4, shots: 30 },
  { c: 2, text: 'Kerää 2 000 pistettä minuutissa', score: 2000, time: 60 },
  { c: 3, text: 'Saa Romania 40 laukauksella', level: 5, shots: 40 },
  { c: 4, text: 'Tee kombo ×4', combo: 4 },
  { c: 5, text: 'Saa Italia 55 laukauksella', level: 6, shots: 55 },
  { c: 6, text: 'Kerää 6 000 pistettä 90 sekunnissa', score: 6000, time: 90 },
  { c: 7, text: 'Saa Suomi', level: 7 },
  { c: 8, text: 'Saa Saksa 140 laukauksella', level: 8, shots: 140 },
  { c: 9, text: 'Saa Ruotsi', level: 9 },
  { c: 10, text: 'Saa Ranska', level: 10 }
];
const GRAVS = [[0, GRAV, 'alas'], [-15, GRAV * 0.8, 'vasemmalle'], [0, GRAV * 0.45, 'kevyt'], [15, GRAV * 0.8, 'oikealle'], [0, GRAV * 1.5, 'raskas']];
// the daily challenge changes every day at 15:00 Finnish time
function fiParts(ms) {
  try {
    const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms)).forEach(x => { p[x.type] = +x.value; });
    return p;
  } catch (e) { const d = new Date(ms + 2 * 3600e3); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() }; }
}
function todayKey() { const p = fiParts(Date.now() - 15 * 3600e3); return (p.year * 10000 + p.month * 100 + p.day) * 10 + 5; }
function dailyLeft() {
  const p = fiParts(Date.now()), since = ((p.hour * 60 + p.minute) - 900 + 1440) % 1440, left = 1440 - since;
  return Math.floor(left / 60) + ' h ' + (left % 60) + ' min';
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = Math.random;
const mapDone = () => Number(store.get('piispanpeli-map', 0)) || 0;
function modeBest(m) { return Number(store.get('piispanpeli-best-' + m, 0)) || 0; }

// ======================= wardrobe for the mascot =======================
const WARDROBE = {
  hat: [['bonnet', 'Satiinimyssy'], ['none', 'Ei hattua'], ['cap', 'Lippis', 'first'], ['beanie', 'Suomi-pipo', 'fin'], ['beret', 'Baskeri', 'fra'],
    ['ushanka', 'Karvalakki', 'rus'], ['viking', 'Viikinkikypärä', 'nordic'], ['crown', 'Kruunu', 'mapAll'], ['wings', 'Hermeksen siivet', 'union'], ['party', 'Juhlahattu', 's10k'],
    ['tophat', 'Silinteri', 's100k'], ['heart', 'Sydänpanta', 'heart'], ['halo', 'Sädekehä', 'zen5']],
  glasses: [['none', 'Ei laseja'], ['sun', 'Aurinkolasit', 'combo5'], ['round', 'Pyöreät lasit', 'marathon'], ['star', 'Tähtilasit', 'star'],
    ['heart', 'Sydänlasit', 'nelli'], ['mono', 'Monokkeli', 'daily']],
  neck: [['chain', 'Kultaketju'], ['none', 'Ei mitään'], ['scarf', 'Kaulahuivi', 'games50'], ['bowtie', 'Rusetti', 'map3'], ['pearls', 'Helmet', 'time5k'], ['medal', 'Mitali', 'all']],
  ball: [['plain', 'Tavalliset reunat'], ['gold', 'Kultareunat', 'union']]
};
const SLOT_NAMES = { hat: 'Hattu', glasses: 'Lasit', neck: 'Kaula', ball: 'Pallot' };

// ======================= wagon themes, unlocked by achievements =======================
const THEMES = [
  { id: 'eu', name: 'EU-juna', ach: null, label: 'PIISPAN EXPRESS  ·  EU 2026', wall: ['#2d5fc4', '#4d82e8', '#1d438f'], body: 'rgba(40,85,190,0.24)', beam: ['#3a6fd8', '#15357c'],
    rivet: '#ffd84d', stripe: '#ffcc00', text: '#ffe27a', btn: '#d62839', stake: 'rgba(10,22,60,0.35)', bg: ['EXPRESS', '#e01e37', '#0b0b0b'] },
  { id: 'viking', name: 'Viikinki', ach: 'nordic', label: 'PIISPAN DRAKKAR  ·  ᚠᚢᚦᚨᚱᚲ', wall: ['#5a3a1e', '#9a6a3a', '#3e2612'], body: 'rgba(120,78,40,0.3)', beam: ['#7a4e28', '#3a2410'],
    rivet: '#cfd5de', stripe: '#b8323a', text: '#f3dfb8', btn: '#b8323a', stake: 'rgba(40,22,8,0.45)', bg: ['DRAKKAR', '#d9a441', '#2a1608'] },
  { id: 'heart', name: 'Sydän', ach: 'heart', label: 'PIISPAN  ♥  EXPRESS', wall: ['#c23a6e', '#ff7aa8', '#94204f'], body: 'rgba(255,110,165,0.22)', beam: ['#ff6f9f', '#a0244f'],
    rivet: '#ffffff', stripe: '#ffd1e0', text: '#fff0f5', btn: '#ff3d7a', stake: 'rgba(120,20,60,0.3)', bg: ['♥', '#ff4d8d', '#4a0a26'] },
  { id: 'uni', name: 'Korkeakoulu', ach: 'map3', label: 'PIISPAN AKATEMIA  ·  EST. 2026', wall: ['#4a3322', '#7a5638', '#2e1f14'], body: 'rgba(22,58,42,0.62)', beam: ['#1f4a3a', '#0f2a20'],
    rivet: '#d4af37', stripe: '#d4af37', text: '#f3e7c4', btn: '#8b1a2a', stake: 'rgba(60,40,24,0.55)', bg: ['AKATEMIA', '#e2bd48', '#0f3324'] }
];
let themeId = store.get('piispanpeli-theme', 'eu');
const themeOpen = t => !t.ach || !!achGot[t.ach];
function theme() { const t = THEMES.find(x => x.id === themeId); return t && themeOpen(t) ? t : THEMES[0]; }
let look = Object.assign({ hat: 'bonnet', glasses: 'none', neck: 'chain', ball: 'plain' }, store.get('piispanpeli-look', {}) || {});
const goldBalls = () => look.ball === 'gold' && !!achGot.union;
function showWardrobe() {
  let html = '<h2 class="h2">' + T('Hahmo') + '</h2><canvas class="mascot big" width="240" height="240" aria-hidden="true"></canvas>';
  for (const slot of ['hat', 'glasses', 'neck', 'ball']) {
    html += `<h3 class="wtitle">${SLOT_NAMES[slot]}</h3><div class="wgrid">` + WARDROBE[slot].map(([id, name, ach]) => {
      const open = !ach || achGot[ach], on = look[slot] === id, a = ach && ACH.find(x => x[0] === ach);
      return `<button class="witem${on ? ' on' : ''}${open ? '' : ' locked'}" type="button" data-slot="${slot}" data-item="${id}"${open ? '' : ' disabled'} title="${open ? name : T('Avautuu saavutuksesta: {0}', a ? a[1] : '')}">` +
        `<b>${name}</b><small>${open ? T(on ? 'Käytössä' : 'Valitse') : T('Saavutus: {0}', a && a[3] === 'secret' ? '???' : a ? a[1] : '')}</small></button>`;
    }).join('') + '</div>';
  }
  showOverlay(html + '<div class="row" style="margin-top:14px"><button class="btn" id="backMenu" type="button">' + T('Valmis') + '</button></div>');
  cardMascot = card.querySelector('.mascot.big');
}

// ======================= achievements =======================
// ---- every achievement has its own trophy: [shape, colour, emblem] ----
const TCOL = { gold: ['#ffd84d', '#a07800'], silver: ['#e6ebf3', '#7d869c'], rose: ['#ff9fbb', '#b0405f'], teal: ['#62e3c9', '#1f8a74'],
  blue: ['#7fb0ff', '#2a4fa0'], red: ['#ff6b6b', '#9e1f1f'], purple: ['#c9a2ff', '#5e3aa8'], black: ['#5a6078', '#15182a'] };
const TDES = {
  first: ['medal', 'gold', 't:1'], fin: ['shield', 'blue', 'f:7'], nordic: ['crown', 'silver', 'f:9'], fra: ['cup', 'blue', 'f:10'],
  rus: ['gem', 'red', 'f:14'], union: ['shield', 'purple', 't:H'], all: ['cup', 'gold', 't:15'], combo5: ['star', 'gold', 't:×5'],
  combo10: ['star', 'purple', 't:×10'], star: ['medal', 'silver', 'star'], heart: ['medal', 'rose', 'heart'], close: ['shield', 'red', 't:!'],
  merges100: ['plaque', 'teal', 't:100'], s10k: ['cup', 'silver', 't:10k'], s100k: ['cup', 'gold', 't:100k'], shake: ['medal', 'teal', 't:≈'],
  marathon: ['plaque', 'blue', 't:30m'], games50: ['plaque', 'gold', 't:50'], time5k: ['medal', 'blue', 't:2:00'], time15k: ['star', 'red', 't:15k'],
  daily: ['shield', 'gold', 't:24h'], daily60: ['shield', 'silver', 't:60'], zen5: ['gem', 'teal', 't:zen'], grav: ['gem', 'purple', 't:g'],
  map3: ['plaque', 'silver', 't:3'], mapAll: ['crown', 'purple', 't:EU'], nelli: ['heart', 'rose', 't:N'], admin: ['shield', 'black', 't:#'],
  quiet: ['medal', 'black', 't:zZ']
};
function starPath(c, x, y, r1, r2) { c.beginPath(); for (let p = 0; p < 10; p++) { const r = p % 2 ? r2 : r1, a = -Math.PI / 2 + p * Math.PI / 5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
function drawTrophyOn(c, id, x, y, s) {
  // draws the trophy for achievement `id`, roughly s units tall, centred at (x, y)
  const [shape, col, emb] = TDES[id] || ['cup', 'gold', ''], [fc, sc] = TCOL[col];
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineWidth = 0.06;
  const g = c.createLinearGradient(-0.5, -0.5, 0.5, 0.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, fc); g.addColorStop(1, sc);
  c.fillStyle = g; c.strokeStyle = sc;
  let ex = 0, ey = -0.08, er = 0.22;
  if (shape === 'cup') {
    c.beginPath(); c.moveTo(-0.36, -0.45); c.lineTo(0.36, -0.45); c.quadraticCurveTo(0.36, 0.12, 0, 0.12); c.quadraticCurveTo(-0.36, 0.12, -0.36, -0.45); c.fill(); c.stroke();
    c.beginPath(); c.arc(-0.38, -0.25, 0.14, Math.PI * 0.5, Math.PI * 1.5); c.moveTo(0.38, -0.39); c.arc(0.38, -0.25, 0.14, -Math.PI * 0.5, Math.PI * 0.5); c.lineWidth = 0.07; c.stroke();
    c.fillRect(-0.06, 0.12, 0.12, 0.2); c.fillRect(-0.24, 0.32, 0.48, 0.12); c.strokeRect(-0.24, 0.32, 0.48, 0.12); ey = -0.2; er = 0.18;
  } else if (shape === 'medal') {
    c.fillStyle = '#d94a5c'; c.beginPath(); c.moveTo(-0.22, -0.5); c.lineTo(-0.02, -0.08); c.lineTo(0.08, -0.12); c.lineTo(-0.08, -0.5); c.fill();
    c.fillStyle = '#3a6fd8'; c.beginPath(); c.moveTo(0.22, -0.5); c.lineTo(0.02, -0.08); c.lineTo(-0.08, -0.12); c.lineTo(0.08, -0.5); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(0, 0.12, 0.32, 0, TAU); c.fill(); c.stroke(); ey = 0.12; er = 0.23;
  } else if (shape === 'star') {
    starPath(c, 0, 0, 0.5, 0.23); c.fill(); c.stroke(); ey = 0.02; er = 0.18;
  } else if (shape === 'shield') {
    c.beginPath(); c.moveTo(0, -0.48); c.lineTo(0.4, -0.34); c.lineTo(0.36, 0.08); c.quadraticCurveTo(0.3, 0.38, 0, 0.5); c.quadraticCurveTo(-0.3, 0.38, -0.36, 0.08); c.lineTo(-0.4, -0.34); c.closePath(); c.fill(); c.stroke(); ey = 0; er = 0.23;
  } else if (shape === 'crown') {
    c.beginPath(); c.moveTo(-0.45, 0.3); c.lineTo(-0.45, -0.3); c.lineTo(-0.22, -0.05); c.lineTo(0, -0.42); c.lineTo(0.22, -0.05); c.lineTo(0.45, -0.3); c.lineTo(0.45, 0.3); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff4d6d'; for (const px of [-0.45, 0, 0.45]) { c.beginPath(); c.arc(px, px ? -0.33 : -0.45, 0.06, 0, TAU); c.fill(); }
    ey = 0.1; er = 0.17;
  } else if (shape === 'gem') {
    c.beginPath(); c.moveTo(-0.3, -0.36); c.lineTo(0.3, -0.36); c.lineTo(0.46, -0.1); c.lineTo(0, 0.48); c.lineTo(-0.46, -0.1); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-0.46, -0.1); c.lineTo(0.46, -0.1); c.moveTo(-0.12, -0.36); c.lineTo(0, 0.48); c.lineTo(0.12, -0.36); c.stroke(); ey = -0.04; er = 0.16;
  } else if (shape === 'plaque') {
    c.beginPath(); c.roundRect ? c.roundRect(-0.42, -0.42, 0.84, 0.7, 0.1) : c.rect(-0.42, -0.42, 0.84, 0.7); c.fill(); c.stroke();
    c.fillStyle = sc; c.fillRect(-0.18, 0.28, 0.36, 0.08); c.fillRect(-0.3, 0.36, 0.6, 0.1); ey = -0.07; er = 0.24;
  } else if (shape === 'heart') {
    heartPath(c, 0, 0.12, 0.62); c.fill(); c.stroke(); ey = -0.06; er = 0.18;
  }
  // emblem
  if (emb.startsWith('f:')) {
    c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip(); c.translate(ex, ey);
    const keep = ctx; ctx = c; drawFlag(Number(emb.slice(2)), er * 1.3); ctx = keep; c.restore();
    c.lineWidth = 0.04; c.strokeStyle = sc; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.stroke();
  } else if (emb === 'star') { c.fillStyle = '#fff'; starPath(c, ex, ey, er * 0.9, er * 0.4); c.fill(); }
  else if (emb === 'heart') { c.fillStyle = '#e01e37'; heartPath(c, ex, ey + er * 0.3, er * 1.05); c.fill(); }
  else if (emb === 'eu') { c.fillStyle = '#ffcc00'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; starPath(c, ex + Math.cos(a) * er * 0.85, ey + Math.sin(a) * er * 0.85, 0.05, 0.022); c.fill(); } c.fillStyle = '#123072'; c.beginPath(); c.arc(ex, ey, er * 0.55, 0, TAU); c.fill(); }
  else if (emb.startsWith('t:')) {
    const t = emb.slice(2), fs = t.length > 3 ? 0.2 : t.length > 2 ? 0.25 : 0.32;
    c.font = `800 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 0.07; c.strokeStyle = sc; c.strokeText(t, ex, ey + 0.01); c.fillStyle = '#fff'; c.fillText(t, ex, ey + 0.01);
  }
  // shine
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-0.18, -0.22, 0.05, 0.12, 0.4, 0, TAU); c.fill();
  c.restore();
}
const trophyImgCache = {};
function trophyImg(id, locked) {
  const key = id + (locked ? '-l' : '');
  if (trophyImgCache[key]) return trophyImgCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const c = cv.getContext('2d');
  c.setTransform(96, 0, 0, 96, 48, 48);
  if (locked) { c.globalAlpha = 0.25; c.filter = 'grayscale(1)'; }
  drawTrophyOn(c, id, 0, 0, 0.9);
  return (trophyImgCache[key] = cv.toDataURL());
}
// trophy shelf on the wagon's back wall, either side of the launcher
// trophy shelves at the bottom of the wagon's back wall; trophies can be grabbed and thrown
const SHELF_N = 15, SHELF_ROWS = [FLOOR_Y - 0.5, FLOOR_Y - 1.5], TROPHY_S = 0.62, TROPHY_R = 0.3;
function shelfPos(i) {
  const row = Math.floor(i / SHELF_N), col = i % SHELF_N;
  return [0.5 + col * (WORLD_W - 1) / (SHELF_N - 1), SHELF_ROWS[Math.min(row, SHELF_ROWS.length - 1)] - 0.04];
}
const TOBJ = {};   // id -> { x, y, vx, vy, a, va, st: 'held'|'fly'|'home', t, rest, tx, ty, hx, hy }
let heldTrophy = null;
function activeTrophies() { return Object.keys(TOBJ); }
function trophyPhys() {
  const ids = activeTrophies();
  if (!ids.length) return;
  for (const id of ids) {
    const o = TOBJ[id];
    if (o.st === 'home') continue;
    if (o.st === 'held') {
      const nx = o.x + (o.tx - o.x) * 0.35, ny = o.y + (o.ty - o.y) * 0.35;
      o.vx = (nx - o.x) / H; o.vy = (ny - o.y) / H; o.x = nx; o.y = ny;
      o.va = o.va * 0.98 + o.vx * 0.02;
    } else {
      o.vx += E.gx * 0.7 * H; o.vy += E.gy * 0.7 * H;
      o.x += o.vx * H; o.y += o.vy * H;
    }
    o.a += o.va * H;
    // wagon walls and floor
    const fw = funnelAt(o.y), x0 = TROPHY_R - fw, x1 = WORLD_W - TROPHY_R + fw, ymax = FLOOR_Y - TROPHY_R;
    if (o.y > -0.5) {
      if (o.x < x0) { o.x = x0; if (o.vx < 0) o.vx *= -0.5; }
      if (o.x > x1) { o.x = x1; if (o.vx > 0) o.vx *= -0.5; }
    }
    if (o.y > ymax) { o.y = ymax; if (o.vy > 0) { o.vy *= -0.35; o.vx *= 0.9; o.va = o.vx / TROPHY_R; } }
  }
}
E.hook = trophyPhys;
if (/debug/.test(location.hash)) window.__piispanDebug = { shelfPos, TOBJ, view: () => ({ OX, OY, SC }), setDep: (a, b) => { tgtL = a; tgtR = b; } };
function trophyStep() {
  for (const id of activeTrophies()) {
    const o = TOBJ[id]; o.t += STEP;
    if (o.st === 'fly') {
      const sp = Math.hypot(o.vx, o.vy);
      o.rest = sp < 0.6 ? o.rest + STEP : 0;
      if (o.rest > 1.2 || o.t > 9 || o.y < -6 || o.y > FLOOR_Y + 3) { o.st = 'home'; o.t = 0; o.sx = o.x; o.sy = o.y; o.sa = o.a; }
    } else if (o.st === 'home') {
      const u = Math.min(1, o.t / 0.7), e = u * u * (3 - 2 * u);
      o.x = o.sx + (o.hx - o.sx) * e; o.y = o.sy + (o.hy - o.sy) * e - Math.sin(u * Math.PI) * 1.2; o.a = o.sa * (1 - e);
      if (u >= 1) delete TOBJ[id];
    }
  }
}
function insideAnyBlob(px, py) {
  for (const b of E.blobs) {
    const s = b.start, n = b.n;
    if (Math.abs(b.cx - px) > b.R * 1.6 || Math.abs(b.cy - py) > b.R * 1.6) continue;
    let inside = false;
    for (let k = 0, m = n - 1; k < n; m = k++) {
      const yi = Y[s + k], yj = Y[s + m];
      if ((yi > py) !== (yj > py) && px < (X[s + m] - X[s + k]) * (py - yi) / (yj - yi) + X[s + k]) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}
function pickTrophy(wx, wy) {
  let best = null, bd = 0.62;
  ACH.forEach((a, i) => {
    if (!achGot[a[0]] || TOBJ[a[0]]) return;
    const [x, y] = shelfPos(i), d = Math.hypot(wx - x, wy - y);
    if (d < bd) { bd = d; best = [a[0], x, y]; }
  });
  if (!best || insideAnyBlob(wx, wy)) return null;
  const [id, x, y] = best;
  TOBJ[id] = { x, y, vx: 0, vy: 0, a: 0, va: 0, st: 'held', t: 0, rest: 0, tx: wx, ty: wy, hx: x, hy: y };
  return id;
}
function drawTrophyWall() {
  // shelf boards
  for (const y of SHELF_ROWS) {
    ctx.fillStyle = 'rgba(8,16,40,0.55)'; ctx.fillRect(0.1, y + 0.3, WORLD_W - 0.2, 0.12);
    ctx.fillStyle = 'rgba(255,214,90,0.35)'; ctx.fillRect(0.1, y + 0.28, WORLD_W - 0.2, 0.04);
    ctx.fillStyle = 'rgba(8,16,40,0.45)'; for (let x = 1; x < WORLD_W; x += 2.5) ctx.fillRect(x, y + 0.42, 0.08, 0.2);
  }
  const now = Date.now();
  ACH.forEach((a, i) => {
    const [x, y] = shelfPos(i), got = achGot[a[0]];
    if (!got) { ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.arc(x, y, 0.2, 0, TAU); ctx.stroke(); return; }
    if (TOBJ[a[0]]) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 0.27, 0.22, 0.05, 0, 0, TAU); ctx.fill(); return; }
    const age = (now - got) / 1000, pop = age < 1.2 ? 1 + Math.sin(age * 9) * 0.35 * (1.2 - age) : 1;
    drawTrophyOn(ctx, a[0], x, y, TROPHY_S * pop);
  });
}
function drawFlyingTrophies() {
  for (const id of activeTrophies()) {
    const o = TOBJ[id];
    if (o.st === 'held') { ctx.fillStyle = 'rgba(255,220,90,0.25)'; ctx.beginPath(); ctx.arc(o.x, o.y, 0.55, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); drawTrophyOn(ctx, id, 0, 0, TROPHY_S * (o.st === 'held' ? 1.15 : 1)); ctx.restore();
  }
}

const ACH = [
  ['first', 'Ensiaskeleet', 'Yhdistä ensimmäiset pallot.'],
  ['fin', 'Kotimaa', 'Saa Suomi.'],
  ['nordic', 'Pohjoismaat', 'Saa samassa pelissä Suomi ja Ruotsi.'],
  ['fra', 'Ranskalainen tyyli', 'Saa Ranska.'],
  ['rus', 'Itäblokki', 'Saa USSR.'],
  ['union', 'Alamaailman Hermes', 'Yhdistä kaksi USSR:ää.'],
  ['all', 'Keräilijä', 'Avaa kaikki 15 maata. Palkintona kultaiset reunat!'],
  ['combo5', 'Kombokuningas', 'Tee kombo ×5.'],
  ['combo10', 'Ketjureaktio', 'Tee kombo ×10.'],
  ['star', 'Tarkka-ampuja', 'Osu bonustähteen.'],
  ['heart', 'Rakkauden ammattilainen', 'Osu harvinaiseen sydänbonukseen.'],
  ['close', 'Täpärä', 'Selviä, kun toinen nappi on ollut punaisena 5 sekuntia.'],
  ['merges100', 'Ahkera yhdistäjä', 'Tee 100 yhdistymistä yhdessä pelissä.'],
  ['s10k', 'Kymppitonni', 'Kerää 10 000 pistettä yhdessä pelissä.'],
  ['s100k', 'Satatonni', 'Kerää 100 000 pistettä yhdessä pelissä.'],
  ['shake', 'Heiluttaja', 'Käytä heilautusta.'],
  ['marathon', 'Maratoonari', 'Pelaa yhtä peliä 30 minuuttia.'],
  ['games50', 'Sitkeä', 'Pelaa 50 peliä.'],
  ['time5k', 'Pikakäsi', 'Kerää 5 000 pistettä aikahaasteessa.', 'mode'],
  ['time15k', 'Salamasota', 'Kerää 15 000 pistettä aikahaasteessa.', 'mode'],
  ['daily', 'Päivän sankari', 'Läpäise päivän haaste.', 'mode'],
  ['daily60', 'Tehokas', 'Läpäise päivän haaste alle 60 laukauksella.', 'mode'],
  ['zen5', 'Mielenrauha', 'Pelaa zen-tilassa 5 minuuttia.', 'mode'],
  ['grav', 'Painoton', 'Saa Suomi painovoimatilassa.', 'mode'],
  ['map3', 'Tutkimusmatkailija', 'Suorita 3 tehtävää tehtäväkartalla.', 'mode'],
  ['mapAll', 'Euroopan valloittaja', 'Suorita kaikki tehtävät.', 'mode'],
  ['nelli', 'Nellin rakas', 'Laukaise Nellin yllätys.', 'secret'],
  ['admin', 'Huijari', 'Avaa admin-tila.', 'secret'],
  ['quiet', 'Hiljainen hetki', 'Aloita peli musiikki pois päältä.', 'secret']
];
const TROPHY_AT = [5, 10, 15, 20, 25, ACH.length];
let achGot = store.get('piispanpeli-ach', {}) || {};
const achCount = () => ACH.filter(a => achGot[a[0]]).length;
const trophies = () => TROPHY_AT.filter(n => achCount() >= n).length;
const goldEdges = () => !!achGot.all;
let seenEver = new Set(store.get('piispanpeli-seen', []) || []);
const CUP = (c1, c2) => `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 4h14v6a7 7 0 0 1-14 0z" fill="${c1}"/><path d="M9 6H5a4 4 0 0 0 4 6M23 6h4a4 4 0 0 1-4 6" fill="none" stroke="${c2}" stroke-width="2"/><rect x="14" y="16" width="4" height="6" fill="${c2}"/><rect x="10" y="22" width="12" height="4" rx="1.5" fill="${c1}"/><path d="M12 6h3v5h-3z" fill="#fff" opacity=".45"/></svg>`;
const toastQ = [];
let toastBusy = false;
const toastEl = document.getElementById('toast');
function toast(title, sub, id) {
  toastQ.push([title, sub, id]);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const t = toastQ.shift();
  if (!t) { toastBusy = false; return; }
  toastBusy = true;
  toastEl.innerHTML = (t[2] ? `<img src="${trophyImg(t[2])}" alt="" width="34" height="34">` : CUP('#ffcc00', '#a07800')) + `<div>${t[0]}<small>${t[1]}</small></div>`;
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => { toastEl.classList.remove('show'); setTimeout(nextToast, 400); }, 2800);
}
function unlockEverything() {
  // admin: open every achievement, theme, wardrobe item, country and mission at once (no toast flood)
  const now = Date.now();
  ACH.forEach((a, i) => { if (!achGot[a[0]]) achGot[a[0]] = now - (ACH.length - i); });
  store.set('piispanpeli-ach', achGot);
  for (let l = 0; l <= MAXL; l++) seenEver.add(l);
  store.set('piispanpeli-seen', [...seenEver]);
  store.set('piispanpeli-map', MISSIONS.length);
  bestLevel = MAXL; store.set('piispanpeli-level', bestLevel);
}
function unlock(id) {
  if (achGot[id]) return;
  const a = ACH.find(x => x[0] === id);
  if (!a) return;
  const before = trophies();
  achGot[id] = Date.now(); store.set('piispanpeli-ach', achGot);
  // the Hermes reward: the balls put on their golden rims right away (can be switched off in the wardrobe)
  if (id === 'union' && look.ball !== 'gold') { look.ball = 'gold'; store.set('piispanpeli-look', look); }
  toast(T('Saavutus: {0}', a[1]), a[2], id);
  sfx.ensure(); sfx.mega();
  if (trophies() > before) toast(T('Kultapalkinto {0}/{1}!', trophies(), TROPHY_AT.length), T('Se näkyy nyt junavaunun kyljessä.'));
  if (id === 'all') toast(T('Kultaiset reunat!'), T('Junavaunusi on nyt kullattu.'));
  for (const t of THEMES) if (t.ach === id) toast(T('Uusi teema: {0}!', T(t.name)), T('Valitse se päävalikon Teemat-napista.'));
  for (const slot in WARDROBE) for (const it of WARDROBE[slot]) if (it[2] === id) toast(T('Uusi tavara hahmolle: {0}!', it[1]), T('Pue se päälle päävalikon Hahmo-napista.'));
}
function noteLevel(l) {
  gotLevels.add(l);
  if (!seenEver.has(l)) { seenEver.add(l); store.set('piispanpeli-seen', [...seenEver]); }
  if (l >= 7) unlock('fin');
  if (l >= 10) unlock('fra');
  if (l >= 14) unlock('rus');
  if (gotLevels.has(7) && gotLevels.has(9)) unlock('nordic');
  if (gmode === 'gravity' && l >= 7) unlock('grav');
  if (seenEver.size >= MAXL + 1) unlock('all');
}

function syncUI() {
  pauseBtn.hidden = !(state === 'play' || state === 'paused');
  syncAbil();
  canvas.style.cursor = state === 'play' ? 'crosshair' : 'default';
}

function startGame(m, mi) {
  if (state === 'play') return;
  if (m) gmode = m;
  missionIdx = gmode === 'map' ? (mi != null ? mi : missionIdx) : -1;
  rng = gmode === 'daily' ? mulberry(todayKey()) : Math.random;
  const ms = missionIdx >= 0 ? MISSIONS[missionIdx] : null;
  modeT = gmode === 'time' ? TIME_LIMIT : ms && ms.time ? ms.time : 0;
  shots = 0; gotLevels = new Set(); playT = 0; oneBtnT = 0; mergesThisGame = 0; gravT = 12; gravI = 0; failT = 0; endReason = 'over';
  E.gx = 0; E.gy = GRAV;
  const gp = (Number(store.get('piispanpeli-games', 0)) || 0) + 1; store.set('piispanpeli-games', gp);
  if (gp >= 50) unlock('games50');
  if (music.track < 0) unlock('quiet');
  sfx.ensure();
  clearAll(); parts.length = 0; floaters.length = 0;
  bonuses.length = 0; bonusT = 12; jamT = 0;
  score = 0; shownScore = 0; maxLevel = 0; dangerT = 0; combo = 0; comboT = 0; shake = 0; blockedT = 0; charges = 0; abilProg = 0; wobT = 0;
  cur = rng() < 0.5 ? 1 : 2; nxt = randLevel(); cooldown = 0.2; popT = 0; aiming = false;
  state = 'play'; hideOverlay(); syncUI();
}

function pause() { if (state !== 'play') return; state = 'paused'; aiming = false; autoSave(); showPause(); syncUI(); }

// ---- saving: an automatic save plus three save slots ----
const AUTO_KEY = 'piispanpeli-autosave', SLOT_KEY = i => 'piispanpeli-slot' + i;
let autoT = 0;
function gameData() {
  return { v: 1, t: Date.now(), score, cur, nxt, maxLevel, charges, abilProg,
    blobs: E.blobs.map(b => [b.level, Math.round(b.cx * 100) / 100, Math.round(b.cy * 100) / 100]) };
}
function validSave(g) { return !!(g && Array.isArray(g.blobs)); }
function autoSave() { if ((state === 'play' || state === 'paused') && gmode === 'classic') store.set(AUTO_KEY, gameData()); }
function loadGame(g, play) {
  clearAll(); parts.length = 0; floaters.length = 0;
  for (const item of g.blobs) {
    const lv = item[0] | 0;
    if (lv < 0 || lv > MAXL) continue;
    const R = RADII[lv];
    makeBlob(lv, clamp(+item[1] || 5, R, WORLD_W - R), clamp(+item[2] || 10, DANGER_Y, FLOOR_Y - R), 0, 0, 0.85);
  }
  score = shownScore = g.score | 0; cur = clamp(g.cur | 0, 0, MAXL); nxt = clamp(g.nxt | 0, 0, 6); maxLevel = g.maxLevel | 0;
  charges = g.charges | 0; abilProg = g.abilProg | 0; wobT = 0;
  dangerT = 0; combo = 0; comboT = 0; shake = 0; blockedT = 0; cooldown = 0.3; popT = 0; aiming = false; autoT = 0;
  gmode = 'classic'; missionIdx = -1; rng = Math.random; E.gx = 0; E.gy = GRAV; shots = 0; gotLevels = new Set(); playT = 0;
  sfx.ensure();
  if (play) { state = 'play'; hideOverlay(); } else { state = 'paused'; showPause(); }
  syncUI();
}
function fmtDate(t) {
  const d = new Date(t), two = n => String(n).padStart(2, '0');
  return `${d.getDate()}.${d.getMonth() + 1}. ${two(d.getHours())}:${two(d.getMinutes())}`;
}
function slotsHTML(mode) {
  let rows = '', any = false;
  for (let i = 1; i <= 3; i++) {
    const s = store.get(SLOT_KEY(i), null), ok = validSave(s);
    if (ok) any = true;
    const info = ok ? `${T('{0} pistettä', s.score)} · ${fmtDate(s.t)}` : `<span class="muted">${T('tyhjä')}</span>`;
    let btns = '';
    if (mode === 'save') btns = `<button class="mini" type="button" data-act="save" data-slot="${i}">${T('Tallenna')}</button>`;
    else if (ok) btns = `<button class="mini" type="button" data-act="load" data-slot="${i}">${T('Lataa')}</button><button class="mini ghost" type="button" data-act="del" data-slot="${i}" aria-label="${T('Poista tallennus {0}', i)}">${T('Poista')}</button>`;
    rows += `<li><span class="slotname">${T('Tallennus {0}', i)}</span><span class="slotbtns">${btns}</span><span class="slotinfo">${info}</span></li>`;
  }
  if (mode !== 'save' && !any) return '';
  return `<div class="saves"><h3>${T(mode === 'save' ? 'Valitse tallennuspaikka' : 'Tallennetut pelit')}</h3><ul>${rows}</ul></div>`;
}
function toMenu() {
  autoSave(); E.gx = 0; E.gy = GRAV;
  state = 'menu'; preloadMenu(); showMenu(); syncUI();
}
function resume() { if (state !== 'paused') return; state = 'play'; hideOverlay(); syncUI(); }

let jamT = 0;
function gameOver(reason) {
  reason = reason || 'over';
  if (reason === 'over' && (invincible || MODE_INFO[gmode].noLose)) { dangerT = 0; jamT = 0; return; }
  state = 'over'; aiming = false; endReason = reason;
  let newBest = false;
  if (gmode === 'classic') { newBest = score > best; if (newBest) { best = score; store.set('piispanpeli-best', best); } }
  else if (gmode === 'time' || gmode === 'gravity') { newBest = score > modeBest(gmode); if (newBest) store.set('piispanpeli-best-' + gmode, score); }
  else if (gmode === 'daily' && reason === 'win') {
    const k = 'piispanpeli-daily-' + todayKey(), prev = Number(store.get(k, 0)) || 0;
    newBest = !prev || shots < prev; if (newBest) store.set(k, shots);
    unlock('daily'); if (shots < 60) unlock('daily60');
  } else if (gmode === 'map' && reason === 'win') {
    if (missionIdx + 1 > mapDone()) store.set('piispanpeli-map', missionIdx + 1);
    if (mapDone() >= 3) unlock('map3');
    if (mapDone() >= MISSIONS.length) unlock('mapAll');
  }
  if (gmode === 'time') { if (score >= 5000) unlock('time5k'); if (score >= 15000) unlock('time15k'); }
  E.gx = 0; E.gy = GRAV;
  store.set(AUTO_KEY, null);
  if (maxLevel > bestLevel) { bestLevel = maxLevel; store.set('piispanpeli-level', bestLevel); }
  if (reason === 'win') { sfx.mega(); triggerConfetti(); } else sfx.over();
  if (!reduceMotion && reason !== 'win') shake = Math.max(shake, 0.25);
  syncUI();
  setTimeout(() => { if (state === 'over') showOver(newBest); }, 1000);
}

function shoot() {
  if (state !== 'play' || cooldown > 0) return;
  const R = RADII[cur], lim = (R + RB) * (R + RB);
  for (let i = 0; i < E.NB; i++) {
    const dx = X[i] - LX, dy = Y[i] - LY;
    if (dx * dx + dy * dy < lim) { blockedT = 0.9; sfx.blocked(); return; }
  }
  const sp = 3 + aimPow * 29;
  const b = makeBlob(cur, LX, LY, Math.sin(aimAng) * sp, Math.cos(aimAng) * sp, 1);
  if (!b) return;
  maxLevel = Math.max(maxLevel, cur); noteLevel(cur); shots++;
  sfx.shoot(aimPow);
  cur = nxt; nxt = randLevel(); cooldown = 0.32; popT = 0;
}

// ------------------------------ effects ------------------------------
function triggerConfetti() { for (let l = 0; l <= MAXL; l++) burst(WORLD_W / 2, 6, l, 4, 3); }
function burst(x, y, level, count, R) {
  if (reduceMotion) count = Math.ceil(count / 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, sp = rand(2.5, 7) * (0.7 + R * 0.25), life = rand(0.45, 0.8);
    parts.push({ k: 0, x: x + Math.cos(a) * R * 0.6, y: y + Math.sin(a) * R * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
      r: rand(0.06, 0.15) * (0.8 + R * 0.2), life, max: life, c: PAL[level].light });
  }
}
function ring(x, y, R, level) { parts.push({ k: 1, x, y, r: R * 0.7, r1: R * 1.55, life: 0.35, max: 0.35, c: PAL[level].light }); }
function floater(text, x, y, color, size) { floaters.push({ text, x, y, life: 1.1, max: 1.1, color, size }); }

function handleEvent(ev) {
  if (ev.type === 'merge') {
    const R = RADII[ev.level];
    burst(ev.x, ev.y, ev.level, 8 + ev.level * 2, R); ring(ev.x, ev.y, R, ev.level);
    if (ev.level >= 4) mascotBounce = 1;
    sfx.merge(ev.level);
    if (ev.level >= 7 && !reduceMotion) shake = Math.max(shake, 0.1 + (ev.level - 7) * 0.06);
    if (state !== 'play') return;
    combo = comboT > 0 ? combo + 1 : 1; comboT = 1.1;
    mergesThisGame++; unlock('first'); noteLevel(ev.level);
    if (combo >= 5) unlock('combo5'); if (combo >= 10) unlock('combo10'); if (mergesThisGame >= 100) unlock('merges100');
    const pts = POINTS[ev.level] * combo;
    addScore(pts);
    floater('+' + pts, ev.x, ev.y, PAL[ev.level].light, 17 + ev.level * 1.5);
    if (combo >= 2) floater(T('Kombo ×{0}', combo), ev.x, ev.y - R - 0.5, '#fff7ee', 19);
    else if (ev.level >= 2) floater(NAMES[ev.level], ev.x, ev.y - R - 0.5, '#ffe066', 16 + ev.level);
    if (ev.level > maxLevel) {
      if (ev.level >= 5 && ev.level > bestLevel) floater(T('Uusi maa: {0}!', NAMES[ev.level]), ev.x, ev.y - R - 1.1, '#ffe066', 22);
      maxLevel = ev.level;
    }
  } else if (ev.type === 'max') {
    for (let l = 0; l <= MAXL; l++) burst(ev.x, ev.y, l, 5, 2.5);
    ring(ev.x, ev.y, 3.2, MAXL); sfx.mega();
    if (!reduceMotion) shake = 0.45;
    if (state !== 'play') return;
    combo = comboT > 0 ? combo + 1 : 1; comboT = 1.1;
    unlock('union');
    const pts = MAX_BONUS * combo;
    addScore(pts);
    floater(T('Alamaailman Hermes! +{0}', pts), ev.x, ev.y, '#ffe066', 28);
  }
}

function addScore(p) {
  if (gmode === 'zen') return;
  score += p; abilProg += p;
  if (state === 'play') { if (score >= 10000) unlock('s10k'); if (score >= 100000) unlock('s100k'); }
  while (abilProg >= ABIL_COST) { abilProg -= ABIL_COST; charges++; floater(T('Heilautus valmis!'), WORLD_W / 2, 6, '#ffcc00', 24); }
  syncAbil();
}
function syncAbil() {
  const on = state === 'play' || state === 'paused';
  abilBtn.hidden = !on;
  if (!on) return;
  abilBtn.disabled = charges <= 0 || wobT > 0;
  abilBtn.classList.toggle('ready', charges > 0 && wobT <= 0);
  const fmt = n => n >= 1000 ? (Math.floor(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(Math.floor(n));
  abilBtn.textContent = charges > 0 ? T('Heilauta! ×{0}', charges) : T('Heilautus {0} / {1}', fmt(abilProg), fmt(ABIL_COST));
  abilBtn.style.setProperty('--p', charges > 0 ? '100%' : (abilProg / ABIL_COST * 100).toFixed(1) + '%');
  abilBtn.setAttribute('aria-label', charges > 0 ? T('Heilauta vaunua, {0} käytettävissä', charges) : T('Heilautus latautuu, {0} / {1} pistettä', Math.floor(abilProg), ABIL_COST));
}
function useAbility() {
  if (state !== 'play' || charges <= 0 || wobT > 0) return;
  charges--; wobT = 1.4; unlock('shake');
  // throw everything up a bit, then rock the wagon from side to side
  for (const b of E.blobs) {
    const kick = 12 + Math.random() * 12, side = (Math.random() - 0.5) * 12;
    for (let i = b.start; i < b.start + b.n; i++) { VY[i] -= kick; VX[i] += side; }
  }
  if (!reduceMotion) shake = Math.max(shake, 0.35);
  sfx.mega(); mascotBounce = 1; dangerT = 0;
  floater(T('HEILAUTUS!'), WORLD_W / 2, 7, '#ffcc00', 30);
  syncAbil();
}
function wobbleStep() {
  if (wobT <= 0) return;
  wobT -= STEP;
  const a = Math.sin((1.4 - wobT) * TAU * 2.2) * 110 * Math.min(1, wobT / 0.4) * STEP;
  for (let i = 0; i < E.NB; i++) VX[i] += a;
  if (wobT <= 0) { wobT = 0; syncAbil(); }
}

// two buttons on the wagon walls: game over when balls press both all the way at once
function checkDanger() {
  // how hard each button is pressed = how many bead contacts lean on it
  const y0 = BTN_Y - BTN_H / 2 - RB, y1 = BTN_Y + BTN_H / 2 + RB, lim = RB + 0.15;
  let cl = 0, cr = 0;
  for (let i = 0; i < E.NB; i++) {
    const y = Y[i];
    if (y < y0 || y > y1) continue;
    if (X[i] < lim) cl++; else if (X[i] > WORLD_W - lim) cr++;
  }
  // gauge level grows with how many bead contacts press the button (green → yellow → red)
  tgtL = cl > 0 ? Math.min(1, 0.45 + cl / 5) : 0; tgtR = cr > 0 ? Math.min(1, 0.45 + cr / 5) : 0;
  btnL = cl > 0; btnR = cr > 0;
  if (btnL && btnR && wobT <= 0) { dangerT += STEP; if (dangerT >= DANGER_TIME) gameOver(); }
  else dangerT = Math.max(0, dangerT - STEP * 2);
}

function modeStep() {
  playT += STEP;
  if (playT >= 1800) unlock('marathon');
  if (gmode === 'zen' && playT >= 300) unlock('zen5');
  // "close call": one button red for 5 s and you survive it
  if (btnL !== btnR) oneBtnT += STEP; else { if (!btnL && oneBtnT >= 5) unlock('close'); oneBtnT = 0; }
  if (gmode === 'time') { modeT -= STEP; if (modeT <= 0) { modeT = 0; gameOver('time'); } }
  else if (gmode === 'daily') { if (maxLevel >= 10) gameOver('win'); }
  else if (gmode === 'gravity') {
    gravT -= STEP;
    if (gravT <= 0) {
      gravI = (gravI + 1) % GRAVS.length; gravT = 10 + Math.random() * 6;
      floater(T('Painovoima: {0}!', GRAVS[gravI][2]), WORLD_W / 2, 7, '#7fe7ff', 24); sfx.blocked();
    }
    const [gx, gy] = GRAVS[gravI];
    E.gx += (gx - E.gx) * 0.03; E.gy += (gy - E.gy) * 0.03;
  } else if (gmode === 'map') {
    const ms = MISSIONS[missionIdx];
    const ok = (ms.level != null && maxLevel >= ms.level) || (ms.score != null && score >= ms.score) || (ms.combo != null && combo >= ms.combo);
    if (ok) { gameOver('win'); return; }
    if (ms.time) { modeT -= STEP; if (modeT <= 0) { modeT = 0; gameOver('fail'); return; } }
    if (ms.shots && shots >= ms.shots) { failT += STEP; if (failT > 4) gameOver('fail'); }
  }
}

function attract() {
  menuT -= STEP;
  if (menuT > 0) return;
  menuT = 1.1;
  if (E.blobs.length >= 24) return;
  for (const b of E.blobs) if (b.top < 6) return;
  const lv = Math.floor(Math.random() * 6), R = RADII[lv];
  makeBlob(lv, rand(R + 0.3, WORLD_W - R - 0.3), -1.5, rand(-1.5, 1.5), 2, 1);
}

function preloadMenu() {
  clearAll();
  const placed = [];
  let tries = 0;
  while (placed.length < 13 && tries < 500) {
    tries++;
    const lv = Math.floor(Math.random() * 7), R = RADII[lv];
    const x = rand(R + 0.1, WORLD_W - R - 0.1), y = rand(6 + R, FLOOR_Y - R - 0.05);
    if (placed.some(p => Math.hypot(p.x - x, p.y - y) < p.R + R + 0.15)) continue;
    placed.push({ x, y, R });
    makeBlob(lv, x, y, 0, 0, 1);
  }
  for (let i = 0; i < 90; i++) stepPhysics();
  E.events.length = 0;
}

function stepGame() {
  if (state === 'play') {
    if (keys.ArrowLeft || keys.KeyA) aimAng = Math.max(-1.3, aimAng - 1.5 * STEP);
    if (keys.ArrowRight || keys.KeyD) aimAng = Math.min(1.3, aimAng + 1.5 * STEP);
    if (keys.ArrowUp || keys.KeyW) aimPow = Math.min(1, aimPow + 0.8 * STEP);
    if (keys.ArrowDown || keys.KeyS) aimPow = Math.max(0.03, aimPow - 0.8 * STEP);
    if (cooldown > 0) cooldown = Math.max(0, cooldown - STEP);
    autoT += STEP;
    if (autoT > 4) { autoT = 0; autoSave(); }
  } else if (state === 'menu') attract();
  stepPhysics(); trophyStep();
  for (let i = 0; i < E.events.length; i++) handleEvent(E.events[i]);
  E.events.length = 0;
  if (state === 'play') {
    modeStep();
    if (state !== 'play') return;
    wobbleStep(); checkDanger(); bonusStep();
    // launcher jammed: is there room for the waiting ball?
    const R = RADII[cur], lim = (R + RB) * (R + RB);
    let jam = false;
    for (let i = 0; i < E.NB; i++) { const dx = X[i] - LX, dy = Y[i] - LY; if (dx * dx + dy * dy < lim) { jam = true; break; } }
    if (jam) { jamT += STEP; if (jamT > 4) gameOver(); } else jamT = 0;
  }
  if (comboT > 0) { comboT -= STEP; if (comboT <= 0) combo = 0; }
}

function updateFx(dt) {
  depL += (tgtL - depL) * Math.min(1, dt * 14); depR += (tgtR - depR) * Math.min(1, dt * 14);
  updateNelli(dt);
  mascotBounce = Math.max(0, mascotBounce - dt * 3);
  time += dt; popT += dt;
  if (blockedT > 0) blockedT -= dt;
  shownScore += (score - shownScore) * Math.min(1, dt * 10);
  if (Math.abs(score - shownScore) < 0.5) shownScore = score;
  if (shake > 0) shake = Math.max(0, shake - dt * 1.4);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    if (p.k === 0) { p.vy += 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; }
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt; f.y -= 1.3 * dt;
    if (f.life <= 0) floaters.splice(i, 1);
  }
  for (const b of E.blobs) {
    b.blink -= dt;
    if (b.blink <= 0) { b.blinkT = 0.13; b.blink = rand(2.2, 6); }
    if (b.blinkT > 0) b.blinkT -= dt;
  }
}
