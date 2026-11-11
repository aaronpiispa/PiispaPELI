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
  if (goldBalls()) {
    // golden rim outfit (Hermes reward): a bright gold band just inside the dark outline
    const gg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    gg.addColorStop(0, '#fff3b0'); gg.addColorStop(0.45, '#ffcc00'); gg.addColorStop(1, '#a67c00');
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
function drawCup(x, y, s) {
  // a small gold cup centred at (x, y)
  const sh = Math.sin(time * 2 + x) * 0.5 + 0.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = `rgba(255,220,90,${0.25 + sh * 0.25})`; ctx.beginPath(); ctx.arc(0, -0.2, 1.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffcc00'; ctx.strokeStyle = '#a07800'; ctx.lineWidth = 0.12;
  ctx.beginPath(); ctx.moveTo(-0.8, -1); ctx.lineTo(0.8, -1); ctx.quadraticCurveTo(0.8, 0.3, 0, 0.3); ctx.quadraticCurveTo(-0.8, 0.3, -0.8, -1); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-0.85, -0.55, 0.32, Math.PI * 0.5, Math.PI * 1.5); ctx.moveTo(0.85, -0.87); ctx.arc(0.85, -0.55, 0.32, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.fillRect(-0.15, 0.3, 0.3, 0.4); ctx.fillRect(-0.5, 0.7, 1, 0.25);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-0.5, -0.85, 0.18, 0.7);
  ctx.restore();
}
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
const FRONT_AREAS = [[VX0 - 0.5, VY0 - 0.5, 0.1, VY1 + 0.5], [WORLD_W - 0.1, VY0 - 0.5, VX1 + 0.5, VY1 + 0.5], [0.1, FLOOR_Y - 0.1, WORLD_W - 0.1, FLOOR_Y + 0.6]];
// the trophy shelves above the floor
const SHELF_AREAS = [[-0.4, FLOOR_Y - 4.6, WORLD_W + 0.4, FLOOR_Y + 0.3]];
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
function jarParams() {
  const th = theme();
  return { th, wT: 0.34, gold: goldEdges() && th.id === 'eu', trim: goldEdges() && th.id !== 'eu', roll: reduceMotion ? 0 : time };
}
function jarBack() {
  const { th, wT, gold, trim } = jarParams();
  ctx.fillStyle = goldEdges() && th.id === 'eu' ? 'rgba(120,90,20,0.22)' : th.body; ctx.beginPath(); ctx.moveTo(-FUN_W, FUN_TOP); ctx.lineTo(WORLD_W + FUN_W, FUN_TOP); ctx.lineTo(WORLD_W, FUN_Y); ctx.lineTo(WORLD_W, FLOOR_Y); ctx.lineTo(0, FLOOR_Y); ctx.lineTo(0, FUN_Y); ctx.closePath(); ctx.fill();
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
  ctx.fillStyle = '#141b30'; rrect(-wT - 0.15, FLOOR_Y + 0.42, WORLD_W + 2 * wT + 0.3, 0.24, 0.06); ctx.fill();
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
  ctx.fillStyle = fg; rrect(-wT, FLOOR_Y, WORLD_W + 2 * wT, 0.5, 0.12); ctx.fill();
  ctx.fillStyle = gold || trim ? '#fff3b0' : th.stripe; ctx.fillRect(-wT + 0.15, FLOOR_Y + 0.05, WORLD_W + 2 * wT - 0.3, 0.04);
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
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(inner, FLOOR_Y + 0.3); ctx.lineTo(inner, FUN_Y); ctx.lineTo(inner + d * FUN_W, FUN_TOP);
    ctx.lineTo(outer + d * FUN_W, FUN_TOP); ctx.lineTo(outer, FUN_Y); ctx.lineTo(outer, FLOOR_Y + 0.3); ctx.closePath(); ctx.fill();
    if (th.id === 'viking' && !gold) { ctx.strokeStyle = 'rgba(30,16,6,0.55)'; ctx.lineWidth = 0.03; ctx.beginPath(); for (let k = 1; k < 3; k++) { const f = k / 3; ctx.moveTo(inner + d * wT * f, FLOOR_Y + 0.3); ctx.lineTo(inner + d * wT * f, FUN_Y); ctx.lineTo(inner + d * (FUN_W + wT * f), FUN_TOP); } ctx.stroke(); }
    ctx.lineWidth = trim ? 0.07 : 0.05; ctx.strokeStyle = trim ? '#ffd84d' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(inner, FLOOR_Y); ctx.lineTo(inner, FUN_Y); ctx.lineTo(inner + d * FUN_W, FUN_TOP); ctx.stroke();
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
  const base = canvas.width + 'x' + canvas.height + '|' + SC + '|' + OX + '|' + OY + '|' + th.id + '|' + goldEdges() + '|' + fontGen;
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
  // gold milestone cups ride on the wagon's side
  for (let k = 0, n = trophies(); k < n; k++) drawCup(WORLD_W - 0.5 - k * 0.62, FLOOR_Y + 0.25, 0.22 + k * 0.012);
  // the trophy shelves: cached, except while a newly won trophy is still popping
  const now = Date.now(), popping = ACH.some(a => achGot[a[0]] && now - achGot[a[0]] < 1300);
  if (popping) drawTrophyWall();
  else cachedLayer('shelf', base + '|' + ACH.map(a => achGot[a[0]] ? 1 : 0).join('') + '|' + Object.keys(TOBJ).join(), drawTrophyWall, sx, sy, SHELF_AREAS);
}
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

function drawJarLabels(sx, sy) {
  const fs = Math.round(clamp(0.34 * SC, 10, 15));
  ctx.font = `600 ${fs}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const pulse = dangerT > 0 ? Math.abs(Math.sin(time * 9)) : 0;
  ctx.font = `800 ${fs + 1}px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = `rgba(255,90,90,${0.75 + pulse * 0.25})`;

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
    // mount plate in the wall
    ctx.save(); ctx.beginPath(); rrect(mx, hy - 0.1, 0.2, BTN_H + 0.2, 0.05); ctx.clip();
    if (th.id === 'viking') {
      ctx.fillStyle = '#6b4423'; ctx.fillRect(mx, hy - 0.1, 0.2, BTN_H + 0.2);
      ctx.fillStyle = '#3a4048'; for (const y of [hy + 0.15, BTN_Y, hy + BTN_H - 0.15]) { ctx.fillRect(mx, y - 0.05, 0.2, 0.1); ctx.fillStyle = '#cfd5de'; ctx.beginPath(); ctx.arc(mx + 0.1, y, 0.035, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a4048'; }
    } else if (th.id === 'heart') {
      ctx.fillStyle = '#ffd1e0'; ctx.fillRect(mx, hy - 0.1, 0.2, BTN_H + 0.2);
      ctx.fillStyle = '#ff6f9f'; for (let y = hy + 0.1; y < hy + BTN_H; y += 0.34) { heartPath(ctx, mx + 0.1, y + 0.05, 0.16); ctx.fill(); }
    } else if (th.id === 'uni') {
      // a stack of book spines
      const bc = ['#7a1f2b', '#1f4a7a', '#2f6b3a', '#a8781e', '#4a2a6a'];
      for (let y = hy - 0.1, k = 0; y < hy + BTN_H + 0.1; y += 0.24, k++) { ctx.fillStyle = bc[k % 5]; ctx.fillRect(mx, y, 0.2, 0.22); ctx.fillStyle = '#d4af37'; ctx.fillRect(mx, y + 0.09, 0.2, 0.025); }
    } else {
      ctx.fillStyle = '#16181f'; ctx.fillRect(mx, hy - 0.1, 0.2, BTN_H + 0.2);
      ctx.fillStyle = '#ffcc00'; for (let y = hy - 0.4; y < hy + BTN_H + 0.2; y += 0.3) { ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx + 0.2, y + 0.2); ctx.lineTo(mx + 0.2, y + 0.35); ctx.lineTo(mx, y + 0.15); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
    // push rod
    const x0 = Math.min(x, hx), len = Math.abs(hx - x);
    if (th.id === 'viking') {
      // a wooden oar shaft with an iron band
      const g = ctx.createLinearGradient(0, BTN_Y - rh / 2, 0, BTN_Y + rh / 2); g.addColorStop(0, '#c08a52'); g.addColorStop(1, '#6b4423');
      ctx.fillStyle = g; ctx.fillRect(x0, BTN_Y - rh * 0.4, len, rh * 0.8); ctx.fillStyle = '#3a4048'; ctx.fillRect(x + dir * out * 0.45 - 0.03, BTN_Y - rh * 0.45, 0.06, rh * 0.9);
    } else if (th.id === 'heart') {
      // a curly pink ribbon spring
      ctx.strokeStyle = '#ff9cc0'; ctx.lineWidth = 0.06; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k <= 24; k++) { const u = k / 24, px = x + dir * out * u, py = BTN_Y + Math.sin(u * TAU * 3) * rh * 0.7; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.lineCap = 'butt';
    } else if (th.id === 'uni') {
      // a yellow pencil
      ctx.fillStyle = '#f2c230'; ctx.fillRect(x0, BTN_Y - rh * 0.4, len, rh * 0.8);
      ctx.fillStyle = '#d9a514'; ctx.fillRect(x0, BTN_Y - rh * 0.05, len, rh * 0.12);
      ctx.fillStyle = '#c9c9c9'; ctx.fillRect(side ? x - 0.08 : x, BTN_Y - rh * 0.4, 0.08, rh * 0.8);
    } else {
      const rg = ctx.createLinearGradient(0, BTN_Y - rh / 2, 0, BTN_Y + rh / 2);
      rg.addColorStop(0, '#e8edf6'); rg.addColorStop(0.5, '#8a93ad'); rg.addColorStop(1, '#3a4258');
      ctx.fillStyle = rg; ctx.fillRect(x0, BTN_Y - rh / 2, len, rh);
      ctx.strokeStyle = '#2a2f3f'; ctx.lineWidth = 0.035; ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const px = x + dir * out * k / 6; ctx.moveTo(px, BTN_Y - rh * 0.85); ctx.lineTo(px + dir * out / 12, BTN_Y + rh * 0.85); }
      ctx.stroke();
    }
    // glow when pressed all the way
    if (full) { ctx.fillStyle = both ? `rgba(255,60,60,${0.3 + pulse * 0.3})` : 'rgba(255,140,40,0.25)'; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.42, BTN_H * 0.62, 0, 0, TAU); ctx.fill(); }
    // head
    if (th.id === 'viking') {
      // a round shield seen from the side: painted halves and an iron boss
      const sc = full ? [col, col] : ['#b8323a', '#f2e6cc'];
      ctx.fillStyle = sc[0]; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.14, BTN_H / 2, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = sc[1]; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.14, BTN_H / 2, 0, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      ctx.lineWidth = 0.05; ctx.strokeStyle = '#6b4a2a'; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.14, BTN_H / 2, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#cfd5de'; ctx.beginPath(); ctx.ellipse(hx - dir * 0.08, BTN_Y, 0.09, 0.2, 0, 0, TAU); ctx.fill();
    } else if (th.id === 'heart') {
      // a big puffy heart
      ctx.save(); ctx.translate(hx + dir * 0.06, BTN_Y); ctx.rotate(dir * Math.PI / 2); ctx.scale(1, 0.3);
      ctx.fillStyle = col; heartPath(ctx, 0, BTN_H * 0.32, BTN_H * 0.95); ctx.fill();
      ctx.lineWidth = 0.06; ctx.strokeStyle = 'rgba(120,0,40,0.5)'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-BTN_H * 0.18, -BTN_H * 0.05, BTN_H * 0.06, BTN_H * 0.12, 0.5, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (th.id === 'uni') {
      // a thick book with its pages facing the balls
      const bw = 0.26, bx = side ? hx - bw : hx;
      ctx.fillStyle = col; rrect(bx, BTN_Y - BTN_H / 2, bw, BTN_H, 0.04); ctx.fill();
      ctx.fillStyle = '#f6f1e2'; ctx.fillRect(side ? bx + 0.02 : bx + bw - 0.1, BTN_Y - BTN_H / 2 + 0.07, 0.08, BTN_H - 0.14);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.012; ctx.beginPath();
      for (let k = 1; k < 4; k++) { const px = (side ? bx + 0.02 : bx + bw - 0.1) + k * 0.02; ctx.moveTo(px, BTN_Y - BTN_H / 2 + 0.08); ctx.lineTo(px, BTN_Y + BTN_H / 2 - 0.08); }
      ctx.stroke(); ctx.fillStyle = '#d4af37'; ctx.fillRect(side ? bx + bw - 0.08 : bx + 0.03, BTN_Y - 0.3, 0.05, 0.6);
    } else {
      const hg = ctx.createLinearGradient(hx - 0.12, 0, hx + 0.12, 0); hg.addColorStop(0, col); hg.addColorStop(side ? 0.2 : 0.8, '#ffffff'); hg.addColorStop(side ? 0.35 : 0.65, col); hg.addColorStop(1, col);
      ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.13, BTN_H / 2, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 0.04; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(hx, BTN_Y, 0.04, BTN_H * 0.32, 0, 0, TAU); ctx.fill();
    }
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

// ---- trampolines on the walls all the way up from the buttons ----
const TR_TOP = -0.2, TR_BOT = BTN_Y - BTN_H / 2 - 0.3;
const tramp = [{ flash: 0, y: 0 }, { flash: 0, y: 0 }];
function bumperStep() {
  for (const t of tramp) if (t.flash > 0) t.flash -= STEP * 2.5;
  const hits = new Map(), lim = RB + 0.05;
  for (let i = 0; i < E.NB; i++) {
    const x = X[i];
    if (x > lim && x < WORLD_W - lim) continue;
    const y = Y[i];
    if (y < TR_TOP || y > TR_BOT) continue;
    if (!hits.has(OWN[i])) hits.set(OWN[i], [x < 1 ? 0 : 1, y]);
  }
  for (const [bi, [side, y]] of hits) {
    const b = E.blobs[bi];
    if (b.trampT && time - b.trampT < 0.35) continue;
    b.trampT = time;
    const dir = side ? -1 : 1, kick = 6 + Math.min(6, Math.abs(b.vx) * 0.6);
    for (let i = b.start; i < b.start + b.n; i++) { VX[i] = dir * Math.max(dir * VX[i], 0) + dir * kick; VY[i] -= 2; }
    tramp[side].flash = 1; tramp[side].y = y;
    sfx.bump();
    if (state === 'play') { addScore(10); floater('+10', side ? WORLD_W - 0.8 : 0.8, y, '#7fe7ff', 14); }
  }
}
function drawBumpers() {
  for (let side = 0; side < 2; side++) {
    const t = tramp[side], x = side ? WORLD_W - 0.2 : 0, f = Math.max(0, t.flash), h = TR_BOT - TR_TOP;
    // stretchy trampoline mat
    const g = ctx.createLinearGradient(x, 0, x + 0.2, 0);
    g.addColorStop(0, side ? '#1aa6d9' : '#7fe7ff'); g.addColorStop(1, side ? '#7fe7ff' : '#1aa6d9');
    ctx.fillStyle = g; rrect(x, TR_TOP, 0.2, h, 0.08); ctx.fill();
    // springs
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 0.035; ctx.beginPath();
    const zx = side ? WORLD_W - 0.1 : 0.1;
    for (let y = TR_TOP + 0.1, k = 0; y < TR_BOT - 0.05; y += 0.18, k++) ctx.lineTo(zx + (k % 2 ? 0.06 : -0.06), y);
    ctx.stroke();
    if (f > 0) {
      const gl = ctx.createRadialGradient(x + 0.065, t.y, 0, x + 0.065, t.y, 1.2);
      gl.addColorStop(0, `rgba(127,231,255,${0.6 * f})`); gl.addColorStop(1, 'rgba(127,231,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x + 0.065, t.y, 1.2, 0, TAU); ctx.fill();
    }
  }
}

// ---- bonus targets flying across the empty top of the wagon ----
const bonuses = [];
let bonusT = 12;
function bonusStep() {
  bonusT -= STEP;
  if (bonusT <= 0) {
    bonusT = 18 + Math.random() * 16;
    const heart = Math.random() < 0.08, dir = Math.random() < 0.5 ? 1 : -1;
    bonuses.push({ x: dir > 0 ? -0.6 : WORLD_W + 0.6, y: 2.2 + Math.random() * 1.6, vx: dir * (1.2 + Math.random() * 0.8), r: heart ? 0.42 : 0.38, heart, t: 0 });
  }
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const o = bonuses[i];
    o.t += STEP; o.x += o.vx * STEP;
    const oy = o.y + Math.sin(o.t * 2.5) * 0.25;
    if (o.x < -1 || o.x > WORLD_W + 1) { bonuses.splice(i, 1); continue; }
    // any ball touching it collects it
    let hit = false;
    for (const b of E.blobs) {
      const dx = b.cx - o.x, dy = b.cy - oy, rr = b.R * b.scale + o.r;
      if (dx * dx + dy * dy < rr * rr) { hit = true; break; }
    }
    if (hit) {
      bonuses.splice(i, 1);
      unlock(o.heart ? 'heart' : 'star');
      const pts = o.heart ? 1000 : 500;
      addScore(pts);
      for (let l = 0; l < 6; l++) burst(o.x, oy, o.heart ? 0 : 8, 4, 0.8);
      ring(o.x, oy, 1, o.heart ? 0 : 8);
      floater(T(o.heart ? 'Harvinainen bonus +{0}' : 'Tähtibonus +{0}', pts), o.x, oy - 0.6, o.heart ? '#ff8fab' : '#ffe066', 22);
      sfx.mega(); mascotBounce = 1;
    }
  }
}
function drawBonuses() {
  for (const o of bonuses) {
    const oy = o.y + Math.sin(o.t * 2.5) * 0.25, sc = 1 + Math.sin(o.t * 6) * 0.06;
    ctx.save(); ctx.translate(o.x, oy); ctx.scale(sc, sc);
    ctx.fillStyle = o.heart ? 'rgba(255,77,125,0.25)' : 'rgba(255,204,0,0.25)';
    ctx.beginPath(); ctx.arc(0, 0, o.r * 1.7, 0, TAU); ctx.fill();
    if (o.heart) { ctx.fillStyle = '#ff4d7d'; heartPath(ctx, 0, o.r * 0.25, o.r * 1.1); ctx.fill(); }
    else {
      ctx.rotate(o.t * 1.5); ctx.fillStyle = '#ffcc00'; ctx.beginPath();
      for (let p = 0; p < 10; p++) { const rr = p % 2 ? o.r * 0.45 : o.r, a = -Math.PI / 2 + p * Math.PI / 5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill(); ctx.lineWidth = 0.04; ctx.strokeStyle = '#a07800'; ctx.stroke();
    }
    ctx.restore();
  }
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
  const key = [x0, y0, vertical, room, u, seenNow, dpr, fontGen, theme().id, stage, goldBalls()].join('|');
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
const openGoals = () => (gmode === 'classic' && stage > 0 && (state === 'play' || state === 'paused') && !invincible ? STAGE_GOALS[stage].filter(g => maxLevel < g[0]) : []);
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
    const [cx, cy, r] = pos[g[0]], left = g[1] - playT, blink = k === 0 ? 0.55 + 0.45 * Math.abs(Math.sin(time * (left < 30 ? 9 : 4))) : 0.45;
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
  const left = Math.max(0, g[1] - playT), mm = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0');
  const urgent = left < 30, a = urgent ? 0.45 + 0.35 * Math.abs(Math.sin(time * 6)) : 0.42;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(255,50,60,${a})`;
  let size = 0.62; ctx.font = `900 ${size}px ${FONT}`;
  const name = NAMES[g[0]], w = ctx.measureText(name).width;
  if (w > WORLD_W - 1.4) size *= (WORLD_W - 1.4) / w;
  worldText(name, WORLD_W / 2, 2.95, size, 900);
  worldText(mm, WORLD_W / 2, 3.95, 0.95, 900);
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
  if (gmode === 'time') return T('Aikaa {0} · ennätys {1}', mmss(modeT), modeBest('time'));
  if (gmode === 'daily') return T('Laukaukset {0} · tavoite {1}', shots, NAMES[10]);
  if (gmode === 'zen') return T('Rentoudu');
  if (gmode === 'gravity') return T('Painovoima: {0}', GRAVS[gravI][2]);
  if (gmode === 'classic' && stage > 0) {
    const gl = STAGE_GOALS[stage].find(g => maxLevel < g[0]);
    if (gl && !invincible) return NAMES[gl[0]] + ': ' + T('aikaa {0}', mmss(Math.max(0, gl[1] - playT)));
    return T('Taso {0}: {1}', stage + 1, T(stageInfo().name));
  }
  if (gmode === 'map' && missionIdx >= 0) {
    const ms = MISSIONS[missionIdx];
    return NAMES[ms.c] + ': ' + (ms.time ? T('aikaa {0}', mmss(modeT)) : ms.shots ? T('laukauksia {0}', Math.max(0, ms.shots - shots)) : ms.text);
  }
  return T('Ennätys {0}', best);
}
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
    const label = gmode === 'zen' ? 'ZEN' : gmode === 'classic' ? T('PISTEET') : MODE_INFO[gmode].name.toUpperCase(), nl = T('SEURAAVA');
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
    hudNum(gmode === 'zen' ? '∞' : sc, 4, -28, 36, 'left');
    hudSmall(info, 6, -9, 'left');
    if (next.align === 'center' && next.k === 1) hudLabel(nl, next.x, -64, 'center'); else hudLabelSized(next, next.x, -64, next.align);
    at(fc, ft);
    const pr = 8 + nxt * 2.6;
    drawRoundBlob(nxt, 0, -32, pr, 1, Math.max(1, pr * 0.07), pr > 9);
    hudSmall(NAMES[nxt], pr + 8, -27, 'left');
    screenTf();
    drawChain(fc, fb + 78 * u, false, Math.min(vw - 12, hr - hl + 40), u);
    // where the labels ended up, in CSS pixels (used by the layout tests)
    hudLayout = { modeLabel: [hl + 6 * u, ft - 76 * u, hl + (6 + modeLbl.w) * u, ft - 62 * u], nextLabel: [hl + next.x0 * u, ft - 76 * u, hl + (next.x0 + next.w) * u, ft - 62 * u] };
  } else {
    at(fl, ft);
    hudLabel(gmode === 'classic' ? T('PISTEET') : MODE_INFO[gmode].name.toUpperCase(), -30, 30, 'right');
    hudNum(gmode === 'zen' ? '∞' : sc, -30, 80, 52, 'right');
    hudSmall(info, -30, 106, 'right');
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
  screenTf(); drawJarLabels(sx, sy);
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
  if (adminOn) { ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = invincible ? '#ff6b6b' : '#ffcc00'; ctx.fillText((invincible ? 'ADMIN · ' + T('KUOLEMATON') : 'ADMIN') + (infSwing ? ' · ∞' : ''), 8, 6); ctx.textBaseline = 'alphabetic'; }
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
