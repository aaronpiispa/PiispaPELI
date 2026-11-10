// PiispanPELI · Soft-body physics: blobs made of bead rings, collisions, merging.
'use strict';

// <engine>
// ---- Soft-body engine: every blob is a ring of small beads held together by
// ---- skin (edge length), pressure (area) and a soft shape-matching spring.
const WORLD_W = 12, FLOOR_Y = 19.2, DANGER_Y = 2.75, LX = 6, LY = 1.1;
const GRAV = 24, RB = 0.11, SPACING = 0.165;
const RADII = [0.40, 0.47, 0.54, 0.63, 0.74, 0.86, 1.00, 1.17, 1.36, 1.59, 1.85, 2.16, 2.51, 2.93, 3.40];
const MAXL = RADII.length - 1;
const STEP = 1 / 60, SUB = 8, H = STEP / SUB;
const KE = 0.9, KA = 0.25, KS = 0.003, SLACK = 0.9;
const INT_DAMP = 0.997, GLOB_DAMP = 0.99995, VMAX = 60;
const ANG_KEEP = 0.9995, REST_V = 0.02, REST_DAMP = 0.995, MASS_EXP = -0.5;
const MU = 0.03, WALL_MU = 0.1, FLOOR_MU = 0.1, GROW_T = 0.32;
const MAXN = 9000;
const X = new Float64Array(MAXN), Y = new Float64Array(MAXN);
const PX = new Float64Array(MAXN), PY = new Float64Array(MAXN);
const VX = new Float64Array(MAXN), VY = new Float64Array(MAXN);
const IW = new Float64Array(MAXN), OWN = new Int32Array(MAXN);
const TGX = new Float64Array(512), TGY = new Float64Array(512);
const CELL = 0.25, GX0 = -1.5, GY0 = -12;
const GW = Math.ceil((WORLD_W + 3) / CELL), GH = Math.ceil((FLOOR_Y + 14) / CELL), GN = GW * GH;
const cellStart = new Int32Array(GN + 1), cellCur = new Int32Array(GN);
const cellItems = new Int32Array(MAXN), beadCell = new Int32Array(MAXN);
const CD = 2 * RB, CD2 = CD * CD;
const E = { blobs: [], NB: 0, mergeQ: [], events: [], idc: 0, gx: 0, gy: GRAV };

function easeOutBack(u) { const c1 = 2.2, c3 = c1 + 1, t = u - 1; return 1 + c3 * t * t * t + c1 * t * t; }

function makeBlob(level, cx, cy, vx, vy, s0) {
  const R = RADII[level], Rr = R - RB;
  const n = Math.max(10, Math.round(2 * Math.PI * Rr / SPACING));
  if (E.NB + n > MAXN) return null;
  const sc = s0 == null ? 1 : s0;
  const b = {
    id: ++E.idc, level, R, Rr, n, start: E.NB, index: E.blobs.length,
    rest: 2 * Rr * Math.sin(Math.PI / n), area0: 0.5 * n * Rr * Rr * Math.sin(2 * Math.PI / n),
    rx: new Float64Array(n), ry: new Float64Array(n),
    // big balls keep their shape better so they don't droop
    slack: SLACK + (1 - SLACK) * 0.8 * level / MAXL, ks: KS * (1 + 2.5 * level / MAXL),
    s0: sc, scale: sc, gt: sc < 1 ? 0 : GROW_T, age: 0, alive: true, merging: false, touched: false,
    cx, cy, vx, vy, ang: 0, top: cy - R, spd: 0, blink: 1 + Math.random() * 4, blinkT: 0
  };
  const w = 1 / Math.pow(Rr, MASS_EXP);
  for (let k = 0; k < n; k++) {
    const th = 2 * Math.PI * k / n, c = Math.cos(th), s = Math.sin(th);
    b.rx[k] = c; b.ry[k] = s;
    const i = E.NB + k;
    X[i] = cx + c * Rr * sc; Y[i] = cy + s * Rr * sc; PX[i] = X[i]; PY[i] = Y[i];
    VX[i] = vx; VY[i] = vy; IW[i] = w; OWN[i] = b.index;
  }
  E.NB += n; E.blobs.push(b);
  return b;
}

