import { describe, expect, it } from 'vitest';
import { rawPackage } from '../../tests/fixtures.ts';
import { formatIssue } from './issues.ts';
import { findCycle, validatePackage, type GeneratorCheck, type RawPackage } from './validate.ts';

const generators: GeneratorCheck[] = [
  { id: 'image-to-name', canGenerate: () => true },
  { id: 'model-code', canGenerate: (v) => v.modelCode !== undefined },
];

function run(
  mutate: (raw: RawPackage & { vehicles: Record<string, unknown>[] }) => void = () => {},
) {
  const raw = rawPackage() as RawPackage & { vehicles: Record<string, unknown>[] };
  mutate(raw);
  const result = validatePackage(raw, generators, (f) => `/img/${f}`);
  return {
    ...result,
    errors: result.issues.filter((i) => i.severity === 'error').map(formatIssue),
  };
}

const levels = (raw: RawPackage) =>
  (raw.levelFiles['current.json'] as { levels: Record<string, unknown>[] }).levels;

describe('validatePackage', () => {
  it('accepts a valid package and builds the model', () => {
    const { errors, pkg } = run();
    expect(errors).toEqual([]);
    expect(pkg?.vehicles).toHaveLength(6);
    expect(pkg?.tracks[0]?.id).toBe('testbrand/current');
    expect(pkg?.imageUrls['alpha-saloon-rear-detail.svg']).toBe(
      '/img/alpha-saloon-rear-detail.svg',
    );
  });

  it('names file, vehicle and field for an invalid enum value', () => {
    const { errors, pkg } = run((raw) => {
      raw.vehicles[2]!.powertrain = 'diesel';
    });
    expect(pkg).toBeUndefined();
    expect(errors).toEqual([
      'content/testbrand/vehicles.json · Fahrzeug "beta-saloon" · Feld "powertrain": hat den ungültigen Wert "diesel". Erlaubt sind: "combustion", "plug-in-hybrid", "electric"',
    ]);
  });

  it('reports missing required fields', () => {
    const { errors } = run((raw) => {
      delete raw.vehicles[0]!.verified;
    });
    expect(errors[0]).toContain('Fahrzeug "alpha-saloon" · Feld "verified"');
    expect(errors[0]).toContain('Pflichtfeld');
  });

  it('keeps checking the other vehicles when one entry is broken', () => {
    const { errors } = run((raw) => {
      delete raw.vehicles[0]!.verified;
      raw.vehicles[2]!.engines = [{ name: 'Beta 300', fuel: 'petrol', powerKw: 220, powerPs: 399 }];
    });
    expect(errors).toHaveLength(2);
    expect(errors[1]).toContain('Fahrzeug "beta-saloon" · Feld "engines[0].powerPs"');
  });

  it('reports unknown fields as possible typos', () => {
    const { errors } = run((raw) => {
      raw.vehicles[0]!.dispalyName = 'X';
    });
    expect(errors[0]).toContain('unbekannte Felder: "dispalyName"');
  });

  it('reports unknown references', () => {
    const { errors } = run((raw) => {
      raw.vehicles[0]!.family = 'kombi';
      raw.vehicles[1]!.similarTo = ['nope'];
    });
    expect(errors).toContainEqual(expect.stringContaining('Feld "family": "kombi" gibt es nicht'));
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Fahrzeug "alpha-estate" · Feld "similarTo[0]": Es gibt kein Fahrzeug mit der ID "nope"',
      ),
    );
  });

  it('reports duplicate ids and display names', () => {
    const { errors } = run((raw) => {
      raw.vehicles[1]!.id = 'alpha-saloon';
      raw.vehicles[3]!.displayName = 'Testwagen beta-saloon';
    });
    expect(errors).toContainEqual(expect.stringContaining('Diese ID kommt mehrfach vor'));
    expect(errors).toContainEqual(
      expect.stringContaining('"Testwagen beta-saloon" wird von mehreren'),
    );
  });

  it('reports missing and unused image files', () => {
    const { errors } = run((raw) => {
      raw.imageFiles = raw.imageFiles.filter((f) => f !== 'beta-saloon-rear-detail.svg');
      raw.imageFiles.push('orphan.svg');
    });
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Feld "images[1].file": Die Bilddatei "beta-saloon-rear-detail.svg" fehlt',
      ),
    );
    expect(errors).toContainEqual(
      'content/testbrand/images/orphan.svg: Bild wird von keinem Fahrzeug verwendet. Eintragen oder Datei löschen.',
    );
  });

  it('requires source and license on every image', () => {
    const { errors } = run((raw) => {
      const images = raw.vehicles[0]!.images as Record<string, unknown>[];
      delete images[0]!.license;
    });
    expect(errors[0]).toContain('Feld "images[0].license"');
  });

  it('checks kW/PS consistency', () => {
    const { errors } = run((raw) => {
      raw.vehicles[2]!.engines = [{ name: 'Beta 300', fuel: 'petrol', powerKw: 220, powerPs: 399 }];
    });
    expect(errors[0]).toContain('220 kW entsprechen etwa 299 PS, eingetragen sind 399 PS');
  });

  it('reports unknown generators, unlockAfter targets and filter values', () => {
    const { errors } = run((raw) => {
      levels(raw)[0]!.generators = ['image-to-nmae'];
      levels(raw)[1]!.unlockAfter = ['missing'];
      levels(raw)[1]!.filter = { family: ['kombi'] };
    });
    expect(errors).toContainEqual(
      expect.stringContaining(
        'Level "basics" · Feld "generators[0]": Den Fragetyp "image-to-nmae" gibt es nicht',
      ),
    );
    expect(errors).toContainEqual(
      expect.stringContaining('Level "advanced" · Feld "unlockAfter[0]"'),
    );
    expect(errors).toContainEqual(
      expect.stringContaining('Feld "filter.family": "kombi" ist kein gültiger Wert'),
    );
  });

  it('reports filter values that match no vehicle', () => {
    const { errors } = run((raw) => {
      levels(raw)[0]!.filter = { series: ['Alhpa'] };
    });
    expect(errors[0]).toContain('"Alhpa" passt auf kein Fahrzeug dieser Sparte');
  });

  it('requires enough vehicles per level for three wrong answers', () => {
    const { errors } = run((raw) => {
      levels(raw)[0]!.filter = { family: ['suv'] };
    });
    expect(errors[0]).toContain('Der Filter ergibt nur 2 Fahrzeug(e)');
  });

  it('requires every generator of a level to produce at least one question', () => {
    const { errors } = run((raw) => {
      for (const v of raw.vehicles) delete v.modelCode;
      levels(raw)[0]!.generators = ['model-code'];
    });
    expect(errors[0]).toContain(
      'Der Fragetyp "model-code" kann mit den Fahrzeugen dieses Levels keine einzige Frage bilden',
    );
  });

  it('reports cycles in unlockAfter', () => {
    const { errors } = run((raw) => {
      levels(raw)[0]!.unlockAfter = ['advanced'];
    });
    expect(errors[0]).toContain('warten im Kreis aufeinander: basics → advanced → basics');
  });

  it('requires brand id to match the folder name', () => {
    const { errors } = run((raw) => {
      raw.folder = 'other';
    });
    expect(errors).toContainEqual(
      expect.stringContaining('muss genauso heißen wie der Ordner "other"'),
    );
  });

  it('reports missing files', () => {
    const { errors } = run((raw) => {
      raw.brand = undefined;
      raw.levelFiles = {};
    });
    expect(errors).toContainEqual(
      'content/testbrand/brand.json: Datei fehlt. Jede Marke braucht eine brand.json.',
    );
    expect(errors).toContainEqual(expect.stringContaining('Keine Level-Datei gefunden'));
  });
});

describe('findCycle', () => {
  it('returns undefined for a DAG', () => {
    expect(
      findCycle([
        { id: 'a', deps: [] },
        { id: 'b', deps: ['a'] },
      ]),
    ).toBeUndefined();
  });
  it('finds a self-contained cycle', () => {
    expect(
      findCycle([
        { id: 'a', deps: ['c'] },
        { id: 'b', deps: ['a'] },
        { id: 'c', deps: ['b'] },
      ]),
    ).toEqual(['a', 'c', 'b', 'a']);
  });
});
