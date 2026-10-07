# Carlingo – Spezifikation v1 (Grundgerüst)

> Markdown-Abschrift der Spezifikation (Original als PDF übergeben). Abweichungen und Entscheidungen
> während der Umsetzung stehen in `docs/DECISIONS.md`.

## 1. Worum es geht

Carlingo ist eine Lern-App im Stil von Duolingo, mit der man Automodelle erkennen und einordnen lernt. Die erste Nutzerin arbeitet im Design bei Mercedes-Benz und möchte

1. Autos auf der Straße erkennen (Hauptziel) und
2. dazu Wissen aufbauen: Modellreihe, Baureihe, Bauzeit, Motorisierung, Leistung.

Das erste Inhaltspaket ist das aktuelle Mercedes-Benz-Programm. Später sollen weitere Sparten (historische Modelle) und weitere Marken dazukommen.

Diese Spezifikation beschreibt das **Grundgerüst**: eine vollständig spielbare App mit wenigen Beispieldaten. Das Auffüllen der Inhalte passiert danach und darf keinen Code mehr erfordern.

### Leitprinzip

**Inhalt ist Daten, nicht Code.** Ein neues Modell, ein neues Level oder eine neue Marke hinzuzufügen heißt: JSON-Dateien und Bilder ergänzen. Fragen werden nie von Hand geschrieben, sondern von Generatoren aus den Daten erzeugt. Jede Architekturentscheidung ist an diesem Prinzip zu messen.

## 2. Umfang

### In v1 enthalten

- Spielbare PWA, mobile first, offline nutzbar
- Ein Inhaltspaket `mercedes` mit 6 bis 8 Beispielfahrzeugen
- Lernpfad mit Levels, Lerneinheiten mit 10 Fragen
- Sieben Fragetypen (siehe Abschnitt 7)
- Wiederholung nach Karteikasten-Prinzip
- XP, Tagesserie, Steckbrief-Sammlung
- Datenvalidierung, Tests, CI, Deployment auf GitHub Pages
- Anleitung zum Hinzufügen von Inhalten

### Bewusst nicht in v1

- Accounts, Server, Ranglisten, Synchronisation
- Native Apps, App-Store-Veröffentlichung
- Bezahlfunktionen, Werbung, Tracking
- Vollständiger Mercedes-Datensatz
- Fertiges visuelles Design (kommt später von der Nutzerin, siehe Abschnitt 11)

### Randbedingung Kosten

Alles muss dauerhaft kostenlos betreibbar sein. Keine kostenpflichtigen Dienste, keine API-Schlüssel, kein Backend.

## 3. Technik

| Bereich      | Wahl                                                  |
| ------------ | ----------------------------------------------------- |
| Build        | Vite                                                  |
| Sprache      | TypeScript, `strict`                                  |
| UI           | React                                                 |
| Routing      | React Router mit Hash-Routing (wegen GitHub Pages)    |
| Styling      | Tailwind CSS, Design-Tokens als CSS-Variablen         |
| Validierung  | Zod                                                   |
| Zustand      | Zustand (Store), Persistenz über eigenen Storage-Adapter |
| PWA          | vite-plugin-pwa                                       |
| Tests        | Vitest, React Testing Library                         |
| Qualität     | ESLint, Prettier                                      |
| Paketmanager | npm                                                   |
| Hosting      | GitHub Pages über GitHub Actions                      |

Jeweils die aktuelle stabile Version verwenden. Abhängigkeiten sparsam halten: keine UI-Komponentenbibliothek, keine Animationsbibliothek, solange CSS reicht.

### Sprachkonvention

- Code, Bezeichner, Dateinamen, JSON-Schlüssel, Commits: Englisch
- Alle sichtbaren Texte und alle Inhalte: Deutsch
- UI-Texte liegen zentral in einer Datei (`src/i18n/de.ts`), nicht verstreut in Komponenten. Kein i18n-Framework nötig, aber eine zweite Sprache soll später möglich sein.

