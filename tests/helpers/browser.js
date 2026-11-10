// Shared helpers for the browser tests: a small local web server and a fresh, offline-safe page.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* optional dependency */ }
const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

// files in `overrides` (path -> text) are served instead of the real ones, to simulate a new version going live;
// overrides.set('down', true) drops every connection, like a phone that lost its network
function serve(overrides = new Map()) {
  const server = http.createServer((req, res) => {
    if (overrides.get('down')) { req.socket.destroy(); return; }
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    if (overrides.has(p)) { res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'text/plain', 'Cache-Control': 'no-cache' }); res.end(overrides.get(p)); return; }
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

// a fresh page with Finnish selected and the given saved data; web fonts are answered locally with an empty stylesheet
async function openPage(browser, base, t, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 430, height: 860 }, deviceScaleFactor: opts.dsf || 1,
    hasTouch: !!opts.touch, ...(BROWSER === 'firefox' ? {} : { isMobile: !!opts.touch }), // Firefox has no mobile emulation
    serviceWorkers: opts.sw ? 'allow' : 'block'
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  // the game starts weak devices (2 cores or less) one quality step lower; pin the device class so the results
  // do not depend on the computer running the tests (opts.cores lets a test pretend to be a weak phone)
  await page.addInitScript(c => {
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => c, configurable: true });
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => (c <= 2 ? 2 : 8), configurable: true });
  }, opts.cores || 8);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(o => {
    if (sessionStorage.getItem('init')) return;
    sessionStorage.setItem('init', '1');
    localStorage.clear();
    localStorage.setItem('piispanpeli-lang', JSON.stringify(o.lang || 'fi'));
    for (const [k, v] of Object.entries(o.store || {})) localStorage.setItem(k, JSON.stringify(v));
  }, { lang: opts.lang, store: opts.store });
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(base + (opts.hash ? '#' + opts.hash : ''));
  await page.waitForSelector('#startBtn');
  if (t) t.after(() => ctx.close());
  return { ctx, page, errors };
}

// the browser engine to test with: chromium (default), firefox or webkit (Safari's engine)
const BROWSER = process.env.BROWSER || 'chromium';
// GPU=1 draws with the computer's real graphics chip (Chromium only) instead of in software
function launchBrowser() {
  const opts = BROWSER === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  if (BROWSER === 'chromium' && process.env.GPU === '1') Object.assign(opts, { channel: 'chromium', args: ['--enable-gpu', '--use-angle=gl', '--ignore-gpu-blocklist'] });
  return playwright[BROWSER].launch(opts);
}

// waits for n real animation frames
const frames = (page, n) => page.evaluate(n => new Promise(ok => { let k = 0; const f = () => (++k >= n ? ok() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

module.exports = { playwright, serve, openPage, frames, launchBrowser, BROWSER, ROOT };
