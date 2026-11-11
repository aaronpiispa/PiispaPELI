// Browser tests for the drawing caches, fonts, adaptive quality, the effects layer and offline support.
// Needs Playwright:  npm install  &&  npx playwright install chromium
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, frames, launchBrowser, BROWSER } = require('../helpers/browser');

const skip = !playwright && 'Playwright is not installed (npm install)';
const overrides = new Map();
let browser, server, base;
test.before(async () => {
  if (skip) return;
  server = await serve(overrides);
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await launchBrowser();
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });
const open = (t, opts) => openPage(browser, base, t, opts);

const ALL_ACH = Object.fromEntries(['first', 'fin', 'nordic', 'fra', 'rus', 'union', 'all', 'combo5', 'combo10', 'star', 'heart', 'close', 'map3', 's10k', 'shake'].map(k => [k, 1]));
const DAY = 864e5;

// Draws one wagon part straight onto a canvas and through the cache, and measures how much they differ in
// what actually reaches the screen (colour times coverage). Gradients are dithered by the browser depending
// on where they sit, and small and large canvases smooth edges slightly differently, so a step of a few
// out of 255 on single edge pixels is expected. A missing or shifted piece would show up as large differences.
const COMPARE_LAYERS = () => {
  const visibleDiff = (a, b) => {
    let max = 0, missing = 0, where = '', sum = 0, n = 0;
    for (let i = 0; i < a.length; i += 4) {
      let d = Math.abs(a[i + 3] - b[i + 3]);
      for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a[i + k] * a[i + 3] - b[i + k] * b[i + 3]) / 255);
      if (a[i + 3] || b[i + 3]) { sum += d; n++; }
      if (d > max) { max = d; where = `x=${(i / 4) % canvas.width} y=${Math.floor(i / 4 / canvas.width)} direct=${a.slice(i, i + 4).join()} cached=${b.slice(i, i + 4).join()}`; }
      if (a[i + 3] > 8 && !b[i + 3]) missing++;
    }
    return { max, missing, where, mean: sum / Math.max(1, n) };
  };
  const pixels = draw => {
    const cv = document.createElement('canvas'); cv.width = canvas.width; cv.height = canvas.height;
    const keep = ctx; ctx = cv.getContext('2d');
    try { draw(); } finally { ctx = keep; }
    return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  };
  const direct = f => () => { ctx.setTransform(dpr * SC, 0, 0, dpr * SC, dpr * OX, dpr * OY); f(); };
  const out = {};
  let n = 0;
  for (const [name, f, areas] of [['back', jarBack, undefined], ['front', jarFront, FRONT_AREAS], ['shelf', drawTrophyWall, SHELF_AREAS]]) {
    const a = pixels(direct(f)), b = pixels(() => cachedLayer('test-' + name + (n++), 'k' + Math.random(), f, 0, 0, areas));
    let ink = 0;
    for (let i = 3; i < a.length; i += 4) if (a[i]) ink++;
    out[name] = { ink, ...visibleDiff(a, b) };
  }
  return out;
};

