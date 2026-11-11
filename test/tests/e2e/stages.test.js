// Stages: the biggest ball beats a stage and opens the next one with new balls; stages 2 and 3 have time limits.
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

const UNLOCKED = { nordic: 1, heart: 1, map3: 1 };
const text = (page, sel) => page.evaluate(s => document.querySelector(s) && document.querySelector(s).innerText, sel);
const store = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
// the two biggest balls side by side: they merge right away, which beats the stage
const save = (stage, extra) => ({ v: 1, t: 1, score: 500, cur: 0, nxt: 1, maxLevel: 14, stage, blobs: [[14, 3.1, 16.3], [14, 8.9, 16.3], [3, 6, 10]], ...extra });

test('only the first stage is open at first, and the stage buttons show each theme\'s stages', { skip }, async t => {
  for (const [theme, names] of [['eu', ['Eurooppa', 'Aurinkokunta', 'Galaksi']], ['viking', ['Jumalat', 'Olennot', 'Yhdeksän maailmaa']],
    ['heart', ['Sydämet', 'Jalokivisydämet', 'Kosmiset sydämet']], ['uni', ['Laskut', 'Fysiikka', 'Yliopisto']]]) {
    const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme } });
    const btns = await page.$$eval('.stg', b => b.map(x => [x.querySelector('span').textContent, x.disabled]));
    assert.deepEqual(btns, [[names[0], false], [names[1], true], [names[2], true]], theme);
    assert.match(await text(page, '#startBtn'), new RegExp('Taso 1: ' + names[0]));
    assert.deepEqual(errors, []);
  }
});

test('merging the two biggest balls moves straight on to the next stage in the same game', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-autosave': save(0) } });
  await page.click('#continueBtn');
  await page.waitForFunction(() => stage === 1, null, { timeout: 10000 });
  assert.deepEqual(await page.evaluate(() => [state, NAMES[0], NAMES[14], E.blobs.length, maxLevel, document.getElementById('overlay').hidden]),
    ['play', 'Meteoroidi', 'Aurinko', 0, 0, true], 'the game goes on with the new balls in an empty wagon');
  assert.ok(await page.evaluate(() => score) >= 500, 'the points stay');
  assert.equal(await store(page, 'piispanpeli-stage-eu'), 1, 'stage 1 is recorded as beaten');
  assert.ok((await store(page, 'piispanpeli-ach')).stage1, 'the stage achievement is won');
  // the new stage shows its time limit in the score box, counted from the start of the stage
  assert.match(await page.evaluate(() => modeLine()), /^Maa: aikaa (5:00|4:5\d)$/);
  await frames(page, 5);
  assert.deepEqual(errors, []);
});

test('getting the biggest ball alone does not change the stage', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-autosave': { v: 1, t: 1, score: 0, cur: 0, nxt: 1, maxLevel: 13, blobs: [[13, 3.4, 16.6], [13, 8.6, 16.6]] } } });
  await page.click('#continueBtn');
  await page.waitForFunction(() => maxLevel === 14, null, { timeout: 10000 });
  await frames(page, 150);
  assert.deepEqual(await page.evaluate(() => [state, stage]), ['play', 0]);
  assert.deepEqual(errors, []);
});

test('the last stage ends with a final win screen, and the game can go on after it', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': 'uni', 'piispanpeli-stage-uni': 2, 'piispanpeli-autosave': save(2, { th: 'uni', playT: 700 }) } });
  await page.click('#continueBtn');
  await page.waitForFunction(() => /Kaikki tasot läpäisty/.test(document.getElementById('card').innerText), null, { timeout: 10000 });
  assert.match(await text(page, '#card'), /Kaiken teoria/);
  assert.equal(await store(page, 'piispanpeli-stage-uni'), 3);
  assert.ok((await store(page, 'piispanpeli-ach')).u_stage3);
  await page.click('#resumeBtn');
  await frames(page, 120);
  assert.deepEqual(await page.evaluate(() => [state, stage, document.getElementById('overlay').hidden]), ['play', 2, true], 'the win screen does not come back');
  assert.deepEqual(errors, []);
});

test('five save slots', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn');
  await page.evaluate(() => pause());
  await page.click('#saveBtn');
  assert.equal(await page.$$eval('[data-act="save"]', b => b.length), 5);
  await page.click('[data-act="save"][data-slot="5"]');
  await page.evaluate(() => toMenu());
  assert.equal(await page.$$eval('[data-act="load"]', b => b.map(x => x.dataset.slot).join()), '5');
  assert.deepEqual(errors, []);
});

test('missing the time limit ends the game and says which ball was needed', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-stage-eu': 1 } });
  assert.match(await text(page, '.stgoal'), /Aikaraja: Maa 5 minuutissa/);
  await page.click('#startBtn');
  assert.equal(await page.evaluate(() => stage), 1);
  await page.evaluate(() => { playT = 299.9; });
  await page.waitForFunction(() => state === 'over', null, { timeout: 5000 });
  await page.waitForFunction(() => /Aikaraja ylittyi/.test(document.getElementById('card').innerText), null, { timeout: 5000 });
  assert.match(await text(page, '#card'), /Maa piti saada 5 minuutissa/);
  assert.match(await text(page, '#againBtn'), /Taso 2: Aurinkokunta/);
  assert.deepEqual(errors, []);
});

