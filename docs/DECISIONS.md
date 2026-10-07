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

## Lernlogik und Speicherung

- **Tage statt Uhrzeiten:** Fälligkeiten zählen in ganzen lokalen Kalendertagen. „1 Tag“ heißt
  „ab morgen“, egal zu welcher Uhrzeit heute gelernt wurde.
- **Nur die erste Antwort pro Fakt und Einheit verschiebt die Karte.** Wiederholungen in derselben
  Einheit (nach Fehlern oder zum Auffüllen) sind Übung. Neue Fakten starten gedanklich in Fach 1:
  richtig → Fach 2, falsch → Fach 1.
- **Kein Vorrücken vor der Fälligkeit.** Wird ein noch nicht fälliger Fakt zum Auffüllen gefragt
  und richtig beantwortet, bleibt er im Fach (sonst ließe sich der Karteikasten „durchpauken“).
  Falsch beantwortet fällt er trotzdem in Fach 1.
- **Weniger als 10 verschiedene Fakten:** Die Einheit wiederholt die ausgewählten Fakten reihum
  (mit wechselndem Fragetyp), bis 10 Fragen erreicht sind. Bei nur einem Fakt besteht die Einheit
  aus einer Frage, weil derselbe Fakt nie zweimal direkt hintereinander kommen darf.
- **Wiederholung falscher Antworten:** genau einmal am Ende. Würde sie direkt auf denselben Fakt
  folgen, kommt vorher eine Frage zu einem anderen Fakt der Einheit.
- **XP:** 10 pro richtiger Antwort (auch bei der Wiederholung), 20 Bonus, wenn alle Antworten
  der Einheit richtig waren. Werte in `src/engine/config.ts`.
- **Steckbriefe bleiben freigeschaltet**, auch wenn der Fakt „erkennen“ später wieder in Fach 1
  fällt. Die Liste der freigeschalteten Steckbriefe wird gespeichert.
- **Meisterung zählt alle Fakten eines Levels**, auch Wissensfakten, die noch gesperrt sind.
- **Wissens-Level vor dem ersten Steckbrief:** Die Einheit ist leer; die Oberfläche erklärt, dass
  erst Steckbriefe freigeschaltet werden müssen.
- **Speicherformat:** ein JSON-Text mit `app`, `version`, `savedAt`, `progress`, `settings`.
  Derselbe Text ist die Exportdatei. Migrationen sind als Funktionen „Version n → n + 1“
  vorgesehen. Beschädigte Daten führen zu einem Neustart mit Hinweis statt zu einem Absturz.
- **Storage-Adapter ist asynchron** (`load`, `save`, `clear`), damit ein späteres Server-Backend
  dieselbe Schnittstelle erfüllen kann. Die App bittet den Browser zusätzlich um dauerhaften
  Speicher (`navigator.storage.persist`).
- **Zustand ohne `persist`-Middleware:** Der Store speichert nach jeder Änderung selbst über den
  Adapter, erst nachdem der gespeicherte Stand geladen ist. So kann ein Zwischenzustand nie
  gespeicherte Daten überschreiben.

## Oberfläche

- **Inhalte und Store per React-Kontext.** So laufen Komponententests mit erfundenen Testdaten und
  einem Speicher im Arbeitsspeicher, ohne die echten Inhalte oder `localStorage`.
- **Lerneinheit als Vollbild ohne Navigation**, alle anderen Bildschirme mit Navigationsleiste
  unten (Lernen, Sammlung, Einstellungen) – mit einer Hand erreichbar.
- **Antworten auch per Tastatur:** Ziffern 1–4 wählen, danach liegt der Fokus auf „Weiter“.
- **Fortschrittsanzeige zählt Wiederholungen mit** („Frage 11 von 12 · Wiederholung“), damit
  sichtbar ist, warum die Einheit länger wird.
- **Gesperrte Fahrzeuge in der Sammlung** werden stark weichgezeichnet und entsättigt statt als
  echte Silhouette dargestellt. Eine Silhouette per CSS-Filter funktioniert nur bei freigestellten
  Bildern; echte Fotos haben einen Hintergrund. Der Name bleibt verborgen.
- **Steckbriefe gesperrter Fahrzeuge** sind nicht verlinkt; direkt aufgerufen zeigen sie einen
  Hinweis statt der Daten.
