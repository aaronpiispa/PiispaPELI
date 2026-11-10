// PiispanPELI · Screen layout, adaptive quality, background text and the living country scenery.
'use strict';

// ------------------------------ layout ------------------------------
// ui: size of the HUD, buttons and menus; 1 on phones and laptops, bigger on large screens
let vw = 0, vh = 0, dpr = 1, SC = 40, OX = 0, OY = 0, mode = 'top', ui = 1;
// adaptive quality for slower phones: lower the render resolution step by step, then drop decorative effects
const QUALITY_DPR = [2, 1.5, 1.2, 1];
const QUALITY_KEY = 'piispanpeli-quality';
// a lowered level is tried one step better again after a few days, so one slow moment never sticks for good
const QUALITY_RETRY_MS = 3 * 864e5;
const QUALITY_BASE = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2 ? 1 : 0;
// saved as { q: level, at: time it was lowered }; older versions saved just the level
let qSaved = (() => {
  const v = store.get(QUALITY_KEY, null);
  const q = typeof v === 'number' ? v : v && typeof v === 'object' ? v.q : NaN;
  if (!Number.isInteger(q) || q < 0 || q >= QUALITY_DPR.length) return { q: QUALITY_BASE, at: 0 };
  return { q, at: v && typeof v === 'object' ? Number(v.at) || 0 : 0 };
})();
let quality = qSaved.q > QUALITY_BASE && Date.now() - qSaved.at > QUALITY_RETRY_MS ? qSaved.q - 1 : qSaved.q;
const lowFx = () => quality >= 2;
let qSum = 0, qN = 0, qWarm = 0, qSlow = 0, qGood = 0;
function watchFrameTime(ms) {
  // a frame that rebuilt a cached bitmap is slow once by design; it says nothing about the phone
  const heavy = heavyFrame; heavyFrame = false;
  // only judge while actually playing and visible, after a short warm-up; two slow 1.5 s windows in a row step quality down
  if (document.hidden || state !== 'play' || ms > 250) { qWarm = 0; qSum = 0; qN = 0; return; }
  if (heavy) return;
  if (qWarm < 2000) { qWarm += ms; return; }
  qSum += ms; qN++;
  if (qSum < 1500 || qN < 10) return;
  const avg = qSum / qN; qSum = 0; qN = 0;
  qSlow = avg > 26 ? qSlow + 1 : 0;
  qGood = avg > 26 ? 0 : qGood + 1;
  if (qSlow >= 2 && quality < QUALITY_DPR.length - 1) {
    qSlow = 0; qGood = 0; quality++;
    qSaved = { q: quality, at: Date.now() }; store.set(QUALITY_KEY, qSaved);
    layout();
  } else if (qGood >= 20 && quality < qSaved.q) {
    // half a minute of smooth play on the better level that was being retried: keep it
    qSaved = { q: quality, at: qSaved.at }; store.set(QUALITY_KEY, qSaved);
  }
}
const bg = document.createElement('canvas'), bgx = bg.getContext('2d');

const safeEl = document.getElementById('safe');
function layout() {
  vw = window.innerWidth; vh = window.innerHeight;
  dpr = Math.min(QUALITY_DPR[quality], window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(vw * dpr)); canvas.height = Math.max(1, Math.round(vh * dpr));
  // keep clear of the notch, status bar and home indicator when running as an installed app
  const ps = getComputedStyle(safeEl);
  const iT = parseFloat(ps.paddingTop) || 0, iR = parseFloat(ps.paddingRight) || 0;
  const iB = parseFloat(ps.paddingBottom) || 0, iL = parseFloat(ps.paddingLeft) || 0;
  const aw = Math.max(1, vw - iL - iR), ah = Math.max(1, vh - iT - iB);
  const ww = VX1 - VX0, wh = VY1 - VY0;
  // the HUD needs a band of TOP_H px above and below the wagon, or SIDE_W px beside it
  const TOP_H = 196, SIDE_W = 400;
  const sTop = Math.min((aw - 24) / ww, (ah - TOP_H) / wh);
  const sSide = Math.min((aw - SIDE_W) / ww, (ah - 32) / wh);
  if (sSide > sTop * 1.08) {
    mode = 'side'; SC = sSide;
    OX = iL + (aw - ww * SC) / 2 - VX0 * SC;
    OY = iT + (ah - wh * SC) / 2 - VY0 * SC;
    // big screens get a bigger HUD, as long as it still fits beside the wagon
    ui = clamp(Math.min(SC / 36, (aw - ww * SC) / 2 / (SIDE_W / 2)), 1, 2.4);
  } else {
    mode = 'top';
    // a bigger HUD needs a taller band, which makes the wagon a little smaller: settle both together
    ui = 1; SC = Math.max(8, sTop);
    for (let k = 0; k < 4; k++) { ui = clamp(SC / 36, 1, 1.8); SC = Math.max(8, Math.min((aw - 24) / ww, (ah - TOP_H * ui) / wh)); }
    OX = iL + (aw - ww * SC) / 2 - VX0 * SC;
    OY = iT + Math.max(0, (ah - (wh * SC + TOP_H * ui)) / 2) + 88 * ui - VY0 * SC;
  }
  const rs = document.documentElement.style;
  rs.setProperty('--ui', String(ui));
  // menus grow on big screens too (never shrink: small screens scroll or use the compact layout instead)
  rs.setProperty('--uiz', String(clamp(Math.min(vw / 440, vh / 820), 1, 2)));
  placeButtons(); buildBg();
}

