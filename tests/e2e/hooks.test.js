// Stage challenges (stones, boss) and progress (stars, experience, coins, shop).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { playwright, serve, openPage, frames, launchBrowser } = require('../helpers/browser');

const skip = !playwright && 'Playwright is not installed (npm install)';
let browser, server, base;
test.before(async () => {
  if (skip) return;
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await launchBrowser();
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });
const text = (page, sel) => page.evaluate(s => document.querySelector(s) && document.querySelector(s).innerText, sel);
const store = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
// start a classic game on the given stage (0, 1 or 2) of the EU train
async function stageGame(t, n, extra) {
  const { page, errors } = await openPage(browser, base, t, { store: Object.assign({ 'piispanpeli-stage-eu': 3, 'piispanpeli-stagesel-eu': n }, extra || {}) });
  await page.click('#startBtn');
  assert.equal(await page.evaluate(() => stage), n);
  return { page, errors };
}

test('stage 2 has no shot limit: shooting goes on as long as there is room', { skip }, async t => {
  const { page, errors } = await stageGame(t, 1);
  assert.match(await page.evaluate(() => modeLine()), /Taso 2: Aurinkokunta/);
  await page.evaluate(() => { ch.shots = 1000; });
  const before = await page.evaluate(() => E.blobs.length);
  await page.evaluate(() => { cooldown = 0; shoot(); });
  assert.ok(await page.evaluate(() => E.blobs.length) > before, 'the shot went off');
  await frames(page, 200);
  assert.equal(await page.evaluate(() => state), 'play');
  assert.deepEqual(errors, []);
});

test('stage 2: stones fall in now and then and break after two merges next to them', { skip }, async t => {
  const { page, errors } = await stageGame(t, 1);
  await page.evaluate(() => { ch.shots = 21; challengeOnShot(); });
  assert.equal(await page.evaluate(() => E.blobs.filter(b => b.level === STONE).length), 1, 'the 22nd shot brings a stone');
  await frames(page, 60);
  const coins = await page.evaluate(() => meta.coins);
  await page.evaluate(() => { const s = E.blobs.find(b => b.level === STONE); challengeOnMerge({ level: 3, x: s.cx + 0.5, y: s.cy }); });
  assert.equal(await page.evaluate(() => E.blobs.find(b => b.level === STONE).hp), 1, 'cracked');
  await page.evaluate(() => { const s = E.blobs.find(b => b.level === STONE); challengeOnMerge({ level: 3, x: s.cx + 0.5, y: s.cy }); });
  assert.deepEqual(await page.evaluate(() => [E.blobs.some(b => b.level === STONE), ch.broken]), [false, 1]);
  assert.equal(await page.evaluate(() => meta.coins), coins + 2, 'a broken stone gives coins');
  // stones never merge with each other
  await page.evaluate(() => { makeBlob(STONE, 5.5, 17, 0, 0, 1).hp = 2; makeBlob(STONE, 6.6, 17, 0, 0, 1).hp = 2; });
  await frames(page, 90);
  assert.equal(await page.evaluate(() => E.blobs.filter(b => b.level === STONE).length), 2);
  assert.deepEqual(errors, []);
});

test('stage 3: the boss arrives two balls before the end and is beaten by merges next to it', { skip }, async t => {
  const { page, errors } = await stageGame(t, 2);
  await page.evaluate(() => { maxLevel = 12; });
  await frames(page, 5);
  assert.deepEqual(await page.evaluate(() => [ch.bossOn, ch.bossHP, E.blobs.some(b => b.level === BOSS)]), [true, 60, true]);
  await frames(page, 60);
  const score = await page.evaluate(() => score);
  await page.evaluate(() => { const b = E.blobs.find(q => q.level === BOSS); for (let i = 0; i < 6; i++) challengeOnMerge({ level: 9, x: b.cx, y: b.cy }); });
  assert.deepEqual(await page.evaluate(() => [ch.bossHP, ch.bossDone, E.blobs.some(b => b.level === BOSS)]), [0, true, false]);
  assert.ok(await page.evaluate(() => score) >= score + 5000, 'beating the boss gives points');
  await frames(page, 30);
  assert.equal(await page.evaluate(() => E.blobs.some(b => b.level === BOSS)), false, 'it does not come back');
  assert.deepEqual(errors, []);
});

test('the train no longer takes bends: the wagon stays straight on every stage', { skip }, async t => {
  const { page, errors } = await stageGame(t, 2);
  await frames(page, 200);
  assert.deepEqual(await page.evaluate(() => [E.gx, canvas.style.transform]), [0, '']);
  assert.deepEqual(errors, []);
});

test('beating a stage gives stars by its bonus goals, shown on the stage buttons', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-autosave': { v: 1, t: 1, score: 500, cur: 0, nxt: 1, maxLevel: 14, stage: 0,
    chal: { s: 300, w: 0, c: 9 }, blobs: [[14, 3.1, 16.3], [14, 8.9, 16.3]] } } });
  await page.click('#continueBtn');
  await page.waitForFunction(() => stage === 1, null, { timeout: 10000 });
  assert.deepEqual(await store(page, 'piispanpeli-stars-eu'), [3, 0, 0], 'no shake and a ×8 combo: three stars');
  await page.evaluate(() => toMenu());
  assert.match(await text(page, '.stg[data-stage="0"]'), /★★★/);
  await page.click('[data-info="stage"][data-id="1"]');
  assert.match(await text(page, '#card'), /Riko 8 kiveä/);
  assert.deepEqual(errors, []);
});

