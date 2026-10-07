import { de } from '../i18n/de.ts';

export function App() {
  return (
    <main className="mx-auto max-w-content p-4">
      <h1 className="text-2xl font-bold">{de.app.name}</h1>
      <p className="text-fg-muted">{de.app.tagline}</p>
    </main>
  );
}
