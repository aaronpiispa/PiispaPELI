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
| `js/stageart.js` | Tasojen 2 ja 3 pallojen kuvat (planeetat, tähdet, olennot, maailmat, jalokivet, kaavat, tutkinnot) |
| `js/mascot.js` | Hahmon piirto |
| `js/ui.js` | Valikot, asennus, ohjaus, kielen vaihto |
| `js/intro.js` | Avausanimaatio |
| `js/main.js` | Käynnistys |
| `sw.js` | Offline-tuki: peli avautuu välimuistista, uusi versio haetaan taustalla ja otetaan käyttöön seuraavalla käynnistyksellä vasta kun kaikki tiedostot ovat tulleet perille. `VERSION`-arvoa kasvatetaan vain kun tiedostoja lisätään tai poistetaan tai `sw.js` itse muuttuu. |

Skriptit ovat tavallisia selainskriptejä, jotka jakavat saman globaalin näkyvyysalueen, joten niiden järjestys `index.html`:ssä on tärkeä.

## Suorituskyky

Peli seuraa ruudunpäivitysnopeutta pelin aikana. Jos puhelin ei pysy mukana, peli laskee automaattisesti piirtotarkkuutta (2× → 1,5× → 1,2× → 1×) ja kahdella alimmalla tasolla jättää pois maisemien koriste-animaatiot. Valittu taso muistetaan laitteella, mutta muutaman päivän päästä kokeillaan taas yhtä parempaa tasoa, jotta yksi hidas hetki ei jää pysyväksi. Ruutuja, joissa välimuistikuva piirretään uudelleen, ei lasketa mittaukseen.

Vaunun staattiset osat ja pokaalihyllyt piirretään valmiiksi välimuistikuviin. Kuvat kattavat vain ne alueet, joilla on sisältöä (seinät, pohja, hyllyt), ja ne osuvat kokonaisille pikseleille, joten lopputulos näyttää samalta kuin suoraan piirrettynä. Kun verkkofontti latautuu, tekstiä sisältävät kuvat piirretään uudelleen.

## Näytöt

Peli sovittaa itsensä mihin tahansa näyttöön: pystypuhelimissa tiedot ovat vaunun ylä- ja alapuolella, leveillä näytöillä sivuilla. Isoilla näytöillä tiedot, painikkeet ja valikot kasvavat (`ui`-kerroin). Vaakasuoraan käännetyssä puhelimessa päävalikko on kahdessa palstassa, jotta Pelaa-nappi näkyy heti.

## Testit

Yksikkötestit (eivät vaadi asennuksia, Node 18+):

```
npm test
```

Selaintestit pelaavat peliä oikeassa selaimessa ja tarkistavat mm. 15 eri näyttökokoa, välimuistikuvien tarkkuuden ja offline-tilan:

```
npm install
npx playwright install chromium
npm run test:e2e
```

Samat selaintestit muilla moottoreilla ja oikealla näytönohjaimella:

```
npx playwright install firefox webkit
npm run test:e2e:firefox
npm run test:e2e:webkit     # Safarin moottori; Linuxilla voi tarvita kirjastot: sudo npx playwright install-deps webkit
npm run test:e2e:gpu        # Chromium piirtää koneen näytönohjaimella
```

Selaintestit kattavat mm. 15 näyttökokoa ja 16 kieltä, tauko- ja loppunäkymät, puhelimen loven, offline-tilan ja päivityksen edellisestä versiosta, hitaan puhelimen, pitkän pelisession, näppäimistön ja liikkeen vähentämisen.
