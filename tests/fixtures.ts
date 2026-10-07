/**
 * Fictional test data ("Testwagen"). Deliberately not real vehicles: tests must not depend on
 * the content package and must not suggest real technical data.
 */
import type { RawPackage } from '../src/content/validate.ts';
import { vehicleSchema, type Vehicle } from '../src/content/schema.ts';

type VehicleInput = Partial<Vehicle> & Pick<Vehicle, 'id'>;

const image = (file: string, view = 'front-three-quarter', detail = false) => ({
  file,
  view,
  detail,
  source: 'Testquelle',
  license: 'CC0',
});

/** Raw JSON for one fictional vehicle, before schema defaults. */
export function rawVehicle(input: VehicleInput): Record<string, unknown> {
  return {
    displayName: `Testwagen ${input.id}`,
    series: input.id.split('-')[0],
    family: 'saloon',
    bodyStyle: 'saloon',
    powertrain: 'combustion',
    subBrand: 'base',
    status: 'current',
    collections: ['current'],
    images: [
      image(`${input.id}-front-three-quarter.svg`),
      image(`${input.id}-rear-detail.svg`, 'rear', true),
    ],
    verified: false,
    ...input,
  };
}

export function vehicle(input: VehicleInput): Vehicle {
  return vehicleSchema.parse(rawVehicle(input));
}

/** Six fictional vehicles covering families, body styles, powertrains and sub-brands. */
export function sampleVehicles(): Vehicle[] {
  return [
    vehicle({
      id: 'alpha-saloon',
      series: 'Alpha',
      modelCode: 'A1',
      similarTo: ['beta-saloon'],
      engines: [
        { name: 'Alpha 100', fuel: 'petrol', powerKw: 100, powerPs: 136 },
        { name: 'Alpha 200', fuel: 'petrol', powerKw: 150, powerPs: 204 },
      ],
      features: [
        { area: 'rear', text: 'Runde Rückleuchten' },
        { area: 'front', text: 'Großer Grill' },
      ],
    }),
    vehicle({
      id: 'alpha-estate',
      series: 'Alpha',
      family: 'estate',
      bodyStyle: 'estate',
      modelCode: 'A2',
      engines: [{ name: 'Alpha 200 Kombi', fuel: 'diesel', powerKw: 140, powerPs: 190 }],
    }),
    vehicle({
      id: 'beta-saloon',
      series: 'Beta',
      modelCode: 'B1',
      engines: [{ name: 'Beta 300', fuel: 'petrol', powerKw: 220, powerPs: 299 }],
    }),
    vehicle({
      id: 'gamma-suv',
      series: 'Gamma',
      family: 'suv',
      bodyStyle: 'suv',
      modelCode: 'G1',
      similarTo: ['gamma-suv-e'],
    }),
    vehicle({
      id: 'gamma-suv-e',
      series: 'Gamma',
      family: 'suv',
      bodyStyle: 'suv',
      powertrain: 'electric',
      modelCode: 'G2',
      engines: [{ name: 'Gamma E', fuel: 'electric', powerKw: 300, powerPs: 408 }],
    }),
    vehicle({
      id: 'delta-roadster',
      series: 'Delta',
      family: 'convertible',
      bodyStyle: 'roadster',
      subBrand: 'sport',
      modelCode: 'D1',
      engines: [{ name: 'Delta S', fuel: 'petrol', powerKw: 400, powerPs: 544 }],
    }),
  ];
}

export function rawBrand(): Record<string, unknown> {
  return {
    id: 'testbrand',
    name: 'Testmarke',
    families: [
      { id: 'saloon', label: 'Limousinen' },
      { id: 'estate', label: 'Kombis' },
      { id: 'suv', label: 'SUVs' },
      { id: 'convertible', label: 'Offene' },
    ],
    bodyStyles: [
      { id: 'saloon', label: 'Limousine' },
      { id: 'estate', label: 'Kombi' },
      { id: 'suv', label: 'SUV' },
      { id: 'roadster', label: 'Roadster' },
      { id: 'coupe', label: 'Coupé' },
    ],
    subBrands: [
      { id: 'base', label: 'Basis' },
      { id: 'sport', label: 'Sport' },
    ],
  };
}

export function rawTrack(): Record<string, unknown> {
  return {
    collection: 'current',
    title: 'Aktuell',
    levels: [
      { id: 'basics', title: 'Basis', generators: ['image-to-name'], difficulty: 1 },
      {
        id: 'advanced',
        title: 'Fortgeschritten',
        generators: ['image-to-name'],
        difficulty: 3,
        unlockAfter: ['basics'],
      },
    ],
  };
}

/** A complete, valid raw package. Tests break one thing at a time. */
export function rawPackage(): RawPackage {
  const vehicles = sampleVehicles().map((v) => rawVehicle(v));
  return {
    folder: 'testbrand',
    brand: rawBrand(),
    vehicles,
    levelFiles: { 'current.json': rawTrack() },
    imageFiles: sampleVehicles().flatMap((v) => v.images.map((i) => i.file)),
  };
}
