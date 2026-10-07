/**
 * Choosing wrong answers. One central similarity function rates how easily two vehicles can be
 * confused; the difficulty decides whether similar or dissimilar candidates are preferred.
 */
import type { Difficulty, Vehicle } from '../content/schema.ts';
import { SIMILARITY_WEIGHTS } from './config.ts';
import type { Rng } from './rng.ts';

export function similarity(a: Vehicle, b: Vehicle): number {
  const w = SIMILARITY_WEIGHTS;
  let score = 0;
  if (a.family === b.family) score += w.family;
  if (a.bodyStyle === b.bodyStyle) score += w.bodyStyle;
  if (a.series === b.series) score += w.series;
  if (a.subBrand === b.subBrand) score += w.subBrand;
  if (a.similarTo.includes(b.id) || b.similarTo.includes(a.id)) score += w.similarTo;
  return score;
}

/**
 * True if a photo of one vehicle could just as well show the other: same series, same body style
 * and the same generation (model code). Missing model codes count as "maybe the same".
 * Such pairs (e.g. combustion and plug-in hybrid of one model) never appear together as answers
 * to an image question.
 */
export function lookAlike(a: Vehicle, b: Vehicle): boolean {
  if (a.id === b.id) return true;
  if (a.series !== b.series || a.bodyStyle !== b.bodyStyle) return false;
  return a.modelCode === undefined || b.modelCode === undefined || a.modelCode === b.modelCode;
}

/**
 * Picks `count` distinct candidates.
 * - difficulty 1: least similar first
 * - difficulty 2: half of them from the most similar, the rest at random
 * - difficulty 3: most similar first
 * Ties are broken randomly (but deterministically for a seed).
 */
export function pickDistractors<T>(
  candidates: readonly T[],
  score: (candidate: T) => number,
  count: number,
  difficulty: Difficulty,
  rng: Rng,
): T[] {
  const shuffled = rng.shuffle(candidates);
  const scored = shuffled.map((c) => ({ c, s: score(c) }));
  const mostSimilar = [...scored].sort((a, b) => b.s - a.s).map((x) => x.c);

  if (difficulty === 3) return mostSimilar.slice(0, count);
  if (difficulty === 1)
    return [...scored]
      .sort((a, b) => a.s - b.s)
      .map((x) => x.c)
      .slice(0, count);

  const fromTop = mostSimilar.slice(0, Math.floor(count / 2));
  const rest = shuffled.filter((c) => !fromTop.includes(c));
  return [...fromTop, ...rest].slice(0, count);
}
