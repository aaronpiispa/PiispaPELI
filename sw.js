// PiispanPELI service worker: keeps the game playable offline and starts it instantly.
// The game is served from the cache. Each time it is opened, every file is checked for a newer version in the
// background. A new version is written into a cache of its own and marked complete only after its last file;
// until then the old complete set stays in use, so old and new files never get mixed even if the browser is
// closed half-way (the scripts share one global scope, so a mix could break the game). Updates show up on the
// next launch. When nothing changed, nothing is written.
// VERSION only needs a bump when this file's own logic changes or files are added or removed.
const VERSION = 'v59';
const CACHE = 'piispanpeli-' + VERSION;
const FONTS = 'piispanpeli-fonts-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/engine.js', './js/i18n-data.js', './js/core.js', './js/audio.js', './js/scenery.js', './js/game.js',
  './js/render.js', './js/stageart.js', './js/mascot.js', './js/ui.js', './js/intro.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
// the entry written last into a complete set
const DONE = './__complete__';
// wait a moment after the game opens, and check at most every 15 seconds (quick reloads need no new check)
const REFRESH_DELAY = 3000, REFRESH_EVERY = 15000;

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never installs stale files
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))).then(() => c.put(DONE, new Response('1'))))
    .then(() => self.skipWaiting()));
});

// the caches of this version: the installed one and the updates written later (piispanpeli-v59-u<time>)
const ours = k => k === CACHE || k.startsWith(CACHE + '-u');
const stamp = k => (k === CACHE ? 0 : Number(k.slice(CACHE.length + 2)) || 0);

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => !ours(k) && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// the newest complete set of files
let current = null;
function currentCache() {
  if (current) return Promise.resolve(current);
  return caches.keys().then(async keys => {
    for (const k of keys.filter(ours).sort((a, b) => stamp(b) - stamp(a))) {
      if (await (await caches.open(k)).match(DONE)) return (current = k);
    }
    return CACHE;
  });
}

const sameBytes = (a, b) => {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a), y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
};

let lastRefresh = 0;
function refresh() {
  if (Date.now() - lastRefresh < REFRESH_EVERY) return Promise.resolve();
  lastRefresh = Date.now();
  return Promise.all(ASSETS.map(u => fetch(new Request(u, { cache: 'no-cache' })).then(res => {
    if (!res.ok) throw new Error('not available: ' + u);
    return [u, res];
  })))
    .then(async all => {
      const name = await currentCache(), old = await caches.open(name);
      // compare with what is stored: when every file is the same there is nothing to write
      let changed = false;
      for (const [u, res] of all) {
        const had = await old.match(u);
        if (!had || !sameBytes(await had.arrayBuffer(), await res.clone().arrayBuffer())) { changed = true; break; }
      }
      if (!changed) return;
      const next = CACHE + '-u' + Date.now(), c = await caches.open(next);
      await Promise.all(all.map(([u, res]) => c.put(u, res)));
      await c.put(DONE, new Response('1'));   // only now is the new set complete
      current = next;
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => ours(k) && k !== next).map(k => caches.delete(k)));
    })
    .catch(() => { lastRefresh = 0; /* offline or a file is missing: keep the complete set we have */ });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const nav = req.mode === 'navigate';
    e.respondWith(currentCache().then(name => caches.open(name)).then(c => c.match(req, { ignoreSearch: nav }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => nav ? c.match('./index.html').then(r => r || Response.error()) : Response.error());
    })));
    // look for a newer version once the page has loaded (waiting keeps the check out of the page's way)
    if (nav) e.waitUntil(new Promise(ok => setTimeout(ok, REFRESH_DELAY)).then(refresh));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
