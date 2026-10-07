import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadContent } from './content/load.ts';
import './index.css';
import { createAppStore } from './store/appStore.ts';
import { localStorageAdapter, requestPersistentStorage } from './store/storage.ts';
import { App } from './ui/App.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root fehlt in index.html');

const store = createAppStore(localStorageAdapter());
void store.getState().hydrate();
void requestPersistentStorage();

createRoot(root).render(
  <StrictMode>
    <App content={loadContent()} store={store} />
  </StrictMode>,
);