test('merges give experience; a new player level gives coins and is shown in the menu', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  assert.match(await text(page, '.meta'), /1\s*0 \/ 200 XP/);
  await page.click('#startBtn');
  await page.evaluate(() => gainXP(250));
  assert.deepEqual(await page.evaluate(() => [meta.lvl, meta.xp, meta.coins]), [2, 50, 35]);
  await page.evaluate(() => gameOver('forced'));
  await page.waitForFunction(() => !!document.querySelector('.metaover'), null, { timeout: 5000 });
  assert.match(await text(page, '.metaover'), /\+250 XP/);
  await page.evaluate(() => toMenu());
  assert.match(await text(page, '.nextrw'), /pelaajataso 3/);
  assert.deepEqual(errors, []);
});

test('a cheated game gives no experience or coins', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn');
  await page.evaluate(() => { cheated = true; gainXP(500); gainCoins(100); });
  assert.deepEqual(await page.evaluate(() => [meta.lvl, meta.xp, meta.coins]), [1, 0, 0]);
  assert.deepEqual(errors, []);
});

test('the shop sells items for coins, and level rewards open by themselves', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-meta': { xp: 0, lvl: 5, coins: 260, owned: [] } } });
  await page.click('#shopBtn');
  assert.ok(await page.isDisabled('[data-buy="hat"][data-item="pirate"]'), 'too expensive');
  await page.click('[data-buy="hat"][data-item="elf"]');
  assert.deepEqual(await page.evaluate(() => [meta.coins, meta.owned, look.hat]), [60, ['hat:elf'], 'elf']);
  await page.click('#wardBtn');
  assert.ok(!(await page.isDisabled('[data-slot="ball"][data-item="silver"]')), 'silver rims are the level 5 reward');
  assert.ok(await page.isDisabled('[data-slot="ball"][data-item="neon"]'), 'neon rims need level 15');
  await page.click('[data-slot="ball"][data-item="silver"]');
  assert.equal(await page.evaluate(() => rimStyle()), 'silver');
  await page.click('[data-slot="wagon"][data-item="blue"]');
  assert.deepEqual(errors, []);
});

test('a bought wagon colour repaints the wagon', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-meta': { xp: 0, lvl: 1, coins: 0, owned: ['wagon:green'] }, 'piispanpeli-look': { wagon: 'green' } } });
  assert.equal(await page.evaluate(() => theme().wall[0]), '#2a8a4a');
  await page.evaluate(() => { look.wagon = 'black'; });
  assert.equal(await page.evaluate(() => theme().wall[0]), '#2d5fc4', 'a colour not owned is not used');
  assert.deepEqual(errors, []);
});

test('a saved game keeps its stones, the boss and the challenge state', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-stage-eu': 3, 'piispanpeli-autosave': { v: 1, t: 1, score: 10, cur: 0, nxt: 1, maxLevel: 12, stage: 2,
    chal: { s: 77, b: 3, bo: true, bh: 25 }, blobs: [[STONE_LV(), 3, 17, 1], [21, 7, 15], [2, 10, 17]] } } });
  await page.click('#continueBtn');
  assert.deepEqual(await page.evaluate(() => [ch.shots, ch.broken, ch.bossOn, ch.bossHP, E.blobs.find(b => b.level === STONE).hp, E.blobs.some(b => b.level === BOSS)]), [77, 3, true, 25, 1, true]);
  assert.deepEqual(errors, []);
});
function STONE_LV() { return 20; }

test('bonus bubbles drift across the wagon and pop when a ball touches them', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn');
  await page.evaluate(() => { bonusT = 0.001; });
  await frames(page, 3);
  const p0 = await page.evaluate(() => { const o = bonuses[0]; return [o.x, bubblePos(o)[1]]; });
  await frames(page, 60);
  const p1 = await page.evaluate(() => { const o = bonuses[0]; return [o.x, bubblePos(o)[1]]; });
  assert.ok(Math.abs(p1[0] - p0[0]) > 0.3, 'it drifts sideways');
  assert.notEqual(p1[1], p0[1], 'and bobs up and down');
  const score = await page.evaluate(() => score);
  await page.evaluate(() => { const o = bonuses[0], [x, y] = bubblePos(o); makeBlob(2, x, y, 0, 0, 1); });
  await frames(page, 3);
  assert.equal(await page.evaluate(() => bonuses.length), 0, 'popped');
  assert.ok(await page.evaluate(() => score) >= score + 500);
  assert.deepEqual(errors, []);
});

test('new menu screens pop in, and starting a game or a new stage shows its banner', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { animations: true });
  await page.click('#wardBtn');
  assert.ok(await page.evaluate(() => card.classList.contains('pop')), 'the wardrobe pops in');
  await page.click('[data-slot="hat"][data-item="none"]');
  assert.ok(await page.evaluate(() => card.classList.contains('pop')), 'still the same screen');
  await page.click('#backMenu');
  await page.click('#startBtn');
  assert.deepEqual(await page.evaluate(() => [trans.kind, trans.title]), ['start', 'Taso 1: Eurooppa']);
  await frames(page, 20);
  assert.deepEqual(errors, []);
});
