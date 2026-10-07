// Temporary registry: the generator ids from SPEC section 7. Implementations follow in step 3.
const ids = [
  'image-to-name',
  'name-to-image',
  'detail-to-name',
  'powertrain',
  'body-style',
  'model-code',
  'power-compare',
];

export const generatorList = ids.map((id) => ({ id, canGenerate: () => true }));
