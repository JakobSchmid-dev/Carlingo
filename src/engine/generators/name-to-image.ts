/** Shows a name; the user picks the matching image out of four. */
import type { Vehicle } from '../../content/schema.ts';
import type { QuestionGenerator } from '../types.ts';
import {
  distinctCount,
  imageRef,
  nameCandidates,
  pickWrongVehicles,
  wholeImages,
  WRONG_ANSWERS,
} from './shared.ts';

const withImage = (vehicles: Vehicle[]) => vehicles.filter((v) => wholeImages(v).length > 0);

export const nameToImage: QuestionGenerator = {
  id: 'name-to-image',
  skill: 'recognize',
  canGenerate: (vehicle, pool) =>
    wholeImages(vehicle).length > 0 &&
    distinctCount(withImage(nameCandidates(vehicle, pool))) >= WRONG_ANSWERS,
  generate(vehicle, pool, ctx) {
    const targetImage = ctx.rng.pick(wholeImages(vehicle));
    const wrong = pickWrongVehicles(vehicle, withImage(nameCandidates(vehicle, pool)), ctx);
    // Prefer the same view for every option, so the images are comparable.
    const imageFor = (v: Vehicle) => {
      if (v.id === vehicle.id) return targetImage;
      const images = wholeImages(v);
      return images.find((img) => img.view === targetImage.view) ?? ctx.rng.pick(images);
    };
    return {
      generatorId: this.id,
      skill: this.skill,
      vehicleId: vehicle.id,
      prompt: { kind: 'name-to-image', subject: vehicle.displayName },
      options: ctx.rng
        .shuffle([vehicle, ...wrong])
        .map((v) => ({ id: v.id, image: imageRef(v, imageFor(v)) })),
      correctOptionId: vehicle.id,
    };
  },
};
