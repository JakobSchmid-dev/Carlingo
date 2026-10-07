/** Shows a whole-vehicle image; the user picks the name out of four. */
import type { QuestionGenerator } from '../types.ts';
import {
  distinctCount,
  imageRef,
  nameCandidates,
  pickWrongVehicles,
  text,
  wholeImages,
  WRONG_ANSWERS,
} from './shared.ts';

export const imageToName: QuestionGenerator = {
  id: 'image-to-name',
  skill: 'recognize',
  canGenerate: (vehicle, pool) =>
    wholeImages(vehicle).length > 0 &&
    distinctCount(nameCandidates(vehicle, pool)) >= WRONG_ANSWERS,
  generate(vehicle, pool, ctx) {
    const image = ctx.rng.pick(wholeImages(vehicle));
    const wrong = pickWrongVehicles(vehicle, nameCandidates(vehicle, pool), ctx);
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'image-to-name', image: imageRef(vehicle, image) },
      options: ctx.rng
        .shuffle([vehicle, ...wrong])
        .map((v) => ({ id: v.id, label: text(v.displayName) })),
      correctOptionId: vehicle.id,
    };
  },
};
