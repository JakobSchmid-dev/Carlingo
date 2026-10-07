/** Renders the app with fixture content, an in-memory store and a memory router. */
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { LoadedContent } from '../src/content/load.ts';
import { validatePackage } from '../src/content/validate.ts';
import { generatorList } from '../src/engine/generators/index.ts';
import { createAppStore } from '../src/store/appStore.ts';
import { memoryAdapter } from '../src/store/storage.ts';
import { AppProviders } from '../src/ui/App.tsx';
import { routes } from '../src/ui/routes.tsx';
import { rawPackage } from './fixtures.ts';

export function fixtureContent(): LoadedContent {
  const { pkg, issues } = validatePackage(rawPackage(), generatorList, (f) => `/img/${f}`);
  if (!pkg) throw new Error(JSON.stringify(issues));
  return { packages: [pkg], issues };
}

export async function renderApp(path: string, saved: string | null = null) {
  const adapter = memoryAdapter(saved);
  const store = createAppStore(adapter);
  await store.getState().hydrate();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <AppProviders content={fixtureContent()} store={store}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...utils, store, adapter, router };
}
