// PiispanPELI · The short opening animation.
'use strict';

// ------------------------------ opening intro: the PiispanPELI train rolls in ------------------------------
function playIntro() {
  if (reduceMotion || navigator.webdriver) return;
  const cv = document.createElement('canvas');
  cv.id = 'intro'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:60;cursor:pointer;transition:opacity .5s';
  document.body.appendChild(cv);
  const c = cv.getContext('2d');
  let W = 0, H = 0, D = 1, t0 = 0, ending = 0, done = false;
  const size = () => { D = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; };
  size(); window.addEventListener('resize', size);
  const stars = Array.from({ length: 90 }, () => [Math.random(), Math.random() * 0.62, Math.random() * 1.6 + 0.4, Math.random() * TAU]);
  const balls = [7, 9, 10, 2, 5, 11, 0, 8].map((lv, i) => ({ lv, a: -Math.PI / 2 + (i - 3.5) * 0.17, sp: 0.95 + Math.random() * 0.4, d: i * 0.05 }));
  const ease = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
  const back = u => { u = Math.min(1, Math.max(0, u)); const k = 1.9; return 1 + (k + 1) * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
  function finish() { if (ending) return; ending = performance.now(); cv.style.opacity = '0'; setTimeout(() => { done = true; cv.remove(); window.removeEventListener('resize', size); }, 520); }
  cv.addEventListener('pointerdown', e => { e.preventDefault(); finish(); });
  window.addEventListener('keydown', function k() { finish(); window.removeEventListener('keydown', k); });
  function wheel(x, y, r, rot) {
    c.fillStyle = '#10162a'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.lineWidth = r * 0.18; c.strokeStyle = '#b8c3e0'; c.stroke();
    c.lineWidth = r * 0.1; c.strokeStyle = '#6f7ba0'; c.beginPath();
    for (let k = 0; k < 3; k++) { const a = rot + k * Math.PI / 3; c.moveTo(x - Math.cos(a) * r * 0.8, y - Math.sin(a) * r * 0.8); c.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); }
    c.stroke(); c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(x, y, r * 0.25, 0, TAU); c.fill();
  }
  function draw(now) {
    if (done) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    c.setTransform(D, 0, 0, D, 0, 0);
    // night sky
    const g = c.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#1c3c8c'); g.addColorStop(0.55, '#0d2160'); g.addColorStop(1, '#040a22');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const [sx, sy, r, p] of stars) { c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.5 + p)); c.fillStyle = '#fff'; c.fillRect(sx * W, sy * H, r, r); }
    c.globalAlpha = 1;
    // EU star ring rising behind the title
    const ringA = ease((t - 0.2) / 0.8), cx = W / 2, cy = H * 0.3, rr = Math.min(W, H) * 0.24;
    c.fillStyle = `rgba(255,204,0,${0.85 * ringA})`;
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * 0.15; starPath(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rr * 0.07, rr * 0.03); c.fill(); }
    // track
    const u = Math.min(W, H) / 12, ty = H * 0.72;
    c.fillStyle = '#3a2a20'; for (let x = (W % (u * 0.9)) / 2; x < W; x += u * 0.9) c.fillRect(x, ty + u * 0.05, u * 0.55, u * 0.16);
    c.fillStyle = '#9aa6c4'; c.fillRect(0, ty - u * 0.04, W, u * 0.1);
    // the train slides in from the right and brakes in the middle
    const k = ease((t - 0.15) / 1.5), tx = W + u * 9 - (W / 2 + u * 9 - u * 1.2) * k, dist = (W + u * 9 - tx) / u, bob = Math.sin(t * 18) * (1 - k) * u * 0.03;
    // steam
    for (let i = 0; i < 9; i++) {
      const age = ((t * 1.2 + i / 9) % 1), px = tx - u * 2.6 + age * u * 1.8, py = ty - u * 3.1 - age * u * 2.4, pr = u * (0.25 + age * 0.6);
      c.fillStyle = `rgba(230,236,250,${0.5 * (1 - age)})`; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    }
    c.save(); c.translate(0, bob);
    // locomotive (facing left)
    const lx = tx - u * 4.4, ly = ty - u * 0.55;
    c.fillStyle = '#c0283a'; rrectOn(c, lx, ly - u * 1.7, u * 3.4, u * 1.7, u * 0.2); c.fill();
    c.fillStyle = '#9a1c2c'; rrectOn(c, lx + u * 2.0, ly - u * 2.9, u * 1.4, u * 1.3, u * 0.15); c.fill();
    c.fillStyle = '#ffe9a8'; rrectOn(c, lx + u * 2.2, ly - u * 2.7, u * 1.0, u * 0.75, u * 0.1); c.fill();
    c.fillStyle = '#1b1d28'; c.fillRect(lx + u * 0.5, ly - u * 2.6, u * 0.5, u * 0.95);
    c.fillStyle = '#ffcc00'; c.fillRect(lx, ly - u * 0.45, u * 3.4, u * 0.12);
    // headlight beam
    const hl = c.createLinearGradient(lx, 0, lx - u * 5, 0); hl.addColorStop(0, 'rgba(255,240,180,0.45)'); hl.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = hl; c.beginPath(); c.moveTo(lx, ly - u * 1.2); c.lineTo(lx - u * 5, ly - u * 2.2); c.lineTo(lx - u * 5, ly - u * 0.1); c.closePath(); c.fill();
    c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(lx + u * 0.08, ly - u * 1.15, u * 0.2, 0, TAU); c.fill();
    // the driver in the cab window
    const keep = ctx; ctx = c;
    try { c.save(); c.beginPath(); c.rect(lx + u * 2.2, ly - u * 2.7, u * 1.0, u * 0.75); c.clip(); drawMascot(c, lx + u * 2.7, ly - u * 2.05, u * 0.24, t, 0); c.restore(); } catch (e) { /* ignore */ }
    // wagon full of flag balls
    const wx = tx - u * 0.6, wy = ty - u * 0.55, ww = u * 5.2, wh = u * 2.3;
    const pops = t > 1.9;
    if (!pops) [[7, 0.22], [9, 0.5], [10, 0.78]].forEach(([lv, f]) => drawRoundBlob(lv, wx + ww * f, wy - wh + u * 0.15, u * 0.62, 1, Math.max(1, u * 0.04), true));
    ctx = keep;
    const wg = c.createLinearGradient(0, wy - wh, 0, wy); wg.addColorStop(0, '#4d82e8'); wg.addColorStop(1, '#1d438f');
    c.fillStyle = wg; rrectOn(c, wx, wy - wh, ww, wh, u * 0.18); c.fill();
    c.fillStyle = '#ffd84d'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(wx + u * 0.3 + i * (ww - u * 0.6) / 8, wy - wh + u * 0.22, u * 0.06, 0, TAU); c.fill(); }
    c.fillStyle = '#ffcc00'; c.fillRect(wx, wy - u * 0.5, ww, u * 0.08);
    c.font = `800 ${u * 0.36}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffe27a';
    c.fillText('PIISPAN EXPRESS', wx + ww / 2, wy - wh * 0.45);
    // coupling
    c.fillStyle = '#26304d'; c.fillRect(lx + u * 3.4, ly - u * 0.5, wx - lx - u * 3.4, u * 0.14);
    c.restore();
    for (const x of [lx + u * 0.7, lx + u * 2.6, wx + u * 0.9, wx + u * 2.0, wx + ww - u * 2.0, wx + ww - u * 0.9]) wheel(x, ty - u * 0.38, u * 0.36, -dist * 2.2);
    // flag balls burst out of the wagon
    if (pops) {
      const keep2 = ctx; ctx = c;
      for (const b of balls) {
        const s2 = t - 1.9 - b.d; if (s2 < 0) continue;
        const vx = Math.cos(b.a) * u * 9 * b.sp, vy = Math.sin(b.a) * u * 13 * b.sp, x = wx + ww / 2 + vx * s2, y = wy - wh + vy * s2 + u * 9 * s2 * s2;
        drawRoundBlob(b.lv, x, y, u * (0.4 + b.lv * 0.025), 1, Math.max(1, u * 0.04), true);
      }
      ctx = keep2;
    }
    // title letters drop in one by one
    const word = 'PiispanPELI', fs = Math.min(W * 0.13, 88);
    c.font = `400 ${fs}px "Lilita One", ${FONT}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const widths = [...word].map(ch => c.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
    let x = W / 2 - total / 2;
    [...word].forEach((ch, i) => {
      const p = back((t - 0.9 - i * 0.07) / 0.5), y = H * 0.33 - (1 - p) * H * 0.5;
      if (t > 0.9 + i * 0.07) {
        c.save(); c.translate(x + widths[i] / 2, y + (i % 2 ? 3 : -2)); c.rotate((i % 2 ? 4 : -3) * Math.PI / 180);
        c.lineJoin = 'round'; c.lineWidth = fs * 0.12; c.strokeStyle = '#050c26'; c.strokeText(ch, -widths[i] / 2, 0);
        c.fillStyle = TITLE_COLORS[i]; c.fillText(ch, -widths[i] / 2, 0); c.restore();
      }
      x += widths[i];
    });
    // tagline
    const ta = ease((t - 1.8) / 0.5);
    if (ta > 0) { c.globalAlpha = ta; c.font = `700 ${Math.min(W * 0.045, 22)}px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#dce6ff'; c.fillText(T('Euroopan junapeli'), W / 2, H * 0.33 + fs * 0.55); c.globalAlpha = 1; }
    if (t > 3.3) finish();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
function rrectOn(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
