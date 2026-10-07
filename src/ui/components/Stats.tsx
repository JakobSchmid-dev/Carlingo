import { currentStreak } from '../../engine/progress.ts';
import { de } from '../../i18n/de.ts';
import { today, useAppStore } from '../context.ts';
import { Icon } from './Icon.tsx';

export function Stats() {
  const streak = useAppStore((s) => s.progress.streak);
  const xp = useAppStore((s) => s.progress.xp);
  const days = currentStreak(streak, today());
  return (
    <dl className="flex gap-3 text-sm font-bold">
      <div className="flex items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-warning">
        <dt>
          <Icon name="flame" className="size-4" />
          <span className="sr-only">{de.stats.streakLabel}</span>
        </dt>
        <dd>{de.stats.streak(days)}</dd>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-primary">
        <dt>
          <Icon name="star" className="size-4" />
          <span className="sr-only">{de.stats.xpLabel}</span>
        </dt>
        <dd>{de.stats.xp(xp)}</dd>
      </div>
    </dl>
  );
}
