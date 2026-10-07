import { describe, expect, it } from 'vitest';
import { sampleVehicles } from '../../tests/fixtures.ts';
import type { Track } from '../content/model.ts';
import type { Level } from '../content/schema.ts';
import { generators } from './generators/index.ts';
import {
  currentStreak,
  emptyProgress,
  factKey,
  isAskable,
  levelFacts,
  mastery,
  profilesToUnlock,
  trackOverview,
  updateStreak,
  type LearnerProgress,
} from './progress.ts';
import type { FactState } from './srs.ts';

const pool = sampleVehicles();
const level = (overrides: Partial<Level> = {}): Level => ({
  id: 'l',
  title: 'L',
  filter: {},
  generators: ['image-to-name', 'name-to-image', 'model-code'],
  difficulty: 1,
  unlockAfter: [],
  ...overrides,
});
const learned: FactState = { box: 3, due: 99999, seen: 3, correct: 3, lastSeen: 1 };
const withFacts = (keys: string[], extra: Partial<LearnerProgress> = {}): LearnerProgress => ({
  ...emptyProgress(),
  facts: Object.fromEntries(keys.map((k) => [k, learned])),
  ...extra,
});

describe('levelFacts', () => {
  it('creates one fact per vehicle and skill; generators of the same skill share a fact', () => {
    const facts = levelFacts(level(), pool, generators);
    const alpha = facts.filter((f) => f.vehicleId === 'alpha-saloon');
    expect(alpha.map((f) => f.skill).sort()).toEqual(['model-code', 'recognize']);
    expect(alpha.find((f) => f.skill === 'recognize')?.generatorIds).toEqual([
      'image-to-name',
      'name-to-image',
    ]);
  });

  it('skips facts whose generator cannot ask about the vehicle', () => {
    const facts = levelFacts(level({ generators: ['power-compare'] }), pool, generators);
    expect(facts.map((f) => f.vehicleId)).not.toContain('gamma-suv'); // no engines
  });
});

describe('knowledge facts', () => {
  const [fact] = levelFacts(level({ generators: ['model-code'] }), pool, generators);

  it('are only askable after the profile is unlocked', () => {
    expect(isAskable(fact!, emptyProgress())).toBe(false);
    expect(isAskable(fact!, { ...emptyProgress(), unlockedProfiles: [fact!.vehicleId] })).toBe(
      true,
    );
  });
});

describe('mastery', () => {
  it('needs 80 % of the facts in box 3 or higher', () => {
    const facts = levelFacts(level({ generators: ['image-to-name'] }), pool, generators);
    expect(facts).toHaveLength(6);
    const keys = facts.map((f) => f.key);
    expect(mastery(facts, withFacts(keys.slice(0, 4))).mastered).toBe(false); // 67 %
    expect(mastery(facts, withFacts(keys.slice(0, 5))).mastered).toBe(true); // 83 %
  });

  it('a level without facts is never mastered', () => {
    expect(mastery([], emptyProgress()).mastered).toBe(false);
  });
});

describe('profilesToUnlock', () => {
  it('unlocks profiles whose recognize fact reached box 3', () => {
    const p = withFacts([
      factKey('alpha-saloon', 'recognize'),
      factKey('beta-saloon', 'model-code'),
    ]);
    expect(profilesToUnlock(p)).toEqual(['alpha-saloon']);
    expect(profilesToUnlock({ ...p, unlockedProfiles: ['alpha-saloon'] })).toEqual([]);
  });
});

describe('trackOverview', () => {
  const track: Track = {
    id: 't/current',
    brandId: 't',
    collection: 'current',
    title: 'T',
    file: 'x',
    levels: [
      level({ id: 'a', generators: ['image-to-name'] }),
      level({ id: 'b', generators: ['detail-to-name'], unlockAfter: ['a'] }),
    ],
  };

  it('locks levels until their prerequisites are mastered', () => {
    const [a, b] = trackOverview(track, pool, generators, emptyProgress());
    expect(a?.state).toBe('open');
    expect(b?.state).toBe('locked');
  });

  it('opens a level once all prerequisites are mastered', () => {
    const keys = pool.map((v) => factKey(v.id, 'recognize'));
    const [a, b] = trackOverview(track, pool, generators, withFacts(keys));
    expect(a?.state).toBe('mastered');
    expect(b?.state).toBe('open');
  });

  it('ignores facts of vehicles that no longer exist', () => {
    const p = withFacts(['removed-car|recognize']);
    const [a] = trackOverview(track, pool, generators, p);
    expect(a?.mastery.learned).toBe(0);
  });
});

describe('streak', () => {
  const T = 1000;
  it('counts consecutive days', () => {
    let s = updateStreak({ current: 0, best: 0, lastDay: null }, T);
    expect(s.current).toBe(1);
    s = updateStreak(s, T); // same day again
    expect(s.current).toBe(1);
    s = updateStreak(s, T + 1);
    expect(s).toEqual({ current: 2, best: 2, lastDay: T + 1 });
  });

  it('restarts after a missed day and keeps the best', () => {
    const s = updateStreak({ current: 5, best: 5, lastDay: T }, T + 2);
    expect(s).toEqual({ current: 1, best: 5, lastDay: T + 2 });
  });

  it('shows 0 when the streak is broken', () => {
    const s = { current: 3, best: 3, lastDay: T };
    expect(currentStreak(s, T + 1)).toBe(3);
    expect(currentStreak(s, T + 2)).toBe(0);
  });
});
