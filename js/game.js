// PiispanPELI · Game flow, modes, wardrobe, themes, achievements, trophies, saving and effects.
'use strict';

// ------------------------------ game flow ------------------------------
function spawnWeights() {
  // the further you get, the bigger the balls you are offered
  const top = Math.min(SPAWN_W.length - 1, Math.max(4, maxLevel - 3));
  const p = clamp((maxLevel - 4) / 8, 0, 1);
  return SPAWN_W.map((w, i) => i > top ? 0 : w * (1 + p * i * 0.6));
}
function randLevel() {
  const w = spawnWeights();
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}

// ======================= game modes =======================
let gmode = 'classic', modeT = 0, shots = 0, missionIdx = -1, gotLevels = new Set(), playT = 0, oneBtnT = 0, mergesThisGame = 0, failT = 0, endReason = 'over';
const MODE_INFO = {
  classic: { name: 'Klassinen', desc: 'Peruspeli. Peli päättyy, kun pallot koskettavat molempia nappeja.' },
  daily: { name: 'Päivän haaste', desc: 'Joka päivä sama pallojärjestys kaikille. Saa {0} mahdollisimman vähillä laukauksilla.' },
  map: { name: 'Tehtäväkartta', desc: 'Matkaa Euroopan halki. Jokainen maa on oma tehtävänsä.' }
};
// mission texts are written from the current ball names (countries, gods, hearts or sums), see missionText()
const MISSIONS = [
  { c: 0, level: 2, shots: 15 },
  { c: 1, level: 4, shots: 30 },
  { c: 2, text: 'Kerää 2 000 pistettä minuutissa', score: 2000, time: 60 },
  { c: 3, level: 5, shots: 40 },
  { c: 4, text: 'Tee kombo ×4', combo: 4 },
  { c: 5, level: 6, shots: 55 },
  { c: 6, text: 'Kerää 6 000 pistettä 90 sekunnissa', score: 6000, time: 90 },
  { c: 7, level: 7 },
  { c: 8, level: 8, shots: 140 },
  { c: 9, level: 9 },
  { c: 10, level: 10 }
];
const MISSION_FI = MISSIONS.map(m => m.text);
function missionText(m, i) {
  if (m.level != null) return m.shots ? T('Saa {0} {1} laukauksella', ballLabel(m.level), m.shots) : T('Saa {0}', ballLabel(m.level));
  return T(MISSION_FI[i]);
}
// the daily challenge changes every day at 15:00 Finnish time
function fiParts(ms) {
  try {
    const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms)).forEach(x => { p[x.type] = +x.value; });
    return p;
  } catch (e) { const d = new Date(ms + 2 * 3600e3); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() }; }
}
function todayKey() { const p = fiParts(Date.now() - 15 * 3600e3); return (p.year * 10000 + p.month * 100 + p.day) * 10 + 5; }
function dailyLeft() {
  const p = fiParts(Date.now()), since = ((p.hour * 60 + p.minute) - 900 + 1440) % 1440, left = 1440 - since;
  return Math.floor(left / 60) + ' h ' + (left % 60) + ' min';
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rng = Math.random;
const mapDone = () => Number(store.get('piispanpeli-map', 0)) || 0;

// ======================= wardrobe for the mascot =======================
const WARDROBE = {
  wagon: [['blue', 'Perusväri'], ['red', 'Punainen vaunu', 'lv:10'], ['green', 'Vihreä vaunu', 'shop:300'], ['black', 'Musta vaunu', 'shop:500'], ['goldw', 'Kultainen vaunu', 'lv:25']],
  costume: [['none', 'Ei erikoisasua'], ['hermes', 'Hermes', 'union'], ['sun', 'Aurinkokuningas', 'stage2'], ['cosmos', 'Universumi', 'stage3'], ['odin', 'Odin', 'v_union'],
    ['frost', 'Huurrejättiläinen', 'v_stage2'], ['heartqueen', 'Sydänkuningatar', 'h_union'], ['professor', 'Hullu professori', 'u_union']],
  hair: [['short', 'Lyhyet'], ['long', 'Pitkät'], ['ponytail', 'Poninhäntä'], ['bun', 'Nuttura', 'combo10'], ['pigtails', 'Saparot', 'heart'], ['curly', 'Kiharat', 'merges100'],
    ['braids', 'Letit', 'rus'], ['spiky', 'Piikkitukka', 'stage1'], ['mohawk', 'Irokeesi', 'combo10'], ['afro', 'Afro', 's100k'], ['bald', 'Kalju', 'games50']],
  hairc: [['brown', 'Ruskea'], ['black', 'Musta'], ['blonde', 'Blondi'], ['ginger', 'Punainen'], ['grey', 'Harmaa', 'marathon'], ['pink', 'Pinkki', 'h_l14'],
    ['blue', 'Sininen', 'stage2'], ['green', 'Vihreä', 'v_stage1'], ['purple', 'Violetti', 'u_l14'], ['rainbow', 'Sateenkaari', 'h_all'], ['goldh', 'Kulta', 'union'],
    ['teal', 'Turkoosi', 'lv:3'], ['orange', 'Oranssi', 'shop:150'], ['silver', 'Hopea', 'shop:200']],
  skin: [['light', 'Vaalea'], ['pale', 'Kalpea'], ['tan', 'Ruskettunut'], ['brown', 'Keskiruskea'], ['dark', 'Tumma'], ['alien', 'Avaruusolio', 'stage3'], ['gold', 'Kulta', 'all']],
  eyes: [['brown', 'Ruskeat'], ['blue', 'Siniset'], ['green', 'Vihreät'], ['grey', 'Harmaat'], ['pink', 'Pinkit', 'h_l14'], ['purple', 'Violetit', 'lv:6'], ['gold', 'Kultaiset', 'v_l14']],
  face: [['none', 'Ei mitään'], ['freckles', 'Pisamat'], ['eupaint', 'EU-tähdet', 'rus'], ['mustache', 'Viikset', 'stage1'], ['beard', 'Viikinkiparta', 'v_l14'],
    ['heartcheek', 'Sydänposket', 'h_l14'], ['starcheek', 'Tähtiposket', 'stage1'], ['rbpaint', 'Sateenkaarimaali', 'h_all']],
  hat: [['bonnet', 'Satiinimyssy'], ['none', 'Ei hattua'], ['cap', 'Lippis', 'merges100'], ['beanie', 'Suomi-pipo', 'rus'], ['beret', 'Baskeri', 'stage1'],
    ['ushanka', 'Karvalakki', 'rus'], ['viking', 'Viikinkikypärä', 'rus'], ['crown', 'Kruunu', 'mapAll'], ['wings', 'Hermeksen siivet', 'union'], ['party', 'Juhlahattu', 'merges100'],
    ['tophat', 'Silinteri', 's100k'], ['heart', 'Sydänpanta', 'heart'], ['halo', 'Sädekehä', 'lv:22'], ['chef', 'Kokin hattu', 'merges100'],
    ['cowboy', 'Cowboy-hattu', 'close'], ['propeller', 'Propellihattu', 'shop:250'], ['nightcap', 'Yömyssy', 'quiet'], ['astro', 'Avaruuskypärä', 'stage2'],
    ['valk', 'Valkyriakypärä', 'v_union'], ['leafcrown', 'Lehväseppele', 'v_stage3'], ['flowers', 'Kukkaseppele', 'h_stage1'], ['heartcrown', 'Sydänkruunu', 'h_union'],
    ['studcap', 'Ylioppilaslakki', 'u_stage1'], ['wizard', 'Velhonhattu', 'u_l14'], ['grad', 'Tohtorinhattu', 'u_stage3'],
    ['party', 'Juhlahattu', 'lv:8'], ['elf', 'Tonttulakki', 'shop:200'], ['catears', 'Kissankorvat', 'shop:250'], ['devil', 'Pirunsarvet', 'shop:300'],
    ['pirate', 'Merirosvohattu', 'shop:400'], ['starcrown', 'Tähtikruunu', 'stars:24']],
  glasses: [['none', 'Ei laseja'], ['sun', 'Aurinkolasit', 'combo10'], ['round', 'Pyöreät lasit', 'marathon'], ['star', 'Tähtilasit', 'heart'],
    ['heart', 'Sydänlasit', 'nelli'], ['mono', 'Monokkeli', 'daily'], ['threed', '3D-lasit', 'combo10'], ['ski', 'Laskettelulasit', 'shop:300'],
    ['visor', 'Avaruusvisiiri', 'stage1'], ['patch', 'Silmälappu', 'v_l14'], ['rainbow', 'Sateenkaarilasit', 'h_l14'], ['cat', 'Kissansilmälasit', 'h_stage2'],
    ['nerd', 'Nörttilasit', 'u_l14'], ['aviator', 'Lentäjänlasit', 'shop:250'], ['laser', 'Laservisiiri', 'shop:350']],
  neck: [['chain', 'Kultaketju'], ['none', 'Ei mitään'], ['scarf', 'Kaulahuivi', 'games50'], ['bowtie', 'Rusetti', 'map3'], ['pearls', 'Helmet', 'lv:14'], ['medal', 'Mitali', 'all'], ['bell', 'Kulkunen', 'close'],
    ['whistle', 'Pilli', 'daily60'], ['torc', 'Kultainen kaularengas', 'v_stage1'], ['rune', 'Riimuamuletti', 'v_stage1'], ['mjolnir', 'Mjölnir-riipus', 'v_all'],
    ['hearts', 'Sydänkaulakoru', 'h_stage1'], ['rbscarf', 'Sateenkaarihuivi', 'h_all'], ['tie', 'Solmio', 'u_stage1'], ['stole', 'Juhlalieve', 'u_stage2']],
  top: [['none', 'Ei paitaa'], ['tee', 'T-paita'], ['hoodie', 'Huppari', 'admin'], ['space', 'Avaruuspuku', 'stage3'], ['cape', 'Kuninkaan viitta', 'v_stage1'],
    ['sailor', 'Merimiespaita', 'v_l14'], ['fur', 'Turkisviitta', 'v_l14'], ['mail', 'Rengaspaita', 'v_stage2'], ['tux', 'Frakki', 'h_stage1'],
    ['sweater', 'Sydänneule', 'h_stage1'], ['starcloak', 'Tähtiviitta', 'h_stage3'], ['labcoat', 'Laboratoriotakki', 'u_stage1'], ['robe', 'Väitöskaapu', 'u_union'],
    ['college', 'Collegepaita', 'u_all'],
    ['jersey', 'Pelipaita', 'lv:12'], ['hawaii', 'Havaijipaita', 'shop:300'], ['rbtee', 'Sateenkaaripaita', 'shop:400'], ['suit', 'Puku', 'shop:500']],
  ball: [['plain', 'Tavalliset reunat'], ['gold', 'Kultareunat', 'union'], ['silver', 'Hopeareunat', 'lv:5'], ['neon', 'Neonreunat', 'lv:15'],
    ['rainbow', 'Sateenkaarireunat', 'lv:20'], ['ruby', 'Rubiinireunat', 'shop:600']]
};
const SLOT_NAMES = { wagon: 'Vaunu', costume: 'Erikoisasu', hair: 'Hiukset', hairc: 'Hiusten väri', skin: 'Iho', eyes: 'Silmät', face: 'Kasvot', hat: 'Hattu', glasses: 'Lasit', neck: 'Kaula', top: 'Paita', ball: 'Pallot' };

// ======================= wagon themes, unlocked by achievements =======================
const THEMES = [
  { id: 'eu', name: 'EU-juna', ach: null, label: 'PIISPAN EXPRESS  ·  EU 2026', wall: ['#2d5fc4', '#4d82e8', '#1d438f'], body: 'rgba(40,85,190,0.24)', beam: ['#3a6fd8', '#15357c'],
    rivet: '#ffd84d', stripe: '#ffcc00', text: '#ffe27a', btn: '#d62839', stake: 'rgba(10,22,60,0.35)', bg: ['EXPRESS', '#e01e37', '#0b0b0b'] },
  { id: 'viking', name: 'Viikinki', ach: 'stage1', was: 'nordic', label: 'PIISPAN DRAKKAR  ·  ᚠᚢᚦᚨᚱᚲ', wall: ['#5a3a1e', '#9a6a3a', '#3e2612'], body: 'rgba(120,78,40,0.3)', beam: ['#7a4e28', '#3a2410'],
    rivet: '#cfd5de', stripe: '#b8323a', text: '#f3dfb8', btn: '#b8323a', stake: 'rgba(40,22,8,0.45)', bg: ['DRAKKAR', '#d9a441', '#2a1608'] },
  { id: 'heart', name: 'Sydän', ach: 'heart', label: 'PIISPAN  ♥  EXPRESS', wall: ['#c23a6e', '#ff7aa8', '#94204f'], body: 'rgba(255,110,165,0.22)', beam: ['#ff6f9f', '#a0244f'],
    rivet: '#ffffff', stripe: '#ffd1e0', text: '#fff0f5', btn: '#ff3d7a', stake: 'rgba(120,20,60,0.3)', bg: ['♥', '#ff4d8d', '#4a0a26'] },
  { id: 'uni', name: 'Korkeakoulu', ach: 'map3', label: 'PIISPAN AKATEMIA  ·  EST. 2026', wall: ['#4a3322', '#7a5638', '#2e1f14'], body: 'rgba(22,58,42,0.62)', beam: ['#1f4a3a', '#0f2a20'],
    rivet: '#d4af37', stripe: '#d4af37', text: '#f3e7c4', btn: '#8b1a2a', stake: 'rgba(60,40,24,0.55)', bg: ['AKATEMIA', '#e2bd48', '#0f3324'] }
];
// every theme except the EU train has its own 15 balls, smallest first
const THEME_BALLS = {
  viking: {
    names: ['Ratatoskr', 'Huginn', 'Muninn', 'Bragi', 'Idun', 'Heimdall', 'Tyr', 'Njord', 'Freyr', 'Freyja', 'Frigg', 'Baldr', 'Loki', 'Thor', 'Odin'],
    cols: [['#c9772e', '#7a3f12'], ['#4a4a5a', '#141420'], ['#5d5d72', '#22222e'], ['#4fb37a', '#1f5e3a'], ['#8fd66e', '#2e6e22'], ['#f4f4f4', '#9aa6b2'],
      ['#d0473a', '#5e1410'], ['#2e8bc0', '#0d3b5c'], ['#e8b84a', '#8a5a10'], ['#ef7fae', '#8a1f50'], ['#a98be0', '#4a2f80'], ['#fff0a8', '#d9a020'],
      ['#4fb35d', '#123d18'], ['#e05050', '#5a1010'], ['#3a5aa8', '#0d1736']],
    runes: ['raido', 'hagalaz', 'mannaz', 'wunjo', 'berkano', 'dagaz', 'tiwaz', 'laguz', 'fehu', 'algiz', 'othala', 'sowilo', 'kenaz', 'thurisaz', 'ansuz'],
    lead: 'Ammu jumalapalloja vaunuun. Kaksi samaa jumalaa yhdistyy mahtavammaksi. Kuka on mahtavin kaikista?', count: 'Jumalat'
  },
  heart: {
    names: ['Vaaleanpunainen sydän', 'Punainen sydän', 'Oranssi sydän', 'Keltainen sydän', 'Limenvihreä sydän', 'Vihreä sydän', 'Turkoosi sydän',
      'Taivaansininen sydän', 'Sininen sydän', 'Indigo sydän', 'Violetti sydän', 'Magenta sydän', 'Purppura sydän', 'Hopeinen sydän', 'Kultainen sydän'],
    cols: ['#ffb3c7', '#ff4d6d', '#ff8c42', '#ffd23f', '#a8e05f', '#3cb371', '#2ec4b6', '#5bc0eb', '#3a6fd8', '#5a4fcf', '#9b5de5', '#f15bb5', '#b5179e', '#c8ced8', '#ffcc33'],
    lead: 'Ammu sydänpalloja vaunuun. Kaksi samaa sydäntä yhdistyy isommaksi. Millainen on suurin sydän?', count: 'Sydämet'
  },
  uni: {
    names: ['1 + 1', '5 − 2', '3 × 4', '12 ÷ 3', 'x + 3 = 5', '3²', '√16', '2x − 4 = 6', 'x² = 9', 'πr²', 'sin 30°', 'log₂ 8', 'd/dx x²', '∫ x dx', 'Matriisi'],
    lead: 'Ammu laskupalloja vaunuun. Kaksi samaa laskua yhdistyy vaikeammaksi. Mikä on vaikein lasku?', count: 'Laskut'
  }
};
// ======================= stages: beating a theme's biggest ball opens the next stage =======================
// Stages are played in the classic mode. Stage 1 uses the theme's own balls; stages 2 and 3 have balls of their own
// and a time limit: the listed ball has to be reached before that much play time (in seconds) has passed.
const STAGES = {
  eu: [{ name: 'Eurooppa' },
    { name: 'Aurinkokunta', art: 'solar', names: ['Meteoroidi', 'Asteroidi', 'Komeetta', 'Ceres', 'Pluto', 'Kuu', 'Merkurius', 'Mars', 'Venus', 'Maa', 'Neptunus', 'Uranus', 'Saturnus', 'Jupiter', 'Aurinko'] },
    { name: 'Galaksi', art: 'galaxy', names: ['Valkoinen kääpiö', 'Neutronitähti', 'Punainen kääpiö', 'Keltainen tähti', 'Sininen jättiläinen', 'Punainen jättiläinen', 'Tähtijoukko',
      'Planetaarinen sumu', 'Supernova', 'Musta aukko', 'Linnunrata', 'Andromeda', 'Galaksijoukko', 'Superjoukko', 'Universumi'] }],
  viking: [{ name: 'Jumalat' },
    { name: 'Olennot', art: 'creature', names: ['Tonttu', 'Haltija', 'Kääpiö', 'Peikko', 'Huldra', 'Draugr', 'Valkyria', 'Jättiläinen', 'Sleipnir', 'Garm', 'Nidhogg', 'Fenrir', 'Surtr', 'Jörmungandr', 'Ymir'] },
    { name: 'Yhdeksän maailmaa', art: 'world', names: ['Niflheim', 'Muspelheim', 'Helheim', 'Svartalfheim', 'Nidavellir', 'Alfheim', 'Vanaheim', 'Jotunheim', 'Midgard', 'Bifröst', 'Asgard', 'Valhalla', 'Ginnungagap', 'Ragnarök', 'Yggdrasil'] }],
  heart: [{ name: 'Sydämet' },
    { name: 'Jalokivisydämet', art: 'gem', names: ['Kvartsisydän', 'Opaalisydän', 'Meripihkasydän', 'Topaasisydän', 'Peridoottisydän', 'Jadesydän', 'Akvamariinisydän', 'Smaragdisydän',
      'Safiirisydän', 'Ametistisydän', 'Granaattisydän', 'Rubiinisydän', 'Helmisydän', 'Platinasydän', 'Timanttisydän'] },
    { name: 'Kosmiset sydämet', art: 'cosmic', names: ['Tähtipölysydän', 'Kuusydän', 'Komeettasydän', 'Revontulisydän', 'Planeettasydän', 'Rengassydän', 'Tähtisydän', 'Kaksoistähtisydän',
      'Sumusydän', 'Supernovasydän', 'Pulsarisydän', 'Kvasaarisydän', 'Galaksisydän', 'Mustan aukon sydän', 'Universumin sydän'] }],
  uni: [{ name: 'Laskut' },
    { name: 'Fysiikka', art: 'physics', names: ['v = s/t', 'F = ma', 'p = mv', 'W = Fs', 'P = W/t', 'F = kx', 'U = RI', 'λ = v/f', 'a = v²/r', 'pV = nRT', 'E = hf', 'E = mc²', 'F = Gm₁m₂/r²', 'ΔxΔp ≥ ħ/2', 'iħ∂ψ/∂t = Ĥψ'] },
    { name: 'Yliopisto', art: 'degree', names: ['Ylioppilas', 'Fuksi', 'Kandidaatti', 'Maisteri', 'Lisensiaatti', 'Tohtori', 'Dosentti', 'Professori', 'Dekaani', 'Rehtori',
      'Akatemiaprofessori', 'Kunniatohtori', 'Fields-mitali', 'Nobel-palkinto', 'Kaiken teoria'] }]
};
// time limits [ball level, seconds]; the other challenges are in challenge.js
const STAGE_GOALS = [[], [], [[9, 360], [12, 1200]]];
let themeId = store.get('piispanpeli-theme', 'eu');
// achievements that were taken out as too easy, and what replaced each one: whatever they opened stays open
const ACH_WAS = { nordic: 'rus', fra: 'stage1', combo5: 'combo10', s10k: 'merges100', shake: 'close', v_l79: 'v_l14', v_l10: 'v_stage1', h_l79: 'h_l14', h_l10: 'h_stage1', u_l79: 'u_l14', u_l10: 'u_stage1' };
const achOrOld = id => !!achGot[id] || Object.keys(ACH_WAS).some(o => ACH_WAS[o] === id && achGot[o]);
const themeOpen = t => !t.ach || achOrOld(t.ach) || !!(t.was && achGot[t.was]);
function themeBase() { const t = THEMES.find(x => x.id === themeId); return t && themeOpen(t) ? t : THEMES[0]; }
// wagon colours bought from the shop or won as level rewards repaint the walls of any theme
const WAGON_PAINT = { red: { wall: ['#b8323a', '#e8606a', '#7a1a20'], body: 'rgba(200,50,60,0.2)', beam: ['#c8404a', '#6a1418'] },
  green: { wall: ['#2a8a4a', '#4fc06e', '#1a5a2e'], body: 'rgba(50,160,90,0.2)', beam: ['#3aa060', '#145a2a'] },
  black: { wall: ['#2a2e3a', '#4a5060', '#12141c'], body: 'rgba(20,24,34,0.35)', beam: ['#d9a400', '#6a5000'] },
  goldw: { wall: ['#c89a20', '#ffd84d', '#8a6400'], body: 'rgba(200,160,40,0.22)', beam: ['#ffcc33', '#8a6400'] } };
let themeMemo = null, themeMemoKey = '';
function theme() {
  const t = themeBase(), w = look.wagon, key = t.id + '|' + w;
  if (key === themeMemoKey) return themeMemo;
  const it = WAGON_PAINT[w] && WARDROBE.wagon.find(x => x[0] === w);
  const ready = typeof itemOpen === 'function';   // meta.js has not loaded yet while the scripts start
  themeMemoKey = ready ? key : ''; themeMemo = it && ready && itemOpen('wagon', it) ? Object.assign({}, t, WAGON_PAINT[w]) : t;
  return themeMemo;
}
let look = Object.assign({ wagon: 'blue', costume: 'none', hair: 'short', hairc: 'brown', skin: 'light', eyes: 'brown', face: 'none', hat: 'bonnet', glasses: 'none', neck: 'chain', top: 'none', ball: 'plain' }, store.get('piispanpeli-look', {}) || {});
// the rim around the balls: gold from an achievement, the rest from the shop or player levels
const RIMS = { gold: ['#fff3b0', '#ffcc00', '#a67c00'], silver: ['#ffffff', '#c8d0dc', '#6a7486'], neon: ['#a8fff0', '#2affd0', '#00a0ff'],
  ruby: ['#ffb0c0', '#e0115f', '#7a0020'], rainbow: null };
function rimStyle() {
  if (look.ball === 'plain' || !(look.ball in RIMS)) return '';
  const it = WARDROBE.ball.find(w => w[0] === look.ball);
  return it && itemOpen('ball', it) ? look.ball : '';
}
const goldBalls = () => rimStyle() !== '';
// how many stages of a theme are beaten (0 to 3), and which stage the next classic game starts on
const stagesDone = id => clamp(Number(store.get('piispanpeli-stage-' + id, 0)) || 0, 0, 3);
const stageOpen = (n, id) => n <= Math.min(2, stagesDone(id));
function stageSel() {
  const id = theme().id, s = Number(store.get('piispanpeli-stagesel-' + id, -1));
  return s >= 0 && stageOpen(s, id) ? s : Math.min(2, stagesDone(id));
}
let stage = 0, stageDone = false, stageT = 0, failGoal = null, lastStars = 0;
const stageInfo = () => STAGES[theme().id][stage];
function setStage(n) { if (n === stage) return; stage = n; applyLang(); }
// a colour dot in front of hair colours, skin tones and eye colours
function swatch(slot, id) {
  const bg = slot === 'hairc' ? (id === 'rainbow' ? 'linear-gradient(90deg,#e40303,#ff8c00,#ffed00,#008026,#004dff,#750787)' : id === 'goldh' ? 'linear-gradient(135deg,#fff3b0,#ffcc00,#a67c00)' : M_HAIR[id])
    : slot === 'skin' ? M_SKIN[id][0] : slot === 'eyes' ? M_EYES[id] : slot === 'wagon' ? (WAGON_PAINT[id] ? WAGON_PAINT[id].wall[1] : '#4d82e8')
    : slot === 'ball' ? (id === 'rainbow' ? 'conic-gradient(#e40303,#ffed00,#008026,#004dff,#750787,#e40303)' : RIMS[id] ? `linear-gradient(135deg,${RIMS[id].join(',')})` : '') : '';
  return bg ? `<i class="wsw" style="background:${bg}" aria-hidden="true"></i>` : '';
}
// the player can give the character a name; it is shown under the character in the menu
const NAME_KEY = 'piispanpeli-name', NAME_MAX = 16;
let heroName = String(store.get(NAME_KEY, '') || '').slice(0, NAME_MAX);
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function setHeroName(v) { heroName = String(v).replace(/[\u0000-\u001f]/g, '').slice(0, NAME_MAX); store.set(NAME_KEY, heroName.trim()); }
const nameTag = () => heroName.trim() ? `<p class="nametag">${escHtml(heroName.trim())}</p>` : '';
function showWardrobe() {
  let html = '<h2 class="h2">' + T('Hahmo') + '</h2><canvas class="mascot big" width="240" height="240" aria-hidden="true"></canvas>' +
    `<label class="namebox"><span>${T('Nimi')}</span><input id="heroName" type="text" maxlength="${NAME_MAX}" autocomplete="off" spellcheck="false" placeholder="${escHtml(T('Anna hahmolle nimi'))}" value="${escHtml(heroName)}"></label>`;
  for (const slot of ['costume', 'hair', 'hairc', 'skin', 'eyes', 'face', 'hat', 'glasses', 'neck', 'top', 'ball', 'wagon']) {
    html += `<h3 class="wtitle">${SLOT_NAMES[slot]}</h3>` + (slot === 'costume' ? `<p class="hint">${T('Erikoisasu pukee koko hahmon kerralla. Valitse Ei erikoisasua, niin omat valintasi palaavat.')}</p>` : '') + `<div class="wgrid">` + WARDROBE[slot].map(([id, name, ach]) => {
      const it = [id, name, ach], open = itemOpen(slot, it), on = look[slot] === id, buyable = !open && priceOf(it) > 0;
      return `<button class="witem${on ? ' on' : ''}${open ? '' : ' locked'}" type="button" ${buyable ? `data-buy="${slot}"` : `data-slot="${slot}"`} data-item="${id}"${open || (buyable && meta.coins >= priceOf(it)) ? '' : ' disabled'} title="${open ? name : itemNeed(slot, it)}">` +
        `<b>${swatch(slot, id)}${name}</b><small>${open ? T(on ? 'Käytössä' : 'Valitse') : itemNeed(slot, it)}</small></button>`;
    }).join('') + '</div>';
  }
  showOverlay(html + '<div class="row" style="margin-top:14px"><button class="btn" id="backMenu" type="button">' + T('Valmis') + '</button></div>');
  cardMascot = card.querySelector('.mascot.big');
}

// ======================= achievements =======================
// ---- every achievement has its own trophy: [shape, colour, emblem] ----
const TCOL = { gold: ['#ffd84d', '#a07800'], silver: ['#e6ebf3', '#7d869c'], rose: ['#ff9fbb', '#b0405f'], teal: ['#62e3c9', '#1f8a74'],
  blue: ['#7fb0ff', '#2a4fa0'], red: ['#ff6b6b', '#9e1f1f'], purple: ['#c9a2ff', '#5e3aa8'], black: ['#5a6078', '#15182a'] };
const TDES = {
  first: ['medal', 'gold', 't:1'], fin: ['shield', 'blue', 'f:7'],
  rus: ['gem', 'red', 'f:14'], union: ['shield', 'purple', 't:H'], all: ['cup', 'gold', 't:15'], heart: ['medal', 'rose', 'heart'],
  combo10: ['star', 'purple', 't:×10'], star: ['medal', 'silver', 'star'], close: ['shield', 'red', 't:!'],
  merges100: ['plaque', 'teal', 't:100'], s100k: ['cup', 'gold', 't:100k'],
  marathon: ['plaque', 'blue', 't:30m'], games50: ['plaque', 'gold', 't:50'],
  daily: ['shield', 'gold', 't:24h'], daily60: ['shield', 'silver', 't:60'],
  map3: ['plaque', 'silver', 't:3'], mapAll: ['crown', 'purple', 't:EU'], nelli: ['heart', 'rose', 't:N'], admin: ['shield', 'black', 't:#'], quiet: ['medal', 'black', 't:zZ'],
 
  v_first: ['shield', 'silver', 't:1'], v_l7: ['shield', 'teal', 't:N'],
  v_l14: ['shield', 'gold', 't:O'], v_union: ['crown', 'gold', 't:R'], v_all: ['cup', 'gold', 't:15'],
  h_first: ['heart', 'rose', 't:1'], h_l7: ['heart', 'teal', 't:7'],
  h_l14: ['heart', 'gold', 'heart'], h_union: ['crown', 'rose', 'heart'], h_all: ['cup', 'rose', 't:15'],
  u_first: ['plaque', 'silver', 't:1+1'], u_l7: ['plaque', 'teal', 't:x'],
  u_l14: ['plaque', 'gold', 't:[ ]'], u_union: ['crown', 'teal', 't:A·B'], u_all: ['cup', 'teal', 't:15'],
  stage1: ['star', 'blue', 't:I'], stage2: ['star', 'gold', 't:II'], stage3: ['crown', 'gold', 't:III'],
  v_stage1: ['shield', 'blue', 't:I'], v_stage2: ['shield', 'red', 't:II'], v_stage3: ['crown', 'teal', 't:III'],
  h_stage1: ['heart', 'red', 't:I'], h_stage2: ['gem', 'rose', 't:II'], h_stage3: ['crown', 'purple', 't:III'],
  u_stage1: ['plaque', 'blue', 't:I'], u_stage2: ['plaque', 'red', 't:II'], u_stage3: ['crown', 'silver', 't:III']
};
function starPath(c, x, y, r1, r2) { c.beginPath(); for (let p = 0; p < 10; p++) { const r = p % 2 ? r2 : r1, a = -Math.PI / 2 + p * Math.PI / 5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
function drawTrophyOn(c, id, x, y, s) {
  // draws the trophy for achievement `id`, roughly s units tall, centred at (x, y)
  const [shape, col, emb] = TDES[id] || ['cup', 'gold', ''], [fc, sc] = TCOL[col];
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineWidth = 0.06;
  const g = c.createLinearGradient(-0.5, -0.5, 0.5, 0.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, fc); g.addColorStop(1, sc);
  c.fillStyle = g; c.strokeStyle = sc;
  let ex = 0, ey = -0.08, er = 0.22;
  if (shape === 'cup') {
    c.beginPath(); c.moveTo(-0.36, -0.45); c.lineTo(0.36, -0.45); c.quadraticCurveTo(0.36, 0.12, 0, 0.12); c.quadraticCurveTo(-0.36, 0.12, -0.36, -0.45); c.fill(); c.stroke();
    c.beginPath(); c.arc(-0.38, -0.25, 0.14, Math.PI * 0.5, Math.PI * 1.5); c.moveTo(0.38, -0.39); c.arc(0.38, -0.25, 0.14, -Math.PI * 0.5, Math.PI * 0.5); c.lineWidth = 0.07; c.stroke();
    c.fillRect(-0.06, 0.12, 0.12, 0.2); c.fillRect(-0.24, 0.32, 0.48, 0.12); c.strokeRect(-0.24, 0.32, 0.48, 0.12); ey = -0.2; er = 0.18;
  } else if (shape === 'medal') {
    c.fillStyle = '#d94a5c'; c.beginPath(); c.moveTo(-0.22, -0.5); c.lineTo(-0.02, -0.08); c.lineTo(0.08, -0.12); c.lineTo(-0.08, -0.5); c.fill();
    c.fillStyle = '#3a6fd8'; c.beginPath(); c.moveTo(0.22, -0.5); c.lineTo(0.02, -0.08); c.lineTo(-0.08, -0.12); c.lineTo(0.08, -0.5); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(0, 0.12, 0.32, 0, TAU); c.fill(); c.stroke(); ey = 0.12; er = 0.23;
  } else if (shape === 'star') {
    starPath(c, 0, 0, 0.5, 0.23); c.fill(); c.stroke(); ey = 0.02; er = 0.18;
  } else if (shape === 'shield') {
    c.beginPath(); c.moveTo(0, -0.48); c.lineTo(0.4, -0.34); c.lineTo(0.36, 0.08); c.quadraticCurveTo(0.3, 0.38, 0, 0.5); c.quadraticCurveTo(-0.3, 0.38, -0.36, 0.08); c.lineTo(-0.4, -0.34); c.closePath(); c.fill(); c.stroke(); ey = 0; er = 0.23;
  } else if (shape === 'crown') {
    c.beginPath(); c.moveTo(-0.45, 0.3); c.lineTo(-0.45, -0.3); c.lineTo(-0.22, -0.05); c.lineTo(0, -0.42); c.lineTo(0.22, -0.05); c.lineTo(0.45, -0.3); c.lineTo(0.45, 0.3); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff4d6d'; for (const px of [-0.45, 0, 0.45]) { c.beginPath(); c.arc(px, px ? -0.33 : -0.45, 0.06, 0, TAU); c.fill(); }
    ey = 0.1; er = 0.17;
  } else if (shape === 'gem') {
    c.beginPath(); c.moveTo(-0.3, -0.36); c.lineTo(0.3, -0.36); c.lineTo(0.46, -0.1); c.lineTo(0, 0.48); c.lineTo(-0.46, -0.1); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-0.46, -0.1); c.lineTo(0.46, -0.1); c.moveTo(-0.12, -0.36); c.lineTo(0, 0.48); c.lineTo(0.12, -0.36); c.stroke(); ey = -0.04; er = 0.16;
  } else if (shape === 'plaque') {
    c.beginPath(); c.roundRect ? c.roundRect(-0.42, -0.42, 0.84, 0.7, 0.1) : c.rect(-0.42, -0.42, 0.84, 0.7); c.fill(); c.stroke();
    c.fillStyle = sc; c.fillRect(-0.18, 0.28, 0.36, 0.08); c.fillRect(-0.3, 0.36, 0.6, 0.1); ey = -0.07; er = 0.24;
  } else if (shape === 'heart') {
    heartPath(c, 0, 0.12, 0.62); c.fill(); c.stroke(); ey = -0.06; er = 0.18;
  }
  // emblem
  if (emb.startsWith('f:')) {
    c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip(); c.translate(ex, ey);
    const keep = ctx; ctx = c; drawFlag(Number(emb.slice(2)), er * 1.3); ctx = keep; c.restore();
    c.lineWidth = 0.04; c.strokeStyle = sc; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.stroke();
  } else if (emb === 'star') { c.fillStyle = '#fff'; starPath(c, ex, ey, er * 0.9, er * 0.4); c.fill(); }
  else if (emb === 'heart') { c.fillStyle = '#e01e37'; heartPath(c, ex, ey + er * 0.3, er * 1.05); c.fill(); }
  else if (emb === 'eu') { c.fillStyle = '#ffcc00'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; starPath(c, ex + Math.cos(a) * er * 0.85, ey + Math.sin(a) * er * 0.85, 0.05, 0.022); c.fill(); } c.fillStyle = '#123072'; c.beginPath(); c.arc(ex, ey, er * 0.55, 0, TAU); c.fill(); }
  else if (emb.startsWith('t:')) {
    const t = emb.slice(2), fs = t.length > 3 ? 0.2 : t.length > 2 ? 0.25 : 0.32;
    c.font = `800 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 0.07; c.strokeStyle = sc; c.strokeText(t, ex, ey + 0.01); c.fillStyle = '#fff'; c.fillText(t, ex, ey + 0.01);
  }
  // shine
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-0.18, -0.22, 0.05, 0.12, 0.4, 0, TAU); c.fill();
  c.restore();
}
const trophyImgCache = {};
function trophyImg(id, locked) {
  const key = id + (locked ? '-l' : '');
  if (trophyImgCache[key]) return trophyImgCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const c = cv.getContext('2d');
  c.setTransform(96, 0, 0, 96, 48, 48);
  if (locked) { c.globalAlpha = 0.25; c.filter = 'grayscale(1)'; }
  drawTrophyOn(c, id, 0, 0, 0.9);
  return (trophyImgCache[key] = cv.toDataURL());
}
// the trophy display case in the bottom left corner of the wagon: six trophies, chosen by the player
// (or the six newest); the trophies in it can be grabbed and thrown
const TROPHY_S = 0.62, TROPHY_R = 0.3, VIT_N = 6, VIT = { x: 0.3, y: FLOOR_Y - 2.85, w: 3.6, h: 2.45 };
const VIT_KEY = 'piispanpeli-vitrine';
// the trophies in the case: the player's own picks, or the newest ones
let vitPick = store.get(VIT_KEY, null);
function setVitrine(ids) { vitPick = ids; store.set(VIT_KEY, ids); }
function vitrineIds() {
  const pick = vitPick;
  if (Array.isArray(pick)) return pick.filter(id => achGot[id] && ACH.some(a => a[0] === id)).slice(0, VIT_N);
  return ACH.filter(a => achGot[a[0]]).sort((a, b) => (+achGot[b[0]] || 0) - (+achGot[a[0]] || 0)).slice(0, VIT_N).map(a => a[0]).reverse();
}
const vitSlot = k => [VIT.x + 0.6 + (k % 3) * 1.2, VIT.y + 0.62 + Math.floor(k / 3) * 1.05];
// where an achievement's trophy stands, by its index in ACH (null when it is not in the case)
function shelfPos(i) {
  const k = vitrineIds().indexOf(ACH[i][0]);
  return k < 0 ? null : vitSlot(k);
}
const TOBJ = {};   // id -> { x, y, vx, vy, a, va, st: 'held'|'fly'|'home', t, rest, tx, ty, hx, hy }
let heldTrophy = null;
function activeTrophies() { return Object.keys(TOBJ); }
function trophyPhys() {
  const ids = activeTrophies();
  if (!ids.length) return;
  for (const id of ids) {
    const o = TOBJ[id];
    if (o.st === 'home') continue;
    if (o.st === 'held') {
      const nx = o.x + (o.tx - o.x) * 0.35, ny = o.y + (o.ty - o.y) * 0.35;
      o.vx = (nx - o.x) / H; o.vy = (ny - o.y) / H; o.x = nx; o.y = ny;
      o.va = o.va * 0.98 + o.vx * 0.02;
    } else {
      o.vx += E.gx * 0.7 * H; o.vy += E.gy * 0.7 * H;
      o.x += o.vx * H; o.y += o.vy * H;
    }
    o.a += o.va * H;
    // wagon walls and floor
    const fw = funnelAt(o.y), x0 = TROPHY_R - fw, x1 = WORLD_W - TROPHY_R + fw, ymax = FLOOR_Y - TROPHY_R;
    if (o.y > -0.5) {
      if (o.x < x0) { o.x = x0; if (o.vx < 0) o.vx *= -0.5; }
      if (o.x > x1) { o.x = x1; if (o.vx > 0) o.vx *= -0.5; }
    }
    if (o.y > ymax) { o.y = ymax; if (o.vy > 0) { o.vy *= -0.35; o.vx *= 0.9; o.va = o.vx / TROPHY_R; } }
  }
}
E.hook = trophyPhys;
if (/debug/.test(location.hash)) window.__piispanDebug = { shelfPos, TOBJ, view: () => ({ OX, OY, SC }), setDep: (a, b) => { tgtL = a; tgtR = b; } };
function trophyStep() {
  for (const id of activeTrophies()) {
    const o = TOBJ[id]; o.t += STEP;
    if (o.st === 'fly') {
      const sp = Math.hypot(o.vx, o.vy);
      o.rest = sp < 0.6 ? o.rest + STEP : 0;
      if (o.rest > 1.2 || o.t > 9 || o.y < -6 || o.y > FLOOR_Y + 3) { o.st = 'home'; o.t = 0; o.sx = o.x; o.sy = o.y; o.sa = o.a; }
    } else if (o.st === 'home') {
      const u = Math.min(1, o.t / 0.7), e = u * u * (3 - 2 * u);
      o.x = o.sx + (o.hx - o.sx) * e; o.y = o.sy + (o.hy - o.sy) * e - Math.sin(u * Math.PI) * 1.2; o.a = o.sa * (1 - e);
      if (u >= 1) delete TOBJ[id];
    }
  }
}
function insideAnyBlob(px, py) {
  for (const b of E.blobs) {
    const s = b.start, n = b.n;
    if (Math.abs(b.cx - px) > b.R * 1.6 || Math.abs(b.cy - py) > b.R * 1.6) continue;
    let inside = false;
    for (let k = 0, m = n - 1; k < n; m = k++) {
      const yi = Y[s + k], yj = Y[s + m];
      if ((yi > py) !== (yj > py) && px < (X[s + m] - X[s + k]) * (py - yi) / (yj - yi) + X[s + k]) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}
function pickTrophy(wx, wy) {
  let best = null, bd = 0.62;
  ACH.forEach((a, i) => {
    if (!achGot[a[0]] || TOBJ[a[0]]) return;
    const at = shelfPos(i);
    if (!at) return;
    const [x, y] = at, d = Math.hypot(wx - x, wy - y);
    if (d < bd) { bd = d; best = [a[0], x, y]; }
  });
  if (!best || insideAnyBlob(wx, wy)) return null;
  const [id, x, y] = best;
  TOBJ[id] = { x, y, vx: 0, vy: 0, a: 0, va: 0, st: 'held', t: 0, rest: 0, tx: wx, ty: wy, hx: x, hy: y };
  return id;
}
function drawTrophyWall() {
  const { x, y, w, h } = VIT, ids = vitrineIds(), now = Date.now();
  // wooden frame, dark back, two glass shelves
  ctx.fillStyle = 'rgba(70,44,22,0.92)'; rrect(x - 0.12, y - 0.12, w + 0.24, h + 0.24, 0.3); ctx.fill();
  ctx.fillStyle = 'rgba(150,100,50,0.9)'; rrect(x + 0.1, y - 0.1, w - 0.2, 0.06, 0.03); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(16,26,58,0.92)'); g.addColorStop(1, 'rgba(26,40,84,0.92)');
  ctx.fillStyle = g; rrect(x, y, w, h, 0.2); ctx.fill();
  for (let r = 0; r < 2; r++) { ctx.fillStyle = 'rgba(255,214,90,0.45)'; rrect(x + 0.15, y + 0.92 + r * 1.05, w - 0.3, 0.05, 0.025); ctx.fill(); }
  for (let k = 0; k < VIT_N; k++) {
    const [tx, ty] = vitSlot(k), id = ids[k];
    if (!id) { ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.arc(tx, ty, 0.24, 0, TAU); ctx.stroke(); continue; }
    // a soft spotlight behind each trophy
    const sg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 0.55); sg.addColorStop(0, 'rgba(255,220,120,0.3)'); sg.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(tx, ty, 0.55, 0, TAU); ctx.fill();
    if (TOBJ[id]) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(tx, ty + 0.27, 0.22, 0.05, 0, 0, TAU); ctx.fill(); continue; }
    const age = (now - achGot[id]) / 1000, pop = age > 0 && age < 1.2 ? 1 + Math.sin(age * 9) * 0.35 * (1.2 - age) : 1;
    drawTrophyOn(ctx, id, tx, ty, TROPHY_S * 1.15 * pop);
  }
  // the glass: a faint sheen and a bright streak
  ctx.fillStyle = 'rgba(200,230,255,0.08)'; rrect(x, y, w, h, 0.2); ctx.fill();
  ctx.save(); rrect(x, y, w, h, 0.2); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.moveTo(x + 0.3, y); ctx.lineTo(x + 0.75, y); ctx.lineTo(x + 0.2, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h * 0.55); ctx.closePath(); ctx.fill(); ctx.restore();
  // brass plate: how many trophies there are in all
  ctx.fillStyle = '#d9a400'; rrect(x + w / 2 - 0.6, y + h - 0.04, 1.2, 0.3, 0.15); ctx.fill();
  ctx.fillStyle = '#231d45'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  worldText(achCount() + ' / ' + ACH.length, x + w / 2, y + h + 0.11, 0.2, 800); ctx.textBaseline = 'alphabetic';
}
function drawFlyingTrophies() {
  for (const id of activeTrophies()) {
    const o = TOBJ[id];
    if (o.st === 'held') { ctx.fillStyle = 'rgba(255,220,90,0.25)'; ctx.beginPath(); ctx.arc(o.x, o.y, 0.55, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); drawTrophyOn(ctx, id, 0, 0, TROPHY_S * (o.st === 'held' ? 1.15 : 1)); ctx.restore();
  }
}

// the very easy ones (first merge, the 8th ball, the bonus star) were left out on purpose: they popped up all the time at the start
const ACH = [
  ['rus', 'Itäblokki', 'Saa USSR.'],
  ['union', 'Alamaailman Hermes', 'Yhdistä kaksi USSR:ää.'],
  ['all', 'Keräilijä', 'Avaa kaikki 15 maata. Palkintona kultaiset reunat!'],
  ['combo10', 'Ketjureaktio', 'Tee kombo ×10.'],
  ['heart', 'Rakkauden ammattilainen', 'Osu Nelli-bonukseen.'],
  ['close', 'Täpärä', 'Selviä, kun toinen nappi on ollut punaisena 5 sekuntia.'],
  ['merges100', 'Ahkera yhdistäjä', 'Tee 100 yhdistymistä yhdessä pelissä.'],
  ['s100k', 'Satatonni', 'Kerää 100 000 pistettä yhdessä pelissä.'],
  ['marathon', 'Maratoonari', 'Pelaa yhtä peliä 30 minuuttia.'],
  ['games50', 'Sitkeä', 'Pelaa 50 peliä.'],
  ['daily', 'Päivän sankari', 'Läpäise päivän haaste.', 'mode'],
  ['daily60', 'Tehokas', 'Läpäise päivän haaste alle 60 laukauksella.', 'mode'],
  ['map3', 'Tutkimusmatkailija', 'Suorita 3 tehtävää tehtäväkartalla.', 'mode'],
  ['mapAll', 'Euroopan valloittaja', 'Suorita kaikki tehtävät.', 'mode'],
  ['nelli', 'Nellin rakas', 'Laukaise Nellin yllätys.', 'secret'],
  ['admin', 'Huijari', 'Avaa admin-tila.', 'secret'],
  ['quiet', 'Hiljainen hetki', 'Aloita peli musiikki pois päältä.', 'secret'],
  // each theme has its own ball achievements; they only count while that theme is in use
  ['v_l14', 'Kaikkien isä', 'Saa Odin.', 'viking'],
  ['v_union', 'Ragnarök', 'Yhdistä kaksi Odinia.', 'viking'],
  ['v_all', 'Yggdrasil', 'Avaa kaikki 15 jumalaa.', 'viking'],
  ['h_l14', 'Kultainen sydän', 'Saa kultainen sydän.', 'heart'],
  ['h_union', 'Ikuinen rakkaus', 'Yhdistä kaksi kultaista sydäntä.', 'heart'],
  ['h_all', 'Sydänten kerääjä', 'Avaa kaikki 15 sydäntä.', 'heart'],
  ['u_l14', 'Matriisien mestari', 'Saa matriisi.', 'uni'],
  ['u_union', 'Professori', 'Yhdistä kaksi matriisia.', 'uni'],
  ['u_all', 'Kaikki kurssit suoritettu', 'Avaa kaikki 15 laskua.', 'uni'],
  // beating the stages
  ['stage1', 'Kohti tähtiä', 'Läpäise taso 1: Eurooppa.'],
  ['stage2', 'Aurinkokunnan valtias', 'Läpäise taso 2: Aurinkokunta.'],
  ['stage3', 'Universumin herra', 'Läpäise taso 3: Galaksi.'],
  ['v_stage1', 'Bifröstin yli', 'Läpäise taso 1: Jumalat.', 'viking'],
  ['v_stage2', 'Hirviöiden kesyttäjä', 'Läpäise taso 2: Olennot.', 'viking'],
  ['v_stage3', 'Yggdrasilin vartija', 'Läpäise taso 3: Yhdeksän maailmaa.', 'viking'],
  ['h_stage1', 'Sydämen asialla', 'Läpäise taso 1: Sydämet.', 'heart'],
  ['h_stage2', 'Jalokivikauppias', 'Läpäise taso 2: Jalokivisydämet.', 'heart'],
  ['h_stage3', 'Kosminen rakkaus', 'Läpäise taso 3: Kosmiset sydämet.', 'heart'],
  ['u_stage1', 'Laskutaitoinen', 'Läpäise taso 1: Laskut.', 'uni'],
  ['u_stage2', 'Fyysikko', 'Läpäise taso 2: Fysiikka.', 'uni'],
  ['u_stage3', 'Elinikäinen oppija', 'Läpäise taso 3: Yliopisto.', 'uni']
];
const TROPHY_AT = [5, 10, 15, 20, 25, ACH.length];
let achGot = store.get('piispanpeli-ach', {}) || {};
stage = stageSel();   // the menu shows the balls of the stage the next game starts on
const achCount = () => ACH.filter(a => achGot[a[0]]).length;
const trophies = () => TROPHY_AT.filter(n => achCount() >= n).length;
const goldEdges = () => !!achGot.all;
let seenEver = new Set(store.get('piispanpeli-seen', []) || []);
// balls seen in each theme (the EU train uses the original list above)
const seenThemes = {};
function seenFor(id) {
  if (id === 'eu') return seenEver;
  return seenThemes[id] || (seenThemes[id] = new Set(store.get('piispanpeli-seen-' + id, []) || []));
}
const ACH_PFX = { viking: 'v_', heart: 'h_', uni: 'u_' };
// no spoilers: a ball the player has not seen yet is called by its number ("11. pallo") in goals and texts
function ballSeen(i) {
  if (i <= 4) return true;   // the first five are always shown in the ball row
  if (stage > 0) return stagesDone(theme().id) > stage || i <= maxLevel;
  return seenFor(theme().id).has(i) || i <= maxLevel;
}
const ballLabel = i => (ballSeen(i) ? NAMES[i] : T('{0}. pallo', i + 1));
const ballTail = i => (ballSeen(i) ? NAMES[i] : '?');
// achievement goals that name a ball are told by number until that ball has been seen in the theme
function achDesc(a) {
  if (achGot[a[0]]) return a[2];
  const id = a[0], th = ['viking', 'heart', 'uni'].includes(a[3]) ? a[3] : 'eu', seen = seenFor(th);
  const rule = id === 'rus' || /_l14$/.test(id) ? [[14], () => T('Saa suurin pallo.')]
    : /union$/.test(id) ? [[14], () => T('Yhdistä kaksi suurinta palloa.')] : null;
  return rule && !rule[0].every(l => seen.has(l)) ? rule[1]() : a[2];
}
// the names of the biggest-ball achievements (e.g. "Matriisien mestari") would tell what the biggest ball is
function achTitle(a) {
  if (achGot[a[0]] || !(a[0] === 'rus' || /_l14$|union$/.test(a[0]))) return a[1];
  return seenFor(['viking', 'heart', 'uni'].includes(a[3]) ? a[3] : 'eu').has(14) ? a[1] : '???';
}
// the id of an achievement in the theme in use: 'first' becomes 'v_first' in the viking theme, and so on
const achFor = base => (theme().id === 'eu' ? base : ACH_PFX[theme().id] + base);
const CUP = (c1, c2) => `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 4h14v6a7 7 0 0 1-14 0z" fill="${c1}"/><path d="M9 6H5a4 4 0 0 0 4 6M23 6h4a4 4 0 0 1-4 6" fill="none" stroke="${c2}" stroke-width="2"/><rect x="14" y="16" width="4" height="6" fill="${c2}"/><rect x="10" y="22" width="12" height="4" rx="1.5" fill="${c1}"/><path d="M12 6h3v5h-3z" fill="#fff" opacity=".45"/></svg>`;
const toastQ = [];
let toastBusy = false;
const toastEl = document.getElementById('toast');
function toast(title, sub, id) {
  toastQ.push([title, sub, id]);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const t = toastQ.shift();
  if (!t) { toastBusy = false; return; }
  toastBusy = true;
  toastEl.innerHTML = (t[2] ? `<img src="${trophyImg(t[2])}" alt="" width="34" height="34">` : CUP('#ffcc00', '#a07800')) + `<div>${t[0]}<small>${t[1]}</small></div>`;
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => { toastEl.classList.remove('show'); setTimeout(nextToast, 400); }, 2800);
}
function unlockEverything() {
  // admin: open every achievement, theme, wardrobe item, country and mission at once (no toast flood)
  const now = Date.now();
  ACH.forEach((a, i) => { if (!achGot[a[0]]) achGot[a[0]] = now - (ACH.length - i); });
  store.set('piispanpeli-ach', achGot);
  for (let l = 0; l <= MAXL; l++) seenEver.add(l);
  store.set('piispanpeli-seen', [...seenEver]);
  for (const id in ACH_PFX) { const s = seenFor(id); for (let l = 0; l <= MAXL; l++) s.add(l); store.set('piispanpeli-seen-' + id, [...s]); }
  store.set('piispanpeli-map', MISSIONS.length);
  bestLevel = MAXL; store.set('piispanpeli-level', bestLevel);
  for (const t of THEMES) store.set('piispanpeli-stage-' + t.id, 3);
}
function unlock(id) {
  if (achGot[id]) return;
  if (cheated && id !== 'admin' && (state === 'play' || state === 'paused' || state === 'over')) return;
  const a = ACH.find(x => x[0] === id);
  if (!a) return;
  const before = trophies();
  achGot[id] = Date.now(); store.set('piispanpeli-ach', achGot);
  // the Hermes reward: the balls put on their golden rims right away (can be switched off in the wardrobe)
  if (id === 'union' && look.ball === 'plain') { look.ball = 'gold'; store.set('piispanpeli-look', look); }
  toast(T('Saavutus: {0}', a[1]), a[2], id);
  sfx.ensure(); sfx.mega();
  if (trophies() > before) toast(T('Kultapalkinto {0}/{1}!', trophies(), TROPHY_AT.length), T('Se näkyy nyt junavaunun kyljessä.'));
  if (id === 'all') toast(T('Kultaiset reunat!'), T('Junavaunusi on nyt kullattu.'));
  for (const t of THEMES) if (t.ach === id) toast(T('Uusi teema: {0}!', T(t.name)), T('Valitse se päävalikon Teemat-napista.'));
  for (const slot in WARDROBE) for (const it of WARDROBE[slot]) if (it[2] === id) toast(T('Uusi tavara hahmolle: {0}!', it[1]), T('Pue se päälle päävalikon Hahmo-napista.'));
}
function noteLevel(l) {
  gotLevels.add(l);
  if (stage > 0 || cheated) return;   // the balls of stages 2 and 3 have no collection or ball achievements of their own
  const th = theme().id, seen = seenFor(th);
  if (!seen.has(l)) { seen.add(l); store.set(th === 'eu' ? 'piispanpeli-seen' : 'piispanpeli-seen-' + th, [...seen]); }
  if (th === 'eu') {
    if (l >= 14) unlock('rus');
  } else {
    const p = ACH_PFX[th];
    if (l >= 14) unlock(p + 'l14');
    if (seen.size >= MAXL + 1) unlock(p + 'all');
  }
  if (th === 'eu' && seenEver.size >= MAXL + 1) unlock('all');
}

function syncUI() {
  pauseBtn.hidden = !(state === 'play' || state === 'paused');
  syncAbil();
  canvas.style.cursor = state === 'play' ? 'crosshair' : 'default';
}

function startGame(m, mi) {
  if (state === 'play') return;
  if (m) gmode = m;
  setStage(gmode === 'classic' ? stageSel() : 0); stageDone = false; stageT = 0; failGoal = null;
  missionIdx = gmode === 'map' ? (mi != null ? mi : missionIdx) : -1;
  dayKey = todayKey();
  rng = gmode === 'daily' ? mulberry(dayKey) : Math.random;
  const ms = missionIdx >= 0 ? MISSIONS[missionIdx] : null;
  modeT = ms && ms.time ? ms.time : 0;
  cheated = invincible || infSwing;
  shots = 0; gotLevels = new Set(); playT = 0; oneBtnT = 0; mergesThisGame = 0; failT = 0; endReason = 'over';
  challengeReset(); metaResetGame();
  E.gx = 0; E.gy = GRAV;
  const gp = (Number(store.get('piispanpeli-games', 0)) || 0) + 1; store.set('piispanpeli-games', gp);
  if (gp >= 50) unlock('games50');
  if (music.track < 0) unlock('quiet');
  sfx.ensure();
  clearAll(); parts.length = 0; floaters.length = 0;
  bonuses.length = 0; bonusT = 12; jamT = 0;
  score = 0; shownScore = 0; maxLevel = 0; dangerT = 0; combo = 0; comboT = 0; shake = 0; blockedT = 0; charges = 0; abilProg = 0; wobT = 0;
  cur = rng() < 0.5 ? 1 : 2; nxt = randLevel(); cooldown = 0.2; popT = 0; aiming = false;
  state = 'play'; hideOverlay(); syncUI();
  startTransition('start', gmode === 'classic' ? T('Taso {0}: {1}', stage + 1, T(stageInfo().name)) : gmode === 'map' && ms ? NAMES[ms.c] : MODE_INFO[gmode].name);
}

function pause() { if (state !== 'play') return; state = 'paused'; aiming = false; autoSave(); showPause(); syncUI(); }

// ---- saving: an automatic save plus three save slots ----
const AUTO_KEY = 'piispanpeli-autosave', SLOT_KEY = i => 'piispanpeli-slot' + i;
let autoT = 0;
function gameData() {
  return { v: 1, t: Date.now(), score, cur, nxt, maxLevel, charges, abilProg, th: theme().id, stage, playT: Math.round(playT), done: stageDone, ch: cheated ? 1 : 0, chal: challengeSave(),
    blobs: E.blobs.map(b => [b.level, Math.round(b.cx * 100) / 100, Math.round(b.cy * 100) / 100, b.hp | 0]) };
}
function validSave(g) { return !!(g && Array.isArray(g.blobs)); }
function autoSave() { if ((state === 'play' || state === 'paused') && gmode === 'classic') store.set(AUTO_KEY, gameData()); }
function loadGame(g, play) {
  clearAll(); parts.length = 0; floaters.length = 0;
  for (const item of g.blobs) {
    const lv = item[0] | 0;
    if (!(lv >= 0 && lv <= MAXL) && lv !== STONE && lv !== BOSS) continue;
    const R = isSpecial(lv) ? SPECIAL_R[lv] : RADII[lv];
    const b = makeBlob(lv, clamp(+item[1] || 5, R, WORLD_W - R), clamp(+item[2] || 10, DANGER_Y, FLOOR_Y - R), 0, 0, 0.85);
    if (b && lv === STONE) b.hp = clamp(item[3] | 0, 1, 2);
  }
  score = shownScore = g.score | 0; cur = clamp(g.cur | 0, 0, MAXL); nxt = clamp(g.nxt | 0, 0, 6); maxLevel = g.maxLevel | 0;
  charges = g.charges | 0; abilProg = g.abilProg | 0; wobT = 0;
  dangerT = 0; combo = 0; comboT = 0; shake = 0; blockedT = 0; cooldown = 0.3; popT = 0; aiming = false; autoT = 0;
  gmode = 'classic'; missionIdx = -1; rng = Math.random; E.gx = 0; E.gy = GRAV; shots = 0; gotLevels = new Set(); playT = +g.playT || 0;
  cheated = !!g.ch || invincible || infSwing;
  metaResetGame();
  // a saved game comes back with the theme and stage it was played in
  const th = THEMES.find(t => t.id === g.th);
  if (th && themeOpen(th) && th.id !== themeId) { themeId = th.id; store.set('piispanpeli-theme', themeId); buildBg(); }
  stage = clamp(g.stage | 0, 0, STAGES[theme().id].length - 1); applyLang();
  stageDone = stage === STAGES[theme().id].length - 1 && !!g.done; stageT = 0; failGoal = null;
  challengeLoad(g.chal);
  sfx.ensure();
  if (play) { state = 'play'; hideOverlay(); startTransition('start', T('Taso {0}: {1}', stage + 1, T(stageInfo().name))); } else { state = 'paused'; showPause(); }
  syncUI();
}
function fmtDate(t) {
  const d = new Date(t), two = n => String(n).padStart(2, '0');
  return `${d.getDate()}.${d.getMonth() + 1}. ${two(d.getHours())}:${two(d.getMinutes())}`;
}
function slotsHTML(mode) {
  let rows = '', any = false;
  for (let i = 1; i <= 5; i++) {
    const s = store.get(SLOT_KEY(i), null), ok = validSave(s);
    if (ok) any = true;
    const info = ok ? `${T('{0} pistettä', s.score)} · ${fmtDate(s.t)}` : `<span class="muted">${T('tyhjä')}</span>`;
    let btns = '';
    if (mode === 'save') btns = `<button class="mini" type="button" data-act="save" data-slot="${i}">${T('Tallenna')}</button>`;
    else if (ok) btns = `<button class="mini" type="button" data-act="load" data-slot="${i}">${T('Lataa')}</button><button class="mini ghost" type="button" data-act="del" data-slot="${i}" aria-label="${T('Poista tallennus {0}', i)}">${T('Poista')}</button>`;
    rows += `<li><span class="slotname">${T('Tallennus {0}', i)}</span><span class="slotbtns">${btns}</span><span class="slotinfo">${info}</span></li>`;
  }
  if (mode !== 'save' && !any) return '';
  return `<div class="saves"><h3>${T(mode === 'save' ? 'Valitse tallennuspaikka' : 'Tallennetut pelit')}</h3><ul>${rows}</ul></div>`;
}
function toMenu() {
  autoSave(); E.gx = 0; E.gy = GRAV; setStage(stageSel());
  state = 'menu'; preloadMenu(); showMenu(); syncUI();
}
function resume() { if (state !== 'paused') return; state = 'play'; hideOverlay(); syncUI(); }

let jamT = 0;
function gameOver(reason) {
  reason = reason || 'over';
  if ((reason === 'over' || reason === 'stage') && (invincible || MODE_INFO[gmode].noLose)) { dangerT = 0; jamT = 0; return; }
  state = 'over'; aiming = false; endReason = reason;
  if (reason === 'win') gainCoins(gmode === 'daily' ? 30 : 20);
  let newBest = false;
  if (cheated) { /* the admin panel was used: nothing is recorded */ }
  else if (gmode === 'classic') { newBest = score > best; if (newBest) { best = score; store.set('piispanpeli-best', best); } }
  else if (gmode === 'daily' && reason === 'win') {
    const k = 'piispanpeli-daily-' + dayKey, prev = Number(store.get(k, 0)) || 0;
    newBest = !prev || shots < prev; if (newBest) store.set(k, shots);
    unlock('daily'); if (shots < 60) unlock('daily60');
  } else if (gmode === 'map' && reason === 'win') {
    if (missionIdx + 1 > mapDone()) store.set('piispanpeli-map', missionIdx + 1);
    if (mapDone() >= 3) unlock('map3');
    if (mapDone() >= MISSIONS.length) unlock('mapAll');
  }
  E.gx = 0; E.gy = GRAV;
  store.set(AUTO_KEY, null);
  if (!cheated && !stage && maxLevel > bestLevel) { bestLevel = maxLevel; store.set('piispanpeli-level', bestLevel); }
  if (reason === 'win') { sfx.mega(); triggerConfetti(); } else sfx.over();
  if (!reduceMotion && reason !== 'win') shake = Math.max(shake, 0.25);
  syncUI();
  setTimeout(() => { if (state === 'over') showOver(newBest); }, 1000);
}

function shoot() {
  if (state !== 'play' || cooldown > 0) return;
  const R = RADII[cur], lim = (R + RB) * (R + RB);
  for (let i = 0; i < E.NB; i++) {
    const dx = X[i] - LX, dy = Y[i] - LY;
    if (dx * dx + dy * dy < lim) { blockedT = 0.9; sfx.blocked(); return; }
  }
  const sp = 3 + aimPow * 29;
  const b = makeBlob(cur, LX, LY, Math.sin(aimAng) * sp, Math.cos(aimAng) * sp, 1);
  if (!b) return;
  maxLevel = Math.max(maxLevel, cur); noteLevel(cur); shots++; challengeOnShot();
  sfx.shoot(aimPow);
  cur = nxt; nxt = randLevel(); cooldown = 0.32; popT = 0;
}

// ------------------------------ effects ------------------------------
function triggerConfetti() { for (let l = 0; l <= MAXL; l++) burst(WORLD_W / 2, 6, l, 4, 3); }
function burst(x, y, level, count, R) {
  if (reduceMotion) count = Math.ceil(count / 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, sp = rand(2.5, 7) * (0.7 + R * 0.25), life = rand(0.45, 0.8);
    parts.push({ k: 0, x: x + Math.cos(a) * R * 0.6, y: y + Math.sin(a) * R * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
      r: rand(0.06, 0.15) * (0.8 + R * 0.2), life, max: life, c: PAL[level].light });
  }
}
function ring(x, y, R, level) { parts.push({ k: 1, x, y, r: R * 0.7, r1: R * 1.55, life: 0.35, max: 0.35, c: PAL[level].light }); }
function floater(text, x, y, color, size) { floaters.push({ text, x, y, life: 1.1, max: 1.1, color, size }); }

function handleEvent(ev) {
  if (ev.type === 'merge') {
    const R = RADII[ev.level];
    burst(ev.x, ev.y, ev.level, 8 + ev.level * 2, R); ring(ev.x, ev.y, R, ev.level);
    if (ev.level >= 4) mascotBounce = 1;
    sfx.merge(ev.level);
    if (ev.level >= 7 && !reduceMotion) shake = Math.max(shake, 0.1 + (ev.level - 7) * 0.06);
    // the world keeps moving behind the pause menu, so a merge there counts just the same
    if (state !== 'play' && state !== 'paused') return;
    combo = comboT > 0 ? combo + 1 : 1; comboT = 1.1;
    mergesThisGame++; noteLevel(ev.level);
    if (combo >= 10) unlock('combo10'); if (mergesThisGame >= 100) unlock('merges100');
    const pts = POINTS[ev.level] * combo;
    addScore(pts);
    floater('+' + pts, ev.x, ev.y, PAL[ev.level].light, 17 + ev.level * 1.5);
    if (combo >= 2) floater(T('Kombo ×{0}', combo), ev.x, ev.y - R - 0.5, '#fff7ee', 19);
    else if (ev.level >= 2) floater(NAMES[ev.level], ev.x, ev.y - R - 0.5, '#ffe066', 16 + ev.level);
    if (ev.level > maxLevel) {
      if (!stage && ev.level >= 5 && ev.level > bestLevel) floater(T('Uusi maa: {0}!', NAMES[ev.level]), ev.x, ev.y - R - 1.1, '#ffe066', 22);
      maxLevel = ev.level;
    }
    // experience from every merge, coins from the big ones
    gainXP(ev.level + 1); if (ev.level >= 6) gainCoins(ev.level - 5);
    challengeOnMerge(ev);
  } else if (ev.type === 'max') {
    for (let l = 0; l <= MAXL; l++) burst(ev.x, ev.y, l, 5, 2.5);
    ring(ev.x, ev.y, 3.2, MAXL); sfx.mega();
    if (state === 'play' || state === 'paused') { gainXP(200); gainCoins(40); }
    if (!reduceMotion) shake = 0.45;
    if (state !== 'play' && state !== 'paused') return;
    combo = comboT > 0 ? combo + 1 : 1; comboT = 1.1;
    if (!stage) unlock(achFor('union'));
    if (gmode === 'classic' && !stageDone && !stageT) stageT = 1.3;
    const pts = MAX_BONUS * combo;
    addScore(pts);
    floater(theme().id === 'eu' && !stage ? T('Alamaailman Hermes! +{0}', pts) : T('Mahtiyhdistys! +{0}', pts), ev.x, ev.y, '#ffe066', 28);
  }
}

function addScore(p) {
  score += p; abilProg += p;
  if (state === 'play' || state === 'paused') { if (score >= 100000) unlock('s100k'); }
  while (abilProg >= ABIL_COST) { abilProg -= ABIL_COST; charges++; floater(T('Heilautus valmis!'), WORLD_W / 2, 6, '#ffcc00', 24); }
  syncAbil();
}
function syncAbil() {
  const on = state === 'play' || state === 'paused';
  abilBtn.hidden = !on;
  if (!on) return;
  const have = infSwing || charges > 0;
  abilBtn.disabled = !have || wobT > 0;
  abilBtn.classList.toggle('ready', have && wobT <= 0);
  const fmt = n => n >= 1000 ? (Math.floor(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(Math.floor(n));
  abilBtn.textContent = infSwing ? T('Heilauta! ×{0}', '∞') : charges > 0 ? T('Heilauta! ×{0}', charges) : T('Heilautus {0} / {1}', fmt(abilProg), fmt(ABIL_COST));
  abilBtn.style.setProperty('--p', have ? '100%' : (abilProg / ABIL_COST * 100).toFixed(1) + '%');
  abilBtn.setAttribute('aria-label', have ? T('Heilauta vaunua, {0} käytettävissä', infSwing ? '∞' : charges) : T('Heilautus latautuu, {0} / {1} pistettä', Math.floor(abilProg), ABIL_COST));
}
function useAbility() {
  if (state !== 'play' || (!infSwing && charges <= 0) || wobT > 0) return;
  if (!infSwing) charges--; wobT = 1.4; ch.swings++;
  // throw everything up a bit, then rock the wagon from side to side
  for (const b of E.blobs) {
    const kick = 12 + Math.random() * 12, side = (Math.random() - 0.5) * 12;
    for (let i = b.start; i < b.start + b.n; i++) { VY[i] -= kick; VX[i] += side; }
  }
  if (!reduceMotion) shake = Math.max(shake, 0.35);
  sfx.mega(); mascotBounce = 1; dangerT = 0;
  floater(T('HEILAUTUS!'), WORLD_W / 2, 7, '#ffcc00', 30);
  syncAbil();
}
function wobbleStep() {
  if (wobT <= 0) return;
  wobT -= STEP;
  const a = Math.sin((1.4 - wobT) * TAU * 2.2) * 110 * Math.min(1, wobT / 0.4) * STEP;
  for (let i = 0; i < E.NB; i++) VX[i] += a;
  if (wobT <= 0) { wobT = 0; syncAbil(); }
}

// two buttons on the wagon walls: game over when balls press both all the way at once
function checkDanger() {
  // how hard each button is pressed = how many bead contacts lean on it
  const y0 = BTN_Y - BTN_H / 2 - RB, y1 = BTN_Y + BTN_H / 2 + RB, lim = RB + 0.15;
  let cl = 0, cr = 0;
  for (let i = 0; i < E.NB; i++) {
    const y = Y[i];
    if (y < y0 || y > y1) continue;
    if (X[i] < lim) cl++; else if (X[i] > WORLD_W - lim) cr++;
  }
  // gauge level grows with how many bead contacts press the button (green → yellow → red)
  tgtL = cl > 0 ? Math.min(1, 0.45 + cl / 5) : 0; tgtR = cr > 0 ? Math.min(1, 0.45 + cr / 5) : 0;
  btnL = cl > 0; btnR = cr > 0;
  if (btnL && btnR && wobT <= 0) { dangerT += STEP; if (dangerT >= DANGER_TIME) gameOver(); }
  else dangerT = Math.max(0, dangerT - STEP * 2);
}

function modeStep() {
  playT += STEP;
  if (playT >= 1800) unlock('marathon');
  // "close call": one button red for 5 s and you survive it
  if (btnL !== btnR) oneBtnT += STEP; else { if (!btnL && oneBtnT >= 5) unlock('close'); oneBtnT = 0; }
  if (gmode === 'classic') {
    // the biggest ball beats the stage (a moment later, so the merge can be seen); stages 2 and 3 have time limits
    // merging the two biggest balls beats the stage; a moment later (so the merge can be seen) the next stage begins
    if (stageT > 0) { stageT -= STEP; if (stageT <= 0) { stageT = 0; completeStage(); return; } }
    if (challengeStep()) return;
  } else if (gmode === 'daily') { if (maxLevel >= 10) gameOver('win'); }
  else if (gmode === 'map') {
    const ms = MISSIONS[missionIdx];
    const ok = (ms.level != null && maxLevel >= ms.level) || (ms.score != null && score >= ms.score) || (ms.combo != null && combo >= ms.combo);
    if (ok) { gameOver('win'); return; }
    if (ms.time) { modeT -= STEP; if (modeT <= 0) { modeT = 0; gameOver('fail'); return; } }
    if (ms.shots && shots >= ms.shots) { failT += STEP; if (failT > 4) gameOver('fail'); }
  }
}

function completeStage() {
  const id = theme().id, n = stage + 1, set = STAGES[id];
  unlock(achFor('stage' + n));
  const [stars, more] = recordStars(); lastStars = stars;
  gainXP(150 * n);
  if (n >= set.length) floater(starStr(stars), WORLD_W / 2, 4.6, '#ffd84d', 40);   // a new stage shows them in its banner
  if (more) toast(T('{0} tähteä tasosta {1}!', stars, n), T('+{0} kolikkoa', 20 * more));
  if (!cheated && stagesDone(id) < n) store.set('piispanpeli-stage-' + id, n);
  if (n >= set.length) {
    // the last stage: a final win screen, after which the player may keep collecting points
    stageDone = true; aiming = false;
    if (!cheated && score > best) { best = score; store.set('piispanpeli-best', best); }
    state = 'paused'; autoSave(); syncUI(); showStageWin();
    return;
  }
  // the next stage begins right away in the same game: the score stays, the wagon is emptied for the new balls
  if (!cheated) store.set('piispanpeli-stagesel-' + id, n);
  for (const b of E.blobs) burst(b.cx, b.cy, b.level, 6, b.R);
  clearAll(); setStage(n); challengeReset();
  maxLevel = 0; playT = 0; gotLevels = new Set(); dangerT = 0; jamT = 0; combo = 0; comboT = 0; failT = 0; oneBtnT = 0;
  cur = rng() < 0.5 ? 1 : 2; nxt = randLevel(); cooldown = 0.6; popT = 0;
  triggerConfetti(); sfx.mega(); mascotBounce = 1;
  if (!reduceMotion) shake = Math.max(shake, 0.4);
  startTransition('stage', T('Uusi taso: {0}!', T(set[n].name)), starStr(stars));
  toast(T('Taso {0}: {1}', n + 1, T(set[n].name)), T('Pisteesi säilyvät. Uudet pallot!'));
  autoSave();
}

function attract() {
  menuT -= STEP;
  if (menuT > 0) return;
  menuT = 1.1;
  if (E.blobs.length >= 24) return;
  for (const b of E.blobs) if (b.top < 6) return;
  const lv = Math.floor(Math.random() * 6), R = RADII[lv];
  makeBlob(lv, rand(R + 0.3, WORLD_W - R - 0.3), -1.5, rand(-1.5, 1.5), 2, 1);
}

function preloadMenu() {
  clearAll();
  const placed = [];
  let tries = 0;
  while (placed.length < 13 && tries < 500) {
    tries++;
    const lv = Math.floor(Math.random() * 7), R = RADII[lv];
    const x = rand(R + 0.1, WORLD_W - R - 0.1), y = rand(6 + R, FLOOR_Y - R - 0.05);
    if (placed.some(p => Math.hypot(p.x - x, p.y - y) < p.R + R + 0.15)) continue;
    placed.push({ x, y, R });
    makeBlob(lv, x, y, 0, 0, 1);
  }
  for (let i = 0; i < 90; i++) stepPhysics();
  E.events.length = 0;
}

function stepGame() {
  if (state === 'play') {
    if (keys.ArrowLeft || keys.KeyA) aimAng = Math.max(-1.3, aimAng - 1.5 * STEP);
    if (keys.ArrowRight || keys.KeyD) aimAng = Math.min(1.3, aimAng + 1.5 * STEP);
    if (keys.ArrowUp || keys.KeyW) aimPow = Math.min(1, aimPow + 0.8 * STEP);
    if (keys.ArrowDown || keys.KeyS) aimPow = Math.max(0.03, aimPow - 0.8 * STEP);
    if (cooldown > 0) cooldown = Math.max(0, cooldown - STEP);
    autoT += STEP;
    if (autoT > 4) { autoT = 0; autoSave(); }
  } else if (state === 'menu') attract();
  stepPhysics(); trophyStep();
  for (let i = 0; i < E.events.length; i++) handleEvent(E.events[i]);
  E.events.length = 0;
  if (state === 'play') {
    modeStep();
    if (state !== 'play') return;
    wobbleStep(); checkDanger(); bonusStep();
    // launcher jammed: is there room for the waiting ball?
    const R = RADII[cur], lim = (R + RB) * (R + RB);
    let jam = false;
    for (let i = 0; i < E.NB; i++) { const dx = X[i] - LX, dy = Y[i] - LY; if (dx * dx + dy * dy < lim) { jam = true; break; } }
    if (jam) { jamT += STEP; if (jamT > 4) gameOver(); } else jamT = 0;
  }
  if (comboT > 0) { comboT -= STEP; if (comboT <= 0) combo = 0; }
}

function updateFx(dt) {
  depL += (tgtL - depL) * Math.min(1, dt * 14); depR += (tgtR - depR) * Math.min(1, dt * 14);
  updateNelli(dt);
  mascotBounce = Math.max(0, mascotBounce - dt * 3);
  time += dt; popT += dt;
  if (blockedT > 0) blockedT -= dt;
  shownScore += (score - shownScore) * Math.min(1, dt * 10);
  if (Math.abs(score - shownScore) < 0.5) shownScore = score;
  if (shake > 0) shake = Math.max(0, shake - dt * 1.4);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    if (p.k === 0) { p.vy += 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; }
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt; f.y -= 1.3 * dt;
    if (f.life <= 0) floaters.splice(i, 1);
  }
  for (const b of E.blobs) {
    b.blink -= dt;
    if (b.blink <= 0) { b.blinkT = 0.13; b.blink = rand(2.2, 6); }
    if (b.blinkT > 0) b.blinkT -= dt;
  }
}