for (const [label, opts] of [
  ['phone', { viewport: { width: 430, height: 860 }, dsf: 1 }],
  ['phone 3x', { viewport: { width: 393, height: 852 }, dsf: 3 }],
  ['small phone 2x', { viewport: { width: 320, height: 568 }, dsf: 2 }],
  ['landscape', { viewport: { width: 1280, height: 720 }, dsf: 1 }],
  ['tablet 2x', { viewport: { width: 1180, height: 820 }, dsf: 2 }]
]) {
  test(`cached wagon pieces match direct drawing (${label}, every theme)`, { skip }, async t => {
    const { page, errors } = await open(t, { ...opts, store: { 'piispanpeli-ach': ALL_ACH } });
    for (const th of ['eu', 'viking', 'heart', 'uni']) {
      for (const gold of [true, false]) {
        const r = await page.evaluate(([th, gold, cmp]) => {
          themeId = th;
          if (!gold) delete achGot.all; else achGot.all = 1;
          // one trophy in flight leaves a shadow on the shelf
          TOBJ.star = { x: 3, y: 10, vx: 0, vy: 0, a: 0, va: 0, st: 'held', t: 0, rest: 0, tx: 3, ty: 10, hx: 3, hy: 10 };
          const res = (0, eval)('(' + cmp + ')')();
          delete TOBJ.star;
          return res;
        }, [th, gold, COMPARE_LAYERS.toString()]);
        // Chromium drawing in software is held to the strict limits it was tuned and checked against by eye. Firefox,
        // Safari's engine and Chromium on a graphics chip smooth edges (like the gold trim's hard colour step)
        // a little differently on small canvases than on the big screen canvas. Chromium in software also smooths the
        // tiny text on the trophies (like "10K", about 4 pixels tall) slightly differently on a small canvas: up to
        // about 30/255 on a few edge pixels of a glyph, depending on where the trophy sits on the shelf
        const strict = BROWSER === 'chromium' && process.env.GPU !== '1', lim = strict ? { missing: 0, mean: 1.5, max: 32 } : { missing: ink => ink * 0.02, mean: 3, max: 96 };
        for (const [name, { ink, max, missing, where, mean }] of Object.entries(r)) {
          assert.ok(ink > 1000, `${th}/${gold}: the ${name} layer draws something (${ink} px)`);
          assert.ok(missing <= (strict ? 0 : lim.missing(ink)), `${th}/gold=${gold}: ${name} layer lost ${missing} pixels`);
          assert.ok(mean < lim.mean, `${th}/gold=${gold}: ${name} layer differs on average by ${mean.toFixed(2)}/255`);
          assert.ok(max <= lim.max, `${th}/gold=${gold}: ${name} layer differs from direct drawing by up to ${max.toFixed(1)}/255 at ${where}`);
        }
      }
    }
    assert.deepEqual(errors, []);
  });
}

test('the country chain bitmap matches direct drawing, at any HUD size', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 1920, height: 1080 }, dsf: 1.5 });
  const r = await page.evaluate(() => {
    const res = [];
    for (const u of [1, 1.37, 2.4]) for (const vertical of [false, true]) for (const [x0, y0] of [[700.3, 200.7], [912, 90.25]]) {
      const room = vertical ? 600 : 700;
      const pixels = draw => {
        const cv = document.createElement('canvas'); cv.width = canvas.width; cv.height = canvas.height;
        const keep = ctx; ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        try { draw(); } finally { ctx = keep; }
        return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      };
      chainCache.key = '';
      const a = pixels(() => drawChainRaw(x0, y0, vertical, room, u)), b = pixels(() => drawChain(x0, y0, vertical, room, u));
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) {
        for (let k = 0; k < 3; k++) diff = Math.max(diff, Math.abs(a[i + k] * a[i + 3] - b[i + k] * b[i + 3]) / 255);
        diff = Math.max(diff, Math.abs(a[i + 3] - b[i + 3]));
      }
      res.push({ u, vertical, x0, diff });
    }
    return res;
  });
  // on a graphics chip the big canvas and the small bitmap smooth edges slightly differently
  // a single anti-aliased edge pixel can differ by a few steps depending on the sub-pixel position
  const lim = BROWSER === 'chromium' && process.env.GPU !== '1' ? 8 : 48;
  for (const x of r) assert.ok(x.diff <= lim, `chain at u=${x.u} vertical=${x.vertical} x=${x.x0} differs by up to ${x.diff.toFixed(1)}/255`);
  assert.deepEqual(errors, []);
});

// a real font file stands in for the game's web font, delivered three seconds late like on a slow network
const FONT_FILE = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf', '/Library/Fonts/Arial Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf']
  .find(f => require('fs').existsSync(f));
