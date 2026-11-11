# Työnkulku

Tämä ohje koskee kaikkia, jotka tekevät muutoksia PiispanPELIin, ja kaikkia työkaluja, joilla muutoksia tehdään.

## Haarat

| Haara | Mitä siinä on |
|---|---|
| `main` | Julkaistu peli (https://aaronpiispa.github.io/PiispaPELI/). Tänne tulee vain testattua ja valmista koodia. |
| `test` | Työhaara. Kaikki uudet muutokset tulevat ensin tänne. |

**Mainiin ei koskaan pushata suoraan.**

## Näin muutos etenee

1. **Aloita test-haarasta.** Hae ensin uusin tilanne:

   ```
   git fetch origin
   git checkout test
   git pull origin test
   ```

   Jos `test`-haaraa ei ole, luo se mainista: `git checkout -b test origin/main`.
   Jos test-haarassa on toisen tekijän keskeneräisiä muutoksia, jatka niiden päälle. Älä poista niitä.

2. **Tee yhden istunnon muutokset ja pushaa ne test-haaraan.** Testejä ei tarvitse ajaa ennen tätä pushia.

   ```
   git add -A
   git commit -m "Lyhyt kuvaus muutoksista suomeksi"
   git push origin test
   ```

3. **Testaa ja korjaa test-haarassa.**

   ```
   npm test
   npm run test:e2e
   ```

   Kokeile peliä myös selaimessa puhelin- ja tietokonekoossa. Korjaukset commitoidaan ja pushataan samaan test-haaraan.

4. **Julkaise vasta, kun kaikki on valmista.** Kun testit menevät läpi ja muutokset on todettu valmiiksi, test-haara yhdistetään mainiin (pull request `test` → `main` GitHubissa tai `git checkout main && git merge test && git push origin main`).

Älä koskaan käytä `git push --force`-komentoa `main`- tai `test`-haaraan.

## Tekijät

Tämän projektin tekijät ovat **aaronpiispa** ja **noponenv**. Muita tekijöitä tai avustajia ei mainita missään.

- Commitin tekijänä (author ja committer) on aina `aaronpiispa` tai `noponenv`.
  noponenv: `git config user.name "noponenv"` ja `git config user.email "190293559+noponenv@users.noreply.github.com"`.
- Commit-viesteissä, pull requesteissa, koodissa, kommenteissa ja dokumenteissa ei mainita mitään työkaluja, ohjelmia, tekoälyjä tai avustajia, joilla muutos on tehty.
- Ei `Co-Authored-By`-rivejä, "Generated with" -rivejä tai muita allekirjoituksia.
