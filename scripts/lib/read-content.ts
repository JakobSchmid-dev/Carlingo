/**
 * Reads all content packages from disk (Node only). JSON syntax errors become readable issues.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentIssue } from '../../src/content/issues.ts';
import { UNREADABLE, type RawPackage } from '../../src/content/validate.ts';

export const CONTENT_DIR = join(import.meta.dirname, '..', '..', 'content');

function lineAndColumn(source: string, message: string): string {
  const pos = /position (\d+)/.exec(message);
  if (!pos?.[1]) return '';
  const before = source.slice(0, Number(pos[1]));
  const line = before.split('\n').length;
  const column = before.length - before.lastIndexOf('\n');
  return ` (Zeile ${line}, Spalte ${column})`;
}

function readJson(path: string, relative: string, issues: ContentIssue[]): unknown {
  if (!existsSync(path)) return undefined;
  const source = readFileSync(path, 'utf8');
  try {
    return JSON.parse(source) as unknown;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    issues.push({
      severity: 'error',
      file: relative,
      message: `ist kein gültiges JSON${lineAndColumn(source, message)}. Häufige Ursachen: fehlendes oder überzähliges Komma, fehlende Anführungszeichen. Technische Meldung: ${message}`,
    });
    return UNREADABLE;
  }
}

export interface ReadResult {
  packages: RawPackage[];
  /** JSON syntax errors; such files are passed on as UNREADABLE. */
  issues: ContentIssue[];
}

export function readContent(contentDir = CONTENT_DIR): ReadResult {
  const issues: ContentIssue[] = [];
  const packages: RawPackage[] = [];
  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = entry.name;
    const dir = join(contentDir, folder);
    const rel = `content/${folder}`;
    const levelsDir = join(dir, 'levels');
    const imagesDir = join(dir, 'images');
    const levelFiles: Record<string, unknown> = {};
    if (existsSync(levelsDir)) {
      for (const name of readdirSync(levelsDir)) {
        if (name.endsWith('.json')) {
          levelFiles[name] = readJson(join(levelsDir, name), `${rel}/levels/${name}`, issues);
        }
      }
    }
    packages.push({
      folder,
      brand: readJson(join(dir, 'brand.json'), `${rel}/brand.json`, issues),
      vehicles: readJson(join(dir, 'vehicles.json'), `${rel}/vehicles.json`, issues),
      levelFiles,
      imageFiles: existsSync(imagesDir)
        ? readdirSync(imagesDir).filter((n) => !n.startsWith('.'))
        : [],
    });
  }
  return { packages, issues };
}