// left and right edge of the HUD in the 'top' layout: the wagon's width, but never so narrow that texts collide
function hudEdges() {
  const fl = OX + VX0 * SC, fr = OX + VX1 * SC, c = (fl + fr) / 2, half = Math.max((fr - fl) / 2, 136 * ui);
  return [Math.max(4, c - half), Math.min(vw - 4, c + half)];
}

function placeButtons() {
  const ft = OY + VY0 * SC, fb = OY + VY1 * SC, u = ui;
  if (mode === 'top') {
    const [hl, hr] = hudEdges(), fc = OX + LX * SC;
    pauseBtn.style.left = (hr - 44 * u) + 'px'; soundBtn.style.left = (hr - 92 * u) + 'px';
    // on narrow screens the buttons come close to the next ball's name below them: lift them a little
    const lift = hr - 92 * u < fc + 100 * u ? 10 * u : 0;
    pauseBtn.style.top = soundBtn.style.top = (ft - 74 * u - lift) + 'px';
    abilBtn.style.left = (hl + 4 * u) + 'px'; abilBtn.style.top = (fb + 14 * u) + 'px'; abilBtn.style.right = 'auto';
  } else {
    const fl = OX + VX0 * SC, fr = OX + VX1 * SC;
    soundBtn.style.left = (fr + 24 * u) + 'px'; pauseBtn.style.left = (fr + 72 * u) + 'px';
    pauseBtn.style.top = soundBtn.style.top = (ft + 4 * u) + 'px';
    abilBtn.style.left = 'auto'; abilBtn.style.right = (vw - fl + 30 * u) + 'px'; abilBtn.style.top = (ft + 290 * u) + 'px';
  }
}

function buildBg() {
  bg.width = canvas.width; bg.height = canvas.height;
  bgx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bgx.clearRect(0, 0, vw, vh);
  // darken the middle so the wagon stays readable on any scenery
  const vg = bgx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.15, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
  vg.addColorStop(0, 'rgba(5,10,30,0.45)'); vg.addColorStop(1, 'rgba(5,10,30,0.15)');
  bgx.fillStyle = vg; bgx.fillRect(0, 0, vw, vh);
  // big two-tone PIISPAN / <theme word> behind the wagon (PIISPAN PELI, PIISPAN DRAKKAR, ...)
  const th = theme(), [word, c1, c2] = th.bg;
  if (word === '♥') {
    // the heart theme gets one big two-tone heart instead of words
    const hs = Math.min(vw * 0.85, vh * 0.62);
    bgx.save(); bgx.translate(vw / 2, vh * 0.5); bgx.rotate(-0.08); bgx.globalAlpha = 0.5; bgx.lineJoin = 'round';
    bgx.fillStyle = c2; heartPath(bgx, hs * 0.03, hs * 0.22 + hs * 0.035, hs); bgx.fill();
    bgx.fillStyle = c1; heartPath(bgx, 0, hs * 0.22, hs); bgx.fill();
    bgx.lineWidth = hs * 0.035; bgx.strokeStyle = c2; bgx.stroke();
    bgx.fillStyle = 'rgba(255,255,255,0.35)'; bgx.beginPath(); bgx.ellipse(-hs * 0.22, -hs * 0.12, hs * 0.05, hs * 0.11, 0.6, 0, TAU); bgx.fill();
    bgx.restore();
  } else {
  bgx.save();
  bgx.translate(vw / 2, vh * 0.5); bgx.rotate(-0.08);
  const f1 = Math.min(vw / 4.4, vh * 0.2);
  bgx.textAlign = 'center'; bgx.textBaseline = 'middle'; bgx.lineJoin = 'round';
  bgx.font = `400 ${f1 * 1.15}px "Lilita One", "Baloo 2", sans-serif`;
  const f2 = f1 * 1.15 * Math.min(1, vw * 0.94 / Math.max(1, bgx.measureText(word).width));
  bgx.font = `400 ${f1}px "Lilita One", "Baloo 2", sans-serif`;
  bgx.globalAlpha = 0.5;
  bgx.fillStyle = '#000'; bgx.fillText('PIISPAN', f1 * 0.05, -f1 * 0.55 + f1 * 0.06);
  bgx.lineWidth = f1 * 0.08; bgx.strokeStyle = '#000'; bgx.strokeText('PIISPAN', 0, -f1 * 0.55);
  bgx.fillStyle = c1; bgx.fillText('PIISPAN', 0, -f1 * 0.55);
  bgx.font = `400 ${f2}px "Lilita One", "Baloo 2", sans-serif`;
  const y2 = f1 * 0.5 + f2 * 0.42;
  bgx.fillStyle = c1; bgx.fillText(word, f2 * 0.05, y2 + f2 * 0.06);
  bgx.lineWidth = f2 * 0.08; bgx.strokeStyle = c1; bgx.strokeText(word, 0, y2);
  bgx.fillStyle = c2; bgx.fillText(word, 0, y2);
  bgx.restore();
  }
  sceneCache = {};
  // soft shadow under the jug
  const sx = OX + WORLD_W / 2 * SC, sy = OY + (FLOOR_Y + 1.3) * SC, sr = 6.4 * SC;
  bgx.save(); bgx.translate(sx, sy); bgx.scale(1, 0.1);
  const sg = bgx.createRadialGradient(0, 0, 0, 0, 0, sr);
  sg.addColorStop(0, 'rgba(5,3,20,0.6)'); sg.addColorStop(1, 'rgba(5,3,20,0)');
  bgx.fillStyle = sg; bgx.beginPath(); bgx.arc(0, 0, sr, 0, TAU); bgx.fill();
  bgx.restore();
}


