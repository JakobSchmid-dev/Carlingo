# Abnahme v1 (SPEC.md, Abschnitt 16)

Geprüft am 7. Oktober 2026 auf dem Branch `claude/carlingo-scaffold-qqo4a2`, Browser: Chromium
(Playwright) mit 360 × 740 px, Touch, Pixeldichte 2.

| Nr. | Kriterium                                                    | Ergebnis | Wie geprüft                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `npm install && npm run dev` startet die App                 | ✅       | Frischer `git clone`, `npm install` (0 Schwachstellen), `npm run dev`; Seite liefert 200, im Browser erscheint der Lernpfad mit allen Levels, keine Fehler in der Konsole.                                                                                                       |
| 2   | `npm run check` läuft fehlerfrei                             | ✅       | Typprüfung (App + DOM-freie Engine), ESLint, Prettier, Inhaltsprüfung, 164 Tests grün; ebenso in GitHub Actions bei jedem Push.                                                                                                                                                  |
| 3   | Einheit auf dem Handy spielbar, auch offline                 | ✅       | Build unter `/Carlingo/` ausgeliefert (wie GitHub Pages). Erster Besuch → Service Worker aktiv; dann Netzwerk aus, neu geladen, komplette Einheit bis zum Ergebnis gespielt; 0 fehlende Bilder.                                                                                  |
| 4   | Installierbar auf dem Homescreen                             | ✅       | Chrome DevTools Protocol: `Page.getAppManifest` ohne Fehler, `Page.getInstallabilityErrors` leer. Manifest mit Name, Icons 192/512 (+ maskable), `standalone`.                                                                                                                   |
| 5   | Lernstand überlebt Neuladen und Neustart                     | ✅       | Nach der Offline-Einheit Browser vollständig beendet und mit demselben Profil (weiterhin offline) neu gestartet: XP und Fortschritt identisch. Zusätzlich Store-Tests für Neustart.                                                                                              |
| 6   | Neues Fahrzeug + Bild erscheint ohne Codeänderung            | ✅       | G-Klasse in `vehicles.json` eingetragen, `npm run placeholders`, `npm run validate`. Im Browser: G-Klasse erscheint in einer Frage der ersten Einheit und als 8. Karte in der Sammlung. Commit enthält nur `content/` und `docs/`.                                               |
| 7   | Neues Level erscheint ohne Codeänderung                      | ✅       | Level „SUVs unterscheiden“ in `levels/current.json` ergänzt; erscheint im Lernpfad (gesperrt bis „Modellreihen erkennen“ gemeistert). Der Plausibilitätstest erzeugt automatisch auch dafür komplette Einheiten.                                                                 |
| 8   | Kaputter Eintrag → `npm run validate` scheitert verständlich | ✅       | Ungültiger Antrieb, fehlendes Komma, Tippfehler in `unlockAfter`, gelöschte Bilddatei, fehlende Lizenz + falsche PS + ungültige Familie: jeweils Exit-Code 1 mit Datei, Fahrzeug/Level und Feld auf Deutsch. `npm run build` bricht ebenfalls ab.                                |
| 9   | Zweites Inhaltspaket nach Anleitung, ohne `src/engine`       | ✅       | In einem separaten Klon nach `CONTENT_GUIDE.md` Abschnitt 6 eine fiktive Marke angelegt (4 Fahrzeuge, 2 Levels). `git status`: nur `content/beispielmarke/`. Validierung grün, die Sparte erscheint in der Auswahl, eine Einheit startet. (Nicht eingecheckt, da fiktive Daten.) |

Beispielausgabe zu Kriterium 8:

```
✗ Fehler: content/mercedes/vehicles.json · Fahrzeug "glc-suv-x254" · Feld "images[0].license": fehlt, ist aber ein Pflichtfeld
✗ Fehler: content/mercedes/vehicles.json · Fahrzeug "gle-suv-v167" · Feld "family": muss eine ID aus Kleinbuchstaben, Ziffern und Bindestrichen sein (z. B. "glc-suv-x254")
✗ Fehler: content/mercedes/vehicles.json · Fahrzeug "c-class-estate-s206" · Feld "engines[0].powerPs": 147 kW entsprechen etwa 200 PS, eingetragen sind 300 PS. Tippfehler?
Inhalte ungültig: 3 Fehler. Bitte die genannten Stellen korrigieren und erneut "npm run validate" ausführen.
```

Bei der Abnahme gefunden und behoben: Ein Schemafehler in einem Fahrzeug hatte die übrigen
Prüfungen (Verweise, Bilder, kW/PS) für alle anderen Fahrzeuge übersprungen.

Nicht automatisiert prüfbar und daher offen für einen Test auf einem echten Handy: Installation
über „Zum Home-Bildschirm“ in Safari (iOS) bzw. Chrome (Android).
