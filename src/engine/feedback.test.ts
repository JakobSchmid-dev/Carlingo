import { describe, expect, it } from 'vitest';
import { vehicle } from '../../tests/fixtures.ts';
import { pickFeature } from './feedback.ts';

const car = vehicle({
  id: 'f',
  features: [
    { area: 'general', text: 'Allgemein' },
    { area: 'rear', text: 'Heck' },
    { area: 'side', text: 'Seite' },
    { area: 'front', text: 'Front' },
  ],
});

describe('pickFeature', () => {
  it('prefers a feature matching the shown view', () => {
    expect(pickFeature(car, 'rear')?.text).toBe('Heck');
    expect(pickFeature(car, 'front-three-quarter')?.text).toBe('Front');
    expect(pickFeature(car, 'side')?.text).toBe('Seite');
  });

  it('falls back to general, then to any feature', () => {
    expect(pickFeature(car, 'interior')?.text).toBe('Allgemein');
    const onlyRear = vehicle({ id: 'r', features: [{ area: 'rear', text: 'Heck' }] });
    expect(pickFeature(onlyRear, 'front')?.text).toBe('Heck');
    expect(pickFeature(onlyRear, undefined)?.text).toBe('Heck');
  });

  it('returns undefined without features', () => {
    expect(pickFeature(vehicle({ id: 'n' }), 'front')).toBeUndefined();
  });
});
