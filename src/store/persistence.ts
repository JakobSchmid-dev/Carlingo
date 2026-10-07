/**
 * The saved format of the learner's data: versioned, validated with Zod, with migrations.
 * The same format is used for export and import.
 */
import { z } from 'zod';
import type { LearnerProgress } from '../engine/progress.ts';

export const CURRENT_VERSION = 1;

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  activeTrackId: string | null;
  theme: Theme;
}

export interface SavedData {
  progress: LearnerProgress;
  settings: Settings;
}

export const defaultSettings = (): Settings => ({ activeTrackId: null, theme: 'system' });

const int = z.number().int();
const factState = z.object({
  box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  due: int,
  seen: int.nonnegative(),
  correct: int.nonnegative(),
  lastSeen: int,
});

const savedSchema = z.object({
  app: z.literal('carlingo'),
  version: z.literal(CURRENT_VERSION),
  savedAt: z.string(),
  progress: z.object({
    facts: z.record(z.string(), factState),
    xp: int.nonnegative(),
    streak: z.object({
      current: int.nonnegative(),
      best: int.nonnegative(),
      lastDay: int.nullable(),
    }),
    unlockedProfiles: z.array(z.string()),
    sessionsCompleted: int.nonnegative(),
  }),
  settings: z.object({
    activeTrackId: z.string().nullable(),
    theme: z.enum(['system', 'light', 'dark']),
  }),
});

/**
 * Migrations: key n converts data of version n to version n + 1.
 * Example for a future version 2: `1: (old) => ({ ...old, version: 2, newField: … })`.
 */
export const migrations: Record<
  number,
  (data: Record<string, unknown>) => Record<string, unknown>
> = {};

export function serialize(data: SavedData, now = new Date()): string {
  return JSON.stringify({
    app: 'carlingo',
    version: CURRENT_VERSION,
    savedAt: now.toISOString(),
    ...data,
  });
}

export type DeserializeResult = { ok: true; data: SavedData } | { ok: false; error: string };

export function deserialize(
  text: string,
  migrationSteps: typeof migrations = migrations,
  currentVersion = CURRENT_VERSION,
): DeserializeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige JSON-Datei.' };
  }
  if (!raw || typeof raw !== 'object' || (raw as { app?: unknown }).app !== 'carlingo') {
    return { ok: false, error: 'Die Datei ist kein Carlingo-Lernstand.' };
  }
  let data = raw as Record<string, unknown>;
  let version = data.version;
  if (typeof version !== 'number') {
    return { ok: false, error: 'Die Datei hat keine Versionsnummer.' };
  }
  if (version > currentVersion) {
    return {
      ok: false,
      error: `Der Lernstand stammt aus einer neueren App-Version (${version}). Bitte die App aktualisieren.`,
    };
  }
  while (version < currentVersion) {
    const step = migrationSteps[version];
    if (!step) return { ok: false, error: `Version ${version} kann nicht übernommen werden.` };
    data = step(data);
    version += 1;
  }
  const parsed = savedSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: 'Der Lernstand ist unvollständig oder beschädigt.' };
  }
  return { ok: true, data: { progress: parsed.data.progress, settings: parsed.data.settings } };
}
