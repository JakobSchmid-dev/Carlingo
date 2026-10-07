# Ideen für später

Sinnvolles, das über den Umfang von v1 hinausgeht. Bewusst nicht umgesetzt.

## Technik

- **Bilder bei großem Datenbestand nicht mehr alle vorab cachen.** v1 legt alle Bilder beim
  ersten Besuch in den Offline-Speicher, damit jede Einheit offline funktioniert. Bei hunderten
  echten Fotos wird das zu groß. Dann: Bilder per Laufzeit-Cache („cache first“) und gezielt die
  Bilder der nächsten Levels vorladen. Außerdem Bilder beim Build automatisch verkleinern
  (z. B. auf 1200 px Breite, WebP).
- **Update-Hinweis:** Die App aktualisiert sich derzeit still beim nächsten Start. Ein kleiner
  Hinweis „Neue Inhalte verfügbar – neu laden“ wäre freundlicher.
- **Lernstand zwischen Geräten:** Der Storage-Adapter ist dafür vorbereitet. Kostenlos und ohne
  eigenes Backend ginge z. B. ein Export in eine Datei in der eigenen Cloud.

## Lernen

- **Fragetyp „Detail zu Detail“** (z. B. Rückleuchte zeigen, Frontansicht wählen).
- **Fragetyp „Bauzeit einordnen“** („Neuer oder älter als …?“) für die historische Sparte.
- **Übungsmodus „Schwächste Fakten“** quer über alle Levels.
- **Ähnlichkeit lernen:** Falsch verwechselte Paare automatisch häufiger gegeneinander abfragen.
