// The game fits any screen: phones (upright and sideways), foldables, tablets, laptops, big monitors and odd
// window sizes. Checks that menus, the wagon, buttons and HUD texts stay on screen and never cover each other.
// Needs Playwright:  npm install  &&  npx playwright install chromium
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, frames } = require('../helpers/browser');

const skip = !playwright && 'Playwright is not installed (npm install)';
let browser, server, base;
test.before(async () => {
  if (skip) return;
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await playwright.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });

// [name, width, height, pixel ratio, touch]
const SCREENS = [
  ['small phone', 320, 568, 2, true], ['phone', 375, 667, 2, true], ['tall phone', 393, 852, 3, true], ['android', 412, 915, 2.625, true],
  ['folded phone', 280, 653, 3, true], ['phone sideways', 852, 393, 3, true], ['small phone sideways', 667, 375, 2, true],
  ['tablet', 744, 1133, 2, true], ['tablet sideways', 1180, 820, 2, true], ['laptop', 1366, 768, 1, false], ['desktop', 1920, 1080, 1, false],
  ['ultrawide', 2560, 1080, 1, false], ['4k monitor', 3840, 2160, 1, false], ['small window', 500, 400, 1, false], ['tall window', 600, 1300, 1, false]
];
const overlap = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const inside = (r, w, h) => r[0] >= -0.5 && r[1] >= -0.5 && r[2] <= w + 0.5 && r[3] <= h + 0.5;

// boxes of everything on the play screen, in CSS pixels
const MEASURE = () => {
  const rect = el => { const b = el.getBoundingClientRect(); return b.width ? [b.left, b.top, b.right, b.bottom] : null; };
  const textW = (t, font, spacing) => { ctx.save(); ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = spacing || '0px'; const w = ctx.measureText(t).width; ctx.restore(); return w; };
  const u = ui, fl = OX + VX0 * SC, fr = OX + VX1 * SC, ft = OY + VY0 * SC, fb = OY + VY1 * SC, fc = OX + LX * SC;
  const label = (t, x, y, align) => { const w = textW(t, `700 12px ${FONT}`, '1.6px') * u; const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; return [x0, y - 12 * u, x0 + w, y + 2 * u]; };
  const small = (t, x, y, align) => { const w = textW(t, `600 14px ${FONT}`) * u; const x0 = align === 'left' ? x : x - w; return [x0, y - 13 * u, x0 + w, y + 3 * u]; };
  const out = { mode, ui, SC, dpr, fl, fr, ft, fb, vw: innerWidth, vh: innerHeight, canvas: [canvas.width, canvas.height] };
  out.pause = rect(pauseBtn); out.sound = rect(soundBtn); out.abil = rect(abilBtn);
  out.texts = {};
  if (mode === 'top') {
    const [hl] = hudEdges();
    out.texts.score = label(T('PISTEET'), hl + 6 * u, ft - 64 * u, 'left');
    out.texts.next = label(T('SEURAAVA'), fc, ft - 64 * u, 'center');
  } else {
    out.texts.score = label(T('PISTEET'), fl - 30 * u, ft + 30 * u, 'right');
    out.texts.info = small(T('Ennätys {0}', 0), fl - 30 * u, ft + 106 * u, 'right');
    out.texts.next = label(T('SEURAAVA'), fl - 30 * u, ft + 160 * u, 'right');
    const pr = (12 + 6 * 3.2) * u; // the biggest ball that can come next
    out.texts.nextBall = [fl - 30 * u - 2 * pr, ft + 176 * u, fl - 30 * u, ft + 176 * u + 2 * pr];
  }
  out.mascot = window.__mascot ? (([cx, cy, s]) => [cx - MASCOT_HALF_W * s, cy - MASCOT_UP * s, cx + MASCOT_HALF_W * s, cy + MASCOT_DOWN * s])(window.__mascot) : null;
  return out;
};

