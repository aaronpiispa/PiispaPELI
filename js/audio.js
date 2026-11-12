// PiispanPELI · Generated lo-fi music and sound effects (Web Audio).
'use strict';

// ------------------------------ sound ------------------------------
// ------------------------------ music, generated live: a song for every stage of every train ------------------------------
const music = (() => {
  let scene = 'eu:0', ac = null, out = null, wet = null, echo = null, padBus = null, drumBus = null, wow = null;
  let nextT = 0, step = 0, muted = false, noise = null;
  const VOL = 0.34, beds = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- plumbing ----
  // panners and effect sends are shared (one per position or amount), so a busy song does not build thousands of nodes
  let panCache = new Map(), sendCache = new Map();
  function pan(p, dest) {
    if (!ac.createStereoPanner) return dest;
    const q = Math.round(p * 10) / 10;
    if (!q) return dest;
    let m = panCache.get(dest); if (!m) panCache.set(dest, m = new Map());
    let n = m.get(q); if (!n) { n = ac.createStereoPanner(); n.pan.value = q; n.connect(dest); m.set(q, n); }
    return n;
  }
  function vca(t, a, peak, dec, dest, hold) {
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + dec);
    g.connect(dest); return g;
  }
  function tone(type, f, t, end, dest, det, wobble) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
    if (wobble !== false && wow) { const w = wow; w.connect(o.detune); o.onended = () => { try { w.disconnect(o.detune); } catch (e) { /* already gone */ } }; }
    o.connect(dest); o.start(t); o.stop(end); return o;
  }
  function noiseSrc(t, end, dest) { const s = ac.createBufferSource(); s.buffer = noise; s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(end); return s; }
  function send(node, amt, bus) {
    bus = bus || wet; const q = Math.round(amt * 20) / 20;
    let m = sendCache.get(bus); if (!m) sendCache.set(bus, m = new Map());
    let g = m.get(q); if (!g) { g = ac.createGain(); g.gain.value = q; g.connect(bus); m.set(q, g); }
    node.connect(g);
  }

  // ---- instruments ----
  // FM electric piano: warm sine with a bell-like tine that fades
  function rhodes(m, t, dur, v, p, rev) {
    const f = mtof(m), end = t + dur + 0.3, o = pan(p || 0, padBus);
    const g = vca(t, 0.006, v, dur, o);
    const car = tone('sine', f, t, end, g);
    const mod = ac.createOscillator(), mg = ac.createGain(); mod.frequency.value = f; mod.connect(mg); mg.connect(car.frequency);
    mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.08, t + 0.6); mod.start(t); mod.stop(end);
    const tine = vca(t, 0.002, v * 0.12, 0.25, o); tone('sine', f * 7.1, t, t + 0.3, tine, 0, false);
    send(g, rev == null ? 0.25 : rev);
  }
  // soft piano-ish pluck with a closing filter
  function keys(m, t, v, p, rev, bright) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(bright || 3200, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.9);
    const g = vca(t, 0.004, v, 1.4, pan(p || 0, out)); f.connect(g);
    tone('triangle', mtof(m), t, t + 1.6, f); tone('sine', mtof(m) * 2, t, t + 0.5, f, 3);
    send(g, rev == null ? 0.35 : rev);
  }
  // wide, slowly breathing pad made of detuned saws
  function pad(notes, t, dur, v, cutoff) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.9;
    f.frequency.setValueAtTime(cutoff * 0.35, t); f.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.45); f.frequency.linearRampToValueAtTime(cutoff * 0.5, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.3); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(padBus); send(g, 0.45);
    notes.forEach((m, i) => { for (const d of [-11, 0, 9]) tone('sawtooth', mtof(m), t, t + dur + 0.05, pan((i % 2 ? 0.4 : -0.4) * (d ? 1 : 0), f), d); });
  }
  function sub(m, t, dur, v, glide) {
    const sh = ac.createWaveShaper(); sh.curve = SAT; const g = vca(t, 0.01, v, dur, out, dur * 0.4);
    sh.connect(g); const o = tone('sine', mtof(m), t, t + dur * 1.5, sh, 0, false);
    if (glide) o.frequency.setValueAtTime(mtof(glide), t), o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
    const g2 = vca(t, 0.005, v * 0.25, dur * 0.5, out); tone('triangle', mtof(m + 12), t, t + dur, g2, 0, false);
  }
  function upright(m, t, dur, v) {
    // plucked double bass for jazz
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    const g = vca(t, 0.006, v, dur, out); f.connect(g);
    tone('triangle', mtof(m), t, t + dur + 0.1, f, 0, false); tone('sine', mtof(m), t, t + dur + 0.1, f, 4, false);
  }
  function synthBass(m, t, dur, v) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(1600, t); f.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = vca(t, 0.004, v, dur, out); f.connect(g);
    tone('sawtooth', mtof(m), t, t + dur + 0.05, f, -6); tone('square', mtof(m - 12), t, t + dur + 0.05, f, 6);
  }
  function bell(m, t, v, p) {
    const o = pan(p == null ? rnd(-0.6, 0.6) : p, out);
    const g = vca(t, 0.002, v, 2.8, o); tone('sine', mtof(m), t, t + 3, g);
    const g2 = vca(t, 0.001, v * 0.4, 0.7, o); tone('sine', mtof(m) * 3.01, t, t + 0.8, g2);
    send(g, 0.7); send(g, 0.25, echo);
  }
  // breathy lead with vibrato (flute / muted sax)
  function lead(m, t, dur, v, kind, p) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = kind === 'sax' ? 1900 : 2600; f.Q.value = kind === 'sax' ? 2 : 0.5;
    const g = ac.createGain(), o = pan(p || 0.15, out);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.06); g.gain.setValueAtTime(v * 0.85, t + Math.max(0.07, dur * 0.7)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.12);
    f.connect(g); g.connect(o); send(g, 0.4); send(g, 0.18, echo);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(14, t + Math.min(0.4, dur)); vib.connect(vg);
    const o1 = tone(kind === 'sax' ? 'sawtooth' : 'triangle', mtof(m), t, t + dur + 0.2, f); vg.connect(o1.detune); vib.start(t); vib.stop(t + dur + 0.2);
    const bn = ac.createBiquadFilter(); bn.type = 'bandpass'; bn.frequency.value = mtof(m) * 2; bn.Q.value = 3; bn.connect(g);
    const nb = ac.createGain(); nb.gain.value = kind === 'sax' ? 0.15 : 0.35; nb.connect(bn); noiseSrc(t, t + dur + 0.2, nb);
  }
  // ---- drums ----
  function kick(t, v, duck) {
    const g = vca(t, 0.003, v, 0.38, drumBus), o = tone('sine', 150, t, t + 0.42, g, 0, false);
    o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
    const cf = ac.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 2500; const cg = vca(t, 0.001, v * 0.25, 0.02, drumBus); cf.connect(cg); noiseSrc(t, t + 0.03, cf);
    if (duck) { padBus.gain.setValueAtTime(1 - duck, t); padBus.gain.setTargetAtTime(1, t + 0.03, 0.13); }
  }
  function snare(t, v, rev, tone2) {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.8;
    const g = vca(t, 0.002, v, 0.2, pan(0.05, drumBus)); bp.connect(g); noiseSrc(t, t + 0.25, bp);
    const bg = vca(t, 0.002, v * 0.6, 0.09, drumBus), o = tone('triangle', tone2 || 190, t, t + 0.12, bg, 0, false); o.frequency.exponentialRampToValueAtTime((tone2 || 190) * 0.75, t + 0.08);
    send(g, rev == null ? 0.25 : rev);
  }
  function brush(t, v, len) {
    const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 4500; hp.Q.value = 0.6;
    const g = ac.createGain(), o = pan(rnd(-0.2, 0.2), drumBus); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + len * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + len);
    hp.connect(g); g.connect(o); noiseSrc(t, t + len + 0.02, hp); send(g, 0.2);
  }
  function hat(t, v, open, p) {
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = open ? 7000 : 8500;
    const g = vca(t, 0.001, v, open ? 0.32 : 0.045, pan(p == null ? 0.3 : p, drumBus)); hp.connect(g); noiseSrc(t, t + (open ? 0.4 : 0.07), hp);
  }
  function ride(t, v) {
    const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 6500; hp.Q.value = 1.5;
    const o = pan(0.35, drumBus), g = vca(t, 0.001, v, 0.7, o); hp.connect(g); noiseSrc(t, t + 0.75, hp);
    const g2 = vca(t, 0.001, v * 0.18, 0.5, o); tone('sine', 3400, t, t + 0.6, g2, 0, false); tone('sine', 5150, t, t + 0.6, g2, 0, false);
  }
  function clap(t, v) {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.2; const g = ac.createGain(); bp.connect(g); g.connect(drumBus); send(g, 0.35);
    g.gain.setValueAtTime(0.0001, t);
    for (const d of [0, 0.011, 0.022]) { g.gain.setValueAtTime(v, t + d); g.gain.exponentialRampToValueAtTime(v * 0.2, t + d + 0.009); }
    g.gain.setValueAtTime(v * 0.7, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); noiseSrc(t, t + 0.25, bp);
  }
  function rim(t, v) {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 5;
    const g = vca(t, 0.001, v, 0.05, pan(-0.2, drumBus)); bp.connect(g); noiseSrc(t, t + 0.07, bp); tone('square', 820, t, t + 0.03, g, 0, false);
  }
  function shaker(t, v) { brush(t, v, 0.07); }

  // ---- harmony helpers ----
  const hum = () => rnd(-0.006, 0.006);
  function strum(ch, t, dur, v, spread, p) { ch.forEach((m, i) => rhodes(m, t + i * (spread || 0.014) + hum(), dur, v * (i ? 0.85 : 1), (p || 0) + (i - ch.length / 2) * 0.12)); }
  // a phrase is a list of [step-in-bar, scale-degree offset, length-in-16ths]
  function phrase(seq, scale, root, s, t, s16, fn) {
    for (const [at, deg, len] of seq) if (at === s) { const oct = Math.floor(deg / scale.length), m = root + scale[((deg % scale.length) + scale.length) % scale.length] + 12 * oct; fn(m, t, len * s16); }
  }
  const sect = st => Math.floor(st / 128) % 4;   // 8-bar sections: intro, groove, melody, breakdown

  // ---- orchestral and folk instruments ----
  // string section: several detuned saws per note with a slow bow attack, vibrato and a soft lowpass
  function strings(notes, t, dur, v, cutoff, att) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.value = cutoff || 2600;
    const g = ac.createGain(), a = att == null ? 0.35 : att;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, dur - 0.25)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.35);
    f.connect(g); g.connect(padBus); send(g, 0.55);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.3; vg.gain.value = 9; vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.4);
    notes.forEach((m, i) => { for (const d of [-8, 0, 7]) { const o = tone('sawtooth', mtof(m), t, t + dur + 0.4, pan((i / Math.max(1, notes.length - 1) - 0.5) * 0.8 + d * 0.02, f), d + rnd(-3, 3), false); vg.connect(o.detune); } });
  }
  // short bowed notes (spiccato), for ostinatos
  function spicc(m, t, v, p) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.18);
    const g = vca(t, 0.008, v, 0.16, pan(p || 0, padBus)); f.connect(g); send(g, 0.35);
    tone('sawtooth', mtof(m), t, t + 0.25, f, -5, false); tone('sawtooth', mtof(m), t, t + 0.25, f, 6, false);
  }
  // pizzicato: a quick pluck of a string
  function pizz(m, t, v, p) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.2);
    const g = vca(t, 0.003, v, 0.35, pan(p || 0, out)); f.connect(g); send(g, 0.4);
    tone('triangle', mtof(m), t, t + 0.45, f, 0, false); tone('sawtooth', mtof(m), t, t + 0.2, f, 4, false);
  }
  // harp or lyre: a bright pluck that rings out
  function harp(m, t, v, p) {
    const o = pan(p == null ? rnd(-0.4, 0.4) : p, out), g = vca(t, 0.002, v, 1.8, o);
    tone('triangle', mtof(m), t, t + 2, g, 0, false);
    const g2 = vca(t, 0.001, v * 0.5, 0.35, o); tone('sine', mtof(m) * 2, t, t + 0.4, g2, 2, false);
    const g3 = vca(t, 0.001, v * 0.2, 0.08, o); tone('square', mtof(m) * 3, t, t + 0.1, g3, 0, false);
    send(g, 0.55);
  }
  // harpsichord: two bright plucked strings an octave apart
  function harpsi(m, t, v, p) {
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    const g = vca(t, 0.002, v, 0.9, pan(p || 0, out)); hp.connect(g); send(g, 0.3);
    tone('sawtooth', mtof(m), t, t + 1, hp, -3, false); tone('square', mtof(m + 12), t, t + 0.6, hp, 4, false);
  }
  // brass: a saw whose filter opens as the player blows, with a little scoop up into the note
  function brass(notes, t, dur, v, bright) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(bright || 2200, t + 0.12); f.frequency.setTargetAtTime((bright || 2200) * 0.6, t + 0.2, 0.4);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.07); g.gain.setValueAtTime(v * 0.85, t + Math.max(0.1, dur - 0.1)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.18);
    f.connect(g); g.connect(out); send(g, 0.4);
    notes.forEach((m, i) => { for (const d of [-6, 5]) { const o = tone('sawtooth', mtof(m), t, t + dur + 0.25, pan((i - notes.length / 2) * 0.15, f), d, false); o.frequency.setValueAtTime(mtof(m - 0.6), t); o.frequency.linearRampToValueAtTime(mtof(m), t + 0.06); } });
  }
  // choir "aah": saws through two vowel formants, with vibrato
  function choir(notes, t, dur, v) {
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.5); g.gain.setValueAtTime(v, t + Math.max(0.5, dur - 0.4)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
    g.connect(padBus); send(g, 0.7);
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 780; f1.Q.value = 5; f1.connect(g);
    const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 6; f2.connect(g);
    const f3 = ac.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2600; f3.Q.value = 8; const g3 = ac.createGain(); g3.gain.value = 0.4; f3.connect(g3); g3.connect(g);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 4.8; vg.gain.value = 12; vib.connect(vg); vib.start(t); vib.stop(t + dur + 0.6);
    notes.forEach(m => { for (const d of [-10, 0, 11]) { const o = tone('sawtooth', mtof(m), t, t + dur + 0.6, f1, d, false); o.connect(f2); o.connect(f3); vg.connect(o.detune); } });
  }
  // a soft square-wave pluck for synth arpeggios
  function pluck(m, t, v, p, bright) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(bright || 3600, t); f.frequency.exponentialRampToValueAtTime(350, t + 0.25);
    const g = vca(t, 0.003, v, 0.32, pan(p || 0, out)); f.connect(g); send(g, 0.35);
    tone('sawtooth', mtof(m), t, t + 0.4, f, 5);
  }
  // a low drone, like a hurdy-gurdy or bagpipe bass
  function drone(notes, t, dur, v) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 2;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.8); g.gain.setValueAtTime(v, t + dur - 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    f.connect(g); g.connect(padBus); send(g, 0.3);
    notes.forEach(m => { tone('sawtooth', mtof(m), t, t + dur + 0.4, f, -4, false); tone('sawtooth', mtof(m), t, t + dur + 0.4, f, 5, false); });
  }
  // big drums: taiko or timpani (a deep pitched thump) and a frame drum
  function taiko(t, v, f0) {
    const g = vca(t, 0.002, v, 0.7, drumBus), o = tone('sine', f0 || 90, t, t + 0.8, g, 0, false);
    o.frequency.setValueAtTime((f0 || 90) * 1.6, t); o.frequency.exponentialRampToValueAtTime(f0 || 90, t + 0.05); o.frequency.exponentialRampToValueAtTime((f0 || 90) * 0.7, t + 0.6);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const ng = vca(t, 0.001, v * 0.5, 0.12, drumBus); lp.connect(ng); noiseSrc(t, t + 0.15, lp);
    send(g, 0.45);
  }
  function frame(t, v) {
    const g = vca(t, 0.002, v, 0.25, pan(-0.15, drumBus)), o = tone('sine', 120, t, t + 0.3, g, 0, false); o.frequency.exponentialRampToValueAtTime(75, t + 0.2);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 1; const ng = vca(t, 0.001, v * 0.6, 0.06, drumBus); bp.connect(ng); noiseSrc(t, t + 0.08, bp);
    send(g, 0.3);
  }
  function cymbal(t, v) {
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    const g = vca(t, 0.004, v, 2.2, pan(0.2, drumBus)); hp.connect(g); noiseSrc(t, t + 2.3, hp); send(g, 0.4);
  }
  // a little marimba / glockenspiel
  function mallet(m, t, v, p) {
    const o = pan(p || 0, out), g = vca(t, 0.001, v, 0.5, o); tone('sine', mtof(m), t, t + 0.6, g, 0, false);
    const g2 = vca(t, 0.001, v * 0.35, 0.12, o); tone('sine', mtof(m) * 4, t, t + 0.15, g2, 0, false); send(g, 0.4);
  }

  // scale degree -> midi note
  const deg = (scale, root, d) => root + scale[((d % scale.length) + scale.length) % scale.length] + 12 * Math.floor(d / scale.length);
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], DOR = [0, 2, 3, 5, 7, 9, 10], PHR = [0, 1, 3, 5, 7, 8, 10];
  // play a melody written as [step, degree, length in 16ths] for one bar
  function line(seq, s, scale, root, t, s16, fn) { for (const [at, d, len] of seq) if (at === s && d != null) fn(deg(scale, root, d), t, len * s16); }

  // ---- the songs: one for each stage of each train ----
  const TR = {
    // EU-juna, taso 1: bright orchestral pop over Europe
    'eu:0': { bpm: 100, swing: 0, lp: 7500, bed: 'none', play(st, t, beat) {
      const P = [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], R = [48, 45, 41, 43];   // C  Am  F  G
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = P[bar].map(x => x + 60);
      if (s === 0) strings(ch.map(m => m - 12), t, beat * 3.9, S === 0 ? 0.018 : 0.026, S === 2 ? 3200 : 2200, 0.4);
      if (s % 2 === 0) pizz((s % 4 === 0 ? ch[0] : ch[(s / 2) % 3 + 0]) - (s % 8 < 4 ? 12 : 0), t, 0.11, (s % 4 ? 0.3 : -0.3));
      if (s === 0 || s === 8) sub(R[bar] - 12, t, beat * 1.8, 0.34); if (s === 12 && bar === 3) sub(R[bar] - 10, t, beat * 0.9, 0.3);
      if (S !== 0) {
        if (s === 0 || s === 6 || s === 10) kick(t, 0.6, 0.15);
        if (s === 4 || s === 12) snare(t, 0.2, 0.25);
        if (s % 2 === 0) hat(t, s % 4 ? 0.03 : 0.05, false, 0.3);
      }
      const MEL = [[[0, 7, 3], [3, 8, 1], [4, 9, 4], [8, 8, 2], [10, 7, 2], [12, 6, 4]], [[0, 5, 3], [3, 6, 1], [4, 7, 6], [12, 4, 4]],
        [[0, 3, 2], [2, 4, 2], [4, 5, 4], [8, 7, 3], [11, 6, 1], [12, 5, 4]], [[0, 4, 3], [3, 5, 1], [4, 6, 4], [8, 4, 8]]];
      if (S === 1 || S === 2) line(MEL[bar], s, MAJ, 72, t, s16, (m, tt, d) => keys(m, tt + hum(), 0.12, 0.15, 0.4, 3800));
      if (S === 2) line(MEL[bar], s, MAJ, 60, t, s16, (m, tt, d) => lead(m, tt, d, 0.035, 'flute', -0.3));
      if (S === 3 && s % 4 === 2) bell(ch[(s / 4 + bar) % 3] + 24, t, 0.04);
      if (s === 0 && bar === 0 && S === 1) cymbal(t, 0.05);
    } },
    // EU-juna, taso 2: drifting through the Solar System — synth arpeggios, warm pads, a soft pulse
    'eu:1': { bpm: 92, swing: 0, lp: 6800, bed: 'none', play(st, t, beat) {
      const C = [[50, 57, 60, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]], R = [38, 34, 31, 33];   // Dm  Bb  Gm  A
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) { pad(ch.map(m => m + 12), t, beat * 4.1, 0.022, S === 0 ? 1200 : 2600); sub(R[bar], t, beat * 3.6, 0.36); }
      const AR = [0, 1, 2, 3, 2, 1, 2, 3];
      if (S !== 0 || s >= 8) pluck(ch[AR[s % 8]] + 24, t, 0.06, (s % 2 ? 0.45 : -0.45), S === 2 ? 4200 : 2600);
      if (S === 1 || S === 2) { if (s % 4 === 0) kick(t, 0.5, 0.35); if (s === 4 || s === 12) clap(t, 0.12); if (s % 2) hat(t, 0.025, false, 0.4); }
      if (S >= 2) line([[[0, 4, 6], [6, 3, 2], [8, 2, 8]], [[0, 1, 4], [4, 2, 4], [8, 3, 8]], [[0, 0, 6], [6, 1, 2], [8, -1, 8]], [[0, 1, 12], [12, 2, 4]]][bar], s, MIN, 74, t, s16, (m, tt, d) => lead(m, tt, d, 0.045, 'flute', 0.1));
      if (S === 3 && s === 0) choir([ch[1] + 12, ch[2] + 12, ch[3] + 12], t, beat * 4, 0.018);
      if (s % 4 === 2 && Math.random() < 0.25) bell(pick([81, 84, 86, 89, 93]), t, 0.035);
    } },
    // EU-juna, taso 3: the galaxy — an epic cinematic piece with taiko drums, choir, strings and brass
    'eu:2': { bpm: 84, swing: 0, lp: 7200, bed: 'none', play(st, t, beat) {
      const C = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], R = [38, 34, 41, 36];   // Dm  Bb  F  C
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s % 2 === 0 && S !== 0) spicc(ch[[0, 1, 2, 1][(s / 2) % 4]], t, 0.07, (s % 4 ? 0.35 : -0.35));
      if (s === 0) { strings(ch, t, beat * 4, S === 0 ? 0.016 : 0.022, 2400); sub(R[bar] - 12, t, beat * 3.8, 0.4); }
      if (S !== 0) { if ([0, 3, 6, 8, 11, 14].includes(s)) taiko(t, s === 0 ? 0.7 : 0.45, s === 0 ? 70 : 95); if (s === 4 || s === 12) frame(t, 0.25); }
      else if (s === 0) taiko(t, 0.5, 65);
      if (S >= 2 && s === 0) choir(ch.map(m => m + 12), t, beat * 4, 0.022);
      if (S === 2) line([[[0, 4, 8], [8, 3, 4], [12, 2, 4]], [[0, 1, 8], [8, 2, 8]], [[0, 5, 8], [8, 4, 4], [12, 3, 4]], [[0, 4, 16]]][bar], s, MIN, 62, t, s16, (m, tt, d) => brass([m], tt, d, 0.05, 2400));
      if (S === 3) { if (s === 0) brass(ch.map(m => m + 12), t, beat * 3.5, 0.035, 1800); if (s === 0 && bar === 0) cymbal(t, 0.06); }
    } },
    // Viikinki, taso 1: Nordic folk — a drone, a frame drum, a lyre and a wooden flute
    'viking:0': { amp: 3, bpm: 96, swing: 0.12, lp: 6000, bed: 'none', play(st, t, beat) {
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ROOT = 62;   // D dorian
      if (st % 64 === 0) drone([38, 45], t, beat * 16, 0.032);
      if (S !== 0) { if (s === 0 || s === 6 || s === 10) frame(t, s ? 0.3 : 0.45); if (s === 12) frame(t, 0.18); if (s % 4 === 2) shaker(t, 0.04); }
      const ARP = [[0, 4, 7, 4], [0, 3, 7, 3], [-2, 3, 5, 3], [0, 4, 6, 4]][bar];
      if (s % 2 === 0) harp(deg(DOR, 50, ARP[(s / 2) % 4]), t, 0.12);
      const MEL = [[[0, 4, 2], [2, 5, 2], [4, 7, 4], [8, 6, 2], [10, 4, 2], [12, 3, 4]], [[0, 2, 2], [2, 3, 2], [4, 4, 6], [10, 3, 2], [12, 2, 4]],
        [[0, 0, 4], [4, 2, 2], [6, 3, 2], [8, 4, 4], [12, 6, 4]], [[0, 5, 2], [2, 4, 2], [4, 3, 4], [8, 1, 4], [12, 0, 4]]];
      if (S >= 1) line(MEL[bar], s, DOR, ROOT, t, s16, (m, tt, d) => lead(m, tt + hum(), d, S === 3 ? 0.04 : 0.055, 'flute', 0.1));
      if (S === 3 && s === 0) strings([50, 57, 62].map(m => m + (bar % 2 ? -2 : 0)), t, beat * 4, 0.016, 1800);
    } },
    // Viikinki, taso 2: the creatures — a dark march with war drums, low horns and a growling drone
    'viking:1': { bpm: 76, swing: 0, lp: 5200, bed: 'none', play(st, t, beat) {
      const C = [[45, 48, 52], [46, 50, 53], [43, 46, 50], [45, 48, 52]];   // Am  Bb  Gm  Am (phrygian colour)
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (st % 64 === 0) drone([33, 40], t, beat * 16, 0.028);
      if ([0, 3, 8, 10, 11].includes(s)) taiko(t, s === 0 || s === 8 ? 0.75 : 0.45, s === 0 ? 62 : 80);
      if (S !== 0 && (s === 4 || s === 12)) frame(t, 0.3);
      if (s === 0 && S !== 0) sub(ch[0] - 12, t, beat * 3.8, 0.42);
      if (S >= 1) line([[[0, 0, 6], [6, 1, 2], [8, 0, 8]], [[0, 1, 6], [6, 2, 2], [8, 1, 8]], [[0, -2, 6], [6, -1, 2], [8, -2, 8]], [[0, 0, 4], [4, 2, 4], [8, 4, 8]]][bar], s, PHR, 45, t, s16, (m, tt, d) => brass([m, m + 7], tt, d, 0.045, 1300));
      if (S >= 2 && s === 0) choir([ch[0], ch[2]], t, beat * 4, 0.02);
      if (S === 3 && s % 4 === 0) spicc(ch[(s / 4) % 3] + 12, t, 0.06);
    } },
    // Viikinki, taso 3: the nine worlds — heroic and epic, choir and horns over pounding drums
    'viking:2': { bpm: 100, swing: 0, lp: 7500, bed: 'none', play(st, t, beat) {
      const C = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], R = [38, 34, 36, 33];   // Dm  Bb  C  A
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) { strings(ch.map(m => m + 12), t, beat * 4, 0.022, 3000, 0.2); sub(R[bar] - 12, t, beat * 3.6, 0.4); }
      if (S !== 0) { if ([0, 4, 8, 10, 12].includes(s)) taiko(t, s % 8 === 0 ? 0.65 : 0.4, s % 8 ? 100 : 72); if (s % 2 === 0) frame(t, 0.12); }
      if (s % 2 === 0 && S >= 1) harp(ch[(s / 2) % 3] + 24, t, 0.05);
      if (S >= 1 && s === 0) choir(ch.map(m => m + 12), t, beat * 4, S === 3 ? 0.026 : 0.018);
      if (S >= 2) line([[[0, 4, 4], [4, 5, 2], [6, 6, 2], [8, 7, 6], [14, 6, 2]], [[0, 5, 4], [4, 4, 4], [8, 3, 8]], [[0, 2, 4], [4, 3, 2], [6, 4, 2], [8, 5, 4], [12, 6, 4]], [[0, 4, 12], [12, 3, 4]]][bar],
        s, MIN, 62, t, s16, (m, tt, d) => brass([m, m - 12], tt, d, 0.05, 2600));
      if (S === 2 && s === 0 && bar === 0) cymbal(t, 0.06);
    } },
    // Sydän, taso 1: sweet, sunny pop with handclaps and a glockenspiel tune
    'heart:0': { bpm: 112, swing: 0.08, lp: 8000, bed: 'none', play(st, t, beat) {
      const C = [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]], R = [41, 38, 34, 36];   // Fmaj7  Dm7  Bbmaj7  C7
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0 || s === 6 || s === 10) strum(ch.map(m => m + 12), t, beat * (s ? 0.9 : 1.4), 0.05, 0.01);
      if ([0, 3, 8, 11].includes(s)) sub(R[bar] + (s === 11 ? 7 : 0), t, beat * 0.9, 0.34);
      if (S !== 0) { if (s % 8 === 0 || s === 11) kick(t, 0.6, 0.2); if (s === 4 || s === 12) { clap(t, 0.2); snare(t, 0.08, 0.2); } if (s % 2 === 0) hat(t, 0.04, s === 14, 0.3); }
      const MEL = [[[0, 4, 2], [2, 5, 2], [4, 6, 2], [6, 7, 4], [12, 6, 2], [14, 5, 2]], [[0, 4, 4], [4, 2, 2], [6, 4, 6], [12, 2, 4]], [[0, 3, 2], [2, 4, 2], [4, 5, 4], [8, 6, 2], [10, 5, 2], [12, 4, 4]], [[0, 5, 4], [4, 4, 4], [8, 6, 8]]];
      if (S >= 1) line(MEL[bar], s, MAJ, 77, t, s16, (m, tt, d) => mallet(m, tt, 0.09, 0.2));
      if (S === 2) line(MEL[bar], s, MAJ, 65, t, s16, (m, tt, d) => keys(m, tt, 0.06, -0.2, 0.3, 3000));
      if (S === 3 && s === 0) strings(ch.map(m => m + 12), t, beat * 4, 0.014, 3000);
    } },
    // Sydän, taso 2: glittering synth-pop for the jewel hearts
    'heart:1': { amp: 1.7, bpm: 118, swing: 0, lp: 9000, bed: 'none', play(st, t, beat) {
      const C = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], R = [45, 41, 36, 43];   // Am  F  C  G
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) pad(ch.map(m => m + 12), t, beat * 4.05, 0.022, S === 0 ? 1600 : 3600);
      if (s % 2 === 0) synthBass(R[bar] - 12 + (s % 4 === 2 ? 12 : 0), t, s16 * 1.5, 0.16);
      pluck(ch[[0, 1, 2, 1][s % 4]] + (s % 8 < 4 ? 24 : 12), t, 0.05, (s % 2 ? 0.5 : -0.5), 5000);
      if (S !== 0) { if (s % 4 === 0) kick(t, 0.75, 0.45); if (s === 4 || s === 12) clap(t, 0.22); if (s % 4 === 2) hat(t, 0.07, true, 0.35); }
      if (S >= 2) line([[[0, 4, 3], [3, 4, 1], [4, 5, 4], [8, 7, 4], [12, 6, 4]], [[0, 5, 6], [6, 4, 2], [8, 2, 8]], [[0, 2, 3], [3, 3, 1], [4, 4, 4], [8, 6, 4], [12, 5, 4]], [[0, 4, 16]]][bar],
        s, MIN, 69, t, s16, (m, tt, d) => bell(m + 12, tt, 0.06, 0.1));
      if (s % 4 === 2 && Math.random() < 0.3) bell(pick([88, 91, 93, 96]), t, 0.025);
    } },
    // Sydän, taso 3: dreamy cosmic love song — soft pads, Rhodes and a slow heartbeat
    'heart:2': { bpm: 78, swing: 0.1, lp: 6000, bed: 'none', play(st, t, beat) {
      const C = [[53, 57, 60, 64, 67], [50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [48, 53, 55, 58, 62]];   // Fmaj9  Dm9  Bbmaj9  C9sus
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) { pad(ch.slice(1), t, beat * 4.4, 0.026, S === 2 ? 2600 : 1500); sub(ch[0] - 12, t, beat * 3.5, 0.32); strum(ch, t, beat * 3, 0.05, 0.03); }
      if (s === 8 && S !== 0) strum(ch.slice(2).map(m => m + 12), t, beat * 1.5, 0.03, 0.02);
      if (S === 1 || S === 2) { if (s === 0 || s === 3) kick(t, s ? 0.35 : 0.55, 0.2); if (s === 8) brush(t, 0.08, 0.25); if (s % 4 === 2) hat(t, 0.025); }
      if (S >= 2) line([[[0, 7, 6], [6, 8, 2], [8, 9, 8]], [[0, 7, 4], [4, 6, 4], [8, 5, 8]], [[0, 4, 6], [6, 5, 2], [8, 6, 8]], [[0, 7, 12]]][bar], s, MAJ, 65, t, s16, (m, tt, d) => bell(m, tt, 0.07, -0.15));
      if (s % 2 === 0 && Math.random() < 0.18) bell(pick([84, 86, 88, 91, 93]), t, 0.03);
    } },
    // Korkeakoulu, taso 1: playful baroque — harpsichord arpeggios, pizzicato bass and a flute
    'uni:0': { amp: 3, bpm: 108, swing: 0, lp: 8000, bed: 'none', play(st, t, beat) {
      const C = [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], R = [43, 40, 36, 38];   // G  Em  C  D
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      const ALB = [0, 2, 1, 2];   // Alberti bass: low, high, middle, high
      if (s % 2 === 0) harpsi(ch[ALB[(s / 2) % 4]], t, 0.09, -0.2);
      if (s % 4 === 0) pizz(R[bar] - (s % 8 ? 0 : 12), t, 0.2, 0.2);
      const MEL = [[[0, 4, 2], [2, 3, 2], [4, 4, 2], [6, 6, 2], [8, 7, 4], [12, 6, 2], [14, 4, 2]], [[0, 5, 2], [2, 4, 2], [4, 2, 4], [8, 4, 2], [10, 2, 2], [12, 1, 4]],
        [[0, 2, 2], [2, 3, 2], [4, 4, 2], [6, 5, 2], [8, 6, 4], [12, 5, 2], [14, 4, 2]], [[0, 3, 2], [2, 4, 2], [4, 5, 2], [6, 4, 2], [8, 3, 8]]];
      if (S >= 1) line(MEL[bar], s, MAJ, 67, t, s16, (m, tt, d) => lead(m + 12, tt, d * 0.9, 0.045, 'flute', 0.25));
      if (S === 2) line(MEL[bar], s, MAJ, 67, t, s16, (m, tt, d) => harpsi(m, tt, 0.04, 0.3));
      if (S === 3 && s === 0) strings(ch.map(m => m + 12), t, beat * 4, 0.015, 2800);
      if (S !== 0 && (s === 4 || s === 12)) rim(t, 0.04);
    } },
    // Korkeakoulu, taso 2: the physics lab — a tight electronic sequence with blips and a punchy beat
    'uni:1': { amp: 1.7, bpm: 120, swing: 0, lp: 8500, bed: 'none', play(st, t, beat) {
      const C = [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]], R = [38, 36, 34, 33];   // Dm  C  Bb  A
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      const SEQ = [0, 12, 7, 12, 3, 12, 7, 15];
      pluck(ch[0] + SEQ[s % 8] + (S === 2 ? 12 : 0), t, 0.065, (s % 2 ? 0.35 : -0.35), S === 0 ? 2400 : 3800);
      if (s % 2 === 0) synthBass(R[bar] - 12 + (s % 8 === 6 ? 12 : 0), t, s16 * 1.6, 0.17);
      if (S !== 0) { if (s % 4 === 0) kick(t, 0.8, 0.4); if (s === 4 || s === 12) { clap(t, 0.2); snare(t, 0.1, 0.1); } hat(t, s % 2 ? 0.03 : 0.05, s % 4 === 2, s % 2 ? 0.4 : -0.4); }
      if (s === 0 && S >= 2) pad(ch.map(m => m + 12), t, beat * 4, 0.018, 2400);
      if (S === 3 && s % 4 === 3) bell(pick([86, 89, 93, 98]), t, 0.03);
    } },
    // Korkeakoulu, taso 3: the university — a grand ceremonial march with brass, timpani and strings
    'uni:2': { bpm: 92, swing: 0, lp: 8000, bed: 'none', play(st, t, beat) {
      const C = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]], R = [36, 41, 43, 36];   // C  F  G  C
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) { strings(ch.map(m => m + 12), t, beat * 4, 0.02, 3000, 0.15); sub(R[bar] - 12, t, beat * 1.8, 0.38); }
      if (s === 8) sub(R[bar] - 5, t, beat * 1.8, 0.32);
      if (S !== 0) { if (s % 8 === 0) taiko(t, 0.55, R[bar] < 40 ? 65 : 85); if (s === 4 || s === 12) snare(t, 0.14, 0.2); if (s === 14) snare(t, 0.06, 0.1); }
      const MEL = [[[0, 0, 4], [4, 2, 4], [8, 4, 6], [14, 4, 2]], [[0, 5, 4], [4, 4, 4], [8, 3, 6], [14, 3, 2]], [[0, 4, 4], [4, 6, 2], [6, 5, 2], [8, 4, 4], [12, 1, 4]], [[0, 2, 4], [4, 1, 4], [8, 0, 8]]];
      if (S >= 1) line(MEL[bar], s, MAJ, 60, t, s16, (m, tt, d) => brass([m + 12, m + 4 + 12], tt, d, 0.045, 2600));
      if (S === 3 && s === 0 && bar === 0) cymbal(t, 0.07);
      if (S >= 2 && s % 4 === 2) pizz(ch[(s / 4 | 0) % 3] + 12, t, 0.07);
    } }
  };
  const SCENES_MUSIC = Object.keys(TR);
  const SAT = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; SAT[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
  const T = () => TR[scene] || TR['eu:0'];
  // each song has its own loudness correction so that all of them sit at about the same level
  function vol() { return muted ? 0 : VOL * (T().amp || 1); }
  function loopBuf(fn, sec, ch) { const bf = ac.createBuffer(ch || 1, Math.floor(ac.sampleRate * sec), ac.sampleRate); for (let c = 0; c < (ch || 1); c++) fn(bf.getChannelData(c), ac.sampleRate, c); return bf; }
  function start(actx, dest) {
    if (ac) return;
    ac = actx; panCache = new Map(); sendCache = new Map();
    out = ac.createGain(); out.gain.value = 0;
    // master: gentle tape saturation, then a lowpass that sets each song's warmth
    const sat = ac.createWaveShaper(); sat.curve = SAT;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = T().lp;
    out.lp = lp; out.connect(sat); sat.connect(lp); lp.connect(dest);
    padBus = ac.createGain(); padBus.connect(out);
    drumBus = ac.createGain(); drumBus.gain.value = 0.9; drumBus.connect(out);
    // tape wow: a slow wobble on every tonal oscillator
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.45; wow = ac.createGain(); wow.gain.value = 7; lfo.connect(wow); lfo.start();
    // reverb from a generated stereo impulse
    const rv = ac.createConvolver();
    rv.buffer = loopBuf((d, sr) => { for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }, 2.8, 2);
    wet = ac.createGain(); wet.gain.value = 0.5; const rlp = ac.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 3800;
    wet.connect(rlp); rlp.connect(rv); rv.connect(out);
    // ping-pong-ish echo
    echo = ac.createGain(); const dl = ac.createDelay(1.5); dl.delayTime.value = 0.375; const fb = ac.createGain(); fb.gain.value = 0.4; const ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 2400;
    echo.connect(dl); dl.connect(ef); ef.connect(fb); fb.connect(dl); ef.connect(pan(0.5, out)); ef.connect(wet);
    noise = loopBuf(d => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }, 2);
    const mk = (name, buf, g) => { const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const gn = ac.createGain(); gn.gain.value = 0; src.connect(gn); gn.connect(out); src.start(); beds[name] = { gn, g }; };
    mk('vinyl', loopBuf(d => { let b = 0; for (let i = 0; i < d.length; i++) { b = b * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = b * 0.45 + (Math.random() < 0.0008 ? (Math.random() - 0.5) * 1.4 : 0); } }, 3), 0.2);
    mk('rain', loopBuf(d => { let b = 0, c = 0; for (let i = 0; i < d.length; i++) { b = b * 0.6 + (Math.random() * 2 - 1) * 0.4; c = c * 0.999 + (Math.random() * 2 - 1) * 0.001; d[i] = b * 0.3 + c * 4 + (Math.random() < 0.003 ? (Math.random() - 0.5) * 0.7 : 0); } }, 4), 0.32);
    mk('train', loopBuf((d, sr) => { let b = 0; for (let i = 0; i < d.length; i++) { b = b * 0.995 + (Math.random() * 2 - 1) * 0.005; const ph = (i / sr) % (60 / 108 * 2); d[i] = b * 3 + (ph < 0.03 || (ph > 0.25 && ph < 0.28) ? (Math.random() - 0.5) * 0.22 : 0); } }, 60 / 108 * 8), 0.3);
    applyTrack(true);
    nextT = ac.currentTime + 0.2;
    if (!actx.startRendering) setInterval(schedule, 50);
  }
  // for checking the songs without speakers: render a song into a buffer (only on a page whose sound has not started)
  function renderOffline(key, sec) {
    const off = new OfflineAudioContext(2, Math.round(44100 * sec), 44100);
    scene = key; start(off, off.destination);
    out.gain.cancelScheduledValues(0); out.gain.value = VOL * (T().amp || 1);
    const tr = T(), beat = 60 / tr.bpm, s16 = beat / 4;
    step = 0; nextT = 0.05;
    while (nextT < sec - 0.5) { tr.play(step, nextT, beat); nextT += step % 2 === 0 ? s16 * (1 + tr.swing) : s16 * (1 - tr.swing); step = (step + 1) % 512; }
    return off.startRendering();
  }
  function applyTrack(instant) {
    if (!ac) return;
    const t = ac.currentTime, tr = T();
    out.gain.setTargetAtTime(vol(), t, instant ? 1.2 : 0.4);
    out.lp.frequency.setTargetAtTime(tr.lp, t, 0.3);
    for (const k in beds) beds[k].gn.gain.setTargetAtTime(k === tr.bed ? beds[k].g : 0, t, 0.5);
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    // the song follows the train and the stage being played (or shown in the menu)
    const want = typeof musicScene === 'function' ? musicScene() : scene;
    if (want !== scene && TR[want]) {
      scene = want; step = 0;
      const t0 = ac.currentTime; out.gain.cancelScheduledValues(t0); out.gain.setValueAtTime(out.gain.value, t0); out.gain.linearRampToValueAtTime(0.0001, t0 + 0.25);
      nextT = Math.max(nextT, t0 + 0.3); out.gain.setTargetAtTime(vol(), t0 + 0.3, 0.6);
      out.lp.frequency.setTargetAtTime(T().lp, t0, 0.3);
      for (const k in beds) beds[k].gn.gain.setTargetAtTime(k === T().bed ? beds[k].g : 0, t0, 0.5);
    }
    const tr = T(), beat = 60 / tr.bpm, s16 = beat / 4, now = ac.currentTime;
    // the timer was late (a background tab, a busy moment): notes whose time has passed are skipped, not played
    // all at once. After a long gap the song simply continues from where it was.
    if (nextT < now - 4) nextT = now + 0.05;
    while (nextT < now + 0.02) { nextT += step % 2 === 0 ? s16 * (1 + tr.swing) : s16 * (1 - tr.swing); step = (step + 1) % 512; }
    while (nextT < now + 0.3) {
      tr.play(step, nextT, beat);
      nextT += step % 2 === 0 ? s16 * (1 + tr.swing) : s16 * (1 - tr.swing);
      step = (step + 1) % 512;
    }
  }
  return {
    start,
    songs: SCENES_MUSIC, renderOffline,
    get scene() { return scene; },
    setMuted(m) { muted = m; if (ac) applyTrack(false); },
    // called when the page is shown again: start from now and fade in, so nothing old bursts out
    wake() {
      if (!ac) return;
      // notes already queued before the pause still play; only fill in from where they end, never twice
      const t = ac.currentTime; nextT = Math.max(nextT, t + 0.05);
      out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(0.0001, t); out.gain.setTargetAtTime(vol(), t + 0.05, 0.35);
    }
  };
})();

