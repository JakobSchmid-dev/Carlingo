/**
 * Registry of all question types. A new question type is a new module plus one entry here
 * (and its prompt text in src/i18n/de.ts).
 */
import type { QuestionGenerator } from '../types.ts';
import { bodyStyle } from './body-style.ts';
import { detailToName } from './detail-to-name.ts';
import { imageToName } from './image-to-name.ts';
import { modelCode } from './model-code.ts';
import { nameToImage } from './name-to-image.ts';
import { powerCompare } from './power-compare.ts';
import { powertrain } from './powertrain.ts';

export const generatorList: readonly QuestionGenerator[] = [
  imageToName,
  nameToImage,
  detailToName,
  powertrain,
  bodyStyle,
  modelCode,
  powerCompare,
];

export const generators: Readonly<Record<string, QuestionGenerator>> = Object.fromEntries(
  generatorList.map((g) => [g.id, g]),
);