function clearAll() { E.blobs = []; E.NB = 0; E.mergeQ.length = 0; E.events.length = 0; }

function solveBlob(b) {
  const s = b.start, n = b.n, e = s + n, sc = b.scale;
  // skin: keep neighbouring beads at their rest distance
  const L0 = b.rest * sc;
  for (let k = 0; k < n; k++) {
    const i = s + k, j = k + 1 < n ? i + 1 : s;
    const dx = X[j] - X[i], dy = Y[j] - Y[i];
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-9) continue;
    const c = 0.5 * KE * (d - L0) / d;
    X[i] += dx * c; Y[i] += dy * c; X[j] -= dx * c; Y[j] -= dy * c;
  }
  // pressure: keep the enclosed area
  let A = 0;
  for (let k = 0; k < n; k++) { const i = s + k, j = k + 1 < n ? i + 1 : s; A += X[i] * Y[j] - X[j] * Y[i]; }
  A *= 0.5;
  const C = A - b.area0 * b.slack * sc * sc;
  let sg = 0;
  for (let k = 0; k < n; k++) {
    const ip = k + 1 < n ? s + k + 1 : s, im = k > 0 ? s + k - 1 : e - 1;
    const gx = 0.5 * (Y[ip] - Y[im]), gy = 0.5 * (X[im] - X[ip]);
    TGX[k] = gx; TGY[k] = gy; sg += gx * gx + gy * gy;
  }
  if (sg > 1e-12) {
    let lam = -KA * C / sg;
    const lim = 0.04 / Math.sqrt(sg / n);
    if (lam > lim) lam = lim; else if (lam < -lim) lam = -lim;
    for (let k = 0; k < n; k++) { X[s + k] += lam * TGX[k]; Y[s + k] += lam * TGY[k]; }
  }
  // jelly: gently pull towards the rotated rest circle
  let cx = 0, cy = 0;
  for (let i = s; i < e; i++) { cx += X[i]; cy += Y[i]; }
  cx /= n; cy /= n;
  let sa = 0, ca = 0;
  for (let k = 0; k < n; k++) {
    const dx = X[s + k] - cx, dy = Y[s + k] - cy;
    sa += b.rx[k] * dy - b.ry[k] * dx; ca += b.rx[k] * dx + b.ry[k] * dy;
  }
  const m = Math.sqrt(sa * sa + ca * ca);
  if (m > 1e-9) {
    sa /= m; ca /= m;
    const r = b.Rr * sc;
    for (let k = 0; k < n; k++) {
      const gx = cx + r * (ca * b.rx[k] - sa * b.ry[k]), gy = cy + r * (sa * b.rx[k] + ca * b.ry[k]);
      X[s + k] += (gx - X[s + k]) * b.ks; Y[s + k] += (gy - Y[s + k]) * b.ks;
    }
  }
}

function buildGrid() {
  const nb = E.NB;
  cellStart.fill(0);
  for (let i = 0; i < nb; i++) {
    let cx = ((X[i] - GX0) / CELL) | 0, cy = ((Y[i] - GY0) / CELL) | 0;
    if (cx < 0) cx = 0; else if (cx >= GW) cx = GW - 1;
    if (cy < 0) cy = 0; else if (cy >= GH) cy = GH - 1;
    const c = cy * GW + cx;
    beadCell[i] = c; cellStart[c + 1]++;
  }
  for (let c = 0; c < GN; c++) { cellStart[c + 1] += cellStart[c]; cellCur[c] = cellStart[c]; }
  for (let i = 0; i < nb; i++) cellItems[cellCur[beadCell[i]]++] = i;
}

