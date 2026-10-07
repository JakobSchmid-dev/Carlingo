import { Link, Navigate } from 'react-router';
import { mainImage } from '../../content/model.ts';
import { de } from '../../i18n/de.ts';
import { ButtonLink } from '../components/Button.tsx';
import { Icon } from '../components/Icon.tsx';
import { VehicleImage } from '../components/VehicleImage.tsx';
import { useAppStore, useTracks } from '../context.ts';
import { imageUrl } from '../labels.ts';

export function ResultScreen() {
  const result = useAppStore((s) => s.lastResult);
  const tracks = useTracks();
  if (!result) return <Navigate to="/" replace />;
  const ref = tracks.find((t) => t.track.id === result.trackId);
  const unlocked = ref
    ? result.newlyUnlocked.flatMap((id) => ref.pkg.vehicles.filter((v) => v.id === id))
    : [];

  return (
    <div className="flex flex-col gap-6 pt-6 text-center">
      <h1 className="text-2xl font-bold">{de.result.title}</h1>
      {result.perfect && (
        <p className="mx-auto flex items-center gap-2 rounded-full bg-success-soft px-4 py-1 font-bold text-success">
          <Icon name="star" /> {de.result.perfect}
        </p>
      )}
      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-surface p-3 shadow-card">
          <dt className="sr-only">{de.session.answers}</dt>
          <dd className="font-bold">{de.result.correct(result.correctPlanned, result.planned)}</dd>
        </div>
        <div className="rounded-lg bg-surface p-3 shadow-card">
          <dt className="sr-only">{de.stats.xpLabel}</dt>
          <dd className="font-bold text-primary">{de.result.xp(result.xpEarned)}</dd>
        </div>
        <div className="rounded-lg bg-surface p-3 shadow-card">
          <dt className="sr-only">{de.stats.streakLabel}</dt>
          <dd className="font-bold text-warning">{de.result.streak(result.streak)}</dd>
        </div>
      </dl>

      {ref && unlocked.length > 0 && (
        <section className="text-left">
          <h2 className="text-lg font-bold">{de.result.unlocked}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-3">
            {unlocked.map((v) => {
              const img = mainImage(v);
              return (
                <li key={v.id}>
                  <Link
                    to={`/vehicle/${ref.pkg.brand.id}/${v.id}`}
                    className="block overflow-hidden rounded-lg bg-surface shadow-card"
                  >
                    {img && <VehicleImage src={imageUrl(ref.pkg, img.file)} alt="" />}
                    <span className="block p-2 font-bold">{v.displayName}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {ref && (
          <ButtonLink
            block
            to={`/learn/${ref.pkg.brand.id}/${ref.track.collection}/${result.levelId}`}
            replace
          >
            {de.result.again}
          </ButtonLink>
        )}
        <ButtonLink block variant="secondary" to="/">
          {de.result.toPath}
        </ButtonLink>
      </div>
    </div>
  );
}
