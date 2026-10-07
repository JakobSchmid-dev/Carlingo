# Entscheidungen und Abweichungen

Eigene Entscheidungen bei der Umsetzung von `SPEC.md`, jeweils mit Begründung.

## Technik

- **TypeScript 6.0 statt 7.0.** TypeScript 7.0 ist die neueste Version, aber `typescript-eslint`
  unterstützt derzeit nur Versionen unter 6.1. Ohne `typescript-eslint` kein Lint für TypeScript.
- **Keine Laufzeitumgebung für Skripte (`tsx` o. Ä.).** Node ≥ 22.18 führt TypeScript-Dateien direkt
  aus (Type Stripping). `scripts/validate-content.ts` läuft daher mit `node` allein. Deshalb
  importieren alle Module mit expliziter Dateiendung (`./schema.ts`).
- **Zusätzliche Entwicklungs-Abhängigkeiten:** `jsdom`, `@testing-library/user-event`,
  `@testing-library/jest-dom` (für Komponententests mit React Testing Library nötig),
  `@tailwindcss/vite` (Tailwind-4-Integration), `typescript-eslint`, `@eslint/js`,
  `eslint-plugin-react-hooks`, `globals` (übliche ESLint-Grundausstattung).
- **Engine ohne DOM erzwungen.** Neben ESLint-Regeln wird `src/engine` und `src/content` mit einer
  eigenen `tsconfig.engine.json` ohne DOM-Bibliothek geprüft. Ein versehentlicher Zugriff auf
  `window` oder `localStorage` ist dort ein Typfehler.
- **Design-Tokens als Tailwind-Theme.** `src/styles/tokens.css` definiert die Tokens im
  `@theme`-Block von Tailwind 4; das erzeugt CSS-Variablen und passende Utility-Klassen. Tailwinds
  eigene Standardfarben, Radien, Schriften und Schriftgrößen sind abgeschaltet, sodass Komponenten
  gar keine festen Werte verwenden können.
- **Relativer Basispfad (`base: './'`).** Zusammen mit Hash-Routing läuft der Build unter jedem
  GitHub-Pages-Pfad, unabhängig vom Repository-Namen.
- **`SPEC.md`** ist eine Markdown-Abschrift der als PDF übergebenen Spezifikation.

## Datenmodell

- **Sparten als eigene Level-Dateien.** Statt einer `levels.json` pro Marke gibt es den Ordner
  `content/<marke>/levels/` mit einer Datei pro Sparte (z. B. `current.json`, später
  `historic.json`). Jede Datei hat das Format aus der Spezifikation plus einen Titel für die Sparte.
  Eine neue Sparte ist damit eine neue Datei ohne Codeänderung. (Mit der Nutzerin abgestimmt.)
- **Karosserieformen und Submarken stehen in `brand.json`** (`bodyStyles`, `subBrands`), genauso
  aufgebaut wie `families`. Die Spezifikation nennt für `subBrand` feste Mercedes-Werte und für
  `bodyStyle` gar keine. Als feste Liste im Code bräuchte jede neue Marke oder Karosserieform eine
  Codeänderung. Die Werte aus der Spezifikation stehen in `content/mercedes/brand.json`.
- **`vehicles.json` ist eine Liste** von Fahrzeugen (die Spezifikation zeigt nur einen Eintrag).
- **Zusätzliches optionales Feld `dataSources`** pro Fahrzeug: Liste der Quellen für die
  technischen Angaben. Erleichtert die Prüfung vor `"verified": true`.
- **`fuel` bei Motoren:** `petrol`, `diesel` oder `electric` (Spezifikation zeigt nur `diesel`).
- **`displayName` muss innerhalb einer Marke eindeutig sein**, damit Antwortmöglichkeiten nie
  denselben Text haben. Beispiel: „GLC“ und „GLC mit EQ Technologie“.
- **Mindestens ein Gesamtbild pro Fahrzeug** (`"detail": false`), weil Sammlung, Steckbrief und
  die meisten Fragen ein Gesamtbild brauchen.
