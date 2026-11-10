// PiispanPELI · Starts the game.
'use strict';

// ------------------------------ boot ------------------------------
function start() {
  layout(); syncSound();
  try { if (document.fonts) { document.fonts.load(`800 20px ${FONT}`); document.fonts.load('400 40px "Lilita One"').then(() => buildBg()).catch(() => {}); } } catch (e) { /* fonts are optional */ }
  preloadMenu(); showMenu();
  syncUI();
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  playIntro();
}
start();
