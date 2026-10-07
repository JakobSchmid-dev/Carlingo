/**
 * React access to content and app store. Both are injected through context, so component tests
 * can use fixture content and an in-memory store.
 */
import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { LoadedContent } from '../content/load.ts';
import type { ContentPackage, Track } from '../content/model.ts';
import { dayNumber } from '../engine/srs.ts';
import type { AppState, AppStore } from '../store/appStore.ts';

export const ContentContext = createContext<LoadedContent | null>(null);
export const StoreContext = createContext<AppStore | null>(null);

export function useContent(): LoadedContent {
  const content = useContext(ContentContext);
  if (!content) throw new Error('ContentContext fehlt');
  return content;
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreContext fehlt');
  return useStore(store, selector);
}

export function usePackage(brandId: string | undefined): ContentPackage | undefined {
  return useContent().packages.find((p) => p.brand.id === brandId);
}

export interface TrackRef {
  pkg: ContentPackage;
  track: Track;
}

export function useTracks(): TrackRef[] {
  return useContent().packages.flatMap((pkg) => pkg.tracks.map((track) => ({ pkg, track })));
}

/** The track selected in the settings, or the first one. */
export function useActiveTrack(): TrackRef | undefined {
  const tracks = useTracks();
  const activeId = useAppStore((s) => s.settings.activeTrackId);
  return tracks.find((t) => t.track.id === activeId) ?? tracks[0];
}

/** Today as a day number. Read on render; a unit spanning midnight counts for the start day. */
export function today(): number {
  return dayNumber(new Date());
}