## 4. Projektstruktur

```
content/
  mercedes/
    brand.json
    vehicles.json
    levels.json
    images/
src/
  content/        Schemas, Laden und Validieren der Pakete
  engine/
    generators/   ein Modul pro Fragetyp
    distractors.ts
    session.ts    stellt eine Lerneinheit zusammen
    srs.ts        Karteikasten-Logik
    rng.ts        Zufall mit Seed
  store/          Lernstand, Storage-Adapter
  ui/
    screens/
    components/
  i18n/
  styles/tokens.css
scripts/
  validate-content.ts
docs/
  CONTENT_GUIDE.md
  CONTENT_TODO.md
```

Die `engine` ist reines TypeScript ohne React und ohne Browser-APIs. Sie muss vollständig in Node testbar sein.

## 5. Datenmodell

### brand.json

```json
{
  "id": "mercedes",
  "name": "Mercedes-Benz",
  "families": [
    { "id": "compact", "label": "Kompaktwagen" },
    { "id": "saloon", "label": "Limousinen" },
    { "id": "estate", "label": "T-Modelle" },
    { "id": "suv", "label": "SUV & Geländewagen" },
    { "id": "coupe", "label": "Coupés" },
    { "id": "convertible", "label": "Cabriolets & Roadster" },
    { "id": "van", "label": "Vans" }
  ],
  "glossary": [{ "term": "4MATIC", "text": "Allradantrieb" }]
}
```

### vehicles.json

Ein Eintrag steht für genau eine erkennbare Variante: Modellreihe + Karosserie + Antriebsart + Generation. GLC SUV Verbrenner und GLC elektrisch sind zwei Einträge.

```json
{
  "id": "glc-suv-x254",
  "displayName": "GLC",
  "series": "GLC",
  "family": "suv",
  "bodyStyle": "suv",
  "powertrain": "combustion",
  "subBrand": "mercedes-benz",
  "modelCode": "X254",
  "production": { "from": 2022, "to": null, "faceliftYears": [] },
  "status": "current",
  "collections": ["current"],
  "similarTo": ["gle-suv-v167"],
  "features": [{ "area": "rear", "text": "…" }],
  "engines": [{ "name": "GLC 220 d 4MATIC", "fuel": "diesel", "powerKw": 145, "powerPs": 197 }],
  "funFact": "…",
  "images": [
    {
      "file": "glc-suv-x254-rear.jpg",
      "view": "rear",
      "detail": false,
      "source": "…",
      "author": "…",
      "license": "…"
    }
  ],
  "verified": false
}
```

Wertebereiche:

- `powertrain`: `combustion` | `plug-in-hybrid` | `electric`
- `subBrand`: `mercedes-benz` | `mercedes-amg` | `mercedes-maybach`
- `status`: `current` | `phasing-out` | `discontinued`
- `collections`: frei, v1 nutzt `current`, später `historic`
- `features.area`: `front` | `rear` | `side` | `interior` | `general`
- `images.view`: `front` | `rear` | `side` | `front-three-quarter` | `rear-three-quarter` | `interior`
- `images.detail`: `true` für Ausschnitte (nur Rückleuchte, nur Grill)

Pflichtfelder: `id`, `displayName`, `series`, `family`, `bodyStyle`, `powertrain`, `subBrand`, `status`, `collections`, `images` (mindestens eines), `verified`. Alles andere ist optional. Fehlt ein optionales Feld, erzeugen die betroffenen Generatoren für dieses Fahrzeug einfach keine Frage.

`similarTo` ist ein optionaler Hinweis auf Verwechslungskandidaten. Er ergänzt die automatische Ähnlichkeitsberechnung.

### levels.json