function collide() {
  const nb = E.NB, bl = E.blobs;
  for (let i = 0; i < nb; i++) {
    const c = beadCell[i], gx = c % GW, gy = (c / GW) | 0, oi = OWN[i];
    const x0 = gx > 0 ? gx - 1 : 0, x1 = gx < GW - 1 ? gx + 1 : gx;
    const y0 = gy > 0 ? gy - 1 : 0, y1 = gy < GH - 1 ? gy + 1 : gy;
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const cc = yy * GW + xx, ce = cellStart[cc + 1];
        for (let k = cellStart[cc]; k < ce; k++) {
          const j = cellItems[k];
          if (j <= i) continue;
          const oj = OWN[j];
          if (oj === oi) continue;
          let dx = X[j] - X[i], dy = Y[j] - Y[i];
          const d2 = dx * dx + dy * dy;
          if (d2 >= CD2) continue;
          let d = Math.sqrt(d2);
          if (d < 1e-6) { dx = 1e-3; dy = 0; d = 1e-3; }
          const nx = dx / d, ny = dy / d, pen = CD - d;
          const wi = IW[i], wj = IW[j], ws = wi + wj, corr = pen / ws;
          X[i] -= nx * corr * wi; Y[i] -= ny * corr * wi;
          X[j] += nx * corr * wj; Y[j] += ny * corr * wj;
          // friction: cancel part of the sliding motion (Coulomb-like)
          const rx = (X[j] - PX[j]) - (X[i] - PX[i]), ry = (Y[j] - PY[j]) - (Y[i] - PY[i]);
          const rn = rx * nx + ry * ny, tx = rx - rn * nx, ty = ry - rn * ny;
          const tl = Math.sqrt(tx * tx + ty * ty);
          if (tl > 1e-9) {
            const f = Math.min(1, MU * pen / tl) / ws;
            X[i] += tx * f * wi; Y[i] += ty * f * wi; X[j] -= tx * f * wj; Y[j] -= ty * f * wj;
          }
          const A = bl[oi], B = bl[oj];
          A.touched = true; B.touched = true;
          if (A.level === B.level && !A.merging && !B.merging) {
            A.merging = true; B.merging = true; E.mergeQ.push(A, B);
          }
        }
      }
    }
  }
}

// the wagon's mouth widens like a funnel above FUN_Y
const FUN_Y = 3.4, FUN_W = 1.0, FUN_TOP = -0.3;
function funnelAt(y) { return y >= FUN_Y ? 0 : Math.min(1, (FUN_Y - y) / (FUN_Y - FUN_TOP)) * FUN_W; }
function walls() {
  const nb = E.NB, ymax = FLOOR_Y - RB;
  for (let i = 0; i < nb; i++) {
    const fw = funnelAt(Y[i]), xmin = RB - fw, xmax = WORLD_W - RB + fw;
    if (X[i] < xmin || X[i] > xmax) {
      const pen = X[i] < xmin ? xmin - X[i] : X[i] - xmax;
      X[i] = X[i] < xmin ? xmin : xmax;
      const dy = Y[i] - PY[i], f = Math.min(Math.abs(dy), WALL_MU * pen);
      Y[i] -= dy > 0 ? f : -f;
    }
    if (Y[i] > ymax) {
      const pen = Y[i] - ymax;
      Y[i] = ymax;
      const dx = X[i] - PX[i], f = Math.min(Math.abs(dx), FLOOR_MU * pen);
      X[i] -= dx > 0 ? f : -f;
      E.blobs[OWN[i]].touched = true;
    }
  }
}


