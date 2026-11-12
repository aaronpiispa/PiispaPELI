// PiispanPELI · Menus and overlays, install prompt, input handling and language switching.
'use strict';

// ------------------------------ easter egg for Nelli ------------------------------
let nelliT = 0, nelliMax = 7, typed = '', mascotTaps = 0, mascotTapT = 0, invincible = false, adminOn = false, usedKeys = false, aimId = null, cornerTaps = 0, cornerT = 0;
const hearts = [];
function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  c.closePath();
}
function triggerNelli(dur) {
  unlock('nelli');
  nelliT = nelliMax = dur || 7;
  const cols = ['#ff4d7d', '#ff8fab', '#e01e37', '#ffc2d1', '#ff5c8a'];
  for (let i = 0; i < (reduceMotion ? 20 : 70); i++)
    hearts.push({ x: Math.random() * vw, y: -20 - Math.random() * vh, vy: 60 + Math.random() * 120, s: 8 + Math.random() * 18, sw: Math.random() * TAU, c: cols[i % cols.length] });
  sfx.ensure(); sfx.mega();
  mascotBounce = 1;
}
function updateNelli(dt) {
  if (nelliT > 0) nelliT = Math.max(0, nelliT - dt);
  if (mascotTapT > 0) { mascotTapT -= dt; if (mascotTapT <= 0) mascotTaps = 0; }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i]; h.y += h.vy * dt; h.sw += dt * 2;
    if (h.y > vh + 40) hearts.splice(i, 1);
  }
}
const fxCanvas = document.getElementById('fx'), fctx = fxCanvas.getContext('2d');
let fxDirty = false;
function drawNelli() {
  if (fxCanvas.width !== canvas.width || fxCanvas.height !== canvas.height) { fxCanvas.width = canvas.width; fxCanvas.height = canvas.height; }
  if (!hearts.length && nelliT <= 0) { if (fxDirty) { fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); fxDirty = false; fxCanvas.hidden = true; } return; }
  // the effects layer is hidden while empty, so the browser does not have to blend a blank full-screen layer every frame
  if (!fxDirty) fxCanvas.hidden = false;
  fxDirty = true;
  const ctx = fctx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
  for (const h of hearts) { ctx.fillStyle = h.c; heartPath(ctx, h.x + Math.sin(h.sw) * 14, h.y, h.s); ctx.fill(); }
  // the short in-game version keeps its name off menus opened while it plays
  if (nelliT <= 0 || (nelliMax < 7 && !overlay.hidden)) return;
  const a = Math.min(1, nelliT / 1.2, (nelliMax - nelliT) / 0.4), pulse = 1 + Math.sin(time * 6) * 0.05;
  const fs = Math.min(vw / 6, 96) * pulse;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(vw / 2, vh * 0.3);
  ctx.fillStyle = 'rgba(45,0,22,0.82)'; ctx.beginPath(); ctx.roundRect(-fs * 1.9, -fs * 0.85, fs * 3.8, fs * 2.35, fs * 0.35); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = `400 ${fs}px "Lilita One", ${FONT}`;
  ctx.lineWidth = fs * 0.12; ctx.strokeStyle = '#3b0016'; ctx.strokeText('Nelli', 0, 0);
  ctx.fillStyle = '#ff4d7d'; ctx.fillText('Nelli', 0, 0);
  ctx.fillStyle = '#e01e37'; heartPath(ctx, 0, fs * 0.95, fs * 0.45); ctx.fill();
  ctx.restore();
}

// ------------------------------ overlays ------------------------------
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

let cardMascot = null;
// a new screen pops in with its parts sliding up one after another; redrawing the same screen (picking a stage,
// buying from the shop) does not replay it
let lastScreen = '';
function showOverlay(html, cls) {
  const wasHidden = overlay.hidden, h = (html.match(/<h[12][^>]*>(.*?)<\/h[12]>/) || [])[1] || '', key = (cls || '') + '|' + h;
  card.className = 'card start' + (cls && cls !== 'start' ? ' ' + cls : '');
  card.innerHTML = '<canvas class="mascot" width="200" height="200" aria-hidden="true"></canvas>' + html;
  if (wasHidden || key !== lastScreen) {
    card.classList.add('pop'); if (wasHidden) overlay.classList.add('fadein');
    if (cls !== 'menu' || wasHidden) mascotBounce = Math.max(mascotBounce, 0.6);
    sfx.whoosh();
  }
  lastScreen = key;
  overlay.hidden = false;
  cardMascot = card.querySelector('.mascot');
  if (usedKeys) { const f = card.querySelector('.mb.primary') || card.querySelector('button, select'); if (f) f.focus({ preventScroll: true }); }
}
let mascotBounce = 0;
function drawCardMascot() {
  if (!cardMascot || overlay.hidden) return;
  const c = cardMascot.getContext('2d'), w = cardMascot.width;
  c.clearRect(0, 0, w, w);
  drawMascot(c, w / 2, w * 0.46, w * 0.26, time, mascotBounce);
}
function hideOverlay() { overlay.hidden = true; lastScreen = ''; overlay.classList.remove('fadein'); }

const TITLE_COLORS = ['#ffcc00', '#4a8df0', '#ffffff', '#ffcc00', '#4a8df0', '#ffffff', '#ffcc00', '#ef4135', '#ffffff', '#169b62', '#ffcc00'];
function titleHTML() {
  return '<h1 class="title" aria-label="PiispanPELI">' + 'PiispanPELI'.split('').map((ch, i) =>
    `<span aria-hidden="true" style="color:${TITLE_COLORS[i]};transform:translateY(${i % 2 ? 3 : -2}px) rotate(${i % 2 ? 4 : -3}deg)">${ch}</span>`).join('') + '</h1>';
}

