// The trophy display case, the game clock, balls stuck inside each other, the boss's arrival, Nelli's bonus and the character's name.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, launchBrowser } = require('../helpers/browser');

const skip = !playwright && 'Playwright is not installed (npm install)';
let browser, server, base;
test.before(async () => {
  if (skip) return;
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await launchBrowser();
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });


test('the case shows the newest six trophies until the player picks their own', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const ids = await page.evaluate(() => { ACH.slice(0, 8).forEach((a, i) => { achGot[a[0]] = 1000 + i; }); return ACH.slice(0, 8).map(a => a[0]); });
  assert.deepEqual(await page.evaluate(() => vitrineIds()), ids.slice(2, 8));
  // a trophy that is not in the case has no place and cannot be picked up
  assert.equal(await page.evaluate(() => shelfPos(0)), null);
  assert.ok(Array.isArray(await page.evaluate(() => shelfPos(7))));
  assert.deepEqual(errors, []);
});

test('the editor adds and removes trophies, keeps at most six and can go back to automatic', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const ids = await page.evaluate(() => { ACH.slice(0, 8).forEach((a, i) => { achGot[a[0]] = 1000 + i; }); return ACH.slice(0, 8).map(a => a[0]); });
  await page.click('#achBtn');
  await page.click('#vitBtn');
  assert.equal(await page.locator('.vslot:not(.empty)').count(), 6);
  // remove one from the case, then add the oldest one
  await page.click(`.vslot[data-vit="${ids[7]}"]`);
  assert.deepEqual(await page.evaluate(() => vitrineIds()), ids.slice(2, 7));
  await page.click(`.vpick[data-vit="${ids[0]}"]`);
  assert.deepEqual(await page.evaluate(() => vitrineIds()), [...ids.slice(2, 7), ids[0]]);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-vitrine'))), [...ids.slice(2, 7), ids[0]]);
  // a full case refuses a seventh
  await page.click(`.vpick[data-vit="${ids[1]}"]`);
  assert.match(await page.locator('.note').innerText(), /täynnä/);
  assert.equal(await page.evaluate(() => vitrineIds().length), 6);
  await page.click('#vitAuto');
  assert.deepEqual(await page.evaluate(() => vitrineIds()), ids.slice(2, 8));
  assert.equal(await page.evaluate(() => localStorage.getItem('piispanpeli-vitrine')), 'null');
  await page.click('#achBtn');
  assert.match(await page.locator('.h2').innerText(), /Saavutukset/);
  assert.deepEqual(errors, []);
});

test('the game clock shows how long the game has gone on, in the train colours', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  assert.deepEqual(await page.evaluate(() => [fmtPlayTime(0), fmtPlayTime(65.7), fmtPlayTime(3725)]), ['0:00', '1:05', '1:02:05']);
  await page.click('#startBtn');
  await page.evaluate(() => { timerBox = null; playT = 42; });
  await page.waitForTimeout(150);
  const box = await page.evaluate(() => timerBox);
  assert.ok(box && box[2] > 40 && box[3] > 20, 'the clock is drawn');
  await page.evaluate(() => { state = 'menu'; timerBox = null; });
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => timerBox), null, 'no clock outside a game');
  assert.deepEqual(errors, []);
});

test('a ball stuck inside another slides out instead of staying inside or flying off', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn');
  const r = await page.evaluate(() => {
    clearAll(); invincible = true;
    const B = makeBlob(10, 6, 14, 0, 0, 1), A = makeBlob(1, 6.2, 14.1, 0, 0, 1);
    let up = 0;
    for (let k = 0; k < 120; k++) {
      stepPhysics();
      const a = E.blobs.find(b => b.id === A.id); let my = 0;
      for (let i = a.start; i < a.start + a.n; i++) my += VY[i];
      up = Math.max(up, -my / a.n);
    }
    const a = E.blobs.find(b => b.id === A.id), b = E.blobs.find(b => b.id === B.id);
    return { gap: Math.hypot(a.cx - b.cx, a.cy - b.cy) - (a.R + b.R), up };
  });
  assert.ok(r.gap > -0.3, `the balls are apart (gap ${r.gap.toFixed(2)})`);
  assert.ok(r.up < 12, `no fling upwards (${r.up.toFixed(1)})`);
  assert.deepEqual(errors, []);
});

test('the boss waits for a free spot and holds the next shot for a moment', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-stage-eu': 3, 'piispanpeli-stagesel-eu': 2 } });
  await page.click('#startBtn');
  await page.evaluate(() => { clearAll(); invincible = true; maxLevel = 12; makeBlob(2, 6, 2.8, 0, 0, 1); challengeStep(); });
  assert.equal(await page.evaluate(() => E.blobs.some(b => b.level === BOSS && Math.hypot(b.cx - 6, b.cy - 2.8) < 2)), false, 'not on top of the ball');
  await page.evaluate(() => { clearAll(); ch.bossOn = false; challengeStep(); });
  assert.deepEqual(await page.evaluate(() => [E.blobs.filter(b => b.level === BOSS).length, cooldown > 0.5]), [1, true]);
  assert.deepEqual(errors, []);
});

test('the heart bubble is Nelli\'s bonus: a small pink text, like the star bonus', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn');
  await page.evaluate(() => { clearAll(); bonuses.length = 0; bonuses.push({ x: 6, y: 3, vx: 0, r: 0.6, heart: true, t: 0, ph: 0 }); const [x, y] = bubblePos(bonuses[0]); makeBlob(3, x, y, 0, 0, 1); bonusStep(); });
  assert.deepEqual(await page.evaluate(() => [score, nelliT, hearts.length, !!achGot.heart]), [1000, 0, 0, true]);
  assert.deepEqual(errors, []);
});

test('the character can be named; the name is kept, shown in the menu and never read as HTML', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#wardBtn');
  await page.fill('#heroName', '<b>Pekka</b>');
  assert.equal(await page.evaluate(() => localStorage.getItem('piispanpeli-name')), JSON.stringify('<b>Pekka</b>'));
  await page.click('#backMenu');
  assert.equal(await page.locator('.nametag').innerText(), '<b>Pekka</b>');
  assert.equal(await page.locator('.nametag b').count(), 0);
  await page.click('#wardBtn');
  assert.equal(await page.inputValue('#heroName'), '<b>Pekka</b>');
  assert.deepEqual(errors, []);
});

test('the easy achievements are gone, but what they opened stays open for players who earned them', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': { nordic: 1, combo5: 1, s10k: 1 } } });
  assert.deepEqual(await page.evaluate(() => ['nordic', 'fra', 'combo5', 'shake', 's10k', 'v_l10', 'h_l79'].filter(id => ACH.some(a => a[0] === id))), []);
  assert.ok(await page.evaluate(() => ACH.some(a => a[0] === 'stage1') && ACH.some(a => a[0] === 'v_stage3')), 'beating a stage still counts');
  assert.deepEqual(await page.evaluate(() => [themeOpen(THEMES[1]), themeOpen(THEMES[2]), itemOpen('hat', WARDROBE.hat.find(w => w[0] === 'cap')), itemOpen('hair', WARDROBE.hair.find(w => w[0] === 'bun'))]), [true, false, true, true]);
  assert.equal(await page.evaluate(() => achCount()), 0, 'removed achievements are not counted');
  assert.deepEqual(errors, []);
});
