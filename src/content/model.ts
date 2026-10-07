/**
 * Runtime model of loaded content packages and pure helpers on top of it.
 */
import type { Brand, Level, LevelFilter, Vehicle } from './schema.ts';

/** A "Sparte": one collection of a brand with its own learning path. */
export interface Track {
  /** Globally unique: `${brandId}/${collection}` */
  id: string;
  brandId: string;
  collection: string;
  title: string;
  description?: string;
  levels: Level[];
  /** Name of the levels file, for error messages. */
  file: string;
}

export interface ContentPackage {
  brand: Brand;
  vehicles: Vehicle[];
  tracks: Track[];
  /** Maps image file name → URL usable by the UI (or a path in Node). */
  imageUrls: Record<string, string>;
}

export function trackId(brandId: string, collection: string): string {
  return `${brandId}/${collection}`;
}

function fieldValues(vehicle: Vehicle, field: keyof LevelFilter): string[] {
  const value = vehicle[field];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** A vehicle matches when, for every filter field, one of its values is in the allowed list. */
export function matchesFilter(vehicle: Vehicle, filter: LevelFilter): boolean {
  return Object.entries(filter).every(([field, allowed]) => {
    if (!allowed) return true;
    const values = fieldValues(vehicle, field as keyof LevelFilter);
    return values.some((v) => allowed.includes(v));
  });
}

/** The vehicles a level draws its questions and wrong answers from. */
export function levelPool(vehicles: Vehicle[], track: Track, level: Level): Vehicle[] {
  return vehicles.filter(
    (v) => v.collections.includes(track.collection) && matchesFilter(v, level.filter),
  );
}

/** All vehicles that belong to a track (its collection). */
export function trackVehicles(vehicles: Vehicle[], track: Track): Vehicle[] {
  return vehicles.filter((v) => v.collections.includes(track.collection));
}

export function mainImage(vehicle: Vehicle) {
  return vehicle.images.find((img) => !img.detail) ?? vehicle.images[0];
}
