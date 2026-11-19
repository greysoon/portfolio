import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { resolveViewFromLocation } from './App';
import './index.css';

const rootEl = document.getElementById('root')!;
const resolved = resolveViewFromLocation();
const prerenderView = rootEl.getAttribute('data-prerender-view');
const prerenderLang = rootEl.getAttribute('data-prerender-lang');

const shouldHydrate =
  rootEl.hasChildNodes() &&
  prerenderView === resolved.view &&
  prerenderLang === resolved.locale;

if (shouldHydrate) {
  ReactDOM.hydrateRoot(
    rootEl,
    <React.StrictMode>
      <App initialRoute={resolved} />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App initialRoute={resolved} />
    </React.StrictMode>
  );
}
