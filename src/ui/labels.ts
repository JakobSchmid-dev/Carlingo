/**
 * Turns engine labels and content ids into visible German text.
 */
import type { ContentPackage } from '../content/model.ts';
import type { Label } from '../engine/types.ts';
import { de } from '../i18n/de.ts';

export function labelText(label: Label | undefined, pkg: ContentPackage): string {
  if (!label) return '';
  switch (label.kind) {
    case 'text':
      return label.text;
    case 'powertrain':
      return de.powertrain[label.value];
    case 'bodyStyle':
      return bodyStyleLabel(pkg, label.id);
  }
}

export const bodyStyleLabel = (pkg: ContentPackage, id: string) =>
  pkg.brand.bodyStyles.find((b) => b.id === id)?.label ?? id;

export const familyLabel = (pkg: ContentPackage, id: string) =>
  pkg.brand.families.find((f) => f.id === id)?.label ?? id;

export const subBrandLabel = (pkg: ContentPackage, id: string) =>
  pkg.brand.subBrands.find((s) => s.id === id)?.label ?? id;

export const imageUrl = (pkg: ContentPackage, file: string) => pkg.imageUrls[file] ?? '';
