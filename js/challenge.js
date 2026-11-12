// PiispanPELI · Stage challenges: stones and the boss of the last stage, and the bonus goals that give a stage its stars.
'use strict';

// what each stage asks for (the same in every theme): stage 1 is free play, stage 2 has stones, and both
// later stages have a time limit for the whole stage (STAGE_TIME in game.js) and a boss that arrives once
// the biggest ball has been made. The boss is about as big as the 11th ball on stage 2 and the 12th on stage 3.
const STAGE_RULES = [{}, { stones: 22, boss: MAXL }, { boss: MAXL }];
const BOSS_HPS = [0, 40, 60], bossHP = () => BOSS_HPS[stage] || 60, bossR = st => RADII[st === 1 ? 10 : 11];
// the two bonus goals of each stage; beating the stage gives one star and each bonus goal one more
const STAR_GOALS = [
  [['Älä käytä rulettia', () => ch.swings === 0], ['Tee kombo ×4', () => ch.maxCombo >= 4]],
  [['Riko 8 kiveä', () => ch.broken >= 8], ['Voita pomo', () => ch.bossDone]],
  [['Voita pomo', () => ch.bossDone], ['Saa 13. pallo alle 18 minuutissa', () => ch.at12 > 0 && ch.at12 <= 1080]]
];

// everything a stage keeps track of
let ch = {};
function challengeReset() {
  ch = { shots: 0, broken: 0, swings: 0, maxCombo: 0, at9: 0, at12: 0, bossOn: false, bossHP: 0, bossDone: false, bossHit: 0,
    nextStone: (STAGE_RULES[stage] || {}).stones || 0 };
}
const challengeSave = () => ({ s: ch.shots, b: ch.broken, w: ch.swings, c: ch.maxCombo, a9: ch.at9, a12: ch.at12, bo: ch.bossOn, bh: ch.bossHP, bd: ch.bossDone, ns: ch.nextStone });
function challengeLoad(d) {
  challengeReset();
  if (!d) return;
  Object.assign(ch, { shots: d.s | 0, broken: d.b | 0, swings: d.w | 0, maxCombo: d.c | 0, at9: +d.a9 || 0, at12: +d.a12 || 0,
    bossOn: !!d.bo, bossHP: d.bh | 0, bossDone: !!d.bd, nextStone: d.ns | 0 || ch.nextStone });
}
const rules = () => (gmode === 'classic' ? STAGE_RULES[stage] || {} : {});
// the time limits of a stage: { lv, t }
const stageGoals = i => (STAGE_TIME[i] ? [{ lv: MAXL, t: STAGE_TIME[i] }] : []);
const goalText = g => T('Läpäise taso {0} minuutissa', g.t / 60);

function challengeOnShot() {
  if (gmode !== 'classic') return;
  ch.shots++;
  const every = rules().stones;
  if (every && ch.shots >= ch.nextStone) {
    // a stone falls in from one side, away from the launcher
    ch.nextStone = ch.shots + every;
    const x = Math.random() < 0.5 ? rand(1, 4.2) : rand(7.8, 11), st = makeBlob(STONE, x, 2.6, 0, 2, 0.6);
    if (st) { st.hp = 2; floater(T('Kivi!'), x, 3.5, '#c8ced8', 20); sfx.blocked(); }
  }
}

function challengeOnMerge(ev) {
  if (gmode !== 'classic') return;
  ch.maxCombo = Math.max(ch.maxCombo, combo);
  if (maxLevel >= 9 && !ch.at9) ch.at9 = playT;
  if (maxLevel >= 12 && !ch.at12) ch.at12 = playT;
  const R = RADII[ev.level], gone = [];
  for (const b of E.blobs) {
    if (b.level === STONE && Math.hypot(b.cx - ev.x, b.cy - ev.y) < b.R + R + 0.5) {
      b.hp = (b.hp || 2) - 1; b.crack = 1;
      if (b.hp <= 0) gone.push(b);
    } else if (b.level === BOSS && ch.bossOn && Math.hypot(b.cx - ev.x, b.cy - ev.y) < b.R + R + 0.9) {
      const dmg = ev.level + 1;
      ch.bossHP = Math.max(0, ch.bossHP - dmg); ch.bossHit = 0.3;
      floater('−' + dmg, b.cx, b.cy - b.R - 0.4, '#ff5a5a', 22);
      if (ch.bossHP <= 0) gone.push(b);
    }
  }
  for (const b of gone) {
    removeBlob(b);
    if (b.level === STONE) {
      ch.broken++; burstColor(b.cx, b.cy, '#a8b0bc', 14, b.R); addScore(50); gainCoins(2);
      floater(T('Kivi rikki!'), b.cx, b.cy - 1, '#e8eef6', 20);
    } else {
      ch.bossOn = false; ch.bossDone = true;
      for (let l = 0; l <= MAXL; l++) burst(b.cx, b.cy, l, 6, 3);
      addScore(5000); gainCoins(50); gainXP(150); sfx.mega(); triggerConfetti();
      if (!reduceMotion) shake = 0.5;
      floater(T('Pomo voitettu! +{0}', 5000), WORLD_W / 2, 6, '#ffe066', 30);
    }
  }
}

