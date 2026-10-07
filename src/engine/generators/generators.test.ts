import { describe, expect, it } from 'vitest';
import { sampleVehicles, vehicle } from '../../../tests/fixtures.ts';
import type { Difficulty, Vehicle } from '../../content/schema.ts';
import { lookAlike } from '../distractors.ts';
import { createRng } from '../rng.ts';
import type { AnswerOption, GenContext, Question } from '../types.ts';
import { generatorList, generators } from './index.ts';

const BODY_STYLES = ['saloon', 'estate', 'suv', 'roadster', 'coupe'];
const pool = sampleVehicles();
const byId = Object.fromEntries(pool.map((v) => [v.id, v]));
const v = (id: string) => byId[id]!;

const ctx = (seed: number | string = 1, difficulty: Difficulty = 2): GenContext => ({
  rng: createRng(seed),
  difficulty,
  bodyStyles: BODY_STYLES,
});

/** The text a user sees for an option (images are compared by file). */
function visible(o: AnswerOption): string {
  if (o.image) return `img:${o.image.file}`;
  if (!o.label) return '';
  switch (o.label.kind) {
    case 'text':
      return o.label.text;
    case 'powertrain':
      return `pt:${o.label.value}`;
    case 'bodyStyle':
      return `bs:${o.label.id}`;
  }
}

function expectWellFormed(q: Question, target: Vehicle) {
  expect(q.vehicleId).toBe(target.id);
  const ids = q.options.map((o) => o.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.filter((id) => id === q.correctOptionId)).toHaveLength(1);
  const texts = q.options.map(visible);
  expect(new Set(texts).size).toBe(texts.length);
  expect(texts.every((t) => t !== '')).toBe(true);
}

describe('generator registry', () => {
  it('contains the seven question types of v1 with unique ids', () => {
    expect(generatorList.map((g) => g.id).sort()).toEqual(
      [
        'body-style',
        'detail-to-name',
        'image-to-name',
        'model-code',
        'name-to-image',
        'power-compare',
        'powertrain',
      ].sort(),
    );
    for (const g of generatorList) expect(generators[g.id]).toBe(g);
  });
});

describe.each(generatorList.map((g) => [g.id, g] as const))('%s (shared rules)', (_id, gen) => {
  const eligible = pool.filter((t) => gen.canGenerate(t, pool));

  it('can generate for at least one fixture vehicle', () => {
    expect(eligible.length).toBeGreaterThan(0);
  });

  it.each([1, 2, 3] as const)('produces well-formed questions at difficulty %i', (difficulty) => {
    for (const target of eligible) {
      for (let seed = 0; seed < 15; seed++) {
        const q = gen.generate(target, pool, ctx(seed, difficulty));
        expect(q.generatorId).toBe(gen.id);
        expect(q.skill).toBe(gen.skill);
        expectWellFormed(q, target);
      }
    }
  });

  it('is a pure function of input and seed', () => {
    for (const target of eligible) {
      expect(gen.generate(target, pool, ctx('s', 3))).toEqual(
        gen.generate(target, pool, ctx('s', 3)),
      );
    }
  });
});

describe('image-to-name', () => {
  const gen = generators['image-to-name']!;

  it('shows a whole-vehicle image and asks for one of four names', () => {
    const q = gen.generate(v('alpha-saloon'), pool, ctx());
    expect(q.prompt.kind).toBe('image-to-name');
    expect(q.prompt.image?.detail).toBe(false);
    expect(q.prompt.image?.vehicleId).toBe('alpha-saloon');
    expect(q.options).toHaveLength(4);
    const correct = q.options.find((o) => o.id === q.correctOptionId);
    expect(correct?.label).toEqual({ kind: 'text', text: 'Testwagen alpha-saloon' });
  });

  it('never offers a look-alike as wrong answer', () => {
    const twin = vehicle({
      id: 'alpha-saloon-phev',
      series: 'Alpha',
      modelCode: 'A1',
      powertrain: 'plug-in-hybrid',
    });
    const withTwin = [...pool, twin];
    for (let seed = 0; seed < 30; seed++) {
      const q = gen.generate(v('alpha-saloon'), withTwin, ctx(seed, 3));
      expect(q.options.map((o) => o.id)).not.toContain(twin.id);
    }
    expect(lookAlike(v('alpha-saloon'), twin)).toBe(true);
  });

  it('needs three distinguishable other vehicles', () => {
    expect(gen.canGenerate(v('alpha-saloon'), pool.slice(0, 3))).toBe(false);
    expect(gen.canGenerate(v('alpha-saloon'), pool.slice(0, 4))).toBe(true);
  });

  it('uses similar vehicles at difficulty 3 and dissimilar ones at difficulty 1', () => {
    const hard = gen.generate(v('alpha-saloon'), pool, ctx(1, 3));
    expect(hard.options.map((o) => o.id)).toContain('beta-saloon');
    const easy = gen.generate(v('alpha-saloon'), pool, ctx(1, 1));
    expect(easy.options.map((o) => o.id)).not.toContain('beta-saloon');
  });
});

describe('name-to-image', () => {
  const gen = generators['name-to-image']!;

  it('shows the name and four whole-vehicle images', () => {
    const q = gen.generate(v('gamma-suv'), pool, ctx());
    expect(q.prompt).toEqual({ kind: 'name-to-image', subject: 'Testwagen gamma-suv' });
    expect(q.options).toHaveLength(4);
    for (const o of q.options) {
      expect(o.image?.detail).toBe(false);
      expect(o.label).toBeUndefined();
    }
    expect(q.options.find((o) => o.id === q.correctOptionId)?.image?.vehicleId).toBe('gamma-suv');
  });
});

