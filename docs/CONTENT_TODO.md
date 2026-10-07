# Offene Inhalte

Was ein Mensch prüfen und ergänzen muss, bevor die Beispieldaten als geprüft gelten.

## So wurden die Beispieldaten erstellt

Die technischen Angaben stammen aus einer Websuche (Oktober 2026). In der Arbeitsumgebung waren
nur Suchergebnisse lesbar, die Seiten selbst nicht. Eingetragen wurde nur, was mehrere Treffer
übereinstimmend nannten. Die Quellen stehen pro Fahrzeug im Feld `dataSources`. **Alle Einträge
tragen `"verified": false`.** Nach der Prüfung eines Fahrzeugs `"verified": true` setzen.

## Für alle Fahrzeuge

- [ ] **Echte Bilder** ersetzen die Platzhalter-SVGs (je Fahrzeug: Front schräg, Heck, ein
      Detailbild). Quelle, Urheber und Lizenz eintragen, siehe `CONTENT_GUIDE.md`.
- [ ] **Leistungsangaben** gegen offizielle Datenblätter prüfen. Mercedes ändert Leistungswerte
      teilweise zwischen Modelljahren (z. B. C 220 d: 147 kW/200 PS in einer Quelle, ältere bzw.
      neuere Stände weichen ab). Eingetragen ist die Verbrennerleistung ohne den 48-Volt-Boost.
- [ ] **Erkennungsmerkmale** (`features`) ergänzen, vor allem für die Seitenansicht und den
      Innenraum. Sie erscheinen nach jeder Antwort als Lernhinweis.
- [ ] **Facelifts 2026 prüfen:** Für mehrere Baureihen wurden Modellpflegen angekündigt
      (C-Klasse, GLE ab Mai 2026). `production.faceliftYears` ergänzen.

## Pro Fahrzeug

| Fahrzeug                | Offen                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c-class-saloon-w206`   | Benziner ergänzen; Facelift-Jahr prüfen                                                                                                                    |
| `c-class-estate-s206`   | Weitere Motoren; eigene Merkmale für Heck und Seite (bisher nur die Front wie Limousine)                                                                   |
| `e-class-saloon-w214`   | Benziner (E 200) ergänzen; Merkmal Seite                                                                                                                   |
| `glc-suv-x254`          | Merkmal Front stammt aus nur einer Quelle; Merkmal Heck fehlt; Facelift prüfen                                                                             |
| `glc-suv-electric-x540` | **Bauzeit fehlt** (Quellen nennen Vorstellung 09/2025, Produktionsstart 2025 oder 2026); Baureihe X540 nur durch eine Quelle (Mercedes-Website-URL) belegt |
| `gle-suv-v167`          | **Keine Merkmale**; Fun Fact fehlt; zweites Facelift 2026 prüfen                                                                                           |
| `amg-sl-r232`           | **Bauzeit fehlt** (Quellen widersprüchlich: 2021 oder 2022); SL 63 S E Performance ergänzen                                                                |

## Fehlende Inhalte für den Ausbau

- [ ] Weitere Modelle des aktuellen Programms (A-Klasse, CLA, GLA, GLB, S-Klasse, G-Klasse, EQS,
      Vans, Maybach) – siehe `SPEC.md`, Abschnitt 13: der vollständige Datensatz ist nicht Teil von v1.
- [ ] Plug-in-Hybrid-Varianten als eigene Einträge, sobald ihre Merkmale belegt sind.