// called every physics step in the classic mode; returns true when the game ended
// a place at the top of the wagon where the boss can appear without touching any ball
function bossSpot() {
  const R = SPECIAL_R[BOSS] + 0.2, xs = [WORLD_W / 2, WORLD_W / 2 - 1.5, WORLD_W / 2 + 1.5, WORLD_W / 2 - 2.5, WORLD_W / 2 + 2.5];
  for (const x of xs) if (E.blobs.every(b => Math.hypot(b.cx - x, b.cy - 2.8) > R + b.R * b.scale)) return x;
  return null;
}
function challengeStep() {
  const r = rules();
  const lim = STAGE_TIME[stage];
  if (lim && !stageDone && playT >= lim && !invincible) { failGoal = { lv: MAXL, t: lim }; gameOver('stage'); return true; }
  // the boss arrives when the biggest ball has been made
  // it waits for a free spot, so it never lands on top of a ball (one just shot, say), and no ball can be shot for a moment
  if (r.boss) SPECIAL_R[BOSS] = bossR(stage);
  const bx = r.boss && !ch.bossOn && !ch.bossDone && maxLevel >= r.boss ? bossSpot() : null;
  if (bx != null) {
    ch.bossOn = true; ch.bossHP = bossHP(); cooldown = Math.max(cooldown, 0.9);
    makeBlob(BOSS, bx, 2.8, 0, 1, 0.5);
    floater(T('Pomo saapuu!'), WORLD_W / 2, 6, '#ff6b6b', 30); sfx.over();
    if (!reduceMotion) shake = 0.35;
  }
  if (ch.bossHit > 0) ch.bossHit -= STEP;
  return false;
}

// the stars of a stage: one for beating it, one for each bonus goal
function starsNow() { return 1 + STAR_GOALS[stage].filter(g => g[1]()).length; }
const starsKey = id => 'piispanpeli-stars-' + id;
function starsOf(id) { const s = store.get(starsKey(id), null); return Array.isArray(s) ? s.map(n => clamp(n | 0, 0, 3)) : [0, 0, 0]; }
const totalStars = () => THEMES.reduce((a, t) => a + starsOf(t.id).reduce((x, y) => x + y, 0), 0);
// record the stars of the stage just beaten; returns [stars, new stars on top of the best before]
function recordStars() {
  const id = theme().id, s = starsOf(id), got = starsNow(), more = Math.max(0, got - s[stage]);
  if (!cheated && more) { s[stage] = got; store.set(starsKey(id), s); gainCoins(20 * more); }
  return [got, cheated ? 0 : more];
}
const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);

