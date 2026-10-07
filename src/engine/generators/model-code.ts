/** Shows name and image; the user picks the model code (Baureihe), e.g. "X254". */
import type { Vehicle } from '../../content/schema.ts';
import { pickDistractors, similarity } from '../distractors.ts';
import type { QuestionGenerator } from '../types.ts';
import { imageRef, text, wholeImages, WRONG_ANSWERS } from './shared.ts';

/** Other model codes in the pool, each with its similarity to the vehicle asked about. */
function otherCodes(vehicle: Vehicle, pool: readonly Vehicle[]): Map<string, number> {
  const codes = new Map<string, number>();
  for (const v of pool) {
    if (!v.modelCode || v.modelCode === vehicle.modelCode) continue;
    codes.set(v.modelCode, Math.max(codes.get(v.modelCode) ?? 0, similarity(vehicle, v)));
  }
  return codes;
}

export const modelCode: QuestionGenerator = {
  id: 'model-code',
  skill: 'model-code',
  canGenerate: (vehicle, pool) =>
    vehicle.modelCode !== undefined &&
    wholeImages(vehicle).length > 0 &&
    otherCodes(vehicle, pool).size >= WRONG_ANSWERS,
  generate(vehicle, pool, ctx) {
    const code = vehicle.modelCode ?? '';
    const codes = otherCodes(vehicle, pool);
    const wrong = pickDistractors(
      [...codes.keys()],
      (c) => codes.get(c) ?? 0,
      WRONG_ANSWERS,
      ctx.difficulty,
      ctx.rng,
    );
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: {
        kind: 'model-code',
        subject: vehicle.displayName,
        image: imageRef(vehicle, ctx.rng.pick(wholeImages(vehicle))),
      },
      options: ctx.rng.shuffle([code, ...wrong]).map((c) => ({ id: c, label: text(c) })),
      correctOptionId: code,
    };
  },
};
