import type { RouteObject } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { CollectionScreen } from './screens/CollectionScreen.tsx';
import { CreditsScreen } from './screens/CreditsScreen.tsx';
import { NotFoundScreen } from './screens/NotFoundScreen.tsx';
import { PathScreen } from './screens/PathScreen.tsx';
import { ProfileScreen } from './screens/ProfileScreen.tsx';
import { ResultScreen } from './screens/ResultScreen.tsx';
import { SessionScreen } from './screens/SessionScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';

export const routes: RouteObject[] = [
  // A running unit is full screen, without navigation.
  { path: '/learn/:brandId/:collection/:levelId', element: <SessionScreen /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <PathScreen /> },
      { path: '/result', element: <ResultScreen /> },
      { path: '/collection', element: <CollectionScreen /> },
      { path: '/vehicle/:brandId/:vehicleId', element: <ProfileScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '/settings/credits', element: <CreditsScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
];