// ------------------------------ drawing ------------------------------
function burstColor(x, y, c, count, R) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, sp = rand(2.5, 7), life = rand(0.45, 0.8);
    parts.push({ k: 0, x: x + Math.cos(a) * R * 0.6, y: y + Math.sin(a) * R * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, r: rand(0.08, 0.16), life, max: life, c });
  }
}
function drawSpecial(b) {
  const R = b.R * b.scale, path = blobPath(b);
  ctx.save(); ctx.clip(path); ctx.translate(b.cx, b.cy); ctx.rotate(b.ang);
  if (b.level === STONE) {
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1);
    g.addColorStop(0, '#b8bec8'); g.addColorStop(1, '#4a505c'); ctx.fillStyle = g; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    ctx.fillStyle = 'rgba(30,34,44,0.35)';
    for (const [x, y, r] of [[-0.35, 0.2, 0.18], [0.3, -0.25, 0.14], [0.15, 0.45, 0.12]]) { ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, TAU); ctx.fill(); }
    if ((b.hp || 2) < 2) {
      // a crack after the first hit
      ctx.strokeStyle = '#15181f'; ctx.lineWidth = R * 0.08; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-R * 0.6, -R * 0.5); ctx.lineTo(-R * 0.1, -R * 0.1); ctx.lineTo(-R * 0.25, R * 0.25); ctx.lineTo(R * 0.4, R * 0.6); ctx.moveTo(-R * 0.1, -R * 0.1); ctx.lineTo(R * 0.45, -R * 0.2); ctx.stroke();
    }
  } else drawBossArt(R);
  ctx.restore();
  ctx.lineWidth = 0.06; ctx.strokeStyle = 'rgba(8,20,55,0.8)'; ctx.stroke(path);
  if (b.level === BOSS) {
    drawBossFace(b.cx, b.cy, R, b.ang);
    // health bar above the boss
    const w = 3, x = b.cx - w / 2, y = b.cy - R - 0.65, f = ch.bossHP / bossHP();
    ctx.fillStyle = 'rgba(10,12,30,0.75)'; ctx.fillRect(x - 0.06, y - 0.06, w + 0.12, 0.38);
    ctx.fillStyle = ch.bossHit > 0 ? '#ffffff' : f > 0.5 ? '#ff5a5a' : f > 0.25 ? '#ff9a3a' : '#ffd84d'; ctx.fillRect(x, y, w * f, 0.26);
  }
}
// each theme has its own boss: a black hole, the wolf Fenrir, a broken heart and an exam paper
function drawBossArt(R) {
  const id = theme().id;
  if (id === 'viking') {
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.1); g.addColorStop(0, '#9aa4b0'); g.addColorStop(1, '#2a2f3a');
    ctx.fillStyle = g; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    ctx.fillStyle = '#5a6270';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * R * 0.75, -R * 0.4); ctx.lineTo(d * R * 0.55, -R * 1.05); ctx.lineTo(d * R * 0.25, -R * 0.6); ctx.fill(); }
    ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.ellipse(0, R * 0.45, R * 0.5, R * 0.35, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8b090'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * R * 0.2, R * 0.45); ctx.lineTo(d * R * 0.12, R * 0.75); ctx.lineTo(d * R * 0.04, R * 0.45); ctx.fill(); }
    ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.arc(0, 0, R * 1.0, 0.2, 0.9); ctx.stroke();
  } else if (id === 'heart') {
    ctx.fillStyle = '#2a0a18'; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    ctx.fillStyle = '#b0103a'; heartPath(ctx, 0, R * 0.3, R * 1.05); ctx.fill();
    ctx.strokeStyle = '#1a0610'; ctx.lineWidth = R * 0.09; ctx.beginPath(); ctx.moveTo(0, -R * 0.55); ctx.lineTo(-R * 0.15, -R * 0.2); ctx.lineTo(R * 0.12, R * 0.1); ctx.lineTo(-R * 0.1, R * 0.45); ctx.lineTo(0, R * 0.75); ctx.stroke();
  } else if (id === 'uni') {
    ctx.fillStyle = '#f6f2e6'; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    ctx.strokeStyle = 'rgba(80,110,180,0.45)'; ctx.lineWidth = R * 0.025;
    for (let y = -R; y < R; y += R * 0.18) { ctx.beginPath(); ctx.moveTo(-R * 1.2, y); ctx.lineTo(R * 1.2, y); ctx.stroke(); }
    ctx.fillStyle = '#e01e37'; ctx.font = `900 ${R * 0.75}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('F', R * 0.45, R * 0.5); ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = '#e01e37'; ctx.lineWidth = R * 0.06; ctx.beginPath(); ctx.arc(R * 0.45, R * 0.5, R * 0.42, 0, TAU); ctx.stroke();
  } else {
    ctx.fillStyle = '#05030c'; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    const g = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 1.1); g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(0.82, 'rgba(255,120,30,0.15)'); g.addColorStop(1, 'rgba(255,200,90,0.85)');
    ctx.fillStyle = g; ctx.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    ctx.strokeStyle = 'rgba(255,190,80,0.85)'; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 1.1, R * 0.3, -0.2, 0, TAU); ctx.stroke();
  }
}
function drawBossFace(cx, cy, R, ang) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  const dark = theme().id === 'uni', col = dark ? '#231d45' : '#ffffff';
  // angry slanted eyes and a frown
  for (const d of [-1, 1]) {
    ctx.fillStyle = dark ? '#ffffff' : '#ff3b3b'; ctx.beginPath(); ctx.ellipse(d * R * 0.32, -R * 0.12, R * 0.15, R * 0.12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(d * R * 0.3, -R * 0.1, R * 0.06, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = R * 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(d * R * 0.52, -R * 0.38); ctx.lineTo(d * R * 0.14, -R * 0.24); ctx.stroke();
  }
  ctx.strokeStyle = col; ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.arc(0, R * 0.38, R * 0.22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
}
