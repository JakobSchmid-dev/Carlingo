import { describe, expect, it } from 'vitest';
import { BOX_INTERVAL_DAYS } from './config.ts';
import { applyAnswer, isDue } from './srs.ts';

const TODAY = 20000;

describe('applyAnswer (Leitner boxes)', () => {
  it('moves a new fact to box 2 when correct, due tomorrow', () => {
    const s = applyAnswer(undefined, true, TODAY);
    expect(s.box).toBe(2);
    expect(s.due).toBe(TODAY + BOX_INTERVAL_DAYS[2]);
    expect(s.seen).toBe(1);
    expect(s.correct).toBe(1);
  });

  it('keeps a new fact in box 1 when wrong, due immediately', () => {
    const s = applyAnswer(undefined, false, TODAY);
    expect(s.box).toBe(1);
    expect(s.due).toBe(TODAY);
  });

  it('moves one box up per correct answer when due, using the configured intervals', () => {
    let s = applyAnswer(undefined, true, TODAY); // box 2
    for (const box of [3, 4, 5] as const) {
      s = applyAnswer(s, true, s.due);
      expect(s.box).toBe(box);
      expect(s.due - s.lastSeen).toBe(BOX_INTERVAL_DAYS[box]);
    }
  });

  it('stays in box 5', () => {
    const s = applyAnswer(
      { box: 5, due: TODAY, seen: 9, correct: 9, lastSeen: TODAY - 21 },
      true,
      TODAY,
    );
    expect(s.box).toBe(5);
    expect(s.due).toBe(TODAY + 21);
  });

  it('goes back to box 1 when wrong', () => {
    const s = applyAnswer(
      { box: 4, due: TODAY, seen: 5, correct: 5, lastSeen: TODAY - 7 },
      false,
      TODAY,
    );
    expect(s.box).toBe(1);
    expect(s.due).toBe(TODAY);
    expect(s.seen).toBe(6);
    expect(s.correct).toBe(5);
  });

  it('does not promote a fact that is not due yet (no cramming)', () => {
    const before = { box: 3 as const, due: TODAY + 2, seen: 3, correct: 3, lastSeen: TODAY - 1 };
    const s = applyAnswer(before, true, TODAY);
    expect(s.box).toBe(3);
    expect(s.due).toBe(TODAY + 2);
    expect(s.seen).toBe(4);
  });
});

describe('isDue', () => {
  it('is due on and after the due day', () => {
    const s = { box: 2 as const, due: TODAY, seen: 1, correct: 1, lastSeen: TODAY - 1 };
    expect(isDue(s, TODAY - 1)).toBe(false);
    expect(isDue(s, TODAY)).toBe(true);
    expect(isDue(s, TODAY + 5)).toBe(true);
  });
});
