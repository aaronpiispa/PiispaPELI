// Fixes from the code review: keyboard in menus, one finger at a time, the admin state, stage pictures after the
// web font arrives, the daily challenge past 15:00, scenery speed on fast screens, and safe offline updates.
// Needs Playwright:  npm install  &&  npx playwright install chromium
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, launchBrowser } = require('../helpers/browser');

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
const blur = page => page.evaluate(() => document.activeElement && document.activeElement.blur());

test('keyboard: Space and Enter start the game only from the main menu, Escape goes back', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 1280, height: 720 } });
  // the rules screen: Space does nothing, Escape returns to the main menu
  await page.click('#rulesBtn'); await blur(page);
  await page.keyboard.press('Space'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => state), 'menu', 'Space/Enter in the rules did not start a game');
  await page.keyboard.press('Escape');
  assert.ok(await page.$eval('#card', c => c.classList.contains('menu')), 'Escape went back to the main menu');
  // a focused button: Enter presses that button only
  await page.focus('#achBtn'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => state), 'menu', 'Enter on the achievements button did not start a game');
  assert.ok(await page.$eval('#card', c => !c.classList.contains('menu') && !!c.querySelector('.ach')), 'the achievements opened');
  // from the main menu itself Space still starts (nothing focused)
  await page.keyboard.press('Escape'); await blur(page);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => state), 'play');
  // pause, open the save slots: Space does not jump back into the game, Escape returns to the pause menu
  await page.keyboard.press('KeyP');
  await page.click('#saveBtn'); await blur(page);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => state), 'paused', 'still paused on the save screen');
  await page.keyboard.press('Escape');
  assert.ok(await page.$('#resumeBtn'), 'back on the pause menu');
  await blur(page); await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => state), 'play', 'Space on the pause menu resumes');
  // a keyboard player gets the focus inside a newly opened screen
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'resumeBtn');
  assert.deepEqual(errors, []);
});

test('touch: a second finger neither moves the aim nor shoots', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 430, height: 860 }, touch: true });
  await page.click('#startBtn');
  await page.waitForFunction(() => cooldown <= 0);
  const r = await page.evaluate(() => {
    const ev = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const x0 = innerWidth * 0.3, y0 = innerHeight * 0.6;
    ev('pointerdown', 1, x0, y0);
    const a1 = aimAng;
    ev('pointerdown', 2, innerWidth * 0.8, y0); ev('pointermove', 2, innerWidth * 0.9, y0 - 50);
    const a2 = aimAng;
    ev('pointerup', 2, innerWidth * 0.9, y0 - 50);
    const shotsAfterSecond = shots, stillAiming = aiming;
    ev('pointerup', 1, x0, y0);
    return { same: a1 === a2, shotsAfterSecond, stillAiming, shotsAfterFirst: shots };
  });
  assert.ok(r.same, 'the second finger did not move the aim');
  assert.equal(r.shotsAfterSecond, 0, 'lifting the second finger did not shoot');
  assert.ok(r.stillAiming, 'the first finger still aims');
  assert.equal(r.shotsAfterFirst, 1, 'lifting the first finger shoots');
  assert.deepEqual(errors, []);
});

test('admin: closing the panel ends admin mode; the ADMIN mark shows only while a cheat is in use', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 1280, height: 720 } });
  await page.click('#startBtn');
  await page.evaluate(() => openAdmin());
  await page.click('#admClose');
  assert.equal(await page.evaluate(() => adminOn), false);
  const mark = () => page.evaluate(() => { let seen = false; const of = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (s, ...a) { if (String(s).startsWith('ADMIN')) seen = true; return of.call(this, s, ...a); };
    render(); CanvasRenderingContext2D.prototype.fillText = of; return seen; });
  assert.equal(await mark(), false, 'no mark after only looking at the panel');
  await page.evaluate(() => openAdmin()); await page.click('#admGod'); await page.click('#admClose');
  assert.equal(await mark(), true, 'mark while immortal');
  // the pause menu follows a language change again
  await page.evaluate(() => { invincible = false; pause(); });
  await page.selectOption('#langSel', 'en');
  assert.match(await page.$eval('#resumeBtn', b => b.textContent), /Resume|Continue/);
  assert.deepEqual(errors, []);
});

