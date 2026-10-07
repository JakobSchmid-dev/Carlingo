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
