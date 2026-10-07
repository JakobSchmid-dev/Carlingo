/**
 * npm run validate
 *
 * Checks every content package below content/ and prints problems in plain German.
 * Exits with code 1 if there is at least one error. Runs before every build and in CI.
 */
import { formatIssue, type ContentIssue } from '../src/content/issues.ts';
import { validatePackage } from '../src/content/validate.ts';
import { generatorList } from '../src/engine/generators/index.ts';
import { readContent } from './lib/read-content.ts';

export function validateAll(contentDir?: string): {
  issues: ContentIssue[];
  summary: string[];
} {
  const { packages, issues } = readContent(contentDir);
  const summary: string[] = [];
  for (const raw of packages) {
    const result = validatePackage(
      raw,
      generatorList,
      (file) => `content/${raw.folder}/images/${file}`,
    );
    issues.push(...result.issues);
    if (result.pkg) {
      const { vehicles, tracks } = result.pkg;
      const unverified = vehicles.filter((v) => !v.verified).length;
      summary.push(
        `${result.pkg.brand.name}: ${vehicles.length} Fahrzeuge (${unverified} ungeprüft), ` +
          `${tracks.length} Sparte(n), ${tracks.reduce((n, t) => n + t.levels.length, 0)} Level`,
      );
    }
  }
  return { issues, summary };
}

if (import.meta.main) {
  const { issues, summary } = validateAll();
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  for (const w of warnings) console.warn(`⚠ Hinweis: ${formatIssue(w)}`);
  for (const e of errors) console.error(`✗ Fehler: ${formatIssue(e)}`);
  if (errors.length > 0) {
    console.error(
      `\nInhalte ungültig: ${errors.length} Fehler. Bitte die genannten Stellen korrigieren und erneut "npm run validate" ausführen.`,
    );
    process.exit(1);
  }
  for (const line of summary) console.log(`✓ ${line}`);
  console.log('Inhalte gültig.');
}
