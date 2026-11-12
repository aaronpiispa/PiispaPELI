'use strict';
// The roulette: the special button spins a wheel of five outcomes: a joker ball 1 time in 10, the other four equally often. Whatever comes up,
// the wall buttons are shielded while the wheel spins and for 2.5 seconds after it, so they cannot be pressed down.

const ROU = [
  { id: 'swing', name: 'HEILAUTUS!', col: '#ffcc00', dark: '#b58f00' },
  { id: 'hole', name: 'MUSTA AUKKO!', col: '#7a5cff', dark: '#3a2a8a' },
  { id: 'magnet', name: 'MAGNEETTI!', col: '#ff4d6d', dark: '#9a1e34' },
  { id: 'none', name: 'EI MITÄÄN!', col: '#9aa7c4', dark: '#4f5b78' },
  { id: 'joker', name: 'JOKERI!', col: '#ff8ad8', dark: '#8a2a8a' }
];
// how likely each outcome is; each slice of the wheel is as wide as its chance
const ROU_W = [0.225, 0.225, 0.225, 0.225, 0.1];
const rouStart = k => ROU_W.slice(0, k).reduce((a, w) => a + w, 0) * TAU;
// the next ball to shoot is a joker: it merges with any ball it touches
let jokerNext = false;
const ROU_SPIN = 1.7, ROU_HOLD = 0.55, SHIELD_T = 2.5, HOLE_T = 2.2, MAG_T = 0.9;
const HOLE_X = WORLD_W / 2, HOLE_Y = 11.5, HOLE_MAX = 8;
// rouT: time left of spin + hold; rouPick: the outcome; rouA: the wheel's angle when it stops
let rouT = 0, rouPick = 0, rouA1 = 0, shieldT = 0, holeT = 0, holeIds = [], magT = 0, magPairs = [];

const rouBusy = () => rouT > 0 || wobT > 0 || holeT > 0 || magT > 0;
// the shield is up while the wheel spins and for a moment after the effect
const shieldOn = () => rouT > 0 || shieldT > 0;

function rouletteReset() { jokerNext = false; rouT = 0; shieldT = 0; holeT = 0; holeIds = []; magT = 0; magPairs = []; }

function spinRoulette() {
  let r = Math.random(); rouPick = 0;
  while (rouPick < ROU_W.length - 1 && r >= ROU_W[rouPick]) { r -= ROU_W[rouPick]; rouPick++; }
  rouT = ROU_SPIN + ROU_HOLD;
  // the wheel turns a few times and stops with the chosen slice under the pointer at the top
  const w = ROU_W[rouPick] * TAU;
  rouA1 = -(rouStart(rouPick) + w / 2) + (Math.random() - 0.5) * w * 0.6 - TAU * 4;
  sfx.whoosh();
}

function rouletteStep() {
  if (shieldT > 0) shieldT = Math.max(0, shieldT - STEP);
  if (rouT > 0) {
    const before = rouT;
    rouT -= STEP;
    // a tick each time a slice edge passes the pointer
    const a0 = rouAngle(before), a1 = rouAngle(rouT), slice = TAU / ROU.length;
    if (Math.floor(a0 / slice) !== Math.floor(a1 / slice) && sfx.tick) sfx.tick();
    if (rouT <= 0) { rouT = 0; applyRoulette(ROU[rouPick].id); }
  }
  holeStep(); magnetStep();
}
// the wheel's angle as it slows down (rouT counts down through the spin, then the hold)
function rouAngle(t) {
  const p = Math.min(1, Math.max(0, (ROU_SPIN + ROU_HOLD - t) / ROU_SPIN)), e = 1 - Math.pow(1 - p, 3);
  return rouA1 * e;
}