test('text in cached bitmaps is redrawn once the web font arrives', { skip: skip || (!FONT_FILE && 'no font file found to serve') }, async t => {
  const fontCss = "@font-face{font-family:'Baloo 2';font-weight:500 800;src:url(https://fonts.gstatic.com/test/baloo.ttf) format('truetype')}";
  const ctx = await browser.newContext({ viewport: { width: 430, height: 860 }, serviceWorkers: 'block' });
  t.after(() => ctx.close());
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', headers: { 'Access-Control-Allow-Origin': '*' }, body: fontCss }));
  await ctx.route(/fonts\.gstatic\.com/, async r => {
    await new Promise(ok => setTimeout(ok, 3000));
    r.fulfill({ status: 200, contentType: 'font/ttf', headers: { 'Access-Control-Allow-Origin': '*' }, body: require('fs').readFileSync(FONT_FILE) });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('piispanpeli-lang', '"fi"'); });
  // do not wait for the page's load event: a pending font would hold it back
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#startBtn');
  await page.click('#startBtn');
  await frames(page, 3);
  const before = await page.evaluate(() => ({ front: jarLayers.front.key, back: jarLayers.back.key, chain: chainCache.key, gen: fontGen, ready: document.fonts.check(`800 20px ${FONT}`) }));
  await page.waitForFunction(() => document.fonts.check(`800 20px ${FONT}`) && fontGen > 0, null, { timeout: 10000 });
  await frames(page, 3);
  const after = await page.evaluate(() => ({ front: jarLayers.front.key, back: jarLayers.back.key, chain: chainCache.key, gen: fontGen }));
  assert.equal(before.ready, false, 'the font was still loading when the game first drew');
  assert.ok(after.gen > before.gen, 'the finished font load is noticed');
  for (const k of ['front', 'back', 'chain']) assert.notEqual(after[k], before[k], `${k} bitmap redrawn with the font`);
  assert.deepEqual(errors, []);
});

test('static wagon bitmaps are not redrawn during normal play, nor while a new trophy pops', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.click('#startBtn');
  await frames(page, 5);
  await page.evaluate(() => { window.__layers = [jarLayers.back.parts[0].cv, ...jarLayers.front.parts.map(p => p.cv)]; window.__key = jarLayers.front.key + '#' + jarLayers.back.key; });
  await page.evaluate(() => unlock('combo10'));
  const shelfKeyDuringPop = await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok(jarLayers.shelf && jarLayers.shelf.key)))));
  await frames(page, 40);
  const same = await page.evaluate(() => jarLayers.front.key + '#' + jarLayers.back.key === window.__key &&
    [jarLayers.back.parts[0].cv, ...jarLayers.front.parts.map(p => p.cv)].every((c, i) => c === window.__layers[i]));
  assert.ok(same, 'front and back bitmaps untouched');
  await page.waitForTimeout(1500);
  const shelfAfter = await page.evaluate(() => jarLayers.shelf.key);
  assert.notEqual(shelfAfter, shelfKeyDuringPop, 'the shelf is cached again with the new trophy once the pop is over');
  assert.match(shelfAfter, /\|1/, 'new trophy is part of the cached shelf');
  assert.deepEqual(errors, []);
});

// ------------------------------ adaptive quality ------------------------------
const canvasScale = page => page.evaluate(() => document.getElementById('game').width / innerWidth);

test('a saved low quality level is used as is when it was set recently', { skip }, async t => {
  const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': { q: 3, at: Date.now() } } });
  assert.equal(await canvasScale(page), 1);
});

test('a low quality level is retried one step better after a few days', { skip }, async t => {
  const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': { q: 2, at: Date.now() - 4 * DAY } } });
  assert.equal(await canvasScale(page), 1.5);
});

test('a quality level saved by the previous version (a bare number) is retried one step better', { skip }, async t => {
  const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': 3 } });
  assert.equal(await canvasScale(page), 1.2);
});

test('broken saved quality values fall back to full quality', { skip }, async t => {
  for (const bad of ['fast', 9, -1, 1.5, { q: 'x' }, null]) {
    const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': bad } });
    assert.equal(await canvasScale(page), 2, `value ${JSON.stringify(bad)}`);
  }
});

