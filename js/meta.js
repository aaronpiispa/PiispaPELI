// PiispanPELI · Progress across games: experience and player level, coins, and the shop.
'use strict';

const META_KEY = 'piispanpeli-meta', MAX_PLV = 50;
const meta = Object.assign({ xp: 0, lvl: 1, coins: 0, owned: [] }, store.get(META_KEY, {}) || {});
meta.lvl = clamp(meta.lvl | 0, 1, MAX_PLV); meta.xp = Math.max(0, meta.xp | 0); meta.coins = Math.max(0, meta.coins | 0);
if (!Array.isArray(meta.owned)) meta.owned = [];
const saveMeta = () => store.set(META_KEY, meta);
// experience needed to go from level l to l + 1
const xpNeed = l => 200 + 120 * (l - 1);
// what this game has given so far (shown on the end screen)
let gameXP = 0, gameCoins = 0, gameLvls = [];
function metaResetGame() { gameXP = 0; gameCoins = 0; gameLvls = []; }

// the rewards of each player level: coins always, and on some levels an item (see WARDROBE entries 'lv:N')
const levelCoins = l => 25 + 5 * l;
function levelItem(l) {
  for (const slot in WARDROBE) for (const it of WARDROBE[slot]) if (it[2] === 'lv:' + l) return [slot, it];
  return null;
}
function gainXP(n) {
  if (cheated || n <= 0 || meta.lvl >= MAX_PLV) return;
  meta.xp += n; gameXP += n;
  while (meta.lvl < MAX_PLV && meta.xp >= xpNeed(meta.lvl)) {
    meta.xp -= xpNeed(meta.lvl); meta.lvl++;
    const c = levelCoins(meta.lvl); meta.coins += c; gameCoins += c; gameLvls.push(meta.lvl);
    const item = levelItem(meta.lvl);
    toast(T('Pelaajataso {0}!', meta.lvl), item ? T('Palkinto: {0} ja {1} kolikkoa', item[1][1], c) : T('Palkinto: {0} kolikkoa', c), 'admin');
    sfx.mega();
  }
  if (meta.lvl >= MAX_PLV) meta.xp = 0;
  saveMeta();
}
function gainCoins(n) {
  if (cheated || n <= 0) return;
  meta.coins += n; gameCoins += n; saveMeta();
}
// the next reward ahead, for the menu: [level, text]
function nextReward() {
  for (let l = meta.lvl + 1; l <= MAX_PLV; l++) { const it = levelItem(l); if (it) return [l, it[1][1]]; }
  return meta.lvl < MAX_PLV ? [meta.lvl + 1, T('{0} kolikkoa', levelCoins(meta.lvl + 1))] : null;
}

