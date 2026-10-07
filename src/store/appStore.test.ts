import { describe, expect, it } from 'vitest';
import { sampleVehicles } from '../../tests/fixtures.ts';
import { generators } from '../engine/generators/index.ts';
import {
  answerCurrent,
  currentItem,
  isFinished,
  planSession,
  type SessionInput,
} from '../engine/session.ts';
import { emptyProgress } from '../engine/progress.ts';
import { createAppStore } from './appStore.ts';
import { deserialize, serialize } from './persistence.ts';
import { memoryAdapter } from './storage.ts';

const TODAY = 20000;
const flush = () => new Promise((r) => setTimeout(r, 0));

function playPerfectSession() {
  const input: SessionInput = {
    level: {
      id: 'l',
      title: 'L',
      filter: {},
      generators: ['image-to-name'],
      difficulty: 1,
      unlockAfter: [],
    },
    pool: sampleVehicles(),
    generators,
    bodyStyles: [],
    progress: emptyProgress(),
    today: TODAY,
    seed: 's',
  };
  let s = planSession(input);
  while (!isFinished(s)) s = answerCurrent(s, currentItem(s)!.question.correctOptionId, input);
  return s;
}

describe('app store', () => {
  it('starts empty when nothing is saved', async () => {
    const store = createAppStore(memoryAdapter());
    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({
      ready: true,
      notice: null,
      progress: emptyProgress(),
    });
  });

  it('saves after a completed unit and restores it after a restart', async () => {
    const adapter = memoryAdapter();
    const store = createAppStore(adapter);
    await store.getState().hydrate();
    const result = store.getState().completeSession(playPerfectSession(), 't/current', TODAY);
    await flush();
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(adapter.data).not.toBeNull();

    const restarted = createAppStore(adapter);
    await restarted.getState().hydrate();
    expect(restarted.getState().progress).toEqual(store.getState().progress);
  });

  it('does not overwrite saved data before it was loaded', async () => {
    const saved = serialize({
      progress: { ...emptyProgress(), xp: 50 },
      settings: { activeTrackId: null, theme: 'system' },
    });
    const adapter = memoryAdapter(saved);
    const store = createAppStore(adapter);
    store.getState().setTheme('dark'); // before hydrate
    await flush();
    expect(adapter.data).toBe(saved);
    await store.getState().hydrate();
    expect(store.getState().progress.xp).toBe(50);
  });

  it('starts over with a notice when saved data is damaged', async () => {
    const store = createAppStore(memoryAdapter('{"app":"carlingo","version":1}'));
    await store.getState().hydrate();
    expect(store.getState().progress).toEqual(emptyProgress());
    expect(store.getState().notice).toContain('konnte nicht geladen werden');
  });

  it('exports and imports the learning state', async () => {
    const a = createAppStore(memoryAdapter());
    await a.getState().hydrate();
    a.getState().completeSession(playPerfectSession(), 't/current', TODAY);
    const exported = a.getState().exportData();
    expect(deserialize(exported).ok).toBe(true);

    const b = createAppStore(memoryAdapter());
    await b.getState().hydrate();
    expect(b.getState().importData(exported)).toEqual({ ok: true });
    expect(b.getState().progress).toEqual(a.getState().progress);
    expect(b.getState().importData('kaputt')).toEqual({
      ok: false,
      error: 'Die Datei ist keine gültige JSON-Datei.',
    });
  });

  it('resets everything', async () => {
    const adapter = memoryAdapter();
    const store = createAppStore(adapter);
    await store.getState().hydrate();
    store.getState().completeSession(playPerfectSession(), 't/current', TODAY);
    await store.getState().reset();
    await flush();
    expect(store.getState().progress).toEqual(emptyProgress());
    const restarted = createAppStore(adapter);
    await restarted.getState().hydrate();
    expect(restarted.getState().progress).toEqual(emptyProgress());
  });
});
