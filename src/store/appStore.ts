/**
 * App state: learner progress and settings, persisted through a StorageAdapter after every change.
 * The running learning unit itself lives in the session screen; only its result comes here.
 */
import { createStore, type StoreApi } from 'zustand/vanilla';
import { emptyProgress, type LearnerProgress } from '../engine/progress.ts';
import { finishSession, type SessionResult, type SessionState } from '../engine/session.ts';
import {
  defaultSettings,
  deserialize,
  serialize,
  type SavedData,
  type Settings,
  type Theme,
} from './persistence.ts';
import type { StorageAdapter } from './storage.ts';

export interface LastResult extends SessionResult {
  trackId: string;
  levelId: string;
}

export interface AppState {
  ready: boolean;
  /** A message for the user about storage (e.g. data could not be read). */
  notice: string | null;
  progress: LearnerProgress;
  settings: Settings;
  lastResult: LastResult | null;

  hydrate(): Promise<void>;
  completeSession(session: SessionState, trackId: string, today: number): LastResult;
  setActiveTrack(trackId: string): void;
  setTheme(theme: Theme): void;
  exportData(): string;
  importData(text: string): { ok: true } | { ok: false; error: string };
  reset(): Promise<void>;
  dismissNotice(): void;
}

export type AppStore = StoreApi<AppState>;

export function createAppStore(adapter: StorageAdapter): AppStore {
  const store = createStore<AppState>()((set, get) => ({
    ready: false,
    notice: null,
    progress: emptyProgress(),
    settings: defaultSettings(),
    lastResult: null,

    async hydrate() {
      let text: string | null;
      try {
        text = await adapter.load();
      } catch {
        set({ ready: true, notice: 'Der Lernstand konnte nicht gelesen werden.' });
        return;
      }
      if (text === null) {
        set({ ready: true });
        return;
      }
      const result = deserialize(text);
      if (result.ok) {
        set({ ready: true, ...result.data });
      } else {
        set({
          ready: true,
          notice: `Der gespeicherte Lernstand konnte nicht geladen werden (${result.error}) und wurde neu begonnen.`,
        });
      }
    },

    completeSession(session, trackId, today) {
      const { progress, result } = finishSession(session, get().progress, today);
      const lastResult = { ...result, trackId, levelId: session.levelId };
      set({ progress, lastResult });
      return lastResult;
    },

    setActiveTrack(trackId) {
      set({ settings: { ...get().settings, activeTrackId: trackId } });
    },

    setTheme(theme) {
      set({ settings: { ...get().settings, theme } });
    },

    exportData() {
      const { progress, settings } = get();
      return serialize({ progress, settings });
    },

    importData(text) {
      const result = deserialize(text);
      if (!result.ok) return result;
      set({ ...result.data, lastResult: null });
      return { ok: true };
    },

    async reset() {
      await adapter.clear();
      set({ progress: emptyProgress(), settings: defaultSettings(), lastResult: null });
    },

    dismissNotice() {
      set({ notice: null });
    },
  }));

  // Persist progress and settings after every change (only once loaded, never the initial state).
  store.subscribe((state, prev) => {
    if (!state.ready || !prev.ready) return;
    if (state.progress === prev.progress && state.settings === prev.settings) return;
    const data: SavedData = { progress: state.progress, settings: state.settings };
    adapter.save(serialize(data)).catch(() => {
      store.setState({
        notice:
          'Der Lernstand konnte nicht gespeichert werden. Ist der Speicher des Browsers voll?',
      });
    });
  });

  return store;
}
