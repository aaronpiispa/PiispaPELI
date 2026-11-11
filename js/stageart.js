// PiispanPELI · Pictures for the balls of stages 2 and 3 (planets, stars, creatures, worlds, gems, formulas and degrees).
'use strict';

// Every picture is drawn once per size into a small bitmap and then only copied, so even the busy space
// pictures cost no more per frame than a flag. Sizes are rounded up to a power of two, so a handful of
// bitmaps covers every ball on screen.
const artCache = new Map();
let artFont = -1;   // the pictures with text are drawn again once the web font has arrived
function drawStageArt(art, level, S) {
  const m = ctx.getTransform(), px = Math.hypot(m.a, m.b) * S * 2;
  const size = clamp(2 ** Math.ceil(Math.log2(Math.max(16, px))), 16, 512), key = art + level + '|' + size;
  if (artFont !== fontGen) { artCache.clear(); artFont = fontGen; }
  let cv = artCache.get(key);
  if (!cv) {
    if (artCache.size > 90) artCache.clear();
    cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d'), keep = ctx;
    c.translate(size / 2, size / 2);
    ctx = c;
    try { STAGE_ART[art](level, size / 2); } finally { ctx = keep; }
    artCache.set(key, cv); heavyFrame = true;
  }
  ctx.drawImage(cv, -S, -S, 2 * S, 2 * S);
}

// ---- small helpers; S is half the picture's width and R (= S / 1.3) the ball's radius ----
function radial(S, c1, c2, fx, fy) {
  const R = S / 1.3, g = ctx.createRadialGradient(-R * (fx == null ? 0.3 : fx), -R * (fy == null ? 0.35 : fy), R * 0.08, 0, 0, R * 1.15);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
}
function starfield(S, seed, n, top) {
  const r = srand(seed);
  for (let k = 0; k < n; k++) {
    ctx.globalAlpha = 0.35 + r() * 0.65; ctx.fillStyle = r() < 0.15 ? '#ffd9a8' : r() < 0.3 ? '#a8d0ff' : '#ffffff';
    const s = S * (0.012 + r() * 0.022);
    ctx.fillRect((r() * 2 - 1) * S, (r() * 2 - 1) * S * (top || 1), s, s);
  }
  ctx.globalAlpha = 1;
}
function glow(x, y, r, col, a) {
  const [cr, cg, cb] = hexRgb(col), g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${a == null ? 1 : a})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function craters(S, seed, n, col) {
  const r = srand(seed), R = S / 1.3;
  for (let k = 0; k < n; k++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.95, x = Math.cos(a) * d, y = Math.sin(a) * d, s = R * (0.06 + r() * 0.13);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = s * 0.25; ctx.beginPath(); ctx.arc(x + s * 0.1, y + s * 0.1, s, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  }
}
function bands(S, cols, wob) {
  const n = cols.length, h = 2 * S / n;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.moveTo(-S, -S + k * h);
    for (let x = -S; x <= S; x += S / 8) ctx.lineTo(x, -S + k * h + Math.sin(x / S * 5 + k) * h * (wob || 0.18));
    ctx.lineTo(S, S); ctx.lineTo(-S, S); ctx.closePath(); ctx.fill();
  }
}
function centredText(t, y, S, maxW, size, col) {
  let fs = size;
  ctx.font = `700 ${fs}px ${FONT}`;
  const w = ctx.measureText(t).width;
  if (w > maxW) { fs *= maxW / w; ctx.font = `700 ${fs}px ${FONT}`; }
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 0, y); ctx.textBaseline = 'alphabetic';
}

