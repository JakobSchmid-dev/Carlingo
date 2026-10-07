import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { formatIssue } from '../content/issues.ts';
import type { LoadedContent } from '../content/load.ts';
import { de } from '../i18n/de.ts';
import type { AppStore } from '../store/appStore.ts';
import { ContentContext, StoreContext, useAppStore } from './context.ts';
import { routes } from './routes.tsx';

export function App({ content, store }: { content: LoadedContent; store: AppStore }) {
  const [router] = useState(() => createHashRouter(routes));
  return (
    <AppProviders content={content} store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

/** Context, theme, loading and content errors – shared by the app and component tests. */
export function AppProviders({
  content,
  store,
  children,
}: {
  content: LoadedContent;
  store: AppStore;
  children: ReactNode;
}) {
  return (
    <ContentContext.Provider value={content}>
      <StoreContext.Provider value={store}>
        <Shell content={content}>{children}</Shell>
      </StoreContext.Provider>
    </ContentContext.Provider>
  );
}

function Shell({ content, children }: { content: LoadedContent; children: ReactNode }) {
  const ready = useAppStore((s) => s.ready);
  const theme = useAppStore((s) => s.settings.theme);
  const errors = useMemo(() => content.issues.filter((i) => i.severity === 'error'), [content]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  if (errors.length > 0 || content.packages.length === 0) {
    return (
      <main className="mx-auto max-w-content p-4">
        <h1 className="text-xl font-bold text-danger">{de.contentError.title}</h1>
        <p className="mt-2">{errors.length > 0 ? de.contentError.text : de.contentError.empty}</p>
        <ul className="mt-4 flex flex-col gap-2 font-mono text-sm">
          {errors.map((issue) => (
            <li key={formatIssue(issue)} className="rounded-md bg-danger-soft p-2">
              {formatIssue(issue)}
            </li>
          ))}
        </ul>
      </main>
    );
  }
  if (!ready) {
    return <p className="p-4 text-fg-muted">{de.app.loading}</p>;
  }
  return children;
}