const MI = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  modes: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="4"/><rect x="3" y="13" width="8" height="8" rx="4"/><rect x="13" y="13" width="8" height="8" rx="2.2"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v2.5A4.5 4.5 0 0 1 16.3 12a5 5 0 0 1-3.3 2.9V17h3v2.5H8V17h3v-2.1A5 5 0 0 1 7.7 12 4.5 4.5 0 0 1 4 7.5V5h3zm0 4H6v.5a2.5 2.5 0 0 0 1.2 2.1C7.1 9 7 8.5 7 8zm10 0v1c0 .5-.1 1-.2 1.6A2.5 2.5 0 0 0 18 7.5V7z"/><rect x="6" y="20" width="12" height="2" rx="1"/></svg>',
  hat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 15c0-5 3-9 7-9s7 4 7 9z"/><ellipse cx="12" cy="16.5" rx="10" ry="2.8"/><circle cx="12" cy="5" r="2"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.3 9.3a2.8 2.8 0 1 1 3.6 2.7c-.6.2-.9.7-.9 1.3v.7"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2zm2 2v5h9V5zm5 9a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2l9 7.6-1.3 1.5L18 11v9h-4.5v-5.5h-3V20H6v-9l-1.7 1.3L3 10.8z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5.5v13a1 1 0 0 0 1.5.86L15 14v4.5h3v-13h-3V10L6.5 4.64A1 1 0 0 0 5 5.5z"/></svg>',
  train: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3l2 3h-2.4l-2-3H8.4l-2 3H4l2-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm0 3v4h12V6zm1.5 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#b8323a"/><path d="M12 12V2.5A9.5 9.5 0 0 1 21.5 12zM12 12v9.5A9.5 9.5 0 0 1 2.5 12z" fill="#f2e6cc"/><circle cx="12" cy="12" r="2.6" fill="#cfd5de"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="#6b4a2a" stroke-width="1.6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.1 1.7-1.9 3.1-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  cap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 8.5 12 14l9-4.5V16h2V8.5z"/><path d="M5.5 12.3v3.9C7 18 9.4 19 12 19s5-1 6.5-2.8v-3.9L12 15.6z"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h16l-1.4 11.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8z"/><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
};
function mb(id, icon, bg, fg, label, sub, primary) {
  return `<button class="mb${primary ? ' primary' : ''}" id="${id}" type="button"><span class="ic" style="${primary ? '' : `background:${bg};color:${fg}`}" aria-hidden="true">${MI[icon]}</span>` +
    `<span>${label}${sub ? `<small>${sub}</small>` : ''}</span>${MI.chev}</button>`;
}
function stageLine() {
  // the goal of the selected stage, shown under the stage buttons in the menu
  const goals = stageGoals(stage);
  if (!goals.length) return T('Yhdistä kaksi suurinta palloa, niin pääset seuraavalle tasolle.');
  return goalText(goals[0]) + '.';
}
// small (i) buttons that explain the goal of a stage or a game mode
const infoBtn = (kind, id, name) => `<button class="info" type="button" data-info="${kind}" data-id="${id}" aria-label="${T('Lisätietoa: {0}', name)}">i</button>`;
function stageNames(i) {
  // the Finnish names of a stage's balls, translated (the theme's own balls on stage 1)
  const id = theme().id, st = STAGES[id][i], tb = THEME_BALLS[id];
  return (st.names || (tb ? tb.names : FI.names)).map(n => T(n));
}
function showInfo(kind, id, back) {
  let title, body = '';
  const p = x => `<p class="info-p">${x}</p>`;
  if (kind === 'stage') {
    const i = Number(id), set = STAGES[theme().id], names = stageNames(i), goals = stageGoals(i), r = STAGE_RULES[i], st = starsOf(theme().id)[i];
    // names of balls the player has not seen on that stage stay hidden
    const open = stagesDone(theme().id) > i, lbl = l => (open || l <= 4 || (i === stage && l <= maxLevel) || (i === 0 && seenFor(theme().id).has(l)) ? names[l] : T('{0}. pallo', l + 1));
    title = T('Taso {0}: {1}', i + 1, T(set[i].name));
    body = p(T('Pallot: {0} → … → {1}', names[0], open ? names[MAXL] : '?')) +
      p('<b>' + T('Tavoite') + ':</b> ' + T('Yhdistä kaksi suurinta palloa.') + ' ' +
        (i + 1 < set.length ? T('Silloin peli siirtyy heti tasolle {0}: {1}.', i + 2, T(set[i + 1].name)) : T('Tämä on teeman viimeinen taso.'))) +
      p(goals.length ? '<b>' + T('Aikaraja') + ':</b> ' + goalText(goals[0]) + '. ' + T('Jos aikaraja ylittyy, peli päättyy.')
        : T('Ei aikarajaa.')) +
      (r.stones ? p('<b>' + T('Kivet') + ':</b> ' + T('Joka {0}. laukauksella vaunuun putoaa kivi, joka ei yhdisty. Se hajoaa, kun sen vieressä yhdistetään palloja kaksi kertaa.', r.stones)) : '') +
      (r.boss ? p('<b>' + T('Pomo') + ':</b> ' + T('Kun saat {0}, vaunuun saapuu pomo. Voita se yhdistämällä palloja sen vieressä.', lbl(r.boss))) : '') +
      p('<b>' + T('Tähdet') + ':</b> ' + `<span class="stars">${starStr(st)}</span> ` + T('Yksi tähti läpäisystä ja yksi kummastakin lisätavoitteesta: {0}.', STAR_GOALS[i].map(g => T(g[0])).join(' · '))) +
      (i > 0 ? p(T('Pisteet ja ruletit säilyvät, kun siirryt seuraavalle tasolle.')) : '') +
      (stageOpen(i, theme().id) ? '' : p('🔒 ' + T('Avautuu, kun läpäiset tason {0}.', i)));
  } else {
    const goal = { classic: 'Kerää mahdollisimman paljon pisteitä ja läpäise tasot yhdistämällä kaksi suurinta palloa. Peli päättyy, jos pallot painavat molempia nappeja yhtä aikaa.',
      daily: '',
      map: 'Suorita {1} tehtävää järjestyksessä. Jokaisella tehtävällä on oma tavoitteensa, esimerkiksi tietty pallo rajatuilla laukauksilla tai pisteitä aikarajassa.' }[id];
    title = MODE_INFO[id].name;
    body = id === 'daily' ? p('<b>' + T('Tänään') + ':</b> ' + dailyText()) + p(T('Tavoite vaihtuu joka päivä klo 15. Kaikilla on sama pallojärjestys ja sama tavoite.'))
      : p(MODE_INFO[id].desc) + p('<b>' + T('Tavoite') + ':</b> ' + T(goal, ballLabel(10), MISSIONS.length));
  }
  showOverlay(`<h2 class="h2">${title}</h2>` + body + `<div class="row" style="margin-top:14px"><button class="btn" id="${back === 'modes' ? 'modesBtn' : 'backMenu'}" type="button">${T('Selvä!')}</button></div>`);
}
function stagesHTML() {
  const id = theme().id;
  return '<div class="stages" role="group" aria-label="' + T('Tasot') + '">' + STAGES[id].map((s, i) => {
    const open = stageOpen(i, id), on = i === stage;
    return `<div class="stgw"><button class="stg${on ? ' on' : ''}${open ? '' : ' locked'}" type="button" data-stage="${i}"${open ? '' : ' disabled'} aria-pressed="${on}"` +
      ` title="${open ? T(s.name) : T('Läpäise edellinen taso')}"><b>${open ? i + 1 : '🔒'}</b><span>${T(s.name)}</span><em class="stars">${starStr(starsOf(id)[i])}</em></button>` +
      infoBtn('stage', i, T('Taso {0}: {1}', i + 1, T(s.name))) + '</div>';
  }).join('') + '</div><p class="stgoal">' + stageLine() + '</p>';
}
function showMenu() {
  if (state === 'menu') setStage(stageSel());
  const autoG = store.get(AUTO_KEY, null), auto = validSave(autoG) ? autoG : null;
  // two groups: on phones held sideways they become two columns so the play button stays in view
  showOverlay('<div class="menu-l">' + nameTag() + titleHTML() + metaBarHTML() +
    '<p class="lead">' + (stage ? T('Kaksi samaa palloa yhdistyy isommaksi: {0} → … → {1}.', NAMES[0], ballTail(MAXL))
      : T((THEME_BALLS[theme().id] || {}).lead || 'Ammu lippupalloja junavaunuun. Kaksi samaa maata yhdistyy isommaksi maaksi. Mikä mahtaa olla suurin?')) + '</p>' +
    '<div class="stats">' +
      `<div class="stat" style="color:#ffcc00">${MI.star}<b style="color:#fff">${best}</b><small>${T('Ennätys')}</small></div>` +
      `<div class="stat" style="color:#ffcc00">${MI.trophy}<b style="color:#fff">${achCount()}/${ACH.length}</b><small>${T('Saavutukset')}</small></div>` +
      `<div class="stat" style="color:#6fd3ff">${MI.globe}<b style="color:#fff">${seenFor(theme().id).size}/${RADII.length}</b><small>${T((THEME_BALLS[theme().id] || {}).count || 'Maat')}</small></div>` +
    '</div></div>' +
    '<div class="menu-r">' + stagesHTML() + '<div class="menu-btns">' +
    (auto ? mb('continueBtn', 'play', '', '', T('Jatka peliä'), T('{0} pistettä', (auto.score | 0).toLocaleString('fi-FI')), true) + mb('startBtn', 'plus', '#2fbf71', '#fff', T('Uusi peli'), T('Taso {0}: {1}', stage + 1, T(stageInfo().name)))
          : mb('startBtn', 'play', '', '', T('Pelaa'), T('Taso {0}: {1}', stage + 1, T(stageInfo().name)), true)) +
    mb('modesBtn', 'modes', '#7b5cff', '#fff', T('Pelimuodot'), T('Päivän haaste') + ', ' + T('Tehtäväkartta')) +
    '<div class="two">' +
      mb('achBtn', 'trophy', '#ffcc00', '#0a1c47', T('Saavutukset'), '') +
      mb('wardBtn', 'hat', '#ff6fa8', '#fff', T('Hahmo'), '') +
    '</div>' +
    mb('shopBtn', 'shop', '#ffcc00', '#0a1c47', T('Kauppa'), '🪙 ' + meta.coins.toLocaleString('fi-FI')) +
    mb('themeBtn', 'palette', '#2fbf71', '#fff', T('Teemat'), T('{0} / {1} avattu', THEMES.filter(themeOpen).length, THEMES.length)) +
    mb('rulesBtn', 'book', '#2aa7e0', '#fff', T('Ohjeet'), T('Näin peli toimii')) +
    '</div>' +
    slotsHTML('load') +
    musicRow() +
    '<div class="install" id="installRow"></div>' +
    '<p class="keys">' + T('Näppäimistö: ← → tähtää · ↑ ↓ voima · välilyönti ampuu · H ruletti · P tauko') + '</p></div>', 'menu');
  renderInstall();
  fitMenu();
}
// the play button of the main menu must be visible without scrolling. Long texts (some languages need twice the
// lines of Finnish) are tightened step by step until it fits: smaller mascot and texts, then the stage goal goes
// (the (i) button still shows it), then the description is cut to three lines, and last it goes too
const FIT_STEPS = ['fit1', 'fit2', 'fit3', 'fit4'];
function fitMenu() {
  if (overlay.hidden || !card.classList.contains('menu')) return;
  card.classList.remove(...FIT_STEPS);
  const play = card.querySelector('#startBtn');
  if (!play) return;
  const fits = () => play.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom - 4;
  for (const step of FIT_STEPS) { if (fits()) return; card.classList.add(step); }
}
function showThemes() {
  const ICON = { eu: 'train', viking: 'shield', heart: 'heart', uni: 'cap' }, cur = theme().id;
  const items = THEMES.map(t => {
    const open = themeOpen(t), on = cur === t.id, a = t.ach && ACH.find(x => x[0] === t.ach);
    const sw = `background:linear-gradient(90deg,${t.wall[2]} 0 10%,${t.wall[1]} 10% 14%,${t.body.replace(/[\d.]+\)$/, '1)')} 14% 86%,${t.wall[1]} 86% 90%,${t.wall[2]} 90%);color:${t.rivet}`;
    return `<button class="tcard${on ? ' on' : ''}${open ? '' : ' locked'}" type="button" data-theme="${t.id}"${open ? '' : ' disabled'}>` +
      `<span class="tsw" style="${sw}" aria-hidden="true">${MI[ICON[t.id]]}</span><b>${T(t.name)}</b>` +
      `<small>${open ? T(on ? 'Käytössä' : 'Valitse') : T('Avautuu saavutuksesta: {0}', a ? a[1] : '')}</small></button>`;
  }).join('');
  showOverlay('<h2 class="h2">' + T('Teemat') + '</h2><p class="sub">' + T('Vaunun ja taustan tyyli') + '</p><div class="tgrid">' + items + '</div>' +
    '<div class="row" style="margin-top:14px"><button class="btn" id="backMenu" type="button">' + T('Valmis') + '</button></div>');
}
// starting a new game: first pick the train
function showThemePick() {
  const ICON = { eu: 'train', viking: 'shield', heart: 'heart', uni: 'cap' }, cur = theme().id;
  const items = THEMES.map(t => {
    const open = themeOpen(t), a = t.ach && ACH.find(x => x[0] === t.ach), s = stageSel(t.id);
    const sw = `background:linear-gradient(90deg,${t.wall[2]} 0 10%,${t.wall[1]} 10% 14%,${t.body.replace(/[\d.]+\)$/, '1)')} 14% 86%,${t.wall[1]} 86% 90%,${t.wall[2]} 90%);color:${t.rivet}`;
    return `<button class="tcard${cur === t.id && open ? ' on' : ''}${open ? '' : ' locked'}" type="button" data-pick="${t.id}"${open ? '' : ' disabled'}>` +
      `<span class="tsw" style="${sw}" aria-hidden="true">${MI[ICON[t.id]]}</span><b>${T(t.name)}</b>` +
      `<small>${open ? T('Taso {0}: {1}', s + 1, T(STAGES[t.id][s].name)) : T('Avautuu saavutuksesta: {0}', a ? a[1] : '')}</small></button>`;
  }).join('');
  showOverlay('<h2 class="h2">' + T('Valitse teema') + '</h2><p class="sub">' + T('Millä junalla lähdetään?') + '</p><div class="tgrid">' + items + '</div>' +
    '<div class="row" style="margin-top:14px"><button class="btn alt" id="backMenu" type="button">' + T('Takaisin') + '</button></div>');
}
function showRules() {
  const R = [
    [COLORS[0], '<b>Tähtää</b> hiirellä tai sormella. Mitä kauemmas osoitat, sitä kovempaa pallo lentää.'],
    [COLORS[2], '<b>Ammu</b> klikkaamalla tai nostamalla sormen ruudulta.'],
    [COLORS[4], 'Kevyt laukaus laskee pallon varovasti, kova laukaus <b>tönii ja litistää</b> muita.'],
    [COLORS[9], 'Vaunun seinissä on kaksi nappia. Jos pallot koskettavat <b>molempia nappeja</b> yhtä aikaa, peli päättyy.'],
    ['#ffcc00', 'Joka <b>40 000 pisteellä</b> saat <b>ruletin</b>. Se arpoo heilautuksen, mustan aukon, magneetin, ei mitään tai harvoin <b>jokeripallon</b>, joka yhdistyy minkä tahansa pallon kanssa. Seinien napit saavat hetkeksi <b>kilven</b>.'],
    ['#ff4d7d', 'Ammu vaunun yläosassa lentäviä <b>tähtiä</b> ja <b>Nelli-sydämiä</b>, niin saat bonuspisteitä.'],
    ['#6fd3ff', 'Kun yhdistät kaksi suurinta palloa, siirryt heti <b>uudelle tasolle</b> uusine palloineen. Ylemmillä tasoilla tietty pallo pitää saada <b>aikarajassa</b>.'],
    ['#3ad8ff', 'Pelaamalla saat <b>kokemusta</b> ja <b>kolikoita</b>. Uusista pelaajatasoista saa palkintoja, ja kolikoilla voi ostaa <b>kaupasta</b> uusia tavaroita. Jokaisesta tasosta saa 1–3 <b>tähteä</b>.'],
    ['#e8b400', 'Saavutuksista saat <b>pokaaleja</b> vaunun pohjan hyllyille. Tartu pokaaliin sormella ja <b>heitä</b> sitä ympäri vaunua!']
  ];
  showOverlay('<h2 class="h2">' + T('Ohjeet') + '</h2><ul class="rules">' +
    R.map(([c, k]) => `<li><i class="dot" style="background:${c}"></i><span>${T(k)}</span></li>`).join('') +
    '</ul><div class="row"><button class="btn" id="backMenu" type="button">' + T('Takaisin') + '</button></div>');
}
function showModes() {
  setStage(0);   // the other game modes always use the theme's first balls
  refreshGoalTexts();
  const rows = ['classic', 'daily', 'map'].map(m => {
    let extra = '';
    if (m === 'classic') extra = T('Ennätys {0}', best);
    if (m === 'daily') { const d = Number(store.get('piispanpeli-daily-' + todayKey(), 0)) || 0; extra = (d ? T('Paras: {0} laukausta', d) : T('Haaste odottaa')) + ' · ' + T('uusi haaste {0} päästä', dailyLeft()); }
    if (m === 'map') extra = T('Suoritettu {0} / {1}', mapDone(), MISSIONS.length);
    return `<li><b>${MODE_INFO[m].name}${infoBtn('mode', m, MODE_INFO[m].name)}</b><button class="mini" type="button" data-mode="${m}">${T(m === 'map' ? 'Avaa' : 'Pelaa')}</button><small>${m === 'daily' ? T('Tänään') + ': ' + dailyText() : MODE_INFO[m].desc}<br>${extra}</small></li>`;
  }).join('');
  showOverlay('<h2 class="h2">' + T('Pelimuodot') + '</h2><ul class="list">' + rows + '</ul><div class="row" style="margin-top:14px"><button class="btn alt" id="backMenu" type="button">' + T('Takaisin') + '</button></div>');
}
function showMap() {
  setStage(0); refreshGoalTexts();
  const done = mapDone();
  const rows = MISSIONS.map((m, i) => {
    const st = i < done ? 'done' : i === done ? '' : 'locked';
    const btn = i <= done ? `<button class="mini" type="button" data-mission="${i}">${T(i < done ? 'Uudelleen' : 'Pelaa')}</button>` : `<span class="muted">${T('Lukittu')}</span>`;
    return `<li class="${st}"><b>${i + 1}. ${NAMES[m.c]}</b>${btn}<small>${m.text}${i < done ? ' · ' + T('suoritettu') : ''}</small></li>`;
  }).join('');
  showOverlay('<h2 class="h2">' + T('Tehtäväkartta') + '</h2><p class="sub">' + T('Suoritettu {0} / {1}', done, MISSIONS.length) + '</p><ul class="list">' + rows + '</ul>' +
    '<div class="row" style="margin-top:14px"><button class="btn alt" id="modesBtn" type="button">' + T('Takaisin') + '</button></div>');
}
function showAch() {
  const cups = TROPHY_AT.map((n, i) => `<span class="${achCount() >= n ? '' : 'off'}" title="${T('{0} saavutusta', n)}">${CUP('#ffcc00', '#a07800')}</span>`).join('');
  const group = (title, filter) => `<h4>${title}</h4>` + ACH.filter(filter).map(a => {
    const got = !!achGot[a[0]], hidden = a[3] === 'secret' && !got;
    return `<li class="${got ? 'got' : ''}"><img class="ico" src="${hidden ? trophyImg('admin', true) : trophyImg(a[0], !got)}" alt="" width="28" height="28"><b>${hidden ? '???' : achTitle(a)}</b><small>${hidden ? T('Salainen saavutus') : achDesc(a)}</small></li>`;
  }).join('');
  showOverlay('<h2 class="h2">' + T('Saavutukset') + '</h2><p class="sub">' + T('{0} / {1} · kultapalkintoja {2} / {3}', achCount(), ACH.length, trophies(), TROPHY_AT.length) + '</p>' +
    '<div class="trophies">' + cups + '</div><p class="hint">' + T('Kultapalkinto {0} ja {1} saavutuksesta.', TROPHY_AT.slice(0, -1).join(', '), ACH.length) + (goldEdges() ? ' ' + T('Kultaiset reunat käytössä!') : '') + '</p>' +
    '<div class="row" style="margin:8px 0 4px"><button class="btn" id="vitBtn" type="button">' + T('Muokkaa vitriiniä') + '</button></div>' +
    '<ul class="ach">' + group(T('Peli'), a => !a[3]) + group(T('Pelimuodot'), a => a[3] === 'mode') + group(T('Salaiset'), a => a[3] === 'secret') + THEMES.filter(t => t.id !== 'eu').map(t => group(T(t.name), a => a[3] === t.id)).join('') + '</ul>' +
    '<div class="row" style="margin-top:14px"><button class="btn alt" id="backMenu" type="button">' + T('Takaisin') + '</button></div>');
}