const STAGE_ART = {
  // ------------------------------ the Solar System, from a pebble to the Sun ------------------------------
  solar(level, S) {
    const R = S / 1.3;
    switch (level) {
      case 0: radial(S, '#a39a92', '#3e3832'); craters(S, 1, 9, 'rgba(40,34,30,0.55)'); break;
      case 1: radial(S, '#9c8466', '#3a2c1e'); craters(S, 2, 7, 'rgba(50,36,22,0.6)'); break;
      case 2: // comet: icy nucleus with the tail streaming away
        radial(S, '#f2fbff', '#5f8fae');
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineCap = 'round';
        for (let k = -3; k <= 3; k++) { ctx.lineWidth = R * (0.05 + (3 - Math.abs(k)) * 0.02); ctx.beginPath(); ctx.moveTo(-R * 0.2, k * R * 0.12); ctx.quadraticCurveTo(R * 0.5, k * R * 0.2, S, k * R * 0.35 - R * 0.2); ctx.stroke(); }
        break;
      case 3: radial(S, '#b9b3aa', '#4b4741'); craters(S, 3, 8, 'rgba(50,46,40,0.5)'); glow(R * 0.3, -R * 0.45, R * 0.16, '#ffffff', 0.9); break;
      case 4: // Pluto with its pale heart
        radial(S, '#e2c4a4', '#6a4a32'); craters(S, 4, 4, 'rgba(90,60,40,0.4)');
        ctx.fillStyle = 'rgba(255,246,232,0.9)'; heartPath(ctx, R * 0.15, R * 0.42, R * 0.5); ctx.fill(); break;
      case 5: // the Moon with its dark seas
        radial(S, '#eeeeee', '#6c6c70');
        ctx.fillStyle = 'rgba(90,90,100,0.45)';
        for (const [x, y, w, h] of [[-0.35, -0.3, 0.32, 0.22], [0.25, -0.15, 0.25, 0.3], [-0.1, 0.35, 0.3, 0.18]]) { ctx.beginPath(); ctx.ellipse(x * R, y * R, w * R, h * R, 0.4, 0, TAU); ctx.fill(); }
        craters(S, 5, 5, 'rgba(110,110,116,0.45)'); break;
      case 6: radial(S, '#b8a99c', '#4d4038'); craters(S, 6, 12, 'rgba(70,58,50,0.5)'); break;
      case 7: // Mars: red with dark plains and a white polar cap
        radial(S, '#e0703a', '#6a1e08');
        ctx.fillStyle = 'rgba(90,30,10,0.4)'; ctx.beginPath(); ctx.ellipse(-R * 0.2, R * 0.1, R * 0.55, R * 0.18, -0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff4ee'; ctx.beginPath(); ctx.ellipse(0, -R * 0.98, R * 0.45, R * 0.18, 0, 0, TAU); ctx.fill(); break;
      case 8: radial(S, '#fbe7b0', '#a8742a'); ctx.globalAlpha = 0.35; bands(S, ['#fff3d0', '#e8c070', '#f6dca0', '#d8a850', '#f2d590', '#c89040'], 0.3); ctx.globalAlpha = 1; break;
      case 9: // the Earth: oceans, land and clouds
        radial(S, '#5aa8ff', '#0c2c74');
        ctx.fillStyle = '#3f9d4a';
        for (const [x, y, w, h, a] of [[-0.4, -0.25, 0.32, 0.45, 0.3], [0.35, 0.1, 0.3, 0.5, -0.2], [-0.05, 0.55, 0.25, 0.15, 0], [0.2, -0.55, 0.3, 0.15, 0.4]]) { ctx.beginPath(); ctx.ellipse(x * R, y * R, w * R, h * R, a, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineCap = 'round'; ctx.lineWidth = R * 0.09;
        for (const [x, y, w] of [[-0.6, 0.15, 0.5], [0.0, -0.75, 0.6], [0.1, 0.8, 0.45]]) { ctx.beginPath(); ctx.moveTo(x * R, y * R); ctx.quadraticCurveTo((x + w / 2) * R, (y - 0.12) * R, (x + w) * R, y * R); ctx.stroke(); }
        break;
      case 10: // Neptune: deep blue with a dark storm
        radial(S, '#7aa0ff', '#0d1f7a'); ctx.globalAlpha = 0.25; bands(S, ['#9ab8ff', '#3a5fd8', '#5a7ff0', '#2a4ac0', '#6a8ff8'], 0.12); ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(10,20,70,0.6)'; ctx.beginPath(); ctx.ellipse(R * 0.3, R * 0.35, R * 0.22, R * 0.12, 0, 0, TAU); ctx.fill(); break;
      case 11: // Uranus: pale cyan on its side, with a thin upright ring
        radial(S, '#d8fbfd', '#3a9aa8');
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.18, R * 1.1, 0.15, 0, TAU); ctx.stroke(); break;
      case 12: // Saturn: bands and the rings
        radial(S, '#f6dfa4', '#8a6424'); ctx.globalAlpha = 0.35; bands(S, ['#fff0c8', '#e0b868', '#f4d898', '#c8984a', '#ecd088'], 0.08); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(240,220,170,0.95)'; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.ellipse(0, R * 0.15, R * 1.25, R * 0.3, -0.25, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(150,120,70,0.7)'; ctx.lineWidth = R * 0.04; ctx.beginPath(); ctx.ellipse(0, R * 0.15, R * 1.08, R * 0.24, -0.25, 0, TAU); ctx.stroke(); break;
      case 13: // Jupiter: bands and the Great Red Spot
        radial(S, '#f6e2c4', '#7a4a24', 0.2, 0.2); ctx.globalAlpha = 0.55; bands(S, ['#f8ecd8', '#c88a58', '#f2dcc0', '#b06a3a', '#ead2b0', '#c88a58', '#f4e4cc', '#a86034'], 0.12); ctx.globalAlpha = 1;
        ctx.fillStyle = '#c0442a'; ctx.beginPath(); ctx.ellipse(R * 0.35, R * 0.4, R * 0.28, R * 0.15, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,190,0.6)'; ctx.lineWidth = R * 0.04; ctx.stroke(); break;
      default: { // the Sun: glowing, with granules and a flare
        const g = ctx.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 1.2);
        g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffe14a'); g.addColorStop(0.75, '#ff9a1a'); g.addColorStop(1, '#d24a00');
        ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
        const r = srand(14);
        for (let k = 0; k < 60; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,220,0.25)' : 'rgba(220,110,0,0.22)'; ctx.beginPath(); ctx.arc((r() * 2 - 1) * R, (r() * 2 - 1) * R, R * (0.04 + r() * 0.06), 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(120,40,0,0.5)'; ctx.beginPath(); ctx.arc(-R * 0.45, R * 0.5, R * 0.07, 0, TAU); ctx.arc(-R * 0.3, R * 0.56, R * 0.05, 0, TAU); ctx.fill();
      }
    }
  },

  // ------------------------------ the galaxy: stars, nebulae, galaxies and the whole universe ------------------------------
  galaxy(level, S) {
    const R = S / 1.3, sky = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 1.3);
    sky.addColorStop(0, ['#1a1440', '#101836', '#2a1020', '#1a1a10', '#0e1a40', '#301008', '#121a36', '#082a2c', '#2a0c1c', '#140a08', '#0e1030', '#1c0c2a', '#0a0c22', '#06081a', '#1a0c30'][level]);
    sky.addColorStop(1, '#03040c');
    ctx.fillStyle = sky; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    starfield(S, 30 + level, 26 + level * 3);
    const star = (col, r) => { glow(0, 0, R * r * 2.2, col, 0.55); glow(0, 0, R * r, '#ffffff', 1); };
    switch (level) {
      case 0: star('#dfe8ff', 0.22); break;
      case 1: // neutron star with its two beams
        ctx.strokeStyle = 'rgba(160,210,255,0.5)'; ctx.lineWidth = R * 0.12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-R * 0.9, -R * 0.9); ctx.lineTo(R * 0.9, R * 0.9); ctx.stroke(); star('#7fc4ff', 0.2); break;
      case 2: glow(0, 0, R * 0.9, '#ff6a3a', 0.7); glow(0, 0, R * 0.32, '#ffb08a', 1); break;
      case 3: glow(0, 0, R * 1.1, '#ffd34a', 0.7); glow(0, 0, R * 0.42, '#fff6c8', 1); break;
      case 4: glow(0, 0, R * 1.4, '#5a9dff', 0.8); glow(0, 0, R * 0.55, '#e8f2ff', 1); break;
      case 5: glow(0, 0, R * 1.5, '#ff5a1a', 0.9); glow(0, 0, R * 0.75, '#ffb070', 1); break;
      case 6: { // star cluster
        const r = srand(6);
        for (let k = 0; k < 70; k++) { const a = r() * TAU, d = Math.pow(r(), 1.8) * R * 1.1; glow(Math.cos(a) * d, Math.sin(a) * d, R * (0.05 + r() * 0.08), r() < 0.3 ? '#9cc8ff' : '#fff2d0', 1); }
        break;
      }
      case 7: // planetary nebula: a glowing ring
        ctx.lineWidth = R * 0.4; ctx.strokeStyle = 'rgba(255,90,110,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.8, R * 0.62, 0.4, 0, TAU); ctx.stroke();
        ctx.lineWidth = R * 0.22; ctx.strokeStyle = 'rgba(80,240,220,0.6)'; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.62, R * 0.48, 0.4, 0, TAU); ctx.stroke();
        glow(0, 0, R * 0.2, '#ffffff'); break;
      case 8: { // supernova: a burst of light
        const r = srand(8);
        ctx.lineCap = 'round';
        for (let k = 0; k < 26; k++) { const a = k / 26 * TAU + r() * 0.2, l = R * (0.7 + r() * 0.6); ctx.strokeStyle = k % 2 ? 'rgba(255,200,90,0.7)' : 'rgba(255,120,160,0.6)'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l); ctx.stroke(); }
        glow(0, 0, R * 0.9, '#ffe9a0', 0.9); glow(0, 0, R * 0.35, '#ffffff'); break;
      }
      case 9: // black hole with a glowing disc
        glow(0, 0, R * 1.2, '#ff8a2a', 0.35);
        ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = R * 0.2; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.0, R * 0.3, -0.2, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, R * 0.48, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,150,0.9)'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffcc70'; ctx.lineWidth = R * 0.12; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.0, R * 0.3, -0.2, 0, Math.PI); ctx.stroke(); break;
      case 10: case 11: { // spiral galaxies: the Milky Way face-on, Andromeda tilted
        ctx.save(); if (level === 11) { ctx.rotate(-0.6); ctx.scale(1, 0.45); }
        const r = srand(level), cols = level === 10 ? ['#cfe0ff', '#9ec0ff', '#ffffff'] : ['#ffd0e8', '#e8b0ff', '#ffffff'];
        glow(0, 0, R * 1.2, level === 10 ? '#6a8cff' : '#c070ff', 0.35);
        for (let arm = 0; arm < 2; arm++) for (let k = 0; k < 90; k++) {
          const t = k / 90, a = arm * Math.PI + t * 7, d = t * R * 1.15 + (r() - 0.5) * R * 0.14;
          ctx.globalAlpha = 0.9 - t * 0.5; ctx.fillStyle = cols[k % 3];
          ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.025 + r() * 0.035), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1; glow(0, 0, R * 0.32, '#fff4d0'); ctx.restore(); break;
      }
      case 12: { // a cluster of galaxies
        const r = srand(12);
        for (let k = 0; k < 9; k++) {
          const x = (r() * 2 - 1) * R * 0.8, y = (r() * 2 - 1) * R * 0.8, s = R * (0.12 + r() * 0.16);
          ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU); ctx.scale(1, 0.45 + r() * 0.4);
          glow(0, 0, s, ['#ffe0b0', '#c0d4ff', '#ffc0e0'][k % 3], 0.95); ctx.restore();
        }
        glow(0, 0, R * 0.25, '#fff0d0'); break;
      }
      case 13: { // supercluster: the cosmic web
        const r = srand(13), nodes = [];
        for (let k = 0; k < 14; k++) nodes.push([(r() * 2 - 1) * R * 1.05, (r() * 2 - 1) * R * 1.05]);
        ctx.lineWidth = R * 0.035;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
          if (d < R * 0.75) { ctx.strokeStyle = `rgba(150,170,255,${0.6 - d / R * 0.6})`; ctx.beginPath(); ctx.moveTo(nodes[i][0], nodes[i][1]); ctx.lineTo(nodes[j][0], nodes[j][1]); ctx.stroke(); }
        }
        for (const [x, y] of nodes) glow(x, y, R * 0.14, '#c8b0ff', 0.95);
        break;
      }
      default: { // the whole universe: a glowing many-coloured sky full of galaxies
        const r = srand(15), cols = ['#ff5a7a', '#ffb84a', '#6aff9a', '#4ab8ff', '#b06aff', '#ff6ae0'];
        for (let k = 0; k < 26; k++) glow((r() * 2 - 1) * S, (r() * 2 - 1) * S, R * (0.3 + r() * 0.45), cols[k % cols.length], 0.45);
        starfield(S, 99, 70);
        for (let k = 0; k < 10; k++) { ctx.save(); ctx.translate((r() * 2 - 1) * R, (r() * 2 - 1) * R); ctx.rotate(r() * TAU); ctx.scale(1, 0.4); glow(0, 0, R * 0.1, '#ffffff', 0.9); ctx.restore(); }
      }
    }
  },

  // ------------------------------ Norse creatures, from a house elf to Ymir ------------------------------
  creature(level, S) {
    const cols = [['#c0503a', '#4a1408'], ['#9fe0b0', '#2a6a44'], ['#8a6a4a', '#2e2010'], ['#6a8a4a', '#1e2e10'], ['#d9a0c0', '#5a2848'],
      ['#6a7a8a', '#141a22'], ['#e8e8ff', '#5a5aa8'], ['#8aa8c8', '#2a3a5a'], ['#c8c8c8', '#3a3a3a'], ['#a04a3a', '#2a0a06'],
      ['#4a8a6a', '#0a2418'], ['#5a5a6a', '#0a0a12'], ['#ff7a2a', '#5a0a00'], ['#3aa88a', '#04281e'], ['#d8e8f8', '#4a6a98']][level];
    const marks = ['kenaz', 'wunjo', 'hagalaz', 'thurisaz', 'berkano', 'hagalaz', 'algiz', 'thurisaz', 'raido', 'kenaz', 'othala', 'fehu', 'sowilo', 'laguz', 'mannaz'];
    const R = S / 1.3;
    radial(S, cols[0], cols[1]);
    // scales on the bigger beasts, a knot band on the rest
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = R * 0.04;
    if (level >= 9) { for (let y = R * 0.45; y < S; y += R * 0.2) for (let x = -S + ((y / R * 5) % 2) * R * 0.1; x < S; x += R * 0.2) { ctx.beginPath(); ctx.arc(x, y, R * 0.1, 0, Math.PI); ctx.stroke(); } }
    else { ctx.beginPath(); for (let x = -R; x <= R; x += R * 0.25) { ctx.moveTo(x, R * 0.78); ctx.lineTo(x + R * 0.125, R * 0.62); ctx.lineTo(x + R * 0.25, R * 0.78); } ctx.stroke(); }
    // horns for trolls and giants, a little cap for the house elf
    if (level === 0) { ctx.fillStyle = '#d02a2a'; ctx.beginPath(); ctx.moveTo(-R * 0.6, -R * 0.55); ctx.quadraticCurveTo(R * 0.1, -R * 1.4, R * 0.6, -R * 0.55); ctx.closePath(); ctx.fill(); }
    if (level === 3 || level === 7 || level === 14) {
      ctx.fillStyle = level === 14 ? '#f4f8ff' : '#e8dcc0';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * R * 0.45, -R * 0.62); ctx.quadraticCurveTo(d * R * 0.95, -R * 0.9, d * R * 0.75, -R * 1.25); ctx.quadraticCurveTo(d * R * 0.7, -R * 0.85, d * R * 0.25, -R * 0.72); ctx.closePath(); ctx.fill(); }
    }
    ctx.save(); ctx.translate(0, -R * 0.58); ctx.scale(R * 0.25, R * 0.25);
    ctx.strokeStyle = level === 6 || level === 14 || level === 1 ? '#3a2a10' : '#ffd84d'; ctx.lineWidth = 0.38; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (const line of RUNES[marks[level]]) line.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();
  },

  // ------------------------------ the nine worlds of Yggdrasil, each a little landscape ------------------------------
  world(level, S) {
    const R = S / 1.3, W = [
      ['#dff4ff', '#8ab8d8', '#f4fbff', 'ice'], ['#ff8a2a', '#5a0a00', '#2a0800', 'fire'], ['#5a6a62', '#1a221e', '#2a302c', 'mist'],
      ['#2a1a3a', '#0a0610', '#3a2a4a', 'cave'], ['#3a2a1a', '#120a04', '#5a3a1a', 'forge'], ['#fff3c0', '#9ad8a0', '#6ac080', 'light'],
      ['#9ae0c0', '#2a8a7a', '#3aa060', 'hills'], ['#a8b8c8', '#4a5a6a', '#dfe8f0', 'peaks'], ['#6ab8ff', '#cfeaff', '#4a9a3a', 'hills'],
      ['#1a2a5a', '#5a6ac8', '#2a3a6a', 'rainbow'], ['#ffe08a', '#ff9a5a', '#f4f4ff', 'castle'], ['#ffcf6a', '#c06a1a', '#7a3a10', 'hall'],
      ['#000000', '#1a1a2a', '#000000', 'void'], ['#ff3a1a', '#2a0000', '#140404', 'doom'], ['#3a6aa8', '#0a1a3a', '#2a5a2a', 'tree']][level];
    const [top, bot, ground, kind] = W, hz = R * 0.35;
    const g = ctx.createLinearGradient(0, -S, 0, hz); g.addColorStop(0, bot); g.addColorStop(1, top);
    ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    if (kind === 'void') {
      // Ginnungagap: fire from one side and ice from the other meet in the empty gap
      glow(-S, 0, R * 1.2, '#4ab8ff', 0.8); glow(S, 0, R * 1.2, '#ff6a1a', 0.8); starfield(S, 12, 30); return;
    }
    if (kind === 'rainbow') {
      starfield(S, 9, 30, 0.5);
      ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.arc(0, R * 1.0, R * (1.15 - k * 0.1), Math.PI, 0); ctx.stroke(); });
    }
    if (kind === 'fire' || kind === 'doom') glow(0, hz, R * 1.2, '#ffcc33', 0.6);
    if (kind === 'light') glow(0, -R * 0.2, R * 1.1, '#ffffff', 0.7);
    if (kind === 'forge') glow(0, hz, R * 0.8, '#ff9a2a', 0.6);
    // the ground line
    ctx.fillStyle = ground; ctx.beginPath(); ctx.moveTo(-S, S);
    for (let x = -S; x <= S; x += S / 10) {
      const y = kind === 'peaks' ? hz - Math.abs(Math.sin(x / R * 3)) * R * 0.5 : kind === 'ice' ? hz - Math.abs(Math.sin(x / R * 4)) * R * 0.25 : hz - Math.sin(x / R * 2.5 + level) * R * 0.1;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(S, S); ctx.closePath(); ctx.fill();
    if (kind === 'castle' || kind === 'hall') {
      ctx.fillStyle = kind === 'castle' ? '#ffd84d' : '#ffe9a0';
      if (kind === 'castle') for (const [x, h] of [[-0.45, 0.5], [-0.15, 0.75], [0.15, 0.6], [0.45, 0.45]]) { ctx.fillRect((x - 0.1) * R, hz - h * R, 0.2 * R, h * R); ctx.beginPath(); ctx.moveTo((x - 0.13) * R, hz - h * R); ctx.lineTo(x * R, hz - (h + 0.22) * R); ctx.lineTo((x + 0.13) * R, hz - h * R); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(-R * 0.7, hz); ctx.lineTo(-R * 0.7, hz - R * 0.35); ctx.lineTo(0, hz - R * 0.75); ctx.lineTo(R * 0.7, hz - R * 0.35); ctx.lineTo(R * 0.7, hz); ctx.fill();
        ctx.fillStyle = '#b8323a'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * R * 0.26, hz - R * 0.18, R * 0.1, 0, TAU); ctx.fill(); } }
    }
    if (kind === 'tree') {
      // Yggdrasil holding up the worlds
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-R * 0.1, -R * 0.3, R * 0.2, hz + R * 0.3);
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = R * 0.07; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, hz); ctx.quadraticCurveTo(d * R * 0.4, hz + R * 0.2, d * R * 0.8, hz + R * 0.3); ctx.stroke(); }
      ctx.fillStyle = '#4fb35d'; for (const [x, y, r] of [[0, -0.75, 0.5], [-0.5, -0.5, 0.38], [0.5, -0.5, 0.38], [-0.25, -1.0, 0.3], [0.3, -1.0, 0.3]]) { ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffd84d'; for (const [x, y] of [[-0.4, -0.7], [0.35, -0.85], [0, -0.5], [0.55, -0.45], [-0.6, -0.4]]) { ctx.beginPath(); ctx.arc(x * R, y * R, R * 0.06, 0, TAU); ctx.fill(); }
    }
    if (kind === 'doom') { ctx.fillStyle = 'rgba(255,120,40,0.8)'; const r = srand(13); for (let k = 0; k < 18; k++) ctx.fillRect((r() * 2 - 1) * S, (r() * 2 - 1) * S * 0.6, R * 0.04, R * 0.04); }
    if (kind === 'mist' || kind === 'ice') { ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse((k - 1) * R * 0.6, hz + R * 0.05 - k * R * 0.12, R * 0.6, R * 0.08, 0, 0, TAU); ctx.fill(); } }
  },

  // ------------------------------ gem hearts, from quartz to diamond ------------------------------
  gem(level, S) {
    const R = S / 1.3, col = ['#f2e2ee', '#d8ecff', '#f0a020', '#f7b267', '#9acd32', '#00a86b', '#6ad8cc', '#1fa055', '#1f5fd0', '#9966cc', '#a01a32', '#e0115f', '#f8f2e8', '#dcdde2', '#e8f8ff'][level];
    const [r, g, b] = hexRgb(col), dark = `rgb(${r * 0.35 | 0},${g * 0.35 | 0},${b * 0.35 | 0})`;
    // velvet behind the gem
    radial(S, `rgb(${r * 0.55 | 0},${g * 0.4 | 0},${b * 0.55 | 0})`, '#140812');
    const lg = ctx.createLinearGradient(-R, -R, R, R);
    if (level === 1) { lg.addColorStop(0, '#ffe0f0'); lg.addColorStop(0.3, '#c8f0ff'); lg.addColorStop(0.6, '#e0ffd0'); lg.addColorStop(1, '#a8b8ff'); }  // opal shimmers
    else { lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.35, col); lg.addColorStop(1, dark); }
    ctx.fillStyle = lg; heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.fill();
    if (level !== 12 && level !== 13) {
      // facets: lines from a table in the middle of the heart to its edge
      ctx.save(); heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = R * 0.025;
      const tx = 0, ty = -R * 0.12;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(tx + Math.cos(a) * R * 0.22, ty + Math.sin(a) * R * 0.18); ctx.lineTo(tx + Math.cos(a) * R * 1.4, ty + Math.sin(a) * R * 1.4); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(tx, ty, R * 0.22, R * 0.18, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    ctx.lineWidth = R * 0.05; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.stroke();
    if (level >= 12) {
      ctx.fillStyle = '#ffffff';
      for (const [x, y, s] of [[-0.45, -0.45, 0.13], [0.5, -0.3, 0.1], [0.3, 0.45, 0.08], [-0.6, 0.3, 0.07]]) { ctx.beginPath(); ctx.moveTo(x * R, (y - s) * R); ctx.lineTo((x + s * 0.3) * R, y * R); ctx.lineTo(x * R, (y + s) * R); ctx.lineTo((x - s * 0.3) * R, y * R); ctx.closePath(); ctx.fill(); }
    }
  },

  // ------------------------------ cosmic hearts: hearts made of the night sky ------------------------------
  cosmic(level, S) {
    const R = S / 1.3, C = [['#e8e0ff', '#7a6ad8'], ['#f0f0f0', '#7a7a88'], ['#d8f4ff', '#3a8ac8'], ['#6affb0', '#a04aff'], ['#5aa8ff', '#2a8a4a'],
      ['#ffe0a0', '#c08a3a'], ['#fff6c0', '#ffb020'], ['#ffd080', '#80b0ff'], ['#ff7ac8', '#4ad8e8'], ['#fff0a0', '#ff4a6a'],
      ['#c0e8ff', '#3a6aff'], ['#ffffff', '#a04aff'], ['#ffd0f0', '#6a4aff'], ['#ffaa3a', '#000000'], ['#ff5a8a', '#4ab8ff']][level];
    const sky = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 1.3); sky.addColorStop(0, '#2a1446'); sky.addColorStop(1, '#05030e');
    ctx.fillStyle = sky; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    starfield(S, 60 + level, 30);
    glow(0, 0, R * 1.25, C[1], 0.45);
    const hg = ctx.createLinearGradient(-R, -R, R, R);
    if (level === 14) ['#ff5a8a', '#ffb84a', '#ffee5a', '#6aff9a', '#4ab8ff', '#b06aff'].forEach((c, k) => hg.addColorStop(k / 5, c));
    else if (level === 13) { hg.addColorStop(0, '#2a1a10'); hg.addColorStop(1, '#000000'); }
    else { hg.addColorStop(0, C[0]); hg.addColorStop(1, C[1]); }
    ctx.fillStyle = hg; heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.fill();
    ctx.save(); heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.clip();
    starfield(S, 80 + level, 18 + level * 2);
    if (level === 10 || level === 12) {
      // a little spiral inside the heart
      const r = srand(level);
      for (let k = 0; k < 70; k++) { const t = k / 70, a = (k % 2) * Math.PI + t * 6, d = t * R * 0.7; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(Math.cos(a) * d, -R * 0.15 + Math.sin(a) * d * 0.8, R * (0.02 + r() * 0.03), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    if (level === 5) { ctx.strokeStyle = 'rgba(255,230,170,0.9)'; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.ellipse(0, -R * 0.1, R * 1.2, R * 0.25, -0.3, 0, TAU); ctx.stroke(); }
    if (level === 13) { ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = R * 0.08; heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.stroke(); }
    else { ctx.lineWidth = R * 0.04; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.stroke(); }
  },

  // ------------------------------ physics formulas on a blue chalkboard ------------------------------
  physics(level, S) {
    const R = S / 1.3, hue = 222 + level * 5;
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
    g.addColorStop(0, `hsl(${hue},40%,36%)`); g.addColorStop(1, `hsl(${hue},48%,15%)`);
    ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    // a faint atom on the forehead
    ctx.strokeStyle = 'rgba(245,245,230,0.35)'; ctx.lineWidth = R * 0.03;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, -R * 0.62, R * 0.28, R * 0.1, k * Math.PI / 3, 0, TAU); ctx.stroke(); }
    centredText(STAGES.uni[1].names[level], R * 0.58, S, R * 1.35, R * 0.34, 'rgba(245,245,230,0.95)');
  },

  // ------------------------------ university degrees, up to the theory of everything ------------------------------
  degree(level, S) {
    const R = S / 1.3, LBL = ['ABC', '1st', 'BSc', 'MSc', 'Lic', 'PhD', 'Doc', 'Prof', 'Dean', 'Rector', 'Acad', 'h.c.', 'Fields', 'Nobel', '∞'];
    const hue = [200, 190, 160, 140, 120, 280, 260, 240, 330, 350, 0, 20, 35, 45, 50][level];
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
    g.addColorStop(0, `hsl(${hue},45%,${level >= 12 ? 55 : 40}%)`); g.addColorStop(1, `hsl(${hue},55%,${level >= 12 ? 22 : 14}%)`);
    ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    if (level >= 12 && level < 14) {
      // a gold medal on a ribbon
      ctx.fillStyle = '#3a6fd8'; ctx.fillRect(-R * 0.12, -R * 1.2, R * 0.24, R * 0.5);
      const mg = ctx.createRadialGradient(-R * 0.08, -R * 0.68, 0, 0, -R * 0.6, R * 0.25); mg.addColorStop(0, '#fff3b0'); mg.addColorStop(1, '#b08000');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, -R * 0.6, R * 0.22, 0, TAU); ctx.fill();
    } else if (level === 14) {
      glow(0, -R * 0.6, R * 0.5, '#fff0a0', 0.9);
    } else {
      // a graduation cap with a tassel
      ctx.fillStyle = '#121418'; ctx.beginPath(); ctx.moveTo(0, -R * 0.95); ctx.lineTo(R * 0.5, -R * 0.72); ctx.lineTo(0, -R * 0.5); ctx.lineTo(-R * 0.5, -R * 0.72); ctx.closePath(); ctx.fill();
      ctx.fillRect(-R * 0.25, -R * 0.66, R * 0.5, R * 0.18);
      ctx.strokeStyle = level >= 5 ? '#ffd84d' : '#e0e0e0'; ctx.lineWidth = R * 0.035; ctx.beginPath(); ctx.moveTo(0, -R * 0.72); ctx.lineTo(R * 0.42, -R * 0.62); ctx.lineTo(R * 0.42, -R * 0.4); ctx.stroke();
    }
    centredText(LBL[level], R * 0.6, S, R * 1.2, R * (level === 14 ? 0.5 : 0.32), level >= 12 ? '#fff6d0' : 'rgba(245,240,225,0.95)');
  }
};
