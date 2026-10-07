/**
 * Tunable numbers of the learning engine in one place.
 */

/** Weights for the similarity of two vehicles (used to choose wrong answers). */
export const SIMILARITY_WEIGHTS = {
  family: 1,
  bodyStyle: 1,
  series: 2,
  subBrand: 1,
  similarTo: 3,
} as const;

/** Number of answer options for "pick one of four" questions. */
export const OPTION_COUNT = 4;

/** Two engines are only compared if their power differs by at least this share. */
export const MIN_POWER_DIFFERENCE = 0.05;

export const KW_PER_PS = 1 / 1.35962;

/** Leitner boxes: days until a fact in this box is due again. Box 1 = again in the same unit. */
export const BOX_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 } as const;
export type Box = keyof typeof BOX_INTERVAL_DAYS;
export const MAX_BOX: Box = 5;

/** From this box on a fact counts as learned (level mastery, profile unlock). */
export const LEARNED_BOX: Box = 3;
/** Share of a level's facts that must be learned for the level to count as mastered. */
export const MASTERY_SHARE = 0.8;

export const SESSION_LENGTH = 10;
export const MAX_NEW_FACTS_PER_SESSION = 4;

export const XP_PER_CORRECT = 10;
export const XP_PERFECT_BONUS = 20;

/** Skills that are only asked once the vehicle's profile ("Steckbrief") is unlocked. */
export const KNOWLEDGE_SKILLS: readonly string[] = ['model-code', 'power'];
/** The skill whose progress unlocks a vehicle's profile. */
export const PROFILE_SKILL = 'recognize';
