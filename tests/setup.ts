import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Unmount rendered components after each test (Vitest runs without globals).
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
