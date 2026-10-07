import { describe, expect, it } from 'vitest';
import { sampleVehicles } from '../../tests/fixtures.ts';
import type { Level } from '../content/schema.ts';
import {
  MAX_NEW_FACTS_PER_SESSION,
  SESSION_LENGTH,
  XP_PER_CORRECT,
  XP_PERFECT_BONUS,
} from './config.ts';
import { generators } from './generators/index.ts';
import { emptyProgress, factKey, levelFacts, type LearnerProgress } from './progress.ts';
import { createRng } from './rng.ts';
import {
  answerCurrent,
  currentItem,
  finishSession,
  isFinished,
  planSession,
  selectFacts,
  type SessionInput,
  type SessionState,
} from './session.ts';
import type { FactState } from './srs.ts';

const TODAY = 20000;
const pool = sampleVehicles();
const level = (overrides: Partial<Level> = {}): Level => ({
  id: 'l',
  title: 'L',
  filter: {},
  generators: ['image-to-name', 'name-to-image', 'detail-to-name'],
  difficulty: 2,
  unlockAfter: [],
  ...overrides,
});
const input = (overrides: Partial<SessionInput> = {}): SessionInput => ({
  level: level(),
  pool,
  generators,
  bodyStyles: ['saloon', 'estate', 'suv', 'roadster'],
  progress: emptyProgress(),
  today: TODAY,
  seed: 'test',
  ...overrides,
});
const state = (box: FactState['box'], due: number): FactState => ({
  box,
  due,
  seen: 1,
  correct: 1,
  lastSeen: TODAY - 1,
});

function expectNoAdjacentFacts(s: SessionState) {
  for (let i = 1; i < s.items.length; i++) {
    expect(s.items[i]!.fact.key, `items ${i - 1} and ${i}`).not.toBe(s.items[i - 1]!.fact.key);
  }
}

/** Answers every question; `correct(i)` decides per answer index. */
function play(s: SessionState, inp: SessionInput, correct: (i: number) => boolean) {
  let i = 0;
  while (!isFinished(s)) {
    const q = currentItem(s)!.question;
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
    s = answerCurrent(s, correct(i++) ? q.correctOptionId : wrong.id, inp);
  }
  return s;
}

describe('selectFacts', () => {
  const facts = levelFacts(level(), pool, generators); // 6 recognize + 6 recognize-detail

  it('takes at most four new facts', () => {
    const selected = selectFacts(facts, emptyProgress(), TODAY, createRng(1));
    expect(selected).toHaveLength(MAX_NEW_FACTS_PER_SESSION);
  });

  it('puts due facts first, then new ones, then the weakest', () => {
    const [a, b, c, d] = facts;
    const progress: LearnerProgress = {
      ...emptyProgress(),
      facts: {
        [a!.key]: state(4, TODAY + 5), // not due, strong
        [b!.key]: state(2, TODAY + 1), // not due, weak
        [c!.key]: state(3, TODAY - 1), // due
        [d!.key]: state(1, TODAY), // due, weaker
      },
    };
    const selected = selectFacts(facts, progress, TODAY, createRng(1)).map((f) => f.key);
    expect(selected.slice(0, 2)).toEqual([d!.key, c!.key]);
    expect(selected.slice(2, 6).every((k) => ![a, b, c, d].some((f) => f!.key === k))).toBe(true);
    expect(selected.slice(6)).toEqual([b!.key, a!.key]);
  });

  it('skips knowledge facts of vehicles without unlocked profile', () => {
    const knowledge = levelFacts(level({ generators: ['model-code'] }), pool, generators);
    expect(selectFacts(knowledge, emptyProgress(), TODAY, createRng(1))).toEqual([]);
    const unlocked = { ...emptyProgress(), unlockedProfiles: ['alpha-saloon'] };
    expect(selectFacts(knowledge, unlocked, TODAY, createRng(1)).map((f) => f.vehicleId)).toEqual([
      'alpha-saloon',
    ]);
  });
});

describe('planSession', () => {
  it('plans ten questions without the same fact twice in a row', () => {
    const s = planSession(input());
    expect(s.items).toHaveLength(SESSION_LENGTH);
    expect(s.items.every((i) => i.kind === 'planned')).toBe(true);
    expectNoAdjacentFacts(s);
  });

  it('is deterministic for a seed', () => {
    expect(planSession(input())).toEqual(planSession(input()));
    expect(planSession(input({ seed: 'other' }))).not.toEqual(planSession(input()));
  });

  it('only asks about vehicles in the pool', () => {
    const smallPool = pool.slice(0, 4);
    const s = planSession(input({ pool: smallPool }));
    for (const item of s.items) {
      expect(smallPool.map((v) => v.id)).toContain(item.question.vehicleId);
      for (const o of item.question.options) {
        if (o.image) expect(smallPool.map((v) => v.id)).toContain(o.image.vehicleId);
      }
    }
  });

  it('uses different question types when repeating a fact', () => {
    const s = planSession(
      input({ level: level({ generators: ['image-to-name', 'name-to-image'] }) }),
    );
    const first = s.items.filter((i) => i.fact.key === s.items[0]!.fact.key);
    expect(new Set(first.map((i) => i.question.generatorId)).size).toBe(2);
  });

  it('asks a single available fact only once', () => {
    const progress = { ...emptyProgress(), unlockedProfiles: ['alpha-saloon'] };
    const s = planSession(input({ level: level({ generators: ['model-code'] }), progress }));
    expect(s.items).toHaveLength(1);
  });

  it('is empty when nothing can be asked yet', () => {
    const s = planSession(input({ level: level({ generators: ['model-code'] }) }));
    expect(s.items).toEqual([]);
    expect(isFinished(s)).toBe(true);
  });
});

