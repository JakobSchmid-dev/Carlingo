import { de } from '../../i18n/de.ts';
import { ButtonLink } from '../components/Button.tsx';

export function NotFoundScreen() {
  return (
    <div>
      <h1 className="text-2xl font-bold">{de.notFound.title}</h1>
      <ButtonLink to="/" className="mt-4">
        {de.session.toPath}
      </ButtonLink>
    </div>
  );
}
