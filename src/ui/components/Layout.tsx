import { NavLink, Outlet } from 'react-router';
import { de } from '../../i18n/de.ts';
import { Icon, type IconName } from './Icon.tsx';

const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: de.nav.learn, icon: 'path' },
  { to: '/collection', label: de.nav.collection, icon: 'grid' },
  { to: '/settings', label: de.nav.settings, icon: 'cog' },
];

/** Screens with the bottom navigation (everything except a running unit). */
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-content flex-1 px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <nav
        aria-label={de.nav.label}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-content">
          {items.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-tap flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold ${
                    isActive ? 'text-primary' : 'text-fg-muted'
                  }`
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
