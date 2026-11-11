// PiispanPELI · Starts the game.
'use strict';

// ------------------------------ boot ------------------------------
function start() {
  layout(); syncSound();
  try {
    if (document.fonts) {
      const fontsChanged = () => { fontGen++; fitMenu(); };
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fontsChanged);
      document.fonts.load(`800 20px ${FONT}`).then(fontsChanged).catch(() => {});
      document.fonts.load('400 40px "Lilita One"').then(() => { fontsChanged(); buildBg(); }).catch(() => {});
    }
  } catch (e) { /* fonts are optional */ }
  preloadMenu(); showMenu();
  syncUI();
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  playIntro();
}
start();