- **Begriffe im Steckbrief:** Glossar-Einträge aus `brand.json` erscheinen automatisch, wenn der
  Begriff in Motorbezeichnungen, Merkmalen oder im Namen vorkommt (z. B. „4MATIC“).
- **Hinweis „Ungeprüft“** (nur im Entwicklungsmodus): Banner auf dem Lernpfad mit der Anzahl
  ungeprüfter Fahrzeuge, Abzeichen in Rückmeldung, Sammlung und Steckbrief.
- **Bildnachweise** zeigen Dateinamen, die die Fahrzeug-ID enthalten. Das verrät gesperrte
  Fahrzeuge, ist aber als vollständige Quellenangabe gewollt.
- **Darstellung:** Wahl zwischen „Wie System“, „Hell“ und „Dunkel“; gespeichert mit dem Lernstand.
- **Bilder werden nie inline eingebettet** (`assetsInlineLimit: 0`), damit Lazy Loading wirkt und
  das JavaScript klein bleibt.
- **Inhaltsfehler im Entwicklungsmodus:** Ist ein Paket ungültig, zeigt die App statt des
  Lernpfads die Fehlerliste (gleiche Meldungen wie `npm run validate`). Im Build kann das nicht
  vorkommen, weil der Build vorher validiert.

## PWA und Deployment

- **App-Icon:** schlichte Fahrzeug-Silhouette auf Blau (`public/icons/icon.svg`), als PNG in
  192, 512 und 180 px (Apple) gerendert. Kein Herstellerzeichen. Dasselbe 512er-Bild dient als
  „maskable“-Icon; die Silhouette liegt in der sicheren Zone.
- **Offline:** Der Service Worker (vite-plugin-pwa, `autoUpdate`) legt App und alle Bilder beim
  ersten Besuch ab. Neue Versionen werden beim nächsten Start still übernommen.
- **CI deployt nur `main`**, wie in der Spezifikation. Andere Branches werden geprüft und gebaut,
  aber nicht veröffentlicht.

## Sonstiges

- **Reihenfolge der Sparten:** alphabetisch nach Markenname. Die gewählte Sparte wird gespeichert;
  ohne Auswahl ist die erste Sparte aktiv.
- **Abnahme-Testfälle als echte Inhalte:** Die G-Klasse (nur Pflichtangaben) und das Level
  „SUVs unterscheiden“ aus der Abnahme bleiben im Paket; damit sind es 8 Beispielfahrzeuge.

## Echte Bilder und Daten (Nachtrag)

- **Fahrzeugdaten von mb-wallpaper.de** (auf Wunsch der Nutzerin), abgeglichen mit den bisherigen
  Quellen. Bei Widersprüchen gilt der aktuellere bzw. mehrfach belegte Wert; Abweichungen stehen in
  `CONTENT_TODO.md`. **Bilder von mb-wallpaper.de werden nicht verwendet**, weil dafür keine Lizenz
  zur Weiterverbreitung vorliegt.
- **Bilder von Wikimedia Commons**, nur mit Lizenz CC0, Public Domain, CC BY oder CC BY-SA. Bilder
  mit „NC“ oder „ND“ sind ausgeschlossen, weil Zuschnitt und Detailausschnitt Bearbeitungen sind.
  Urheber und Lizenz werden aus den Commons-Metadaten übernommen, nicht abgetippt.
- **Bildauswahl von Hand** aus Übersichtsbögen: bevorzugt Straßenfotos aus normaler Perspektive
  (so sieht man die Autos im Alltag), möglichst Front und Heck desselben Fahrzeugs. Sondermodelle
  und Varianten mit anderem Aussehen (z. B. C-Klasse All-Terrain, AMG-Versionen bei
  Nicht-AMG-Einträgen, G 580 mit EQ Technologie) wurden ausgelassen.
- **Bildformat:** 1200 × 900 JPG (Detailbilder 800 × 600), Ansicht „Front schräg“ und „Heck
  schräg“. Die Detailbilder sind Ausschnitte aus diesen Fotos (Rückleuchte bzw. Kühlergrill).
- **Abruf mit eigenem User-Agent und Pausen**, wie es die Wikimedia-Richtlinien verlangen.
