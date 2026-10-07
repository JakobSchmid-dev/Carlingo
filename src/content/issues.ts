/**
 * Content problems in plain German: which file, which entry, which field, what is wrong.
 * Used by `npm run validate` and by the app's error screen.
 */
import { z } from 'zod';

export interface ContentIssue {
  severity: 'error' | 'warning';
  /** Path relative to the repository, e.g. `content/mercedes/vehicles.json`. */
  file: string;
  /** Human readable entry, e.g. `Fahrzeug "glc-suv-x254"`. */
  entity?: string;
  /** Field path inside the entry, e.g. `images[0].license`. */
  field?: string;
  message: string;
}

export function formatIssue(issue: ContentIssue): string {
  const parts = [issue.file];
  if (issue.entity) parts.push(issue.entity);
  if (issue.field) parts.push(`Feld "${issue.field}"`);
  return `${parts.join(' · ')}: ${issue.message}`;
}

const TYPE_NAMES: Record<string, string> = {
  string: 'Text in Anführungszeichen',
  number: 'eine Zahl',
  int: 'eine ganze Zahl',
  boolean: 'true oder false',
  array: 'eine Liste [ … ]',
  object: 'ein Objekt { … }',
  null: 'null',
};

function describeInput(input: unknown): string {
  if (input === null) return 'null';
  if (Array.isArray(input)) return 'eine Liste';
  switch (typeof input) {
    case 'string':
      return `den Text "${input}"`;
    case 'number':
      return `die Zahl ${input}`;
    case 'boolean':
      return `den Wert ${input}`;
    case 'object':
      return 'ein Objekt';
    default:
      return String(input);
  }
}

/** German default messages for schema errors without a specific message. */
function germanMessage(issue: z.core.$ZodRawIssue): string | undefined {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.input === undefined) return 'fehlt, ist aber ein Pflichtfeld';
      return `muss ${TYPE_NAMES[issue.expected] ?? issue.expected} sein, gefunden wurde ${describeInput(issue.input)}`;
    case 'invalid_value':
      return `hat den ungültigen Wert ${JSON.stringify(issue.input)}. Erlaubt sind: ${issue.values.map((v) => JSON.stringify(v)).join(', ')}`;
    case 'too_small':
      if (issue.origin === 'array') return `braucht mindestens ${issue.minimum} Einträge`;
      if (issue.origin === 'string') return 'darf nicht leer sein';
      return `muss mindestens ${issue.minimum} sein`;
    case 'too_big':
      if (issue.origin === 'array') return `darf höchstens ${issue.maximum} Einträge haben`;
      return `darf höchstens ${issue.maximum} sein`;
    case 'unrecognized_keys':
      return `enthält unbekannte Felder: ${issue.keys.map((k) => `"${k}"`).join(', ')}. Tippfehler?`;
    case 'invalid_key':
      return `enthält einen ungültigen Schlüssel ${describeInput(issue.input)}`;
    case 'invalid_format':
      return 'hat ein ungültiges Format';
    case 'invalid_union':
      return `hat einen ungültigen Wert (${describeInput(issue.input)})`;
    default:
      return undefined;
  }
}

z.config({ customError: germanMessage });

/** Turns a Zod path into `images[0].license`. */
export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((segment, i) =>
      typeof segment === 'number' ? `[${segment}]` : `${i === 0 ? '' : '.'}${String(segment)}`,
    )
    .join('');
}

/**
 * Converts Zod issues to content issues. `describeEntry` maps the leading path segments to an
 * entry name (e.g. index 3 of vehicles.json → `Fahrzeug "glc-suv-x254"`) and returns how many
 * segments it consumed.
 */
export function zodIssues(
  error: z.ZodError,
  file: string,
  describeEntry: (path: readonly PropertyKey[]) => { entity?: string; consumed: number },
): ContentIssue[] {
  return error.issues.map((issue) => {
    const { entity, consumed } = describeEntry(issue.path);
    const field = formatPath(issue.path.slice(consumed));
    return {
      severity: 'error' as const,
      file,
      ...(entity ? { entity } : {}),
      ...(field ? { field } : {}),
      message: issue.message,
    };
  });
}
