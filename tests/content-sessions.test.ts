/**
 * Plausibility check on the real content: every level of every package yields a complete unit.
 */
import { describe, expect, it } from 'vitest';
import { readContent } from '../scripts/lib/read-content.ts';
import { levelPool, type ContentPackage } from '../src/content/model.ts';
import { validatePackage } from '../src/content/validate.ts';
import { SESSION_LENGTH } from '../src/engine/config.ts';
import { generatorList, generators } from '../src/engine/generators/index.ts';
import { emptyProgress, type LearnerProgress } from '../src/engine/progress.ts';
import {
  answerCurrent,
  currentItem,
  finishSession,
  isFinished,
  planSession,
} from '../src/engine/session.ts';

const TODAY = 20500;

const packages: ContentPackage[] = readContent().packages.map((raw) => {
  const { pkg, issues } = validatePackage(raw, generatorList, (f) => f);
  if (!pkg)
    throw new Error(`Paket ${raw.folder} ungültig: ${issues.map((i) => i.message).join('; ')}`);
  return pkg;
});

const cases = packages.flatMap((pkg) =>
  pkg.tracks.flatMap((track) =>
    track.levels.map((level) => ({ name: `${track.id} → ${level.id}`, pkg, track, level })),
  ),
);

describe.each(cases)('$name', ({ pkg, track, level }) => {
  const pool = levelPool(pkg.vehicles, track, level);
  const progresses: [string, LearnerProgress][] = [
    ['new learner', emptyProgress()],
    [
      'all profiles unlocked',
      { ...emptyProgress(), unlockedProfiles: pkg.vehicles.map((v) => v.id) },
    ],
  ];

  it.each(progresses)('yields a complete, plausible unit for a %s', (_label, progress) => {
    const input = {
      level,
      pool,
      generators,
      bodyStyles: pkg.brand.bodyStyles.map((b) => b.id),
      progress,
      today: TODAY,
      seed: `plausibility:${level.id}`,
    };
    let state = planSession(input);
    const knowledgeOnly = level.generators.every((g) =>
      ['model-code', 'power-compare'].includes(g),
    );
    if (knowledgeOnly && progress.unlockedProfiles.length === 0) {
      expect(state.items).toEqual([]); // nothing to ask before profiles are unlocked
      return;
    }
    expect(state.items).toHaveLength(SESSION_LENGTH);

    const poolIds = new Set(pool.map((v) => v.id));
    let answered = 0;
    while (!isFinished(state)) {
      const { question } = currentItem(state)!;
      expect(level.generators).toContain(question.generatorId);
      expect(poolIds.has(question.vehicleId)).toBe(true);
      expect(question.options.filter((o) => o.id === question.correctOptionId)).toHaveLength(1);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      // answer every third question wrong
      const wrong = question.options.find((o) => o.id !== question.correctOptionId)!;
      state = answerCurrent(
        state,
        answered++ % 3 === 0 ? wrong.id : question.correctOptionId,
        input,
      );
    }
    for (let i = 1; i < state.items.length; i++) {
      expect(state.items[i]!.fact.key).not.toBe(state.items[i - 1]!.fact.key);
    }
    const { progress: after, result } = finishSession(state, progress, TODAY);
    expect(result.planned).toBe(SESSION_LENGTH);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(Object.keys(after.facts).length).toBeGreaterThan(0);
  });
});