describe('answerCurrent', () => {
  it('asks a wrongly answered question again at the end', () => {
    const inp = input();
    let s = planSession(inp);
    const firstFact = s.items[0]!.fact.key;
    s = play(s, inp, (i) => i !== 0);
    expect(s.items).toHaveLength(SESSION_LENGTH + 1);
    expect(s.items.at(-1)).toMatchObject({ kind: 'retry', fact: { key: firstFact } });
    expectNoAdjacentFacts(s);
  });

  it('asks a retry only once, even if it is wrong again', () => {
    const inp = input();
    const s = play(planSession(inp), inp, () => false);
    const retries = s.items.filter((i) => i.kind === 'retry');
    expect(retries).toHaveLength(SESSION_LENGTH);
    expectNoAdjacentFacts(s);
  });

  it('inserts another fact before a retry that would follow its own fact', () => {
    const inp = input();
    let s = planSession(inp);
    s = play(s, inp, (i) => i !== SESSION_LENGTH - 1); // only the last planned one wrong
    expect(s.items.slice(SESSION_LENGTH).map((i) => i.kind)).toEqual(['filler', 'retry']);
    expectNoAdjacentFacts(s);
  });
});

describe('finishSession', () => {
  it('gives 10 XP per correct answer and a bonus for a perfect unit', () => {
    const inp = input();
    const perfect = finishSession(
      play(planSession(inp), inp, () => true),
      emptyProgress(),
      TODAY,
    );
    expect(perfect.result.xpEarned).toBe(SESSION_LENGTH * XP_PER_CORRECT + XP_PERFECT_BONUS);
    expect(perfect.result).toMatchObject({ planned: 10, correctPlanned: 10, perfect: true });

    const oneWrong = finishSession(
      play(planSession(inp), inp, (i) => i !== 0),
      emptyProgress(),
      TODAY,
    );
    // 9 planned + 1 retry correct, no bonus
    expect(oneWrong.result.xpEarned).toBe(10 * XP_PER_CORRECT);
    expect(oneWrong.result.perfect).toBe(false);
    expect(oneWrong.result.correctPlanned).toBe(9);
  });

  it('moves facts by their first answer in the unit only', () => {
    const inp = input();
    const s = play(planSession(inp), inp, (i) => i !== 0); // first wrong, its retry right
    const { progress } = finishSession(s, emptyProgress(), TODAY);
    const firstKey = s.items[0]!.fact.key;
    expect(progress.facts[firstKey]?.box).toBe(1);
    const others = Object.entries(progress.facts).filter(([k]) => k !== firstKey);
    expect(others.every(([, f]) => f.box === 2)).toBe(true);
  });

  it('updates streak and session count', () => {
    const inp = input();
    const { progress, result } = finishSession(
      play(planSession(inp), inp, () => true),
      emptyProgress(),
      TODAY,
    );
    expect(progress.streak).toEqual({ current: 1, best: 1, lastDay: TODAY });
    expect(progress.sessionsCompleted).toBe(1);
    expect(result.streak).toBe(1);
  });

  it('unlocks a profile when the recognize fact reaches box 3', () => {
    const key = factKey('alpha-saloon', 'recognize');
    const before: LearnerProgress = {
      ...emptyProgress(),
      facts: { [key]: state(2, TODAY) },
    };
    const inp = input({ progress: before, level: level({ generators: ['image-to-name'] }) });
    const { progress, result } = finishSession(
      play(planSession(inp), inp, () => true),
      before,
      TODAY,
    );
    expect(progress.facts[key]?.box).toBe(3);
    expect(result.newlyUnlocked).toEqual(['alpha-saloon']);
    expect(progress.unlockedProfiles).toEqual(['alpha-saloon']);
  });

  it('keeps progress of vehicles that no longer exist untouched', () => {
    const before: LearnerProgress = {
      ...emptyProgress(),
      facts: { 'gone|recognize': state(4, TODAY + 3) },
    };
    const inp = input({ progress: before });
    const { progress } = finishSession(
      play(planSession(inp), inp, () => true),
      before,
      TODAY,
    );
    expect(progress.facts['gone|recognize']).toEqual(state(4, TODAY + 3));
  });
});