for (const [name, w, h, dsf, touch] of SCREENS) {
  test(`fits the screen: ${name} ${w}x${h}`, { skip }, async t => {
    const { page, errors } = await openPage(browser, base, t, {
      viewport: { width: w, height: h }, dsf, touch
    });
    // ---- main menu ----
    const menu = await page.evaluate(() => {
      const r = el => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
      const de = document.documentElement;
      return { card: r(document.getElementById('card')), start: r(document.getElementById('startBtn')), scrolls: de.scrollWidth > innerWidth || de.scrollHeight > innerHeight };
    });
    assert.equal(menu.scrolls, false, 'the page itself never scrolls');
    assert.ok(inside(menu.card, w, h), `menu card on screen ${menu.card.map(Math.round)}`);
    assert.ok(inside(menu.start, w, h), `play button visible without scrolling ${menu.start.map(Math.round)}`);
    if (w >= 1600 && h >= 1000) assert.ok(menu.card[2] - menu.card[0] > 420, 'menus grow on big screens');
    // every menu page fits the card without sideways scrolling, and the card stays on screen
    for (const btn of [null, '#modesBtn', '#achBtn', '#wardBtn', '#themeBtn', '#rulesBtn']) {
      if (btn) await page.click(btn);
      const r = await page.evaluate(() => {
        const c = document.getElementById('card'), b = c.getBoundingClientRect();
        return { box: [b.left, b.top, b.right, b.bottom], wide: c.scrollWidth > c.clientWidth + 1 };
      });
      assert.equal(r.wide, false, `${btn || 'main menu'}: nothing sticks out sideways`);
      assert.ok(inside(r.box, w, h), `${btn || 'main menu'}: card on screen ${r.box.map(Math.round)}`);
      await page.evaluate(() => showMenu());
    }
    // ---- playing ----
    await page.click('#startBtn');
    await page.evaluate(() => { const real = drawMascot; window.drawMascot = function (c, cx, cy, s) { if (c === ctx) window.__mascot = [cx, cy, s]; return real.apply(this, arguments); }; });
    for (let i = 0; i < 4; i++) {
      if (touch) await page.touchscreen.tap(w / 2 + (i - 2) * 7, h * 0.62); else await page.mouse.click(w / 2 + (i - 2) * 7, h * 0.62);
      await page.waitForTimeout(350);
    }
    await frames(page, 3);
    const m = await page.evaluate(`(${MEASURE.toString()})()`);
    assert.equal(await page.evaluate(() => state), 'play');
    assert.ok(await page.evaluate(() => E.blobs.length) > 0, 'shots land in the wagon');
    // canvas resolution follows the screen (capped at 2x)
    assert.deepEqual(m.canvas, [Math.round(w * Math.min(2, dsf)), Math.round(h * Math.min(2, dsf))]);
    // the wagon is fully on screen
    assert.ok(inside([m.fl, m.ft, m.fr, m.fb], w, h), `wagon on screen ${[m.fl, m.ft, m.fr, m.fb].map(Math.round)}`);
    // HUD size: unchanged on phones and laptops, bigger on big screens
    if (Math.max(w, h) <= 1400) assert.ok(m.ui < 1.25, `HUD size ${m.ui} on ${name}`);
    if (w >= 1900 && h >= 1000) assert.ok(m.ui > 1.2, `bigger HUD on ${name} (${m.ui})`);
    // buttons on screen and apart from each other and from the HUD texts
    for (const b of ['pause', 'sound', 'abil']) if (m[b]) assert.ok(inside(m[b], w, h), `${b} button on screen ${m[b].map(Math.round)}`);
    assert.ok(!overlap(m.pause, m.sound), 'pause and sound buttons apart');
    for (const [k, box] of Object.entries(m.texts)) {
      assert.ok(inside(box, w, h), `${k} text on screen ${box.map(Math.round)}`);
      for (const b of ['pause', 'sound', 'abil']) assert.ok(!overlap(box, m[b]), `${k} text not under the ${b} button`);
    }
    assert.ok(!overlap(m.texts.score, m.texts.next), 'score and next-ball labels apart');
    // the side HUD mascot never covers the HUD and stays on screen
    if (m.mode === 'side' && m.mascot) {
      assert.ok(inside(m.mascot, w, h), `mascot on screen ${m.mascot.map(Math.round)}`);
      for (const [k, box] of Object.entries(m.texts)) assert.ok(!overlap(m.mascot, box), `mascot clear of the ${k} text`);
      assert.ok(!overlap(m.mascot, m.abil), 'mascot clear of the swing button');
    }
    assert.deepEqual(errors, []);
  });
}

test('turning a phone sideways and back re-lays out the game', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { viewport: { width: 393, height: 852 }, dsf: 3, touch: true });
  await page.click('#startBtn');
  for (const [w, h, want] of [[852, 393, 'side'], [393, 852, 'top']]) {
    await page.setViewportSize({ width: w, height: h });
    await frames(page, 3);
    const r = await page.evaluate(() => ({ mode, cw: document.getElementById('game').width, fl: OX + VX0 * SC, fr: OX + VX1 * SC, ft: OY + VY0 * SC, fb: OY + VY1 * SC }));
    assert.equal(r.mode, want);
    assert.equal(r.cw, w * 2);
    assert.ok(inside([r.fl, r.ft, r.fr, r.fb], w, h), 'wagon on screen after turning');
  }
  assert.deepEqual(errors, []);
});

test('phones held sideways get a two-column menu with the play button in view', { skip }, async t => {
  const { page } = await openPage(browser, base, t, { viewport: { width: 852, height: 393 }, dsf: 3, touch: true });
  const r = await page.evaluate(() => {
    const b = el => el.getBoundingClientRect();
    return { l: b(document.querySelector('.menu-l')), r: b(document.querySelector('.menu-r')), start: b(document.getElementById('startBtn')) };
  });
  assert.ok(r.r.left >= r.l.right, 'buttons sit to the right of the title');
  assert.ok(r.start.bottom <= 393, 'play button visible');
});

test('upright phones keep the original one-column menu', { skip }, async t => {
  const { page } = await openPage(browser, base, t, { viewport: { width: 393, height: 852 }, dsf: 3, touch: true });
  const r = await page.evaluate(() => ({ display: getComputedStyle(document.querySelector('.menu-l')).display, card: document.getElementById('card').getBoundingClientRect().width }));
  assert.equal(r.display, 'contents');
  assert.equal(Math.round(r.card), 361, 'same width as before (380 px or the screen minus margins)');
});
