# Carlingo

Eine Lern-App im Stil von Duolingo, mit der man Automodelle erkennen und einordnen lernt –
Modellreihe, Baureihe, Bauzeit, Antrieb und Leistung. Das erste Inhaltspaket ist das aktuelle
Mercedes-Benz-Programm.

- **Progressive Web App:** läuft im Browser, lässt sich auf dem Homescreen installieren und
  funktioniert nach dem ersten Laden offline.
- **Inhalt ist Daten, nicht Code:** Fahrzeuge, Levels, Sparten und Marken sind JSON-Dateien und
  Bilder. Fragen erzeugt die App automatisch aus den Daten.
- **Dauerhaft kostenlos:** kein Backend, keine Konten, keine API-Schlüssel, kein Tracking. Der
  Lernstand liegt nur im Browser und lässt sich als Datei exportieren.

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org/) 22.22 oder neuer (siehe `.nvmrc`).

```bash
npm install
npm run dev
```

Die App läuft dann unter der angezeigten Adresse (meist http://localhost:5173).

## Befehle

| Befehl                 | Zweck                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Entwicklungsserver mit Hot Reload                                   |
| `npm run check`        | Typprüfung, Lint (ESLint + Prettier), Inhaltsprüfung und alle Tests |
| `npm run validate`     | Nur die Inhalte prüfen – Fehlermeldungen auf Deutsch                |
| `npm run placeholders` | Platzhalter-SVGs für eingetragene, aber fehlende Bilder erzeugen    |
| `npm run test`         | Alle Tests einmal; `npm run test:watch` im Beobachtungsmodus        |
| `npm run build`        | Inhalte prüfen und Produktions-Build nach `dist/` erzeugen          |
| `npm run preview`      | Den Build lokal ausliefern (inkl. Service Worker)                   |
| `npm run format`       | Code mit Prettier formatieren                                       |

## Projektstruktur

```
content/<marke>/        Inhalte: brand.json, vehicles.json, levels/<sparte>.json, images/
src/content/            Zod-Schemas, Laden und Validieren der Pakete
src/engine/             Fragen-Engine und Lernlogik – reines TypeScript, ohne React und Browser-APIs
  generators/           ein Modul pro Fragetyp + Registry
  distractors.ts        Ähnlichkeit und Auswahl falscher Antworten
  session.ts            Zusammenstellung und Ablauf einer Lerneinheit
  srs.ts                Karteikasten
  rng.ts                Zufall mit Seed
  config.ts             alle Stellschrauben (Intervalle, XP, Gewichte)
src/store/              Lernstand, Speicherformat mit Versionen, Storage-Adapter
src/ui/                 React-Oberfläche (screens/, components/)
src/i18n/de.ts          alle sichtbaren Texte
src/styles/tokens.css   Design-Tokens: Farben, Abstände, Radien, Schriften (hell und dunkel)
scripts/                validate-content.ts, generate-placeholders.ts
tests/                  Testdaten (erfundene Fahrzeuge) und übergreifende Tests
docs/                   Anleitungen und Notizen (siehe unten)
```

## Dokumentation

- [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) – Inhalte pflegen: Fahrzeug, Bilder, Level,
  Sparte, Marke, Fragetyp hinzufügen. Für Menschen, die JSON bearbeiten, aber nicht programmieren.
- [`docs/CONTENT_TODO.md`](docs/CONTENT_TODO.md) – was an den Beispieldaten noch geprüft und
  ergänzt werden muss.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) – Entscheidungen und Abweichungen von der Spezifikation.
- [`docs/IDEAS.md`](docs/IDEAS.md) – Ideen für später.
- [`SPEC.md`](SPEC.md) – die Spezifikation v1.

## Design anpassen

Alle Farben, Abstände, Radien und Schriften stehen in `src/styles/tokens.css`, für hellen und
dunklen Modus. Komponenten verwenden ausschließlich diese Tokens (Tailwinds eigene Standardwerte
sind abgeschaltet). Ein neues Design heißt also in erster Linie: diese eine Datei ändern.

## Deployment

GitHub Actions (`.github/workflows/ci.yml`) führt bei jedem Push `npm run check` und
`npm run build` aus. Pushes auf `main` werden anschließend auf GitHub Pages veröffentlicht. Ist ein
Inhalt ungültig, schlägt die CI fehl und nichts wird veröffentlicht.

Einmalige Einrichtung im Repository auf GitHub:

1. **Settings → Pages → Build and deployment → Source: „GitHub Actions“** wählen.
2. Den Arbeitsstand nach `main` mergen. Der nächste Lauf veröffentlicht die App unter
   `https://<benutzer>.github.io/<repository>/`.

Die App nutzt relative Pfade und Hash-Routing (`…/#/collection`) und funktioniert daher unter
jedem Pfad ohne weitere Konfiguration.

## Rechtliches

Carlingo ist ein privates Lernprojekt und steht in keiner Verbindung zu den gezeigten Herstellern.
Die Oberfläche verwendet keine Logos, Schriften oder Markenzeichen von Herstellern. Die
Beispielbilder sind erzeugte Platzhalter; echte Bilder brauchen eine passende Lizenz und einen
Nachweis (siehe Content Guide).
