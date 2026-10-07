/** Shows the vehicle; the user picks the body style. */
import { pickDistractors, similarity } from '../distractors.ts';
import type { QuestionGenerator } from '../types.ts';
import { imageRef, wholeImages, WRONG_ANSWERS } from './shared.ts';

export const bodyStyle: QuestionGenerator = {
  id: 'body-style',
  skill: 'body-style',
  canGenerate: (vehicle, pool) =>
    wholeImages(vehicle).length > 0 && new Set(pool.map((v) => v.bodyStyle)).size >= 2,
  generate(vehicle, pool, ctx) {
    const image = ctx.rng.pick(wholeImages(vehicle));
    const all = ctx.bodyStyles.length > 0 ? ctx.bodyStyles : pool.map((v) => v.bodyStyle);
    const others = [...new Set(all)].filter((id) => id !== vehicle.bodyStyle);
    // A body style is "similar" if vehicles similar to this one have it.
    const score = (style: string) =>
      Math.max(
        0,
        ...pool
          .filter((v) => v.id !== vehicle.id && v.bodyStyle === style)
          .map((v) => similarity(vehicle, v)),
      );
    const wrong = pickDistractors(others, score, WRONG_ANSWERS, ctx.difficulty, ctx.rng);
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'body-style', image: imageRef(vehicle, image) },
      options: ctx.rng
        .shuffle([vehicle.bodyStyle, ...wrong])
        .map((id) => ({ id, label: { kind: 'bodyStyle', id } })),
      correctOptionId: vehicle.bodyStyle,
    };
  },
};
