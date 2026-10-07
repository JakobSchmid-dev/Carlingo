import { de } from '../../i18n/de.ts';
import { ButtonLink } from '../components/Button.tsx';
import { useContent } from '../context.ts';
import { imageUrl } from '../labels.ts';

/** Lists every image of every package with source, author and license – straight from the data. */
export function CreditsScreen() {
  const { packages } = useContent();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{de.credits.title}</h1>
      <p className="text-sm text-fg-muted">{de.credits.intro}</p>
      {packages.map((pkg) => (
        <section key={pkg.brand.id}>
          <h2 className="text-lg font-bold">{pkg.brand.name}</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {pkg.vehicles.flatMap((v) =>
              v.images.map((img) => (
                <li
                  key={img.file}
                  className="flex gap-3 rounded-lg bg-surface p-3 text-sm shadow-card"
                >
                  <img
                    src={imageUrl(pkg, img.file)}
                    alt=""
                    loading="lazy"
                    className="aspect-(--image-ratio) w-20 shrink-0 rounded-sm object-cover"
                  />
                  <dl className="min-w-0 flex-1 break-words">
                    <dt className="sr-only">{de.credits.file}</dt>
                    <dd className="font-bold">{img.file}</dd>
                    <dt className="inline text-fg-muted">{de.credits.source}: </dt>
                    <dd className="inline">{img.source}</dd>
                    {img.author && (
                      <>
                        <br />
                        <dt className="inline text-fg-muted">{de.credits.author}: </dt>
                        <dd className="inline">{img.author}</dd>
                      </>
                    )}
                    <br />
                    <dt className="inline text-fg-muted">{de.credits.license}: </dt>
                    <dd className="inline">{img.license}</dd>
                  </dl>
                </li>
              )),
            )}
          </ul>
        </section>
      ))}
      <ButtonLink to="/settings" variant="secondary">
        {de.common.back}
      </ButtonLink>
    </div>
  );
}