test('a saved game comes back on its own stage, theme and clock', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-stage-heart': 3,
    'piispanpeli-autosave': { v: 1, t: 1, score: 10, cur: 0, nxt: 1, maxLevel: 3, th: 'heart', stage: 2, playT: 100, blobs: [[3, 6, 16]] } } });
  await page.click('#continueBtn');
  assert.deepEqual(await page.evaluate(() => [theme().id, stage, Math.round(playT), NAMES[14]]), ['heart', 2, 100, 'Universumin sydän']);
  assert.match(await page.evaluate(() => modeLine()), /Supernovasydän: aikaa 2:(1\d|20)/);
  assert.deepEqual(errors, []);
});

test('the other game modes always play the first stage\'s balls', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-stage-eu': 2, 'piispanpeli-stagesel-eu': 2 } });
  assert.equal(await page.evaluate(() => NAMES[14]), 'Universumi', 'the menu shows the chosen stage');
  await page.click('#modesBtn');
  assert.match(await text(page, '#card'), /Saa Ranska/);
  await page.click('[data-mode="time"]');
  assert.deepEqual(await page.evaluate(() => [stage, NAMES[10]]), [0, 'Ranska']);
  await page.evaluate(() => toMenu());
  assert.equal(await page.evaluate(() => stage), 2, 'back in the menu the chosen stage returns');
  assert.deepEqual(errors, []);
});

test('picking a stage in the menu changes the balls, and the stages are translated', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { lang: 'en', store: { 'piispanpeli-stage-eu': 3 } });
  assert.deepEqual(await page.$$eval('.stg span', s => s.map(x => x.textContent)), ['Europe', 'Solar System', 'Galaxy']);
  await page.click('.stg[data-stage="1"]');
  assert.match(await text(page, '.lead'), /Meteoroid → … → Sun/);
  assert.match(await text(page, '#startBtn'), /Stage 2: Solar System/);
  await page.click('.stg[data-stage="2"]');
  assert.equal(await page.evaluate(() => NAMES[9]), 'Black hole');
  assert.equal(await store(page, 'piispanpeli-stagesel-eu'), 2);
  assert.deepEqual(errors, []);
});

test('every stage ball can be drawn at every size', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const bad = await page.evaluate(() => {
    const out = [], cv = document.createElement('canvas'); cv.width = cv.height = 300;
    const keep = ctx; ctx = cv.getContext('2d');
    for (const art in STAGE_ART) for (let l = 0; l <= MAXL; l++) for (const s of [6, 40, 140]) {
      try { ctx.setTransform(1, 0, 0, 1, 150, 150); drawStageArt(art, l, s); } catch (e) { out.push(art + l + ': ' + e.message); }
    }
    ctx = keep;
    return out;
  });
  assert.deepEqual(bad, []);
  assert.deepEqual(errors, []);
});

test('the (i) buttons explain the goal of every stage and every game mode', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  assert.equal(await page.$$eval('.stgw .info', b => b.length), 3, 'one info button per stage, also on locked stages');
  await page.click('[data-info="stage"][data-id="2"]');
  const card = await text(page, '#card');
  assert.match(card, /Taso 3: Galaksi/);
  assert.match(card, /Universumi/);
  assert.match(card, /Musta aukko 4 minuutissa · Galaksijoukko 14 minuutissa/);
  assert.match(card, /Avautuu, kun läpäiset tason 2/);
  await page.click('#backMenu');
  await page.click('#modesBtn');
  assert.equal(await page.$$eval('.list .info', b => b.length), 6, 'one info button per game mode');
  for (const m of ['classic', 'time', 'daily', 'zen', 'gravity', 'map']) {
    await page.click(`[data-info="mode"][data-id="${m}"]`);
    assert.match(await text(page, '#card'), /Tavoite:/, m);
    await page.click('#modesBtn');
  }
  assert.deepEqual(errors, []);
});

test('the goal ball is marked in the ball row and the time limit is written across the wagon', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-stage-eu': 3, 'piispanpeli-stagesel-eu': 2 } });
  await page.click('#startBtn');
  assert.deepEqual(await page.evaluate(() => openGoals()), [[9, 240], [12, 840]]);
  await frames(page, 10);
  await page.evaluate(() => { maxLevel = 9; });
  assert.deepEqual(await page.evaluate(() => openGoals()), [[12, 840]], 'a reached goal is no longer marked');
  await page.evaluate(() => { maxLevel = 12; });
  assert.deepEqual(await page.evaluate(() => openGoals()), []);
  await frames(page, 10);
  assert.deepEqual(errors, []);
});