describe('detail-to-name', () => {
  const gen = generators['detail-to-name']!;

  it('shows a detail image', () => {
    const q = gen.generate(v('beta-saloon'), pool, ctx());
    expect(q.prompt.image?.detail).toBe(true);
    expect(q.options).toHaveLength(4);
  });

  it('needs a detail image', () => {
    const noDetail = vehicle({
      id: 'plain',
      images: [{ file: 'plain.svg', view: 'side', detail: false, source: 's', license: 'l' }],
    });
    expect(gen.canGenerate(noDetail, [...pool, noDetail])).toBe(false);
  });
});

describe('powertrain', () => {
  const gen = generators['powertrain']!;

  it('offers the three powertrains in fixed order', () => {
    const q = gen.generate(v('gamma-suv-e'), pool, ctx());
    expect(q.options.map((o) => o.label)).toEqual([
      { kind: 'powertrain', value: 'combustion' },
      { kind: 'powertrain', value: 'plug-in-hybrid' },
      { kind: 'powertrain', value: 'electric' },
    ]);
    expect(q.correctOptionId).toBe('electric');
  });

  it('is not asked when a look-alike with another powertrain exists', () => {
    const twin = vehicle({
      id: 'alpha-saloon-phev',
      series: 'Alpha',
      modelCode: 'A1',
      powertrain: 'plug-in-hybrid',
    });
    expect(gen.canGenerate(v('alpha-saloon'), [...pool, twin])).toBe(false);
    expect(gen.canGenerate(v('alpha-saloon'), pool)).toBe(true);
  });
});

describe('body-style', () => {
  const gen = generators['body-style']!;

  it('asks for the body style with up to four options from the brand', () => {
    const q = gen.generate(v('alpha-estate'), pool, ctx());
    expect(q.options).toHaveLength(4);
    expect(q.correctOptionId).toBe('estate');
    for (const o of q.options) expect(o.label?.kind).toBe('bodyStyle');
  });

  it('falls back to body styles of the pool', () => {
    const q = gen.generate(v('alpha-estate'), pool, { ...ctx(), bodyStyles: [] });
    expect(q.options.map((o) => o.id).sort()).toEqual(['estate', 'roadster', 'saloon', 'suv']);
  });
});

describe('model-code', () => {
  const gen = generators['model-code']!;

  it('asks for the model code with four distinct codes', () => {
    const q = gen.generate(v('alpha-saloon'), pool, ctx(1, 3));
    expect(q.prompt.subject).toBe('Testwagen alpha-saloon');
    expect(q.options).toHaveLength(4);
    expect(q.options.find((o) => o.id === q.correctOptionId)?.label).toEqual({
      kind: 'text',
      text: 'A1',
    });
    // most similar: beta-saloon (B1) and alpha-estate (A2)
    const texts = q.options.map((o) => (o.label?.kind === 'text' ? o.label.text : ''));
    expect(texts).toEqual(expect.arrayContaining(['A2', 'B1']));
  });

  it('needs a model code on the vehicle', () => {
    const noCode = vehicle({ id: 'nocode' });
    expect(gen.canGenerate(noCode, [...pool, noCode])).toBe(false);
  });

  it('needs three other distinct model codes', () => {
    const sameCode = pool.map((x) => ({ ...x, modelCode: 'Z' }));
    expect(gen.canGenerate(sameCode[0]!, sameCode)).toBe(false);
  });
});

describe('power-compare', () => {
  const gen = generators['power-compare']!;

  it('compares two engines and the stronger one is correct', () => {
    for (let seed = 0; seed < 20; seed++) {
      const q = gen.generate(v('alpha-saloon'), pool, ctx(seed));
      expect(q.options).toHaveLength(2);
      const [a, b] = q.options;
      const correct = q.options.find((o) => o.id === q.correctOptionId)!;
      const other = correct === a ? b! : a!;
      expect(correct.reveal!.powerKw!).toBeGreaterThan(other.reveal!.powerKw!);
    }
  });

  it('includes an engine of the vehicle asked about', () => {
    const q = gen.generate(v('beta-saloon'), pool, ctx());
    expect(q.options.some((o) => o.label?.kind === 'text' && o.label.text === 'Beta 300')).toBe(
      true,
    );
  });

  it('uses the closest power at difficulty 3 and the largest gap at difficulty 1', () => {
    // alpha-saloon has 100 and 150 kW; pool has 140, 220, 300, 400 kW
    const hard = gen.generate(v('alpha-estate'), pool, ctx(1, 3)); // 140 kW → closest is 150
    expect(hard.options.map((o) => o.reveal?.powerKw).sort()).toEqual([140, 150]);
    const easy = gen.generate(v('alpha-estate'), pool, ctx(1, 1)); // largest gap → 400
    expect(easy.options.map((o) => o.reveal?.powerKw).sort()).toEqual([140, 400]);
  });

  it('ignores differences below 5 %', () => {
    const a = vehicle({ id: 'p-one', engines: [{ name: 'P1', fuel: 'petrol', powerKw: 100 }] });
    const b = vehicle({ id: 'p-two', engines: [{ name: 'P2', fuel: 'petrol', powerKw: 103 }] });
    expect(gen.canGenerate(a, [a, b])).toBe(false);
  });

  it('derives kW from PS when only PS is given', () => {
    const a = vehicle({ id: 'p-one', engines: [{ name: 'P1', fuel: 'petrol', powerPs: 136 }] });
    const b = vehicle({ id: 'p-two', engines: [{ name: 'P2', fuel: 'petrol', powerKw: 200 }] });
    expect(gen.canGenerate(a, [a, b])).toBe(true);
  });

  it('needs engines with power values', () => {
    expect(gen.canGenerate(v('gamma-suv'), pool)).toBe(false);
  });
});
