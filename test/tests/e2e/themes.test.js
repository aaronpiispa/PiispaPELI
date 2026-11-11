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
  for (const [theme, ten, lead] of [['eu', 'Ranska', /Virosta/], ['viking', 'Frigg', /Odiniin/], ['heart', 'Violetti sydän', /kultaiseen sydämeen/], ['uni', 'sin 30°', /matriisiin/]]) {
    const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme } });
    assert.match(await text(page, '.lead'), lead, `${theme}: menu text`);
    await page.click('#modesBtn');
    assert.ok((await text(page, '#card')).includes(ten), `${theme}: daily challenge names "${ten}"`);
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
  assert.match(await text(page, '.lead'), /Odiniin/);
  await page.selectOption('#langSel', 'en');
  assert.match(await text(page, '.lead'), /from Ratatoskr to Odin/);
  assert.deepEqual(errors, []);
});

test('themed achievements only count in their own theme, the originals only on the EU train', { skip }, async t => {
  const blobs = [[2, 5.55, 16], [2, 6.45, 16]];
  for (const [theme, own, other] of [['viking', 'v_first', 'first'], ['eu', 'first', 'v_first']]) {
    const { page, errors } = await openPage(browser, base, t, {
      store: { 'piispanpeli-ach': UNLOCKED, 'piispanpeli-theme': theme, 'piispanpeli-autosave': { v: 1, t: 1, score: 0, cur: 0, nxt: 1, maxLevel: 2, blobs } }
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
