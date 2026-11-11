// PiispanPELI · The mascot character drawn on canvas (also used to render the app icons).
'use strict';

// <mascot>
// looks of the mascot: skin tones, eye colours and hair colours
const M_SKIN = { light: ['#f2c7ab', '#d99c82'], pale: ['#ffe0cc', '#e8b49a'], tan: ['#e0ac82', '#c08a60'], brown: ['#b97c56', '#93603e'], dark: ['#7a4a32', '#5a3422'],
  alien: ['#9be08a', '#6ab45a'], gold: ['#f2cc5a', '#c89a28'], cosmic: ['#3a2a7a', '#22184a'], frost: ['#b8e4f8', '#7ab4d8'], sun: ['#ffd24a', '#e09a10'] };
const M_EYES = { glow: '#5af0ff', brown: '#5b3a2c', blue: '#3a7ad8', green: '#3a9a4a', grey: '#7a8a9a', purple: '#8a4ad8', gold: '#d9a400', pink: '#ff4d8d' };
const M_HAIR = { brown: '#7a4a32', black: '#1e1a1a', blonde: '#e8c66a', ginger: '#c8582a', grey: '#c8c8cc', pink: '#ff7ab0', blue: '#3a7ad8', green: '#3aa860', purple: '#8a4ad8', white: '#f4f4f4' };
// special costumes: each one dresses the whole mascot at once and adds its own effects around it
const COSTUMES = {
  odin: { look: { skin: 'light', hair: 'long', hairc: 'grey', eyes: 'blue', face: 'odinbeard', hat: 'odinhelm', glasses: 'patch', neck: 'none', top: 'odincloak' }, post: 'ravens' },
  cosmos: { look: { skin: 'cosmic', hair: 'afro', hairc: 'nebula', eyes: 'glow', face: 'cosmicface', hat: 'none', glasses: 'none', neck: 'none', top: 'starcloak' }, pre: 'aura:#8a5aff', post: 'planets' },
  sun: { look: { skin: 'sun', hair: 'bald', hairc: 'goldh', eyes: 'gold', face: 'none', hat: 'crown', glasses: 'sun', neck: 'chain', top: 'cape' }, pre: 'rays' },
  heartqueen: { look: { skin: 'light', hair: 'long', hairc: 'pink', eyes: 'pink', face: 'heartcheek', hat: 'heartcrown', glasses: 'none', neck: 'hearts', top: 'sweater' }, pre: 'aura:#ff6fa8', post: 'hearts' },
  professor: { look: { skin: 'light', hair: 'wild', hairc: 'white', eyes: 'brown', face: 'whitemustache', hat: 'none', glasses: 'round', neck: 'tie', top: 'labcoat' }, post: 'formulas' },
  frost: { look: { skin: 'frost', hair: 'long', hairc: 'white', eyes: 'blue', face: 'frostbeard', hat: 'icecrown', glasses: 'none', neck: 'none', top: 'fur' }, pre: 'aura:#7ad8ff', post: 'snow' },
  hermes: { look: { skin: 'light', hair: 'curly', hairc: 'goldh', eyes: 'blue', face: 'none', hat: 'wings', glasses: 'none', neck: 'torc', top: 'toga' }, pre: 'aura:#ffd84d' }
};
function costumeFx(c, kind, cx, by, s, t) {
  if (!kind) return;
  const hy = by + s * 0.05;
  if (kind.startsWith('aura:')) {
    const col = kind.slice(5), g = c.createRadialGradient(cx, hy, s * 0.6, cx, hy, s * 1.7);
    g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(cx, hy, s * 1.7, 0, Math.PI * 2); c.fill();
  } else if (kind === 'rays') {
    const g = c.createRadialGradient(cx, hy, s * 0.7, cx, hy, s * 1.75); g.addColorStop(0, '#ffcc00cc'); g.addColorStop(1, '#ff6a0000');
    c.fillStyle = g; c.beginPath(); c.arc(cx, hy, s * 1.75, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffb020';
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 0.4, l = s * (1.35 + (i % 2) * 0.25 + Math.sin(t * 3 + i) * 0.06);
      c.beginPath(); c.moveTo(cx + Math.cos(a - 0.12) * s * 0.85, hy + Math.sin(a - 0.12) * s * 0.95); c.lineTo(cx + Math.cos(a) * l, hy + Math.sin(a) * l); c.lineTo(cx + Math.cos(a + 0.12) * s * 0.85, hy + Math.sin(a + 0.12) * s * 0.95); c.fill(); }
  } else if (kind === 'ravens') {
    // Huginn and Muninn on the shoulders
    for (const d of [-1, 1]) {
      const x = cx + d * s * 0.95, y = by + s * 1.0 + Math.sin(t * 3 + d) * s * 0.03;
      c.fillStyle = '#15151c'; c.beginPath(); c.ellipse(x, y, s * 0.24, s * 0.15, d * 0.3, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + d * s * 0.17, y - s * 0.14, s * 0.11, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - d * s * 0.2, y + s * 0.02); c.lineTo(x - d * s * 0.42, y + s * 0.12); c.lineTo(x - d * s * 0.2, y + s * 0.1); c.fill();
      c.fillStyle = '#5a5a66'; c.beginPath(); c.moveTo(x + d * s * 0.26, y - s * 0.16); c.lineTo(x + d * s * 0.42, y - s * 0.11); c.lineTo(x + d * s * 0.26, y - s * 0.09); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + d * s * 0.2, y - s * 0.17, s * 0.025, 0, Math.PI * 2); c.fill();
    }
  } else if (kind === 'planets') {
    [['#e3c27a', 1.25, 0.35, 0.11, 0.7], ['#5aa8ff', 1.1, 0.3, 0.08, -1.0], ['#ff7a5a', 1.35, 0.4, 0.07, 1.3]].forEach(([col, rx, ry, r, sp], i) => {
      const a = t * sp + i * 2.1, x = cx + Math.cos(a) * s * rx, y = hy - s * 0.2 + Math.sin(a) * s * ry;
      c.fillStyle = col; c.beginPath(); c.arc(x, y, s * r, 0, Math.PI * 2); c.fill();
      if (i === 0) { c.strokeStyle = 'rgba(255,240,200,0.8)'; c.lineWidth = s * 0.02; c.beginPath(); c.ellipse(x, y, s * r * 1.8, s * r * 0.5, -0.3, 0, Math.PI * 2); c.stroke(); }
    });
  } else if (kind === 'hearts') {
    c.fillStyle = '#ff4d7d';
    for (let i = 0; i < 4; i++) { const u = (t * 0.35 + i / 4) % 1, x = cx + (i % 2 ? 1 : -1) * s * (1.0 + Math.sin(u * 6 + i) * 0.1), y = by + s * (0.8 - u * 1.8);
      c.globalAlpha = Math.sin(u * Math.PI); mHeart(c, x, y, s * 0.12); c.fill(); }
    c.globalAlpha = 1;
  } else if (kind === 'formulas') {
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = `700 ${s * 0.2}px serif`; c.textAlign = 'center';
    ['E=mc²', 'π', '∑', '√2'].forEach((f, i) => { const u = (t * 0.25 + i / 4) % 1; c.globalAlpha = Math.sin(u * Math.PI) * 0.8; c.fillText(f, cx + (i % 2 ? 1 : -1) * s * (1.05 + i * 0.05), by + s * (0.6 - u * 1.4)); });
    c.globalAlpha = 1;
  } else if (kind === 'snow') {
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) { const u = (t * 0.2 + i * 0.37) % 1, x = cx + ((i * 0.618) % 1 * 2 - 1) * s * 1.4; c.globalAlpha = Math.sin(u * Math.PI); c.beginPath(); c.arc(x, by - s * 1.1 + u * s * 2.6, s * 0.035, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
}
function drawMascot(c, cx, cy, s, t, bounce) {
  let L = Object.assign({ hat: 'bonnet', glasses: 'none', neck: 'chain', top: 'none', hair: 'short', hairc: 'brown', skin: 'light', eyes: 'brown', face: 'none' },
    (typeof look !== 'undefined' && look) || {});
  const cos = L.costume && COSTUMES[L.costume];
  if (cos) L = Object.assign({}, L, cos.look);
  const [skin, skinD] = M_SKIN[L.skin] || M_SKIN.light;
  const by = cy - Math.abs(Math.sin(t * 2.2)) * s * 0.05 - (bounce || 0) * s * 0.25;
  c.save();
  if (cos) costumeFx(c, cos.pre, cx, by, s, t);
  // shoulders
  c.fillStyle = skin;
  c.beginPath(); c.ellipse(cx, by + s * 1.55, s * 1.05, s * 0.55, 0, Math.PI, 0); c.fill();
  mTop(c, L.top, cx, by, s, t);
  // neck + head
  mHair(c, L.hair, L.hairc, cx, by, s, t, true);
  c.fillStyle = skin; c.fillRect(cx - s * 0.28, by + s * 0.6, s * 0.56, s * 0.55);
  c.beginPath(); c.ellipse(cx - s * 0.8, by + s * 0.08, s * 0.13, s * 0.2, 0, 0, Math.PI * 2); c.ellipse(cx + s * 0.8, by + s * 0.08, s * 0.13, s * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(cx, by + s * 0.05, s * 0.8, s * 0.92, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = s * 0.035; c.strokeStyle = skinD; c.stroke();
  mNeck(c, L.neck, cx, by, s, t);
  mHair(c, L.hair, L.hairc, cx, by, s, t, false);
  // sleepy eyes with heavy lids, blinking now and then
  const blink = (t % 4.3) < 0.14;
  for (const sx of [-1, 1]) {
    const ex = cx + sx * s * 0.3, ey = by + s * 0.0;
    if (blink) { c.strokeStyle = '#6b4235'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(ex - s * 0.14, ey); c.quadraticCurveTo(ex, ey + s * 0.05, ex + s * 0.14, ey); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, s * 0.15, s * 0.085, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = M_EYES[L.eyes] || M_EYES.brown; c.beginPath(); c.arc(ex + Math.sin(t * 0.7) * s * 0.03, ey + s * 0.02, s * 0.065, 0, Math.PI * 2); c.fill();
    c.fillStyle = skin; c.beginPath(); c.ellipse(ex, ey - s * 0.04, s * 0.17, s * 0.07, 0, Math.PI, 0); c.fill();
    c.strokeStyle = '#6b4235'; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(ex - s * 0.16, ey - s * 0.03); c.quadraticCurveTo(ex, ey - s * 0.07, ex + s * 0.16, ey - s * 0.03); c.stroke();
    c.strokeStyle = 'rgba(140,95,70,0.7)'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(ex - s * 0.15, ey - s * 0.2); c.quadraticCurveTo(ex, ey - s * 0.25, ex + s * 0.15, ey - s * 0.19); c.stroke();
  }
  // nose, blush
  c.strokeStyle = skinD; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(cx - s * 0.03, by + s * 0.1); c.quadraticCurveTo(cx - s * 0.1, by + s * 0.27, cx + s * 0.04, by + s * 0.28); c.stroke();
  c.fillStyle = 'rgba(240,120,140,0.3)'; c.beginPath(); c.ellipse(cx - s * 0.5, by + s * 0.3, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); c.ellipse(cx + s * 0.5, by + s * 0.3, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); c.fill();
  mFace(c, L.face, cx, by, s, t, false);
  // pouty pink lips that pucker every few seconds
  const puck = (typeof nelliT !== 'undefined' && nelliT > 0) ? 1 : Math.max(0, Math.sin(t * 1.6)) ** 6, lw = s * (0.21 - puck * 0.07), lh = s * (0.085 + puck * 0.04), ly = by + s * 0.5;
  c.fillStyle = '#d4566f'; c.beginPath(); c.ellipse(cx, ly + lh * 0.45, lw, lh, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e06a82'; c.beginPath(); c.ellipse(cx - lw * 0.42, ly - lh * 0.15, lw * 0.55, lh * 0.75, 0, 0, Math.PI * 2); c.ellipse(cx + lw * 0.42, ly - lh * 0.15, lw * 0.55, lh * 0.75, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(cx + lw * 0.3, ly + lh * 0.6, lw * 0.25, lh * 0.2, 0, 0, Math.PI * 2); c.fill();
  mFace(c, L.face, cx, by, s, t, true);
  mGlasses(c, L.glasses, cx, by, s, t);
  if (L.hat !== 'bonnet') { mHat(c, L.hat, cx, by, s, t); if (cos) costumeFx(c, cos.post, cx, by, s, t); c.restore(); return; }
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
function hairFill(c, col, cx, by, s) {
  if (col === 'rainbow') { const g = c.createLinearGradient(cx - s, 0, cx + s, 0); ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((x, i) => g.addColorStop(i / 5, x)); return g; }
  if (col === 'nebula') { const g = c.createLinearGradient(cx - s, by - s, cx + s, by + s); g.addColorStop(0, '#ff6ad0'); g.addColorStop(0.5, '#8a5aff'); g.addColorStop(1, '#3ad8ff'); return g; }
  if (col === 'goldh') { const g = c.createLinearGradient(cx - s, by - s, cx + s, by + s); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.5, '#ffcc00'); g.addColorStop(1, '#a67c00'); return g; }
  return M_HAIR[col] || M_HAIR.brown;
}
// hair in two layers: the part behind the head (long hair, tails, braids, afro) and the part on top of it
function mHair(c, k, col, cx, by, s, t, back) {
  if (k === 'bald') { if (!back) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx - s * 0.25, by - s * 0.6, s * 0.2, s * 0.09, -0.4, 0, Math.PI * 2); c.fill(); } return; }
  c.fillStyle = hairFill(c, col, cx, by, s);
  const E = (x, y, rx, ry, a) => { c.beginPath(); c.ellipse(cx + x * s, by + y * s, rx * s, ry * s, a || 0, 0, Math.PI * 2); c.fill(); };
  if (back) {
    if (k === 'long') E(0, 0.3, 0.98, 1.05);
    else if (k === 'ponytail') { const sw = Math.sin(t * 3) * 0.08; E(0.78, 0.45, 0.24, 0.55, -0.35 + sw); }
    else if (k === 'pigtails') { const sw = Math.sin(t * 3) * 0.06; E(-0.98, 0.35, 0.26, 0.45, 0.3 + sw); E(0.98, 0.35, 0.26, 0.45, -0.3 - sw); }
    else if (k === 'braids') for (const d of [-1, 1]) for (let i = 0; i < 6; i++) E(d * (0.78 + i * 0.02), 0.1 + i * 0.22, 0.13, 0.14);
    else if (k === 'afro') E(0, -0.2, 1.18, 1.05);
    else if (k === 'wild') for (const d of [-1, 1]) { E(d * 0.85, -0.25, 0.38, 0.42); E(d * 0.7, -0.65, 0.3, 0.3); E(d * 0.95, 0.1, 0.28, 0.3); }
    else if (k === 'curly') for (let i = 0; i < 11; i++) { const a = Math.PI * (0.95 + i / 10 * 1.1); E(Math.cos(a) * 0.82, -0.05 + Math.sin(a) * 0.9, 0.22, 0.22); }
    return;
  }
  // the top of the head
  if (k === 'mohawk') {
    c.beginPath(); for (let i = 0; i <= 6; i++) { const y = -0.95 + Math.abs(i - 3) * 0.08; c.moveTo(cx - s * 0.12, by + (y + 0.25) * s); c.lineTo(cx + (i - 3) * 0.04 * s, by + (y - 0.35) * s); c.lineTo(cx + s * 0.12, by + (y + 0.25) * s); } c.fill();
    c.globalAlpha = 0.35; E(0, -0.45, 0.78, 0.5); c.globalAlpha = 1; return;
  }
  if (k === 'wild') { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx - s * 0.2, by - s * 0.62, s * 0.2, s * 0.08, -0.3, 0, Math.PI * 2); c.fill(); return; }
  if (k === 'spiky') { c.beginPath(); c.moveTo(cx - s * 0.8, by - s * 0.3); for (let i = 0; i <= 8; i++) { const x = -0.8 + i * 0.2; c.lineTo(cx + (x + 0.1) * s, by - s * (1.15 - Math.abs(x) * 0.3)); c.lineTo(cx + (x + 0.2) * s, by - s * (0.75 - Math.abs(x) * 0.2)); } c.lineTo(cx + s * 0.8, by - s * 0.3); c.closePath(); c.fill(); return; }
  c.beginPath(); c.ellipse(cx, by - s * 0.45, s * (k === 'afro' ? 0.86 : 0.8), s * 0.52, 0, Math.PI, 0); c.fill();
  if (k === 'long') { E(-0.68, -0.1, 0.18, 0.4, 0.2); E(0.68, -0.1, 0.18, 0.4, -0.2); }
  if (k === 'bun') E(0, -1.0, 0.32, 0.28);
  if (k === 'curly') for (let i = 0; i < 7; i++) E(-0.6 + i * 0.2, -0.5 - Math.sin(i / 6 * Math.PI) * 0.35, 0.14, 0.14);
  if (k === 'pigtails' || k === 'ponytail') { c.fillStyle = '#ff4d7d'; if (k === 'pigtails') { E(-0.86, 0.1, 0.08, 0.08); E(0.86, 0.1, 0.08, 0.08); } else E(0.62, 0.05, 0.08, 0.08); }
}
// face details: freckles, face paint and beards (beards go under the lips, the moustache over them)
function mFace(c, k, cx, by, s, t, over) {
  if (!k || k === 'none') return;
  if (over) {
    if (k === 'mustache' || k === 'whitemustache') { c.fillStyle = k === 'mustache' ? '#4a2e1c' : '#f4f4f4'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(cx + d * s * 0.14, by + s * 0.4, s * 0.16, s * 0.055, d * 0.25, 0, Math.PI * 2); c.fill(); } }
    return;
  }
  if (k === 'freckles') { c.fillStyle = 'rgba(150,80,40,0.55)'; for (const d of [-1, 1]) for (const [x, y] of [[0.42, 0.2], [0.52, 0.26], [0.36, 0.28], [0.48, 0.34], [0.58, 0.18]]) { c.beginPath(); c.arc(cx + d * x * s, by + y * s, s * 0.022, 0, Math.PI * 2); c.fill(); } }
  else if (k === 'odinbeard' || k === 'frostbeard') {
    // a long beard down to the chest: grey for Odin, icy for the frost giant
    const col = k === 'odinbeard' ? '#d8d8dc' : '#e8f8ff';
    c.fillStyle = col; c.beginPath(); c.moveTo(cx - s * 0.74, by + s * 0.2); c.quadraticCurveTo(cx - s * 0.75, by + s * 1.2, cx - s * 0.2, by + s * 1.55);
    c.lineTo(cx, by + s * 1.75); c.lineTo(cx + s * 0.2, by + s * 1.55); c.quadraticCurveTo(cx + s * 0.75, by + s * 1.2, cx + s * 0.74, by + s * 0.2);
    c.quadraticCurveTo(cx + s * 0.4, by + s * 0.7, cx, by + s * 0.72); c.quadraticCurveTo(cx - s * 0.4, by + s * 0.7, cx - s * 0.74, by + s * 0.2); c.fill();
    c.strokeStyle = k === 'odinbeard' ? 'rgba(120,120,130,0.5)' : 'rgba(90,170,220,0.6)'; c.lineWidth = s * 0.025;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * s * 0.18, by + s * 0.85); c.quadraticCurveTo(cx + i * s * 0.2, by + s * 1.2, cx + i * s * 0.1, by + s * 1.5); c.stroke(); }
    if (k === 'frostbeard') { c.fillStyle = '#ffffff'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * s * 0.14 - s * 0.04, by + s * (1.4 - Math.abs(i) * 0.08)); c.lineTo(cx + i * s * 0.14, by + s * (1.62 - Math.abs(i) * 0.08)); c.lineTo(cx + i * s * 0.14 + s * 0.04, by + s * (1.4 - Math.abs(i) * 0.08)); c.fill(); } }
    else { c.fillStyle = '#e8b400'; c.fillRect(cx - s * 0.08, by + s * 1.45, s * 0.16, s * 0.07); }
  } else if (k === 'cosmicface') {
    c.save(); c.beginPath(); c.ellipse(cx, by + s * 0.05, s * 0.8, s * 0.92, 0, 0, Math.PI * 2); c.clip();
    const r = (n => () => (n = (n * 9301 + 49297) % 233280) / 233280)(11);
    for (let i = 0; i < 40; i++) { c.fillStyle = r() < 0.2 ? '#ff9ad8' : r() < 0.4 ? '#9ad8ff' : '#ffffff'; c.globalAlpha = 0.4 + r() * 0.6 * Math.abs(Math.sin(t * 2 + i)); c.beginPath(); c.arc(cx + (r() * 2 - 1) * s * 0.8, by + (r() * 2 - 0.9) * s * 0.9, s * (0.012 + r() * 0.02), 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1; c.restore();
  } else if (k === 'beard') {
    c.fillStyle = '#c8582a'; c.beginPath(); c.moveTo(cx - s * 0.72, by + s * 0.25); c.quadraticCurveTo(cx - s * 0.6, by + s * 1.0, cx, by + s * 1.15); c.quadraticCurveTo(cx + s * 0.6, by + s * 1.0, cx + s * 0.72, by + s * 0.25);
    c.quadraticCurveTo(cx + s * 0.4, by + s * 0.7, cx, by + s * 0.72); c.quadraticCurveTo(cx - s * 0.4, by + s * 0.7, cx - s * 0.72, by + s * 0.25); c.fill();
    c.strokeStyle = '#e8b400'; c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(cx - s * 0.08, by + s * 1.02); c.lineTo(cx + s * 0.08, by + s * 1.02); c.stroke();
  } else if (k === 'eupaint') { c.fillStyle = '#ffcc00'; for (const d of [-1, 1]) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mStar(c, cx + d * s * 0.5 + Math.cos(a) * s * 0.11, by + s * 0.3 + Math.sin(a) * s * 0.09, s * 0.04, s * 0.018); c.fill(); } }
  else if (k === 'starcheek') { c.fillStyle = '#ffd84d'; mStar(c, cx + s * 0.5, by + s * 0.3, s * 0.12, s * 0.05); c.fill(); c.fillStyle = '#ffffff'; mStar(c, cx - s * 0.52, by + s * 0.26, s * 0.06, s * 0.025); c.fill(); }
  else if (k === 'heartcheek') { c.fillStyle = '#ff4d7d'; for (const d of [-1, 1]) { mHeart(c, cx + d * s * 0.5, by + s * 0.32, s * 0.12); c.fill(); } }
  else if (k === 'rbpaint') { ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((col, i) => { c.fillStyle = col; c.fillRect(cx + s * 0.32, by + s * (0.18 + i * 0.035), s * 0.32, s * 0.04); }); }
}
function mTop(c, k, cx, by, s, t) {
  if (!k || k === 'none') return;
  const y0 = by + s * 1.55, body = () => { c.beginPath(); c.ellipse(cx, y0, s * 1.06, s * 0.56, 0, Math.PI, 0); c.closePath(); };
  if (k === 'cape' || k === 'fur' || k === 'starcloak') {
    // cloaks hang a little wider than the shoulders
    c.fillStyle = k === 'cape' ? '#b8323a' : k === 'fur' ? '#7a5236' : '#1a1f4a';
    c.beginPath(); c.ellipse(cx, y0 + s * 0.05, s * 1.18, s * 0.66, 0, Math.PI, 0); c.closePath(); c.fill();
  }
  const COL = { odincloak: '#1f2a5a', toga: '#f6f2e8', tee: '#2d5fc4', sailor: '#ffffff', mail: '#8a94a4', fur: '#a8784a', cape: '#d0404a', labcoat: '#f4f6f8', robe: '#15182a', hoodie: '#3a3f4a',
    space: '#eef2f6', sweater: '#d0304a', tux: '#15182a', starcloak: '#232a66', college: '#7a1a2a' };
  c.save(); body(); c.fillStyle = COL[k] || '#888'; c.fill(); c.clip();
  if (k === 'tee') { c.fillStyle = '#ffcc00'; mStar(c, cx + s * 0.5, y0 - s * 0.25, s * 0.1, s * 0.045); c.fill(); }
  else if (k === 'sailor') { c.fillStyle = '#1f3a8a'; for (let y = y0 - s * 0.5; y < y0; y += s * 0.14) c.fillRect(cx - s * 1.1, y, s * 2.2, s * 0.06); c.beginPath(); c.moveTo(cx - s * 0.6, y0 - s * 0.56); c.lineTo(cx, y0 - s * 0.1); c.lineTo(cx + s * 0.6, y0 - s * 0.56); c.closePath(); c.fill(); }
  else if (k === 'mail') { c.strokeStyle = 'rgba(40,46,60,0.55)'; c.lineWidth = s * 0.02; for (let y = y0 - s * 0.55; y < y0; y += s * 0.09) for (let x = cx - s * 1.1 + ((y / s * 11) % 2) * s * 0.05; x < cx + s * 1.1; x += s * 0.1) { c.beginPath(); c.arc(x, y, s * 0.045, 0, Math.PI * 2); c.stroke(); } }
  else if (k === 'fur') { c.fillStyle = '#e8dcc8'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + (i - 4) * s * 0.17, y0 - s * 0.5 + Math.abs(i - 4) * s * 0.06, s * 0.13, 0, Math.PI * 2); c.fill(); } }
  else if (k === 'cape') { c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(cx, y0 - s * 0.42, s * 0.1, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f2f2f2'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(cx + (i - 3) * s * 0.28, y0 - s * 0.47 + Math.abs(i - 3) * s * 0.05, s * 0.09, 0, Math.PI * 2); c.fill(); } }
  else if (k === 'labcoat') { c.strokeStyle = '#c4ccd6'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(cx - s * 0.32, y0 - s * 0.5); c.lineTo(cx - s * 0.1, y0); c.moveTo(cx + s * 0.32, y0 - s * 0.5); c.lineTo(cx + s * 0.1, y0); c.stroke(); c.strokeRect(cx + s * 0.4, y0 - s * 0.3, s * 0.25, s * 0.2); c.fillStyle = '#3a6fd8'; c.fillRect(cx + s * 0.45, y0 - s * 0.4, s * 0.04, s * 0.15); }
  else if (k === 'robe') { c.fillStyle = '#b8323a'; c.fillRect(cx - s * 0.42, y0 - s * 0.6, s * 0.12, s * 0.6); c.fillRect(cx + s * 0.3, y0 - s * 0.6, s * 0.12, s * 0.6); }
  else if (k === 'hoodie') { c.fillStyle = '#2a2e38'; c.beginPath(); c.ellipse(cx, y0 - s * 0.5, s * 0.55, s * 0.16, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#f2f2f2'; c.lineWidth = s * 0.025; c.beginPath(); c.moveTo(cx - s * 0.15, y0 - s * 0.42); c.lineTo(cx - s * 0.17, y0 - s * 0.15); c.moveTo(cx + s * 0.15, y0 - s * 0.42); c.lineTo(cx + s * 0.17, y0 - s * 0.15); c.stroke(); }
  else if (k === 'space') { c.fillStyle = '#c8d0dc'; c.beginPath(); c.ellipse(cx, y0 - s * 0.52, s * 0.62, s * 0.16, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3a6fd8'; c.fillRect(cx - s * 0.75, y0 - s * 0.32, s * 0.2, s * 0.14); c.fillStyle = '#e01e37'; c.fillRect(cx + s * 0.55, y0 - s * 0.32, s * 0.2, s * 0.14); }
  else if (k === 'sweater') { c.fillStyle = '#ffffff'; for (let i = -3; i <= 3; i++) { mHeart(c, cx + i * s * 0.28, y0 - s * 0.22, s * 0.11); c.fill(); } c.fillStyle = '#a0202e'; c.fillRect(cx - s * 1.1, y0 - s * 0.08, s * 2.2, s * 0.08); }
  else if (k === 'tux') { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(cx - s * 0.3, y0 - s * 0.56); c.lineTo(cx, y0); c.lineTo(cx + s * 0.3, y0 - s * 0.56); c.closePath(); c.fill(); c.fillStyle = '#15182a'; for (const y of [0.3, 0.15]) { c.beginPath(); c.arc(cx, y0 - s * y, s * 0.025, 0, Math.PI * 2); c.fill(); } }
  else if (k === 'starcloak') { c.fillStyle = '#ffffff'; const r = (n => () => (n = (n * 9301 + 49297) % 233280) / 233280)(7); for (let i = 0; i < 26; i++) { c.globalAlpha = 0.4 + r() * 0.6; c.beginPath(); c.arc(cx + (r() * 2 - 1) * s, y0 - r() * s * 0.55, s * (0.015 + r() * 0.025), 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; c.fillStyle = '#ffd84d'; mStar(c, cx - s * 0.5, y0 - s * 0.25, s * 0.09, s * 0.04); c.fill(); }
  else if (k === 'odincloak') { c.fillStyle = '#9a8a7a'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + (i - 4) * s * 0.2, y0 - s * 0.5 + Math.abs(i - 4) * s * 0.05, s * 0.14, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#e8b400'; c.beginPath(); c.arc(cx - s * 0.55, y0 - s * 0.3, s * 0.09, 0, Math.PI * 2); c.fill(); }
  else if (k === 'toga') { c.fillStyle = '#e8b400'; c.beginPath(); c.moveTo(cx - s * 0.7, y0 - s * 0.5); c.lineTo(cx - s * 0.5, y0 - s * 0.56); c.lineTo(cx + s * 0.8, y0); c.lineTo(cx + s * 0.55, y0); c.closePath(); c.fill(); }
  else if (k === 'college') { c.fillStyle = '#ffffff'; c.font = `800 ${s * 0.38}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', cx + s * 0.45, y0 - s * 0.22); c.textBaseline = 'alphabetic'; c.fillStyle = '#e8b400'; c.fillRect(cx - s * 1.1, y0 - s * 0.06, s * 2.2, s * 0.06); }
  c.restore();
}
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
  } else if (k === 'tie') {
    c.fillStyle = '#1f3a8a'; c.beginPath(); c.moveTo(cx - s * 0.1, by + s * 1.0); c.lineTo(cx + s * 0.1, by + s * 1.0); c.lineTo(cx + s * 0.07, by + s * 1.12); c.lineTo(cx - s * 0.07, by + s * 1.12); c.fill();
    c.beginPath(); c.moveTo(cx - s * 0.07, by + s * 1.12); c.lineTo(cx + s * 0.07, by + s * 1.12); c.lineTo(cx + s * 0.14, by + s * 1.6); c.lineTo(cx, by + s * 1.72); c.lineTo(cx - s * 0.14, by + s * 1.6); c.closePath(); c.fill();
    c.strokeStyle = '#e8b400'; c.lineWidth = s * 0.03; for (const y of [1.25, 1.4, 1.55]) { c.beginPath(); c.moveTo(cx - s * 0.1, by + s * y); c.lineTo(cx + s * 0.1, by + s * (y + 0.06)); c.stroke(); }
  } else if (k === 'torc') {
    c.strokeStyle = '#d9a441'; c.lineWidth = s * 0.1;
    c.beginPath(); c.moveTo(cx - s * 0.12, by + s * 1.3); c.quadraticCurveTo(cx - s * 0.6, by + s * 1.25, cx - s * 0.5, by + s * 1.0); c.moveTo(cx + s * 0.12, by + s * 1.3); c.quadraticCurveTo(cx + s * 0.6, by + s * 1.25, cx + s * 0.5, by + s * 1.0); c.stroke();
    c.fillStyle = '#f2c84a'; for (const d of [-1, 1]) { c.beginPath(); c.arc(cx + d * s * 0.12, by + s * 1.3, s * 0.08, 0, Math.PI * 2); c.fill(); }
  } else if (k === 'hearts' || k === 'rune' || k === 'whistle' || k === 'mjolnir' || k === 'bell') {
    // a cord with a pendant
    c.strokeStyle = k === 'hearts' ? '#e2b13c' : k === 'bell' ? '#e01e37' : '#5a3a1a'; c.lineWidth = s * (k === 'bell' ? 0.08 : 0.035);
    c.beginPath(); c.moveTo(cx - s * 0.5, by + s * 1.05); c.quadraticCurveTo(cx, by + s * 1.5, cx + s * 0.5, by + s * 1.05); c.stroke();
    const py = by + s * 1.36;
    if (k === 'hearts') { c.fillStyle = '#e01e37'; for (const [x, y, r] of [[-0.3, 1.22, 0.1], [0, 1.4, 0.15], [0.3, 1.22, 0.1]]) { mHeart(c, cx + x * s, by + y * s, r * s); c.fill(); } }
    else if (k === 'rune') { c.fillStyle = '#7d8a96'; c.beginPath(); c.ellipse(cx, py, s * 0.13, s * 0.16, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffd84d'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(cx - s * 0.03, py - s * 0.1); c.lineTo(cx - s * 0.03, py + s * 0.1); c.moveTo(cx - s * 0.03, py - s * 0.1); c.lineTo(cx + s * 0.06, py - s * 0.03); c.lineTo(cx - s * 0.03, py + s * 0.02); c.stroke(); }
    else if (k === 'whistle') { c.fillStyle = '#c8ced8'; c.fillRect(cx - s * 0.05, py - s * 0.05, s * 0.22, s * 0.1); c.beginPath(); c.arc(cx - s * 0.06, py + s * 0.02, s * 0.09, 0, Math.PI * 2); c.fill(); }
    else if (k === 'mjolnir') { c.fillStyle = '#a8b0bc'; c.fillRect(cx - s * 0.15, py - s * 0.02, s * 0.3, s * 0.13); c.fillStyle = '#6b4a2a'; c.fillRect(cx - s * 0.03, py - s * 0.12, s * 0.06, s * 0.12); }
    else { const sw = Math.sin(t * 6) * 0.25; c.save(); c.translate(cx, py - s * 0.05); c.rotate(sw); c.fillStyle = '#ffcc00'; c.beginPath(); c.moveTo(-s * 0.12, s * 0.14); c.quadraticCurveTo(-s * 0.12, -s * 0.08, 0, -s * 0.08); c.quadraticCurveTo(s * 0.12, -s * 0.08, s * 0.12, s * 0.14); c.closePath(); c.fill(); c.fillStyle = '#a07800'; c.beginPath(); c.arc(0, s * 0.16, s * 0.04, 0, Math.PI * 2); c.fill(); c.restore(); }
  } else if (k === 'rbscarf') {
    const cols = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
    c.save(); c.beginPath(); c.ellipse(cx, by + s * 1.05, s * 0.58, s * 0.18, 0, 0, Math.PI * 2); c.clip();
    cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(cx - s * 0.6, by + s * (0.87 + i * 0.06), s * 1.2, s * 0.07); }); c.restore();
    c.save(); c.translate(cx - s * 0.3, by + s * 1.1); c.rotate(-0.2 + Math.sin(t * 3) * 0.08);
    cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-s * 0.12 + i * s * 0.04, 0, s * 0.045, s * 0.5); }); c.restore();
  } else if (k === 'stole') {
    for (const d of [-1, 1]) { c.fillStyle = '#1f3a8a'; c.beginPath(); c.moveTo(cx + d * s * 0.3, by + s * 0.98); c.lineTo(cx + d * s * 0.5, by + s * 1.02); c.lineTo(cx + d * s * 0.36, by + s * 1.7); c.lineTo(cx + d * s * 0.16, by + s * 1.7); c.closePath(); c.fill();
      c.fillStyle = '#e8b400'; c.fillRect(cx + d * s * 0.26 - s * 0.1, by + s * 1.5, s * 0.2, s * 0.05); }
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
  } else if (k === 'patch') {
    c.strokeStyle = '#1b1410'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(cx - s * 0.8, ey - s * 0.3); c.lineTo(cx + s * 0.8, ey + s * 0.1); c.stroke();
    c.fillStyle = '#1b1410'; c.beginPath(); c.ellipse(L, ey, s * 0.19, s * 0.15, 0.2, 0, Math.PI * 2); c.fill();
  } else if (k === 'visor') {
    const g = c.createLinearGradient(0, ey - s * 0.15, 0, ey + s * 0.12); g.addColorStop(0, 'rgba(120,230,255,0.75)'); g.addColorStop(1, 'rgba(160,90,255,0.6)');
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(cx - s * 0.6, ey - s * 0.15, s * 1.2, s * 0.27, s * 0.13) : c.rect(cx - s * 0.6, ey - s * 0.15, s * 1.2, s * 0.27); c.fill();
    c.strokeStyle = '#d8e0ea'; c.stroke();
  } else if (k === 'nerd') {
    c.lineWidth = s * 0.07; c.strokeStyle = '#15182a';
    for (const x of [L, R]) c.strokeRect(x - s * 0.18, ey - s * 0.13, s * 0.36, s * 0.26);
    c.beginPath(); c.moveTo(L + s * 0.18, ey - s * 0.03); c.lineTo(R - s * 0.18, ey - s * 0.03); c.stroke();
    c.fillStyle = '#ffffff'; c.fillRect(cx - s * 0.05, ey - s * 0.08, s * 0.1, s * 0.09);
  } else if (k === 'ski') {
    c.strokeStyle = '#2a2f40'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(cx - s * 0.82, ey); c.lineTo(cx + s * 0.82, ey); c.stroke();
    const g = c.createLinearGradient(cx - s * 0.5, 0, cx + s * 0.5, 0); g.addColorStop(0, '#ff8a3d'); g.addColorStop(0.5, '#ffd84d'); g.addColorStop(1, '#ff4d7d');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, ey, s * 0.55, s * 0.18, 0, 0, Math.PI * 2); c.fill(); c.lineWidth = s * 0.04; c.stroke();
  } else if (k === 'rainbow') {
    const g = c.createLinearGradient(0, ey - s * 0.18, 0, ey + s * 0.18);
    ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((col, i) => g.addColorStop(i / 5, col));
    c.globalAlpha = 0.7; c.fillStyle = g; for (const x of [L, R]) { c.beginPath(); c.arc(x, ey, s * 0.18, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1;
    for (const x of [L, R]) { c.beginPath(); c.arc(x, ey, s * 0.18, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(L + s * 0.18, ey); c.lineTo(R - s * 0.18, ey); c.stroke();
  } else if (k === 'threed') {
    c.fillStyle = '#ffffff'; c.fillRect(cx - s * 0.55, ey - s * 0.16, s * 1.1, s * 0.3);
    c.fillStyle = 'rgba(230,40,40,0.8)'; c.fillRect(L - s * 0.18, ey - s * 0.11, s * 0.34, s * 0.2);
    c.fillStyle = 'rgba(40,150,255,0.8)'; c.fillRect(R - s * 0.16, ey - s * 0.11, s * 0.34, s * 0.2);
  } else if (k === 'cat') {
    c.fillStyle = 'rgba(255,170,210,0.35)'; c.strokeStyle = '#e0408a'; c.lineWidth = s * 0.05;
    for (const [x, d] of [[L, -1], [R, 1]]) {
      c.beginPath(); c.moveTo(x - s * 0.17, ey - s * 0.02); c.quadraticCurveTo(x, ey + s * 0.18, x + s * 0.17, ey - s * 0.02);
      c.lineTo(x + d * s * 0.24, ey - s * 0.2); c.quadraticCurveTo(x, ey - s * 0.12, x - d * s * 0.2, ey - s * 0.1); c.closePath(); c.fill(); c.stroke();
    }
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
  } else if (k === 'wings') {
    // Hermes wings at both temples, gently flapping
    const flap = Math.sin(t * 5) * 0.12;
    for (const d of [-1, 1]) {
      c.save(); c.translate(d * s * 0.78, s * 0.42); c.scale(d, 1); c.rotate(-0.35 - flap);
      for (let f = 0; f < 4; f++) {
        const len = s * (0.95 - f * 0.17), ang = -0.95 + f * 0.32;
        c.save(); c.rotate(ang);
        c.fillStyle = f % 2 ? '#f4f1ea' : '#ffffff'; c.strokeStyle = '#b9b2a2'; c.lineWidth = s * 0.025;
        c.beginPath(); c.ellipse(len * 0.5, 0, len * 0.5, s * 0.11, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.restore();
      }
      c.fillStyle = '#e8b400'; c.beginPath(); c.arc(0, 0, s * 0.11, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  } else if (k === 'studcap') {
    // Finnish student cap: white crown, black band and peak, golden lyre
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.9, s * 0.42, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#15182a'; c.fillRect(-s * 0.84, -s * 0.16, s * 1.68, s * 0.2);
    c.beginPath(); c.ellipse(s * 0.05, s * 0.06, s * 0.62, s * 0.1, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#e8b400'; c.beginPath(); c.arc(0, -s * 0.07, s * 0.08, 0, Math.PI * 2); c.fill();
  } else if (k === 'grad') {
    // doctoral hat: tall black pleated silk with a golden lyre
    c.fillStyle = '#15182a'; c.fillRect(-s * 0.62, -s * 0.95, s * 1.24, s * 0.97);
    c.beginPath(); c.ellipse(0, -s * 0.95, s * 0.62, s * 0.14, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = s * 0.03;
    for (let x = -0.45; x <= 0.46; x += 0.15) { c.beginPath(); c.moveTo(x * s, -s * 0.9); c.lineTo(x * s, -s * 0.02); c.stroke(); }
    c.fillStyle = '#e8b400'; c.beginPath(); c.arc(0, -s * 0.3, s * 0.12, 0, Math.PI * 2); c.fill();
  } else if (k === 'wizard') {
    c.fillStyle = '#3a2a9a'; c.beginPath(); c.moveTo(-s * 0.7, -s * 0.05); c.quadraticCurveTo(-s * 0.1, -s * 0.8, s * 0.35, -s * 1.6); c.quadraticCurveTo(s * 0.2, -s * 0.7, s * 0.7, -s * 0.05); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, -s * 0.02, s * 1.0, s * 0.16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd84d'; mStar(c, -s * 0.1, -s * 0.5, s * 0.14, s * 0.06); c.fill(); mStar(c, s * 0.2, -s * 0.95, s * 0.09, s * 0.04); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.3, s * 0.05, 0, Math.PI * 2); c.fill();
  } else if (k === 'astro') {
    // a glass space helmet around the whole head
    c.fillStyle = 'rgba(200,230,255,0.18)'; c.strokeStyle = '#e8eef6'; c.lineWidth = s * 0.08;
    c.beginPath(); c.arc(0, s * 0.62, s * 1.18, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-s * 0.55, -s * 0.05, s * 0.12, s * 0.3, 0.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#b8c2d0'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(s * 0.5, -s * 0.38); c.lineTo(s * 0.62, -s * 0.8); c.stroke();
    c.fillStyle = '#ff4040'; c.beginPath(); c.arc(s * 0.62, -s * 0.82, s * 0.08, 0, Math.PI * 2); c.fill();
  } else if (k === 'valk') {
    // winged valkyrie helmet
    for (const d of [-1, 1]) {
      c.save(); c.translate(d * s * 0.75, -s * 0.25); c.scale(d, 1);
      for (let f = 0; f < 3; f++) { c.fillStyle = f % 2 ? '#f0ece2' : '#ffffff'; c.beginPath(); c.ellipse(s * 0.25, -s * (0.2 + f * 0.18), s * (0.45 - f * 0.08), s * 0.1, -0.6 - f * 0.25, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
    c.fillStyle = '#c8ced8'; c.beginPath(); c.arc(0, 0, s * 0.84, Math.PI, 0); c.fill();
    c.fillStyle = '#e8b400'; c.fillRect(-s * 0.84, -s * 0.12, s * 1.68, s * 0.14); c.fillRect(-s * 0.06, -s * 0.84, s * 0.12, s * 0.75);
  } else if (k === 'leafcrown' || k === 'flowers') {
    // a wreath of leaves (Yggdrasil) or of flowers
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (1.02 + i / 12 * 0.96), x = Math.cos(a) * s * 0.85, y = Math.sin(a) * s * 0.45;
      c.fillStyle = i % 2 ? '#2e8a3a' : '#4fb35d';
      c.beginPath(); c.ellipse(x, y, s * 0.16, s * 0.08, a + Math.PI / 2, 0, Math.PI * 2); c.fill();
      if (k === 'flowers' && i % 2 === 0) { c.fillStyle = ['#ff6fa8', '#ffd84d', '#ffffff', '#9b5de5'][i / 2 % 4]; c.beginPath(); c.arc(x, y - s * 0.02, s * 0.11, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(x, y - s * 0.02, s * 0.04, 0, Math.PI * 2); c.fill(); }
      if (k === 'leafcrown' && i % 4 === 2) { c.fillStyle = '#ffd84d'; c.beginPath(); c.arc(x, y, s * 0.05, 0, Math.PI * 2); c.fill(); }
    }
  } else if (k === 'heartcrown') {
    c.fillStyle = '#ffd1e0'; c.strokeStyle = '#e8b400'; c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(-s * 0.7, 0); c.lineTo(-s * 0.7, -s * 0.45); c.lineTo(-s * 0.35, -s * 0.25); c.lineTo(0, -s * 0.55); c.lineTo(s * 0.35, -s * 0.25); c.lineTo(s * 0.7, -s * 0.45); c.lineTo(s * 0.7, 0); c.closePath();
    c.fillStyle = '#ffcc33'; c.fill(); c.stroke();
    c.fillStyle = '#ff3d7a'; for (const [x, y, r] of [[-0.7, -0.5, 0.16], [0, -0.62, 0.22], [0.7, -0.5, 0.16]]) { mHeart(c, x * s, y * s, r * s); c.fill(); }
  } else if (k === 'chef') {
    c.fillStyle = '#ffffff'; c.strokeStyle = '#d8dce4'; c.lineWidth = s * 0.03;
    c.fillRect(-s * 0.6, -s * 0.45, s * 1.2, s * 0.45); c.strokeRect(-s * 0.6, -s * 0.45, s * 1.2, s * 0.45);
    for (const [x, y, r] of [[-0.45, -0.75, 0.38], [0.45, -0.75, 0.38], [0, -0.95, 0.45]]) { c.beginPath(); c.arc(x * s, y * s, r * s, 0, Math.PI * 2); c.fill(); }
  } else if (k === 'propeller') {
    c.fillStyle = '#2aa7e0'; c.beginPath(); c.arc(0, 0, s * 0.82, Math.PI, 0); c.fill();
    c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(0, 0, s * 0.82, Math.PI * 1.33, Math.PI * 1.67); c.lineTo(0, 0); c.fill();
    c.fillStyle = '#e01e37'; c.beginPath(); c.ellipse(s * 0.35, s * 0.02, s * 0.7, s * 0.12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#555'; c.fillRect(-s * 0.04, -s * 1.05, s * 0.08, s * 0.25);
    const w = Math.cos(t * 18) * s * 0.6; c.fillStyle = '#e01e37'; c.beginPath(); c.ellipse(0, -s * 1.05, Math.abs(w), s * 0.08, 0, 0, Math.PI * 2); c.fill();
  } else if (k === 'cowboy') {
    c.fillStyle = '#8a5a2a'; c.beginPath(); c.ellipse(0, -s * 0.05, s * 1.25, s * 0.22, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-s * 0.6, -s * 0.1); c.quadraticCurveTo(-s * 0.65, -s * 0.85, -s * 0.25, -s * 0.8); c.quadraticCurveTo(0, -s * 0.6, s * 0.25, -s * 0.8); c.quadraticCurveTo(s * 0.65, -s * 0.85, s * 0.6, -s * 0.1); c.closePath(); c.fill();
    c.fillStyle = '#4a2e14'; c.fillRect(-s * 0.6, -s * 0.3, s * 1.2, s * 0.14);
  } else if (k === 'nightcap') {
    const droop = Math.sin(t * 1.5) * s * 0.06;
    c.fillStyle = '#3a4fa8'; c.beginPath(); c.moveTo(-s * 0.85, 0); c.quadraticCurveTo(-s * 0.2, -s * 1.3, s * 1.1, -s * 0.4 + droop); c.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.85, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffd84d'; for (const [x, y] of [[-0.3, -0.45], [0.2, -0.6], [0.55, -0.4]]) { mStar(c, x * s, y * s, s * 0.08, s * 0.035); c.fill(); }
    c.fillStyle = '#ffffff'; c.fillRect(-s * 0.88, -s * 0.12, s * 1.76, s * 0.16); c.beginPath(); c.arc(s * 1.12, -s * 0.38 + droop, s * 0.15, 0, Math.PI * 2); c.fill();
  } else if (k === 'odinhelm') {
    // Odin's golden helmet with raven-black wings
    for (const d of [-1, 1]) {
      c.save(); c.translate(d * s * 0.75, -s * 0.2); c.scale(d, 1);
      for (let f = 0; f < 4; f++) { c.fillStyle = f % 2 ? '#2a2a34' : '#15151c'; c.beginPath(); c.ellipse(s * 0.3, -s * (0.15 + f * 0.17), s * (0.5 - f * 0.08), s * 0.1, -0.5 - f * 0.25, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
    const g = c.createLinearGradient(-s, -s, s, 0); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.5, '#e8b400'); g.addColorStop(1, '#8a5a00');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 0.86, Math.PI, 0); c.fill();
    c.fillStyle = '#8a5a00'; c.fillRect(-s * 0.86, -s * 0.12, s * 1.72, s * 0.14);
    c.fillStyle = '#b8323a'; c.beginPath(); c.arc(0, -s * 0.45, s * 0.1, 0, Math.PI * 2); c.fill();
  } else if (k === 'icecrown') {
    c.fillStyle = '#d8f4ff'; c.strokeStyle = '#7ab4d8'; c.lineWidth = s * 0.03;
    c.beginPath(); c.moveTo(-s * 0.75, 0);
    for (let i = 0; i <= 8; i++) { const x = -0.75 + i * 0.1875, h = [0.5, 0.8, 0.45, 1.0, 0.55, 0.95, 0.45, 0.75, 0.5][i]; c.lineTo((x - 0.07) * s, -s * 0.1); c.lineTo(x * s, -s * h); c.lineTo((x + 0.07) * s, -s * 0.1); }
    c.lineTo(s * 0.75, 0); c.closePath(); c.fill(); c.stroke();
  } else if (k === 'halo') {
    const bob = Math.sin(t * 2) * s * 0.05; c.strokeStyle = '#ffd84d'; c.lineWidth = s * 0.1;
    c.shadowColor = '#ffe680'; c.shadowBlur = s * 0.3; c.beginPath(); c.ellipse(0, -s * 0.85 + bob, s * 0.6, s * 0.16, 0, 0, Math.PI * 2); c.stroke(); c.shadowBlur = 0;
  }
  c.restore();
}
// </mascot>
