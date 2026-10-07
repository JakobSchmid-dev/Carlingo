/**
 * Validates one content package (one brand folder) and builds the runtime model from it.
 *
 * Pure function: the caller reads files (Node script or Vite glob) and passes the parsed JSON
 * plus the list of image files. Used by `npm run validate`, the build and the app itself.
 */
import { zodIssues, type ContentIssue } from './issues.ts';
import { levelPool, trackId, type ContentPackage, type Track } from './model.ts';
import {
  brandSchema,
  POWERTRAINS,
  STATUSES,
  trackFileSchema,
  vehiclesFileSchema,
  type Brand,
  type FilterableField,
  type Vehicle,
} from './schema.ts';

/** Marks a file that exists but could not be parsed as JSON (already reported by the reader). */
export const UNREADABLE = Symbol('unreadable');

/** A level needs one correct and three wrong answers. */
export const MIN_POOL_SIZE = 4;
const KW_TO_PS = 1.35962;

export interface RawPackage {
  /** Folder name below content/, must equal brand.id. */
  folder: string;
  /** Parsed JSON, or undefined when the file is missing. */
  brand: unknown;
  vehicles: unknown;
  /** File name (e.g. `current.json`) → parsed JSON. */
  levelFiles: Record<string, unknown>;
  /** File names found in the images folder. */
  imageFiles: string[];
}

/** What the validator needs to know about question generators. */
export interface GeneratorCheck {
  id: string;
  canGenerate(vehicle: Vehicle, pool: Vehicle[]): boolean;
}

export interface ValidationResult {
  /** Only set when there are no errors. */
  pkg?: ContentPackage;
  issues: ContentIssue[];
}

const quote = (s: string) => `"${s}"`;
const list = (items: readonly string[]) => items.map(quote).join(', ');

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) (seen.has(v) ? dups : seen).add(v);
  return [...dups];
}

function rawEntryId(raw: unknown, index: number): string | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entry: unknown = raw[index];
  if (entry && typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string') {
    return entry.id;
  }
  return undefined;
}

