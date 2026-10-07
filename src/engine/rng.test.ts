import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from './rng.ts';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it('differs for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('accepts string seeds', () => {
    expect(createRng('abc').next()).toBe(createRng(hashSeed('abc')).next());
  });

  it('returns numbers in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int stays in range and covers all values', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(rng.int(4));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('shuffle returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = createRng(9).shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(input);
  });

  it('pick returns an element and throws on empty arrays', () => {
    expect(['a', 'b']).toContain(createRng(1).pick(['a', 'b']));
    expect(() => createRng(1).pick([])).toThrow();
  });

  it('fork creates an independent but deterministic stream', () => {
    const a = createRng(5).fork('x');
    const b = createRng(5).fork('x');
    expect(a.next()).toBe(b.next());
    expect(createRng(5).fork('x').next()).not.toBe(createRng(5).fork('y').next());
  });
});
