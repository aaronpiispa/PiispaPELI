// Robustness: a slow phone, a long session, upgrading from the previous offline version, reduced motion and
// the keyboard. Needs Playwright:  npm install  &&  npx playwright install chromium
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { playwright, serve, openPage, frames, launchBrowser, BROWSER, ROOT } = require('../helpers/browser');

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

// shoots by tapping/clicking just under the launcher, spread across the wagon
async function shootMany(page, n, gap) {
  const { w, h } = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  for (let i = 0; i < n; i++) { await page.mouse.click(w * (0.3 + ((i * 37) % 40) / 100), h * 0.65); await page.waitForTimeout(gap); }
}

test('a slow phone: the game lowers its resolution by itself and keeps running smoothly', { skip: skip || (BROWSER !== 'chromium' && 'CPU slow-down needs Chromium') }, async t => {
  const { ctx, page, errors } = await open(t, { dsf: 2 });
  const cdp = await ctx.newCDPSession(page);
  // slow the processor down until frames are clearly too slow (much more is needed when a graphics chip draws)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: process.env.GPU === '1' ? 40 : 8 });
  await page.click('#startBtn');
  await shootMany(page, 12, 300);
  await page.waitForFunction(() => quality > 0, null, { timeout: 30000 }).catch(() => {});
  const r = await page.evaluate(() => ({ quality, scale: document.getElementById('game').width / innerWidth, saved: JSON.parse(localStorage.getItem('piispanpeli-quality')), state }));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  assert.ok(r.quality > 0, 'resolution lowered on the slow phone');
  assert.equal(r.scale, [2, 1.5, 1.2, 1][r.quality]);
  assert.equal(r.saved.q, r.quality, 'remembered for next time');
  assert.equal(r.state, 'play', 'still playing');
  assert.deepEqual(errors, []);
});

test('a fast device keeps full resolution through a whole game', { skip }, async t => {
  const { page, errors } = await open(t, { dsf: 2 });
  await page.click('#startBtn');
  await shootMany(page, 15, 250);
  const r = await page.evaluate(() => ({ quality, scale: document.getElementById('game').width / innerWidth }));
  assert.equal(r.quality, 0);
  assert.equal(r.scale, 2);
  assert.deepEqual(errors, []);
});

test('a long session: several games in a row, no errors and nothing piling up', { skip }, async t => {
  const { page, errors } = await open(t);
  const count = () => page.evaluate(() => ({
    layers: Object.values(jarLayers).reduce((n, L) => n + L.parts.length, 0), parts: parts.length, floaters: floaters.length,
    scenes: Object.keys(sceneCache).length, blobs: E.blobs.length, heap: performance.memory ? performance.memory.usedJSHeapSize : 0
  }));
  const seen = [];
  for (let game = 0; game < 4; game++) {
    if (game === 0) await page.click('#startBtn');
    await shootMany(page, 25, 120);
    // speed time up: run many physics steps at once, like several minutes of play
    await page.evaluate(() => { for (let i = 0; i < 3000; i++) stepGame(); });
    await frames(page, 30);
    seen.push(await count());
    // end the game through the admin panel and start again
    await page.keyboard.type('admin123');
    await page.click('#admLose');
    await page.waitForFunction(() => state === 'over' && !document.getElementById('overlay').hidden, null, { timeout: 10000 });
    await page.evaluate(() => { adminOn = false; });
    await page.click('#againBtn');
    await frames(page, 5);
  }
  const last = seen[seen.length - 1], first = seen[0];
  assert.ok(last.layers <= 6, `cached wagon pieces stay few (${last.layers})`);
  assert.ok(last.scenes <= 2, `only the scenery on screen is kept in memory (${last.scenes})`);
  assert.ok(last.parts < 600 && last.floaters < 60, `effects are cleaned up (${last.parts} particles, ${last.floaters} texts)`);
  if (first.heap) assert.ok(last.heap < first.heap * 2 + 20e6, `memory does not keep growing (${(first.heap / 1e6).toFixed(1)} → ${(last.heap / 1e6).toFixed(1)} MB)`);
  assert.deepEqual(errors, []);
});

test('phones that still run the previous offline version switch to the new one cleanly', { skip }, async t => {
  overrides.clear();
  overrides.set('/sw.js', fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'sw-v52.js'), 'utf8'));
  const { page, errors } = await open(t, { sw: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForSelector('#startBtn');
  const before = await page.evaluate(() => caches.keys());
  assert.ok(before.includes('piispanpeli-v52'), 'old version installed first');
  // the new release goes live
  overrides.delete('/sw.js');
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  // the version being released, read from sw.js so the test keeps working when VERSION is bumped
  const current = 'piispanpeli-' + fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];
  // wait until the new version has activated (it removes the old cache as its last step)
  const done = await page.evaluate(cur => new Promise(ok => {
    const t0 = Date.now();
    const poll = async () => {
      const k = await caches.keys();
      if (k.includes(cur) && !k.includes('piispanpeli-v52')) ok(true); else if (Date.now() - t0 > 20000) ok(false); else setTimeout(poll, 250);
    };
    poll();
  }), current);
  assert.ok(done, 'the new version activated and removed the old cache');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const assets = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  const cached = await page.evaluate(async ([list, cur]) => { const c = await caches.open(cur); return Promise.all(list.map(u => c.match(u).then(Boolean))); }, [assets, current]);
  assert.deepEqual(assets.filter((a, i) => !cached[i]), [], 'every file of the new version is cached');
  await page.reload(); await page.waitForSelector('#startBtn');
  await page.click('#startBtn');
  await frames(page, 5);
  assert.equal(await page.evaluate(() => state), 'play', 'the game runs on the new version');
  assert.deepEqual(errors, []);
});

test('reduced motion: no intro, still animations off, the game plays normally', { skip }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 860 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  t.after(() => ctx.close());
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); localStorage.setItem('piispanpeli-lang', '"fi"'); });
  await page.goto(base);
  await page.waitForSelector('#startBtn');
  assert.equal(await page.evaluate(() => reduceMotion), true);
  assert.equal(await page.evaluate(() => !!document.getElementById('intro')), false, 'intro skipped');
  await page.click('#startBtn');
  await shootMany(page, 6, 400);
  assert.ok(await page.evaluate(() => E.blobs.length) > 0);
  assert.deepEqual(errors, []);
});

test('the whole game can be played with the keyboard', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.keyboard.press('Space'); // starts from the menu
  await page.waitForFunction(() => state === 'play', null, { timeout: 3000 }).catch(async () => { await page.click('#startBtn'); });
  for (let i = 0; i < 6; i++) {
    await page.keyboard.down(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await page.waitForTimeout(120); await page.keyboard.up(i % 2 ? 'ArrowLeft' : 'ArrowRight');
    await page.keyboard.press('Space'); await page.waitForTimeout(450);
  }
  assert.ok(await page.evaluate(() => E.blobs.length) >= 3, 'balls shot with the space bar');
  await page.keyboard.press('KeyP');
  assert.equal(await page.evaluate(() => state), 'paused', 'P pauses');
  await page.keyboard.press('KeyP');
  assert.equal(await page.evaluate(() => state), 'play', 'P resumes');
  assert.deepEqual(errors, []);
});
