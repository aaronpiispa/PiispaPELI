// PiispanPELI · Generated lo-fi music and sound effects (Web Audio).
'use strict';

// ------------------------------ sound ------------------------------
// ------------------------------ lo-fi music, generated live: five different songs ------------------------------
const music = (() => {
  let track = Number(store.get('piispanpeli-track', 0)), ac = null, out = null, wet = null, echo = null, padBus = null, drumBus = null, wow = null;
  let nextT = 0, step = 0, muted = false, noise = null;
  const VOL = 0.34, beds = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- plumbing ----
  function pan(p, dest) {
    if (ac.createStereoPanner) { const n = ac.createStereoPanner(); n.pan.value = p; n.connect(dest); return n; }
    return dest;
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
  function send(node, amt, bus) { const g = ac.createGain(); g.gain.value = amt; node.connect(g); g.connect(bus || wet); }

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

  // ---- the songs ----
  const TR = [
    { name: 'Iltakävely', bpm: 74, swing: 0.17, lp: 5200, bed: 'vinyl', play(st, t, beat) {
      // boom-bap: lazy FM-piano chords, sub bass with walk-ups, crisp drums with ghost notes, a hummable piano hook
      const C = [[53, 57, 60, 64, 67], [52, 55, 59, 62, 69], [50, 53, 57, 60, 64], [48, 52, 55, 59, 62], [46, 50, 53, 57, 60], [45, 48, 52, 55, 60], [43, 46, 50, 53, 57], [48, 52, 53, 58, 62]];
      const R = [41, 40, 38, 36, 34, 33, 31, 36];
      const bar = Math.floor(st / 16) % 8, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) strum(ch, t, beat * 2.6, 0.075, 0.016);
      if (s === 10 && S !== 0) strum(ch.slice(1, 4).map(m => m + 12), t, beat * 1.2, 0.035, 0.02, 0.3);
      if (S !== 3) {
        if (s === 0) sub(R[bar], t, beat * 1.7, 0.42);
        if (s === 7) sub(R[bar], t, beat * 0.4, 0.3);
        if (s === 10) sub(R[bar] + 7, t, beat * 0.8, 0.34);
        if (s === 14 && bar % 2) sub(R[(bar + 1) % 8] - 1, t, beat * 0.4, 0.3);
      } else if (s === 0) sub(R[bar], t, beat * 3.6, 0.3);
      if (S !== 0 && S !== 3) {
        if (s === 0 || s === 9 || (s === 10 && bar % 2)) kick(t + hum(), 0.85, 0.3);
        if (s === 4 || s === 12) snare(t + 0.012, 0.32, 0.2);
        if ((s === 7 || s === 15) && Math.random() < 0.5) snare(t, 0.05, 0);
        if (s % 2 === 0) hat(t + hum(), s % 4 === 0 ? 0.07 : 0.045, s === 14 && bar % 4 === 3, 0.25);
        else if (Math.random() < 0.3) hat(t, 0.02);
      } else if (S === 0 && s % 4 === 2) hat(t, 0.03);
      if (S === 2 || S === 3) phrase([[0, 7, 3], [3, 9, 2], [6, 11, 4], [10, 9, 2], [12, 7, 4]].map(([a, d, l]) => [a, d + (bar % 4 === 3 ? -2 : 0) + (bar % 2 ? 1 : 0), l]),
        [0, 2, 4, 5, 7, 9, 11], 65, s, t, s16, (m, tt, d) => keys(m, tt + hum(), 0.09, 0.2, 0.4));
    } },
    { name: 'Sadepäivä', bpm: 68, swing: 0.06, lp: 4200, bed: 'rain', play(st, t, beat) {
      // rainy piano: rolling minor arpeggios, brushed shuffle, deep sub, bells dripping in the reverb
      const C = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 52, 55, 59, 64], [55, 59, 62, 64, 67], [50, 53, 57, 60, 64], [53, 57, 60, 64, 67], [52, 56, 59, 62, 64], [52, 55, 59, 62, 64]];
      const R = [45, 41, 36, 43, 38, 41, 40, 40], ARP = [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 3, 1, 4, 3, 2];
      const bar = Math.floor(st / 16) % 8, s = st % 16, S = sect(st), ch = C[bar];
      const up = (S === 2 && s >= 8) ? 12 : 0;
      keys(ch[ARP[s]] + up, t + hum(), s % 4 === 0 ? 0.12 : 0.075, (ARP[s] - 2) * 0.2, 0.45, 2400);
      if (s === 0) { pad(ch.slice(0, 3).map(m => m - 12), t, beat * 4.2, 0.012, 900); sub(R[bar] - 12, t, beat * 3.5, 0.36); }
      if (s === 8 && bar % 2) sub(R[bar] - 5, t, beat * 1.5, 0.22);
      if (S === 1 || S === 2) {
        if (s === 0 || s === 11) kick(t, 0.45, 0.15);
        if (s === 4 || s === 12) brush(t, 0.12, 0.28);
        if (s % 2 === 1) brush(t, 0.03, 0.08);
      }
      if ((S === 2 || S === 3) && s % 4 === 2 && Math.random() < 0.35) bell(pick([76, 79, 81, 84, 86, 88]), t, 0.06);
    } },
    { name: 'Kaupungin valot', bpm: 96, swing: 0, lp: 7000, bed: 'none', play(st, t, beat) {
      // chillwave: pumping saw pads, octave synth bass, four-on-the-floor with claps, glassy arpeggio in the echo
      const C = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [53, 57, 60, 64, 67], [48, 52, 55, 59, 62]], R = [38, 34, 41, 36];
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4, ch = C[bar];
      if (s === 0) pad(ch, t, beat * 4.05, 0.034, S === 0 ? 1500 : S === 3 ? 1800 : 3200);
      if (S !== 3) {
        if (s % 2 === 0) synthBass(R[bar] + (s % 4 === 2 ? 12 : 0), t, s16 * 1.6, 0.2);
        if (s % 4 === 0) kick(t, 0.8, 0.5);
        if (S !== 0) { if (s === 4 || s === 12) clap(t, 0.24); if (s % 4 === 2) hat(t, 0.08, true, 0.35); hat(t, s % 2 ? 0.025 : 0.04, false, -0.3); }
      }
      if (S >= 1 && s % 2 === 0) { const ar = [0, 2, 4, 2, 1, 3, 4, 3][(s / 2) % 8]; bell(ch[ar] + 24, t, S === 2 ? 0.05 : 0.03, ((s / 2) % 2 ? 0.5 : -0.5)); }
      if (S === 2) phrase([[0, 4, 6], [6, 3, 2], [8, 2, 6], [14, 1, 2]].map(([a, d, l]) => [a, d + (bar % 2 ? 2 : 0), l]), [0, 2, 3, 5, 7, 8, 10], 74, s, t, s16, (m, tt, d) => lead(m, tt, d, 0.05, 'flute', -0.1));
    } },
    { name: 'Tähtiyö', bpm: 58, swing: 0, lp: 4400, bed: 'none', play(st, t, beat) {
      // ambient night: slow-breathing pads, a low drone, twinkling bells and a soft heartbeat in the middle
      const C = [[53, 60, 64, 67, 72], [48, 55, 62, 64, 69], [50, 57, 60, 65, 69], [46, 53, 57, 62, 65]], R = [29, 24, 26, 22];
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st);
      if (s === 0) { pad(C[bar], t, beat * 4.6, 0.035, S === 2 ? 2400 : 1300); sub(R[bar] + 12, t, beat * 4, 0.3); }
      if (s === 8 && S !== 0) rhodes(C[bar][2] + 12, t, beat * 3, 0.04, 0.4, 0.6);
      if (s % 2 === 0 && Math.random() < (S === 3 ? 0.45 : 0.25)) bell(pick([72, 74, 77, 79, 81, 84, 86, 89]), t + hum(), 0.07);
      if (S === 2 && (s === 0 || s === 3)) kick(t, s ? 0.18 : 0.3, 0.12);
    } },
    { name: 'Yöjuna', bpm: 108, swing: 0.32, lp: 6000, bed: 'train', play(st, t, beat) {
      // late-night jazz trio: walking bass, ride cymbal with brushes, Rhodes comping and a muted-sax melody
      const C = [[48, 52, 55, 59, 62], [45, 48, 52, 55, 59], [50, 53, 57, 60, 64], [43, 47, 50, 53, 57]];
      const W = [[36, 40, 43, 44], [45, 43, 40, 39], [38, 41, 45, 42], [43, 47, 41, 35]];
      const bar = Math.floor(st / 16) % 4, s = st % 16, S = sect(st), s16 = beat / 4;
      if (s % 4 === 0) upright(W[bar][s / 4] + (S === 3 && s ? 0 : 0), t + hum(), beat * 0.85, 0.5);
      if (S !== 0) {
        if (s % 4 === 0) ride(t, 0.07);
        if (s % 8 === 7) ride(t, 0.045);
        if (s === 4 || s === 12) brush(t, 0.07, 0.15);
        if (s === 0 && bar === 0) kick(t, 0.3, 0);
        if (s === 14 && Math.random() < 0.3) rim(t, 0.06);
      } else if (s % 8 === 0) brush(t, 0.05, 0.4);
      if ([3, 6, 11, 14].includes(s) && Math.random() < 0.55) strum(C[bar].slice(1).map(m => m), t, beat * 0.55, 0.05, 0.008);
      if (S === 2 || S === 3) phrase([[0, 4, 3], [3, 5, 1], [4, 6, 3], [7, 8, 5], [12, 7, 2], [14, 5, 2]].map(([a, d, l]) => [a, d - (bar % 2) * 2, l]),
        [0, 2, 3, 5, 7, 9, 10], 60, s, t, s16, (m, tt, d) => lead(m, tt + hum(), d, 0.055, 'sax', 0.2));
    } }
  ];
  const SAT = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; SAT[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
  if (!(track >= -1 && track < TR.length)) track = 0;
  const T = () => TR[Math.max(0, track)];
  function vol() { return track >= 0 && !muted ? VOL : 0; }
  function loopBuf(fn, sec, ch) { const bf = ac.createBuffer(ch || 1, Math.floor(ac.sampleRate * sec), ac.sampleRate); for (let c = 0; c < (ch || 1); c++) fn(bf.getChannelData(c), ac.sampleRate, c); return bf; }
  function start(actx, dest) {
    if (ac) return;
    ac = actx;
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
    setInterval(schedule, 50);
  }
  function applyTrack(instant) {
    if (!ac) return;
    const t = ac.currentTime, tr = T();
    out.gain.setTargetAtTime(vol(), t, instant ? 1.2 : 0.4);
    out.lp.frequency.setTargetAtTime(tr.lp, t, 0.3);
    for (const k in beds) beds[k].gn.gain.setTargetAtTime(k === tr.bed ? beds[k].g : 0, t, 0.5);
  }
  function schedule() {
    if (!ac || ac.state !== 'running' || track < 0) return;
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
    names: TR.map(t => t.name),
    get track() { return track; },
    setTrack(i) { track = i; step = 0; store.set('piispanpeli-track', i); applyTrack(false); },
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
    pop() { tone(900, 1700, 0.06, 'sine', 0.2); tone(1400, 700, 0.07, 'triangle', 0.07, 0.02); },
    mega() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.02, 0.28, 'triangle', 0.15, i * 0.08)); },
    blocked() { tone(180, 120, 0.15, 'square', 0.04); },
    over() { tone(420, 110, 0.7, 'triangle', 0.18); tone(300, 90, 0.8, 'sine', 0.12, 0.12); }
  };
})();