// push any bead that ended up inside another blob back out through the nearest skin edge
const BBX0 = [], BBX1 = [], BBY0 = [], BBY1 = [];
function unpenetrate() {
  const bl = E.blobs, nbl = bl.length;
  for (let q = 0; q < nbl; q++) {
    const b = bl[q], s = b.start, e = s + b.n;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = s; i < e; i++) { const x = X[i], y = Y[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    BBX0[q] = x0; BBX1[q] = x1; BBY0[q] = y0; BBY1[q] = y1;
  }
  for (let qa = 0; qa < nbl; qa++) {
    const A = bl[qa], as = A.start, an = A.n;
    for (let qb = 0; qb < nbl; qb++) {
      if (qb === qa || BBX0[qb] > BBX1[qa] || BBX1[qb] < BBX0[qa] || BBY0[qb] > BBY1[qa] || BBY1[qb] < BBY0[qa]) continue;
      const B = bl[qb], be = B.start + B.n;
      for (let j = B.start; j < be; j++) {
        const px = X[j], py = Y[j];
        if (px < BBX0[qa] || px > BBX1[qa] || py < BBY0[qa] || py > BBY1[qa]) continue;
        let inside = false;
        for (let k = 0, m = an - 1; k < an; m = k++) {
          const yi = Y[as + k], yj = Y[as + m];
          if ((yi > py) !== (yj > py) && px < (X[as + m] - X[as + k]) * (py - yi) / (yj - yi) + X[as + k]) inside = !inside;
        }
        if (!inside) continue;
        let best = 1e9, bx = 0, by = 0, bnx = 0, bny = 0, bk = 0;
        for (let k = 0; k < an; k++) {
          const i1 = as + k, i2 = as + (k + 1 < an ? k + 1 : 0);
          const ex = X[i2] - X[i1], ey = Y[i2] - Y[i1], l2 = ex * ex + ey * ey || 1e-9;
          let t = ((px - X[i1]) * ex + (py - Y[i1]) * ey) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = X[i1] + ex * t, qy = Y[i1] + ey * t, d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
          if (d2 < best) { const l = Math.sqrt(l2); best = d2; bx = qx; by = qy; bnx = ey / l; bny = -ex / l; bk = k; }
        }
        // move the bead out, and nudge the skin it crossed inward a little
        const tx = bx + bnx * RB * 1.05, ty = by + bny * RB * 1.05, dx = tx - px, dy = ty - py;
        X[j] += dx; Y[j] += dy; PX[j] += dx * 0.7; PY[j] += dy * 0.7;
        const i1 = as + bk, i2 = as + (bk + 1 < an ? bk + 1 : 0);
        X[i1] -= bnx * RB * 0.3; Y[i1] -= bny * RB * 0.3; X[i2] -= bnx * RB * 0.3; Y[i2] -= bny * RB * 0.3;
      }
    }
  }
}

function substep() {
  const nb = E.NB, g = E.gy * H, gxh = E.gx * H, bl = E.blobs;
  for (let i = 0; i < nb; i++) {
    VY[i] += g; VX[i] += gxh; PX[i] = X[i]; PY[i] = Y[i];
    X[i] += VX[i] * H; Y[i] += VY[i] * H;
  }
  for (let q = 0; q < bl.length; q++) solveBlob(bl[q]);
  buildGrid(); collide(); walls();
  if (E.hook) E.hook();
  const ih = 1 / H;
  for (let q = 0; q < bl.length; q++) {
    const b = bl[q], s = b.start, n = b.n, e = s + n;
    let mx = 0, my = 0, cx = 0, cy = 0;
    for (let i = s; i < e; i++) {
      const vx = (X[i] - PX[i]) * ih, vy = (Y[i] - PY[i]) * ih;
      VX[i] = vx; VY[i] = vy; mx += vx; my += vy; cx += X[i]; cy += Y[i];
    }
    mx /= n; my /= n; cx /= n; cy /= n;
    // damp wobble only: keep the blob's own travel and spin
    let L = 0, I = 0;
    for (let i = s; i < e; i++) {
      const rx = X[i] - cx, ry = Y[i] - cy;
      L += rx * (VY[i] - my) - ry * (VX[i] - mx); I += rx * rx + ry * ry;
    }
    // a little rolling resistance, and resting blobs come to a stop instead of creeping
    const w = I > 1e-9 ? L / I : 0, wk = w * ANG_KEEP;
    const gd = b.touched && mx * mx + my * my < REST_V * REST_V ? GLOB_DAMP * REST_DAMP : GLOB_DAMP;
    for (let i = s; i < e; i++) {
      const rx = X[i] - cx, ry = Y[i] - cy, bx = mx - w * ry, by = my + w * rx;
      let vx = (mx - wk * ry + (VX[i] - bx) * INT_DAMP) * gd, vy = (my + wk * rx + (VY[i] - by) * INT_DAMP) * gd;
      const v2 = vx * vx + vy * vy;
      if (v2 > VMAX * VMAX) { const f = VMAX / Math.sqrt(v2); vx *= f; vy *= f; }
      VX[i] = vx; VY[i] = vy;
    }
  }
}

function centroidVel(b) {
  const s = b.start, e = s + b.n;
  let x = 0, y = 0, vx = 0, vy = 0;
  for (let i = s; i < e; i++) { x += X[i]; y += Y[i]; vx += VX[i]; vy += VY[i]; }
  return { x: x / b.n, y: y / b.n, vx: vx / b.n, vy: vy / b.n };
}

function compact() {
  const old = E.blobs, keep = [];
  let w = 0;
  for (let q = 0; q < old.length; q++) {
    const b = old[q];
    if (!b.alive) continue;
    if (b.start !== w) {
      const s = b.start, e = s + b.n;
      X.copyWithin(w, s, e); Y.copyWithin(w, s, e); PX.copyWithin(w, s, e); PY.copyWithin(w, s, e);
      VX.copyWithin(w, s, e); VY.copyWithin(w, s, e); IW.copyWithin(w, s, e);
    }
    b.start = w; b.index = keep.length; OWN.fill(b.index, w, w + b.n);
    w += b.n; keep.push(b);
  }
  E.blobs = keep; E.NB = w;
}

function processMerges() {
  const q = E.mergeQ;
  if (!q.length) return;
  let changed = false;
  for (let k = 0; k < q.length; k += 2) {
    const A = q[k], B = q[k + 1];
    if (!A.alive || !B.alive) continue;
    const a = centroidVel(A), b = centroidVel(B);
    A.alive = false; B.alive = false; changed = true;
    const L = A.level, vx = (a.vx + b.vx) / 2, vy = (a.vy + b.vy) / 2;
    const host = a.y >= b.y ? a : b, other = host === a ? b : a;
    if (L < MAXL) {
      const s0 = Math.min(0.95, 0.72 * RADII[L] / RADII[L + 1]);
      const nb = makeBlob(L + 1, host.x, host.y, vx, vy, s0);
      if (nb) { nb.touched = true; nb.age = 0.3; }
      E.events.push({ type: 'merge', level: L + 1, x: host.x, y: host.y, ox: other.x, oy: other.y });
    } else {
      E.events.push({ type: 'max', level: L, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
  }
  q.length = 0;
  if (changed) compact();
}

function updateInfo() {
  const bl = E.blobs;
  for (let q = 0; q < bl.length; q++) {
    const b = bl[q], s = b.start, n = b.n, e = s + n;
    let x = 0, y = 0, vx = 0, vy = 0, top = 1e9;
    for (let i = s; i < e; i++) { x += X[i]; y += Y[i]; vx += VX[i]; vy += VY[i]; if (Y[i] < top) top = Y[i]; }
    x /= n; y /= n;
    b.cx = x; b.cy = y; b.vx = vx / n; b.vy = vy / n; b.top = top - RB;
    b.spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    let sa = 0, ca = 0;
    for (let k = 0; k < n; k++) {
      const dx = X[s + k] - x, dy = Y[s + k] - y;
      sa += b.rx[k] * dy - b.ry[k] * dx; ca += b.rx[k] * dx + b.ry[k] * dy;
    }
    b.ang = Math.atan2(sa, ca);
  }
}

function stepPhysics() {
  const bl = E.blobs;
  for (let q = 0; q < bl.length; q++) {
    const b = bl[q];
    b.age += STEP;
    if (b.gt < GROW_T) {
      b.gt = Math.min(GROW_T, b.gt + STEP);
      b.scale = b.s0 + (1 - b.s0) * easeOutBack(b.gt / GROW_T);
    } else b.scale = 1;
  }
  for (let s = 0; s < SUB; s++) { substep(); unpenetrate(); }
  processMerges();
  updateInfo();
}
// </engine>
