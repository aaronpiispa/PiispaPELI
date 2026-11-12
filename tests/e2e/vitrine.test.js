// Newer features: the trophy case, the game clock, nested balls, the boss's arrival, Nelli's bonus, the character's name, the roulette and the theme picker.
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
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
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
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
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
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  await page.evaluate(() => { clearAll(); invincible = true; maxLevel = 14; makeBlob(2, 6, 2.8, 0, 0, 1); challengeStep(); });
  assert.equal(await page.evaluate(() => E.blobs.some(b => b.level === BOSS && Math.hypot(b.cx - 6, b.cy - 2.8) < 2)), false, 'not on top of the ball');
  await page.evaluate(() => { clearAll(); ch.bossOn = false; challengeStep(); });
  assert.deepEqual(await page.evaluate(() => [E.blobs.filter(b => b.level === BOSS).length, cooldown > 0.5]), [1, true]);
  assert.deepEqual(errors, []);
});

test('the heart bubble is Nelli\'s bonus: a small pink text, like the star bonus', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
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

test('the roulette: four equal outcomes and a rare joker, each does its thing, and the buttons are shielded meanwhile', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  const fill = () => page.evaluate(() => { clearAll(); for (let i = 0; i < 12; i++) makeBlob(i % 4, 1.5 + (i % 6) * 1.7, 12 + Math.floor(i / 6) * 2.4, 0, 0, 1); for (let i = 0; i < 90; i++) stepGame(); });
  const spin = r => page.evaluate(r => {
    const orig = Math.random; Math.random = () => r; charges = 1; useAbility(); Math.random = orig;
    const out = { spinning: rouT > 0, shielded: shieldOn(), pick: ROU[rouPick].id, n0: E.blobs.length };
    for (let i = 0; i < 400 && rouBusy(); i++) stepGame();
    out.n1 = E.blobs.length; out.shieldAfter = shieldT > 0; return out;
  }, r);
  // slices: 22.5 % each for shake, black hole, magnet and nothing, 10 % for the joker
  await fill(); const sw = await spin(0.1);
  assert.equal(sw.pick, 'swing'); assert.ok(sw.spinning && sw.shielded);
  await fill(); const ho = await spin(0.3);
  assert.equal(ho.pick, 'hole'); assert.equal(ho.n1, ho.n0 - 6, 'the black hole swallowed half of the balls');
  await fill(); const mg = await spin(0.6);
  assert.equal(mg.pick, 'magnet'); assert.ok(mg.n1 <= mg.n0 - 4, `every pair of same balls merged (${mg.n0} → ${mg.n1})`);
  await fill(); const no = await spin(0.8);
  assert.equal(no.pick, 'none'); assert.equal(no.n1, no.n0);
  await fill(); const jk = await spin(0.95);
  assert.equal(jk.pick, 'joker'); assert.equal(jk.n1, jk.n0);
  // the joker is shot like any ball and merges with a ball of another kind
  const j = await page.evaluate(() => {
    clearAll(); const was = jokerNext; cur = 0; makeBlob(5, 6, 17.6, 0, 0, 1);
    aimAng = 0; aimPow = 0.3; cooldown = 0; shoot();
    let joker = E.blobs.some(b => b.joker);
    for (let i = 0; i < 240 && E.blobs.length > 1; i++) stepGame();
    return [was, joker, jokerNext, E.blobs.map(b => b.level).join(), E.blobs.some(b => b.joker)];
  });
  assert.deepEqual(j, [true, true, false, '6', false]);
  // the shield: both buttons pressed hard, yet no danger builds up
  const d = await page.evaluate(() => { clearAll(); shieldT = 2.5; for (let i = 0; i < 6; i++) { makeBlob(5, 0.9, BTN_Y - 1 + i * 0.3, -8, 0, 1); makeBlob(5, WORLD_W - 0.9, BTN_Y - 1 + i * 0.3, 8, 0, 1); } let maxD = 0; for (let i = 0; i < 100; i++) { stepGame(); maxD = Math.max(maxD, dangerT); } return [maxD, state]; });
  assert.deepEqual(d, [0, 'play']);
  assert.deepEqual(errors, []);
});

test('a new game starts with picking the train', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': { stage1: 1 } } });
  await page.click('#startBtn');
  assert.equal(await page.locator('.h2').innerText(), 'Valitse teema');
  assert.equal(await page.locator('[data-pick]:not([disabled])').count(), 2);
  await page.click('[data-pick="viking"]');
  assert.deepEqual(await page.evaluate(() => [state, theme().id]), ['play', 'viking']);
  assert.deepEqual(errors, []);
});

test('combos come only from chain reactions: quick separate merges stay at ×1', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#startBtn'); await page.click('.tcard.on[data-pick]');
  // three separate pairs merging at the same moment: no chain, so no combo
  const sep = await page.evaluate(() => {
    clearAll(); invincible = true; let top = 0;
    for (const x of [2, 6, 10]) { makeBlob(1, x - 0.45, 17.5, 3, 0, 1); makeBlob(1, x + 0.45, 17.5, -3, 0, 1); }
    for (let i = 0; i < 60; i++) { stepGame(); top = Math.max(top, combo); }
    return [top, E.blobs.length];
  });
  assert.deepEqual(sep, [1, 3]);
  // a chain: two small balls merge, and the ball they make merges with the one waiting beside it
  const chain = await page.evaluate(() => {
    clearAll(); invincible = true; let top = 0;
    makeBlob(1, 4.4, 18.75, 0, 0, 1); makeBlob(1, 5.25, 18.75, 0, 0, 1); makeBlob(2, 4.82, 17.2, 0, 0, 1);
    for (let i = 0; i < 120; i++) { stepGame(); top = Math.max(top, combo); }
    return [top, E.blobs.map(b => b.level).join()];
  });
  assert.deepEqual(chain, [2, '3']);
  assert.deepEqual(errors, []);
});

test('the daily challenge has a new kind of goal every day', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const week = await page.evaluate(() => [20261112, 20261113, 20261114, 20261115, 20261116].map(d => dailyGoal(d * 10 + 5)));
  for (let i = 1; i < week.length; i++) assert.notEqual(week[i].kind, week[i - 1].kind, 'the kind changes from one day to the next');
  assert.deepEqual(new Set(week.map(g => g.kind)).size, 4, 'all four kinds come up');
  assert.deepEqual(await page.evaluate(() => dailyGoal(202611125)), await page.evaluate(() => dailyGoal(202611125)), 'the same day always gives the same goal');
  await page.click('#modesBtn');
  assert.match(await page.locator('.list li', { hasText: 'Päivän haaste' }).innerText(), /Tänään: /);
  assert.deepEqual(errors, []);
});

test('every train and stage has its own song, and the menu has only a volume control', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': { stage1: 1 }, 'piispanpeli-stage-viking': 2, 'piispanpeli-stagesel-viking': 1 } });
  assert.equal(await page.evaluate(() => music.songs.length), 12);
  assert.equal(await page.evaluate(() => musicScene()), 'eu:0');
  await page.click('#startBtn'); await page.click('[data-pick="viking"]');
  assert.equal(await page.evaluate(() => musicScene()), 'viking:1');
  await page.click('#pauseBtn');
  assert.equal(await page.locator('#trackSel').count(), 0, 'no song menu');
  assert.equal(await page.locator('#volRange').count(), 1, 'the volume slider is there');
  assert.deepEqual(errors, []);
});
