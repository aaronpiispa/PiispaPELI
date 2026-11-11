// The mascot's wardrobe: items open from achievements, including the new shirt slot.
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

test('every wardrobe item opens from a real achievement, is translated and can be drawn', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t);
  const bad = await page.evaluate(() => {
    const out = [], ids = new Set(ACH.map(a => a[0])), cv = document.createElement('canvas').getContext('2d');
    for (const slot in WARDROBE) for (const [id, name, ach] of WARDROBE[slot]) {
      if (ach && !ids.has(ach)) out.push(`${slot}/${id}: unknown achievement ${ach}`);
      if (!I18N.en[name]) out.push(`${slot}/${id}: "${name}" has no English name`);
      if (slot === 'ball') continue;
      const keep = look[slot]; look[slot] = id;
      try { drawMascot(cv, 100, 100, 40, 1, 0); } catch (e) { out.push(`${slot}/${id}: ${e.message}`); }
      look[slot] = keep;
    }
    return out;
  });
  assert.deepEqual(bad, []);
  assert.deepEqual(errors, []);
});

test('an achievement opens its outfit, which can then be put on', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': { stage3: 1 } } });
  await page.click('#wardBtn');
  assert.ok(await page.isDisabled('[data-slot="top"][data-item="labcoat"]'), 'the lab coat is still locked');
  await page.click('[data-slot="top"][data-item="space"]');
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-look')))).top, 'space');
  assert.match(await page.evaluate(() => document.getElementById('card').innerText), /paita/i);
  assert.deepEqual(errors, []);
});

test('merging two Odins opens the Odin costume, which dresses the whole character', { skip }, async t => {
  const { page, errors } = await openPage(browser, base, t, { store: { 'piispanpeli-ach': { v_union: 1 } } });
  await page.click('#wardBtn');
  assert.ok(await page.isDisabled('[data-slot="costume"][data-item="cosmos"]'), 'the universe costume is still locked');
  await page.click('[data-slot="costume"][data-item="odin"]');
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-look')))).costume, 'odin');
  // the costume does not overwrite the player's own picks: choosing no costume brings them back
  await page.click('[data-slot="costume"][data-item="none"]');
  const lk = await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-look')));
  assert.deepEqual([lk.costume, lk.hat, lk.hair], ['none', 'bonnet', 'short']);
  assert.deepEqual(errors, []);
});
