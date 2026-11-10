# PiispanPELI

Lippupallopeli junavaunussa: ammu Euroopan maiden lippupalloja vaunuun, ja kaksi samaa maata yhdistyy isommaksi maaksi – Virosta aina Venäjään asti.

Pelaa: https://aaronpiispa.github.io/PiispaPELI/

## Rakenne

| Tiedosto | Sisältö |
|---|---|
| `index.html` | Sivun runko ja skriptien latausjärjestys |
| `css/style.css` | Valikoiden ja painikkeiden tyylit |
| `js/engine.js` | Pehmeä fysiikka: pallot helmirenkaina, törmäykset, yhdistyminen |
| `js/i18n-data.js` | Käännökset (avaimena suomenkielinen teksti) |
| `js/core.js` | Yhteiset vakiot, tallennus, liput, kielen valinta |
| `js/audio.js` | Generoitu lo-fi-musiikki ja ääniefektit |
| `js/scenery.js` | Asettelu, automaattinen laatutaso, maisemat |
| `js/game.js` | Pelin kulku, pelimuodot, teemat, saavutukset, pokaalit, tallennukset |
| `js/render.js` | Vaunun, pallojen, nappien ja HUDin piirto sekä pääsilmukka |
| `js/mascot.js` | Hahmon piirto |
| `js/ui.js` | Valikot, asennus, ohjaus, kielen vaihto |
| `js/intro.js` | Avausanimaatio |
| `js/main.js` | Käynnistys |
| `sw.js` | Offline-tuki (muista kasvattaa `VERSION`-arvoa kun tiedostot muuttuvat) |

Skriptit ovat tavallisia selainskriptejä, jotka jakavat saman globaalin näkyvyysalueen, joten niiden järjestys `index.html`:ssä on tärkeä.

## Suorituskyky

Peli seuraa ruudunpäivitysnopeutta pelin aikana. Jos puhelin ei pysy mukana, peli laskee automaattisesti piirtotarkkuutta (2× → 1,5× → 1,2× → 1×) ja kahdella alimmalla tasolla jättää pois maisemien koriste-animaatiot. Valittu taso muistetaan laitteella. Vaunun staattiset osat ja pokaalihyllyt piirretään valmiiksi välimuistikuviin.

## Testit

Yksikkötestit (eivät vaadi asennuksia, Node 18+):

```
npm test
```

Selaintestit pelaavat peliä oikeassa selaimessa:

```
npm install
npx playwright install chromium
npm run test:e2e
```