// the trophy case editor: pick up to six earned trophies to show in the wagon
function showVitrine(note) {
  const ids = vitrineIds(), auto = !Array.isArray(vitPick);
  const slots = Array.from({ length: VIT_N }, (_, k) => ids[k]
    ? `<button class="vslot" type="button" data-vit="${ids[k]}" title="${T('Poista vitriinistä')}"><img src="${trophyImg(ids[k])}" alt="" width="40" height="40"></button>`
    : '<span class="vslot empty"></span>').join('');
  const got = ACH.filter(a => achGot[a[0]]);
  const items = got.map(a => `<button class="witem vpick${ids.includes(a[0]) ? ' on' : ''}" type="button" data-vit="${a[0]}"><img src="${trophyImg(a[0])}" alt="" width="30" height="30"><b>${achTitle(a)}</b></button>`).join('');
  showOverlay('<h2 class="h2">' + T('Vitriini') + '</h2><p class="sub">' + T('Valitse enintään {0} palkintoa näytille vaunuun.', VIT_N) + '</p>' +
    '<div class="vslots">' + slots + '</div><p class="hint">' + (auto ? T('Nyt näkyvät uusimmat palkinnot automaattisesti.') : T('Napauta palkintoa lisätäksesi tai poistaaksesi sen.')) + '</p>' +
    (note ? `<p class="note">${note}</p>` : '') +
    (got.length ? '<div class="wgrid vgrid">' + items + '</div>' : '<p class="hint">' + T('Sinulla ei ole vielä palkintoja.') + '</p>') +
    '<div class="row" style="margin-top:14px"><button class="btn alt" id="vitAuto" type="button">' + T('Automaattisesti uusimmat') + '</button><button class="btn" id="achBtn" type="button">' + T('Valmis') + '</button></div>');
}

