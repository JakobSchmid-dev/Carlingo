/**
 * Helpers shared by several generators.
 */
import type { Vehicle, VehicleImage } from '../../content/schema.ts';
import { OPTION_COUNT } from '../config.ts';
import { lookAlike, pickDistractors, similarity } from '../distractors.ts';
import type { GenContext, ImageRef, Label } from '../types.ts';

export const WRONG_ANSWERS = OPTION_COUNT - 1;

export const wholeImages = (v: Vehicle): VehicleImage[] => v.images.filter((img) => !img.detail);
export const detailImages = (v: Vehicle): VehicleImage[] => v.images.filter((img) => img.detail);

export const imageRef = (v: Vehicle, img: VehicleImage): ImageRef => ({
  vehicleId: v.id,
  file: img.file,
  view: img.view,
  detail: img.detail,
});

export const text = (value: string): Label => ({ kind: 'text', text: value });

/**
 * Vehicles that may appear as wrong answers when the user has to identify `target`:
 * distinct name and not visually identical to the target.
 */
export function nameCandidates(target: Vehicle, pool: readonly Vehicle[]): Vehicle[] {
  return pool.filter(
    (v) => v.id !== target.id && v.displayName !== target.displayName && !lookAlike(target, v),
  );
}

/**
 * Picks wrong-answer vehicles by difficulty, making sure no two options could show the same car
 * and no two options have the same name.
 */
export function pickWrongVehicles(
  target: Vehicle,
  candidates: readonly Vehicle[],
  ctx: GenContext,
  count = WRONG_ANSWERS,
): Vehicle[] {
  const ordered = pickDistractors(
    candidates,
    (c) => similarity(target, c),
    candidates.length,
    ctx.difficulty,
    ctx.rng,
  );
  const chosen: Vehicle[] = [];
  for (const c of ordered) {
    if (chosen.length === count) break;
    if (chosen.some((x) => lookAlike(x, c) || x.displayName === c.displayName)) continue;
    chosen.push(c);
  }
  return chosen;
}

/** Number of wrong answers that can be offered without look-alikes among them. */
export function distinctCount(candidates: readonly Vehicle[]): number {
  const chosen: Vehicle[] = [];
  for (const c of candidates) {
    if (!chosen.some((x) => lookAlike(x, c) || x.displayName === c.displayName)) chosen.push(c);
  }
  return chosen.length;
}
