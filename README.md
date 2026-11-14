# Emerald Caverns

Ein kleines Höhlen-Puzzlespiel für den Browser – im Geist der klassischen
Heimcomputer-Spiele der 80er (inspiriert von Boulder Dash). Grabe dich durch 100 Höhlen,
sammle alle Smaragde, weiche fallenden Felsen und Wächtern aus und erreiche den
leuchtenden Smaragd-Ausgang.

**Ein Spiel von Björn Buchweitz** · Barni Productions · © 2026

## Spielen

**Einfach so:** `index.html` im Browser öffnen (Chrome, Edge, Firefox oder Safari).
Es wird nichts installiert. Profile und Spielstände werden dann im Browser gespeichert.

**Mit gemeinsamer Highscore-Liste und Profilen für alle Geräte** (z. B. auf einem
Raspberry Pi im Heimnetz):

```bash
python3 server.py 8091
```

Danach im Browser `http://<adresse-des-rechners>:8091` öffnen. `server.py` braucht nur
Python 3 (keine Zusatzpakete). Er liefert das Spiel aus und speichert Highscores,
letzte Spiele und Profile im Ordner `daten/` (wird automatisch angelegt und ist über
den Browser nicht abrufbar). Ein anderer Speicherort lässt sich mit der Umgebungsvariable
`EMERALD_DATA` festlegen.

> Hinweis: `server.py` ist für das eigene Heimnetz gedacht. Er hat keine Anmeldung –
> bitte nicht ungeschützt ins Internet stellen.

## Steuerung

| Taste | Aktion |
| --- | --- |
| Pfeiltasten / WASD | bewegen, graben, Steine seitlich schieben |
| Leertaste | Dynamit legen |
| X | großes Dynamit legen (doppelte Reichweite) |
| Enter | weiter |

Auf Touch-Geräten erscheinen Steuerknöpfe.

## Was drin ist

- 100 Level, darunter handgestaltete Höhlen; ab Level 30 zunehmend mehr Steine zum Schieben
- Felsen und Smaragde fallen und rollen, Wächter patrouillieren, Dynamit sprengt rissige Wände
- Level-Editor zum Bauen und Testen eigener Höhlen (Export als JSON)
- Musik wird im Spiel erzeugt – jedes Level hat einen eigenen Track
- Spielerprofile, Highscore-Liste und „Letzte Spiele“ (mit `server.py` geräteübergreifend)
- Intro mit Lichtstrahlen, Abspann nach dem 100. Level

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html`, `style.css` | Seite und Gestaltung |
| `game.js` | Spiel, Level, Physik, Editor |
| `musik.js` | erzeugte Levelmusik |
| `intro.js` | Studio-Intro |
| `highscore.js` | Highscore-Liste und letzte Spiele |
| `credits.js` | Abspann |
| `server.py` | optionaler Webserver mit Speicher für Highscores und Profile |
| `audio/` | Klänge und Musik mit Quellenangaben |
| `tools/make_explosion.py` | erzeugt den Explosionsklang |

## Lizenzen

- **Code** (`*.js`, `*.html`, `*.css`, `server.py`, `tools/`): MIT-Lizenz, siehe [LICENSE](LICENSE)
- **Prolog-Musik** „FutureAmbient_3“ von Pudgyplatypus – CC0 1.0 (siehe `audio/PROLOG-LICENSE.md`)
- **Reservemusik** „Crystal Cave (song18)“ von CynicMusic – CC0 1.0 (siehe `audio/LICENSE.md`)
- **Explosionsklang** – selbst synthetisch erzeugt, CC0 1.0 (siehe `audio/DYNAMITE-SOURCE.md`)
- **Schriften** „Barlow Condensed“ und „Space Mono“ werden von Google Fonts geladen (SIL Open Font License)

„Boulder Dash“ ist eine Marke ihrer jeweiligen Inhaber. Emerald Caverns ist ein
eigenständiges Fan-Projekt ohne Verbindung zu diesen Inhabern; Grafiken, Level, Musik
und Code sind eigene Werke.

## Entstehung

Spielidee und Leveldesign: Björn Buchweitz. Der Code entstand mit Unterstützung von
Claude (Anthropic).
