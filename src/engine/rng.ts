/**
 * Seeded pseudo-random numbers (mulberry32). Same seed → same sequence, so generated questions
 * and sessions are reproducible and testable.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, max). */
  int(max: number): number;
  pick<T>(items: readonly T[]): T;
  /** Returns a shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
  /** A new independent generator derived from this one's seed and a label. */
  fork(label: string): Rng;
}

/** FNV-1a hash of a string to an unsigned 32-bit integer. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  const initial = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  let state = initial;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (max) => Math.floor(next() * max),
    pick(items) {
      if (items.length === 0) throw new Error('pick() aus leerer Liste');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    shuffle(items) {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j] as (typeof out)[number], out[i] as (typeof out)[number]];
      }
      return out;
    },
    fork: (label) => createRng(hashSeed(`${initial}:${label}`)),
  };
  return rng;
}