// ------------------------------ install as an app (only in the app build) ------------------------------
const isAppBuild = !!document.querySelector('link[rel="manifest"]') && window.self === window.top;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
let installPrompt = null;
function renderInstall() {
  const row = document.getElementById('installRow');
  if (!row) return;
  if (!isAppBuild || isStandalone()) row.innerHTML = '';
  else if (installPrompt) row.innerHTML = '<button class="btn alt" id="installBtn" type="button">' + T('Asenna sovellukseksi') + '</button>';
  else if (isIOS) row.innerHTML = '<p class="hint">' + T('Asenna iPhoneen: napauta Safarin <b>Jaa</b>-painiketta ja valitse <b>Lisää Koti-valikkoon</b>.') + '</p>';
  else row.innerHTML = '';
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; renderInstall(); });
window.addEventListener('appinstalled', () => { installPrompt = null; renderInstall(); });
if (isAppBuild && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ }); });
}

function showPause(note) {
  showOverlay('<h2 class="h2">' + T('Tauko') + '</h2><p class="sub">' + MODE_INFO[gmode].name + ' · ' + T('pisteet {0}', score) + '</p>' +
    (note ? `<p class="note">${note}</p>` : '') + '<div class="mbs">' +
    mb('resumeBtn', 'play', '', '', T('Jatka'), T('Takaisin peliin'), true) +
    (gmode === 'classic' ? mb('saveBtn', 'save', '#2aa7e0', '#fff', T('Tallenna'), T('Viisi tallennuspaikkaa')) : '') +
    mb('restartBtn', 'restart', '#ff8a3d', '#fff', T('Aloita alusta'), MODE_INFO[gmode].name) +
    mb('menuBtn', 'home', '#7b5cff', '#fff', T('Päävalikko'), T('Peli tallentuu automaattisesti')) +
    '</div>' + musicRow());
}
function musicRow() {
  const lopts = LANGS.map(([c, n]) => `<option value="${c}"${c === lang ? ' selected' : ''}>${n}</option>`).join('');
  return `<div class="audio"><label for="langSel">🌐 ${T('Kieli')}</label><select id="langSel">${lopts}</select>` +
    `<label for="volRange">${T('Äänenvoimakkuus')}</label><input id="volRange" type="range" min="0" max="100" value="${Math.round(sfx.volume * 100)}"></div>`;
}
function openAdmin() {
  adminOn = true; unlock('admin');
  if (state === 'play') { state = 'paused'; aiming = false; syncUI(); }
  showAdmin();
}
function showAdmin(note) {
  const opts = NAMES.map((n, i) => `<option value="${i}"${i === cur ? ' selected' : ''}>${n}</option>`).join('');
  const inGame = state === 'paused' || state === 'play';
  showOverlay('<h2 class="h2">Admin</h2>' + (note ? `<p class="note">${note}</p>` : '') +
    (inGame && cheated ? `<p class="sub">${T('Huijaukset käytössä – ennätystä ei tallenneta tästä pelistä.')}</p>` : '') +
    (inGame
      ? `<div class="audio"><label for="adminBall">${T('Seuraava pallo')}</label><select id="adminBall">${opts}</select></div>` +
        '<div class="row" style="margin-top:14px"><button class="btn alt" id="admCharge" type="button">' + T('+1 ruletti') + '</button><button class="btn alt" id="admPts" type="button">' + T('+10 000 pistettä') + '</button></div>' +
        '<div class="row" style="margin-top:12px"><button class="btn alt" id="admClear" type="button">' + T('Tyhjennä vaunu') + '</button>' +
        `<button class="btn alt" id="admGod" type="button" aria-pressed="${invincible}">${T('Kuolemattomuus: {0}', T(invincible ? 'päällä' : 'pois'))}</button></div>` +
        `<div class="row" style="margin-top:12px"><button class="btn alt" id="admInf" type="button" aria-pressed="${infSwing}">${T('Loputtomat ruletit: {0}', T(infSwing ? 'päällä' : 'pois'))}</button></div>` +
        '<div class="row" style="margin-top:12px"><button class="btn alt" id="admLose" type="button">' + T('Häviä peli') + '</button></div>' +
        '<div class="row" style="margin-top:12px"><button class="btn" id="admAll" type="button">' + T('Avaa kaikki') + '</button></div>'
      : '<p class="sub">' + T('Aloita peli, niin voit muokata sitä täällä.') + '</p>' +
        `<div class="row" style="margin-bottom:12px"><button class="btn" id="admAll" type="button">${T('Avaa kaikki')}</button></div>` +
        `<div class="row"><button class="btn alt" id="admGod" type="button" aria-pressed="${invincible}">${T('Kuolemattomuus: {0}', T(invincible ? 'päällä' : 'pois'))}</button></div>` +
        `<div class="row" style="margin-top:12px"><button class="btn alt" id="admInf" type="button" aria-pressed="${infSwing}">${T('Loputtomat ruletit: {0}', T(infSwing ? 'päällä' : 'pois'))}</button></div>`) +
    '<div class="row" style="margin-top:16px"><button class="btn" id="admClose" type="button">' + T('Sulje') + '</button></div>');
}
// a game in which the admin panel changed something keeps no records, achievements or progress. Toggles switched
// on in the menu make the next game count as cheated when it starts
function cheat() { if (state === 'play' || state === 'paused') cheated = true; }
function closeAdmin() { adminOn = false; if (state === 'paused') { state = 'play'; hideOverlay(); syncUI(); } else if (state === 'menu') showMenu(); else hideOverlay(); }
function showSaveSlots() {
  showOverlay('<h2 class="h2">' + T('Tallenna') + '</h2>' + slotsHTML('save') +
    '<div class="row" style="margin-top:16px"><button class="btn alt" id="backBtn" type="button">' + T('Takaisin') + '</button></div>');
}

