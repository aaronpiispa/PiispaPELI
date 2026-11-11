// Offline support: the service worker serves the game from its cache, installs fresh files, and takes a newer
// version only when every file of it arrived and was written, so old and new files never get mixed.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT } = require('../helpers/load');

const ORIGIN = 'https://example.test/game/';
const abs = u => new URL(u, ORIGIN).href;
const bytes = body => Promise.resolve(new TextEncoder().encode(String(body)).buffer);

// a tiny stand-in for the browser pieces the service worker uses
function worker(network) {
  const stores = new Map(), listeners = {}, timers = [];
  class Res {
    constructor(body, ok = true) { this.body = body; this.ok = ok; this.status = ok ? 200 : 404; }
    clone() { return new Res(this.body, this.ok); }
    arrayBuffer() { return bytes(this.body); }
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
  const consts = vm.runInContext('({ ASSETS, CACHE, DONE })', ctx);
  const event = (type, extra = {}) => {
    const waits = [];
    let response = null;
    const e = Object.assign({ waitUntil: p => waits.push(p), respondWith: p => { response = p; } }, extra);
    listeners[type](e);
    return { done: () => Promise.all(waits), response: () => response };
  };
  const runTimers = () => { const t = timers.splice(0); t.forEach(f => f()); };
  // the set in use: the newest one of this version that carries the "complete" mark
  const ours = k => k === consts.CACHE || k.startsWith(consts.CACHE + '-u');
  const cache = () => [...stores.keys()].filter(ours).sort().reverse().map(k => stores.get(k)).find(s => s.m.has(abs(consts.DONE)));
  return { stores, event, runTimers, Req, Res, ...consts, cache, ours };
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
      if (fail.has(p) || !files.has(p)) return Promise.resolve({ ok: false, status: 404, body: '', clone() { return this; }, arrayBuffer() { return bytes(''); } });
      const body = files.get(p);
      return Promise.resolve({ ok: true, status: 200, body, clone() { return { ...this }; }, arrayBuffer() { return bytes(body); } });
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

test('nothing is written when no file changed', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  const before = [...w.stores.keys()], set = w.cache(), css = set.m.get(abs('./css/style.css'));
  const ev = w.event('fetch', { request: new w.Req('./', { mode: 'navigate' }) });
  await ev.response(); w.runTimers(); await ev.done();
  assert.deepEqual([...w.stores.keys()], before, 'no new copy of the files');
  assert.equal(w.cache().m.get(abs('./css/style.css')), css, 'the stored file was left as it was');
});

test('a new version written only half-way is never used', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  // the browser closed while a newer set was being written: it has some files but not the "complete" mark
  const m = new Map([[abs('js/game.js'), new w.Res('js/game.js@2')]]);
  w.stores.set(w.CACHE + '-u9999999999999', { m, match: r => Promise.resolve(m.get(r.url || abs(r))), put: (r, v) => { m.set(r.url || abs(r), v); return Promise.resolve(); } });
  const fresh = worker(net);   // the service worker starts again later, with the network down
  for (const [k, v] of w.stores) fresh.stores.set(k, v);
  net.online = false;
  const r = await fresh.event('fetch', { request: new fresh.Req('js/game.js') }).response();
  assert.equal(r.body, 'js/game.js@1', 'served from the complete old set');
});

test('after an update only the new complete set is kept', async () => {
  const net = server(), w = worker(net);
  siteVersion(net, w, 1);
  await w.event('install').done();
  siteVersion(net, w, 2);
  const ev = w.event('fetch', { request: new w.Req('./', { mode: 'navigate' }) });
  await ev.response(); w.runTimers(); await ev.done();
  const sets = [...w.stores.keys()].filter(w.ours);
  assert.equal(sets.length, 1, 'the old set was removed: ' + sets);
  assert.notEqual(sets[0], w.CACHE, 'the update lives in a set of its own');
  assert.equal((await w.event('fetch', { request: new w.Req('js/game.js') }).response()).body, 'js/game.js@2', 'the new version is served');
});