test('stage pictures are drawn again when the web font arrives', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 800, height: 600 } });
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'), keep = ctx; ctx = cv.getContext('2d');
    try {
      const art = Object.keys(STAGE_ART)[0];
      drawStageArt(art, 3, 20);
      const k = [...artCache.keys()].pop(), first = artCache.get(k);
      drawStageArt(art, 3, 20); const reused = artCache.get(k) === first;
      fontGen++; drawStageArt(art, 3, 20);
      return { reused, redrawn: artCache.get(k) !== first };
    } finally { ctx = keep; }
  });
  assert.ok(r.reused, 'the same picture is reused while the font stays the same');
  assert.ok(r.redrawn, 'after the font arrived the picture was drawn anew');
  assert.deepEqual(errors, []);
});

test('the daily challenge counts for the day it began, even when it ends after 15:00', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 800, height: 600 } });
  const r = await page.evaluate(() => {
    const realToday = todayKey;
    todayKey = () => 202611105; startGame('daily');
    todayKey = () => 202611115;   // the clock passed 15:00 during the game
    shots = 42; gameOver('win');
    todayKey = realToday;
    return { started: localStorage.getItem('piispanpeli-daily-202611105'), next: localStorage.getItem('piispanpeli-daily-202611115') };
  });
  assert.equal(r.started, '42'); assert.equal(r.next, null);
  assert.deepEqual(errors, []);
});

test('falling snow moves just as fast on a 120 Hz screen as on a 60 Hz one', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 800, height: 600 } });
  const r = await page.evaluate(() => {
    location.hash = 'scene=3';   // Austria: snow
    const run = hz => {
      sceneIdx = 3; sceneFade = 1; sceneParticles(3);
      sceneParts.forEach((q, i) => { q.x = 100 + i; q.y = 10; q.v = 0.5; q.p = 0; q.s = 0.5; });
      const t0 = time; sceneT = t0;
      for (let f = 1; f <= hz; f++) { time = t0 + f / hz; drawScenery(); }   // one second of frames
      return sceneParts[0].y;
    };
    const y60 = run(60), y120 = run(120);
    return { y60, y120 };
  });
  assert.ok(r.y60 > 30, 'the snow fell');
  assert.ok(Math.abs(r.y60 - r.y120) < 1, `same distance in one second: ${r.y60.toFixed(1)} and ${r.y120.toFixed(1)}`);
  assert.deepEqual(errors, []);
});

test('offline updates: a half-written new version is never used, and unchanged files are not written again', { skip }, async t => {
  overrides.clear();
  const { page, errors } = await open(t, { sw: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForSelector('#startBtn');
  // mark the stored stylesheet; the background check 3 s after this launch finds nothing new and must leave it be
  await page.evaluate(async () => {
    const c = await caches.open((await caches.keys()).find(k => /^piispanpeli-v/.test(k)));
    const r = await c.match('./css/style.css');
    await c.put('./css/style.css', new Response(await r.text(), { headers: { 'Content-Type': 'text/css', 'X-Test-Mark': '1' } }));
  });
  await page.waitForTimeout(4500);
  const kept = await page.evaluate(async () => {
    const keys = (await caches.keys()).filter(k => /^piispanpeli-v/.test(k)), c = await caches.open(keys[0]);
    return { n: keys.length, mark: (await c.match('./css/style.css')).headers.get('X-Test-Mark') };
  });
  assert.equal(kept.n, 1, 'still one set of files');
  assert.equal(kept.mark, '1', 'unchanged files were not written again');
  // a newer set that never got its "complete" mark (the browser closed half-way) must be ignored
  await page.evaluate(async () => {
    const name = (await caches.keys()).find(k => /^piispanpeli-v/.test(k)) + '-u' + (Date.now() + 1e6);
    const c = await caches.open(name);
    await c.put('./css/style.css', new Response('body{background:#f00 !important}', { headers: { 'Content-Type': 'text/css' } }));
  });
  await page.reload(); await page.waitForSelector('#startBtn');
  const css = await page.evaluate(() => fetch('css/style.css').then(r => r.text()));
  assert.ok(!css.includes('#f00'), 'the incomplete set was not used');
  assert.deepEqual(errors.filter(e => !/Failed to load resource/.test(e)), []);
});

test('balls that merge behind the pause menu still give their points', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 800, height: 600 } });
  await page.click('#startBtn');
  await page.evaluate(() => {
    pause();
    clearAll();
    // two of the same country falling onto each other while the game is paused
    makeBlob(3, 5, 14, 0, 0, 1); makeBlob(3, 5, 9, 0, 6, 1);
  });
  await page.waitForFunction(() => E.blobs.some(b => b.level === 4), null, { timeout: 10000 });
  const r = await page.evaluate(() => ({ state, score, maxLevel }));
  assert.equal(r.state, 'paused');
  assert.ok(r.score > 0, 'the merge gave points');
  assert.equal(r.maxLevel, 4, 'the new country counts as reached');
  assert.deepEqual(errors, []);
});
