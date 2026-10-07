# Inhalte pflegen

Diese Anleitung erklärt Schritt für Schritt, wie neue Fahrzeuge, Bilder, Levels, Sparten und Marken
in Carlingo kommen. Dafür muss man nicht programmieren – nur JSON-Dateien bearbeiten und Bilder
ablegen. Fragen werden nie von Hand geschrieben: Die App erzeugt sie automatisch aus den Daten.

## Inhalt

1. [Grundlagen](#1-grundlagen)
2. [Ein Fahrzeug hinzufügen](#2-ein-fahrzeug-hinzufügen)
3. [Bilder hinzufügen](#3-bilder-hinzufügen)
4. [Ein Level hinzufügen](#4-ein-level-hinzufügen)
5. [Eine Sparte hinzufügen](#5-eine-sparte-hinzufügen)
6. [Eine Marke hinzufügen](#6-eine-marke-hinzufügen)
7. [Einen Fragetyp hinzufügen](#7-einen-fragetyp-hinzufügen) (braucht Programmierung)
8. [Fehlermeldungen verstehen](#8-fehlermeldungen-verstehen)
9. [Prüfen und veröffentlichen](#9-prüfen-und-veröffentlichen)

---

## 1. Grundlagen

### Wo liegt was?

```
content/
  mercedes/                 ← eine Marke = ein Ordner
    brand.json              ← Marke: Name, Familien, Karosserieformen, Submarken, Begriffe
    vehicles.json           ← alle Fahrzeuge der Marke
    levels/
      current.json          ← eine Sparte (hier: aktuelles Programm) mit ihren Levels
    images/                 ← alle Bilder der Marke
```

### Werkzeuge

- Ein Texteditor, der JSON farbig darstellt (z. B. Visual Studio Code). Er zeigt Kommafehler sofort.
- Ein Terminal im Projektordner für drei Befehle:

| Befehl                 | Was er tut                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run validate`     | Prüft alle Inhalte und erklärt Fehler auf Deutsch. **Nach jeder Änderung.**   |
| `npm run placeholders` | Erzeugt Platzhalterbilder für eingetragene, aber noch fehlende `.svg`-Bilder. |
| `npm run dev`          | Startet die App lokal (Adresse wird angezeigt, meist http://localhost:5173).  |

### JSON in 30 Sekunden

- Texte stehen in **doppelten** Anführungszeichen: `"GLC"`.
- Zahlen und `true`/`false`/`null` stehen ohne Anführungszeichen: `2022`, `false`.
- Zwischen Einträgen steht ein Komma, **nach dem letzten Eintrag nicht**.
- `[ … ]` ist eine Liste, `{ … }` ein Objekt mit Feldern.
- Feldnamen sind Englisch und genau so zu schreiben wie hier. Ein Tippfehler im Feldnamen
  (z. B. `"dispalyName"`) wird von `npm run validate` gemeldet.

### IDs

Jedes Fahrzeug, jedes Level und jede Familie hat eine **ID**: nur Kleinbuchstaben, Ziffern und
Bindestriche, z. B. `glc-suv-x254`. Die ID ändert man später nicht mehr, weil der Lernstand
daran hängt. Bewährt für Fahrzeuge: `<reihe>-<karosserie>[-<antrieb>]-<baureihe>`.

---

## 2. Ein Fahrzeug hinzufügen

Ein Eintrag steht für **genau eine erkennbare Variante**: Modellreihe + Karosserie + Antriebsart +
Generation. GLC als Verbrenner und GLC elektrisch sind zwei Einträge; C-Klasse Limousine und
T-Modell ebenfalls.

### Schritt für Schritt

1. `content/<marke>/vehicles.json` öffnen.
2. Hinter dem letzten Fahrzeug ein Komma setzen und den neuen Eintrag einfügen (Beispiel unten).
3. Bilder eintragen (Abschnitt 3). Wer noch keine Fotos hat, trägt `.svg`-Dateinamen ein und führt
   `npm run placeholders` aus.
4. `npm run validate` ausführen und Fehler beheben.
5. `npm run dev` – das Fahrzeug erscheint ohne weitere Schritte in den Fragen aller Levels, deren
   Filter es einschließt, und in der Sammlung.

### Beispiel

So sieht der GLC in `content/mercedes/vehicles.json` aus (gekürzt):

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
  "similarTo": ["gle-suv-v167", "glc-suv-electric-x540"],
  "features": [
    {
      "area": "front",
      "text": "Scheinwerfer reichen bis an den Kühlergrill heran und betonen die Breite"
    }
  ],
  "engines": [{ "name": "GLC 220 d 4MATIC", "fuel": "diesel", "powerKw": 145, "powerPs": 197 }],
  "images": [
    {
      "file": "glc-suv-x254-front-three-quarter.svg",
      "view": "front-three-quarter",
      "detail": false,
      "source": "Platzhalter, automatisch erzeugt mit npm run placeholders",
      "author": "Carlingo",
      "license": "CC0 1.0 (Platzhalter ohne Rechte Dritter)"
    }
  ],
  "dataSources": ["https://www.angurten.de/…"],
  "verified": false
}
```

### Alle Felder

| Feld          | Pflicht | Bedeutung und erlaubte Werte                                                                                                                                                 |
| ------------- | :-----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          |   ja    | Eindeutige ID (siehe oben).                                                                                                                                                  |
| `displayName` |   ja    | Name, wie er in Antworten erscheint. Muss innerhalb der Marke eindeutig sein.                                                                                                |
| `series`      |   ja    | Modellreihe, z. B. `"GLC"`. Gleiche Reihe = ähnliche Fahrzeuge.                                                                                                              |
| `family`      |   ja    | ID einer Familie aus `brand.json → families`.                                                                                                                                |
| `bodyStyle`   |   ja    | ID einer Karosserieform aus `brand.json → bodyStyles`.                                                                                                                       |
| `powertrain`  |   ja    | `"combustion"` (Verbrenner), `"plug-in-hybrid"` oder `"electric"`.                                                                                                           |
| `subBrand`    |   ja    | ID einer Submarke aus `brand.json → subBrands`.                                                                                                                              |
| `modelCode`   |  nein   | Baureihe, z. B. `"X254"`. Ohne sie gibt es keine Baureihen-Frage für dieses Fahrzeug.                                                                                        |
| `production`  |  nein   | `from` (Baubeginn), `to` (Bauende oder `null`), `faceliftYears` (Liste).                                                                                                     |
| `status`      |   ja    | `"current"`, `"phasing-out"` oder `"discontinued"`.                                                                                                                          |
| `collections` |   ja    | Sparten, zu denen das Fahrzeug gehört, z. B. `["current"]`.                                                                                                                  |
| `similarTo`   |  nein   | IDs von Fahrzeugen, mit denen es leicht verwechselt wird. Macht schwere Levels schwerer.                                                                                     |
| `features`    |  nein   | Erkennungsmerkmale. `area`: `"front"`, `"rear"`, `"side"`, `"interior"` oder `"general"`. Werden nach jeder Antwort als Lernhinweis gezeigt – passend zur gezeigten Ansicht. |
| `engines`     |  nein   | Motorisierungen mit `name`, `fuel` (`"petrol"`, `"diesel"`, `"electric"`), `powerKw`, `powerPs`. Nötig für die Leistungsfrage. Namen müssen sich unterscheiden.              |
| `funFact`     |  nein   | Ein Satz für den Steckbrief.                                                                                                                                                 |
| `images`      |   ja    | Mindestens ein Bild, davon mindestens ein Gesamtbild. Siehe Abschnitt 3.                                                                                                     |
| `dataSources` |  nein   | Quellen für die technischen Angaben (Links). Hilft bei der Prüfung.                                                                                                          |
| `verified`    |   ja    | `false`, solange ein Mensch die Angaben nicht geprüft hat; danach `true`.                                                                                                    |

**Wichtig:** Technische Angaben nie raten. Was unsicher ist, weglassen und in
`docs/CONTENT_TODO.md` notieren. Fehlende optionale Felder sind kein Fehler – die App stellt dann
für dieses Fahrzeug einfach die betroffene Frage nicht.

### Welche Angaben braucht welche Frage?

| Fragetyp         | Braucht                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `image-to-name`  | ein Gesamtbild und mindestens 3 andere, unterscheidbare Fahrzeuge im Level                                                    |
| `name-to-image`  | wie oben, die anderen Fahrzeuge brauchen ebenfalls ein Gesamtbild                                                             |
| `detail-to-name` | ein Detailbild (`"detail": true`)                                                                                             |
| `powertrain`     | ein Gesamtbild; kein optisch gleiches Fahrzeug mit anderem Antrieb im Level                                                   |
| `body-style`     | ein Gesamtbild                                                                                                                |
| `model-code`     | `modelCode` und mindestens 3 andere Baureihen im Level                                                                        |
| `power-compare`  | eine Motorisierung mit Leistung und eine zweite (eigene oder eines anderen Fahrzeugs im Level) mit mindestens 5 % Unterschied |

„Optisch gleich“ sind Einträge mit gleicher Reihe, Karosserie und Baureihe (z. B. Verbrenner und
Plug-in-Hybrid desselben Modells). Sie erscheinen nie gemeinsam als Antworten einer Bildfrage.

---

## 3. Bilder hinzufügen

### Regeln

- **Nur Bilder mit Nutzungsrecht:** eigene Fotos oder Bilder mit freier Lizenz (z. B. CC BY,
  CC BY-SA, CC0). Keine Bilder von Hersteller- oder Händlerseiten ohne Erlaubnis.
- Bilder liegen im Repository unter `content/<marke>/images/`. Nie auf fremde Seiten verlinken.
- Keine Logos oder Markenzeichen gezielt ins Bild rücken – es geht um das Fahrzeug.

### Benennung

`<fahrzeug-id>-<ansicht>[-<nummer>][-detail].<endung>` – nur Kleinbuchstaben, Ziffern und
Bindestriche, z. B. `glc-suv-x254-rear.jpg` oder `glc-suv-x254-rear-detail.jpg`.

Erlaubte Endungen: `jpg`, `jpeg`, `png`, `webp`, `avif`, `svg`.

### Größe und Format

- **Seitenverhältnis 4:3** (die App zeigt alle Bilder in 4:3 und schneidet sonst den Rand ab).
- **1200 × 900 Pixel** reichen; größer macht die App nur langsamer.
- **JPG oder WebP**, möglichst unter 300 KB pro Bild.
- Das Fahrzeug füllt das Bild; ruhiger Hintergrund hilft beim Lernen.

### Ansichten (`view`)

`"front"`, `"rear"`, `"side"`, `"front-three-quarter"` (schräg von vorn),
`"rear-three-quarter"` (schräg von hinten), `"interior"`.

**Detailbilder** (`"detail": true`) zeigen nur einen Ausschnitt, z. B. nur die Rückleuchte
(`"view": "rear"`) oder nur den Kühlergrill (`"view": "front"`). Sie werden für die Frage
„Zu welchem Modell gehört dieses Detail?“ verwendet.

### Nachweis

Jedes Bild braucht `source` (woher: Link oder „Eigenes Foto“) und `license` (z. B. `"CC BY 4.0"`);
`author` (Urheber) ist bei den meisten Lizenzen Pflicht und sollte immer ausgefüllt werden.
`licenseUrl` (optional) verlinkt den Lizenztext, z. B.
`"https://creativecommons.org/licenses/by-sa/4.0"`. Wurde das Bild bearbeitet (zugeschnitten,
Schriftzug unkenntlich gemacht), steht das in `source` – CC-Lizenzen verlangen diesen Hinweis.
Der Bildschirm „Bildnachweise“ in den Einstellungen listet alles automatisch auf; Links darin
sind anklickbar.

**Gute Quelle:** [Wikimedia Commons](https://commons.wikimedia.org) hat zu fast jeder Baureihe
eine Kategorie (z. B. „Mercedes-Benz X254“). Nur Bilder mit CC0, CC BY oder CC BY-SA verwenden,
keine mit „NC“ oder „ND“. Auf Detailbildern darf kein Schriftzug das Modell verraten (z. B.
„E 200“ auf dem Kofferraumdeckel) – wegschneiden oder unkenntlich machen.

### Platzhalter durch ein Foto ersetzen

1. Foto als z. B. `glc-suv-x254-rear.jpg` in `content/mercedes/images/` legen.
2. In `vehicles.json` beim Bild `file` von `…-rear.svg` auf `…-rear.jpg` ändern und `source`,
   `author`, `license` ausfüllen.
3. Die alte Datei `glc-suv-x254-rear.svg` löschen. (Sonst meldet `npm run validate`, dass ein Bild
   im Ordner von keinem Fahrzeug verwendet wird.)
4. `npm run validate`.

---

## 4. Ein Level hinzufügen

Levels stehen in der Datei der Sparte, z. B. `content/mercedes/levels/current.json`, in der Liste
`levels`. Die Reihenfolge der Liste ist die Reihenfolge im Lernpfad.

### Beispiel

```json
{
  "id": "suv-family",
  "title": "SUVs unterscheiden",
  "description": "GLC, GLE und Co. sicher erkennen.",
  "filter": { "family": ["suv"] },
  "generators": ["image-to-name", "name-to-image", "detail-to-name"],
  "difficulty": 3,
  "unlockAfter": ["series-basics"]
}
```

| Feld          | Pflicht | Bedeutung                                                                             |
| ------------- | :-----: | ------------------------------------------------------------------------------------- |
| `id`          |   ja    | Eindeutige ID innerhalb der Marke.                                                    |
| `title`       |   ja    | Titel im Lernpfad.                                                                    |
| `description` |  nein   | Ein Satz unter dem Titel.                                                             |
| `filter`      |  nein   | Welche Fahrzeuge der Sparte das Level nutzt. Ohne Filter: alle.                       |
| `generators`  |   ja    | Fragetypen (siehe Tabelle in Abschnitt 2).                                            |
| `difficulty`  |   ja    | `1` = falsche Antworten möglichst unähnlich, `2` = gemischt, `3` = möglichst ähnlich. |
| `unlockAfter` |  nein   | IDs von Levels derselben Sparte, die vorher gemeistert sein müssen.                   |

### Filter

Ein Filter schränkt Fahrzeugfelder auf Werte ein. Mehrere Werte in einer Liste heißen „oder“,
mehrere Felder heißen „und“:

```json
"filter": { "family": ["suv", "coupe"], "powertrain": ["electric"] }
```

= alle elektrischen SUVs und Coupés. Filterbare Felder: `id`, `displayName`, `series`, `family`,
`bodyStyle`, `powertrain`, `subBrand`, `modelCode`, `status`, `collections`.

Ein Level braucht **mindestens 4 Fahrzeuge** (eine richtige und drei falsche Antworten), und
**jeder** seiner Fragetypen muss mindestens eine Frage bilden können. `npm run validate` prüft das
und nennt das Level, wenn nicht.

### Gut zu wissen

- Ein Level gilt als **gemeistert**, wenn 80 % seiner Fakten in Fach 3 oder höher liegen.
- Fragen zu **Baureihe und Leistung** erscheinen erst, wenn der Steckbrief des Fahrzeugs
  freigeschaltet ist. Ein Level nur mit diesen Fragetypen sollte daher nach einem
  Erkennungs-Level kommen (`unlockAfter`).
- `unlockAfter` darf keine Kreise bilden (A wartet auf B, B auf A).

---

## 5. Eine Sparte hinzufügen

Eine Sparte ist ein eigener Lernpfad innerhalb einer Marke, z. B. „Aktuelles Programm“ oder
„Klassiker“.

1. Neue Datei anlegen, z. B. `content/mercedes/levels/historic.json`:

   ```json
   {
     "collection": "historic",
     "title": "Klassiker",
     "description": "Modelle, die Geschichte geschrieben haben.",
     "levels": [
       {
         "id": "historic-basics",
         "title": "Klassiker erkennen",
         "generators": ["image-to-name", "name-to-image"],
         "difficulty": 1
       }
     ]
   }
   ```

2. Die Fahrzeuge der Sparte bekommen den Namen der Sammlung in `collections`, z. B.
   `"collections": ["historic"]`. Ein Fahrzeug kann zu mehreren Sparten gehören:
   `["current", "historic"]`.
3. `npm run validate`. Die Sparte erscheint auf dem Lernpfad in der Auswahl „Sparte“.

Level-IDs müssen innerhalb der Marke eindeutig sein, auch über Sparten hinweg.

---

## 6. Eine Marke hinzufügen

1. Ordner `content/<marken-id>/` anlegen, z. B. `content/porsche/`. Der Ordnername ist die ID.
2. `brand.json` anlegen:

   ```json
   {
     "id": "porsche",
     "name": "Porsche",
     "families": [{ "id": "sports", "label": "Sportwagen" }],
     "bodyStyles": [
       { "id": "coupe", "label": "Coupé" },
       { "id": "cabriolet", "label": "Cabriolet" },
       { "id": "suv", "label": "SUV" }
     ],
     "subBrands": [{ "id": "porsche", "label": "Porsche" }],
     "glossary": []
   }
   ```

   - `families`: Gruppen für Sammlung und Filter.
   - `bodyStyles`: Karosserieformen; erscheinen als Antworten der Frage „Welche Karosserieform?“.
     Mindestens vier sind sinnvoll.
   - `subBrands`: z. B. Sportabteilungen; bei Marken ohne Submarke genau eine.
   - `glossary`: Begriffe, die im Steckbrief erklärt werden, wenn sie in Motor- oder
     Merkmalstexten vorkommen.

3. `vehicles.json` mit mindestens vier Fahrzeugen anlegen (Abschnitt 2), `images/` mit Bildern
   (Abschnitt 3) und `levels/current.json` (Abschnitt 5).
4. `npm run placeholders` (falls noch keine Fotos), dann `npm run validate`.

Die Marke erscheint automatisch in der Sparten-Auswahl. Am Programmcode ändert sich nichts.

---

## 7. Einen Fragetyp hinzufügen

Ein neuer Fragetyp ist der einzige Fall, der **Programmierung** braucht. Für Entwickler:

1. Neues Modul in `src/engine/generators/`, z. B. `production-era.ts`, das die Schnittstelle
   `QuestionGenerator` erfüllt (`id`, `skill`, `canGenerate`, `generate`). Generatoren sind reine
   Funktionen: Zufall nur über `ctx.rng`.
2. Den Generator in `src/engine/generators/index.ts` in die Liste `generatorList` eintragen.
3. Bei neuem Skill: den Skill in `src/engine/types.ts` ergänzen (und ggf. in `KNOWLEDGE_SKILLS` in
   `src/engine/config.ts`, wenn er erst nach Freischalten des Steckbriefs gefragt werden soll).
4. Den Fragetext in `src/i18n/de.ts` unter `prompt` ergänzen (TypeScript meldet, wenn er fehlt).
5. Tests in `src/engine/generators/generators.test.ts` – die gemeinsamen Regeln (richtige Antwort
   genau einmal, keine doppelten Texte, gleiche Eingabe = gleiche Frage) gelten automatisch.
6. Danach kann der neue Typ in jedem Level unter `generators` verwendet werden.

---

## 8. Fehlermeldungen verstehen

`npm run validate` nennt immer **Datei · Eintrag · Feld: Problem**. Beispiele:

```
✗ Fehler: content/mercedes/vehicles.json · Fahrzeug "glc-suv-x254" · Feld "powertrain": hat den ungültigen Wert "diesel". Erlaubt sind: "combustion", "plug-in-hybrid", "electric"
```

→ Beim GLC steht beim Antrieb ein Wert, den es nicht gibt. Diesel ist ein Kraftstoff (`fuel` bei
den Motoren), der Antrieb ist `"combustion"`.

```
✗ Fehler: content/mercedes/vehicles.json: ist kein gültiges JSON (Zeile 42, Spalte 5). Häufige Ursachen: fehlendes oder überzähliges Komma, fehlende Anführungszeichen. Technische Meldung: …
```

→ In Zeile 42 nach einem Komma- oder Anführungszeichenfehler suchen. Ein fehlendes Komma wird oft
erst in der Zeile **danach** gemeldet – also auch die Zeile davor prüfen.

```
✗ Fehler: content/mercedes/levels/current.json · Level "suv-family" · Feld "filter": Der Filter ergibt nur 3 Fahrzeug(e) ("glc-suv-x254", "glc-suv-electric-x540", "gle-suv-v167"). Für eine richtige und drei falsche Antworten braucht ein Level mindestens 4.
```

→ Filter erweitern oder weitere Fahrzeuge der Familie anlegen.

```
⚠ Hinweis: content/mercedes/vehicles.json · Fahrzeug "w124-saloon": gehört zu keiner Sparte mit Level-Datei …
```

→ Hinweise sind keine Fehler, deuten aber meist auf einen Tippfehler hin (hier in `collections`).

---

## 9. Prüfen und veröffentlichen

1. `npm run validate` – muss „Inhalte gültig.“ melden.
2. `npm run dev` – kurz in der App nachsehen. Im Entwicklungsmodus zeigt die App bei Fahrzeugen
   mit `"verified": false` den Hinweis „Ungeprüft“.
3. Geprüfte Fahrzeuge auf `"verified": true` setzen und in `docs/CONTENT_TODO.md` abhaken.
4. Änderungen committen und pushen. Die CI prüft alles erneut; erst wenn sie grün ist, wird
   `main` auf GitHub Pages veröffentlicht. Ein fehlerhaftes Paket wird nie veröffentlicht.