```json
{
  "collection": "current",
  "levels": [
    {
      "id": "series-basics",
      "title": "Modellreihen erkennen",
      "description": "…",
      "filter": { "subBrand": ["mercedes-benz"] },
      "generators": ["image-to-name", "name-to-image"],
      "difficulty": 1,
      "unlockAfter": []
    }
  ]
}
```

`filter` kann jedes Fahrzeugfeld einschränken. `difficulty` (1 bis 3) steuert die Auswahl der falschen Antworten. `unlockAfter` nennt Levels, die vorher gemeistert sein müssen.

## 6. Validierung der Inhalte

Zod-Schemas sind die einzige Quelle der Wahrheit. Die TypeScript-Typen werden daraus abgeleitet.

`npm run validate` prüft zusätzlich:

- IDs sind eindeutig, alle Verweise (`family`, `similarTo`, `unlockAfter`, Generator-Namen) existieren
- Jede Bilddatei existiert, kein Bild im Ordner ist unbenutzt
- Jedes Bild hat `source` und `license`
- Jedes Level ergibt mit seinem Filter genug Fahrzeuge, um Fragen mit drei falschen Antworten zu bilden
- Keine Zyklen in `unlockAfter`

Fehlermeldungen nennen Datei, Fahrzeug-ID und Feld in verständlichem Deutsch. Die Validierung läuft vor jedem Build und in der CI. Ein fehlerhaftes Paket darf nie deployt werden.

## 7. Fragen-Engine

### Generator-Schnittstelle

```ts
interface QuestionGenerator {
  id: string;
  skill: Skill;
  canGenerate(vehicle: Vehicle, pool: Vehicle[]): boolean;
  generate(vehicle: Vehicle, pool: Vehicle[], ctx: GenContext): Question;
}
```

`ctx` enthält Schwierigkeit und einen Zufallsgenerator mit Seed. Generatoren sind reine Funktionen: gleiche Eingabe und gleicher Seed ergeben dieselbe Frage. Das macht sie testbar.

Ein neuer Fragetyp ist ein neues Modul plus ein Eintrag in der Registry. Sonst ändert sich nichts.

### Fragetypen in v1

| ID              | Skill            | Frage                                            |
| --------------- | ---------------- | ------------------------------------------------ |
| `image-to-name` | recognize        | Bild zeigen, Name aus 4 wählen                   |
| `name-to-image` | recognize        | Name zeigen, Bild aus 4 wählen                   |
| `detail-to-name`| recognize-detail | Detailbild zeigen, Name aus 4 wählen             |
| `powertrain`    | powertrain       | Verbrenner, Plug-in-Hybrid oder elektrisch?      |
| `body-style`    | body-style       | Welche Karosserieform?                           |
| `model-code`    | model-code       | Welche Baureihe?                                 |
| `power-compare` | power            | Welche der beiden Motorisierungen hat mehr Leistung? |

Leistung wird bewusst als Vergleich abgefragt, nicht als exakte Zahl.

### Falsche Antworten

Eine zentrale Funktion bewertet die Ähnlichkeit zweier Fahrzeuge (gleiche Familie, gleiche Karosserie, gleiche Reihe, gleiche Submarke, Eintrag in `similarTo`).

- Schwierigkeit 1: möglichst unähnliche Kandidaten
- Schwierigkeit 2: gemischt
- Schwierigkeit 3: möglichst ähnliche Kandidaten

Zwei Antwortmöglichkeiten dürfen nie denselben sichtbaren Text haben. Bei `image-to-name` dürfen keine zwei Optionen auf dasselbe Bild passen.

### Rückmeldung

Nach jeder Antwort erscheint, ob sie richtig war, die richtige Lösung und ein Erkennungsmerkmal aus `features`. Bevorzugt wird ein Merkmal, dessen `area` zur gezeigten Ansicht passt.

## 8. Lernlogik

### Fakten

Der Lernstand wird pro Fakt gespeichert. Ein Fakt ist `vehicleId` + `skill`, zum Beispiel "GLC X254 erkennen" oder "GLC X254 Baureihe".

