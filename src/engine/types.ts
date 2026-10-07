/**
 * Core types of the question engine. Pure data, no UI concerns: visible texts are either content
 * (vehicle names, engine names) or symbolic labels the UI translates via src/i18n.
 */
import type { Difficulty, ImageView, Powertrain, Vehicle } from '../content/schema.ts';
import type { Rng } from './rng.ts';

export type Skill =
  'recognize' | 'recognize-detail' | 'powertrain' | 'body-style' | 'model-code' | 'power';

export interface ImageRef {
  vehicleId: string;
  file: string;
  view: ImageView;
  detail: boolean;
}

/** A visible label: either text from the content or a value the UI translates. */
export type Label =
  | { kind: 'text'; text: string }
  | { kind: 'powertrain'; value: Powertrain }
  | { kind: 'bodyStyle'; id: string };

export interface AnswerOption {
  id: string;
  label?: Label;
  image?: ImageRef;
  /** Extra information shown after answering, e.g. power values. */
  reveal?: { powerKw?: number; powerPs?: number; vehicleName?: string };
}

/** The question kinds the UI knows how to phrase (see src/i18n/de.ts → question.prompt). */
export type PromptKind =
  | 'image-to-name'
  | 'name-to-image'
  | 'detail-to-name'
  | 'powertrain'
  | 'body-style'
  | 'model-code'
  | 'power-compare';

export interface Prompt {
  kind: PromptKind;
  image?: ImageRef;
  /** Name of the vehicle asked about, when the question shows it. */
  subject?: string;
}

export interface Question {
  generatorId: string;
  skill: Skill;
  vehicleId: string;
  prompt: Prompt;
  options: AnswerOption[];
  correctOptionId: string;
}

export interface GenContext {
  difficulty: Difficulty;
  rng: Rng;
  /** All body style ids of the brand, for body-style questions. */
  bodyStyles: readonly string[];
}

export interface QuestionGenerator {
  id: string;
  skill: Skill;
  canGenerate(vehicle: Vehicle, pool: readonly Vehicle[]): boolean;
  generate(vehicle: Vehicle, pool: readonly Vehicle[], ctx: GenContext): Question;
}
