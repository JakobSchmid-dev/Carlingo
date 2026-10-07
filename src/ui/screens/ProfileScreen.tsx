import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { FEATURE_AREAS, type Vehicle } from '../../content/schema.ts';
import { isProfileUnlocked } from '../../engine/progress.ts';
import { de } from '../../i18n/de.ts';
import { ButtonLink } from '../components/Button.tsx';
import { UnverifiedBadge } from '../components/UnverifiedBadge.tsx';
import { VehicleImage } from '../components/VehicleImage.tsx';
import { useAppStore, usePackage } from '../context.ts';
import { bodyStyleLabel, familyLabel, imageUrl, subBrandLabel } from '../labels.ts';

function productionText(v: Vehicle): string | undefined {
  const p = v.production;
  if (!p || (p.from === undefined && p.to == null)) return undefined;
  let text: string;
  if (p.from !== undefined && p.to != null) text = de.profile.range(p.from, p.to);
  else if (p.from !== undefined) text = de.profile.since(p.from);
  else text = de.profile.until(p.to as number);
  return p.faceliftYears.length > 0 ? `${text} · ${de.profile.facelift(p.faceliftYears)}` : text;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right font-medium">{children ?? de.common.notRecorded}</dd>
    </div>
  );
}

export function ProfileScreen() {
  const { brandId, vehicleId } = useParams();
  const pkg = usePackage(brandId);
  const progress = useAppStore((s) => s.progress);
  const vehicle = pkg?.vehicles.find((v) => v.id === vehicleId);

  if (!pkg || !vehicle) return <p>{de.profile.notFound}</p>;
  if (!isProfileUnlocked(progress, vehicle.id)) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{de.profile.title}</h1>
        <p className="mt-2 text-fg-muted">{de.profile.locked}</p>
        <ButtonLink to="/collection" className="mt-4">
          {de.profile.toCollection}
        </ButtonLink>
      </div>
    );
  }

  const texts = [
    ...vehicle.engines.map((e) => e.name),
    ...vehicle.features.map((f) => f.text),
    vehicle.displayName,
  ];
  const glossary = pkg.brand.glossary.filter((g) => texts.some((t) => t.includes(g.term)));

  return (
    <article className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-bold text-fg-muted">{de.profile.title}</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
          {vehicle.displayName} <UnverifiedBadge verified={vehicle.verified} />
        </h1>
        <p className="text-fg-muted">{subBrandLabel(pkg, vehicle.subBrand)}</p>
      </header>

      <section aria-label={de.profile.images}>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {vehicle.images.map((img) => (
            <li key={img.file} className="w-4/5 shrink-0 snap-center">
              <VehicleImage
                className="rounded-lg"
                src={imageUrl(pkg, img.file)}
                alt={de.image.of(vehicle.displayName, de.view[img.view])}
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">{de.profile.facts}</h2>
        <dl className="mt-2 rounded-lg bg-surface px-4 shadow-card">
          <Row label={de.profile.series}>{vehicle.series}</Row>
          <Row label={de.profile.modelCode}>{vehicle.modelCode}</Row>
          <Row label={de.profile.production}>{productionText(vehicle)}</Row>
          <Row label={de.profile.family}>{familyLabel(pkg, vehicle.family)}</Row>
          <Row label={de.profile.bodyStyle}>{bodyStyleLabel(pkg, vehicle.bodyStyle)}</Row>
          <Row label={de.profile.powertrain}>{de.powertrain[vehicle.powertrain]}</Row>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-bold">{de.profile.features}</h2>
        {vehicle.features.length === 0 ? (
          <p className="mt-2 text-fg-muted">{de.common.notRecorded}</p>
        ) : (
          <dl className="mt-2 rounded-lg bg-surface px-4 shadow-card">
            {FEATURE_AREAS.flatMap((area) =>
              vehicle.features
                .filter((f) => f.area === area)
                .map((f) => (
                  <Row key={`${area}-${f.text}`} label={de.area[area]}>
                    {f.text}
                  </Row>
                )),
            )}
          </dl>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">{de.profile.engines}</h2>
        {vehicle.engines.length === 0 ? (
          <p className="mt-2 text-fg-muted">{de.common.notRecorded}</p>
        ) : (
          <dl className="mt-2 rounded-lg bg-surface px-4 shadow-card">
            {vehicle.engines.map((e) => (
              <Row key={e.name} label={`${e.name} (${de.fuel[e.fuel]})`}>
                {de.profile.power(e.powerKw, e.powerPs) || undefined}
              </Row>
            ))}
          </dl>
        )}
      </section>

      {vehicle.funFact && (
        <section className="rounded-lg bg-primary-soft p-4">
          <h2 className="font-bold text-primary">{de.profile.funFact}</h2>
          <p className="mt-1">{vehicle.funFact}</p>
        </section>
      )}

      {glossary.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">{de.profile.glossary}</h2>
          <dl className="mt-2 rounded-lg bg-surface px-4 shadow-card">
            {glossary.map((g) => (
              <Row key={g.term} label={g.term}>
                {g.text}
              </Row>
            ))}
          </dl>
        </section>
      )}

      <ButtonLink to="/collection" variant="secondary">
        {de.profile.toCollection}
      </ButtonLink>
    </article>
  );
}