### Karteikasten

Fünf Fächer. Richtig beantwortet: ein Fach weiter. Falsch: zurück in Fach 1.

| Fach | Wiedervorlage nach                  |
| ---- | ----------------------------------- |
| 1    | sofort, noch in derselben Einheit   |
| 2    | 1 Tag                               |
| 3    | 3 Tagen                             |
| 4    | 7 Tagen                             |
| 5    | 21 Tagen                            |

Die Intervalle liegen als Konfiguration vor, nicht im Code verstreut.

### Lerneinheit

Eine Einheit hat 10 Fragen und wird so zusammengestellt:

1. Fällige Fakten des Levels
2. Neue Fakten, höchstens 4 pro Einheit
3. Auffüllen mit den schwächsten Fakten

Falsch beantwortete Fragen kommen am Ende der Einheit noch einmal. Derselbe Fakt erscheint nie zweimal direkt hintereinander.

### Fortschritt

- Ein Level gilt als gemeistert, wenn 80 % seiner Fakten in Fach 3 oder höher liegen.
- Ein Steckbrief wird freigeschaltet, wenn der Fakt "erkennen" für dieses Fahrzeug Fach 3 erreicht.
- Wissens-Skills (`model-code`, `power`) werden für ein Fahrzeug erst abgefragt, wenn sein Steckbrief freigeschaltet ist.

### Motivation

- XP: 10 pro richtiger Antwort, Bonus für fehlerfreie Einheit
- Tagesserie: zählt Tage mit mindestens einer abgeschlossenen Einheit
- Sammlung: Raster aller Fahrzeuge, freigeschaltete farbig, gesperrte als Silhouette

Keine Herzen, keine Strafen, keine Wartezeiten.

## 9. Speicherung

Der Lernstand liegt lokal im Browser. Zugriff ausschließlich über einen Storage-Adapter mit schmaler Schnittstelle, damit später ein Server-Backend eingehängt werden kann.

- Gespeicherte Daten tragen eine Versionsnummer, Migrationen sind vorgesehen
- Unbekannte Fahrzeug-IDs im Lernstand (Modell wurde entfernt) werden ignoriert, nicht als Fehler behandelt
- Einstellungen bieten Export und Import des Lernstands als JSON-Datei sowie Zurücksetzen mit Rückfrage

## 10. Bildschirme

1. **Start / Lernpfad:** Sparte, Levels als Pfad, Status je Level, Serie und XP
2. **Lerneinheit:** Fortschrittsbalken, Frage, Antworten, Rückmeldung, Abbrechen mit Rückfrage
3. **Ergebnis:** richtige Antworten, XP, neu freigeschaltete Steckbriefe
4. **Sammlung:** Raster, filterbar nach Familie
5. **Steckbrief:** Bilder, Bauzeit, Baureihe, Merkmale nach Bereich, Motoren, Fun Fact
6. **Einstellungen:** Export, Import, Zurücksetzen, Bildnachweise

Der Bildschirm "Bildnachweise" listet automatisch alle Bilder mit Quelle, Urheber und Lizenz aus den Daten.

## 11. Gestaltung

Das endgültige Design kommt später von der Nutzerin selbst. v1 liefert ein ruhiges, sauberes Standarddesign, das leicht umzugestalten ist.

- Alle Farben, Abstände, Radien und Schriften als CSS-Variablen in `styles/tokens.css`. Komponenten verwenden nur Tokens, keine festen Werte.
- Heller und dunkler Modus über die Tokens
- Mobile first ab 360 px Breite, bedienbar mit einer Hand, Tippflächen mindestens 44 px
- Barrierefreiheit: Tastaturbedienung, sichtbarer Fokus, ausreichender Kontrast, Alt-Texte ohne Verrat der Lösung, Rücksicht auf `prefers-reduced-motion`
- Rückmeldung nie nur über Farbe, immer auch über Symbol und Text
- Keine Logos, Schriften oder Markenzeichen von Herstellern in der Oberfläche

