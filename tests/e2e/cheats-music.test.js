// The admin panel (endless swings, no records from a cheated game), the EU ball and its scenery, and music that
// stays in time when the page has been busy or in the background. Needs Playwright:  npm install  &&  npx playwright install chromium
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, launchBrowser, BROWSER } = require('../helpers/browser');

const skip = !playwright && 'Playwright is not installed (npm install)';
let browser, server, base;
test.before(async () => {
  if (skip) return;
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await launchBrowser();
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });
const open = (t, opts) => openPage(browser, base, t, opts);
const toMenu = page => page.evaluate(() => { state = 'menu'; showMenu(); });

test('endless roulettes: the roulette spins again and again without charges', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 1280, height: 720 } });
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  await page.evaluate(() => openAdmin());
  await page.click('#admInf');
  assert.equal(await page.$eval('#admInf', b => b.getAttribute('aria-pressed')), 'true');
  await page.click('#admClose');
  assert.ok(await page.$eval('#abilBtn', b => !b.disabled && b.textContent.includes('∞')), 'the swing button shows ∞');
  for (let i = 0; i < 3; i++) {
    await page.click('#abilBtn', { force: true });   // the ready button pulses, so it is never "still"
    assert.ok(await page.evaluate(() => rouT > 0), `spin ${i + 1} happened`);
    await page.waitForFunction(() => !rouBusy(), null, { timeout: 8000 });
  }
  assert.equal(await page.evaluate(() => charges), 0, 'no charges were needed');
  // switched off: back to needing charges
  await page.evaluate(() => openAdmin());
  await page.click('#admInf'); await page.click('#admClose');
  assert.ok(await page.$eval('#abilBtn', b => b.disabled && !b.textContent.includes('∞')));
  assert.deepEqual(errors, []);
});

test('a game with cheats keeps no record, achievements or progress; an honest game does', { skip }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 1280, height: 720 }, store: { 'piispanpeli-best': 100 } });
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  await page.evaluate(() => openAdmin());
  await page.click('#admPts');
  assert.ok(await page.$eval('#card', c => c.textContent.includes('Huijaukset käytössä')), 'the admin panel says so');
  await page.click('#admClose');
  // the mark survives saving and loading
  await page.evaluate(() => autoSave());
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-autosave')).ch), 1);
  await page.evaluate(() => { cheated = false; loadGame(store.get(AUTO_KEY), true); });
  assert.equal(await page.evaluate(() => cheated), true);
  await page.evaluate(() => gameOver('over'));
  await page.waitForFunction(() => document.getElementById('againBtn'));
  const r = await page.evaluate(() => ({ best, saved: localStorage.getItem('piispanpeli-best'), ach: !!achGot.s10k, text: document.getElementById('card').textContent }));
  assert.equal(r.best, 100); assert.equal(r.saved, '100');
  assert.equal(r.ach, false, 'no 10 000 points achievement');
  assert.ok(r.text.includes('ennätystä ei tallennettu'));
  // immortality switched on in the menu makes the next game a cheated one too
  await toMenu(page);
  await page.evaluate(() => openAdmin()); await page.click('#admGod'); await page.click('#admClose');
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  assert.equal(await page.evaluate(() => cheated), true);
  await page.evaluate(() => { invincible = false; gameOver('forced'); });
  await page.waitForFunction(() => document.getElementById('againBtn'));
  // an honest game counts again
  await toMenu(page);
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  await page.evaluate(() => { addScore(500); gameOver('over'); });
  await page.waitForFunction(() => document.getElementById('againBtn'));
  assert.equal(await page.evaluate(() => localStorage.getItem('piispanpeli-best')), '500');
  assert.deepEqual(errors, []);
});

test('the EU ball and its scenery draw without errors on a phone and a computer', { skip }, async t => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
    const { page, errors } = await open(t, { viewport, store: { 'piispanpeli-seen': [...Array(15).keys()] } });
    await page.evaluate(() => { location.hash = 'scene=13'; });
    await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
    await page.evaluate(() => { cur = 13; makeBlob(13, 5, 12, 0, 0, 1); });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ name: NAMES[13], flag: FLAGS[13][0], scene: sceneIdx }));
    assert.deepEqual(r, { name: 'EU', flag: 'eu', scene: 13 });
    assert.deepEqual(errors, []);
  }
});

// Chromium's audio clock keeps running while the page is busy (Firefox's waits for it), so only Chromium can
// show a late timer here. The old music played every note it had missed at the same moment.
test('music: notes missed by a late timer are skipped, not played all at once', { skip: skip || (BROWSER !== 'chromium' && 'needs an audio clock that runs on while the page is busy') }, async t => {
  const { page, errors } = await open(t, { viewport: { width: 800, height: 600 } });
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  const r = await page.evaluate(async () => {
    sfx.ensure(); await new Promise(res => setTimeout(res, 800));
    const log = [], orig = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (when, ...rest) { log.push([this.context.currentTime, when || 0]); return orig.call(this, when, ...rest); };
    // the page is stuck for 0.6 to 0.9 s again and again, like a timer in a background tab
    for (let k = 0; k < 8; k++) { const t0 = performance.now(); while (performance.now() - t0 < 600 + k * 40) {} await new Promise(res => setTimeout(res, 120)); }
    // switching away and straight back must not leave the sound paused
    sfx.suspend(); sfx.resume();
    await new Promise(res => setTimeout(res, 1500));
    AudioScheduledSourceNode.prototype.start = orig;
    const late = log.filter(e => e[1] && e[1] < e[0] - 0.005).length, after = log.filter(e => e[0] > log[log.length - 1][0] - 1).length;
    return { notes: log.length, late, after };
  });
  assert.ok(r.notes > 10, 'music played');
  assert.equal(r.late, 0, 'no note was started after its time');
  assert.ok(r.after > 0, 'music still plays after a quick hide and show');
  assert.deepEqual(errors, []);
});