- **Unbekannte Felder sind ein Fehler.** So fallen Tippfehler wie `"dispalyName"` sofort auf,
  statt stillschweigend ignoriert zu werden.
- **Zusätzliche Prüfungen in `npm run validate`:** Filterwerte, die auf kein Fahrzeug passen;
  kW/PS-Werte, die nicht zueinander passen; doppelt verwendete Bilddateien; Level-Datei ohne
  Fahrzeuge. Jedes Level muss mindestens 4 Fahrzeuge haben **und** jeder seiner Fragetypen muss
  mindestens eine Frage bilden können.
- **Inhalte sind von Prettier ausgenommen.** Die CI soll für Inhaltspflegende nicht an
  Formatierung scheitern; die fachliche Prüfung macht `npm run validate`.

## Bilder

- **Platzhalter per Skript:** `npm run placeholders` erzeugt für jedes eingetragene, aber noch
  fehlende `.svg`-Bild eine Platzhaltergrafik (Farbe je Fahrzeug, einfache Silhouette je Ansicht
  und Karosserieform, Fahrzeug-ID und Ansicht als Text). Vorhandene Dateien werden nie überschrieben.
- **Dateinamen:** `<fahrzeug-id>-<ansicht>[-detail].<endung>`, nur Kleinbuchstaben, Ziffern und
  Bindestriche. Erlaubt sind `svg`, `jpg`, `jpeg`, `png`, `webp`, `avif`.

## Fragen-Engine

- **„Passt auf dasselbe Bild“ (Verwechslungsgleichheit):** Zwei Einträge gelten als optisch
  gleich, wenn Reihe, Karosserie und Baureihe übereinstimmen (z. B. Verbrenner und Plug-in-Hybrid
  desselben Modells). Fehlt bei einem die Baureihe, gelten sie vorsichtshalber als gleich. Solche
  Paare erscheinen nie gemeinsam als Antworten einer Bild- oder Namensfrage, und die Frage
  „Antriebsart“ wird dann gar nicht gestellt, weil sie am Bild nicht entscheidbar wäre.
- **Ähnlichkeit:** Familie +1, Karosserie +1, Reihe +2, Submarke +1, `similarTo` +3 (in beide
  Richtungen). Gewichte in `src/engine/config.ts`.
- **Schwierigkeit 2 („gemischt“):** die Hälfte der falschen Antworten (abgerundet) aus den
  ähnlichsten Kandidaten, der Rest zufällig.
- **Texte in Fragen:** Die Engine erzeugt keine deutschen Sätze. Fragen enthalten eine Art
  (`prompt.kind`) und symbolische Beschriftungen (z. B. Antriebsart `electric`); die Oberfläche
  übersetzt sie über `src/i18n/de.ts`. Namen aus den Inhalten werden direkt angezeigt.
- **Antriebsart:** immer alle drei Antworten in fester Reihenfolge (keine vierte Option möglich).
- **Karosserieform:** Antwortmöglichkeiten kommen aus `brand.json → bodyStyles`, damit auch Formen
  erscheinen, die im Level gerade nicht vorkommen. Dafür enthält `GenContext` zusätzlich die Liste
  der Karosserieformen der Marke.
- **Baureihe:** falsche Antworten sind Baureihen anderer Fahrzeuge des Levels, nach Ähnlichkeit
  des zugehörigen Fahrzeugs gewählt.
- **Leistungsvergleich:** Eine Motorisierung gehört immer zum gefragten Fahrzeug, die zweite ist
  eine andere Motorisierung desselben Fahrzeugs oder eines Fahrzeugs im Level. Verglichen wird nur
  bei mindestens 5 % Unterschied, damit Modelljahr-Schwankungen keine falschen Fragen erzeugen.
  Schwierigkeit 3 wählt den kleinsten, Schwierigkeit 1 den größten Abstand. Nach der Antwort werden
  kW/PS angezeigt. Fehlt `powerKw`, wird aus `powerPs` umgerechnet.