// ======================= living scenery behind the wagon =======================
// one scene per country, chosen by the biggest ball reached in this game
const SCENES = [
  { sky: ['#2b3f66', '#c98f7a'], sun: [0.78, 0.55, '#ffd9b0', 0.05], far: ['hills', '#33465f', 0.07], near: ['pines', '#16241c'], water: '#33506e', anim: 'mist' },
  { sky: ['#1d2b47', '#6d6a8a'], sun: [0.2, 0.3, '#f4f0d0', 0.035], far: ['hills', '#2b3a48', 0.05], near: ['birches', '#20301f'], water: '#2c3f58', anim: 'fireflies' },
  { sky: ['#6f8798', '#b9c7c4'], sun: null, far: ['hills', '#4f7a4a', 0.12], near: ['grass', '#2f6b32'], water: null, anim: 'rain' },
  { sky: ['#4a86c8', '#cfe6f6'], sun: [0.8, 0.18, '#fff8d8', 0.05], far: ['alps', '#7d8fa8', 0.32], near: ['firs', '#24402e'], water: null, anim: 'snow' },
  { sky: ['#e07a3a', '#f6c869'], sun: [0.5, 0.62, '#fff1b8', 0.08], far: ['flat', '#a9783a', 0.02], near: ['grass', '#8a6a24'], water: null, anim: 'pollen' },
  { sky: ['#4b5d78', '#a9b4b8'], sun: [0.25, 0.25, '#f0ece0', 0.04], far: ['mountains', '#3c5446', 0.22], near: ['firs', '#1d3326'], water: null, anim: 'mist' },
  { sky: ['#f08a4b', '#ffd59a'], sun: [0.65, 0.5, '#fff0c0', 0.07], far: ['hills', '#8a6a52', 0.08], near: ['cypress', '#2e4a2a'], water: '#2f7fa8', anim: 'sparkle' },
  { sky: ['#06122c', '#1d3a5c'], sun: [0.82, 0.16, '#eef2ff', 0.035], far: ['hills', '#0f2233', 0.06], near: ['none', '#081510'], water: '#0f2a44', anim: 'aurora', extra: 'forest' },
  { sky: ['#3d4a4a', '#8f9c94'], sun: null, far: ['mountains', '#2f3d36', 0.14], near: ['firs', '#14211a'], water: null, anim: 'fog' },
  { sky: ['#e8826a', '#ffd6a0'], sun: [0.15, 0.5, '#fff0c8', 0.06], far: ['rocks', '#5e5a66', 0.05], near: ['none', '#000'], water: '#2d6f9e', anim: 'waves', extra: 'pride', rainbow: true },
  { sky: ['#e58c6a', '#f8d4a8'], sun: [0.7, 0.42, '#fff2c8', 0.07], far: ['hills', '#9a7aa0', 0.08], near: ['lavender', '#7b4fa8'], water: null, anim: 'butterflies' },
  { sky: ['#2a2630', '#b0603a'], sun: [0.2, 0.22, '#f0c890', 0.03], far: ['ruins', '#1c1a20', 0.2], near: ['sunflowers', '#2c3a1a'], water: null, anim: 'embers', extra: 'war' },
  { sky: ['#f2a65a', '#ffe1a8'], sun: [0.25, 0.3, '#fff2c0', 0.06], far: ['chimneys', '#c48f62', 0.18], near: ['none', '#000'], water: null, anim: 'balloons' },
  { sky: ['#071a33', '#3a6d8c'], sun: [0.75, 0.2, '#e8f4ff', 0.03], far: ['icebergs', '#d8ecf6', 0.16], near: ['none', '#000'], water: '#0e3554', anim: 'aurora' },
  { sky: ['#1a2238', '#5b6a85'], sun: [0.3, 0.2, '#e6ecf5', 0.04], far: ['hills', '#c9d3e0', 0.07], near: ['snowpines', '#1b2a24'], water: null, anim: 'blizzard' }
];
let sceneCache = {}, sceneIdx = 7, scenePrev = 7, sceneFade = 1;
const sceneParts = [];
function sceneFor() { const h = /scene=(\d+)/.exec(location.hash); if (h) return clamp(+h[1], 0, SCENES.length - 1); return state === 'menu' ? 7 : clamp(maxLevel, 0, SCENES.length - 1); }
function srand(seed) { let a = seed * 9301 + 49297; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; }
function buildScene(i) {
  const sc = SCENES[i], cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(vw * dpr)); cv.height = Math.max(1, Math.round(vh * dpr));
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = vw, Hh = vh, hz = Hh * 0.62, r = srand(i + 3);
  const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, sc.sky[0]); g.addColorStop(1, sc.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, W, Hh);
  if (sc.anim === 'aurora' || sc.anim === 'blizzard' || sc.anim === 'fireflies') { c.fillStyle = '#fff'; for (let k = 0; k < 90; k++) { c.globalAlpha = 0.3 + r() * 0.6; c.fillRect(r() * W, r() * hz * 0.8, 1.4, 1.4); } c.globalAlpha = 1; }
  if (sc.sun) {
    const [sx, sy, col, sr] = sc.sun, R = Math.min(W, Hh) * sr * 2, x = sx * W, y = sy * Hh;
    const gl = c.createRadialGradient(x, y, 0, x, y, R * 4); gl.addColorStop(0, col); gl.addColorStop(0.25, col + '88'); gl.addColorStop(1, col + '00');
    c.fillStyle = gl; c.fillRect(0, 0, W, Hh); c.fillStyle = col; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  }
  if (sc.rainbow) {
    const cx = W * 0.5, cy = hz + 10, R0 = Math.min(W, Hh) * 0.5;
    ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((col, k) => { c.strokeStyle = col; c.globalAlpha = 0.28; c.lineWidth = R0 * 0.035; c.beginPath(); c.arc(cx, cy, R0 - k * R0 * 0.035, Math.PI, 0); c.stroke(); });
    c.globalAlpha = 1;
  }
  const [ft, fc, fh] = sc.far, peakH = Hh * fh;
  c.fillStyle = fc;
  if (ft === 'alps' || ft === 'mountains') {
    c.beginPath(); c.moveTo(0, hz); let x = 0; const pts = [];
    while (x < W + 60) { const w = 60 + r() * 120, h = peakH * (0.5 + r() * 0.6); pts.push([x + w / 2, hz - h]); c.lineTo(x + w / 2, hz - h); c.lineTo(x + w, hz - h * (0.2 + r() * 0.3)); x += w; }
    c.lineTo(W, hz); c.closePath(); c.fill();
    if (ft === 'alps') { c.fillStyle = '#f4f8ff'; for (const [px, py] of pts) { c.beginPath(); c.moveTo(px, py); c.lineTo(px - 22, py + 30); c.lineTo(px - 6, py + 24); c.lineTo(px + 6, py + 32); c.lineTo(px + 22, py + 30); c.closePath(); c.fill(); } }
  } else if (ft === 'hills' || ft === 'flat') {
    c.beginPath(); c.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) c.lineTo(x, hz - peakH * (0.5 + 0.5 * Math.sin(x / W * 5 + i))); c.lineTo(W, Hh); c.closePath(); c.fill();
  } else if (ft === 'rocks') {
    for (let k = 0; k < 7; k++) { const x = r() * W, w = 30 + r() * 90; c.beginPath(); c.ellipse(x, hz, w, 10 + r() * 22, 0, Math.PI, 0); c.fill(); c.fillStyle = '#b8323a'; c.fillRect(x - 6, hz - 18, 12, 9); c.fillStyle = fc; }
  } else if (ft === 'chimneys') {
    for (let k = 0; k < 14; k++) { const x = r() * W, w = 14 + r() * 26, h = peakH * (0.4 + r() * 0.8); c.beginPath(); c.moveTo(x - w, hz); c.quadraticCurveTo(x - w * 0.3, hz - h, x, hz - h); c.quadraticCurveTo(x + w * 0.3, hz - h, x + w, hz); c.fill(); c.fillStyle = '#8a5a3a'; c.beginPath(); c.ellipse(x, hz - h, w * 0.45, w * 0.25, 0, 0, TAU); c.fill(); c.fillStyle = fc; }
  } else if (ft === 'ruins') {
    let x = -10;
    while (x < W + 10) {
      const w = 22 + r() * 50, h = peakH * (0.3 + r() * 0.8);
      c.fillStyle = fc; c.beginPath(); c.moveTo(x, hz);
      c.lineTo(x, hz - h); const steps = 3 + (r() * 4 | 0);
      for (let k = 1; k <= steps; k++) c.lineTo(x + w * k / steps, hz - h * (r() < 0.5 ? 0.55 + r() * 0.45 : 1));
      c.lineTo(x + w, hz); c.closePath(); c.fill();
      for (let wy = hz - h + 10; wy < hz - 8; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 10) {
        const q = r(); c.fillStyle = q < 0.12 ? 'rgba(255,170,80,0.7)' : q < 0.5 ? 'rgba(0,0,0,0.55)' : 'rgba(80,70,80,0.35)'; c.fillRect(wx, wy, 5, 6);
      }
      x += w + r() * 8;
    }
  } else if (ft === 'icebergs') {
    for (let k = 0; k < 6; k++) { const x = r() * W, w = 40 + r() * 80, h = peakH * (0.4 + r() * 0.7); c.fillStyle = '#e8f6ff'; c.beginPath(); c.moveTo(x - w, hz); c.lineTo(x - w * 0.4, hz - h * 0.7); c.lineTo(x, hz - h); c.lineTo(x + w * 0.5, hz - h * 0.5); c.lineTo(x + w, hz); c.closePath(); c.fill(); c.fillStyle = '#a9d2ea'; c.beginPath(); c.moveTo(x, hz - h); c.lineTo(x + w * 0.5, hz - h * 0.5); c.lineTo(x + w, hz); c.lineTo(x + w * 0.2, hz); c.closePath(); c.fill(); }
  }
  // ground or water
  if (sc.water) {
    const wg = c.createLinearGradient(0, hz, 0, Hh); wg.addColorStop(0, sc.water); wg.addColorStop(1, '#06101e'); c.fillStyle = wg; c.fillRect(0, hz, W, Hh - hz);
    if (sc.sun) { c.fillStyle = sc.sun[2] + '55'; for (let y = hz + 4; y < Hh; y += 7) { const w = (1 - (y - hz) / (Hh - hz)) * 60 + 10; c.fillRect(sc.sun[0] * W - w / 2 + Math.sin(y) * 8, y, w, 2); } }
  } else { c.fillStyle = sc.near[1]; c.fillRect(0, hz, W, Hh - hz); }
  // near layer
  const nt = sc.near[0], nc = sc.near[1], base = sc.water ? hz + 4 : hz + 10;
  if (nt === 'pines' || nt === 'firs' || nt === 'snowpines') {
    for (let k = 0; k < 40; k++) { const x = r() * W, h = 40 + r() * (nt === 'firs' ? 120 : 90), w = h * (nt === 'firs' ? 0.22 : 0.32);
      c.fillStyle = nc; c.beginPath(); c.moveTo(x, base - h); c.lineTo(x + w, base); c.lineTo(x - w, base); c.closePath(); c.fill();
      if (nt === 'snowpines') { c.fillStyle = '#e8eef6'; c.beginPath(); c.moveTo(x, base - h); c.lineTo(x + w * 0.35, base - h * 0.62); c.lineTo(x - w * 0.35, base - h * 0.62); c.closePath(); c.fill(); } }
  } else if (nt === 'birches') {
    for (let k = 0; k < 26; k++) { const x = r() * W, h = 60 + r() * 100; c.fillStyle = '#3d5a32'; c.beginPath(); c.ellipse(x, base - h, 18 + r() * 14, 26 + r() * 16, 0, 0, TAU); c.fill(); c.fillStyle = '#e8e4da'; c.fillRect(x - 2, base - h, 4, h); c.fillStyle = '#222'; for (let y = base - h + 8; y < base; y += 14) c.fillRect(x - 2, y, 3, 2); }
  } else if (nt === 'cypress') {
    c.fillStyle = nc; for (let k = 0; k < 9; k++) { const x = r() * W, h = 70 + r() * 90; c.beginPath(); c.ellipse(x, base - h / 2, 9 + r() * 5, h / 2, 0, 0, TAU); c.fill(); }
  } else if (nt === 'lavender' || nt === 'sunflowers' || nt === 'grass') {
    for (let y = base; y < Hh; y += 9) {
      const t = (y - base) / (Hh - base);
      for (let x = (y / 9) % 2 * 6; x < W; x += 12 - t * 4) {
        if (nt === 'lavender') { c.fillStyle = t < 0.5 ? '#9b6bd0' : '#7b4fa8'; c.fillRect(x, y - 3 - t * 6, 3 + t * 3, 4 + t * 8); }
        else if (nt === 'sunflowers') { const s2 = 2 + t * 6; c.fillStyle = '#ffcc1a'; c.beginPath(); c.arc(x, y, s2, 0, TAU); c.fill(); c.fillStyle = '#5a3a14'; c.beginPath(); c.arc(x, y, s2 * 0.45, 0, TAU); c.fill(); }
        else { c.fillStyle = r() < 0.5 ? nc : sc.far[1]; c.fillRect(x, y - 2 - t * 5, 2, 3 + t * 6); }
      }
    }
  }
  return cv;
}
function sceneParticles(i) {
  sceneParts.length = 0;
  const a = SCENES[i].anim, n = { embers: 50, snow: 70, blizzard: 140, rain: 120, fireflies: 30, pollen: 40, butterflies: 12, balloons: 6, sparkle: 40, clouds: 6, mist: 5, fog: 6, waves: 30, aurora: 0 }[a] || 0;
  for (let k = 0; k < n; k++) sceneParts.push({ x: Math.random() * vw, y: Math.random() * vh, v: Math.random(), p: Math.random() * TAU, s: Math.random() });
}