export function validatePackage(
  raw: RawPackage,
  generators: readonly GeneratorCheck[],
  imageUrl: (file: string) => string,
): ValidationResult {
  const dir = `content/${raw.folder}`;
  const brandFile = `${dir}/brand.json`;
  const vehiclesFile = `${dir}/vehicles.json`;
  const issues: ContentIssue[] = [];
  const error = (file: string, message: string, entity?: string, field?: string) =>
    issues.push({
      severity: 'error',
      file,
      message,
      ...(entity ? { entity } : {}),
      ...(field ? { field } : {}),
    });
  const warn = (file: string, message: string, entity?: string) =>
    issues.push({ severity: 'warning', file, message, ...(entity ? { entity } : {}) });

  // --- brand.json -------------------------------------------------------------------------
  let brand: Brand | undefined;
  if (raw.brand === UNREADABLE) {
    // syntax error already reported
  } else if (raw.brand === undefined) {
    error(brandFile, 'Datei fehlt. Jede Marke braucht eine brand.json.');
  } else {
    const parsed = brandSchema.safeParse(raw.brand);
    if (parsed.success) {
      brand = parsed.data;
      if (brand.id !== raw.folder) {
        error(
          brandFile,
          `Die ID ${quote(brand.id)} muss genauso heißen wie der Ordner ${quote(raw.folder)}.`,
          undefined,
          'id',
        );
      }
      for (const key of ['families', 'bodyStyles', 'subBrands'] as const) {
        for (const dup of duplicates(brand[key].map((e) => e.id))) {
          error(brandFile, `Die ID ${quote(dup)} kommt mehrfach vor.`, undefined, key);
        }
      }
    } else {
      issues.push(...zodIssues(parsed.error, brandFile, () => ({ consumed: 0 })));
    }
  }

  // --- vehicles.json ----------------------------------------------------------------------
  let vehicles: Vehicle[] | undefined;
  if (raw.vehicles === UNREADABLE) {
    // syntax error already reported
  } else if (raw.vehicles === undefined) {
    error(vehiclesFile, 'Datei fehlt. Jede Marke braucht eine vehicles.json.');
  } else {
    const parsed = vehiclesFileSchema.safeParse(raw.vehicles);
    if (parsed.success) {
      vehicles = parsed.data;
    } else {
      issues.push(
        ...zodIssues(parsed.error, vehiclesFile, (path) => {
          if (typeof path[0] !== 'number') return { consumed: 0 };
          const vid = rawEntryId(raw.vehicles, path[0]);
          return {
            entity: vid ? `Fahrzeug ${quote(vid)}` : `Fahrzeug Nr. ${path[0] + 1}`,
            consumed: 1,
          };
        }),
      );
    }
  }

  if (vehicles && brand) checkVehicles(vehicles, brand, raw.imageFiles, vehiclesFile, error);

  // --- images/ ----------------------------------------------------------------------------
  if (vehicles) {
    const used = new Set(vehicles.flatMap((v) => v.images.map((img) => img.file)));
    for (const file of raw.imageFiles) {
      if (!used.has(file)) {
        error(
          `${dir}/images/${file}`,
          'Bild wird von keinem Fahrzeug verwendet. Eintragen oder Datei löschen.',
        );
      }
    }
  }

  // --- levels/*.json ----------------------------------------------------------------------
  const tracks: Track[] = [];
  let brokenLevelFile = false;
  const levelFileNames = Object.keys(raw.levelFiles).sort();
  if (levelFileNames.length === 0) {
    error(`${dir}/levels/`, 'Keine Level-Datei gefunden. Jede Sparte braucht eine Datei.');
  }
  for (const name of levelFileNames) {
    const file = `${dir}/levels/${name}`;
    const rawTrack = raw.levelFiles[name];
    if (rawTrack === UNREADABLE) {
      brokenLevelFile = true;
      continue;
    }
    const parsed = trackFileSchema.safeParse(rawTrack);
    if (!parsed.success) {
      brokenLevelFile = true;
      const rawLevels =
        rawTrack && typeof rawTrack === 'object' && 'levels' in rawTrack
          ? rawTrack.levels
          : undefined;
      issues.push(
        ...zodIssues(parsed.error, file, (path) => {
          if (path[0] !== 'levels' || typeof path[1] !== 'number') return { consumed: 0 };
          const lid = rawEntryId(rawLevels, path[1]);
          return {
            entity: lid ? `Level ${quote(lid)}` : `Level Nr. ${path[1] + 1}`,
            consumed: 2,
          };
        }),
      );
      continue;
    }
    const track: Track = {
      id: trackId(raw.folder, parsed.data.collection),
      brandId: raw.folder,
      collection: parsed.data.collection,
      title: parsed.data.title,
      levels: parsed.data.levels,
      file,
      ...(parsed.data.description ? { description: parsed.data.description } : {}),
    };
    tracks.push(track);
  }

  for (const dup of duplicates(tracks.map((t) => t.collection))) {
    const files = tracks.filter((t) => t.collection === dup).map((t) => t.file);
    error(
      files[0] ?? dir,
      `Die Sammlung ${quote(dup)} hat mehrere Level-Dateien (${files.join(', ')}). Pro Sparte genau eine Datei.`,
    );
  }
  const allLevels = tracks.flatMap((t) => t.levels.map((l) => ({ track: t, level: l })));
  for (const dup of duplicates(allLevels.map((x) => x.level.id))) {
    const where = allLevels.filter((x) => x.level.id === dup).map((x) => x.track.file);
    error(where[0] ?? dir, `Die Level-ID ${quote(dup)} kommt mehrfach vor.`, `Level ${quote(dup)}`);
  }

  if (vehicles && brand) {
    for (const track of tracks) {
      checkTrack(track, vehicles, brand, generators, error);
    }
    for (const v of brokenLevelFile ? [] : vehicles) {
      if (!v.collections.some((c) => tracks.some((t) => t.collection === c))) {
        warn(
          vehiclesFile,
          `gehört zu keiner Sparte mit Level-Datei (collections: ${list(v.collections)}) und erscheint daher nirgends.`,
          `Fahrzeug ${quote(v.id)}`,
        );
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  if (hasErrors || !brand || !vehicles) return { issues };

  const imageUrls = Object.fromEntries(raw.imageFiles.map((f) => [f, imageUrl(f)]));
  return { pkg: { brand, vehicles, tracks, imageUrls }, issues };
}

type ErrorFn = (file: string, message: string, entity?: string, field?: string) => void;

function checkVehicles(
  vehicles: Vehicle[],
  brand: Brand,
  imageFiles: string[],
  file: string,
  error: ErrorFn,
) {
  const ids = new Set(vehicles.map((v) => v.id));
  const families = brand.families.map((f) => f.id);
  const bodyStyles = brand.bodyStyles.map((b) => b.id);
  const subBrands = brand.subBrands.map((s) => s.id);
  const files = new Set(imageFiles);
  const imageOwner = new Map<string, string>();

  for (const dup of duplicates(vehicles.map((v) => v.id))) {
    error(
      file,
      'Diese ID kommt mehrfach vor. Jede Fahrzeug-ID muss eindeutig sein.',
      `Fahrzeug ${quote(dup)}`,
      'id',
    );
  }
  for (const dup of duplicates(vehicles.map((v) => v.displayName))) {
    const owners = vehicles.filter((v) => v.displayName === dup).map((v) => v.id);
    error(
      file,
      `Der Name ${quote(dup)} wird von mehreren Fahrzeugen verwendet (${list(owners)}). Antwortmöglichkeiten wären nicht unterscheidbar.`,
      `Fahrzeug ${quote(owners[1] ?? dup)}`,
      'displayName',
    );
  }

  for (const v of vehicles) {
    const entity = `Fahrzeug ${quote(v.id)}`;
    const ref = (field: string, value: string, allowed: string[], where: string) => {
      if (!allowed.includes(value)) {
        error(
          file,
          `${quote(value)} gibt es nicht. Erlaubt sind (aus ${where}): ${list(allowed)}.`,
          entity,
          field,
        );
      }
    };
    ref('family', v.family, families, 'brand.json → families');
    ref('bodyStyle', v.bodyStyle, bodyStyles, 'brand.json → bodyStyles');
    ref('subBrand', v.subBrand, subBrands, 'brand.json → subBrands');

    v.similarTo.forEach((other, i) => {
      if (other === v.id)
        error(file, 'Ein Fahrzeug kann nicht sich selbst ähnlich sein.', entity, `similarTo[${i}]`);
      else if (!ids.has(other))
        error(file, `Es gibt kein Fahrzeug mit der ID ${quote(other)}.`, entity, `similarTo[${i}]`);
    });

    v.images.forEach((img, i) => {
      if (!files.has(img.file)) {
        error(
          file,
          `Die Bilddatei ${quote(img.file)} fehlt im Ordner images/.`,
          entity,
          `images[${i}].file`,
        );
      }
      const owner = imageOwner.get(img.file);
      if (owner) {
        error(
          file,
          `Die Bilddatei ${quote(img.file)} wird schon von ${quote(owner)} verwendet.`,
          entity,
          `images[${i}].file`,
        );
      } else {
        imageOwner.set(img.file, v.id);
      }
    });
    if (!v.images.some((img) => !img.detail)) {
      error(
        file,
        'braucht mindestens ein Gesamtbild (ein Bild mit "detail": false).',
        entity,
        'images',
      );
    }

    const p = v.production;
    if (p?.from !== undefined && p.to != null && p.to < p.from) {
      error(file, `Bauende ${p.to} liegt vor Baubeginn ${p.from}.`, entity, 'production.to');
    }
    p?.faceliftYears.forEach((y, i) => {
      if ((p.from !== undefined && y < p.from) || (p.to != null && y > p.to)) {
        error(
          file,
          `Facelift-Jahr ${y} liegt außerhalb der Bauzeit.`,
          entity,
          `production.faceliftYears[${i}]`,
        );
      }
    });

    v.engines.forEach((e, i) => {
      if (e.powerKw !== undefined && e.powerPs !== undefined) {
        const expected = Math.round(e.powerKw * KW_TO_PS);
        if (Math.abs(expected - e.powerPs) > 1) {
          error(
            file,
            `${e.powerKw} kW entsprechen etwa ${expected} PS, eingetragen sind ${e.powerPs} PS. Tippfehler?`,
            entity,
            `engines[${i}].powerPs`,
          );
        }
      }
    });
    for (const dup of duplicates(v.engines.map((e) => e.name))) {
      error(file, `Die Motorisierung ${quote(dup)} ist doppelt eingetragen.`, entity, 'engines');
    }
  }
}

function checkTrack(
  track: Track,
  vehicles: Vehicle[],
  brand: Brand,
  generators: readonly GeneratorCheck[],
  error: ErrorFn,
) {
  const file = track.file;
  const levelIds = new Set(track.levels.map((l) => l.id));
  const generatorIds = generators.map((g) => g.id);
  const inCollection = vehicles.filter((v) => v.collections.includes(track.collection));

  if (inCollection.length === 0) {
    error(
      file,
      `Kein Fahrzeug gehört zur Sammlung ${quote(track.collection)}. In vehicles.json bei "collections" eintragen.`,
      undefined,
      'collection',
    );
  }

  const allowedValues: Partial<Record<FilterableField, readonly string[]>> = {
    family: brand.families.map((f) => f.id),
    bodyStyle: brand.bodyStyles.map((b) => b.id),
    subBrand: brand.subBrands.map((s) => s.id),
    powertrain: POWERTRAINS,
    status: STATUSES,
  };

  for (const level of track.levels) {
    const entity = `Level ${quote(level.id)}`;

    level.unlockAfter.forEach((other, i) => {
      if (other === level.id)
        error(file, 'Ein Level kann nicht auf sich selbst warten.', entity, `unlockAfter[${i}]`);
      else if (!levelIds.has(other))
        error(
          file,
          `Es gibt in dieser Sparte kein Level mit der ID ${quote(other)}.`,
          entity,
          `unlockAfter[${i}]`,
        );
    });

    level.generators.forEach((g, i) => {
      if (!generatorIds.includes(g)) {
        error(
          file,
          `Den Fragetyp ${quote(g)} gibt es nicht. Erlaubt sind: ${list(generatorIds)}.`,
          entity,
          `generators[${i}]`,
        );
      }
    });

    let filterOk = true;
    for (const [field, values] of Object.entries(level.filter)) {
      if (!values) continue;
      const allowed = allowedValues[field as FilterableField];
      for (const value of values) {
        const known = allowed
          ? allowed.includes(value)
          : inCollection.some((v) => {
              const fieldValue = v[field as FilterableField];
              return Array.isArray(fieldValue) ? fieldValue.includes(value) : fieldValue === value;
            });
        if (!known) {
          filterOk = false;
          error(
            file,
            allowed
              ? `${quote(value)} ist kein gültiger Wert. Erlaubt sind: ${list(allowed)}.`
              : `${quote(value)} passt auf kein Fahrzeug dieser Sparte. Tippfehler?`,
            entity,
            `filter.${field}`,
          );
        }
      }
    }
    if (!filterOk) continue;

    const pool = levelPool(vehicles, track, level);
    if (pool.length < MIN_POOL_SIZE) {
      error(
        file,
        `Der Filter ergibt nur ${pool.length} Fahrzeug(e)${pool.length ? ` (${list(pool.map((v) => v.id))})` : ''}. Für eine richtige und drei falsche Antworten braucht ein Level mindestens ${MIN_POOL_SIZE}.`,
        entity,
        'filter',
      );
      continue;
    }
    for (const g of generators) {
      if (!level.generators.includes(g.id)) continue;
      if (!pool.some((v) => g.canGenerate(v, pool))) {
        error(
          file,
          `Der Fragetyp ${quote(g.id)} kann mit den Fahrzeugen dieses Levels keine einzige Frage bilden. Fehlen Angaben (z. B. Baureihe, Motoren, Detailbilder) oder gibt es zu wenige passende Fahrzeuge?`,
          entity,
          'generators',
        );
      }
    }
  }

  const cycle = findCycle(track.levels.map((l) => ({ id: l.id, deps: l.unlockAfter })));
  if (cycle) {
    error(
      file,
      `Die Levels warten im Kreis aufeinander: ${cycle.join(' → ')}. So kann keines freigeschaltet werden.`,
      undefined,
      'unlockAfter',
    );
  }
}

/** Returns one cycle as a list of ids (first id repeated at the end), or undefined. */
export function findCycle(nodes: { id: string; deps: string[] }[]): string[] | undefined {
  const deps = new Map(nodes.map((n) => [n.id, n.deps]));
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (id: string): string[] | undefined => {
    if (state.get(id) === 'done') return undefined;
    if (state.get(id) === 'visiting') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'visiting');
    stack.push(id);
    for (const dep of deps.get(id) ?? []) {
      if (!deps.has(dep)) continue;
      const found = visit(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return undefined;
  };

  for (const n of nodes) {
    const found = visit(n.id);
    if (found) return found;
  }
  return undefined;
}
