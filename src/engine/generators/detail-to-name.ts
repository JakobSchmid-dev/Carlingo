/** Shows a detail image (e.g. only the tail light); the user picks the name out of four. */
import type { QuestionGenerator } from '../types.ts';
import {
  detailImages,
  distinctCount,
  imageRef,
  nameCandidates,
  pickWrongVehicles,
  text,
  WRONG_ANSWERS,
} from './shared.ts';

export const detailToName: QuestionGenerator = {
  id: 'detail-to-name',
  skill: 'recognize-detail',
  canGenerate: (vehicle, pool) =>
    detailImages(vehicle).length > 0 &&
    distinctCount(nameCandidates(vehicle, pool)) >= WRONG_ANSWERS,
  generate(vehicle, pool, ctx) {
    const image = ctx.rng.pick(detailImages(vehicle));
    const wrong = pickWrongVehicles(vehicle, nameCandidates(vehicle, pool), ctx);
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'detail-to-name', image: imageRef(vehicle, image) },
      options: ctx.rng
        .shuffle([vehicle, ...wrong])
        .map((v) => ({ id: v.id, label: text(v.displayName) })),
      correctOptionId: vehicle.id,
    };
  },
};
