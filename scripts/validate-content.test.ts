import { describe, expect, it } from 'vitest';
import { formatIssue } from '../src/content/issues.ts';
import { validateAll } from './validate-content.ts';

describe('content packages in content/', () => {
  it('are valid', () => {
    const { issues } = validateAll();
    const errors = issues.filter((i) => i.severity === 'error').map(formatIssue);
    expect(errors).toEqual([]);
  });
});
