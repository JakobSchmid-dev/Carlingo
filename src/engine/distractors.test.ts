import { describe, expect, it } from 'vitest';
import { sampleVehicles, vehicle } from '../../tests/fixtures.ts';
import { lookAlike, pickDistractors, similarity } from './distractors.ts';
import { createRng } from './rng.ts';

const byId = Object.fromEntries(sampleVehicles().map((v) => [v.id, v]));
const v = (id: string) => byId[id]!;

describe('similarity', () => {
  it('scores shared family, body style, series, sub-brand and similarTo', () => {
    // alpha-saloon ↔ beta-saloon: same family, body, sub-brand + similarTo
    expect(similarity(v('alpha-saloon'), v('beta-saloon'))).toBe(1 + 1 + 1 + 3);
    // alpha-saloon ↔ alpha-estate: same series + sub-brand
    expect(similarity(v('alpha-saloon'), v('alpha-estate'))).toBe(2 + 1);
    // alpha-saloon ↔ delta-roadster: nothing in common
    expect(similarity(v('alpha-saloon'), v('delta-roadster'))).toBe(0);
  });

  it('is symmetric, including similarTo', () => {
    expect(similarity(v('beta-saloon'), v('alpha-saloon'))).toBe(
      similarity(v('alpha-saloon'), v('beta-saloon')),
    );
  });
});

describe('lookAlike', () => {
  it('treats variants of the same series, body and model code as visually identical', () => {
    const a = vehicle({ id: 'x-saloon', series: 'X', modelCode: 'X1' });
    const b = vehicle({
      id: 'x-saloon-phev',
      series: 'X',
      modelCode: 'X1',
      powertrain: 'plug-in-hybrid',
    });
    expect(lookAlike(a, b)).toBe(true);
  });

  it('treats different generations as distinguishable', () => {
    expect(lookAlike(v('gamma-suv'), v('gamma-suv-e'))).toBe(false);
  });

  it('is conservative when a model code is missing', () => {
    const a = vehicle({ id: 'x-saloon', series: 'X' });
    const b = vehicle({ id: 'x-saloon-2', series: 'X', modelCode: 'X2' });
    expect(lookAlike(a, b)).toBe(true);
  });

  it('distinguishes body styles of the same series', () => {
    expect(lookAlike(v('alpha-saloon'), v('alpha-estate'))).toBe(false);
  });
});

describe('pickDistractors', () => {
  const target = v('alpha-saloon');
  const candidates = sampleVehicles().filter((c) => c.id !== target.id);
  const score = (c: (typeof candidates)[number]) => similarity(target, c);

  it('difficulty 1 picks the least similar candidates', () => {
    const picked = pickDistractors(candidates, score, 3, 1, createRng(1));
    // delta-roadster shares nothing, gamma-suv and gamma-suv-e only the sub-brand
    expect(picked.map((c) => c.id).sort()).toEqual(['delta-roadster', 'gamma-suv', 'gamma-suv-e']);
  });

  it('difficulty 3 picks the most similar candidates', () => {
    const picked = pickDistractors(candidates, score, 3, 3, createRng(1));
    expect(picked.map((c) => c.id)).toContain('beta-saloon');
    expect(picked.map((c) => c.id)).toContain('alpha-estate');
  });

  it('difficulty 2 mixes: at least one of the most similar', () => {
    for (let seed = 0; seed < 20; seed++) {
      const picked = pickDistractors(candidates, score, 3, 2, createRng(seed));
      expect(picked.map((c) => c.id)).toContain('beta-saloon');
      expect(new Set(picked).size).toBe(3);
    }
  });

  it('returns fewer items if there are not enough candidates', () => {
    expect(pickDistractors(candidates.slice(0, 2), score, 3, 1, createRng(1))).toHaveLength(2);
  });

  it('is deterministic for the same seed', () => {
    const a = pickDistractors(candidates, score, 3, 2, createRng(11));
    const b = pickDistractors(candidates, score, 3, 2, createRng(11));
    expect(a).toEqual(b);
  });
});
