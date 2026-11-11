// Project files: the page loads every script, the offline cache knows every file, the manifest is valid.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT } = require('../helpers/load');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const html = read('index.html');
const sw = read('sw.js');
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));

test('index.html loads every script once, with main.js last', () => {
  const srcs = [...html.matchAll(/<script defer src="js\/([^"]+)"><\/script>/g)].map(m => m[1]);
  assert.deepEqual([...srcs].sort(), [...jsFiles].sort());
  assert.equal(srcs[srcs.length - 1], 'main.js');
  assert.equal(srcs[0], 'engine.js');
  assert.ok(srcs.indexOf('i18n-data.js') < srcs.indexOf('core.js'), 'translations load before core');
});

test('the service worker caches every file the game needs', () => {
  const assets = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  for (const f of jsFiles) assert.ok(assets.includes('./js/' + f), `sw.js is missing js/${f}`);
  for (const f of ['./css/style.css', './index.html', './manifest.webmanifest']) assert.ok(assets.includes(f), `sw.js is missing ${f}`);
  for (const a of assets) if (a !== './') assert.ok(fs.existsSync(path.join(ROOT, a)), `cached file does not exist: ${a}`);
});

test('the manifest is valid and its icons exist', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.name, 'PiispanPELI');
  assert.equal(m.display, 'standalone');
  for (const icon of m.icons) assert.ok(fs.existsSync(path.join(ROOT, icon.src)), `missing icon ${icon.src}`);
});

test('every script is valid JavaScript in strict mode', () => {
  for (const f of jsFiles) {
    const src = read('js/' + f);
    assert.ok(src.includes("'use strict';"), `${f} is not strict`);
    assert.doesNotThrow(() => new Function(src), `${f} does not parse`);
  }
});

test('no leftover debugger statements', () => {
  for (const f of [...jsFiles.map(f => 'js/' + f), 'index.html', 'css/style.css', 'sw.js']) {
    const src = read(f);
    assert.ok(!/debugger;/.test(src), `${f} contains debugger`);
  }
});