// living details drawn on top of a scene each frame (positions in screen fractions)
const XR = srand(77), XS = { trees: [], birds: [], smoke: [], hearts: [] };
for (let k = 0; k < 22; k++) XS.trees.push({ x: XR(), h: 0.07 + XR() * 0.12, p: XR() * TAU, d: XR() });
XS.trees.sort((a, b) => a.h - b.h);
for (let k = 0; k < 5; k++) XS.birds.push({ x: XR(), y: 0.12 + XR() * 0.2, v: 0.02 + XR() * 0.02, p: XR() * TAU });
for (let k = 0; k < 45; k++) XS.smoke.push({ src: k % 3, age: XR(), s: XR() });
for (let k = 0; k < 6; k++) XS.hearts.push({ age: k / 6, s: XR() });
function pine(x, base, h, sway, col) {
  const w = h * 0.3; ctx.fillStyle = col;
  for (let tier = 0; tier < 3; tier++) {
    const ty = base - h * (0.18 + tier * 0.27), tw = w * (1 - tier * 0.25), top = ty - h * 0.42, sx = sway * (0.3 + tier * 0.35);
    ctx.beginPath(); ctx.moveTo(x + sx, top); ctx.lineTo(x + tw + sx * 0.4, ty); ctx.lineTo(x - tw + sx * 0.4, ty); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(x - h * 0.03, base - h * 0.2, h * 0.06, h * 0.2);
}
function waveFlag(x, y, w, h, t, stripes, vertical) {
  const seg = 10;
  for (let k = 0; k < seg; k++) {
    const u0 = k / seg, u1 = (k + 1) / seg, o0 = Math.sin(t * 4 - u0 * 5) * h * 0.12 * u0, o1 = Math.sin(t * 4 - u1 * 5) * h * 0.12 * u1;
    stripes.forEach((col, j) => {
      const v0 = j / stripes.length, v1 = (j + 1) / stripes.length;
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x + w * u0, y + o0 + h * v0); ctx.lineTo(x + w * u1 + 0.6, y + o1 + h * v0);
      ctx.lineTo(x + w * u1 + 0.6, y + o1 + h * v1 + 0.6); ctx.lineTo(x + w * u0, y + o0 + h * v1 + 0.6); ctx.closePath(); ctx.fill();
    });
  }
}
function flagPole(x, base, ph, fw, fh, t, stripes) {
  ctx.fillStyle = '#d8d2c8'; ctx.fillRect(x - 1.2, base - ph, 2.4, ph);
  ctx.beginPath(); ctx.arc(x, base - ph, 2.4, 0, TAU); ctx.fill();
  waveFlag(x + 1, base - ph + 2, fw, fh, t, stripes);
}
const PRIDE = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
function person(x, base, h, face, col, hair) {
  // simple standing silhouette facing +face (1 = right, -1 = left)
  const hw = h * 0.11;
  ctx.fillStyle = col;
  ctx.fillRect(x - hw * 0.8, base - h * 0.45, hw * 0.7, h * 0.45); ctx.fillRect(x + hw * 0.1, base - h * 0.45, hw * 0.7, h * 0.45);
  ctx.beginPath(); ctx.roundRect(x - hw, base - h * 0.82, hw * 2, h * 0.42, hw * 0.5); ctx.fill();
  ctx.beginPath(); ctx.arc(x + face * h * 0.04, base - h * 0.9, h * 0.1, 0, TAU); ctx.fill();
  if (hair) { ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x + face * h * 0.03, base - h * 0.93, h * 0.1, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
}
function heart(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.fill();
}
function drawExtra(kind, t) {
  const W = vw, H = vh, hz = H * 0.62, U = Math.min(W, H);
  if (kind === 'forest') {
    // birds crossing the sky
    ctx.strokeStyle = 'rgba(10,20,30,0.85)'; ctx.lineWidth = 1.6;
    for (const b of XS.birds) {
      const x = ((b.x + t * b.v) % 1.2 - 0.1) * W, y = b.y * H + Math.sin(t + b.p) * 6, f = Math.sin(t * 8 + b.p) * 4;
      ctx.beginPath(); ctx.moveTo(x - 7, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 7, y - f); ctx.stroke();
    }
    // back row of trees
    for (const tr of XS.trees) if (tr.d < 0.5) pine(tr.x * W, hz + 4, tr.h * H * 0.8, Math.sin(t * 0.9 + tr.p) * tr.h * H * 0.05, '#0c1d18');
    // front row of swaying trees
    for (const tr of XS.trees) if (tr.d >= 0.5) pine(tr.x * W, hz + 6, tr.h * H, Math.sin(t * 0.8 + tr.p) * tr.h * H * 0.06, '#061410');
    // a moose wandering along the shore
    const mph = (t * 0.008) % 2, mdir = mph < 1 ? 1 : -1, mx0 = (mph < 1 ? mph : 2 - mph) * 1.1 - 0.05; ctx.save(); ctx.translate(mx0 * W, 0); ctx.scale(mdir, 1); const mx = 0, my = hz + 8, mh = U * 0.06, step = Math.sin(t * 3);
    ctx.fillStyle = '#05100c';
    ctx.beginPath(); ctx.ellipse(mx, my - mh * 0.75, mh * 0.62, mh * 0.28, 0, 0, TAU); ctx.fill();
    for (const [lx, ph] of [[-0.45, 0], [-0.3, Math.PI], [0.35, Math.PI], [0.5, 0]]) {
      const sw = Math.sin(t * 3 + ph) * mh * 0.08; ctx.fillRect(mx + lx * mh + sw, my - mh * 0.55, mh * 0.08, mh * 0.55);
    }
    ctx.beginPath(); ctx.moveTo(mx + mh * 0.45, my - mh * 0.9); ctx.lineTo(mx + mh * 0.85, my - mh * (1.05 + step * 0.03)); ctx.lineTo(mx + mh * 1.0, my - mh * 0.8); ctx.lineTo(mx + mh * 0.55, my - mh * 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx + mh * 0.75, my - mh * 1.15, mh * 0.2, mh * 0.06, -0.3, 0, TAU); ctx.ellipse(mx + mh * 0.95, my - mh * 1.17, mh * 0.16, mh * 0.05, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
    // fireflies low in the forest
    for (let k = 0; k < 18; k++) {
      const x = ((k * 0.137 + Math.sin(t * 0.3 + k) * 0.03) % 1) * W, y = hz - 10 - (k % 5) * 12 + Math.cos(t * 0.7 + k) * 8, al = Math.max(0, Math.sin(t * 2 + k * 1.7));
      ctx.fillStyle = `rgba(220,255,130,${al * 0.9})`; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
    }
  } else if (kind === 'pride') {
    // rainbow flags along the shore
    for (const fx of [0.03, 0.17, 0.31, 0.5, 0.97]) flagPole(fx * W, hz + 2, U * 0.13, U * 0.07, U * 0.045, t + fx * 3, PRIDE);
    // jetty
    const jx0 = W * 0.79, jx1 = W * 0.99, jy = hz + H * 0.035;
    ctx.fillStyle = '#4a3122'; for (let x = jx0 + 6; x < jx1; x += 22) ctx.fillRect(x, jy, 4, H * 0.04);
    ctx.fillStyle = '#7a5236'; ctx.fillRect(jx0, jy - 4, jx1 - jx0, 6);
    // two men sharing a kiss at the end of the jetty
    const px = W * 0.88, ph = U * 0.11, lean = Math.sin(t * 0.8) * ph * 0.01;
    person(px - ph * 0.12 + lean, jy - 4, ph, 1, '#2a1f2e', '#1a1220');
    person(px + ph * 0.12 - lean, jy - 4, ph * 1.04, -1, '#1f2a3a', '#3a2a1a');
    ctx.fillStyle = '#2a1f2e'; ctx.fillRect(px - ph * 0.05, jy - 4 - ph * 0.72, ph * 0.16, ph * 0.06);
    // hearts drifting up
    for (const hz2 of XS.hearts) {
      const a = (hz2.age + t * 0.12) % 1, y = jy - ph * 1.1 - a * ph * 1.4, x = px + Math.sin(a * 6 + hz2.s * 6) * ph * 0.2;
      ctx.fillStyle = `rgba(255,${80 + (hz2.s * 60 | 0)},140,${(1 - a) * 0.9})`; heart(x, y, ph * (0.08 + a * 0.05));
    }
  } else if (kind === 'war') {
    // searchlights sweeping the smoky sky
    for (const [sx, sp] of [[0.12, 0.4], [0.85, -0.33]]) {
      const ang = -Math.PI / 2 + Math.sin(t * sp + sx * 7) * 0.55, L = H * 0.7, x0 = sx * W;
      const g = ctx.createLinearGradient(x0, hz, x0 + Math.cos(ang) * L, hz + Math.sin(ang) * L);
      g.addColorStop(0, 'rgba(255,240,200,0.22)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, hz);
      ctx.lineTo(x0 + Math.cos(ang - 0.05) * L, hz + Math.sin(ang - 0.05) * L); ctx.lineTo(x0 + Math.cos(ang + 0.05) * L, hz + Math.sin(ang + 0.05) * L); ctx.closePath(); ctx.fill();
    }
    // distant flashes on the horizon
    for (let k = 0; k < 4; k++) {
      const ph = (t * 0.35 + k * 0.29) % 1, al = ph < 0.08 ? 1 - ph / 0.08 : 0;
      if (al <= 0) continue;
      const x = ((k * 0.31 + Math.floor(t * 0.35 + k * 0.29) * 0.17) % 1) * W, R = U * 0.12;
      const g = ctx.createRadialGradient(x, hz, 0, x, hz, R); g.addColorStop(0, `rgba(255,200,120,${0.55 * al})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(x - R, hz - R, R * 2, R * 2);
    }
    // smoke columns rising from the skyline
    for (const p of XS.smoke) {
      const a = (p.age + t * 0.05) % 1, srcX = [0.1, 0.45, 0.8][p.src] * W, x = srcX + a * U * 0.25 + Math.sin(a * 5 + p.s * 6) * 10, y = hz - H * 0.08 - a * H * 0.45, R = U * (0.02 + a * 0.07);
      ctx.fillStyle = `rgba(${40 + p.s * 30 | 0},${38 + p.s * 25 | 0},${42 + p.s * 25 | 0},${0.45 * (1 - a)})`; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    }
    // the Ukrainian flag still flying over the sunflowers
    flagPole(W * 0.86, hz + H * 0.06, U * 0.2, U * 0.11, U * 0.07, t, ['#0057b7', '#ffd700']);
  }
}
function drawScenery() {
  const want = sceneFor();
  if (want !== sceneIdx) { scenePrev = sceneIdx; sceneIdx = want; sceneFade = 0; sceneParticles(want); }
  if (!sceneParts.length && SCENES[sceneIdx].anim !== 'aurora') sceneParticles(sceneIdx);
  sceneFade = Math.min(1, sceneFade + 0.012);
  // keep only the scenes on screen: each one is a full-screen bitmap (about 6 MB on a phone), and keeping every
  // visited one made memory grow through a long game. Scenes are drawn from a fixed seed, so a rebuilt one is identical.
  for (const k in sceneCache) if (+k !== sceneIdx && (sceneFade >= 1 || +k !== scenePrev)) delete sceneCache[k];
  const get = k => sceneCache[k] || (heavyFrame = true, sceneCache[k] = buildScene(k));
  if (sceneFade < 1) ctx.drawImage(get(scenePrev), 0, 0, vw, vh);
  ctx.globalAlpha = sceneFade; ctx.drawImage(get(sceneIdx), 0, 0, vw, vh); ctx.globalAlpha = 1;
  if (lowFx()) return;
  const xt = SCENES[sceneIdx].extra;
  if (xt) { ctx.save(); ctx.globalAlpha = sceneFade; drawExtra(xt, reduceMotion ? 0 : time); ctx.restore(); }
  if (reduceMotion) return;
  const a = SCENES[sceneIdx].anim, hz = vh * 0.62, t = time;
  if (a === 'aurora') {
    for (let band = 0; band < 3; band++) {
      ctx.beginPath(); ctx.moveTo(0, vh * 0.1);
      for (let x = 0; x <= vw; x += 16) ctx.lineTo(x, vh * (0.12 + band * 0.06) + Math.sin(x / 140 + t * 0.6 + band) * 26 + Math.sin(x / 60 - t * 0.9) * 8);
      ctx.lineTo(vw, vh * 0.42); ctx.lineTo(0, vh * 0.42); ctx.closePath();
      const ag = ctx.createLinearGradient(0, vh * 0.08, 0, vh * 0.42);
      ag.addColorStop(0, band === 1 ? 'rgba(170,90,255,0.22)' : 'rgba(80,255,170,0.24)'); ag.addColorStop(1, 'rgba(80,255,170,0)');
      ctx.fillStyle = ag; ctx.fill();
    }
    return;
  }
  for (const q of sceneParts) {
    if (a === 'snow' || a === 'blizzard') {
      q.y += (0.4 + q.v) * (a === 'blizzard' ? 2.4 : 1); q.x += Math.sin(t + q.p) * 0.5 + (a === 'blizzard' ? 1.6 : 0);
      if (q.y > vh) { q.y = -5; q.x = Math.random() * vw; } if (q.x > vw) q.x = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(q.x, q.y, 1 + q.s * 2, 0, TAU); ctx.fill();
    } else if (a === 'embers') {
      q.y -= 0.3 + q.v * 0.7; q.x += Math.sin(t * 1.3 + q.p) * 0.5; if (q.y < vh * 0.2) { q.y = vh * 0.62 + Math.random() * 30; q.x = Math.random() * vw; }
      ctx.fillStyle = `rgba(255,${140 + (q.s * 80 | 0)},60,${0.35 + 0.5 * Math.abs(Math.sin(t * 2 + q.p))})`; ctx.fillRect(q.x, q.y, 2, 2);
    } else if (a === 'rain') {
      q.y += 9 + q.v * 6; q.x -= 1.5; if (q.y > vh) { q.y = -10; q.x = Math.random() * vw + 40; }
      ctx.strokeStyle = 'rgba(210,225,240,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + 2, q.y - 10); ctx.stroke();
    } else if (a === 'fireflies' || a === 'pollen' || a === 'sparkle') {
      const x = q.x + Math.sin(t * 0.5 + q.p) * 20, y = (a === 'sparkle' ? hz + 10 + q.s * (vh - hz) : q.y) + Math.cos(t * 0.4 + q.p) * 14;
      const al = a === 'sparkle' ? Math.max(0, Math.sin(t * 3 + q.p * 5)) : 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + q.p));
      ctx.fillStyle = a === 'fireflies' ? `rgba(220,255,120,${al})` : a === 'pollen' ? `rgba(255,240,180,${al * 0.7})` : `rgba(255,255,255,${al})`;
      ctx.beginPath(); ctx.arc(x, y, a === 'sparkle' ? 1.5 : 2 + q.s * 1.5, 0, TAU); ctx.fill();
    } else if (a === 'butterflies') {
      q.x += 0.6 + q.v * 0.6; q.y += Math.sin(t * 2 + q.p) * 0.6; if (q.x > vw + 10) { q.x = -10; q.y = hz - 40 + Math.random() * 120; }
      const f = Math.abs(Math.sin(t * 10 + q.p)) * 5 + 1; ctx.fillStyle = q.s < 0.5 ? '#ffffff' : '#ffd84d';
      ctx.beginPath(); ctx.ellipse(q.x - 3, q.y, f, 4, 0, 0, TAU); ctx.ellipse(q.x + 3, q.y, f, 4, 0, 0, TAU); ctx.fill();
    } else if (a === 'balloons') {
      q.y -= 0.15 + q.v * 0.2; q.x += 0.1; if (q.y < -60) { q.y = vh * 0.7; q.x = Math.random() * vw; }
      const R = 10 + q.s * 14, cols = ['#e01e37', '#ffcc00', '#3a6fd8', '#2bb36b'];
      ctx.fillStyle = cols[Math.floor(q.p) % 4]; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(q.x - R * 0.25, q.y + R * 1.25, R * 0.5, R * 0.4);
      ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x - R * 0.7, q.y + R * 0.6); ctx.lineTo(q.x - R * 0.25, q.y + R * 1.25); ctx.moveTo(q.x + R * 0.7, q.y + R * 0.6); ctx.lineTo(q.x + R * 0.25, q.y + R * 1.25); ctx.stroke();
    } else if (a === 'clouds' || a === 'mist' || a === 'fog') {
      q.x += (a === 'clouds' ? 0.25 : 0.15) * (0.5 + q.v); if (q.x > vw + 200) q.x = -200;
      const y = a === 'clouds' ? vh * (0.08 + q.s * 0.3) : hz - 30 + q.s * 70, w = 120 + q.v * 160;
      ctx.fillStyle = a === 'clouds' ? 'rgba(255,255,255,0.75)' : 'rgba(225,232,240,0.18)';
      ctx.beginPath(); ctx.ellipse(q.x, y, w, a === 'clouds' ? 20 + q.s * 10 : 24, 0, 0, TAU); ctx.fill();
      if (a === 'clouds') { ctx.beginPath(); ctx.ellipse(q.x - w * 0.3, y - 10, w * 0.4, 18, 0, 0, TAU); ctx.ellipse(q.x + w * 0.25, y - 14, w * 0.35, 20, 0, 0, TAU); ctx.fill(); }
    } else if (a === 'waves') {
      const y = hz + 8 + q.s * (vh - hz - 8), x = (q.x + t * 12 * (0.5 + q.v)) % (vw + 60) - 30;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 8 + q.v * 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
  }
}
