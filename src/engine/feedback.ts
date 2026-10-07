/**
 * Feedback after an answer: a recognition feature, preferably one that fits the view shown.
 */
import type { FeatureArea, ImageView, Vehicle, VehicleFeature } from '../content/schema.ts';

const AREAS_FOR_VIEW: Record<ImageView, FeatureArea[]> = {
  front: ['front'],
  rear: ['rear'],
  side: ['side'],
  'front-three-quarter': ['front', 'side'],
  'rear-three-quarter': ['rear', 'side'],
  interior: ['interior'],
};

export function pickFeature(
  vehicle: Vehicle,
  shownView: ImageView | undefined,
): VehicleFeature | undefined {
  const preferred = [...(shownView ? AREAS_FOR_VIEW[shownView] : []), 'general'];
  for (const area of preferred) {
    const match = vehicle.features.find((f) => f.area === area);
    if (match) return match;
  }
  return vehicle.features[0];
}
