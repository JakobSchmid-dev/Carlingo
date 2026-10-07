/**
 * npm run placeholders
 *
 * Creates a placeholder SVG for every image listed in content/<brand>/vehicles.json that ends in
 * .svg and does not exist yet. Existing files are never overwritten.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { placeholderSvg } from './lib/placeholder-svg.ts';

const contentDir = join(import.meta.dirname, '..', 'content');
let created = 0;

for (const brand of readdirSync(contentDir, { withFileTypes: true })) {
  if (!brand.isDirectory()) continue;
  const vehiclesPath = join(contentDir, brand.name, 'vehicles.json');
  if (!existsSync(vehiclesPath)) continue;
  const vehicles = JSON.parse(readFileSync(vehiclesPath, 'utf8')) as {
    id: string;
    bodyStyle: string;
    images?: { file: string; view: string; detail?: boolean }[];
  }[];
  const imagesDir = join(contentDir, brand.name, 'images');
  mkdirSync(imagesDir, { recursive: true });
  for (const v of vehicles) {
    for (const img of v.images ?? []) {
      if (!img.file.endsWith('.svg')) continue;
      const target = join(imagesDir, img.file);
      if (existsSync(target)) continue;
      writeFileSync(
        target,
        placeholderSvg({
          vehicleId: v.id,
          bodyStyle: v.bodyStyle,
          view: img.view,
          detail: img.detail ?? false,
        }),
      );
      console.log(`+ content/${brand.name}/images/${img.file}`);
      created++;
    }
  }
}
console.log(created ? `${created} Platzhalter erzeugt.` : 'Alle Bilder vorhanden, nichts zu tun.');
