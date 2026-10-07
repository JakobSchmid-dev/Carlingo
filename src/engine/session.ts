/**
 * A learning unit ("Lerneinheit"): which facts are asked, in which order, and what happens on
 * wrong answers. Pure functions on plain data; the UI keeps the state.
 *
 * Composition (SPEC section 8):
 *   1. due facts of the level
 *   2. new facts, at most MAX_NEW_FACTS_PER_SESSION
 *   3. filled up with the weakest facts
 * Wrong answers are asked once more at the end. The same fact never appears twice in a row.
 */
import type { Level, Vehicle } from '../content/schema.ts';
import {
  MAX_NEW_FACTS_PER_SESSION,
  SESSION_LENGTH,
  XP_PER_CORRECT,
  XP_PERFECT_BONUS,
} from './config.ts';
import {
  isAskable,
  levelFacts,
  profilesToUnlock,
  updateStreak,
  type Fact,
  type FactKey,
  type LearnerProgress,
} from './progress.ts';
import { createRng, type Rng } from './rng.ts';
import { applyAnswer, isDue, type FactState } from './srs.ts';
import type { Question, QuestionGenerator } from './types.ts';

export interface SessionInput {
  level: Level;
  pool: readonly Vehicle[];
  generators: Readonly<Record<string, QuestionGenerator>>;
  /** All body style ids of the brand (for body-style questions). */
  bodyStyles: readonly string[];
  progress: LearnerProgress;
  today: number;
  seed: string;
}

/** planned: part of the 10; retry: re-asked after a wrong answer; filler: keeps a retry from following its own fact. */
export type ItemKind = 'planned' | 'retry' | 'filler';

export interface SessionItem {
  fact: Fact;
  question: Question;
  kind: ItemKind;
}

export interface AnswerRecord {
  factKey: FactKey;
  vehicleId: string;
  kind: ItemKind;
  optionId: string;
  correct: boolean;
}

export interface SessionState {
  levelId: string;
  seed: string;
  items: SessionItem[];
  /** Index of the current item; equals items.length when finished. */
  position: number;
  answers: AnswerRecord[];
}

export interface SessionResult {
  /** Planned questions (without retries). */
  planned: number;
  /** Planned questions answered correctly. */
  correctPlanned: number;
  /** All correct answers, including retries. */
  correctTotal: number;
  perfect: boolean;
  xpEarned: number;
  /** Vehicle ids whose profile was unlocked by this unit. */
  newlyUnlocked: string[];
  streak: number;
}

type GenerateInput = Pick<SessionInput, 'pool' | 'generators' | 'bodyStyles' | 'level'>;

function byWeakness(progress: LearnerProgress) {
  return (a: Fact, b: Fact) => {
    const sa = progress.facts[a.key] as FactState;
    const sb = progress.facts[b.key] as FactState;
    return sa.box - sb.box || sa.due - sb.due;
  };
}

/** The distinct facts a unit asks, in priority order (at most SESSION_LENGTH). */
export function selectFacts(
  facts: readonly Fact[],
  progress: LearnerProgress,
  today: number,
  rng: Rng,
): Fact[] {
  const askable = rng.shuffle(facts.filter((f) => isAskable(f, progress)));
  const seen = askable.filter((f) => progress.facts[f.key] !== undefined);
  const due = seen.filter((f) => isDue(progress.facts[f.key] as FactState, today));
  const notDue = seen.filter((f) => !due.includes(f));
  const fresh = askable
    .filter((f) => progress.facts[f.key] === undefined)
    .slice(0, MAX_NEW_FACTS_PER_SESSION);
  return [...due.sort(byWeakness(progress)), ...fresh, ...notDue.sort(byWeakness(progress))].slice(
    0,
    SESSION_LENGTH,
  );
}

function makeQuestion(
  fact: Fact,
  input: GenerateInput,
  rng: Rng,
  generatorId: string,
): Question | undefined {
  const vehicle = input.pool.find((v) => v.id === fact.vehicleId);
  const generator = input.generators[generatorId];
  if (!vehicle || !generator?.canGenerate(vehicle, input.pool)) return undefined;
  return generator.generate(vehicle, input.pool, {
    difficulty: input.level.difficulty,
    rng,
    bodyStyles: input.bodyStyles,
  });
}

