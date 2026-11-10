// Translations: every text used in the code exists in every language, with matching placeholders.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('../helpers/load');

const I18N = load(['js/i18n-data.js'])('I18N');
const LANGS = ['en', 'et', 'lv', 'ga', 'de', 'hu', 'ro', 'it', 'sv', 'fr', 'uk', 'tr', 'da', 'ru'];

// collect every literal passed to T('...') in the game code (also both sides of T(cond ? 'a' : 'b'))
function usedKeys() {
  const keys = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'js'))) {
    if (f === 'i18n-data.js') continue;
    const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
    const re = /(?<![\w$.])T\(/g;
    let m;
    while ((m = re.exec(src))) {
      let i = m.index + 2, depth = 1, q = null, arg = '';
      for (; i < src.length && depth > 0; i++) {
        const c = src[i];
        if (q) { if (c === '\\') { arg += c + src[++i]; continue; } if (c === q) q = null; }
        else if (c === "'" || c === '"' || c === '`') q = c;
        else if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (c === ',' && depth === 1) break;
        arg += c;
      }
      for (const lit of arg.matchAll(/'((?:[^'\\]|\\.)*)'/g)) if (lit[1] && !/^[a-z]+$/.test(lit[1])) keys.add(lit[1].replace(/\\'/g, "'"));
    }
  }
  return keys;
}
const placeholders = s => (s.match(/\{\d\}/g) || []).sort().join();
const tags = s => (s.match(/<\/?b>/g) || []).length;

test('every language from the menu has a dictionary', () => {
  for (const l of LANGS) assert.ok(I18N[l], `missing language ${l}`);
  assert.ok(I18N.kl, 'Greenlandic falls back to Danish but has its own entry');
});

test('all texts used in the code are translated to English', () => {
  const missing = [...usedKeys()].filter(k => !(k in I18N.en) && !['ZEN', 'Zen'].includes(k));
  assert.deepEqual(missing, [], 'untranslated texts');
});

test('every language has the same texts as English', () => {
  const ref = Object.keys(I18N.en);
  for (const l of LANGS) {
    const missing = ref.filter(k => !(k in I18N[l]) && I18N.en[k] !== k);
    assert.deepEqual(missing, [], `${l} is missing texts`);
  }
});

test('placeholders and bold tags survive translation', () => {
  for (const l of LANGS) for (const [k, v] of Object.entries(I18N[l])) {
    assert.equal(placeholders(v), placeholders(k), `${l}: placeholders differ in "${k}"`);
    assert.equal(tags(v), tags(k), `${l}: <b> tags differ in "${k}"`);
    assert.ok(v.trim().length > 0, `${l}: empty translation for "${k}"`);
  }
});

test('the T() helper fills in values and falls back correctly', () => {
  const get = load(['js/i18n-data.js'], {
    localStorage: { getItem: () => null, setItem() {} }, navigator: { language: 'fi' }, document: { getElementById: () => null }
  });
  // T lives in core.js together with DOM code, so test a copy of its logic on the real data
  const T = (lang, k, ...a) => {
    let s = k;
    if (lang !== 'fi') { const d = I18N[lang], f = lang === 'kl' ? I18N.da : I18N.en; s = (d && d[k]) || (f && f[k]) || (I18N.en && I18N.en[k]) || k; }
    a.forEach((v, i) => { s = s.split('{' + i + '}').join(v == null ? '' : String(v)); });
    return s;
  };
  assert.equal(get('typeof I18N'), 'object');
  assert.equal(T('fi', '{0} pistettä', 120), '120 pistettä');
  assert.equal(T('en', '{0} pistettä', 120), '120 points');
  assert.equal(T('kl', 'Pelaa'), I18N.da.Pelaa, 'Greenlandic uses Danish texts');
  assert.equal(T('kl', 'Grönlanti'), 'Kalaallit Nunaat');
  assert.equal(T('fi', '{0} pistettä', undefined), ' pistettä', 'a missing value never prints a comma');
});
