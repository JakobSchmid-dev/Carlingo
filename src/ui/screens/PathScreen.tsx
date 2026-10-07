import { Link } from 'react-router';
import { generators } from '../../engine/generators/index.ts';
import { trackOverview, type LevelOverview } from '../../engine/progress.ts';
import { de } from '../../i18n/de.ts';
import { Icon } from '../components/Icon.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { Stats } from '../components/Stats.tsx';
import { useActiveTrack, useAppStore, useContent, useTracks } from '../context.ts';

export function PathScreen() {
  const tracks = useTracks();
  const active = useActiveTrack();
  const progress = useAppStore((s) => s.progress);
  const setActiveTrack = useAppStore((s) => s.setActiveTrack);
  const { packages } = useContent();
  const unverified = packages.flatMap((p) => p.vehicles).filter((v) => !v.verified).length;

  if (!active) return <p>{de.contentError.empty}</p>;
  const overview = trackOverview(active.track, active.pkg.vehicles, generators, progress);
  const titleOf = (id: string) => active.track.levels.find((l) => l.id === id)?.title ?? id;

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{de.app.name}</h1>
        <Stats />
      </header>

      {import.meta.env.DEV && unverified > 0 && (
        <p className="mt-3 rounded-md bg-warning-soft p-3 text-sm text-warning">
          {de.common.unverifiedBanner(unverified)}
        </p>
      )}

      <section className="mt-4">
        {tracks.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm font-bold text-fg-muted">
            {de.path.track}
            <select
              className="min-h-tap rounded-md border border-border bg-surface px-3 text-base text-fg"
              value={active.track.id}
              onChange={(e) => setActiveTrack(e.target.value)}
            >
              {tracks.map(({ pkg, track }) => (
                <option key={track.id} value={track.id}>
                  {pkg.brand.name} · {track.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm font-bold text-fg-muted">
            {de.path.track}: {active.pkg.brand.name} · {active.track.title}
          </p>
        )}
        {active.track.description && (
          <p className="mt-1 text-sm text-fg-muted">{active.track.description}</p>
        )}
      </section>

      <h2 className="sr-only">{de.path.title}</h2>
      <ol className="relative mt-6 flex flex-col gap-4 before:absolute before:top-6 before:bottom-6 before:left-7 before:w-1 before:rounded-full before:bg-border">
        {overview.map((entry) => (
          <LevelNode
            key={entry.level.id}
            entry={entry}
            to={`/learn/${active.pkg.brand.id}/${active.track.collection}/${entry.level.id}`}
            lockedBy={entry.level.unlockAfter
              .filter((id) => overview.find((o) => o.level.id === id)?.state !== 'mastered')
              .map(titleOf)}
          />
        ))}
      </ol>
    </div>
  );
}

function LevelNode({
  entry,
  to,
  lockedBy,
}: {
  entry: LevelOverview;
  to: string;
  lockedBy: string[];
}) {
  const { level, state, mastery } = entry;
  const locked = state === 'locked';
  const icon = state === 'mastered' ? 'check' : locked ? 'lock' : 'play';
  const circle =
    state === 'mastered'
      ? 'bg-success text-primary-fg'
      : locked
        ? 'bg-surface-muted text-locked'
        : 'bg-primary text-primary-fg';

  const body = (
    <>
      <span
        className={`relative z-[1] flex size-14 shrink-0 items-center justify-center rounded-full ${circle}`}
      >
        <Icon name={icon} className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-bold">{level.title}</span>
          <span className="text-xs font-bold text-fg-muted">{de.path.state[state]}</span>
        </span>
        {level.description && <span className="text-sm text-fg-muted">{level.description}</span>}
        {locked ? (
          <span className="text-sm text-fg-muted">{de.path.lockedUntil(lockedBy)}</span>
        ) : (
          <>
            <ProgressBar
              value={mastery.learned}
              max={mastery.total}
              label={de.path.learned(mastery.learned, mastery.total)}
            />
            <span className="text-xs text-fg-muted">
              {entry.askable === 0
                ? de.path.needsProfiles
                : de.path.learned(mastery.learned, mastery.total)}
            </span>
          </>
        )}
      </span>
    </>
  );

  const card = 'flex items-center gap-4 rounded-lg bg-surface p-3 shadow-card';
  return (
    <li>
      {locked ? (
        <div className={`${card} opacity-70`} aria-disabled="true">
          {body}
        </div>
      ) : (
        <Link
          to={to}
          className={`${card} hover:bg-surface-muted`}
          aria-label={de.path.start(level.title)}
        >
          {body}
        </Link>
      )}
    </li>
  );
}
