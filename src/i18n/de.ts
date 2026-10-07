/**
 * All visible UI texts. Components never contain German strings directly.
 * A second language would be a second file with the same shape (see `Messages`).
 */
export const de = {
  app: {
    name: 'Carlingo',
    tagline: 'Automodelle erkennen und einordnen',
  },
} as const;

export type Messages = typeof de;
