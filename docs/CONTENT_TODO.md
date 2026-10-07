# Offene Inhalte

Was ein Mensch prüfen und ergänzen muss, bevor die Beispieldaten als geprüft gelten.

## So wurden die Beispieldaten erstellt

- **Technische Angaben** (Stand Oktober 2026): Abgleich zwischen den Modellseiten von
  [mb-wallpaper.de](https://www.mb-wallpaper.de/fahrzeuge-modelle-all.php) (Tabellen mit Bauzeit,
  Motoren, kW/PS) und einer Websuche (u. a. technische Datenblätter auf angurten.de). Eingetragen
  wurde nur, was übereinstimmte oder eindeutig war. Die Quellen stehen pro Fahrzeug im Feld
  `dataSources`.
- **Bilder:** Fotos von Wikimedia Commons mit freier Lizenz (CC0, CC BY, CC BY-SA), auf 4:3
  zugeschnitten. Urheber, Lizenz und Link stehen bei jedem Bild in `vehicles.json` und in der App
  unter „Bildnachweise“.
- **Alle Einträge tragen `"verified": false`.** Nach der Prüfung eines Fahrzeugs
  `"verified": true` setzen.

## Für alle Fahrzeuge

- [ ] **Bilder prüfen:** Zeigt jedes Foto wirklich das genannte Modell und die richtige
      Generation? Ist das Detailbild (Rückleuchte bzw. Kühlergrill) gut erkennbar?
- [ ] **Leistungsangaben** gegen offizielle Datenblätter prüfen. Eingetragen ist die
      Verbrennerleistung ohne den 48-Volt-Boost (ISG). Werte ändern sich teils zwischen
      Modelljahren.
- [ ] **Erkennungsmerkmale** (`features`) ergänzen, vor allem für Seite und Innenraum. Sie
      erscheinen nach jeder Antwort als Lernhinweis.
- [ ] **Facelifts 2026 prüfen:** Für C-Klasse und GLE wurden Modellpflegen angekündigt;
      mb-wallpaper.de führt noch keine. `production.faceliftYears` ergänzen.

## Pro Fahrzeug

| Fahrzeug                | Offen                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `c-class-saloon-w206`   | Facelift-Jahr prüfen                                                                                                                                                                                                                                   |
| `c-class-estate-s206`   | Eigene Merkmale für Heck und Seite. Hinweis: mb-wallpaper.de schreibt beim T-Modell „W206“; andere Quellen und Commons nennen „S206“ (eingetragen).                                                                                                    |
| `e-class-saloon-w214`   | Merkmal Seite                                                                                                                                                                                                                                          |
| `glc-suv-x254`          | Merkmal Front stammt aus nur einer Quelle; Merkmal Heck fehlt; Facelift prüfen                                                                                                                                                                         |
| `glc-suv-electric-x540` | Bauzeit „ab 2026“ laut mb-wallpaper.de (Verkauf ab 05/2026), Vorstellung IAA 2025                                                                                                                                                                      |
| `gle-suv-v167`          | **Keine Merkmale.** Die Fotos (2021) zeigen den GLE vor dem Facelift 2023. Leistungswerte stammen aus den Datenblättern nach dem Facelift 2023; mb-wallpaper.de nennt noch die Werte vor dem Facelift (z. B. GLE 450 4MATIC 270 statt 280 kW). Prüfen. |
| `g-class-suv`           | Merkmale fehlen; G 580 mit EQ Technologie als eigener Eintrag (elektrisch); AMG G 63 als eigener Eintrag (Mercedes-AMG)                                                                                                                                |
| `amg-sl-r232`           | SL 43 seit 05/2024 mit 310 kW (421 PS), vorher 280 kW (381 PS) – eingetragen ist der aktuelle Wert; SL 63 S E Performance ergänzen                                                                                                                     |

## Fehlende Inhalte für den Ausbau

- [ ] Weitere Modelle des aktuellen Programms (A-Klasse, CLA, GLA, GLB, CLE, S-Klasse, EQS, Vans,
      Maybach) – der vollständige Datensatz ist nicht Teil von v1 (`SPEC.md`, Abschnitt 13).
- [ ] Plug-in-Hybrid-Varianten als eigene Einträge, sobald ihre Merkmale belegt sind.
- [ ] **Sparte „Klassiker“:** mb-wallpaper.de listet alle Baureihen seit 1950 (z. B. W123, W124,
      W201, R107, W113 „Pagode“, W198 „Flügeltürer“) – gute Grundlage für `levels/historic.json`.