function showStageWin() {
  showOverlay(`<h2 class="h2">${T('Kaikki tasot läpäisty!')}</h2><div class="final">${NAMES[MAXL]}</div><p class="bigstars">${starStr(lastStars)}</p>` +
    `<p class="sub win">${T('Sait {0} ja läpäisit kaikki tasot!', NAMES[MAXL])}</p>` +
    '<div class="mbs">' + mb('resumeBtn', 'play', '', '', T('Jatka tätä peliä'), T('Kerää lisää pisteitä'), true) +
    mb('menuBtn', 'home', '#7b5cff', '#fff', T('Päävalikko'), '') + '</div>');
  triggerConfetti(); sfx.mega();
}
function showOver(newBest) {
  const NB = '<p class="sub win">' + T('Uusi ennätys!') + '</p>', REC = v => '<p class="sub">' + T('Ennätys {0}', v) + '</p>';
  let title = T('Vaunu täyttyi!'), main = String(score), sub = newBest && score > 0 ? NB : REC(best), extraBtn = '';
  if (gmode === 'classic' && endReason === 'stage' && failGoal) {
    title = T('Aikaraja ylittyi!');
    sub = '<p class="sub">' + T('Taso piti läpäistä {0} minuutissa.', failGoal.t / 60) + '</p>' + sub;
  }
  if (gmode === 'daily') {
    const d = Number(store.get('piispanpeli-daily-' + dayKey, 0)) || 0;
    if (endReason === 'win') { title = T('Päivän haaste läpäisty!'); main = T('{0} laukausta', shots); sub = newBest ? '<p class="sub win">' + T('Päivän paras tulos!') + '</p>' : '<p class="sub">' + T('Tänään paras: {0} laukausta', d) + '</p>'; }
    else { title = T('Haaste jäi kesken'); main = NAMES[maxLevel]; sub = '<p class="sub">' + dailyText(dailyGoal(dayKey)) + ' ' + T('Pallojärjestys ja tavoite pysyvät samoina, kunnes uusi haaste alkaa klo 15.') + '</p>'; }
  }
  if (gmode === 'map') {
    const ms = MISSIONS[missionIdx];
    if (endReason === 'win') { title = T('Tehtävä suoritettu!'); main = NAMES[ms.c]; sub = `<p class="sub win">${ms.text}</p>`; if (missionIdx + 1 < MISSIONS.length) extraBtn = 'next'; }
    else { title = T('Tehtävä epäonnistui'); main = NAMES[ms.c]; sub = `<p class="sub">${ms.text}</p>`; }
  }
  if (cheated) sub = '<p class="sub">' + T('Huijaukset käytössä – ennätystä ei tallennettu.') + '</p>';
  showOverlay(`<h2 class="h2">${title}</h2><div class="final">${main}</div>` + sub +
    (gmode === 'daily' || gmode === 'map' ? '' : `<div class="biggest"><span>${T(theme().id === 'eu' && !stage ? 'Suurin maa' : 'Suurin pallo')}</span><i class="dot" style="background:${COLORS[maxLevel]}"></i><b>${NAMES[maxLevel]} (${maxLevel + 1}/${MAXL + 1})</b></div>`) +
    metaOverHTML() +
    '<div class="mbs">' + (extraBtn ? mb('nextMission', 'next', '', '', T('Seuraava tehtävä'), '', true) : '') +
    mb('againBtn', extraBtn ? 'restart' : 'play', '#2fbf71', '#fff', T(gmode === 'map' && endReason === 'win' ? 'Uudelleen' : 'Pelaa uudestaan'), gmode === 'classic' ? T('Taso {0}: {1}', stage + 1, T(stageInfo().name)) : MODE_INFO[gmode].name, !extraBtn) +
    mb('menuBtn', 'home', '#7b5cff', '#fff', T('Päävalikko'), '') + '</div>');
  animateXP();
}

