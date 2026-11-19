import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App, { RouteResolution } from './App';
import { getSeoMetadata, SeoMetadataPayload } from './utils/seoMetadata';

export interface PrerenderResult {
  readonly html: string;
  readonly seo: SeoMetadataPayload;
  readonly route: RouteResolution;
}

export function renderRouteToString(route: RouteResolution): PrerenderResult {
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <App initialRoute={route} />
    </React.StrictMode>
  );
  const seo = getSeoMetadata({
    view: route.view,
    portfolioMode: route.portfolioMode,
    locale: route.locale,
  });
  return { html, seo, route };
}
