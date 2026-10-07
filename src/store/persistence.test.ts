import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../engine/progress.ts';
import { defaultSettings, deserialize, serialize, type SavedData } from './persistence.ts';

const sample = (): SavedData => ({
  progress: {
    ...emptyProgress(),
    xp: 120,
    facts: {
      'glc-suv-x254|recognize': { box: 3, due: 20003, seen: 4, correct: 3, lastSeen: 20000 },
      'removed-model|recognize': { box: 2, due: 20001, seen: 1, correct: 1, lastSeen: 20000 },
    },
    unlockedProfiles: ['glc-suv-x254', 'removed-model'],
  },
  settings: { activeTrackId: 'mercedes/current', theme: 'dark' },
});

describe('serialize / deserialize', () => {
  it('round-trips the data with app name and version', () => {
    const text = serialize(sample(), new Date('2026-10-07T12:00:00Z'));
    expect(JSON.parse(text)).toMatchObject({
      app: 'carlingo',
      version: 1,
      savedAt: '2026-10-07T12:00:00.000Z',
    });
    expect(deserialize(text)).toEqual({ ok: true, data: sample() });
  });

  it('keeps entries of unknown vehicles (they are ignored elsewhere, not errors)', () => {
    const result = deserialize(serialize(sample()));
    expect(result.ok && result.data.progress.facts['removed-model|recognize']).toBeTruthy();
  });

  it('rejects files that are not JSON or not from Carlingo, in German', () => {
    expect(deserialize('{kaputt')).toEqual({
      ok: false,
      error: 'Die Datei ist keine gültige JSON-Datei.',
    });
    expect(deserialize('{"foo":1}')).toEqual({
      ok: false,
      error: 'Die Datei ist kein Carlingo-Lernstand.',
    });
  });

  it('rejects damaged data', () => {
    const data = JSON.parse(serialize(sample()));
    data.progress.facts['glc-suv-x254|recognize'].box = 9;
    expect(deserialize(JSON.stringify(data))).toEqual({
      ok: false,
      error: 'Der Lernstand ist unvollständig oder beschädigt.',
    });
  });

  it('rejects data from a newer app version', () => {
    const data = { ...JSON.parse(serialize(sample())), version: 7 };
    const result = deserialize(JSON.stringify(data));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('neueren App-Version');
  });

  it('runs migrations from older versions', () => {
    // A hypothetical version 0 without settings.
    const old = { app: 'carlingo', version: 0, savedAt: 'x', progress: sample().progress };
    const result = deserialize(JSON.stringify(old), {
      0: (d) => ({ ...d, version: 1, settings: defaultSettings() }),
    });
    expect(result).toEqual({
      ok: true,
      data: { progress: sample().progress, settings: defaultSettings() },
    });
  });

  it('fails clearly when a migration is missing', () => {
    const old = { app: 'carlingo', version: 0, savedAt: 'x' };
    expect(deserialize(JSON.stringify(old))).toEqual({
      ok: false,
      error: 'Version 0 kann nicht übernommen werden.',
    });
  });
});