card.addEventListener('change', e => {
  if (e.target.id === 'langSel') { setLang(e.target.value); if (state === 'menu') showMenu(); else if (state === 'paused' && !adminOn) showPause(); }
  if (e.target.id === 'adminBall') { cheat(); cur = Number(e.target.value); popT = 0; }
});
card.addEventListener('input', e => { if (e.target.id === 'volRange') { sfx.ensure(); sfx.setVolume(Number(e.target.value) / 100); } });
card.addEventListener('input', e => { if (e.target.id === 'heroName') setHeroName(e.target.value); });
card.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('mascot')) {
    mascotTaps++; mascotTapT = 2; mascotBounce = 0.6;
    if (mascotTaps >= 5) { mascotTaps = 0; triggerNelli(); }
    return;
  }
  const btn = e.target.closest('button');
  if (!btn) return;
  const act = btn.dataset.act, slot = btn.dataset.slot;
  if (act === 'save') { store.set(SLOT_KEY(slot), gameData()); showPause(T('Tallennettu paikkaan {0}.', slot)); return; }
  if (act === 'load') { const g = store.get(SLOT_KEY(slot), null); if (validSave(g)) loadGame(g, false); return; }
  if (act === 'del') { store.set(SLOT_KEY(slot), null); showMenu(); return; }
  if (btn.dataset.item && btn.dataset.slot) {
    const slot = btn.dataset.slot;
    look[slot] = btn.dataset.item; store.set('piispanpeli-look', look); mascotBounce = 0.8;
    card.querySelectorAll(`.witem[data-slot="${slot}"]:not(.locked)`).forEach(el => { const on = el === btn; el.classList.toggle('on', on); el.querySelector('small').textContent = T(on ? 'Käytössä' : 'Valitse'); });
    return;
  }
  if (btn.dataset.pick) {
    themeId = btn.dataset.pick; store.set('piispanpeli-theme', themeId); buildBg(); stage = stageSel(); applyLang();
    startGame('classic');
    return;
  }
  if (btn.dataset.theme) {
    themeId = btn.dataset.theme; store.set('piispanpeli-theme', themeId); mascotBounce = 0.8; buildBg(); stage = stageSel(); applyLang();
    card.querySelectorAll('.tcard:not(.locked)').forEach(el => { const on = el === btn; el.classList.toggle('on', on); el.querySelector('small').textContent = T(on ? 'Käytössä' : 'Valitse'); });
    return;
  }
  if (btn.dataset.info) { showInfo(btn.dataset.info, btn.dataset.id, btn.dataset.info === 'mode' ? 'modes' : 'menu'); return; }
  if (btn.dataset.stage != null) {
    const n = Number(btn.dataset.stage);
    if (stageOpen(n, theme().id)) { store.set('piispanpeli-stagesel-' + theme().id, n); setStage(n); showMenu(); }
    return;
  }
  if (btn.dataset.mode) { const m = btn.dataset.mode; if (m === 'map') showMap(); else startGame(m); return; }
  if (btn.dataset.mission != null) { startGame('map', Number(btn.dataset.mission)); return; }
  if (btn.id === 'startBtn') showThemePick();
  else if (btn.id === 'againBtn' || btn.id === 'restartBtn') { if (gmode === 'classic') store.set('piispanpeli-stagesel-' + theme().id, stage); startGame(); }
  else if (btn.id === 'nextMission') startGame('map', missionIdx + 1);
  else if (btn.id === 'modesBtn') showModes();
  else if (btn.id === 'achBtn') showAch();
  else if (btn.id === 'vitBtn') showVitrine();
  else if (btn.id === 'vitAuto') { setVitrine(null); showVitrine(); }
  else if (btn.dataset.vit) {
    const id = btn.dataset.vit, ids = vitrineIds().slice(), k = ids.indexOf(id);
    if (k >= 0) ids.splice(k, 1);
    else if (ids.length >= VIT_N) { showVitrine(T('Vitriini on täynnä. Poista ensin jokin palkinto.')); return; }
    else ids.push(id);
    setVitrine(ids); sfx.pop && sfx.pop(); showVitrine();
  }
  else if (btn.id === 'rulesBtn') showRules();
  else if (btn.id === 'wardBtn') showWardrobe();
  else if (btn.id === 'shopBtn') showShop();
  else if (btn.dataset.buy) {
    const slot = btn.dataset.buy, it = WARDROBE[slot].find(w => w[0] === btn.dataset.item);
    if (it && buy(slot, it[0])) { themeMemoKey = ''; mascotBounce = 0.8; triggerConfetti(); if (card.querySelector('.mascot.big')) showWardrobe(); else showShop(T('Ostettu: {0}! Se on nyt päälläsi.', it[1])); }
  }
  else if (btn.id === 'themeBtn') showThemes();
  else if (btn.id === 'backMenu') showMenu();
  else if (btn.id === 'continueBtn') { const g = store.get(AUTO_KEY, null); if (validSave(g)) loadGame(g, true); else startGame(); }
  else if (btn.id === 'resumeBtn') resume();
  else if (btn.id === 'saveBtn') showSaveSlots();
  else if (btn.id === 'admAll') { unlockEverything(); sfx.ensure(); triggerConfetti(); showAdmin(T('Kaikki avattu: saavutukset, teemat, hahmon tavarat, maat ja tehtävät.')); }
  else if (btn.id === 'admCharge') { cheat(); charges++; syncAbil(); showAdmin(T('Ruletti lisätty.')); }
  else if (btn.id === 'admPts') { cheat(); addScore(10000); shownScore = score; showAdmin(T('Lisätty 10 000 pistettä.')); }
  else if (btn.id === 'admClear') { cheat(); clearAll(); dangerT = 0; jamT = 0; showAdmin(T('Vaunu tyhjennetty.')); }
  else if (btn.id === 'admGod') { invincible = !invincible; if (invincible) cheat(); showAdmin(T(invincible ? 'Kuolemattomuus päällä.' : 'Kuolemattomuus pois.')); }
  else if (btn.id === 'admInf') { infSwing = !infSwing; if (infSwing) cheat(); syncAbil(); showAdmin(T(infSwing ? 'Loputtomat ruletit päällä.' : 'Loputtomat ruletit pois.')); }
  else if (btn.id === 'admClose') closeAdmin();
  else if (btn.id === 'admLose') { invincible = false; adminOn = false; hideOverlay(); state = 'play'; gameOver(gmode === 'map' || gmode === 'daily' ? 'fail' : 'forced'); }

  else if (btn.id === 'backBtn') showPause();
  else if (btn.id === 'menuBtn') toMenu();
  else if (btn.id === 'installBtn' && installPrompt) {
    const p = installPrompt;
    installPrompt = null;
    p.prompt();
    Promise.resolve(p.userChoice).catch(() => {}).then(renderInstall);
  }
});

