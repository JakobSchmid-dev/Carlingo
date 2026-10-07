/**
 * Learner progress: facts, mastery, profile unlocks, streak and XP.
 * A fact is "vehicle + skill", e.g. "GLC X254 recognize".
 */
import type { Level, Vehicle } from '../content/schema.ts';
import { levelPool, type Track } from '../content/model.ts';
import { KNOWLEDGE_SKILLS, LEARNED_BOX, MASTERY_SHARE, PROFILE_SKILL } from './config.ts';
import type { FactState } from './srs.ts';
import type { QuestionGenerator, Skill } from './types.ts';

export type FactKey = string;

export const factKey = (vehicleId: string, skill: Skill | string): FactKey =>
  `${vehicleId}|${skill}`;

export interface Streak {
  current: number;
  best: number;
  /** Day number of the last completed unit. */
  lastDay: number | null;
}

export interface LearnerProgress {
  facts: Record<FactKey, FactState>;
  xp: number;
  streak: Streak;
  /** Vehicle ids whose profile is unlocked. Stays unlocked even if the fact drops back later. */
  unlockedProfiles: string[];
  sessionsCompleted: number;
}

export function emptyProgress(): LearnerProgress {
  return {
    facts: {},
    xp: 0,
    streak: { current: 0, best: 0, lastDay: null },
    unlockedProfiles: [],
    sessionsCompleted: 0,
  };
}

export interface Fact {
  key: FactKey;
  vehicleId: string;
  skill: Skill;
  /** Generators of the level that can ask this fact. */
  generatorIds: string[];
}

/** All facts a level can ask, including knowledge facts that are still locked. */
export function levelFacts(
  level: Level,
  pool: readonly Vehicle[],
  generators: Readonly<Record<string, QuestionGenerator>>,
): Fact[] {
  const facts = new Map<FactKey, Fact>();
  for (const vehicle of pool) {
    for (const id of level.generators) {
      const gen = generators[id];
      if (!gen?.canGenerate(vehicle, pool)) continue;
      const key = factKey(vehicle.id, gen.skill);
      const fact = facts.get(key);
      if (fact) fact.generatorIds.push(id);
      else facts.set(key, { key, vehicleId: vehicle.id, skill: gen.skill, generatorIds: [id] });
    }
  }
  return [...facts.values()];
}

export function isProfileUnlocked(progress: LearnerProgress, vehicleId: string): boolean {
  return progress.unlockedProfiles.includes(vehicleId);
}

/** Knowledge skills are only asked once the vehicle's profile is unlocked. */
export function isAskable(fact: Fact, progress: LearnerProgress): boolean {
  return !KNOWLEDGE_SKILLS.includes(fact.skill) || isProfileUnlocked(progress, fact.vehicleId);
}

export function isLearned(progress: LearnerProgress, key: FactKey): boolean {
  return (progress.facts[key]?.box ?? 0) >= LEARNED_BOX;
}

export interface Mastery {
  learned: number;
  total: number;
  share: number;
  mastered: boolean;
}

export function mastery(facts: readonly Fact[], progress: LearnerProgress): Mastery {
  const learned = facts.filter((f) => isLearned(progress, f.key)).length;
  const share = facts.length === 0 ? 0 : learned / facts.length;
  return {
    learned,
    total: facts.length,
    share,
    mastered: facts.length > 0 && share >= MASTERY_SHARE,
  };
}

/** Vehicles whose profile becomes unlocked with this progress (recognize fact learned). */
export function profilesToUnlock(progress: LearnerProgress): string[] {
  const suffix = `|${PROFILE_SKILL}`;
  return Object.keys(progress.facts)
    .filter((key) => key.endsWith(suffix) && isLearned(progress, key))
    .map((key) => key.slice(0, -suffix.length))
    .filter((id) => !progress.unlockedProfiles.includes(id));
}

export type LevelState = 'locked' | 'open' | 'mastered';

export interface LevelOverview {
  level: Level;
  pool: Vehicle[];
  facts: Fact[];
  mastery: Mastery;
  state: LevelState;
  /** Facts that can be asked right now (knowledge facts need an unlocked profile). */
  askable: number;
}

export function trackOverview(
  track: Track,
  vehicles: readonly Vehicle[],
  generators: Readonly<Record<string, QuestionGenerator>>,
  progress: LearnerProgress,
): LevelOverview[] {
  const base = track.levels.map((level) => {
    const pool = levelPool([...vehicles], track, level);
    const facts = levelFacts(level, pool, generators);
    return {
      level,
      pool,
      facts,
      mastery: mastery(facts, progress),
      askable: facts.filter((f) => isAskable(f, progress)).length,
    };
  });
  const mastered = new Set(base.filter((b) => b.mastery.mastered).map((b) => b.level.id));
  return base.map((b) => ({
    ...b,
    state: b.mastery.mastered
      ? 'mastered'
      : b.level.unlockAfter.every((id) => mastered.has(id))
        ? 'open'
        : 'locked',
  }));
}

/** The streak as shown today: 0 if the last unit was before yesterday. */
export function currentStreak(streak: Streak, today: number): number {
  if (streak.lastDay === null || streak.lastDay < today - 1) return 0;
  return streak.current;
}

export function updateStreak(streak: Streak, today: number): Streak {
  if (streak.lastDay === today) return streak;
  const current = streak.lastDay === today - 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastDay: today };
}