// ------------------------------ shop ------------------------------
// shop items are wardrobe entries whose unlock is 'shop:price'; level rewards are 'lv:N'; 'stars:N' needs N stars
const priceOf = it => (it[2] && it[2].startsWith('shop:') ? Number(it[2].slice(5)) : 0);
const owns = (slot, id) => meta.owned.includes(slot + ':' + id);
function itemOpen(slot, it) {
  const u = it[2];
  if (!u) return true;
  if (u.startsWith('shop:')) return owns(slot, it[0]);
  if (u.startsWith('lv:')) return meta.lvl >= Number(u.slice(3));
  if (u.startsWith('stars:')) return totalStars() >= Number(u.slice(6));
  return achOrOld(u);
}
// what a locked item needs, for the wardrobe
function itemNeed(slot, it) {
  const u = it[2];
  if (u.startsWith('shop:')) return T('Kaupasta: {0} kolikkoa', priceOf(it));
  if (u.startsWith('lv:')) return T('Pelaajataso {0}', u.slice(3));
  if (u.startsWith('stars:')) return T('{0} tähteä', u.slice(6));
  const a = ACH.find(q => q[0] === u);
  return T('Saavutus: {0}', a && a[3] === 'secret' ? '???' : a ? achTitle(a) : '');
}
function buy(slot, id) {
  const it = WARDROBE[slot].find(w => w[0] === id), price = it ? priceOf(it) : 0;
  if (!price || owns(slot, id) || meta.coins < price) return false;
  meta.coins -= price; meta.owned.push(slot + ':' + id); saveMeta();
  look[slot] = id; store.set('piispanpeli-look', look);
  sfx.mega(); return true;
}
function showShop(note) {
  let html = '<h2 class="h2">' + T('Kauppa') + '</h2><p class="sub coins">🪙 ' + T('{0} kolikkoa', meta.coins.toLocaleString('fi-FI')) + '</p>' + (note ? `<p class="note">${note}</p>` : '') +
    '<p class="hint">' + T('Kolikoita saat yhdistämällä isoja palloja, rikkomalla kiviä, voittamalla pomoja, tähdistä ja pelaajatasoista.') + '</p>';
  for (const slot in WARDROBE) {
    const items = WARDROBE[slot].filter(it => priceOf(it));
    if (!items.length) continue;
    html += `<h3 class="wtitle">${SLOT_NAMES[slot]}</h3><div class="wgrid">` + items.map(it => {
      const have = owns(slot, it[0]), p = priceOf(it), can = meta.coins >= p;
      return `<button class="witem${have ? ' on' : ''}" type="button" data-buy="${slot}" data-item="${it[0]}"${have || !can ? ' disabled' : ''}>` +
        `<b>${swatch(slot, it[0])}${it[1]}</b><small>${have ? T('Omistat') : '🪙 ' + p}</small></button>`;
    }).join('') + '</div>';
  }
  showOverlay(html + '<div class="row" style="margin-top:14px"><button class="btn alt" id="wardBtn" type="button">' + T('Hahmo') + '</button><button class="btn" id="backMenu" type="button">' + T('Takaisin') + '</button></div>');
}
// player level, experience bar and coins for the main menu
function metaBarHTML() {
  const need = xpNeed(meta.lvl), pct = meta.lvl >= MAX_PLV ? 100 : Math.round(meta.xp / need * 100), nr = nextReward();
  return `<div class="meta"><span class="plv" title="${T('Pelaajataso')}">${meta.lvl}</span>` +
    `<div class="xpbar" role="progressbar" aria-label="${T('Kokemus')}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i><span>${meta.lvl >= MAX_PLV ? T('Huipputaso!') : meta.xp + ' / ' + need + ' XP'}</span></div>` +
    `<span class="coinc">🪙 ${meta.coins.toLocaleString('fi-FI')}</span></div>` +
    (nr ? `<p class="nextrw">${T('Seuraava palkinto: pelaajataso {0} → {1}', nr[0], nr[1])}</p>` : '');
}
// the summary on the end screen: experience gained (the bar fills as an animation), coins, new levels
function metaOverHTML() {
  if (cheated) return '';
  const need = xpNeed(meta.lvl), pct = meta.lvl >= MAX_PLV ? 100 : Math.round(meta.xp / need * 100), left = need - meta.xp;
  const startPct = gameLvls.length ? 0 : Math.max(0, Math.round((meta.xp - gameXP) / need * 100));
  return `<div class="metaover"><div class="row2"><b>+${gameXP} XP</b><b>🪙 +${gameCoins}</b>${gameLvls.length ? `<b class="lvup">${T('Pelaajataso {0}!', meta.lvl)}</b>` : ''}</div>` +
    `<div class="xpbar big"><i style="width:${startPct}%" data-to="${pct}"></i><span>${T('Pelaajataso')} ${meta.lvl} · ${meta.xp} / ${need} XP</span></div>` +
    (meta.lvl < MAX_PLV && left <= need * 0.3 ? `<p class="near">${T('Vain {0} XP pelaajatasoon {1}!', left, meta.lvl + 1)}</p>` : '') + '</div>';
}
function animateXP() {
  const bar = card.querySelector('.xpbar.big i');
  if (bar) requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = bar.dataset.to + '%'; }));
}
