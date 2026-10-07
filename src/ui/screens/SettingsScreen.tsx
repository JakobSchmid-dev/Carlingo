import { useRef, useState } from 'react';
import { de } from '../../i18n/de.ts';
import type { Theme } from '../../store/persistence.ts';
import { Button, ButtonLink } from '../components/Button.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useAppStore } from '../context.ts';

const THEMES: Theme[] = ['system', 'light', 'dark'];

function download(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsScreen() {
  const theme = useAppStore((s) => s.settings.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const reset = useAppStore((s) => s.reset);
  const notice = useAppStore((s) => s.notice);
  const dismissNotice = useAppStore((s) => s.dismissNotice);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onExport = () =>
    download(exportData(), de.settings.exportFileName(new Date().toISOString().slice(0, 10)));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPendingImport(await file.text());
    if (fileInput.current) fileInput.current.value = '';
  };

  const onImportConfirmed = () => {
    if (pendingImport === null) return;
    const result = importData(pendingImport);
    setPendingImport(null);
    setMessage(result.ok ? de.settings.imported : de.settings.importFailed(result.error));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{de.settings.title}</h1>

      {(message ?? notice) && (
        <p role="status" className="rounded-md bg-primary-soft p-3 text-sm">
          {message ?? notice}
          {notice && !message && (
            <button type="button" className="ml-2 underline" onClick={dismissNotice}>
              {de.common.close}
            </button>
          )}
        </p>
      )}

      <section>
        <h2 className="text-lg font-bold">{de.settings.appearance}</h2>
        <fieldset className="mt-2 flex gap-2">
          <legend className="sr-only">{de.settings.appearance}</legend>
          {THEMES.map((t) => (
            <label
              key={t}
              className={`flex min-h-tap flex-1 cursor-pointer items-center justify-center rounded-md border px-2 text-sm font-bold has-focus-visible:outline-3 has-focus-visible:outline-focus ${
                theme === t
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-surface'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={t}
                checked={theme === t}
                onChange={() => setTheme(t)}
                className="sr-only"
              />
              {de.settings.theme[t]}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{de.settings.data}</h2>
        <p className="text-sm text-fg-muted">{de.settings.dataText}</p>
        <Button variant="secondary" block onClick={onExport}>
          {de.settings.export}
        </Button>
        <Button variant="secondary" block onClick={() => fileInput.current?.click()}>
          {de.settings.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label={de.settings.import}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          block
          className="text-danger"
          onClick={() => setConfirmReset(true)}
        >
          {de.settings.reset}
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{de.settings.about}</h2>
        <p className="text-sm text-fg-muted">{de.settings.aboutText}</p>
        <ButtonLink to="/settings/credits" variant="secondary" block>
          {de.settings.credits}
        </ButtonLink>
      </section>

      <ConfirmDialog
        open={pendingImport !== null}
        title={de.settings.importTitle}
        confirmLabel={de.settings.importConfirm}
        onConfirm={onImportConfirmed}
        onCancel={() => setPendingImport(null)}
      >
        {de.settings.importText}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmReset}
        title={de.settings.resetTitle}
        confirmLabel={de.settings.resetConfirm}
        danger
        onConfirm={() => {
          setConfirmReset(false);
          void reset().then(() => setMessage(de.settings.resetDone));
        }}
        onCancel={() => setConfirmReset(false)}
      >
        {de.settings.resetText}
      </ConfirmDialog>
    </div>
  );
}
