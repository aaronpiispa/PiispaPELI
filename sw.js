// PiispanPELI service worker: keeps the game playable offline and starts it instantly.
// The game is served from the cache. Each time it is opened, every file is checked for a newer version in the
// background; the new versions are stored only when all of them arrived, so old and new files never get mixed
// (the scripts share one global scope, so a mix could break the game). Updates show up on the next launch.
// VERSION only needs a bump when this file's own logic changes or files are added or removed.
const VERSION = 'v53';
const CACHE = 'piispanpeli-' + VERSION;
const FONTS = 'piispanpeli-fonts-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/engine.js', './js/i18n-data.js', './js/core.js', './js/audio.js', './js/scenery.js', './js/game.js',
  './js/render.js', './js/mascot.js', './js/ui.js', './js/intro.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
// wait a moment after the game opens, and check at most every 15 seconds (quick reloads need no new check)
const REFRESH_DELAY = 3000, REFRESH_EVERY = 15000;

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never installs stale files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

let lastRefresh = 0;
function refresh() {
  if (Date.now() - lastRefresh < REFRESH_EVERY) return Promise.resolve();
  lastRefresh = Date.now();
  return Promise.all(ASSETS.map(u => fetch(new Request(u, { cache: 'no-cache' })).then(res => {
    if (!res.ok) throw new Error('not available: ' + u);
    return [u, res];
  })))
    .then(all => caches.open(CACHE).then(c => Promise.all(all.map(([u, res]) => c.put(u, res)))))
    .catch(() => { lastRefresh = 0; /* offline or a file is missing: keep the complete set we have */ });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const nav = req.mode === 'navigate';
    e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: nav }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => nav ? c.match('./index.html').then(r => r || Response.error()) : Response.error());
    })));
    // look for a newer version once the page has loaded (waiting keeps the check out of the page's way)
    if (nav) e.waitUntil(new Promise(ok => setTimeout(ok, REFRESH_DELAY)).then(refresh));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
