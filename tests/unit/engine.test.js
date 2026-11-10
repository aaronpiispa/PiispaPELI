// Physics engine: blobs fall, stay inside the wagon, merge, settle and never produce NaN.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../helpers/load');

function engine() {
  const get = load(['js/engine.js']);
  const api = get('({ E, X, Y, RADII, MAXL, WORLD_W, FLOOR_Y, RB, makeBlob, clearAll, stepPhysics, funnelAt })');
  api.run = seconds => { for (let i = 0; i < Math.round(seconds * 60); i++) api.stepPhysics(); };
  api.beadsOk = () => {
    for (let i = 0; i < api.E.NB; i++) if (!Number.isFinite(api.X[i]) || !Number.isFinite(api.Y[i])) return false;
    return true;
  };
  return api;
}
// a small deterministic random generator so the tests are repeatable
function rng(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

test('a single ball falls and comes to rest on the floor', () => {
  const g = engine();
  const b = g.makeBlob(3, 6, 8, 0, 0);
  g.run(4);
  assert.ok(g.beadsOk(), 'no NaN positions');
  assert.ok(Math.abs(b.cy - (g.FLOOR_Y - g.RADII[3])) < 0.25, `rests on the floor (cy=${b.cy.toFixed(2)})`);
  assert.ok(Math.hypot(b.vx, b.vy) < 0.3, `nearly still (v=${Math.hypot(b.vx, b.vy).toFixed(3)})`);
});

test('every bead stays inside the wagon walls and above the floor', () => {
  const g = engine(), r = rng(3);
  for (let i = 0; i < 30; i++) g.makeBlob(Math.floor(r() * 6), 1 + r() * 10, 4 + i * 0.5, (r() - 0.5) * 8, 0);
  g.run(6);
  assert.ok(g.beadsOk());
  for (let i = 0; i < g.E.NB; i++) {
    const fw = g.funnelAt(g.Y[i]);
    assert.ok(g.X[i] >= g.RB - fw - 1e-6 && g.X[i] <= g.WORLD_W - g.RB + fw + 1e-6, `bead ${i} inside the side walls`);
    assert.ok(g.Y[i] <= g.FLOOR_Y - g.RB + 1e-6, `bead ${i} above the floor`);
  }
});

test('two balls of the same country merge into the next bigger one', () => {
  const g = engine();
  g.makeBlob(2, 4.5, 16, 3, 0);
  g.makeBlob(2, 7.5, 16, -3, 0);
  let merged = null;
  for (let i = 0; i < 240 && !merged; i++) {
    g.stepPhysics();
    merged = g.E.events.find(e => e.type === 'merge');
    g.E.events.length = 0;
  }
  assert.ok(merged, 'a merge event happened');
  assert.equal(merged.level, 3);
  assert.equal(g.E.blobs.length, 1);
  assert.equal(g.E.blobs[0].level, 3);
});

test('different countries do not merge', () => {
  const g = engine();
  g.makeBlob(1, 4.5, 16, 3, 0);
  g.makeBlob(2, 7.5, 16, -3, 0);
  g.run(3);
  assert.equal(g.E.blobs.length, 2);
});

test('two of the biggest country disappear with a "max" event', () => {
  const g = engine();
  g.makeBlob(g.MAXL, 3.0, 14, 4, 0);
  g.makeBlob(g.MAXL, 9.0, 14, -4, 0);
  let max = null;
  for (let i = 0; i < 400 && !max; i++) { g.stepPhysics(); max = g.E.events.find(e => e.type === 'max'); g.E.events.length = 0; }
  assert.ok(max, 'max event fired');
  assert.equal(g.E.blobs.length, 0);
});

test('a full wagon settles without exploding and balls do not sink into each other', () => {
  const g = engine(), r = rng(11);
  for (let i = 0; i < 45; i++) g.makeBlob(Math.floor(r() * r() * 8), 0.8 + r() * 10.4, 3 + i * 0.35, 0, 0);
  g.run(8);
  assert.ok(g.beadsOk());
  let fast = 0;
  for (const b of g.E.blobs) if (Math.hypot(b.vx, b.vy) > 2) fast++;
  assert.ok(fast <= 2, `pile is calm (${fast} fast balls)`);
  // centres of different balls should never be closer than a fraction of their radii
  const bl = g.E.blobs;
  for (let a = 0; a < bl.length; a++) for (let b = a + 1; b < bl.length; b++) {
    const d = Math.hypot(bl[a].cx - bl[b].cx, bl[a].cy - bl[b].cy);
    assert.ok(d > (bl[a].R + bl[b].R) * 0.45, `balls ${a} and ${b} overlap too much (d=${d.toFixed(2)})`);
  }
});

test('sideways gravity slides the pile to the side', () => {
  const g = engine();
  for (let i = 0; i < 8; i++) g.makeBlob(2, 4 + (i % 4), 14 - Math.floor(i / 4), 0, 0);
  g.run(2);
  const before = g.E.blobs.reduce((s, b) => s + b.cx, 0) / g.E.blobs.length;
  g.E.gx = 15;
  g.run(3);
  const after = g.E.blobs.reduce((s, b) => s + b.cx, 0) / g.E.blobs.length;
  assert.ok(after > before + 1, `pile moved right (${before.toFixed(2)} -> ${after.toFixed(2)})`);
});

test('clearAll empties the wagon', () => {
  const g = engine();
  g.makeBlob(1, 6, 10, 0, 0);
  g.clearAll();
  assert.equal(g.E.blobs.length, 0);
  assert.equal(g.E.NB, 0);
});
