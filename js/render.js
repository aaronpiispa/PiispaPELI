// PiispanPELI · Drawing the wagon, balls, buttons, HUD and the main loop.
'use strict';

// ------------------------------ drawing ------------------------------
const OLX = new Float64Array(512), OLY = new Float64Array(512);
function worldTf(sx, sy) { ctx.setTransform(dpr * SC, 0, 0, dpr * SC, dpr * (OX + sx), dpr * (OY + sy)); }
function screenTf() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }

function drawFlag(level, S) {
  const [type, cols, wts] = FLAGS[level];
  if (type === 'tr') {
    // red with white crescent and star
    ctx.fillStyle = cols[0]; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(-0.12 * S, 0, 0.36 * S, 0, TAU); ctx.fill();
    ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(-0.03 * S, 0, 0.29 * S, 0, TAU); ctx.fill();
    ctx.fillStyle = cols[1]; ctx.beginPath();
    for (let p = 0; p < 10; p++) { const r = p % 2 ? 0.07 * S : 0.17 * S, a = p * Math.PI / 5; ctx.lineTo(0.32 * S + Math.cos(a) * r, Math.sin(a) * r); }
    ctx.fill();
    return;
  }
  if (type === 'su') {
    // red flag with gold star, hammer and sickle
    ctx.fillStyle = cols[0]; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    ctx.strokeStyle = cols[1]; ctx.fillStyle = cols[1]; ctx.lineCap = 'round';
    ctx.lineWidth = 0.04 * S; ctx.beginPath();
    for (let p = 0; p <= 10; p++) { const r = p % 2 ? 0.05 * S : 0.12 * S, a = -Math.PI / 2 + p * Math.PI / 5; ctx.lineTo(-0.3 * S + Math.cos(a) * r, -0.6 * S + Math.sin(a) * r); }
    ctx.stroke();
    ctx.lineWidth = 0.09 * S;
    ctx.beginPath(); ctx.arc(-0.28 * S, -0.12 * S, 0.27 * S, -0.35 * Math.PI, 0.75 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.5 * S, 0.12 * S); ctx.lineTo(-0.62 * S, 0.24 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.52 * S, 0.2 * S); ctx.lineTo(-0.12 * S, -0.3 * S); ctx.stroke();
    ctx.lineWidth = 0.1 * S; ctx.beginPath(); ctx.moveTo(-0.24 * S, -0.42 * S); ctx.lineTo(-0.02 * S, -0.2 * S); ctx.stroke();
    return;
  }
  if (type === 'eu') {
    // European Union: blue with a circle of twelve gold stars, each with one point straight up
    ctx.fillStyle = cols[0]; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    ctx.fillStyle = cols[1]; ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = k * TAU / 12, sx = Math.cos(a) * 0.56 * S, sy = Math.sin(a) * 0.56 * S;
      for (let p = 0; p < 10; p++) {
        const r = p % 2 ? 0.05 * S : 0.125 * S, b = -Math.PI / 2 + p * Math.PI / 5, x = sx + Math.cos(b) * r, y = sy + Math.sin(b) * r;
        if (p) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    }
    ctx.fill();
    return;
  }
  if (type === 'n') {
    // Nordic cross
    ctx.fillStyle = cols[0]; ctx.fillRect(-S, -S, 2 * S, 2 * S);
    ctx.fillStyle = cols[1];
    const t = 0.34 * S, cx = -0.22 * S;
    ctx.fillRect(cx - t / 2, -S, t, 2 * S); ctx.fillRect(-S, -t / 2, 2 * S, t);
    return;
  }
  const w = wts || cols.map(() => 1), sum = w.reduce((a, b) => a + b, 0);
  let p = -S;
  for (let i = 0; i < cols.length; i++) {
    const len = 2 * S * w[i] / sum;
    ctx.fillStyle = cols[i];
    if (type === 'v') ctx.fillRect(p, -S, len + 0.02 * S, 2 * S); else ctx.fillRect(-S, p, 2 * S, len + 0.02 * S);
    p += len;
  }
}

// ------------------------------ themed balls ------------------------------
// the picture on a ball: a flag for the EU train, a god, a heart or a sum for the other themes.
// Drawn around (0, 0) like drawFlag; S is the flag size (1.3 × the ball radius)
function drawBallArt(level, S) {
  const id = theme().id;
  if (stage > 0) { drawStageArt(STAGES[id][stage].art, level, S); return; }
  if (id === 'viking') drawGodBall(level, S);
  else if (id === 'heart') drawHeartBall(level, S);
  else if (id === 'uni') drawMathBall(level, S);
  else drawFlag(level, S);
}
// runes as strokes in a box 1 wide and 2 tall (no font needed, so they look the same on every phone)
const RUNES = {
  raido: [[[-0.35, -1], [-0.35, 1]], [[-0.35, -1], [0.35, -0.55], [-0.35, -0.1], [0.35, 1]]],
  hagalaz: [[[-0.35, -1], [-0.35, 1]], [[0.35, -1], [0.35, 1]], [[-0.35, -0.3], [0.35, 0.3]]],
  mannaz: [[[-0.35, -1], [-0.35, 1]], [[0.35, -1], [0.35, 1]], [[-0.35, -1], [0.35, -0.3]], [[0.35, -1], [-0.35, -0.3]]],
  wunjo: [[[-0.3, -1], [-0.3, 1]], [[-0.3, -1], [0.35, -0.55], [-0.3, -0.1]]],
  berkano: [[[-0.35, -1], [-0.35, 1]], [[-0.35, -1], [0.35, -0.5], [-0.35, 0], [0.35, 0.5], [-0.35, 1]]],
  dagaz: [[[-0.45, -1], [-0.45, 1]], [[0.45, -1], [0.45, 1]], [[-0.45, -1], [0.45, 1]], [[0.45, -1], [-0.45, 1]]],
  tiwaz: [[[0, -1], [0, 1]], [[-0.45, -0.45], [0, -1], [0.45, -0.45]]],
  laguz: [[[-0.2, -1], [-0.2, 1]], [[-0.2, -1], [0.4, -0.45]]],
  fehu: [[[-0.3, -1], [-0.3, 1]], [[-0.3, -0.3], [0.4, -1]], [[-0.3, 0.2], [0.4, -0.5]]],
  algiz: [[[0, -1], [0, 1]], [[0, -0.3], [-0.45, -1]], [[0, -0.3], [0.45, -1]]],
  othala: [[[0, -1], [0.4, -0.4], [-0.35, 1]], [[0, -1], [-0.4, -0.4], [0.35, 1]]],
  sowilo: [[[0.35, -1], [-0.35, -0.35], [0.35, 0.35], [-0.35, 1]]],
  kenaz: [[[0.35, -0.6], [-0.3, 0], [0.35, 0.6]]],
  thurisaz: [[[-0.3, -1], [-0.3, 1]], [[-0.3, -0.45], [0.35, 0], [-0.3, 0.45]]],
  ansuz: [[[-0.3, -1], [-0.3, 1]], [[-0.3, -1], [0.4, -0.55]], [[-0.3, -0.45], [0.4, 0]]]
};
function drawGodBall(level, S) {
  const tb = THEME_BALLS.viking, [c1, c2] = tb.cols[level], R = S / 1.3;
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
  // a band of knotwork across the bottom
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = R * 0.05;
  ctx.beginPath(); for (let x = -R; x <= R; x += R * 0.25) { ctx.moveTo(x, R * 0.62); ctx.lineTo(x + R * 0.125, R * 0.78); ctx.lineTo(x + R * 0.25, R * 0.62); } ctx.stroke();
  // the god's rune on the forehead
  const light = level === 5 || level === 11;
  ctx.save(); ctx.translate(0, -R * 0.58); ctx.scale(R * 0.27, R * 0.27);
  ctx.strokeStyle = light ? '#4a3510' : '#ffd84d'; ctx.lineWidth = 0.38; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const line of RUNES[tb.runes[level]]) line.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke(); ctx.restore();
}
function drawHeartBall(level, S) {
  const R = S / 1.3, col = THEME_BALLS.heart.cols[level], [r, g, b] = hexRgb(col);
  // soft background in a lighter tint of the heart's colour
  ctx.fillStyle = `rgb(${Math.round(r + (255 - r) * 0.72)},${Math.round(g + (255 - g) * 0.72)},${Math.round(b + (255 - b) * 0.72)})`;
  ctx.fillRect(-S, -S, 2 * S, 2 * S);
  if (level >= 13) {
    // silver and gold hearts are metallic
    const m = ctx.createLinearGradient(-R, -R, R, R);
    if (level === 14) { m.addColorStop(0, '#fff3b0'); m.addColorStop(0.4, '#ffcc33'); m.addColorStop(0.7, '#e0a000'); m.addColorStop(1, '#8a5a00'); }
    else { m.addColorStop(0, '#ffffff'); m.addColorStop(0.45, '#c8ced8'); m.addColorStop(1, '#6d7686'); }
    ctx.fillStyle = m;
  } else ctx.fillStyle = col;
  heartPath(ctx, 0, R * 0.32, R * 1.0); ctx.fill();
  ctx.lineWidth = R * 0.05; ctx.strokeStyle = `rgba(${Math.round(r * 0.5)},${Math.round(g * 0.5)},${Math.round(b * 0.5)},0.6)`; ctx.stroke();
  if (level === 14) {
    // sparkles on the golden heart
    ctx.fillStyle = '#ffffff';
    for (const [x, y, s] of [[-0.45, -0.45, 0.13], [0.5, -0.3, 0.09], [0.3, 0.45, 0.07]]) { ctx.beginPath(); ctx.moveTo(x * R, (y - s) * R); ctx.lineTo((x + s * 0.3) * R, y * R); ctx.lineTo(x * R, (y + s) * R); ctx.lineTo((x - s * 0.3) * R, y * R); ctx.closePath(); ctx.fill(); }
  }
}
function drawMathBall(level, S) {
  const R = S / 1.3, hue = 140 + level * 13;
  // a chalkboard ball: green for the easy sums, turning blue and purple for the hard ones
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
  g.addColorStop(0, `hsl(${hue},38%,34%)`); g.addColorStop(1, `hsl(${hue},45%,16%)`);
  ctx.fillStyle = g; ctx.fillRect(-S, -S, 2 * S, 2 * S);
  ctx.fillStyle = 'rgba(245,245,230,0.95)'; ctx.strokeStyle = 'rgba(245,245,230,0.95)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (level === 14) {
    // a 2×2 matrix in brackets
    const w = R * 0.62, h = R * 0.5, y = R * 0.56;
    ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * w * 0.5 - d * R * 0.1, y - h / 2); ctx.lineTo(d * w * 0.5, y - h / 2); ctx.lineTo(d * w * 0.5, y + h / 2); ctx.lineTo(d * w * 0.5 - d * R * 0.1, y + h / 2); ctx.stroke(); }
    ctx.font = `700 ${R * 0.2}px ${FONT}`;
    [['1', '2'], ['3', '4']].forEach((row, i) => row.forEach((v, j) => ctx.fillText(v, (j - 0.5) * w * 0.48, y + (i - 0.5) * h * 0.5)));
  } else {
    const t = THEME_BALLS.uni.names[level];
    let size = R * 0.36;
    ctx.font = `700 ${size}px ${FONT}`;
    const wMax = R * 1.35, w = ctx.measureText(t).width;
    if (w > wMax) { size *= wMax / w; ctx.font = `700 ${size}px ${FONT}`; }
    ctx.fillText(t, 0, R * 0.58);
  }
  ctx.textBaseline = 'alphabetic';
}
// details drawn over the face: Odin wears an eyepatch
function drawBallExtra(level, cx, cy, R, ang) {
  if (level !== MAXL || theme().id !== 'viking' || stage) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.strokeStyle = '#1b1410'; ctx.lineWidth = R * 0.04;
  ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.42); ctx.lineTo(R * 0.92, R * 0.05); ctx.stroke();
  ctx.fillStyle = '#1b1410'; ctx.beginPath(); ctx.ellipse(R * 0.3, -R * 0.07, R * 0.17, R * 0.14, 0.25, 0, TAU); ctx.fill();
  ctx.restore();
}

