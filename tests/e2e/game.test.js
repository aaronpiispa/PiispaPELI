// End-to-end tests in a real browser. Needs Playwright:  npm install  &&  npx playwright install chromium
// Runs the game from a small local web server so the offline service worker is tested too.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* optional dependency */ }
const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

const skip = !playwright && 'Playwright is not installed (npm install)';
let browser, server, base;

test.before(async () => {
  if (skip) return;
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await playwright.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
});
test.after(async () => { if (browser) await browser.close(); if (server) server.close(); });

// a fresh page with Finnish selected and no saved progress
async function open(t, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 430, height: 860 }, deviceScaleFactor: opts.dsf || 1 });
  // keep tests offline and deterministic: web fonts are answered locally with an empty stylesheet
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(o => {
    if (sessionStorage.getItem('init')) return;
    sessionStorage.setItem('init', '1');
    localStorage.clear();
    localStorage.setItem('piispanpeli-lang', JSON.stringify(o.lang || 'fi'));
    for (const [k, v] of Object.entries(o.store || {})) localStorage.setItem(k, JSON.stringify(v));
  }, opts);
  await page.goto(base + (opts.hash ? '#' + opts.hash : ''));
  await page.waitForSelector('#startBtn');
  t.after(() => ctx.close());
  return { page, errors };
}
const text = (page, sel) => page.evaluate(s => document.querySelector(s) && document.querySelector(s).innerText, sel);

test('the game loads without errors and shows the main menu', { skip }, async t => {
  const { page, errors } = await open(t);
  assert.match(await text(page, '#startBtn'), /Pelaa/);
  assert.match(await text(page, '#card'), /Pelimuodot/);
  assert.deepEqual(errors, []);
});

test('shooting balls scores points and unlocks the first achievement', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.click('#startBtn');
  for (let i = 0; i < 10; i++) { await page.mouse.click(215 + (i % 3) * 20, 600); await page.waitForTimeout(450); }
  const ach = await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-ach') || '{}'));
  const auto = await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-autosave') || 'null'));
  assert.ok(ach.first, 'first merge achievement');
  assert.ok(auto && auto.blobs.length > 0, 'game is autosaved');
  assert.deepEqual(errors, []);
});

test('pause, save to a slot and continue from the main menu', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) { await page.mouse.click(215, 600); await page.waitForTimeout(400); }
  await page.click('#pauseBtn');
  assert.match(await text(page, '#card'), /Tauko/);
  await page.click('#saveBtn');
  await page.click('[data-act="save"][data-slot="1"]');
  assert.match(await text(page, '#card'), /Tallennettu paikkaan 1/);
  await page.click('#menuBtn');
  const cont = await text(page, '#continueBtn');
  assert.match(cont, /Jatka peliä/);
  assert.match(cont, /\d+ pistettä/, 'shows the saved score');
  await page.click('#continueBtn');
  assert.equal(await page.evaluate(() => document.getElementById('overlay').hidden), true);
  assert.deepEqual(errors, []);
});

test('switching the language updates the menu and is remembered', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.selectOption('#langSel', 'en');
  assert.match(await text(page, '#startBtn'), /Play/);
  await page.selectOption('#langSel', 'uk');
  assert.match(await text(page, '#startBtn'), /Грати/);
  await page.reload();
  await page.waitForSelector('#startBtn');
  assert.match(await text(page, '#startBtn'), /Грати/);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'uk');
  assert.deepEqual(errors, []);
});

test('admin mode unlocks everything and can end the game', { skip }, async t => {
  const { page, errors } = await open(t);
  await page.keyboard.type('admin123');
  await page.click('#admAll');
  assert.match(await text(page, '.note'), /Kaikki avattu/);
  await page.click('#admClose');
  assert.match(await text(page, '#card'), /29\/29/);
  assert.match(await text(page, '#themeBtn'), /4 \/ 4/);
  await page.click('#startBtn');
  await page.keyboard.type('admin123');
  await page.click('#admLose');
  await page.waitForFunction(() => !document.getElementById('overlay').hidden && /Vaunu täyttyi/.test(document.getElementById('card').innerText), null, { timeout: 8000 });
  assert.deepEqual(errors, []);
});

test('a theme can be chosen once it is unlocked', { skip }, async t => {
  const { page, errors } = await open(t, { store: { 'piispanpeli-ach': { nordic: 1 } } });
  await page.click('#themeBtn');
  assert.equal(await page.evaluate(() => document.querySelector('[data-theme="heart"]').disabled), true, 'heart theme still locked');
  await page.click('[data-theme="viking"]');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('piispanpeli-theme'))), 'viking');
  assert.deepEqual(errors, []);
});

test('every game mode starts and runs', { skip }, async t => {
  const { page, errors } = await open(t);
  for (const m of ['classic', 'time', 'daily', 'zen', 'gravity']) {
    await page.evaluate(() => { const b = document.getElementById('menuBtn'); if (b) b.click(); });
    await page.click('#modesBtn');
    await page.click(`[data-mode="${m}"]`);
    await page.mouse.click(215, 600);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.getElementById('overlay').hidden), true, `${m} is playing`);
    await page.click('#pauseBtn');
  }
  assert.deepEqual(errors, []);
});

test('a slow phone gets a lower render resolution', { skip }, async t => {
  const { page } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': 3 } });
  const w = await page.evaluate(() => [document.getElementById('game').width, innerWidth]);
  assert.equal(w[0], w[1], 'renders at 1x on the lowest quality level');
  const { page: fast } = await open(t, { dsf: 2, store: { 'piispanpeli-quality': 0 } });
  const w2 = await fast.evaluate(() => [document.getElementById('game').width, innerWidth]);
  assert.equal(w2[0], w2[1] * 2, 'renders at 2x on the best quality level');
});

test('the opening intro plays and can be skipped with a tap', { skip }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 860 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.goto(base);
  await page.waitForSelector('#intro');
  await page.mouse.click(200, 400);
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => !!document.getElementById('intro')), false);
});

test('the service worker installs so the game works offline', { skip }, async t => {
  const { page } = await open(t);
  const ok = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  assert.ok(ok, 'service worker active');
  const cached = await page.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys.find(k => /piispanpeli-v/.test(k))); return (await c.keys()).length; });
  assert.ok(cached >= 15, `files cached for offline use (${cached})`);
});