## 12. Bilder

- Bilder liegen im Repo, kein Hotlinking
- v1 verwendet erzeugte Platzhalter-Grafiken (SVG mit Fahrzeug-ID und Ansicht), damit die App ohne Bildrechte lauffähig ist
- Echte Bilder werden später von Hand ergänzt. Keine Bilder aus dem Netz herunterladen.
- Bilder werden lazy geladen und haben feste Seitenverhältnisse, damit nichts springt

## 13. Beispieldaten

6 bis 8 Fahrzeuge, so gewählt, dass jeder Fragetyp und jede Schwierigkeit funktioniert: mindestens zwei Familien, ein Paar Verbrenner/elektrisch derselben Reihe, zwei Karosserievarianten derselben Reihe, ein AMG-Modell.

**Wichtig:** Technische Angaben (Baureihe, Bauzeit, Leistung, Merkmale) dürfen nicht geraten werden. Alle Beispieldaten tragen `"verified": false`. Unsichere Felder bleiben leer. `docs/CONTENT_TODO.md` listet, was ein Mensch prüfen und ergänzen muss. Die App zeigt im Entwicklungsmodus einen Hinweis bei ungeprüften Einträgen.

## 14. Qualität

- Unit-Tests für jeden Generator, die Auswahl falscher Antworten, die Karteikasten-Logik und die Zusammenstellung der Einheit
- Ein Test, der für jedes Level des Beispielpakets eine komplette Einheit erzeugt und auf Plausibilität prüft
- Komponententest für den Ablauf einer Lerneinheit
- `npm run check` führt Typprüfung, Lint, Validierung und Tests aus
- CI führt `check` und Build bei jedem Push aus und deployt `main` auf GitHub Pages

## 15. Dokumentation

- `README.md`: Was ist das, lokal starten, Befehle, Deployment
- `docs/CONTENT_GUIDE.md`: Schritt für Schritt, mit Beispiel
  - ein Fahrzeug hinzufügen
  - Bilder hinzufügen (Benennung, Größe, Nachweis)
  - ein Level hinzufügen
  - eine Sparte hinzufügen
  - eine Marke hinzufügen
  - einen Fragetyp hinzufügen
- `docs/CONTENT_TODO.md`: offene Inhalte

Die Anleitung richtet sich an jemanden, der JSON bearbeiten kann, aber nicht programmiert.

## 16. Abnahmekriterien

1. `npm install && npm run dev` startet die App ohne weitere Schritte
2. `npm run check` läuft fehlerfrei durch
3. Eine komplette Lerneinheit ist auf dem Handy spielbar, auch offline nach dem ersten Laden
4. Die App lässt sich auf dem Homescreen installieren
5. Der Lernstand überlebt Neuladen und Neustart
6. Ein neues Fahrzeug in `vehicles.json` plus Bild erscheint ohne Codeänderung in Fragen und Sammlung
7. Ein neues Level in `levels.json` erscheint ohne Codeänderung im Lernpfad
8. Ein absichtlich kaputter Dateneintrag lässt `npm run validate` mit verständlicher Meldung scheitern
9. Ein zweites Inhaltspaket lässt sich nach Anleitung anlegen, ohne `src/engine` anzufassen

## 17. Reihenfolge

1. Projekt aufsetzen, Qualitätswerkzeuge, CI
2. Schemas, Laden, Validierung, Beispieldaten mit Platzhalterbildern
3. Engine: Zufall, Generatoren, falsche Antworten, Tests
4. Lernlogik und Speicherung, Tests
5. Oberfläche: Lerneinheit, dann Lernpfad, Ergebnis, Sammlung, Steckbrief, Einstellungen
6. PWA, Offline, Deployment
7. Dokumentation, Abnahmekriterien einzeln durchgehen
