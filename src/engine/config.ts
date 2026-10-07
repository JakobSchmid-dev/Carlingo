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
