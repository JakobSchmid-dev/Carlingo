/** Shows the vehicle; the user decides: combustion, plug-in hybrid or electric? */
import { POWERTRAINS } from '../../content/schema.ts';
import { lookAlike } from '../distractors.ts';
import type { QuestionGenerator } from '../types.ts';
import { imageRef, wholeImages } from './shared.ts';

export const powertrain: QuestionGenerator = {
  id: 'powertrain',
  skill: 'powertrain',
  // Not answerable from a photo if a visually identical variant with another powertrain exists.
  canGenerate: (vehicle, pool) =>
    wholeImages(vehicle).length > 0 &&
    !pool.some(
      (other) =>
        other.id !== vehicle.id &&
        other.powertrain !== vehicle.powertrain &&
        lookAlike(vehicle, other),
    ),
  generate(vehicle, _pool, ctx) {
    const image = ctx.rng.pick(wholeImages(vehicle));
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'powertrain', image: imageRef(vehicle, image) },
      // Fixed order: the three choices are always the same.
      options: POWERTRAINS.map((value) => ({ id: value, label: { kind: 'powertrain', value } })),
      correctOptionId: vehicle.powertrain,
    };
  },
};
