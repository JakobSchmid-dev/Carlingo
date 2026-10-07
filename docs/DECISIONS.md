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
