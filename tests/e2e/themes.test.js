// Themed balls: every theme has its own 15 balls, names, missions and achievements.
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

test('each theme gives the balls its own names in the menu, missions and daily challenge', { skip }, async t => {
  const ALL15 = [...Array(15).keys()];
  for (const [theme, ten, lead] of [['eu', 'Ranska', /Mikä mahtaa olla suurin/], ['viking', 'Frigg', /mahtavin kaikista/], ['heart', 'Violetti sydän', /suurin sydän/], ['uni', 'sin 30°', /vaikein lasku/]]) {
    // the player has seen every ball of the theme, so the goals may name them
    const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme, [theme === 'eu' ? 'piispanpeli-seen' : 'piispanpeli-seen-' + theme]: ALL15 } });
    assert.match(await text(page, '.lead'), lead, `${theme}: menu text`);
    await page.click('#modesBtn');
    assert.ok(await page.evaluate(ten => dailyText({ kind: 'ball', lv: 10 }).includes(ten), ten), `${theme}: daily challenge names "${ten}"`);
    assert.ok((await text(page, '#card')).includes(await page.evaluate(() => dailyText())), `${theme}: today's goal is shown`);
    await page.click('[data-mode="map"]');
    const map = await text(page, '#card');
    assert.ok(map.includes(ten), `${theme}: the last mission asks for "${ten}"`);
    assert.deepEqual(errors, []);
  }
});

test('switching the theme switches the ball names right away', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED } });
  await page.click('#themeBtn');
  await page.click('[data-theme="viking"]');
  await page.click('#backMenu');
  assert.match(await text(page, '.lead'), /mahtavin kaikista/);
  await page.selectOption('#langSel', 'en');
  assert.match(await text(page, '.lead'), /mightiest of all/);
  assert.deepEqual(errors, []);
});

test('themed achievements only count in their own theme, the originals only on the EU train', { skip }, async t => {
  const blobs = [[13, 3.4, 16.5], [13, 8.6, 16.5]];
  for (const [theme, own, other] of [['viking', 'v_l14', 'rus'], ['eu', 'rus', 'v_l14']]) {
    const { page, errors } = await openPage(browser, base, t, {
      store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme, 'piispanpeli-autosave': { v: 1, t: 1, score: 0, cur: 0, nxt: 1, maxLevel: 13, blobs } }
    });
    await page.click('#continueBtn');
    await page.waitForFunction(id => !!JSON.parse(localStorage.getItem('piispanpeli-ach') || '{}')[id], own, { timeout: 8000 });
    const got = await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-ach')));
    assert.ok(!got[other], `${theme}: "${other}" stays locked`);
    assert.deepEqual(errors, []);
  }
});

test('the achievement list has a group for every theme', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  await page.click('#achBtn');
  const groups = await page.evaluate(() => [...document.querySelectorAll('.ach h4')].map(h => h.textContent));
  for (const g of ['Viikinki', 'Sydän', 'Korkeakoulu']) assert.ok(groups.includes(g), `group ${g}`);
  assert.deepEqual(errors, []);
});

test('themed balls draw without errors in every theme, including the biggest ones', { skip }, async t => {
  for (const theme of ['viking', 'heart', 'uni']) {
    const blobs = Array.from({ length: 15 }, (_, l) => [l, 1 + (l % 5) * 2.4, 6 + Math.floor(l / 5) * 4]);
    const { page, errors } = await openPage(browser, base, t, {
      store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme, 'piispanpeli-autosave': { v: 1, t: 1, score: 0, cur: 0, nxt: 1, maxLevel: 14, blobs } }
    });
    await page.click('#continueBtn');
    await frames(page, 30);
    assert.deepEqual(errors, [], `${theme}`);
  }
});

test('no spoilers: balls the player has not seen are called by their number', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const lead = await text(page, '.lead');
  assert.ok(!/USSR/.test(lead), 'the menu text does not tell the biggest ball');
  assert.match(await text(page, '.stgoal'), /Yhdistä kaksi suurinta palloa, niin/);
  await page.click('#achBtn');
  const ach = await text(page, '#card');
  for (const name of ['USSR', 'Suomi', 'Odin', 'Matriisi', 'matriisi', 'Kultainen sydän', 'kultainen sydän']) assert.ok(!ach.includes(name), `achievements do not reveal "${name}"`);
  assert.match(ach, /Yhdistä kaksi suurinta palloa\./);
  await page.evaluate(() => showMenu());
  assert.match(await page.evaluate(() => dailyText({ kind: 'ball', lv: 10 })), /Saa 11\. pallo/);
  // once the ball has been seen, its name is used
  await page.evaluate(() => { seenEver.add(10); });
  assert.match(await page.evaluate(() => dailyText({ kind: 'ball', lv: 10 })), /Saa Ranska/);
  assert.deepEqual(errors, []);
});