test('slow play lowers the resolution and remembers when, but rebuild frames and hidden tabs do not count', { skip }, async t => {
  const { page } = await open(t, { dsf: 2 });
  await page.click('#startBtn');
  const r = await page.evaluate(() => {
    const feed = (ms, n, heavy) => { for (let i = 0; i < n; i++) { if (heavy) heavyFrame = true; watchFrameTime(ms); } };
    feed(40, 200, true);
    const afterHeavy = quality;
    feed(40, 200, false);
    const saved = JSON.parse(localStorage.getItem('piispanpeli-quality'));
    return { afterHeavy, quality, saved, w: document.getElementById('game').width / innerWidth };
  });
  assert.equal(r.afterHeavy, 0, 'frames that rebuilt a bitmap never lower the quality');
  assert.ok(r.quality >= 1, 'slow frames lower the quality');
  assert.equal(r.saved.q, r.quality);
  assert.ok(Math.abs(r.saved.at - Date.now()) < 60000, 'time of the change is saved');
  assert.equal(r.w, [2, 1.5, 1.2, 1][r.quality], 'canvas resolution follows');
});

test('smooth play on a retried level keeps it for the next launch', { skip }, async t => {
  const at = Date.now() - 5 * DAY;
  const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': { q: 2, at } } });
  await page.click('#startBtn');
  const saved = await page.evaluate(() => { for (let i = 0; i < 2400; i++) watchFrameTime(16); return JSON.parse(localStorage.getItem('piispanpeli-quality')); });
  assert.deepEqual(saved, { q: 1, at }, 'the better level is kept, still marked with the old time so it can climb again');
});

// ------------------------------ effects layer, toast ------------------------------
test('the effects layer is hidden while empty and shown for the hearts', { skip }, async t => {
  const { page, errors } = await open(t);
  await frames(page, 3);
  assert.equal(await page.evaluate(() => document.getElementById('fx').hidden), true, 'hidden at start');
  await page.keyboard.type('nelli');
  await frames(page, 3);
  assert.equal(await page.evaluate(() => document.getElementById('fx').hidden), false, 'visible with hearts');
  await page.evaluate(() => { nelliT = 0; hearts.length = 0; });
  await frames(page, 3);
  assert.equal(await page.evaluate(() => document.getElementById('fx').hidden), true, 'hidden again when done');
  assert.deepEqual(errors, []);
});

test('the hidden achievement popup does not peek in at the top of the screen', { skip }, async t => {
  for (const viewport of [{ width: 430, height: 860 }, { width: 1920, height: 1080 }]) {
    const { page } = await open(t, { viewport });
    const bottom = await page.evaluate(() => document.getElementById('toast').getBoundingClientRect().bottom);
    // the popup's shadow reaches 40 px below its box
    assert.ok(bottom + 40 <= 0, `popup box ends at ${bottom}px`);
  }
});

// ------------------------------ offline ------------------------------
test('offline: the game opens without a network, and a new version arrives complete on a later launch', { skip }, async t => {
  overrides.clear();
  const { ctx, page, errors } = await open(t, { sw: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForSelector('#startBtn');
  assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'page is controlled by the service worker');
  // offline launch
  overrides.set('down', true);
  await page.reload(); await page.waitForSelector('#startBtn');
  assert.match(await page.evaluate(() => document.getElementById('startBtn').innerText), /Pelaa/);
  await page.waitForTimeout(3500); // the background update check fails quietly while the network is down
  overrides.delete('down');
  // a new version goes live: the next launch still opens the cached game, then stores the new files in the background
  const css = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'css', 'style.css'), 'utf8');
  overrides.set('/css/style.css', css + '\n/* new-version-marker */\n');
  await page.waitForTimeout(16000); // update checks run at most every 15 seconds
  await page.reload(); await page.waitForSelector('#startBtn');
  const cached = await page.evaluate(() => new Promise(ok => {
    const t0 = Date.now();
    const poll = async () => {
      const keys = await caches.keys(), c = await caches.open(keys.find(k => /piispanpeli-v/.test(k)));
      const r = await c.match('css/style.css'), txt = r ? await r.text() : '';
      if (txt.includes('new-version-marker') || Date.now() - t0 > 10000) ok(txt.includes('new-version-marker')); else setTimeout(poll, 250);
    };
    poll();
  }));
  overrides.clear();
  assert.ok(cached, 'new version stored for the next launch');
  assert.deepEqual(errors.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|Failed to preconnect/.test(e)), []);
});
