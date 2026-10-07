/**
 * Leitner box system ("Karteikasten"). Correct: one box up, wrong: back to box 1.
 * Days are whole local calendar days (see dayNumber), so intervals don't depend on the time of day.
 */
import { BOX_INTERVAL_DAYS, MAX_BOX, type Box } from './config.ts';

export interface FactState {
  box: Box;
  /** Day number from which the fact is due again. */
  due: number;
  seen: number;
  correct: number;
  lastSeen: number;
}

export function isDue(state: FactState, today: number): boolean {
  return state.due <= today;
}

export function applyAnswer(
  prev: FactState | undefined,
  correct: boolean,
  today: number,
): FactState {
  const seen = (prev?.seen ?? 0) + 1;
  const correctCount = (prev?.correct ?? 0) + (correct ? 1 : 0);
  if (!correct) {
    return {
      box: 1,
      due: today + BOX_INTERVAL_DAYS[1],
      seen,
      correct: correctCount,
      lastSeen: today,
    };
  }
  if (prev && !isDue(prev, today)) {
    // Answered early (e.g. to fill up a unit): counts, but doesn't move the fact up.
    return { ...prev, seen, correct: correctCount, lastSeen: today };
  }
  const box = Math.min((prev?.box ?? 1) + 1, MAX_BOX) as Box;
  return { box, due: today + BOX_INTERVAL_DAYS[box], seen, correct: correctCount, lastSeen: today };
}

/** Local calendar day as an integer (days since 1970-01-01 in local time). */
export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}