const sfx = (() => {
  let ac = null, master = null, awake = true, muted = !!store.get('piispanpeli-muted', false), volume = Number(store.get('piispanpeli-volume', 0.8));
  if (!(volume >= 0 && volume <= 1)) volume = 0.8;
  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ac = new AC();
        const comp = ac.createDynamicsCompressor();
        master = ac.createGain(); master.gain.value = 0.9 * volume;
        master.connect(comp); comp.connect(ac.destination);
        // iPhone: play one silent sample inside the tap so later sounds are allowed
        const buf = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource();
        src.buffer = buf; src.connect(ac.destination); src.start(0);
        music.setMuted(muted); music.start(ac, master);
      } catch (e) { ac = null; return; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
  }
  function tone(f0, f1, dur, type, vol, delay) {
    if (muted || !ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  return {
    ensure,
    get muted() { return muted; },
    get volume() { return volume; },
    setVolume(v) { volume = v; store.set('piispanpeli-volume', v); if (master) master.gain.setTargetAtTime(0.9 * v, ac.currentTime, 0.05); },
    toggle() { muted = !muted; store.set('piispanpeli-muted', muted); music.setMuted(muted); if (!muted) ensure(); },
    // the page was hidden or shown. Coming back quickly could arrive while the pause was still being carried out,
    // which used to leave the sound paused; now the last wish always wins.
    suspend() {
      awake = false;
      if (ac && ac.state === 'running') ac.suspend().then(() => { if (awake) ac.resume().then(() => music.wake()).catch(() => {}); }).catch(() => {});
    },
    resume() {
      awake = true;
      if (ac && ac.state !== 'closed') ac.resume().then(() => music.wake()).catch(() => {});
    },
    shoot(p) { tone(380 + p * 120, 150, 0.14, 'sine', 0.12 + p * 0.1); },
    merge(l) { const f = 240 * Math.pow(1.12, l); tone(f * 0.8, f * 1.6, 0.18, 'sine', 0.22); tone(f * 1.6, f * 2.4, 0.1, 'triangle', 0.06, 0.04); },
    // a soft swish when a menu screen opens
    whoosh() { if (ac) tone(260, 520, 0.12, 'sine', 0.05); },
    // a soap bubble popping
    tick() { if (ac) tone(1900, 1500, 0.025, 'square', 0.03); },
    pop() { tone(900, 1700, 0.06, 'sine', 0.2); tone(1400, 700, 0.07, 'triangle', 0.07, 0.02); },
    mega() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.02, 0.28, 'triangle', 0.15, i * 0.08)); },
    blocked() { tone(180, 120, 0.15, 'square', 0.04); },
    over() { tone(420, 110, 0.7, 'triangle', 0.18); tone(300, 90, 0.8, 'sine', 0.12, 0.12); }
  };
})();
