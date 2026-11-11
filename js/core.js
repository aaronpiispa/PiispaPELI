// PiispanPELI · Shared constants, storage, flags, language selection and DOM references.
'use strict';

// ================================ GAME ================================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const INK = '#231d45';
const COLORS = ['#0072ce', '#c0394a', '#169b62', '#ed2939', '#477050', '#fcd116', '#009246', '#2f6fd6', '#ffce00', '#fecc00', '#ef4135', '#ffd700', '#e30a17', '#003399', '#cc0000'];
let NAMES = ['Viro', 'Latvia', 'Irlanti', 'Itävalta', 'Unkari', 'Romania', 'Italia', 'Suomi', 'Saksa', 'Ruotsi', 'Ranska', 'Ukraina', 'Turkki', 'EU', 'USSR'];
// flags, smallest country first: [type, colours, (weights)]
const FLAGS = [
  ['h', ['#0072ce', '#111111', '#ffffff']],
  ['h', ['#9e3039', '#ffffff', '#9e3039'], [2, 1, 2]],
  ['v', ['#169b62', '#ffffff', '#ff883e']],
  ['h', ['#ed2939', '#ffffff', '#ed2939']],
  ['h', ['#ce2939', '#ffffff', '#477050']],
  ['v', ['#002b7f', '#fcd116', '#ce1126']],
  ['v', ['#009246', '#ffffff', '#ce2b37']],
  ['n', ['#ffffff', '#003580']],
  ['h', ['#111111', '#dd0000', '#ffce00']],
  ['n', ['#006aa7', '#fecc00']],
  ['v', ['#0055a4', '#ffffff', '#ef4135']],
  ['h', ['#0057b7', '#ffd700']],
  ['tr', ['#e30a17', '#ffffff']],
  ['eu', ['#003399', '#ffcc00']],
  ['su', ['#cc0000', '#ffd700']]
];
const POINTS = [0, 2, 4, 8, 14, 22, 32, 45, 60, 80, 100, 125, 155, 190, 230];
const MAX_BONUS = 250, DANGER_TIME = 0.15, BTN_Y = DANGER_Y + 2.2, BTN_H = 2.4;
let btnL = false, btnR = false, depL = 0, depR = 0, tgtL = 0, tgtR = 0;
const ABIL_COST = 40000;
let charges = 0, abilProg = 0, wobT = 0;
// admin panel: endless swings, and whether this game used the admin panel (then no records are kept)
let infSwing = false, cheated = false;
// the day of the daily challenge being played (a game that runs past 15:00 still counts for the day it began)
let dayKey = 0;
const abilBtn = document.getElementById('abilBtn');
// Viro, Latvia, Irlanti, Itävalta, Unkari, Romania, Italia (Italia is the biggest that can appear)
const SPAWN_W = [0.112, 0.14, 0.2, 0.12, 0.08, 0.06, 0.04];
const VX0 = -1.5, VX1 = WORLD_W + 1.5, VY0 = -0.55, VY1 = FLOOR_Y + 1.45;
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const FONT = '"Baloo 2", system-ui, -apple-system, "Segoe UI", sans-serif';
// goes up every time a web font finishes loading, so cached bitmaps that contain text get redrawn with the real font
let fontGen = 0;
// set when a frame had to redraw a cached bitmap; such a frame is not used to judge the phone's speed
let heavyFrame = false;

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(c, t, f) { return [0, 1, 2].map(i => Math.round(c[i] + (t[i] - c[i]) * f)); }
function css(c, a) { return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
const PAL = COLORS.map(h => {
  const c = hexRgb(h);
  return { rgb: c, base: css(c), light: css(mix(c, [255, 255, 255], 0.55)), dark: css(mix(c, [38, 22, 70], 0.3)), edge: css(mix(c, [30, 18, 58], 0.55)) };
});

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};

// ------------------------------ languages ------------------------------
// English plus the languages spoken in the countries of the balls
const LANGS = [['fi', 'Suomi'], ['en', 'English'], ['et', 'Eesti'], ['lv', 'Latviešu'], ['ga', 'Gaeilge'], ['de', 'Deutsch'], ['hu', 'Magyar'], ['ro', 'Română'],
  ['it', 'Italiano'], ['sv', 'Svenska'], ['fr', 'Français'], ['uk', 'Українська'], ['tr', 'Türkçe'], ['kl', 'Kalaallisut'], ['da', 'Dansk'], ['ru', 'Русский']];
// the translations themselves live in js/i18n-data.js
let lang = (() => {
  const saved = store.get('piispanpeli-lang', null);
  if (saved && LANGS.some(l => l[0] === saved)) return saved;
  const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'fi').slice(0, 2).toLowerCase();
  const map = { nb: 'da', no: 'da', ka: 'kl', be: 'ru' };
  const c = map[nav] || nav;
  return LANGS.some(l => l[0] === c) ? c : 'en';
})();
function T(k) {
  let s = k;
  if (lang !== 'fi') { const d = I18N[lang], f = lang === 'kl' ? I18N.da : I18N.en; s = (d && d[k]) || (f && f[k]) || (I18N.en && I18N.en[k]) || k; }
  for (let i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i] == null ? '' : String(arguments[i]));
  return s;
}

const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const card = document.getElementById('card');
const pauseBtn = document.getElementById('pauseBtn');
const soundBtn = document.getElementById('soundBtn');

let state = 'menu';
let score = 0, shownScore = 0, maxLevel = 0;
let best = Number(store.get('piispanpeli-best', 0)) || 0;
let bestLevel = Number(store.get('piispanpeli-level', 4)) || 4;
let cur = 0, nxt = 1, cooldown = 0, popT = 1, aimAng = 0, aimPow = 0.45, aiming = false;
let dangerT = 0, combo = 0, comboT = 0, shake = 0, time = 0, menuT = 0, blockedT = 0;
let last = 0, acc = 0;
const parts = [], floaters = [], keys = Object.create(null);
