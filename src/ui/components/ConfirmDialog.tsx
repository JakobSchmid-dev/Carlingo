import { useEffect, useId, useRef, type ReactNode } from 'react';
import { de } from '../../i18n/de.ts';
import { Button } from './Button.tsx';

/** Modal confirmation. Focus starts on the safe choice; Escape cancels. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = de.common.cancel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-content rounded-lg bg-surface p-6 shadow-card"
      >
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <div className="mt-2 text-fg-muted">{children}</div>
        <div className="mt-6 flex flex-col gap-2">
          <Button ref={cancelRef} variant="secondary" block onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
