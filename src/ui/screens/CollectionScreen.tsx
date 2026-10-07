import { useState } from 'react';
import { Link } from 'react-router';
import { mainImage, trackVehicles } from '../../content/model.ts';
import { isProfileUnlocked } from '../../engine/progress.ts';
import { de } from '../../i18n/de.ts';
import { Icon } from '../components/Icon.tsx';
import { UnverifiedBadge } from '../components/UnverifiedBadge.tsx';
import { VehicleImage } from '../components/VehicleImage.tsx';
import { useActiveTrack, useAppStore } from '../context.ts';
import { familyLabel, imageUrl } from '../labels.ts';

export function CollectionScreen() {
  const active = useActiveTrack();
  const progress = useAppStore((s) => s.progress);
  const [family, setFamily] = useState<string | null>(null);
  if (!active) return <p>{de.contentError.empty}</p>;

  const { pkg } = active;
  const vehicles = trackVehicles(pkg.vehicles, active.track);
  const families = pkg.brand.families.filter((f) => vehicles.some((v) => v.family === f.id));
  const shown = family ? vehicles.filter((v) => v.family === family) : vehicles;
  const unlockedCount = vehicles.filter((v) => isProfileUnlocked(progress, v.id)).length;

  const chip = (id: string | null, label: string) => (
    <button
      key={id ?? 'all'}
      type="button"
      aria-pressed={family === id}
      onClick={() => setFamily(id)}
      className={`min-h-tap shrink-0 rounded-full border px-4 text-sm font-bold ${
        family === id
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border bg-surface text-fg'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">{de.collection.title}</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {pkg.brand.name} · {active.track.title} ·{' '}
        {de.collection.count(unlockedCount, vehicles.length)}
      </p>

      <div
        role="group"
        aria-label={de.collection.filter}
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2"
      >
        {chip(null, de.collection.all)}
        {families.map((f) => chip(f.id, familyLabel(pkg, f.id)))}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3">
        {shown.map((v) => {
          const unlocked = isProfileUnlocked(progress, v.id);
          const img = mainImage(v);
          const content = (
            <>
              {img && (
                <VehicleImage
                  src={imageUrl(pkg, img.file)}
                  alt={unlocked ? de.image.of(v.displayName, de.view[img.view]) : de.image.locked}
                  locked={!unlocked}
                />
              )}
              <span className="flex flex-col items-start gap-1 p-2">
                <span className="flex w-full items-start justify-between gap-1 font-bold">
                  {unlocked ? v.displayName : de.collection.locked}
                  {!unlocked && <Icon name="lock" className="mt-1 size-4 shrink-0 text-locked" />}
                </span>
                {unlocked && <UnverifiedBadge verified={v.verified} />}
              </span>
            </>
          );
          return (
            <li key={v.id}>
              {unlocked ? (
                <Link
                  to={`/vehicle/${pkg.brand.id}/${v.id}`}
                  className="block overflow-hidden rounded-lg bg-surface shadow-card hover:bg-surface-muted"
                >
                  {content}
                </Link>
              ) : (
                <div
                  className="overflow-hidden rounded-lg bg-surface text-fg-muted shadow-card"
                  title={de.collection.lockedHint}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
