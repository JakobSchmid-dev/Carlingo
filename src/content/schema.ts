/**
 * Zod schemas for content packages – the single source of truth for the data model.
 * All TypeScript types for content are derived from these schemas.
 *
 * Enumerations that are the same for every brand (powertrain, status, views, feature areas) live
 * here. Everything brand-specific (families, body styles, sub-brands) is defined in brand.json, so
 * a new brand never requires a code change.
 */
import { z } from 'zod';

export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const id = z.string().regex(ID_PATTERN, {
  error: 'muss eine ID aus Kleinbuchstaben, Ziffern und Bindestrichen sein (z. B. "glc-suv-x254")',
});
const text = z.string().trim().min(1, { error: 'darf nicht leer sein' });

/** A custom message for wrong values that still says "missing" when the field is absent. */
const msg = (message: string) => (issue: { input?: unknown }) =>
  issue.input === undefined ? 'fehlt, ist aber ein Pflichtfeld' : message;

export const POWERTRAINS = ['combustion', 'plug-in-hybrid', 'electric'] as const;
export const STATUSES = ['current', 'phasing-out', 'discontinued'] as const;
export const FEATURE_AREAS = ['front', 'rear', 'side', 'interior', 'general'] as const;
export const IMAGE_VIEWS = [
  'front',
  'rear',
  'side',
  'front-three-quarter',
  'rear-three-quarter',
  'interior',
] as const;
export const FUELS = ['petrol', 'diesel', 'electric'] as const;
export const IMAGE_EXTENSIONS = ['svg', 'jpg', 'jpeg', 'png', 'webp', 'avif'] as const;

export type Powertrain = (typeof POWERTRAINS)[number];
export type Status = (typeof STATUSES)[number];
export type FeatureArea = (typeof FEATURE_AREAS)[number];
export type ImageView = (typeof IMAGE_VIEWS)[number];
export type Fuel = (typeof FUELS)[number];

const labelled = z.strictObject({ id, label: text });

export const brandSchema = z.strictObject({
  id,
  name: text,
  families: z.array(labelled).min(1, { error: 'braucht mindestens eine Familie' }),
  bodyStyles: z.array(labelled).min(1, { error: 'braucht mindestens eine Karosserieform' }),
  subBrands: z.array(labelled).min(1, { error: 'braucht mindestens eine Submarke' }),
  glossary: z.array(z.strictObject({ term: text, text })).default([]),
});

const year = z
  .number({ error: msg('muss eine Jahreszahl sein') })
  .int({ error: 'muss eine ganze Jahreszahl sein' })
  .min(1886, { error: 'ist keine plausible Jahreszahl' })
  .max(2100, { error: 'ist keine plausible Jahreszahl' });

export const productionSchema = z.strictObject({
  from: year.optional(),
  to: year.nullable().optional(),
  faceliftYears: z.array(year).default([]),
});

export const featureSchema = z.strictObject({
  area: z.enum(FEATURE_AREAS),
  text,
});

export const engineSchema = z.strictObject({
  name: text,
  fuel: z.enum(FUELS),
  powerKw: z.number().positive({ error: 'muss größer als 0 sein' }).optional(),
  powerPs: z.number().positive({ error: 'muss größer als 0 sein' }).optional(),
});

export const imageSchema = z.strictObject({
  file: z.string().regex(new RegExp(`^[a-z0-9][a-z0-9-]*\\.(${IMAGE_EXTENSIONS.join('|')})$`), {
    error: `muss ein Dateiname aus Kleinbuchstaben, Ziffern und Bindestrichen mit Endung ${IMAGE_EXTENSIONS.join(', ')} sein`,
  }),
  view: z.enum(IMAGE_VIEWS),
  detail: z.boolean().default(false),
  source: text,
  author: text.optional(),
  license: text,
  /** Link to the license text, e.g. https://creativecommons.org/licenses/by-sa/4.0 */
  licenseUrl: z.url({ error: 'muss ein Link sein (https://…)' }).optional(),
});

export const vehicleSchema = z.strictObject({
  id,
  displayName: text,
  series: text,
  family: id,
  bodyStyle: id,
  powertrain: z.enum(POWERTRAINS),
  subBrand: id,
  modelCode: text.optional(),
  production: productionSchema.optional(),
  status: z.enum(STATUSES),
  collections: z.array(id).min(1, { error: 'braucht mindestens eine Sammlung (z. B. "current")' }),
  similarTo: z.array(id).default([]),
  features: z.array(featureSchema).default([]),
  engines: z.array(engineSchema).default([]),
  funFact: text.optional(),
  images: z.array(imageSchema).min(1, { error: 'braucht mindestens ein Bild' }),
  dataSources: z.array(text).default([]),
  verified: z.boolean({ error: msg('muss true oder false sein') }),
});

export const vehiclesFileSchema = z.array(vehicleSchema);

/** Vehicle fields a level filter may restrict. */
export const FILTERABLE_FIELDS = [
  'id',
  'displayName',
  'series',
  'family',
  'bodyStyle',
  'powertrain',
  'subBrand',
  'modelCode',
  'status',
  'collections',
] as const;
export type FilterableField = (typeof FILTERABLE_FIELDS)[number];

export const levelSchema = z.strictObject({
  id,
  title: text,
  description: text.optional(),
  filter: z
    .partialRecord(
      z.enum(FILTERABLE_FIELDS),
      z.array(z.string()).min(1, { error: 'braucht mindestens einen Wert' }),
    )
    .default({}),
  generators: z.array(id).min(1, { error: 'braucht mindestens einen Fragetyp' }),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    error: msg('muss 1, 2 oder 3 sein'),
  }),
  unlockAfter: z.array(id).default([]),
});

/** One levels file = one "Sparte" (track) of a brand, e.g. the current model range. */
export const trackFileSchema = z.strictObject({
  collection: id,
  title: text,
  description: text.optional(),
  levels: z.array(levelSchema).min(1, { error: 'braucht mindestens ein Level' }),
});

export type Brand = z.infer<typeof brandSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleImage = z.infer<typeof imageSchema>;
export type VehicleFeature = z.infer<typeof featureSchema>;
export type VehicleEngine = z.infer<typeof engineSchema>;
export type Level = z.infer<typeof levelSchema>;
export type LevelFilter = Level['filter'];
export type TrackFile = z.infer<typeof trackFileSchema>;
export type Difficulty = Level['difficulty'];
