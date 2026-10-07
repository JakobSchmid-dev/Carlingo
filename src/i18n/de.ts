/**
 * All visible UI texts. Components never contain German strings directly.
 * A second language would be a second file of type `Messages`.
 */
import type { FeatureArea, Fuel, ImageView, Powertrain } from '../content/schema.ts';
import type { PromptKind } from '../engine/types.ts';
import type { LevelState } from '../engine/progress.ts';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const de = {
  app: {
    name: 'Carlingo',
    tagline: 'Automodelle erkennen und einordnen',
    loading: 'Lädt …',
  },
  nav: {
    label: 'Hauptnavigation',
    learn: 'Lernen',
    collection: 'Sammlung',
    settings: 'Einstellungen',
  },
  common: {
    back: 'Zurück',
    cancel: 'Abbrechen',
    close: 'Schließen',
    notRecorded: 'Noch nicht erfasst',
    unverified: 'Ungeprüft',
    unverifiedHint: 'Entwicklungsmodus: Diese Angaben sind noch nicht von einem Menschen geprüft.',
    unverifiedBanner: (n: number) =>
      `Entwicklungsmodus: ${plural(n, 'Fahrzeug ist', 'Fahrzeuge sind')} noch ungeprüft (verified: false).`,
  },
  contentError: {
    title: 'Die Inhalte enthalten Fehler',
    text: 'Bitte "npm run validate" ausführen und die genannten Stellen korrigieren.',
    empty: 'Es wurden keine Inhalte gefunden.',
  },
  stats: {
    streak: (n: number) => `${plural(n, 'Tag', 'Tage')} Serie`,
    streakLabel: 'Tagesserie',
    xp: (n: number) => `${n} XP`,
    xpLabel: 'Erfahrungspunkte',
  },
  path: {
    title: 'Lernpfad',
    track: 'Sparte',
    state: {
      locked: 'Gesperrt',
      open: 'Offen',
      mastered: 'Gemeistert',
    } satisfies Record<LevelState, string>,
    learned: (learned: number, total: number) => `${learned} von ${total} gelernt`,
    lockedUntil: (titles: string[]) => `Erst ${titles.join(' und ')} meistern`,
    needsProfiles: 'Fragen erscheinen, sobald ein Steckbrief freigeschaltet ist.',
    start: (title: string) => `${title} starten`,
  },
  session: {
    abort: 'Einheit abbrechen',
    abortTitle: 'Einheit abbrechen?',
    abortText: 'Die Antworten dieser Einheit werden nicht gespeichert.',
    abortConfirm: 'Ja, abbrechen',
    abortKeep: 'Weiterlernen',
    progress: (current: number, total: number) => `Frage ${current} von ${total}`,
    retry: 'Wiederholung',
    answers: 'Antworten',
    optionCorrect: 'Richtig',
    optionChosen: 'Deine Antwort',
    correct: 'Richtig!',
    wrong: 'Leider falsch',
    solution: 'Richtige Antwort:',
    feature: 'Erkennungsmerkmal:',
    next: 'Weiter',
    finish: 'Zum Ergebnis',
    emptyTitle: 'Gerade nichts zu üben',
    emptyText:
      'In diesem Level gibt es noch keine Fragen. Wissensfragen erscheinen, sobald du die Steckbriefe der Fahrzeuge freigeschaltet hast.',
    notFound: 'Dieses Level gibt es nicht.',
    toPath: 'Zum Lernpfad',
  },
  prompt: {
    'image-to-name': () => 'Welches Modell ist das?',
    'name-to-image': (name: string) => `Welches Bild zeigt: ${name}?`,
    'detail-to-name': () => 'Zu welchem Modell gehört dieses Detail?',
    powertrain: () => 'Welchen Antrieb hat dieses Modell?',
    'body-style': () => 'Welche Karosserieform ist das?',
    'model-code': (name: string) => `Welche Baureihe hat: ${name}?`,
    'power-compare': (name: string) => `${name}: Welche Motorisierung hat mehr Leistung?`,
  } satisfies Record<PromptKind, (subject: string) => string>,
  image: {
    question: (view: string) => `Gesuchtes Fahrzeug, Ansicht: ${view}`,
    detail: (view: string) => `Ausschnitt eines Fahrzeugs, Bereich: ${view}`,
    option: (n: number, view: string) => `Antwort ${n}: Fahrzeug, Ansicht: ${view}`,
    of: (name: string, view: string) => `${name}, Ansicht: ${view}`,
    locked: 'Noch nicht freigeschaltetes Fahrzeug',
  },
  result: {
    title: 'Einheit geschafft!',
    perfect: 'Fehlerfrei – Bonus erhalten!',
    correct: (n: number, total: number) => `${n} von ${total} richtig`,
    xp: (n: number) => `+${n} XP`,
    streak: (n: number) => `${plural(n, 'Tag', 'Tage')} in Folge`,
    unlocked: 'Neue Steckbriefe',
    again: 'Noch eine Einheit',
    toPath: 'Zum Lernpfad',
  },
  collection: {
    title: 'Sammlung',
    filter: 'Nach Familie filtern',
    all: 'Alle',
    count: (unlocked: number, total: number) =>
      `${unlocked} von ${total} Steckbriefen freigeschaltet`,
    locked: 'Gesperrt',
    lockedHint: 'Erkenne dieses Modell sicher, um den Steckbrief freizuschalten.',
  },
  profile: {
    title: 'Steckbrief',
    locked:
      'Dieser Steckbrief ist noch gesperrt. Er wird freigeschaltet, sobald du das Modell sicher erkennst.',
    notFound: 'Dieses Fahrzeug gibt es nicht.',
    images: 'Bilder',
    facts: 'Eckdaten',
    series: 'Modellreihe',
    family: 'Familie',
    bodyStyle: 'Karosserie',
    powertrain: 'Antrieb',
    subBrand: 'Marke',
    modelCode: 'Baureihe',
    production: 'Bauzeit',
    since: (year: number) => `seit ${year}`,
    range: (from: number, to: number) => `${from}–${to}`,
    until: (to: number) => `bis ${to}`,
    facelift: (years: number[]) => `Modellpflege ${years.join(', ')}`,
    features: 'Merkmale',
    engines: 'Motorisierungen',
    power: (kw: number | undefined, ps: number | undefined) =>
      [kw !== undefined ? `${kw}\u00a0kW` : '', ps !== undefined ? `${ps}\u00a0PS` : '']
        .filter(Boolean)
        .join(' / '),
    funFact: 'Wusstest du schon?',
    glossary: 'Begriffe',
    toCollection: 'Zur Sammlung',
  },
  settings: {
    title: 'Einstellungen',
    appearance: 'Darstellung',
    theme: { system: 'Wie System', light: 'Hell', dark: 'Dunkel' },
    data: 'Lernstand',
    dataText:
      'Dein Lernstand ist nur auf diesem Gerät gespeichert. Mit Export und Import kannst du ihn sichern oder auf ein anderes Gerät übertragen.',
    export: 'Lernstand exportieren',
    import: 'Lernstand importieren',
    importTitle: 'Lernstand ersetzen?',
    importText: 'Der aktuelle Lernstand auf diesem Gerät wird durch die Datei ersetzt.',
    importConfirm: 'Ersetzen',
    imported: 'Lernstand importiert.',
    importFailed: (error: string) => `Import fehlgeschlagen: ${error}`,
    reset: 'Lernstand zurücksetzen',
    resetTitle: 'Wirklich alles zurücksetzen?',
    resetText:
      'Fortschritt, XP, Serie und Steckbriefe werden gelöscht. Das lässt sich nicht rückgängig machen.',
    resetConfirm: 'Zurücksetzen',
    resetDone: 'Lernstand zurückgesetzt.',
    credits: 'Bildnachweise',
    about: 'Über Carlingo',
    aboutText:
      'Ein privates Lernprojekt. Keine Werbung, kein Tracking, keine Konten. Carlingo steht in keiner Verbindung zu den gezeigten Herstellern.',
    exportFileName: (date: string) => `carlingo-lernstand-${date}.json`,
  },
  credits: {
    title: 'Bildnachweise',
    intro: 'Alle Bilder mit Quelle, Urheber und Lizenz.',
    source: 'Quelle',
    author: 'Urheber',
    license: 'Lizenz',
    file: 'Datei',
  },
  notFound: {
    title: 'Seite nicht gefunden',
  },
  powertrain: {
    combustion: 'Verbrenner',
    'plug-in-hybrid': 'Plug-in-Hybrid',
    electric: 'Elektrisch',
  } satisfies Record<Powertrain, string>,
  fuel: {
    petrol: 'Benzin',
    diesel: 'Diesel',
    electric: 'Elektro',
  } satisfies Record<Fuel, string>,
  view: {
    front: 'Front',
    rear: 'Heck',
    side: 'Seite',
    'front-three-quarter': 'Front schräg',
    'rear-three-quarter': 'Heck schräg',
    interior: 'Innenraum',
  } satisfies Record<ImageView, string>,
  area: {
    front: 'Front',
    rear: 'Heck',
    side: 'Seite',
    interior: 'Innenraum',
    general: 'Allgemein',
  } satisfies Record<FeatureArea, string>,
};

export type Messages = typeof de;
