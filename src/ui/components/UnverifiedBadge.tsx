import { de } from '../../i18n/de.ts';
import { Icon } from './Icon.tsx';

/** Shown in development mode only, for entries with "verified": false. */
export function UnverifiedBadge({ verified }: { verified: boolean }) {
  if (!import.meta.env.DEV || verified) return null;
  return (
    <span
      title={de.common.unverifiedHint}
      className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning"
    >
      <Icon name="info" className="size-3.5" />
      {de.common.unverified}
    </span>
  );
}