function applyRoulette(id) {
  shieldT = SHIELD_T; dangerT = 0;
  const r = ROU.find(o => o.id === id);
  floater(T(r.name), WORLD_W / 2, 7, r.col, 30);
  mascotBounce = 1;
  if (id === 'swing') {
    wobT = 1.4;
    // throw everything up a bit, then rock the wagon from side to side
    for (const b of E.blobs) {
      const kick = 12 + Math.random() * 12, side = (Math.random() - 0.5) * 12;
      for (let i = b.start; i < b.start + b.n; i++) { VY[i] -= kick; VX[i] += side; }
    }
    if (!reduceMotion) shake = Math.max(shake, 0.35);
    sfx.mega();
  } else if (id === 'hole') {
    // it swallows the smallest balls (at most HOLE_MAX, and never more than half of them)
    const cand = E.blobs.filter(b => !isSpecial(b.level)).sort((a, b) => a.level - b.level);
    const eat = cand.slice(0, Math.min(HOLE_MAX, Math.floor(cand.length / 2)));
    eat.forEach(b => { b.merging = true; });   // on their way into the hole they no longer merge with anything
    holeIds = eat.map(b => b.id);
    holeT = HOLE_T; sfx.mega();
  } else if (id === 'magnet') {
    // pairs up balls of the same kind and pulls each pair together; the pairs merge when they meet
    const by = {};
    for (const b of E.blobs) if (!isSpecial(b.level) && b.level < MAXL) (by[b.level] = by[b.level] || []).push(b);
    magPairs = [];
    for (const l in by) { const g = by[l]; for (let k = 0; k + 1 < g.length; k += 2) magPairs.push([g[k].id, g[k + 1].id]); }
    magT = MAG_T; sfx.mega();
  } else if (id === 'joker') {
    jokerNext = true; popT = 0; sfx.mega();
  } else {
    sfx.blocked();
  }
  syncAbil();
}

function holeSparks(x, y) {
  const cols = ['#7a5cff', '#c9b8ff', '#2a1a5a', '#ffffff'];
  for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, sp = rand(2, 5), life = rand(0.3, 0.6);
    parts.push({ k: 0, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(0.05, 0.1), life, max: life, c: cols[i % 4] }); }
}
const blobById = id => E.blobs.find(b => b.id === id && b.alive);
function pullBlob(b, tx, ty, k) {
  const dx = tx - b.cx, dy = ty - b.cy, d = Math.hypot(dx, dy) || 1, v = Math.min(26, 6 + d * 4) * k;
  for (let i = b.start, e = b.start + b.n; i < e; i++) { VX[i] = VX[i] * 0.8 + dx / d * v * 0.2; VY[i] = VY[i] * 0.8 + dy / d * v * 0.2; }
}

function holeStep() {
  if (holeT <= 0) return;
  holeT -= STEP;
  let left = 0;
  for (const id of holeIds) {
    const b = blobById(id);
    if (!b) continue;
    const d = Math.hypot(b.cx - HOLE_X, b.cy - HOLE_Y);
    if (d < 0.5 + b.R * 0.3 || holeT <= 0) {
      // swallowed: a few points and a puff of dark sparks
      const pts = (b.level + 1) * 10;
      score += pts; floater('+' + pts, HOLE_X, HOLE_Y - 1, '#c9b8ff', 16);
      holeSparks(b.cx, b.cy);
      removeBlob(b); sfx.pop();
      continue;
    }
    left++;
    pullBlob(b, HOLE_X, HOLE_Y, 1);
  }
  if (holeT <= 0 || !left) { holeT = Math.min(holeT, 0.35); if (holeT <= 0) { holeT = 0; holeIds = []; syncAbil(); } }
}

function magnetStep() {
  if (magT <= 0) return;
  magT -= STEP;
  for (const [ia, ib] of magPairs) {
    const a = blobById(ia), b = blobById(ib);
    if (!a || !b) continue;
    const mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
    pullBlob(a, mx, my, 1.4); pullBlob(b, mx, my, 1.4);
    // when the pull is over, any pair that has not met yet merges anyway
    if (magT <= 0) E.mergeQ.push(a, b);
  }
  if (magT <= 0) { magT = 0; magPairs = []; syncAbil(); }
}

