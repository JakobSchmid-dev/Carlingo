/**
 * Loads all content packages in the app. Vite collects every folder below content/ at build time,
 * so a new brand, levels file or image needs no code change.
 */
import { generatorList } from '../engine/generators/index.ts';
import type { ContentIssue } from './issues.ts';
import type { ContentPackage } from './model.ts';
import { validatePackage, type RawPackage } from './validate.ts';

const brandFiles = import.meta.glob<unknown>('/content/*/brand.json', {
  eager: true,
  import: 'default',
});
const vehicleFiles = import.meta.glob<unknown>('/content/*/vehicles.json', {
  eager: true,
  import: 'default',
});
const levelFiles = import.meta.glob<unknown>('/content/*/levels/*.json', {
  eager: true,
  import: 'default',
});
const imageFiles = import.meta.glob<string>('/content/*/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const PATH = /^\/content\/([^/]+)\/(?:levels\/|images\/)?([^/]+)$/;

function split(path: string): { folder: string; name: string } {
  const match = PATH.exec(path);
  if (!match?.[1] || !match[2]) throw new Error(`Unerwarteter Inhaltspfad: ${path}`);
  return { folder: match[1], name: match[2] };
}

export interface LoadedContent {
  packages: ContentPackage[];
  issues: ContentIssue[];
}

function collectRawPackages(): Map<string, RawPackage & { urls: Record<string, string> }> {
  const raws = new Map<string, RawPackage & { urls: Record<string, string> }>();
  const get = (folder: string) => {
    let raw = raws.get(folder);
    if (!raw) {
      raw = {
        folder,
        brand: undefined,
        vehicles: undefined,
        levelFiles: {},
        imageFiles: [],
        urls: {},
      };
      raws.set(folder, raw);
    }
    return raw;
  };
  for (const [path, data] of Object.entries(brandFiles)) get(split(path).folder).brand = data;
  for (const [path, data] of Object.entries(vehicleFiles)) get(split(path).folder).vehicles = data;
  for (const [path, data] of Object.entries(levelFiles)) {
    const { folder, name } = split(path);
    get(folder).levelFiles[name] = data;
  }
  for (const [path, url] of Object.entries(imageFiles)) {
    const { folder, name } = split(path);
    const raw = get(folder);
    raw.imageFiles.push(name);
    raw.urls[name] = url;
  }
  return raws;
}

let cached: LoadedContent | undefined;

export function loadContent(): LoadedContent {
  if (cached) return cached;
  const packages: ContentPackage[] = [];
  const issues: ContentIssue[] = [];
  for (const raw of collectRawPackages().values()) {
    const result = validatePackage(raw, generatorList, (file) => raw.urls[file] ?? file);
    issues.push(...result.issues);
    if (result.pkg) packages.push(result.pkg);
  }
  packages.sort((a, b) => a.brand.name.localeCompare(b.brand.name, 'de'));
  cached = { packages, issues };
  return cached;
}