function paintBall(path, level, cx, cy, R, ang, lw) {
  ctx.save(); ctx.clip(path);
  ctx.translate(cx, cy); ctx.rotate(ang); drawBallArt(level, R * 1.3);
  ctx.restore();
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.42, R * 0.05, cx, cy, R * 1.12);
  g.addColorStop(0, 'rgba(255,255,255,0.38)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(5,15,45,0.42)');
  ctx.fillStyle = g; ctx.fill(path);
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,20,55,0.75)'; ctx.stroke(path);
  const rim = rimStyle();
  if (rim) {
    // a coloured rim just inside the dark outline (gold from Hermes, the others from the shop or player levels)
    let gg;
    if (rim === 'rainbow') { gg = ctx.createLinearGradient(cx - R, cy, cx + R, cy); ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((c, i) => gg.addColorStop(i / 5, c)); }
    else { gg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); const c = RIMS[rim]; gg.addColorStop(0, c[0]); gg.addColorStop(0.45, c[1]); gg.addColorStop(1, c[2]); }
    ctx.save(); ctx.clip(path); ctx.lineWidth = Math.max(lw * 2.2, R * 0.16); ctx.strokeStyle = gg; ctx.stroke(path); ctx.restore();
  }
  ctx.save(); ctx.clip(path);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.ellipse(cx - R * 0.36, cy - R * 0.5, R * 0.3, R * 0.15, -0.55, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(cx - R * 0.6, cy - R * 0.28, R * 0.05, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawFace(cx, cy, R, ang, blink, mood) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  const ex = R * 0.3, ey = -R * 0.06, er = R * 0.095;
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (nelliT > 0) {
    ctx.fillStyle = '#e01e37';
    heartPath(ctx, -ex, ey + er * 0.3, er * 1.5); ctx.fill();
    heartPath(ctx, ex, ey + er * 0.3, er * 1.5); ctx.fill();
  } else if (blink) {
    ctx.lineWidth = er * 0.55; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(-ex - er * 0.9, ey); ctx.lineTo(-ex + er * 0.9, ey); ctx.moveTo(ex - er * 0.9, ey); ctx.lineTo(ex + er * 0.9, ey); ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(-ex, ey, er * 1.12, er * 1.3, 0, 0, TAU);
    ctx.moveTo(ex + er * 1.12, ey); ctx.ellipse(ex, ey, er * 1.12, er * 1.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.ellipse(-ex, ey, er * 0.82, er, 0, 0, TAU);
    ctx.moveTo(ex + er * 0.82, ey); ctx.ellipse(ex, ey, er * 0.82, er, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-ex - er * 0.25, ey - er * 0.38, er * 0.32, 0, TAU);
    ctx.moveTo(ex - er * 0.25 + er * 0.32, ey - er * 0.38); ctx.arc(ex - er * 0.25, ey - er * 0.38, er * 0.32, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,80,130,0.3)';
  ctx.beginPath(); ctx.ellipse(-R * 0.5, R * 0.13, R * 0.13, R * 0.075, 0, 0, TAU);
  ctx.moveTo(R * 0.63, R * 0.13); ctx.ellipse(R * 0.5, R * 0.13, R * 0.13, R * 0.075, 0, 0, TAU); ctx.fill();
  if (mood === 1) {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, R * 0.17, er * 0.62, er * 0.8, 0, 0, TAU); ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = R * 0.11;
    ctx.beginPath(); ctx.arc(0, R * 0.07, R * 0.12, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = R * 0.05;
    ctx.beginPath(); ctx.arc(0, R * 0.07, R * 0.12, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  ctx.restore();
}

function blobPath(b) {
  const s = b.start, n = b.n;
  for (let k = 0; k < n; k++) {
    const i = s + k, ip = k + 1 < n ? i + 1 : s, im = k > 0 ? i - 1 : s + n - 1;
    const tx = X[ip] - X[im], ty = Y[ip] - Y[im], tl = Math.sqrt(tx * tx + ty * ty) || 1;
    OLX[k] = X[i] + ty / tl * RB; OLY[k] = Y[i] - tx / tl * RB;
  }
  const p = new Path2D();
  p.moveTo((OLX[n - 1] + OLX[0]) * 0.5, (OLY[n - 1] + OLY[0]) * 0.5);
  for (let k = 0; k < n; k++) {
    const k2 = k + 1 < n ? k + 1 : 0;
    p.quadraticCurveTo(OLX[k], OLY[k], (OLX[k] + OLX[k2]) * 0.5, (OLY[k] + OLY[k2]) * 0.5);
  }
  p.closePath();
  return p;
}

function drawBlob(b) {
  if (b.level >= STONE) { drawSpecial(b); return; }
  const R = b.R * b.scale;
  paintBall(blobPath(b), b.level, b.cx, b.cy, R, b.ang, 0.06);
  drawFace(b.cx, b.cy, R, b.ang, b.blinkT > 0, b.spd > 7 ? 1 : 0);
  drawBallExtra(b.level, b.cx, b.cy, R, b.ang);
}

function drawRoundBlob(level, cx, cy, R, sq, lw, face) {
  const k = Math.sqrt(sq);
  const p = new Path2D(); p.ellipse(cx, cy, R / k, R * k, 0, 0, TAU);
  paintBall(p, level, cx, cy, R, 0, lw);
  if (face) { drawFace(cx, cy, R, 0, false, 0); drawBallExtra(level, cx, cy, R, 0); }
}

function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
// the wagon is drawn in layers: static parts are cached in bitmaps and only redrawn when something changes.
// A layer is made of pieces that cover only the areas where the layer has something to draw (in world units),
// cut on whole device pixels and never overlapping, so the result lands on exactly the same pixels as direct
// drawing while far fewer empty pixels are copied every frame.
const WAGON_AREA = [[VX0 - 0.5, VY0 - 0.5, VX1 + 0.5, VY1 + 0.5]];
const jarLayers = {};
function cachedLayer(name, key, draw, sx, sy, areas) {
  const L = jarLayers[name] || (jarLayers[name] = { parts: [], key: '' });
  if (L.key !== key) {
    const px = x => Math.round(dpr * (OX + x * SC)), py = y => Math.round(dpr * (OY + y * SC));
    L.parts = (areas || WAGON_AREA).map(([ax0, ay0, ax1, ay1], k) => {
      const p = L.parts[k] || { cv: document.createElement('canvas') };
      p.x = px(ax0); p.y = py(ay0);
      p.cv.width = Math.max(1, px(ax1) - p.x); p.cv.height = Math.max(1, py(ay1) - p.y);
      const c = p.cv.getContext('2d'), keep = ctx;
      c.setTransform(dpr * SC, 0, 0, dpr * SC, dpr * OX - p.x, dpr * OY - p.y);
      ctx = c;
      try { draw(); } finally { ctx = keep; }
      return p;
    });
    L.key = key; heavyFrame = true;
  }
  const ox = Math.round(dpr * sx), oy = Math.round(dpr * sy);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const p of L.parts) ctx.drawImage(p.cv, p.x + ox, p.y + oy);
  ctx.restore();
}
// where the front of the wagon has something to draw: the two side walls (with the viking shields) and the floor beam
const FRONT_AREAS = [[VX0 - 0.5, VY0 - 0.5, 0.5, VY1 + 0.5], [WORLD_W - 0.5, VY0 - 0.5, VX1 + 0.5, VY1 + 0.5], [0.5, FLOOR_Y - 0.1, WORLD_W - 0.5, FLOOR_Y + 0.6]];
// the trophy shelves above the floor
const SHELF_AREAS = [[0, VIT.y - 0.3, VIT.x + VIT.w + 0.4, FLOOR_Y + 0.35]];
// Text sized in world units (a fraction of a ball). Firefox draws boxes for characters missing from every font
// (like the viking runes on computers without a runic font) at a minimum pixel size, which at a 0.26 px font
// covered the whole wagon. Such text measures far wider than its characters could be; only then it is drawn
// at a normal pixel size and scaled down. Everything else is drawn exactly as before.
const TEXT_K = 100;
function worldText(text, x, y, size, weight) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if (ctx.measureText(text).width <= size * text.length) { ctx.fillText(text, x, y); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(1 / TEXT_K, 1 / TEXT_K);
  ctx.font = `${weight} ${size * TEXT_K}px ${FONT}`; ctx.fillText(text, 0, 0);
  ctx.restore();
}
// how round the wagon's corners are drawn (the walls the balls bounce off stay where they were)
const BEND_R = 0.9, FILLET_R = 0.36;
// one side wall: rounded where it bends outwards and capped round at the top
function wallPath(inner, outer, d) {
  const r = Math.abs(outer - inner) / 2;
  ctx.beginPath();
  ctx.moveTo(inner, FLOOR_Y + 0.3);
  ctx.arcTo(inner, FUN_Y, inner + d * FUN_W, FUN_TOP, BEND_R);
  ctx.arcTo(inner + d * FUN_W, FUN_TOP, outer + d * FUN_W, FUN_TOP, r);
  ctx.arcTo(outer + d * FUN_W, FUN_TOP, outer, FUN_Y, r);
  ctx.arcTo(outer, FUN_Y, outer, FLOOR_Y + 0.3, BEND_R + r * 2);
  ctx.arcTo(outer, FLOOR_Y + 0.5, inner, FLOOR_Y + 0.5, r);
  ctx.lineTo(inner, FLOOR_Y + 0.5);
  ctx.closePath();
}
function jarParams() {
  const th = theme();
  return { th, wT: 0.34, gold: goldEdges() && th.id === 'eu', trim: goldEdges() && th.id !== 'eu', roll: reduceMotion ? 0 : time };
}
function jarBack() {
  const { th, wT, gold, trim } = jarParams();
  ctx.fillStyle = goldEdges() && th.id === 'eu' ? 'rgba(120,90,20,0.22)' : th.body; ctx.beginPath(); ctx.moveTo(-FUN_W, FUN_TOP); ctx.lineTo(WORLD_W + FUN_W, FUN_TOP); ctx.arcTo(WORLD_W, FUN_Y, WORLD_W, FLOOR_Y, BEND_R); ctx.arcTo(WORLD_W, FLOOR_Y, 0, FLOOR_Y, 0.35); ctx.arcTo(0, FLOOR_Y, 0, FUN_Y, 0.35); ctx.arcTo(0, FUN_Y, -FUN_W, FUN_TOP, BEND_R); ctx.closePath(); ctx.fill();
  // corrugated back wall of the freight car with steel stakes
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = 0.25; x < WORLD_W; x += 0.5) ctx.fillRect(x, FUN_Y, 0.22, FLOOR_Y - FUN_Y);
  drawThemeDeco(th);
  ctx.fillStyle = th.stake;
  for (let x = 2; x < WORLD_W; x += 2) ctx.fillRect(x - 0.08, FUN_Y + 0.3, 0.16, FLOOR_Y - FUN_Y - 0.3);
  ctx.fillStyle = 'rgba(255,214,90,0.22)';
  for (let x = 2; x < WORLD_W; x += 2) for (let y = FUN_Y + 0.8; y < FLOOR_Y - 0.3; y += 1.6) { ctx.beginPath(); ctx.arc(x, y, 0.045, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(10,22,60,0.45)'; ctx.fillRect(0, FUN_Y + 0.2, WORLD_W, 0.16);
  ctx.fillStyle = 'rgba(255,214,90,0.3)'; for (let x = 0.5; x < WORLD_W; x += 1) { ctx.beginPath(); ctx.arc(x, FUN_Y + 0.28, 0.04, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(10,22,60,0.3)'; ctx.fillRect(0, FLOOR_Y - 2.3, WORLD_W, 0.08);

  // underframe
  ctx.fillStyle = '#141b30'; rrect(-wT - 0.15, FLOOR_Y + 0.42, WORLD_W + 2 * wT + 0.3, 0.24, 0.12); ctx.fill();
  ctx.fillStyle = '#26304d'; for (let x = 0.4; x < WORLD_W; x += 0.9) ctx.fillRect(x, FLOOR_Y + 0.45, 0.06, 0.18);
  // buffers and couplers at both ends
  for (const side of [0, 1]) {
    const d = side ? 1 : -1, x0 = side ? WORLD_W + wT + 0.15 : -wT - 0.15, by = FLOOR_Y + 0.33;
    ctx.fillStyle = '#26304d'; ctx.fillRect(Math.min(x0, x0 + d * 0.35), by - 0.06, 0.35, 0.12);
    ctx.fillStyle = '#d9dfee'; ctx.beginPath(); ctx.ellipse(x0 + d * 0.4, by, 0.07, 0.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a93ad'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(x0, FLOOR_Y + 0.56); ctx.lineTo(x0 + d * 0.3, FLOOR_Y + 0.56); ctx.arc(x0 + d * 0.38, FLOOR_Y + 0.56, 0.08, Math.PI, Math.PI * 3); ctx.stroke();
  }
}
function jarFront() {
  const { th, wT, gold, trim } = jarParams();
  // floor beam with the wagon's name plate
  const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 0.5);
  fg.addColorStop(0, th.beam[0]); fg.addColorStop(1, th.beam[1]);
  if (gold) { fg.addColorStop(0, '#ffe37a'); fg.addColorStop(1, '#b8860b'); }
  ctx.fillStyle = fg; rrect(-wT, FLOOR_Y, WORLD_W + 2 * wT, 0.5, 0.25); ctx.fill();
  ctx.fillStyle = gold || trim ? '#fff3b0' : th.stripe; rrect(-wT + 0.25, FLOOR_Y + 0.05, WORLD_W + 2 * wT - 0.5, 0.045, 0.02); ctx.fill();
  for (let x = 0.3; x < WORLD_W; x += 0.6) rivet(x, FLOOR_Y + 0.4, 0.035, gold ? '#fffbe6' : th.rivet, th.id);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = gold ? '#5a3c00' : th.text; worldText(th.label, 0.35, FLOOR_Y + 0.25, 0.26, 800);
  ctx.textBaseline = 'alphabetic';
  // side walls with gold rivets
  for (const side of [0, 1]) {
    const d = side ? 1 : -1, inner = side ? WORLD_W : 0, outer = inner + d * wT;
    const g = ctx.createLinearGradient(Math.min(inner, outer) - FUN_W, 0, Math.max(inner, outer) + FUN_W, 0);
    if (gold) { g.addColorStop(0, '#b8860b'); g.addColorStop(0.5, '#ffe37a'); g.addColorStop(1, '#c99a00'); }
    else { g.addColorStop(0, th.wall[0]); g.addColorStop(0.5, th.wall[1]); g.addColorStop(1, th.wall[2]); }
    ctx.fillStyle = g; wallPath(inner, outer, d); ctx.fill();
    // a soft fillet where the wall meets the floor (no smaller than the smallest ball, so no ball ever reaches into it)
    ctx.beginPath(); ctx.moveTo(inner, FLOOR_Y - FILLET_R); ctx.arcTo(inner, FLOOR_Y, inner - d * FILLET_R, FLOOR_Y, FILLET_R); ctx.lineTo(inner, FLOOR_Y + 0.05); ctx.closePath(); ctx.fill();
    if (th.id === 'viking' && !gold) { ctx.strokeStyle = 'rgba(30,16,6,0.55)'; ctx.lineWidth = 0.03; ctx.beginPath(); for (let k = 1; k < 3; k++) { const f = k / 3; ctx.moveTo(inner + d * wT * f, FLOOR_Y + 0.3); ctx.arcTo(inner + d * wT * f, FUN_Y, inner + d * (FUN_W + wT * f), FUN_TOP, BEND_R + wT * f); ctx.lineTo(inner + d * (FUN_W + wT * f), FUN_TOP + 0.15); } ctx.stroke(); }
    ctx.lineWidth = trim ? 0.07 : 0.05; ctx.strokeStyle = trim ? '#ffd84d' : 'rgba(255,255,255,0.35)'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(inner - d * FILLET_R, FLOOR_Y); ctx.arcTo(inner, FLOOR_Y, inner, FUN_Y, FILLET_R); ctx.arcTo(inner, FUN_Y, inner + d * FUN_W, FUN_TOP, BEND_R); ctx.lineTo(inner + d * (FUN_W - 0.08), FUN_TOP + 0.25); ctx.stroke(); ctx.lineCap = 'butt';
    const rc = gold ? '#fffbe6' : th.rivet;
    for (let y = FUN_Y + 0.6; y < FLOOR_Y; y += 1.3) rivet(inner + d * wT / 2, y, 0.06, rc, th.id);
    for (let u = 0.2; u < 1; u += 0.3) { const y = FUN_Y + (FUN_TOP - FUN_Y) * u; rivet(inner + d * (FUN_W * u + wT / 2), y, 0.06, rc, th.id); }
    // viking shields hang on the outside of the walls
    if (th.id === 'viking') for (let k = 0; k < 4; k++) {
      const y = BTN_Y + BTN_H / 2 + 1.3 + k * 3.1, x = outer + d * 0.22, cols = [['#b8323a', '#f2e6cc'], ['#2a5aa8', '#f2c94c'], ['#2f7a3a', '#f2e6cc'], ['#f2c94c', '#3a2410']][k];
      ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(x, y, 0.32, 0, TAU); ctx.fill();
      ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 0.32, -Math.PI / 2, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 0.32, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.arc(x, y, 0.32, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#cfd5de'; ctx.beginPath(); ctx.arc(x, y, 0.09, 0, TAU); ctx.fill();
    }
  }
}
function drawJar(sx, sy) {
  const { th, wT, roll } = jarParams();
  const base = canvas.width + 'x' + canvas.height + '|' + SC + '|' + OX + '|' + OY + '|' + th.id + '|' + look.wagon + '|' + goldEdges() + '|' + fontGen;
  cachedLayer('back', base, jarBack, sx, sy);
  // track across the whole screen: ballast, sleepers scrolling past on a fixed grid, rail
  const ry = FLOOR_Y + 1.12, tx0 = Math.floor((-OX) / SC) - 2, tx1 = Math.ceil((vw - OX) / SC) + 2;
  ctx.fillStyle = 'rgba(60,55,70,0.55)'; ctx.fillRect(tx0, ry + 0.08, tx1 - tx0, 0.3);
  ctx.fillStyle = '#5a4030';
  const off = (roll * 1.6) % 0.9;
  for (let x = Math.floor(tx0 / 0.9) * 0.9 - off; x < tx1; x += 0.9) ctx.fillRect(x, ry + 0.06, 0.55, 0.14);
  ctx.fillStyle = '#9aa6c4'; ctx.fillRect(tx0, ry - 0.02, tx1 - tx0, 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(tx0, ry - 0.02, tx1 - tx0, 0.025);
  // two bogies, each with two turning wheels, springs and axle boxes
  for (const bx of [WORLD_W * 0.2, WORLD_W * 0.8]) {
    const wy = FLOOR_Y + 0.74, r = 0.38;
    for (const dx of [-0.78, 0.78]) {
      const wx = bx + dx;
      ctx.fillStyle = '#10162a'; ctx.beginPath(); ctx.arc(wx, wy, r, 0, TAU); ctx.fill();
      ctx.lineWidth = 0.07; ctx.strokeStyle = '#b8c3e0'; ctx.stroke();
      ctx.lineWidth = 0.045; ctx.strokeStyle = '#6f7ba0'; ctx.beginPath();
      for (let k = 0; k < 3; k++) { const an = roll * 4.2 + k * Math.PI / 3; ctx.moveTo(wx - Math.cos(an) * r * 0.82, wy - Math.sin(an) * r * 0.82); ctx.lineTo(wx + Math.cos(an) * r * 0.82, wy + Math.sin(an) * r * 0.82); }
      ctx.stroke();
      // coupling rod pin
      const an = roll * 4.2; ctx.fillStyle = '#e0e6f5'; ctx.beginPath(); ctx.arc(wx + Math.cos(an) * r * 0.55, wy + Math.sin(an) * r * 0.55, 0.05, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(wx, wy, 0.1, 0, TAU); ctx.fill();
    }
    // bogie side frame
    ctx.fillStyle = '#2a3558'; ctx.beginPath();
    ctx.moveTo(bx - 1.25, wy - 0.12); ctx.lineTo(bx - 0.4, wy - 0.3); ctx.lineTo(bx + 0.4, wy - 0.3); ctx.lineTo(bx + 1.25, wy - 0.12); ctx.lineTo(bx + 1.2, wy + 0.04); ctx.lineTo(bx - 1.2, wy + 0.04); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcc00'; for (const dx of [-0.78, 0.78]) rrect(bx + dx - 0.12, wy - 0.12, 0.24, 0.2, 0.04), ctx.fill();
    // spring stack
    ctx.strokeStyle = '#c8d0e6'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(bx - 0.2, wy - 0.3);
    for (let k = 0; k < 5; k++) ctx.lineTo(bx + (k % 2 ? 0.2 : -0.2), wy - 0.3 - (k + 1) * 0.06);
    ctx.stroke();
  }
  // tail lamp
  const lamp = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(255,60,60,${0.25 * lamp})`; ctx.beginPath(); ctx.arc(WORLD_W + wT + 0.05, FLOOR_Y + 0.05, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(WORLD_W + wT + 0.05, FLOOR_Y + 0.05, 0.1, 0, TAU); ctx.fill();
  cachedLayer('front', base, jarFront, sx, sy, FRONT_AREAS);
  // the trophy shelves: cached, except while a newly won trophy is still popping
  const now = Date.now(), popping = ACH.some(a => achGot[a[0]] && now - achGot[a[0]] < 1300);
  if (popping) drawTrophyWall();
  else cachedLayer('shelf', base + '|' + achCount() + '|' + vitrineIds().join() + '|' + Object.keys(TOBJ).join(), drawTrophyWall, sx, sy, SHELF_AREAS);
}
// the wall buttons in each theme: ring colours (top, middle, bottom), the hole, rivets and the dome
const PUSH_LOOK = {
  eu: { ring: ['#f4f7ff', '#a9b4d4', '#5d6788'], hole: '#1b2140', rivet: '#ffd84d', dome: '#e8283d', shine: '#ffd0d6', deep: '#7a0a1c' },
  viking: { ring: ['#c08a52', '#8a5a2e', '#4e2f14'], hole: '#2a1608', rivet: '#cfd5de', dome: '#c0343c', shine: '#ffc7b8', deep: '#5a1010' },
  heart: { ring: ['#ffffff', '#ffd1e0', '#ff9cc0'], hole: '#7a1840', rivet: '#ff6f9f', dome: '#ff3d7a', shine: '#ffe0ec', deep: '#9a1048' },
  uni: { ring: ['#2f6b52', '#1f4a3a', '#0f2a20'], hole: '#0b1d16', rivet: '#d4af37', dome: '#9a2032', shine: '#ffd7a8', deep: '#4a0a14' }
};
function rivet(x, y, r, col, kind) {
  ctx.fillStyle = col;
  if (kind === 'heart') { heartPath(ctx, x, y + r * 0.6, r * 2.4); ctx.fill(); }
  else if (kind === 'uni') { starPath(ctx, x, y, r * 1.5, r * 0.65); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
}
// decorations on the wagon's back wall, behind the balls
const CHALK = ['E = mc²', 'a² + b² = c²', 'π ≈ 3,14', '∫ x dx = x²/2', 'F = ma', 'e^(iπ) + 1 = 0', '√2', 'Σ 1/n²', 'PV = nRT', 'H₂O', 'Δx·Δp ≥ ħ/2', 'sin²+cos² = 1'];
function drawThemeDeco(th) {
  const h = FLOOR_Y - FUN_Y;
  if (th.id === 'viking') {
    // sail stripes and wooden planks
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? 'rgba(242,230,204,0.07)' : 'rgba(184,50,58,0.12)'; ctx.fillRect(k * WORLD_W / 6, FUN_Y, WORLD_W / 6, h); }
    ctx.strokeStyle = 'rgba(30,16,6,0.25)'; ctx.lineWidth = 0.03; ctx.beginPath();
    for (let y = FUN_Y + 0.7; y < FLOOR_Y; y += 0.7) { ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); }
    ctx.stroke();
  } else if (th.id === 'heart') {
    for (let y = FUN_Y + 0.8, r = 0; y < FLOOR_Y - 0.4; y += 1.3, r++) for (let x = (r % 2) * 0.75 + 0.4; x < WORLD_W; x += 1.5) {
      ctx.fillStyle = `rgba(255,${180 + ((x * 7 + y * 3) % 60) | 0},215,0.1)`; heartPath(ctx, x, y, 0.42); ctx.fill();
    }
  } else if (th.id === 'uni') {
    // chalkboard with formulas in a wooden frame
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    CHALK.forEach((t, i) => {
      const x = 1.6 + (i % 3) * 4.4 + ((i * 37) % 10) / 10 - 0.5, y = FUN_Y + 1.1 + Math.floor(i / 3) * (h - 3.4) / 3.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(((i * 53) % 9 - 4) * 0.02); ctx.fillStyle = 'rgba(240,240,225,0.2)'; worldText(t, 0, 0, 0.42, 600); ctx.restore();
    });
    ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = 'rgba(240,240,225,0.12)'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.ellipse(WORLD_W * 0.72, FUN_Y + h * 0.55, 0.9, 0.5, -0.2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(122,86,56,0.8)'; ctx.lineWidth = 0.12; ctx.strokeRect(0.1, FUN_Y + 0.45, WORLD_W - 0.2, h - 0.5);
  }
}

function drawDanger() {
  const both = btnL && btnR && wobT <= 0, pulse = both ? Math.abs(Math.sin(time * 12)) : 0;
  if (both) {
    // warning beam between the buttons, filling up until game over
    const f = Math.min(1, dangerT / DANGER_TIME);
    ctx.setLineDash([0.25, 0.18]); ctx.lineWidth = 0.06; ctx.strokeStyle = `rgba(255,60,60,${0.4 + pulse * 0.5})`;
    ctx.beginPath(); ctx.moveTo(0.3, BTN_Y); ctx.lineTo(WORLD_W - 0.3, BTN_Y); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 0.16; ctx.lineCap = 'round'; ctx.strokeStyle = '#ff3b3b';
    ctx.beginPath(); ctx.moveTo(WORLD_W / 2 - (WORLD_W / 2 - 0.3) * f, BTN_Y); ctx.lineTo(WORLD_W / 2 + (WORLD_W / 2 - 0.3) * f, BTN_Y); ctx.stroke();
  }
  for (const [side, dep, full] of [[0, depL, btnL], [1, depR, btnR]]) {
    const x = side ? WORLD_W : 0, dir = side ? -1 : 1;
    // the button is a pusher that sinks into the wall; each theme dresses it differently
    const th = theme(), hy = BTN_Y - BTN_H / 2, mx = side ? x - 0.2 : x, out = 0.62 * (1 - Math.min(1, dep * 1.4)) + 0.08, hx = x + dir * out;
    const col = full ? (both ? `rgb(255,${50 + pulse * 90},50)` : '#ff7a1a') : th.btn, rh = BTN_H * 0.22;
    // an arcade dome button: a ring set in the wall and a glossy dome that sinks into it, dressed in the theme's colours
    const B = PUSH_LOOK[th.id] || PUSH_LOOK.eu, ry = BTN_H * 0.58, a0 = side ? Math.PI / 2 : -Math.PI / 2, a1 = side ? Math.PI * 1.5 : Math.PI / 2;
    const half = (rx, ryy) => { ctx.beginPath(); ctx.ellipse(x, BTN_Y, rx, ryy, 0, a0, a1); ctx.closePath(); };
    const rg = ctx.createLinearGradient(0, BTN_Y - ry, 0, BTN_Y + ry); rg.addColorStop(0, B.ring[0]); rg.addColorStop(0.5, B.ring[1]); rg.addColorStop(1, B.ring[2]);
    if (full) { ctx.fillStyle = both ? `rgba(255,60,60,${0.3 + pulse * 0.3})` : 'rgba(255,140,40,0.25)'; ctx.beginPath(); ctx.ellipse(x + dir * 0.3, BTN_Y, 0.7, BTN_H * 0.66, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rg; half(0.36, ry); ctx.fill();
    ctx.fillStyle = B.hole; half(0.27, ry - 0.1); ctx.fill();
    for (const t of [-0.75, -0.4, 0, 0.4, 0.75]) rivet(x + dir * 0.315 * Math.cos(t * 1.9), BTN_Y + (ry - 0.05) * Math.sin(t * 1.9), 0.04, B.rivet, th.id);
    // the dome: its face is where the pusher is, so the balls rest against it
    const rx = out + 0.13, dy = BTN_H * 0.47, dc = full ? col : B.dome;
    const dg = ctx.createRadialGradient(x + dir * rx * 0.55, BTN_Y - dy * 0.45, 0.04, x + dir * rx * 0.2, BTN_Y, dy * 1.05);
    dg.addColorStop(0, B.shine); dg.addColorStop(0.35, dc); dg.addColorStop(1, B.deep);
    ctx.fillStyle = dg; half(rx, dy); ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, BTN_Y, rx, dy, 0, a0, a1); ctx.stroke();
    if (th.id === 'heart') { ctx.save(); ctx.translate(x + dir * rx * 0.45, BTN_Y + 0.05); ctx.rotate(dir * Math.PI / 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; heartPath(ctx, 0, 0.12, 0.5); ctx.fill(); ctx.restore(); }
    else if (th.id === 'uni') { ctx.fillStyle = 'rgba(255,225,140,0.75)'; starPath(ctx, x + dir * rx * 0.48, BTN_Y + 0.05, 0.16, 0.07); ctx.fill(); }
    else if (th.id === 'viking') { ctx.fillStyle = '#cfd5de'; ctx.beginPath(); ctx.ellipse(x + dir * rx * 0.5, BTN_Y + 0.05, Math.max(0.03, rx * 0.16), 0.2, 0, 0, TAU); ctx.fill(); }
    // bright highlight near the top of the dome
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x + dir * rx * 0.42, BTN_Y - dy * 0.5, Math.max(0.03, rx * 0.2), dy * 0.15, 0, 0, TAU); ctx.fill();
    // gauge beside the button: fills from green through yellow to red
    const gw = 0.3, gx = side ? WORLD_W + 0.45 : -0.45 - gw, gh = BTN_H + 0.3, gy = BTN_Y - gh / 2;
    ctx.fillStyle = 'rgba(10,15,35,0.8)'; rrect(gx, gy, gw, gh, 0.1); ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
    const fh = (gh - 0.1) * Math.min(1, dep);
    if (fh > 0.01) {
      const gg = ctx.createLinearGradient(0, gy + gh - 0.05, 0, gy + 0.05);
      gg.addColorStop(0, '#2fd36b'); gg.addColorStop(0.5, '#ffd23a'); gg.addColorStop(1, '#ff3b3b');
      ctx.save(); if (both) ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.fillStyle = gg; rrect(gx + 0.05, gy + gh - 0.05 - fh, gw - 0.1, fh, 0.06); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 1; k < 4; k++) ctx.fillRect(side ? gx + gw - 0.09 : gx, gy + gh * k / 4, 0.09, 0.025);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(gx - 0.04, gy + 0.04, gw + 0.08, 0.025);
  }
}

function predict() {
  const R = RADII[cur], sp = 3 + aimPow * 29;
  let x = LX, y = LY, vx = Math.sin(aimAng) * sp, vy = Math.cos(aimAng) * sp;
  const pts = [], dt = 1 / 90;
  let hit = null;
  for (let k = 0; k < 160; k++) {
    vy += E.gy * dt; vx += E.gx * dt; x += vx * dt; y += vy * dt;
    const fw = funnelAt(y);
    if (x < R - fw) { x = R - fw; vx = -vx * 0.35; } else if (x > WORLD_W - R + fw) { x = WORLD_W - R + fw; vx = -vx * 0.35; }
    if (y > FLOOR_Y - R) { hit = { x, y: FLOOR_Y - R }; break; }
    let hb = false;
    for (const b of E.blobs) {
      const dx = x - b.cx, dy = y - b.cy, rr = R + b.R * b.scale * 0.96;
      if (dx * dx + dy * dy < rr * rr) { hb = true; break; }
    }
    if (hb) { hit = { x, y }; break; }
    if (k % 3 === 0 && Math.hypot(x - LX, y - LY) > R + 0.4) pts.push(x, y);
  }
  return { pts, hit };
}

function drawAim() {
  const pr = predict(), n = pr.pts.length;
  ctx.fillStyle = '#fff7ee';
  for (let k = 0; k < n; k += 2) {
    const t = k / Math.max(1, n);
    ctx.globalAlpha = 0.6 - t * 0.4;
    ctx.beginPath(); ctx.arc(pr.pts[k], pr.pts[k + 1], 0.085 * (1 - t * 0.45), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (pr.hit) {
    ctx.setLineDash([0.18, 0.14]); ctx.lineWidth = 0.05; ctx.strokeStyle = 'rgba(255,247,238,0.6)';
    ctx.beginPath(); ctx.arc(pr.hit.x, pr.hit.y, RADII[cur], 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLauncher() {
  const R = RADII[cur], p = Math.min(1, popT / 0.22), s = easeOutBack(p);
  if (s <= 0.02) return;
  const sq = 1 + Math.sin(time * 3.2) * 0.03;
  if (state === 'play') {
    const rr = R * s + 0.3;
    ctx.lineCap = 'round'; ctx.lineWidth = 0.09;
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.beginPath(); ctx.arc(LX, LY, rr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(LX, LY, rr, -Math.PI / 2, -Math.PI / 2 + TAU * aimPow); ctx.stroke();
  }
  drawRoundBlob(cur, LX, LY, R * s, sq, 0.05, true);
}


// ---- bonus targets flying across the empty top of the wagon ----
const bonuses = [];
let bonusT = 12;
function bonusStep() {
  bonusT -= STEP;
  if (bonusT <= 0) {
    bonusT = 18 + Math.random() * 16;
    const heart = Math.random() < 0.3, dir = Math.random() < 0.5 ? 1 : -1;
    bonuses.push({ x: dir > 0 ? -0.8 : WORLD_W + 0.8, y: 2.4 + Math.random() * 1.4, vx: dir * (0.9 + Math.random() * 0.6), r: heart ? 0.6 : 0.56, heart, t: 0, ph: Math.random() * TAU });
  }
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const o = bonuses[i];
    o.t += STEP; o.x += o.vx * STEP;
    const [ox, oy] = bubblePos(o);
    if (o.x < -1.2 || o.x > WORLD_W + 1.2) { bonuses.splice(i, 1); continue; }
    // any ball touching it collects it
    let hit = false;
    for (const b of E.blobs) {
      const dx = b.cx - ox, dy = b.cy - oy, rr = b.R * b.scale + o.r;
      if (dx * dx + dy * dy < rr * rr) { hit = true; break; }
    }
    if (hit) {
      bonuses.splice(i, 1);
      if (o.heart) unlock('heart');
      const pts = o.heart ? 1000 : 500;
      addScore(pts);
      bubblePop(ox, oy, o.r, o.heart);
      floater(T(o.heart ? 'Nelli-bonus +{0}' : 'Tähtibonus +{0}', pts), ox, oy - 0.6, o.heart ? '#ff8fab' : '#ffe066', 22);
      sfx.pop(); mascotBounce = 1;
    }
  }
}
// the bonuses are soap bubbles with a little star (or Nelli's heart) inside: they drift across the top of the
// wagon swaying and bobbing, wobble a little as they go, and pop when a ball touches them
function bubblePos(o) {
  return [o.x + Math.sin(o.t * 0.9 + o.ph) * 0.35, o.y + Math.sin(o.t * 1.4 + o.ph) * 0.32 + Math.sin(o.t * 0.55) * 0.25];
}
function bubblePop(x, y, r, heart) {
  // a thin ring that flashes outwards and a spray of tiny droplets
  parts.push({ k: 1, x, y, r: r, r1: r * 2.4, life: 0.28, max: 0.28, c: 'rgba(220,245,255,0.95)' });
  const cols = ['#bff4ff', '#ffd0f0', '#fff3b0', '#d0ffd8'];
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU + Math.random() * 0.3, sp = rand(3, 6), life = rand(0.3, 0.55);
    parts.push({ k: 0, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, r: rand(0.04, 0.08), life, max: life, c: cols[i % 4] });
  }
  for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, life = rand(0.5, 0.8);
    parts.push({ k: 0, x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 2.5, r: rand(0.07, 0.12), life, max: life, c: heart ? '#ff4d7d' : '#ffcc00' }); }
}
function roundStarPath(r) {
  const pts = [];
  for (let p = 0; p < 10; p++) { const rr = p % 2 ? r * 0.5 : r, a = -Math.PI / 2 + p * Math.PI / 5; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const [x, y] = pts[i % 10], [nx, ny] = pts[(i + 1) % 10], mx = (x + nx) / 2, my = (y + ny) / 2;
    if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(x, y, mx, my);
  }
  ctx.closePath();
}
function drawBonuses() {
  for (const o of bonuses) {
    const [x, y] = bubblePos(o), r = o.r, w = Math.sin(o.t * 4.2 + o.ph) * 0.06;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + w, 1 - w);
    // the bubble: clear in the middle, a faint tint and a rainbow rim
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.8, 'rgba(160,220,255,0.1)'); g.addColorStop(1, 'rgba(255,160,255,0.42)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    const rg = ctx.createLinearGradient(-r, -r, r, r);
    const sh = (o.t * 0.4) % 1;   // the colours slowly run round the rim
    ['#7fe7ff', '#ff9ad8', '#ffe680', '#9af0a0', '#7fe7ff'].forEach((c, k) => rg.addColorStop(Math.min(1, Math.max(0, (k / 4 + sh) % 1.0001)), c));
    ctx.strokeStyle = rg; ctx.lineWidth = r * 0.07; ctx.stroke();
    // the star or heart inside bobs and turns a little on its own
    ctx.save(); ctx.translate(Math.sin(o.t * 1.7) * r * 0.06, Math.cos(o.t * 1.3) * r * 0.08); ctx.rotate(Math.sin(o.t * 1.1) * 0.25);
    const s = r * 0.56;
    if (o.heart) heartPath(ctx, 0, s * 0.3, s * 1.15); else roundStarPath(s);
    const sg = ctx.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.05, 0, 0, s);
    sg.addColorStop(0, o.heart ? '#ffd0dc' : '#fff6c0'); sg.addColorStop(1, o.heart ? '#e0205a' : '#f0a800');
    ctx.fillStyle = sg; ctx.fill(); ctx.lineWidth = s * 0.09; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,20,55,0.7)'; ctx.stroke();
    // a tiny face like the balls have
    ctx.fillStyle = INK;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * s * 0.2, s * 0.02, s * 0.07, s * 0.1, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, s * 0.17, s * 0.11, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    // shine on the bubble
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.24, r * 0.09, -0.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.55, r * 0.5, r * 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// ---- transitions when a game starts or the stage changes: a circle opens from the middle of the wagon (with a
// flash on a new stage) and a banner with the stage name slides in, stays a moment and fades ----
let trans = null;
function startTransition(kind, title, sub) { trans = { kind, title, sub: sub || '', t0: time }; }
function drawTransition() {
  if (!trans) return;
  const age = time - trans.t0;
  if (age > 2.1) { trans = null; return; }
  const cx = OX + WORLD_W / 2 * SC, cy = OY + FLOOR_Y * 0.5 * SC;
  if (trans.kind === 'stage' && age < 0.45) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - age / 0.45)})`; ctx.fillRect(0, 0, vw, vh); }
  if (!reduceMotion && age < 0.6) {
    const e = 1 - Math.pow(1 - age / 0.6, 3), R = e * Math.hypot(vw, vh);
    ctx.fillStyle = '#0a1230'; ctx.beginPath(); ctx.rect(0, 0, vw, vh); ctx.arc(cx, cy, Math.max(1, R), 0, TAU, true); ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(255,214,77,0.7)'; ctx.lineWidth = 4 * ui; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, R), 0, TAU); ctx.stroke();
  }
  // the banner
  const a = age < 0.35 ? age / 0.35 : age > 1.7 ? Math.max(0, (2.1 - age) / 0.4) : 1;
  if (a <= 0) return;
  const u = ui, drop = reduceMotion ? 0 : (1 - Math.min(1, age / 0.4)) * -26 * u, by = OY + 5.4 * SC + drop;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `900 ${24 * u}px ${FONT}`;
  const tw = ctx.measureText(trans.title).width, w = Math.min(vw - 20, Math.max(tw + 48 * u, 180 * u)), h = trans.sub ? 66 * u : 50 * u;
  const pop = reduceMotion ? 1 : 1 + Math.max(0, 0.12 - age * 0.3);
  ctx.translate(cx, by); ctx.scale(pop, pop);
  ctx.fillStyle = 'rgba(10,28,71,0.9)'; ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 3 * u;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, 18 * u) : ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = tw > w - 30 * u ? 24 * u * (w - 30 * u) / tw : 24 * u;
  ctx.font = `900 ${fs}px ${FONT}`; ctx.fillStyle = '#ffffff'; ctx.fillText(trans.title, 0, trans.sub ? -10 * u : 1);
  if (trans.sub) { ctx.font = `800 ${16 * u}px ${FONT}`; ctx.fillStyle = '#ffd84d'; ctx.fillText(trans.sub, 0, 17 * u); }
  // little sparkles that circle the banner
  if (!reduceMotion) {
    ctx.fillStyle = '#ffe066';
    for (let k = 0; k < 6; k++) {
      const ang = age * 2.2 + k / 6 * TAU, sx = Math.cos(ang) * (w / 2 + 10 * u), sy = Math.sin(ang) * (h / 2 + 8 * u), s = (4 + 3 * Math.sin(age * 9 + k)) * u;
      ctx.beginPath(); ctx.moveTo(sx, sy - s); ctx.quadraticCurveTo(sx, sy, sx + s, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + s); ctx.quadraticCurveTo(sx, sy, sx - s, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - s); ctx.fill();
    }
  }
  ctx.restore(); ctx.textBaseline = 'alphabetic';
}
function drawParticles() {
  for (const p of parts) {
    const a = Math.max(0, p.life / p.max);
    if (p.k === 0) {
      ctx.globalAlpha = a; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    } else {
      ctx.globalAlpha = a * 0.8; ctx.strokeStyle = p.c; ctx.lineWidth = 0.12 * a + 0.02;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (p.r1 - p.r) * (1 - a), 0, TAU); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawGlassFront() {
  const g = ctx.createLinearGradient(WORLD_W - 1.5, 0, WORLD_W - 0.3, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(WORLD_W - 1.5, 0.6, 1.2, FLOOR_Y - 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.ellipse(0.48, FLOOR_Y / 2 + 0.4, 0.1, FLOOR_Y / 2 - 1.6, 0, 0, TAU); ctx.fill();
}

function drawFloaters(sx, sy) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const f of floaters) {
    const u = 1 - f.life / f.max, a = f.life < 0.35 ? f.life / 0.35 : 1, pop = u < 0.12 ? 0.6 + (u / 0.12) * 0.4 : 1;
    const px = clamp(OX + sx + f.x * SC, 70 * ui, vw - 70 * ui), py = OY + sy + f.y * SC;
    ctx.globalAlpha = a;
    ctx.font = `800 ${Math.round(f.size * pop * ui)}px ${FONT}`;
    ctx.lineWidth = 5 * ui; ctx.strokeStyle = 'rgba(23,21,58,0.85)'; ctx.strokeText(f.text, px, py);
    ctx.fillStyle = f.color; ctx.fillText(f.text, px, py);
  }
  ctx.globalAlpha = 1;
  if (blockedT > 0) {
    ctx.globalAlpha = Math.min(1, blockedT / 0.3);
    ctx.font = `800 ${Math.round(18 * ui)}px ${FONT}`;
    const px = OX + sx + LX * SC, py = OY + sy + (LY + RADII[cur] + 0.8) * SC;
    ctx.lineWidth = 5 * ui; ctx.strokeStyle = 'rgba(23,21,58,0.85)'; ctx.strokeText(T('Ei mahdu!'), px, py);
    ctx.fillStyle = '#ff4f7b'; ctx.fillText(T('Ei mahdu!'), px, py);
    ctx.globalAlpha = 1;
  }
}

function hudText(text, x, y, align, font, color, spacing) {
  ctx.font = font; ctx.textAlign = align; ctx.fillStyle = color;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing || '0px';
  ctx.fillText(text, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}
const HUD_LABEL_FONT = `700 12px ${FONT}`;
const hudLabel = (t, x, y, a) => hudText(t, x, y, a, HUD_LABEL_FONT, '#a9c1f0', '1.6px');
let hudLayout = {};
// a HUD label shrunk to fit `room` (local units): down to half size, then shortened with an ellipsis
function fitHudLabel(text, room) {
  const full = hudTextWidth(text, HUD_LABEL_FONT, '1.6px');
  if (full <= room) return { t: text, k: 1, w: full };
  const k = Math.max(0.5, room / full), font = `700 ${12 * k}px ${FONT}`, sp = `${1.6 * k}px`;
  let t = text;
  while (t.length > 1 && hudTextWidth(t, font, sp) > room) t = t.slice(0, -2) + '…';
  return { t, k, w: hudTextWidth(t, font, sp) };
}
const hudLabelSized = (f, x, y, a) => hudText(f.t, x, y, a, `700 ${12 * f.k}px ${FONT}`, '#a9c1f0', `${1.6 * f.k}px`);
function hudTextWidth(text, font, spacing) {
  ctx.save(); ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = spacing || '0px';
  const w = ctx.measureText(text).width; ctx.restore(); return w;
}
const hudNum = (t, x, y, size, a) => hudText(String(t), x, y, a, `800 ${size}px ${FONT}`, '#fff7ee');
const hudSmall = (t, x, y, a) => hudText(t, x, y, a, `600 14px ${FONT}`, 'rgba(255,247,238,0.68)');

// how far the row of balls is revealed: on stages 2 and 3 everything once the stage is beaten
const chainSeen = () => (stage ? (stagesDone(theme().id) > stage ? MAXL : Math.max(4, maxLevel)) : Math.max(4, maxLevel, bestLevel));
const chainCache = { cv: null, key: '', x: 0, y: 0 };
function drawChain(x0, y0, vertical, room, u) {
  // the row of countries changes rarely, so it is drawn once into a bitmap. The bitmap sits on whole
  // device pixels and keeps the exact sub-pixel position, so it looks the same as drawing directly.
  const seenNow = chainSeen(), maxR = (8 + RADII[MAXL] * 2.6 + 2) * u;
  const bw = vertical ? maxR * 2 + 4 : room + 8 * u, bh = vertical ? room + 8 * u : maxR * 2 + 4, bx = x0 - bw / 2, by = vertical ? y0 - 4 * u : y0 - bh / 2;
  const key = [x0, y0, vertical, room, u, seenNow, dpr, fontGen, theme().id, stage, rimStyle()].join('|');
  if (chainCache.key !== key) {
    const cv = chainCache.cv || (chainCache.cv = document.createElement('canvas'));
    const dx = Math.floor(bx * dpr), dy = Math.floor(by * dpr);
    cv.width = Math.max(1, Math.ceil((bx + bw) * dpr) - dx); cv.height = Math.max(1, Math.ceil((by + bh) * dpr) - dy);
    chainCache.x = dx; chainCache.y = dy;
    const c = cv.getContext('2d'), keep = ctx;
    c.setTransform(dpr, 0, 0, dpr, -dx, -dy);
    ctx = c;
    try { drawChainRaw(x0, y0, vertical, room, u); } finally { ctx = keep; }
    chainCache.key = key; heavyFrame = true;
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(chainCache.cv, chainCache.x, chainCache.y); ctx.restore();
  drawGoalMarks(x0, y0, vertical, room, u);
}
// the time-limit goals of the stage, still to reach: [level, seconds]
// the time limits of the stage still to reach: { lv, t }
const openGoals = () => (gmode === 'classic' && stage > 0 && (state === 'play' || state === 'paused') && !invincible ? stageGoals(stage).filter(g => maxLevel < g.lv) : []);
// seconds left, and whether that is getting tight
const goalLeft = g => Math.max(0, g.t - playT);
const goalUrgent = g => goalLeft(g) < 30;
function chainLayout(x0, y0, vertical, room, u) {
  const base = RADII.map(r => (8 + r * 2.6) * u), full = base.reduce((a, r) => a + 2 * r, 0) + 5 * u * (base.length - 1);
  const scale = Math.min(1, room / full), sizes = base.map(r => r * scale), gap = 5 * u * scale;
  const total = sizes.reduce((a, r) => a + 2 * r, 0) + gap * (sizes.length - 1);
  let p = vertical ? y0 : x0 - total / 2;
  return sizes.map(r => { const at = vertical ? [x0, p + r, r] : [p + r, y0, r]; p += 2 * r + gap; return at; });
}
function drawGoalMarks(x0, y0, vertical, room, u) {
  // a red blinking exclamation mark on the ball the time limit asks for (the next goal blinks, a later one stays dim)
  const goals = openGoals();
  if (!goals.length) return;
  const pos = chainLayout(x0, y0, vertical, room, u);
  goals.forEach((g, k) => {
    const [cx, cy, r] = pos[g.lv], blink = k === 0 ? 0.55 + 0.45 * Math.abs(Math.sin(time * (goalUrgent(g) ? 9 : 4))) : 0.45;
    const R = Math.max(8 * u, r * 0.62), bx = cx + r * 0.62, by = cy - r * 0.62;
    ctx.save(); ctx.globalAlpha = blink;
    ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(cx, cy, r + 2 * u, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#e01e37'; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `900 ${R * 1.5}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', bx, by + R * 0.08); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  });
}
// the time limit written in big see-through red letters across the top of the wagon, behind the balls
function drawStageGoal() {
  const g = openGoals()[0];
  if (!g) return;
  const left = goalLeft(g), mm = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0');
  const urgent = goalUrgent(g), a = urgent ? 0.45 + 0.35 * Math.abs(Math.sin(time * 6)) : 0.42;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(255,50,60,${a})`;
  // only the time left, off to the side so the ball about to be shot never covers it;
  // the goal ball itself is marked with a red ! in the ball row
  worldText(mm, 2.3, 2.45, 0.95, 900);
  ctx.textBaseline = 'alphabetic';
}
function drawChainRaw(x0, y0, vertical, room, u) {
  const base = RADII.map(r => (8 + r * 2.6) * u), full = base.reduce((a, r) => a + 2 * r, 0) + 5 * u * (base.length - 1);
  const scale = Math.min(1, room / full), sizes = base.map(r => r * scale), gap = 5 * u * scale;
  const total = sizes.reduce((a, r) => a + 2 * r, 0) + gap * (sizes.length - 1);
  const seen = chainSeen();
  let p = vertical ? y0 : x0 - total / 2;
  for (let k = 0; k <= MAXL; k++) {
    const r = sizes[k], cx = vertical ? x0 : p + r, cy = vertical ? p + r : y0;
    if (k <= seen) drawRoundBlob(k, cx, cy, r, 1, Math.max(1, r * 0.08), r > 9);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2 * u;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = `700 ${Math.max(9 * u, r * 1.1)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy + u); ctx.textBaseline = 'alphabetic';
    }
    p += 2 * r + gap;
  }
  ctx.globalAlpha = 1;
}

function modeLine() {
  const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  if (state === 'menu') return T('Ennätys {0}', best);
  if (gmode === 'daily') return T('Laukaukset {0} · tavoite {1}', shots, ballLabel(10));
  if (gmode === 'classic' && stage > 0) {
    const gl = openGoals()[0];
    if (gl) return T('{0}. pallo', gl.lv + 1) + ': ' + T('aikaa {0}', mmss(goalLeft(gl)));
    return T('Taso {0}: {1}', stage + 1, T(stageInfo().name));
  }
  if (gmode === 'map' && missionIdx >= 0) {
    const ms = MISSIONS[missionIdx];
    return NAMES[ms.c] + ': ' + (ms.time ? T('aikaa {0}', mmss(modeT)) : ms.shots ? T('laukauksia {0}', Math.max(0, ms.shots - shots)) : ms.text);
  }
  return T('Ennätys {0}', best);
}
// how long this game has gone on: m:ss, or h:mm:ss after an hour
function fmtPlayTime(t) {
  const s = Math.floor(t), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = String(s % 60).padStart(2, '0');
  return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
}
// the game clock: a rounded pill in the train's own colours, with a little stopwatch
function drawTimer(x, y, align, h) {
  if (state !== 'play' && state !== 'paused') return;
  h = h || 34;
  const th = theme(), txt = fmtPlayTime(playT), fs = Math.round(h * 0.47);
  ctx.font = `800 ${fs}px ${FONT}`;
  const tw = ctx.measureText(txt.replace(/\d/g, '0')).width, ir = h * 0.26, pad = h * 0.36;
  const w = pad + ir * 2 + h * 0.22 + tw + pad, x0 = align === 'right' ? x - w : x, r = h / 2;
  timerBox = [x0, y, w, h];
  ctx.save();
  // a darker lip underneath, then the body in the wagon's colours and a bright rim
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(x0, y + 3, w, h, r); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, th.wall[1]); g.addColorStop(0.5, th.wall[0]); g.addColorStop(1, th.wall[2]);
  ctx.fillStyle = g; rrect(x0, y, w, h, r); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; rrect(x0, y, w, h, r); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = th.stripe; rrect(x0 + 1, y + 1, w - 2, h - 2, r - 1); ctx.stroke();
  // a soft shine that fades out on every side
  ctx.save(); rrect(x0, y, w, h, r); ctx.clip();
  ctx.translate(x0 + w * 0.38, y + h * 0.05); ctx.scale(w * 0.62, h * 0.5);
  const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); sh.addColorStop(0, 'rgba(255,255,255,0.42)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.14)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  // stopwatch: face, crown and a hand that ticks round once a minute
  const cx = x0 + pad + ir, cy = y + h / 2 + ir * 0.12;
  ctx.fillStyle = th.stripe; ctx.fillRect(cx - ir * 0.28, cy - ir * 1.42, ir * 0.56, ir * 0.36);
  ctx.beginPath(); ctx.arc(cx, cy, ir, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(cx, cy, ir * 0.72, 0, TAU); ctx.fill();
  const a = (Math.floor(playT) % 60) / 60 * TAU - Math.PI / 2;
  ctx.strokeStyle = th.wall[2]; ctx.lineWidth = Math.max(1.4, ir * 0.18); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * ir * 0.58, cy + Math.sin(a) * ir * 0.58); ctx.stroke();
  // the time itself
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;
  ctx.fillText(txt, cx + ir + h * 0.22, y + h / 2 + 1);
  ctx.restore(); ctx.textBaseline = 'alphabetic';
}
let timerBox = null;
function drawHUD() {
  const fl = OX + VX0 * SC, fr = OX + VX1 * SC, ft = OY + VY0 * SC, fb = OY + VY1 * SC, fc = OX + LX * SC;
  ctx.textBaseline = 'alphabetic';
  const sc = Math.round(shownScore), info = modeLine(), u = ui;
  // each HUD group is drawn around an anchor point and scaled by ui (1 on phones, so nothing changes there)
  const at = (x, y) => ctx.setTransform(dpr * u, 0, 0, dpr * u, dpr * x, dpr * y);
  if (mode === 'top') {
    const [hl, hr] = hudEdges();
    // Labels are placed in units local to the HUD (scaled by ui). On ordinary screens both sit exactly where they
    // always did; only when a long translation on a narrow screen would collide, the next-ball label moves left
    // of the sound button and the labels get smaller (down to half size, then shortened with an ellipsis).
    const label = gmode === 'classic' ? T('PISTEET') : MODE_INFO[gmode].name.toUpperCase(), nl = T('SEURAAVA');
    const lw = hudTextWidth(label, HUD_LABEL_FONT, '1.6px'), nw = hudTextWidth(nl, HUD_LABEL_FONT, '1.6px');
    const cx = (fc - hl) / u, limit = (hr - 92 * u - hl) / u - 6;
    let next = { t: nl, k: 1, x0: cx - nw / 2, w: nw, align: 'center', x: cx };
    if (cx + nw / 2 > limit) {
      const fit = fitHudLabel(nl, limit - 56);
      next = { ...fit, x0: limit - fit.w, align: 'right', x: limit };
    }
    const modeLbl = (6 + lw <= next.x0 - 10) ? { t: label, k: 1, w: lw } : fitHudLabel(label, next.x0 - 10 - 6);
    at(hl, ft);
    if (modeLbl.k === 1 && modeLbl.t === label) hudLabel(label, 6, -64, 'left'); else hudLabelSized(modeLbl, 6, -64, 'left');
    hudNum(sc, 4, -28, 36, 'left');
    hudSmall(info, 6, -9, 'left');
    if (next.align === 'center' && next.k === 1) hudLabel(nl, next.x, -64, 'center'); else hudLabelSized(next, next.x, -64, next.align);
    at(fc, ft);
    const pr = 8 + nxt * 2.6;
    drawRoundBlob(nxt, 0, -32, pr, 1, Math.max(1, pr * 0.07), pr > 9);
    hudSmall(NAMES[nxt], pr + 8, -27, 'left');
    screenTf();
    drawChain(fc, fb + 78 * u, false, Math.min(vw - 12, hr - hl + 40), u);
    at(hr, fb); drawTimer(-4, 6, 'right');
    screenTf();
    // where the labels ended up, in CSS pixels (used by the layout tests)
    hudLayout = { modeLabel: [hl + 6 * u, ft - 76 * u, hl + (6 + modeLbl.w) * u, ft - 62 * u], nextLabel: [hl + next.x0 * u, ft - 76 * u, hl + (next.x0 + next.w) * u, ft - 62 * u] };
  } else {
    at(fl, ft);
    hudLabel(gmode === 'classic' ? T('PISTEET') : MODE_INFO[gmode].name.toUpperCase(), -30, 30, 'right');
    hudNum(sc, -30, 80, 52, 'right');
    hudSmall(info, -30, 106, 'right');
    drawTimer(-30, 116, 'right', 28);
    screenTf();
    drawSideMascot(fl, ft, fb, u);
    at(fl, ft);
    hudLabel(T('SEURAAVA'), -30, 160, 'right');
    const pr = 12 + nxt * 3.2;
    drawRoundBlob(nxt, -30 - pr, 176 + pr, pr, 1, Math.max(1, pr * 0.07), true);
    hudSmall(NAMES[nxt], -30, 196 + 2 * pr, 'right');
    screenTf();
    drawChain(fr + 44 * u, ft + 76 * u, true, fb - ft - 100 * u, u);
    const lw = hudTextWidth(gmode === 'classic' ? T('PISTEET') : MODE_INFO[gmode].name.toUpperCase(), HUD_LABEL_FONT, '1.6px'), nw = hudTextWidth(T('SEURAAVA'), HUD_LABEL_FONT, '1.6px');
    hudLayout = { modeLabel: [fl - (30 + lw) * u, ft + 18 * u, fl - 30 * u, ft + 32 * u], nextLabel: [fl - (30 + nw) * u, ft + 148 * u, fl - 30 * u, ft + 162 * u] };
  }
}
// the mascot under the side HUD; on short screens (phones held sideways) it shrinks or moves so it never covers the HUD
// measured extent of the mascot drawing in units of its size s (tallest hat, mid-bounce)
const MASCOT_UP = 2.4, MASCOT_DOWN = 1.55, MASCOT_HALF_W = 1.4;
function drawSideMascot(fl, ft, fb, u) {
  let s = 46 * u, cx = fl - 100 * u, cy = fb - 120 * u;
  const free = ft + 330 * u; // below the next ball and the swing button
  if (cy - MASCOT_UP * s < free) {
    const s2 = (fb - 6 * u - free) / (MASCOT_UP + MASCOT_DOWN);
    if (s2 >= 26 * u) { s = Math.min(s, s2); cy = fb - 6 * u - MASCOT_DOWN * s; }
    else {
      // beside the HUD column instead, in the empty space at the screen's left edge
      const room = fl - 200 * u;
      s = Math.min(46 * u, room / (2 * MASCOT_HALF_W), (fb - ft) / (MASCOT_UP + MASCOT_DOWN));
      if (s < 18) return;
      cx = room / 2; cy = fb - 6 * u - MASCOT_DOWN * s;
    }
  }
  drawMascot(ctx, cx, cy, s, time, mascotBounce);
}

function render() {
  screenTf();
  drawScenery();
  ctx.drawImage(bg, 0, 0, vw, vh);
  let sx = 0, sy = 0;
  if (shake > 0) { sx = (Math.random() - 0.5) * shake * SC * 0.6; sy = (Math.random() - 0.5) * shake * SC * 0.6; }
  if (wobT > 0 && !reduceMotion) sx += Math.sin((1.4 - wobT) * TAU * 2.2) * 0.25 * SC * Math.min(1, wobT / 0.4);
  worldTf(sx, sy); drawJar(sx, sy);
  worldTf(sx, sy);
  drawDanger();
  drawStageGoal();
  if (state === 'play' && cooldown <= 0) drawAim();
  for (let q = 0; q < E.blobs.length; q++) drawBlob(E.blobs[q]);
  drawFlyingTrophies();
  drawBonuses();
  drawParticles();
  if (state === 'play' || state === 'paused') drawLauncher();
  screenTf();
  drawFloaters(sx, sy);
  drawHUD();
  drawTransition();
  // shown while a cheat is in use, so it is clear why no record is kept
  if ((invincible || infSwing || cheated) && (state === 'play' || state === 'paused')) { ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = invincible ? '#ff6b6b' : '#ffcc00'; ctx.fillText((invincible ? 'ADMIN · ' + T('KUOLEMATON') : 'ADMIN') + (infSwing ? ' · ∞' : ''), 8, 6); ctx.textBaseline = 'alphabetic'; }
  drawNelli();
  drawCardMascot();
}

function frame(now) {
  watchFrameTime(now - last);
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0; else if (dt > 0.1) dt = 0.1;
  {
    // the world keeps living behind the pause menu too
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 3) { stepGame(); acc -= STEP; n++; }
    if (n === 3) acc = 0;
  }
  updateFx(dt);
  render();
  requestAnimationFrame(frame);
}
