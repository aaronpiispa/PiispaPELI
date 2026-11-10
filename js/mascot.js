// PiispanPELI · The mascot character drawn on canvas (also used to render the app icons).
'use strict';

// <mascot>
function drawMascot(c, cx, cy, s, t, bounce) {
  const skin = '#f2c7ab', skinD = '#d99c82';
  const by = cy - Math.abs(Math.sin(t * 2.2)) * s * 0.05 - (bounce || 0) * s * 0.25;
  c.save();
  const L = (typeof look !== 'undefined' && look) || { hat: 'bonnet', glasses: 'none', neck: 'chain' };
  // shoulders
  c.fillStyle = skin;
  c.beginPath(); c.ellipse(cx, by + s * 1.55, s * 1.05, s * 0.55, 0, Math.PI, 0); c.fill();
  // neck + head
  c.fillStyle = skin; c.fillRect(cx - s * 0.28, by + s * 0.6, s * 0.56, s * 0.55);
  c.beginPath(); c.ellipse(cx - s * 0.8, by + s * 0.08, s * 0.13, s * 0.2, 0, 0, Math.PI * 2); c.ellipse(cx + s * 0.8, by + s * 0.08, s * 0.13, s * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(cx, by + s * 0.05, s * 0.8, s * 0.92, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = s * 0.035; c.strokeStyle = skinD; c.stroke();
  mNeck(c, L.neck, cx, by, s, t);
  if (L.hat !== 'bonnet') { c.fillStyle = '#7a4a32'; c.beginPath(); c.ellipse(cx, by - s * 0.45, s * 0.78, s * 0.5, 0, Math.PI, 0); c.fill(); }
  // sleepy eyes with heavy lids, blinking now and then
  const blink = (t % 4.3) < 0.14;
  for (const sx of [-1, 1]) {
    const ex = cx + sx * s * 0.3, ey = by + s * 0.0;
    if (blink) { c.strokeStyle = '#6b4235'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(ex - s * 0.14, ey); c.quadraticCurveTo(ex, ey + s * 0.05, ex + s * 0.14, ey); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, s * 0.15, s * 0.085, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5b3a2c'; c.beginPath(); c.arc(ex + Math.sin(t * 0.7) * s * 0.03, ey + s * 0.02, s * 0.065, 0, Math.PI * 2); c.fill();
    c.fillStyle = skin; c.beginPath(); c.ellipse(ex, ey - s * 0.04, s * 0.17, s * 0.07, 0, Math.PI, 0); c.fill();
    c.strokeStyle = '#6b4235'; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(ex - s * 0.16, ey - s * 0.03); c.quadraticCurveTo(ex, ey - s * 0.07, ex + s * 0.16, ey - s * 0.03); c.stroke();
    c.strokeStyle = 'rgba(140,95,70,0.7)'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(ex - s * 0.15, ey - s * 0.2); c.quadraticCurveTo(ex, ey - s * 0.25, ex + s * 0.15, ey - s * 0.19); c.stroke();
  }
  // nose, blush
  c.strokeStyle = skinD; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(cx - s * 0.03, by + s * 0.1); c.quadraticCurveTo(cx - s * 0.1, by + s * 0.27, cx + s * 0.04, by + s * 0.28); c.stroke();
  c.fillStyle = 'rgba(240,120,140,0.3)'; c.beginPath(); c.ellipse(cx - s * 0.5, by + s * 0.3, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); c.ellipse(cx + s * 0.5, by + s * 0.3, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); c.fill();
  // pouty pink lips that pucker every few seconds
  const puck = (typeof nelliT !== 'undefined' && nelliT > 0) ? 1 : Math.max(0, Math.sin(t * 1.6)) ** 6, lw = s * (0.21 - puck * 0.07), lh = s * (0.085 + puck * 0.04), ly = by + s * 0.5;
  c.fillStyle = '#d4566f'; c.beginPath(); c.ellipse(cx, ly + lh * 0.45, lw, lh, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e06a82'; c.beginPath(); c.ellipse(cx - lw * 0.42, ly - lh * 0.15, lw * 0.55, lh * 0.75, 0, 0, Math.PI * 2); c.ellipse(cx + lw * 0.42, ly - lh * 0.15, lw * 0.55, lh * 0.75, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(cx + lw * 0.3, ly + lh * 0.6, lw * 0.25, lh * 0.2, 0, 0, Math.PI * 2); c.fill();
  mGlasses(c, L.glasses, cx, by, s, t);
  if (L.hat !== 'bonnet') { mHat(c, L.hat, cx, by, s, t); c.restore(); return; }
  // big satin bonnet that wobbles
  c.save();
  c.translate(cx, by - s * 0.55); c.rotate(Math.sin(t * 2.6) * 0.06); c.scale(1 + Math.sin(t * 4.1) * 0.03, 1 - Math.sin(t * 4.1) * 0.03);
  const pink = '#f5b6c0', pinkD = '#e293a1';
  c.fillStyle = pink;
  c.beginPath(); c.ellipse(0, -s * 0.38, s * 1.12, s * 0.62, 0, 0, Math.PI * 2); c.fill();
  for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; c.beginPath(); c.arc(Math.cos(a) * s * 1.02, -s * 0.3 + Math.sin(a) * s * 0.52, s * 0.25, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = s * 0.04;
  for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * s * 0.27, -s * 0.05); c.quadraticCurveTo(k * s * 0.33, -s * 0.5, k * s * 0.22, -s * 0.85); c.stroke(); }
  c.fillStyle = pinkD; c.beginPath(); c.ellipse(0, s * 0.02, s * 0.86, s * 0.17, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f0a9b5'; c.fillRect(-s * 0.84, -s * 0.03, s * 1.68, s * 0.1);
  c.restore();
  c.restore();
}
function mHeart(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.35); c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45); c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); c.closePath(); }
function mStar(c, x, y, r1, r2) { c.beginPath(); for (let p = 0; p < 10; p++) { const r = p % 2 ? r2 : r1, a = -Math.PI / 2 + p * Math.PI / 5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
function mNeck(c, k, cx, by, s, t) {
  c.lineCap = 'round';
  if (k === 'chain') {
    c.strokeStyle = '#e2b13c'; c.lineWidth = s * 0.07;
    c.beginPath(); c.moveTo(cx - s * 0.55, by + s * 1.08); c.quadraticCurveTo(cx, by + s * 1.62, cx + s * 0.55, by + s * 1.08); c.stroke();
  } else if (k === 'scarf') {
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(cx, by + s * 1.05, s * 0.55, s * 0.17, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#003580'; c.fillRect(cx - s * 0.55, by + s * 1.0, s * 1.1, s * 0.09);
    c.fillStyle = '#ffffff'; c.save(); c.translate(cx + s * 0.3, by + s * 1.1); c.rotate(0.25 + Math.sin(t * 3) * 0.08); c.fillRect(-s * 0.1, 0, s * 0.2, s * 0.5); c.fillStyle = '#003580'; c.fillRect(-s * 0.1, s * 0.2, s * 0.2, s * 0.08); c.restore();
  } else if (k === 'bowtie') {
    c.fillStyle = '#e01e37';
    c.beginPath(); c.moveTo(cx, by + s * 1.12); c.lineTo(cx - s * 0.3, by + s * 0.98); c.lineTo(cx - s * 0.3, by + s * 1.26); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx, by + s * 1.12); c.lineTo(cx + s * 0.3, by + s * 0.98); c.lineTo(cx + s * 0.3, by + s * 1.26); c.closePath(); c.fill();
    c.fillStyle = '#9e1f1f'; c.beginPath(); c.arc(cx, by + s * 1.12, s * 0.07, 0, Math.PI * 2); c.fill();
  } else if (k === 'pearls') {
    c.fillStyle = '#fbf8f2'; c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = s * 0.01;
    for (let i = 0; i <= 12; i++) { const u = i / 12, x = (u * 2 - 1) * 0.6, y = 1.05 + 0.4 * (1 - (u * 2 - 1) ** 2); c.beginPath(); c.arc(cx + x * s, by + y * s, s * 0.055, 0, Math.PI * 2); c.fill(); c.stroke(); }
  } else if (k === 'medal') {
    c.strokeStyle = '#3a6fd8'; c.lineWidth = s * 0.09;
    c.beginPath(); c.moveTo(cx - s * 0.45, by + s * 1.0); c.lineTo(cx, by + s * 1.4); c.lineTo(cx + s * 0.45, by + s * 1.0); c.stroke();
    c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(cx, by + s * 1.48, s * 0.17, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; mStar(c, cx, by + s * 1.48, s * 0.1, s * 0.045); c.fill();
  }
}
function mGlasses(c, k, cx, by, s, t) {
  if (k === 'none') return;
  const ey = by, L = cx - s * 0.3, R = cx + s * 0.3;
  c.lineWidth = s * 0.04; c.strokeStyle = '#1b1e2a';
  if (k === 'sun') {
    c.fillStyle = 'rgba(15,15,25,0.92)';
    for (const x of [L, R]) { c.beginPath(); c.ellipse(x, ey + s * 0.01, s * 0.2, s * 0.13, 0, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); c.moveTo(L + s * 0.2, ey - s * 0.02); c.lineTo(R - s * 0.2, ey - s * 0.02); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(L - s * 0.1, ey - s * 0.06, s * 0.06, s * 0.03); c.fillRect(R - s * 0.1, ey - s * 0.06, s * 0.06, s * 0.03);
  } else if (k === 'round') {
    for (const x of [L, R]) { c.beginPath(); c.arc(x, ey, s * 0.18, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(L + s * 0.18, ey); c.lineTo(R - s * 0.18, ey); c.stroke();
  } else if (k === 'star') {
    c.fillStyle = 'rgba(255,204,0,0.35)'; c.strokeStyle = '#d4a000';
    for (const x of [L, R]) { mStar(c, x, ey, s * 0.26, s * 0.13); c.fill(); c.stroke(); }
  } else if (k === 'heart') {
    c.fillStyle = 'rgba(255,77,125,0.55)'; c.strokeStyle = '#e01e37';
    for (const x of [L, R]) { mHeart(c, x, ey + s * 0.06, s * 0.27); c.fill(); c.stroke(); }
  } else if (k === 'mono') {
    c.strokeStyle = '#c99a00'; c.beginPath(); c.arc(R, ey, s * 0.19, 0, Math.PI * 2); c.stroke();
    c.lineWidth = s * 0.015; c.beginPath(); c.moveTo(R + s * 0.18, ey + s * 0.06); c.quadraticCurveTo(R + s * 0.5, ey + s * 0.6, R + s * 0.2, ey + s * 1.0); c.stroke();
  }
}
function mHat(c, k, cx, by, s, t) {
  if (k === 'none') return;
  const top = by - s * 0.55, sway = Math.sin(t * 2.6) * 0.04;
  c.save(); c.translate(cx, top); c.rotate(sway);
  if (k === 'cap') {
    c.fillStyle = '#e01e37'; c.beginPath(); c.arc(0, 0, s * 0.82, Math.PI, 0); c.fill();
    c.fillStyle = '#9e1f1f'; c.beginPath(); c.ellipse(s * 0.35, s * 0.02, s * 0.75, s * 0.13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.font = `800 ${s * 0.38}px sans-serif`; c.textAlign = 'center'; c.fillText('P', 0, -s * 0.25);
  } else if (k === 'beanie') {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, s * 0.85, Math.PI, 0); c.fill();
    c.fillStyle = '#003580'; c.fillRect(-s * 0.85, -s * 0.12, s * 1.7, s * 0.2); c.fillRect(-s * 0.12, -s * 0.85, s * 0.24, s * 0.75);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -s * 0.9, s * 0.18, 0, Math.PI * 2); c.fill();
  } else if (k === 'beret') {
    c.fillStyle = '#1d2240'; c.beginPath(); c.ellipse(s * 0.12, -s * 0.18, s * 0.98, s * 0.4, -0.12, 0, Math.PI * 2); c.fill();
    c.fillRect(s * 0.05, -s * 0.66, s * 0.08, s * 0.14);
  } else if (k === 'ushanka') {
    c.fillStyle = '#7a5236'; c.beginPath(); c.arc(0, 0, s * 0.9, Math.PI, 0); c.fill();
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.8, s * 0.45, s * 0.22, s * 0.5, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#a77a55'; c.fillRect(-s * 0.92, -s * 0.2, s * 1.84, s * 0.26);
    c.fillStyle = '#cc0000'; mStar(c, 0, -s * 0.5, s * 0.17, s * 0.07); c.fill();
  } else if (k === 'viking') {
    c.fillStyle = '#f2ead8'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.6, -s * 0.2); c.quadraticCurveTo(d * s * 1.35, -s * 0.5, d * s * 1.15, -s * 1.15); c.quadraticCurveTo(d * s * 1.0, -s * 0.6, d * s * 0.55, -s * 0.5); c.fill(); }
    c.fillStyle = '#9aa3b5'; c.beginPath(); c.arc(0, 0, s * 0.84, Math.PI, 0); c.fill();
    c.fillStyle = '#6c7487'; c.fillRect(-s * 0.84, -s * 0.12, s * 1.68, s * 0.16); c.fillRect(-s * 0.07, -s * 0.84, s * 0.14, s * 0.8);
  } else if (k === 'crown') {
    c.fillStyle = '#ffcc00'; c.strokeStyle = '#a07800'; c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(-s * 0.7, -s * 0.6); c.lineTo(-s * 0.35, -s * 0.3); c.lineTo(0, -s * 0.75); c.lineTo(s * 0.35, -s * 0.3); c.lineTo(s * 0.7, -s * 0.6); c.lineTo(s * 0.7, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e01e37'; for (const x of [-0.7, 0, 0.7]) { c.beginPath(); c.arc(x * s, x ? -s * 0.62 : -s * 0.78, s * 0.08, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#3a6fd8'; c.beginPath(); c.arc(0, -s * 0.17, s * 0.09, 0, Math.PI * 2); c.fill();
  } else if (k === 'party') {
    c.fillStyle = '#9b5de5'; c.beginPath(); c.moveTo(-s * 0.55, 0); c.lineTo(0, -s * 1.35); c.lineTo(s * 0.55, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffcc00'; for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(-s * 0.2 + i * s * 0.12, -i * s * 0.3, s * 0.06, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ff4d7d'; c.beginPath(); c.arc(0, -s * 1.4, s * 0.15, 0, Math.PI * 2); c.fill();
  } else if (k === 'tophat') {
    c.fillStyle = '#15182a'; c.beginPath(); c.ellipse(0, -s * 0.02, s * 0.95, s * 0.14, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(-s * 0.55, -s * 1.05, s * 1.1, s * 1.03); c.fillStyle = '#e01e37'; c.fillRect(-s * 0.55, -s * 0.32, s * 1.1, s * 0.16);
  } else if (k === 'heart') {
    c.strokeStyle = '#ff8fab'; c.lineWidth = s * 0.08; c.beginPath(); c.arc(0, s * 0.15, s * 0.82, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    for (const d of [-1, 1]) { const bob = Math.sin(t * 4 + d) * s * 0.06; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(d * s * 0.4, -s * 0.5); c.lineTo(d * s * 0.5, -s * 0.95 + bob); c.stroke(); c.fillStyle = '#ff4d7d'; mHeart(c, d * s * 0.5, -s * 0.95 + bob, s * 0.24); c.fill(); }
  } else if (k === 'halo') {
    const bob = Math.sin(t * 2) * s * 0.05; c.strokeStyle = '#ffd84d'; c.lineWidth = s * 0.1;
    c.shadowColor = '#ffe680'; c.shadowBlur = s * 0.3; c.beginPath(); c.ellipse(0, -s * 0.85 + bob, s * 0.6, s * 0.16, 0, 0, Math.PI * 2); c.stroke(); c.shadowBlur = 0;
  }
  c.restore();
}
// </mascot>