// ------------------------------ input ------------------------------
function aimAt(e) {
  const wx = (e.clientX - OX) / SC, wy = (e.clientY - OY) / SC;
  const dx = wx - LX;
  let dy = wy - LY;
  if (dy < 0.3) dy = 0.3;
  aimAng = clamp(Math.atan2(dx, dy), -1.3, 1.3);
  aimPow = clamp((Math.hypot(wx - LX, wy - LY) - 0.9) / 10.5, 0.03, 1);
}
// four quick taps in the top-left corner open the admin panel
window.addEventListener('pointerdown', e => {
  if (e.clientX > 70 || e.clientY > 70) return;
  cornerTaps = performance.now() - cornerT < 1500 ? cornerTaps + 1 : 1; cornerT = performance.now();
  if (cornerTaps >= 4) { cornerTaps = 0; openAdmin(); }
}, true);
canvas.addEventListener('pointerdown', e => {
  if (e.clientX <= 70 && e.clientY <= 70) return;
  sfx.ensure();
  if (state !== 'play' || (e.pointerType === 'mouse' && e.button !== 0)) return;
  e.preventDefault();
  // one finger at a time: a second finger never moves the aim, shoots or grabs a trophy
  if (aiming || heldTrophy) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const wx = (e.clientX - OX) / SC, wy = (e.clientY - OY) / SC, id = pickTrophy(wx, wy);
  if (id) { heldTrophy = { id, pid: e.pointerId }; sfx.ensure(); return; }
  aiming = true; aimId = e.pointerId;
  aimAt(e);
});
function releaseTrophy() {
  const o = heldTrophy && TOBJ[heldTrophy.id];
  heldTrophy = null;
  if (!o) return;
  const sp = Math.hypot(o.vx, o.vy), k = sp > 28 ? 28 / sp : 1;
  o.vx *= k; o.vy *= k; o.st = 'fly'; o.t = 0; o.rest = 0; o.va += o.vx * 0.6;
}
canvas.addEventListener('pointermove', e => {
  if (heldTrophy && e.pointerId !== heldTrophy.pid) return;
  if (aiming && e.pointerId !== aimId) return;
  if (heldTrophy) { const o = TOBJ[heldTrophy.id]; if (o) { o.tx = (e.clientX - OX) / SC; o.ty = (e.clientY - OY) / SC; } return; }
  if (state === 'play' && (aiming || e.pointerType === 'mouse')) aimAt(e);
});
canvas.addEventListener('pointerup', e => {
  if (heldTrophy) { if (e.pointerId === heldTrophy.pid) releaseTrophy(); return; }
  if (state !== 'play' || !aiming || e.pointerId !== aimId) return;
  aiming = false; aimAt(e); shoot();
});
canvas.addEventListener('pointercancel', e => {
  if (heldTrophy && e.pointerId === heldTrophy.pid) releaseTrophy();
  if (aiming && e.pointerId === aimId) aiming = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// a button, list or slider that has the keyboard focus handles its own keys (Space and Enter press that button)
const onControl = el => !!(el && el !== document.body && el.closest && el.closest('button, select, input, textarea, a[href]'));
// Escape on a screen opened from a menu goes back one step
function goBack() {
  if (overlay.hidden) return false;
  if (card.querySelector('#admClose')) { closeAdmin(); return true; }
  if (state === 'paused' && !card.querySelector('#resumeBtn')) { showPause(); return true; }
  if (state === 'menu' && !card.classList.contains('menu')) {
    const back = card.querySelector('#backMenu') || (card.querySelector('[data-mode]') ? null : card.querySelector('#modesBtn'));
    if (back) back.click(); else showMenu();
    return true;
  }
  return false;
}
window.addEventListener('keydown', e => {
  const k = e.code, ctl = onControl(e.target);
  usedKeys = true;
  if (!ctl && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Space')) e.preventDefault();
  keys[k] = true;
  if (e.repeat) return;
  if (e.key && e.key.length === 1) {
    typed = (typed + e.key.toLowerCase()).slice(-8);
    if (typed.endsWith('nelli')) { typed = ''; triggerNelli(); }
    else if (typed === 'admin123') { typed = ''; openAdmin(); }
  }
  if (ctl && (k === 'Space' || k === 'Enter')) return;
  const pauseMenu = state === 'paused' && !overlay.hidden && !!card.querySelector('#resumeBtn');
  if (state === 'play') {
    if (k === 'Space' || k === 'Enter') shoot();
    else if (k === 'KeyP' || k === 'Escape') pause();
    else if (k === 'KeyH') useAbility();
  } else if (pauseMenu) {
    if (k === 'KeyP' || k === 'Escape' || k === 'Space' || k === 'Enter') resume();
  } else if (k === 'Escape') {
    if (goBack()) e.preventDefault();
  } else if ((k === 'Space' || k === 'Enter') && !overlay.hidden && (state === 'over' || (state === 'menu' && card.classList.contains('menu')))) {
    const g = state === 'menu' ? store.get(AUTO_KEY, null) : null;
    if (validSave(g)) loadGame(g, true); else startGame('classic');
  }
});
window.addEventListener('pointerdown', () => { usedKeys = false; }, true);
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') pause(); else autoSave(); sfx.suspend(); } else sfx.resume(); });
window.addEventListener('pagehide', autoSave);
window.addEventListener('resize', () => { layout(); fitMenu(); });

function syncSound() {
  soundBtn.innerHTML = sfx.muted ? ICON_OFF : ICON_ON;
  soundBtn.setAttribute('aria-label', T(sfx.muted ? 'Laita äänet päälle' : 'Mykistä äänet'));
}
soundBtn.addEventListener('click', () => { sfx.toggle(); syncSound(); soundBtn.blur(); });
abilBtn.addEventListener('click', () => { useAbility(); abilBtn.blur(); });
pauseBtn.addEventListener('click', () => { if (state === 'play') pause(); else if (state === 'paused') resume(); pauseBtn.blur(); });

// ------------------------------ language switching ------------------------------
const FI = {
  names: NAMES.slice(), modes: Object.fromEntries(Object.entries(MODE_INFO).map(([k, v]) => [k, [v.name, v.desc]])),
  missions: MISSIONS.map(m => m.text), ach: ACH.map(a => [a[1], a[2]]),
  ward: Object.fromEntries(Object.entries(WARDROBE).map(([k, v]) => [k, v.map(it => it[1])])), slots: Object.assign({}, SLOT_NAMES)
};
// mode and mission goals name a ball, which is hidden until seen: rewritten whenever those screens open
function refreshGoalTexts() {
  for (const k in FI.modes) { MODE_INFO[k].name = T(FI.modes[k][0]); MODE_INFO[k].desc = T(FI.modes[k][1], ballLabel(10)); }
  MISSIONS.forEach((m, i) => { m.text = missionText(m, i); });
}
function applyLang() {
  // ball names follow the chosen theme (countries, gods, hearts or sums)
  const tb = THEME_BALLS[theme().id], st = STAGES[theme().id][stage], base = i => T(tb ? tb.names[i] : FI.names[i]);
  FI.names.forEach((n, i) => { NAMES[i] = st && st.names ? T(st.names[i]) : base(i); });
  // the other modes always use the theme's first balls
  refreshGoalTexts();
  FI.ach.forEach(([n, d], i) => { ACH[i][1] = T(n); ACH[i][2] = T(d); });
  for (const k in FI.ward) FI.ward[k].forEach((n, i) => { WARDROBE[k][i][1] = T(n); });
  for (const k in FI.slots) SLOT_NAMES[k] = T(FI.slots[k]);
  document.documentElement.lang = lang;
  canvas.setAttribute('aria-label', T('Pelialue: vaunu täynnä lippupalloja'));
  pauseBtn.setAttribute('aria-label', T('Tauko'));
  if (typeof syncSound === 'function') syncSound();
  if (typeof syncAbil === 'function') syncAbil();
}
function setLang(c) { lang = c; store.set('piispanpeli-lang', c); applyLang(); }
applyLang();