// ---------- drawing ----------
function drawRoulette() {
  if (rouT <= 0) return;
  const cx = WORLD_W / 2, cy = 8.4, R = 2.5, a = rouAngle(rouT) - Math.PI / 2;
  const appear = Math.min(1, (ROU_SPIN + ROU_HOLD - rouT) / 0.18), fade = Math.min(1, rouT / 0.2);
  ctx.save(); ctx.globalAlpha = Math.min(appear, fade);
  ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * appear, 0.6 + 0.4 * appear);
  // rim and shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(0.06, 0.12, R + 0.25, 0, TAU); ctx.fill();
  const rg = ctx.createLinearGradient(0, -R, 0, R); rg.addColorStop(0, '#ffe680'); rg.addColorStop(1, '#b58f00');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, R + 0.22, 0, TAU); ctx.fill();
  for (let k = 0; k < ROU.length; k++) {
    const slice = ROU_W[k] * TAU, s0 = a + rouStart(k), o = ROU[k], win = rouT <= ROU_HOLD && k === rouPick;
    const g = ctx.createRadialGradient(0, 0, 0.2, 0, 0, R); g.addColorStop(0, o.col); g.addColorStop(1, o.dark);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, s0, s0 + slice); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.05; ctx.stroke();
    if (win) { ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * Math.sin(time * 20)})`; ctx.fill(); }
    const m = s0 + slice / 2;
    rouIcon(o.id, Math.cos(m) * R * 0.62, Math.sin(m) * R * 0.62, o.id === 'joker' ? 0.5 : 0.62);
  }
  // shine and hub
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-R * 0.25, -R * 0.45, R * 0.6, R * 0.3, -0.4, 0, TAU); ctx.fill();
  const hg = ctx.createRadialGradient(-0.1, -0.1, 0.02, 0, 0, 0.42); hg.addColorStop(0, '#fff6c0'); hg.addColorStop(1, '#c99a00');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, 0.4, 0, TAU); ctx.fill();
  // the pointer at the top
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0a1c47'; ctx.lineWidth = 0.07;
  ctx.beginPath(); ctx.moveTo(0, -R + 0.45); ctx.lineTo(-0.36, -R - 0.42); ctx.lineTo(0.36, -R - 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// a small picture for each outcome
function rouIcon(id, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (id === 'swing') {
    // a wagon rocking: two curved arrows
    ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.arc(0, s * 0.35, s * 0.62, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    for (const d of [-1, 1]) { const ax = d * s * 0.56, ay = s * 0.05; ctx.beginPath(); ctx.moveTo(ax - d * s * 0.2, ay - s * 0.18); ctx.lineTo(ax, ay); ctx.lineTo(ax - d * s * 0.26, ay + s * 0.08); ctx.stroke(); }
    ctx.fillStyle = '#3a2a00'; ctx.beginPath(); ctx.roundRect(-s * 0.36, s * 0.12, s * 0.72, s * 0.34, s * 0.08); ctx.fill();
  } else if (id === 'hole') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6); g.addColorStop(0, '#000'); g.addColorStop(0.55, '#000'); g.addColorStop(0.75, '#e0d4ff'); g.addColorStop(1, 'rgba(224,212,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.2, -0.4, 0, TAU); ctx.stroke();
  } else if (id === 'magnet') {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.34; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.38); ctx.lineTo(-s * 0.3, 0); ctx.arc(0, 0, s * 0.3, Math.PI, 0, true); ctx.lineTo(s * 0.3, -s * 0.38); ctx.stroke();
    ctx.strokeStyle = '#c8d0e0'; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.5); ctx.lineTo(-s * 0.3, -s * 0.3); ctx.moveTo(s * 0.3, -s * 0.5); ctx.lineTo(s * 0.3, -s * 0.3); ctx.stroke();
  } else if (id === 'joker') {
    drawJokerBall(0, 0, s * 0.55, 0);
  } else {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.18;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.3, s * 0.3); ctx.stroke();
  }
  ctx.restore();
}
function drawBlackHole() {
  if (holeT <= 0) return;
  const k = Math.min(1, (HOLE_T - holeT) / 0.3, holeT / 0.35), r = 1.7 * k;
  ctx.save();
  const g = ctx.createRadialGradient(HOLE_X, HOLE_Y, 0, HOLE_X, HOLE_Y, r * 2.4);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.38, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(200,180,255,0.9)'); g.addColorStop(0.7, 'rgba(122,92,255,0.35)'); g.addColorStop(1, 'rgba(122,92,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(HOLE_X, HOLE_Y, r * 2.4, 0, TAU); ctx.fill();
  // swirling arms
  ctx.strokeStyle = "rgba(220,210,255,0.6)"; ctx.lineWidth = 0.1;
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    for (let u = 0; u <= 1; u += 0.05) { const ang = time * 4 + j * TAU / 4 + u * 3, rr = r * (0.9 + u * 1.4); u ? ctx.lineTo(HOLE_X + Math.cos(ang) * rr, HOLE_Y + Math.sin(ang) * rr) : ctx.moveTo(HOLE_X + Math.cos(ang) * rr, HOLE_Y + Math.sin(ang) * rr); }
    ctx.stroke();
  }
  ctx.restore();
}
function drawMagnet() {
  if (magT <= 0) return;
  ctx.save(); ctx.strokeStyle = 'rgba(255,90,120,0.6)'; ctx.lineWidth = 0.07; ctx.setLineDash([0.2, 0.18]); ctx.lineDashOffset = -time * 3;
  for (const [ia, ib] of magPairs) {
    const a = blobById(ia), b = blobById(ib);
    if (!a || !b) continue;
    ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke();
  }
  ctx.restore();
}
// the shields over the wall buttons: a shimmering bubble of light hexagons
function drawShields() {
  if (!shieldOn()) return;
  const left = rouT > 0 ? SHIELD_T : shieldT, a = Math.min(1, left / 0.5) * (left < 0.8 ? 0.6 + 0.4 * Math.sin(time * 30) : 1);
  for (const side of [0, 1]) {
    const x = side ? WORLD_W : 0, dir = side ? -1 : 1, rx = 1.05, ry = BTN_H * 0.78;
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.ellipse(x, BTN_Y, rx, ry, 0, side ? Math.PI / 2 : -Math.PI / 2, side ? Math.PI * 1.5 : Math.PI / 2); ctx.closePath();
    const g = ctx.createRadialGradient(x, BTN_Y, 0.2, x, BTN_Y, ry);
    g.addColorStop(0, 'rgba(120,220,255,0.05)'); g.addColorStop(0.75, 'rgba(120,220,255,0.22)'); g.addColorStop(1, 'rgba(180,240,255,0.55)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(200,245,255,0.95)'; ctx.lineWidth = 0.07; ctx.stroke();
    ctx.clip();
    // hexagon pattern
    ctx.strokeStyle = 'rgba(200,245,255,0.35)'; ctx.lineWidth = 0.03;
    const h = 0.32;
    for (let row = -6; row <= 6; row++) for (let col = 0; col < 4; col++) {
      const hx = x + dir * (col * h * 1.5 + 0.1), hy = BTN_Y + row * h * 0.87 * 2 + (col % 2) * h * 0.87;
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; k ? ctx.lineTo(hx + Math.cos(an) * h, hy + Math.sin(an) * h) : ctx.moveTo(hx + Math.cos(an) * h, hy + Math.sin(an) * h); } ctx.closePath(); ctx.stroke();
    }
    // a bright sweep moving down the shield
    const sy = BTN_Y - ry + ((time * 1.6) % 1) * ry * 2;
    const sg = ctx.createLinearGradient(0, sy - 0.4, 0, sy + 0.4); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(x - 2, sy - 0.4, 4, 0.8);
    ctx.restore();
  }
}

// the joker ball: rainbow swirls, a gold star and a cheeky face
function jokerFill(x, y, R, ang) {
  const g = ctx.createConicGradient ? ctx.createConicGradient(ang + time * 1.5, x, y) : null;
  if (g) { ['#ff4d6d', '#ffb13b', '#ffe94d', '#4dd97a', '#3ab8ff', '#8a6bff', '#ff4dd2', '#ff4d6d'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c)); return g; }
  return '#ff8ad8';
}
function drawJokerBall(x, y, R, ang) {
  ctx.save();
  ctx.fillStyle = jokerFill(x, y, R, ang);
  ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  const sh = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.05, x, y, R);
  sh.addColorStop(0, 'rgba(255,255,255,0.75)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  ctx.lineWidth = Math.max(0.03, R * 0.06); ctx.strokeStyle = 'rgba(60,20,80,0.6)'; ctx.stroke();
  // a little gold star on top and a grin
  ctx.fillStyle = '#ffd84d'; starPath(ctx, x, y - R * 0.42, R * 0.3, R * 0.13); ctx.fill();
  ctx.fillStyle = '#1b1030';
  ctx.beginPath(); ctx.ellipse(x - R * 0.28, y + R * 0.05, R * 0.08, R * 0.12, 0, 0, TAU); ctx.ellipse(x + R * 0.28, y + R * 0.05, R * 0.08, R * 0.12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1b1030'; ctx.lineWidth = R * 0.08; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + R * 0.2, R * 0.3, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.restore();
}
