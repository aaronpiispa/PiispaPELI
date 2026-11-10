// Offline support: the service worker serves the game from its cache, installs fresh files, and takes a newer
// version only when every file of it arrived, so old and new files never get mixed.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT } = require('../helpers/load');

const ORIGIN = 'https://example.test/game/';
const abs = u => new URL(u, ORIGIN).href;

// a tiny stand-in for the browser pieces the service worker uses
function worker(network) {
  const stores = new Map(), listeners = {}, timers = [];
  class Res {
    constructor(body, ok = true) { this.body = body; this.ok = ok; this.status = ok ? 200 : 404; }
    clone() { return new Res(this.body, this.ok); }
    static error() { return new Res('<<network error>>', false); }
  }
  class Req { constructor(u, o = {}) { this.url = abs(typeof u === 'string' ? u : u.url); this.cache = o.cache || 'default'; this.mode = o.mode || 'no-cors'; this.method = 'GET'; } }
  const key = u => { const s = typeof u === 'string' ? abs(u) : u.url; return s; };
  function store(name) {
    if (!stores.has(name)) {
      const m = new Map();
      stores.set(name, {
        m,
        match: (r, o = {}) => {
          let k = key(r);
          if (o.ignoreSearch) k = k.split('?')[0];
          return Promise.resolve(m.get(k));
        },
        put: (r, res) => { m.set(key(r), res); return Promise.resolve(); },
        addAll: list => Promise.all(list.map(r => network.fetch(r).then(res => { if (!res.ok) throw new Error('bad'); m.set(key(r), res); })))
      });
    }
    return stores.get(name);
  }
  const caches = {
    open: n => Promise.resolve(store(n)),
    keys: () => Promise.resolve([...stores.keys()]),
    delete: n => Promise.resolve(stores.delete(n))
  };
  const self = {
    location: { origin: new URL(ORIGIN).origin },
    addEventListener: (t, f) => { listeners[t] = f; },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() }
  };
  const ctx = vm.createContext({
    self, caches, URL, Promise, Date, Error, Map,
    Request: Req, Response: Res,
    fetch: r => network.fetch(r),
    setTimeout: (f, ms) => { timers.push(f); return timers.length; }
  });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), ctx, { filename: 'sw.js' });
  const consts = vm.runInContext('({ ASSETS, CACHE })', ctx);
  const event = (type, extra = {}) => {
    const waits = [];
    let response = null;
    const e = Object.assign({ waitUntil: p => waits.push(p), respondWith: p => { response = p; } }, extra);
    listeners[type](e);
    return { done: () => Promise.all(waits), response: () => response };
  };
  const runTimers = () => { const t = timers.splice(0); t.forEach(f => f()); };
  return { stores, event, runTimers, Req, Res, ...consts, cache: () => stores.get(consts.CACHE) };
}

// a fake web server whose files can be changed or made to fail
function server() {
  const files = new Map(), fail = new Set(), log = [];
  let online = true;
  return {
    files, fail, log,
    set online(v) { online = v; },
    fetch(r) {
      const u = (typeof r === 'string' ? abs(r) : r.url).split('?')[0];
      log.push({ url: u, cache: typeof r === 'string' ? 'default' : r.cache });
      if (!online) return Promise.reject(new TypeError('offline'));
      const p = u.slice(ORIGIN.length) || 'index.html';
      if (fail.has(p) || !files.has(p)) return Promise.resolve({ ok: false, status: 404, body: '', clone() { return this; } });
      const body = files.get(p);
      return Promise.resolve({ ok: true, status: 200, body, clone() { return { ...this }; } });
    }
  };
}
function siteVersion(net, w, v) {
  for (const a of w.ASSETS) {
    const p = a === './' ? 'index.html' : a.slice(2);
    net.files.set(p, p + '@' + v);
  }
}
const flush = () => new Promise(r => setImmediate(r));

test('installing caches every file and skips the browser cache', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  const c = w.cache();
  for (const a of w.ASSETS) assert.ok(c.m.has(abs(a)), `cached ${a}`);
  assert.ok(net.log.every(l => l.cache === 'reload'), 'install uses cache: reload');
});

test('files are served from the cache, even when the network is down', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  net.online = false;
  const r = await w.event('fetch', { request: new w.Req('js/game.js') }).response();
  assert.equal(r.body, 'js/game.js@1');
  const nav = await w.event('fetch', { request: new w.Req('./?utm=x', { mode: 'navigate' }) }).response();
  assert.equal(nav.body, 'index.html@1', 'navigation with a query string still opens the game');
  const other = await w.event('fetch', { request: new w.Req('somewhere/else.html', { mode: 'navigate' }) }).response();
  assert.equal(other.body, 'index.html@1', 'unknown pages fall back to the game when offline');
});

test('a new version is stored only after every file of it arrived', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  siteVersion(net, w, 2);
  net.fail.add('js/ui.js');
  // opening the game checks for updates in the background, after a short wait
  const ev = w.event('fetch', { request: new w.Req('./', { mode: 'navigate' }) });
  assert.equal((await ev.response()).body, 'index.html@1', 'the cached game opens immediately');
  w.runTimers(); await ev.done();
  for (const a of w.ASSETS) {
    const p = a === './' ? 'index.html' : a.slice(2);
    assert.equal(w.cache().m.get(abs(a)).body, p + '@1', `${a} kept at the old version because one file failed`);
  }
  // next launch: everything is available, so the whole new set is taken
  net.fail.clear();
  const ev2 = w.event('fetch', { request: new w.Req('./', { mode: 'navigate' }) });
  await ev2.response(); w.runTimers(); await ev2.done();
  for (const a of w.ASSETS) {
    const p = a === './' ? 'index.html' : a.slice(2);
    assert.equal(w.cache().m.get(abs(a)).body, p + '@2', `${a} updated`);
  }
  assert.ok(net.log.filter(l => l.cache === 'no-cache').length >= w.ASSETS.length, 'update checks revalidate with the server');
});

test('update checks are not repeated on every page load', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  net.log.length = 0;
  for (let i = 0; i < 3; i++) {
    const ev = w.event('fetch', { request: new w.Req('./', { mode: 'navigate' }) });
    await ev.response(); w.runTimers(); await ev.done();
  }
  assert.equal(net.log.length, w.ASSETS.length, 'one check for three quick reloads');
});

test('activating removes old game caches but keeps the fonts', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await (await Promise.resolve(w)).event('install').done();
  w.stores.set('piispanpeli-v1', { m: new Map() });
  w.stores.set('piispanpeli-fonts-v1', { m: new Map() });
  await w.event('activate').done();
  await flush();
  assert.deepEqual([...w.stores.keys()].sort(), [w.CACHE, 'piispanpeli-fonts-v1'].sort());
});