/** Generates a question for a fact, rotating through its generators on repeats. */
function makeItem(
  fact: Fact,
  kind: ItemKind,
  input: GenerateInput,
  seed: string,
  index: number,
  occurrence: number,
): SessionItem | undefined {
  const rng = createRng(`${seed}:${index}`);
  const start = createRng(`${seed}:${fact.key}`).int(fact.generatorIds.length);
  for (let i = 0; i < fact.generatorIds.length; i++) {
    const id = fact.generatorIds[(start + occurrence + i) % fact.generatorIds.length] as string;
    const question = makeQuestion(fact, input, rng, id);
    if (question) return { fact, question, kind };
  }
  return undefined;
}

export function planSession(input: SessionInput): SessionState {
  const rng = createRng(input.seed);
  const facts = levelFacts(input.level, input.pool, input.generators);
  const selected = rng.shuffle(selectFacts(facts, input.progress, input.today, rng));

  // Fewer facts than questions: cycle through them. Cycling never puts a fact next to itself
  // as long as there are at least two facts; with a single fact, ask it once.
  const length = selected.length >= 2 ? SESSION_LENGTH : selected.length;
  const items: SessionItem[] = [];
  for (let i = 0; items.length < length && i < length * 2; i++) {
    const fact = selected[i % selected.length] as Fact;
    const occurrence = Math.floor(i / selected.length);
    const item = makeItem(fact, 'planned', input, input.seed, i, occurrence);
    if (item) items.push(item);
  }
  return { levelId: input.level.id, seed: input.seed, items, position: 0, answers: [] };
}

export function currentItem(state: SessionState): SessionItem | undefined {
  return state.items[state.position];
}

export function isFinished(state: SessionState): boolean {
  return state.position >= state.items.length;
}

export function answerCurrent(
  state: SessionState,
  optionId: string,
  input: GenerateInput,
): SessionState {
  const item = currentItem(state);
  if (!item) return state;
  const correct = optionId === item.question.correctOptionId;
  const answers = [
    ...state.answers,
    { factKey: item.fact.key, vehicleId: item.fact.vehicleId, kind: item.kind, optionId, correct },
  ];
  const items = [...state.items];

  if (!correct && item.kind === 'planned') {
    const occurrences = items.filter((i) => i.fact.key === item.fact.key).length;
    const retry = makeItem(item.fact, 'retry', input, state.seed, items.length, occurrences);
    const last = items[items.length - 1];
    if (retry && last?.fact.key === retry.fact.key) {
      // The retry would directly follow its own fact: put another fact of this unit in between.
      const other = [...items]
        .reverse()
        .find((i) => i.fact.key !== retry.fact.key && i.kind === 'planned');
      const filler =
        other && makeItem(other.fact, 'filler', input, state.seed, items.length + 1, 1);
      if (filler) items.push(filler, retry);
    } else if (retry) {
      items.push(retry);
    }
  }
  return { ...state, items, answers, position: state.position + 1 };
}

/**
 * Applies a finished unit to the progress. Only the first answer per fact in a unit moves the
 * fact between boxes; repeats are practice.
 */
export function finishSession(
  state: SessionState,
  progress: LearnerProgress,
  today: number,
): { progress: LearnerProgress; result: SessionResult } {
  const first = new Map<FactKey, boolean>();
  for (const a of state.answers) if (!first.has(a.factKey)) first.set(a.factKey, a.correct);

  const facts = { ...progress.facts };
  for (const [key, correct] of first) facts[key] = applyAnswer(facts[key], correct, today);

  const planned = state.answers.filter((a) => a.kind === 'planned');
  const correctTotal = state.answers.filter((a) => a.correct).length;
  const perfect = state.answers.length > 0 && state.answers.every((a) => a.correct);
  const xpEarned = correctTotal * XP_PER_CORRECT + (perfect ? XP_PERFECT_BONUS : 0);

  const next: LearnerProgress = {
    ...progress,
    facts,
    xp: progress.xp + xpEarned,
    streak: updateStreak(progress.streak, today),
    sessionsCompleted: progress.sessionsCompleted + 1,
  };
  const newlyUnlocked = profilesToUnlock(next);
  next.unlockedProfiles = [...progress.unlockedProfiles, ...newlyUnlocked];

  return {
    progress: next,
    result: {
      planned: planned.length,
      correctPlanned: planned.filter((a) => a.correct).length,
      correctTotal,
      perfect,
      xpEarned,
      newlyUnlocked,
      streak: next.streak.current,
    },
  };
}
