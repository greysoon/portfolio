import dns from 'node:dns/promises';
import tls from 'node:tls';

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const SITE_AUDIT_TARGETS = [
  { id: 'home', label: 'Hoofdpagina (greyson.nl)', url: 'https://greyson.nl/' },
  { id: 'over_mij', label: 'Over mij (/over-mij)', url: 'https://greyson.nl/over-mij' },
  { id: 'www', label: 'WWW alias (www.greyson.nl)', url: 'https://www.greyson.nl/' },
  { id: 'automate', label: 'Automate subdomein', url: 'https://automate.greyson.nl/' },
  { id: 'automation', label: 'Automation subdomein', url: 'https://automation.greyson.nl/' },
];

const DISCOVERY_FILE_TARGETS = [
  { id: 'robots', name: 'robots.txt', url: 'https://greyson.nl/robots.txt' },
  { id: 'sitemap', name: 'sitemap.xml', url: 'https://greyson.nl/sitemap.xml' },
  { id: 'llms', name: 'llms.txt', url: 'https://greyson.nl/llms.txt' },
  { id: 'llms_full', name: 'llms-full.txt', url: 'https://greyson.nl/llms-full.txt' },
  { id: 'well_known_llms', name: '.well-known/llms.txt', url: 'https://greyson.nl/.well-known/llms.txt' },
];

const DNS_HOSTS = [
  'greyson.nl',
  'www.greyson.nl',
  'automate.greyson.nl',
  'automation.greyson.nl',
];

const PAGESPEED_ALLOWED_URLS = new Set([
  'https://greyson.nl/',
  'https://greyson.nl/over-mij',
  'https://www.greyson.nl/',
]);

const CHECKED_BOTS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot',
];

const SEO_AUDIT_KEYS = [
  'is-crawlable',
  'robots-txt',
  'http-status-code',
  'canonical',
  'meta-description',
  'document-title',
  'hreflang',
  'link-text',
  'crawlable-anchors',
  'structured-data',
];

function isLoopbackRequest(req) {
  const remoteAddr = req.socket?.remoteAddress || '';
  if (!LOOPBACK_IPS.has(remoteAddr)) {
    return false;
  }
  const hostHeader = String(req.headers.host || '').toLowerCase();
  const hostname = hostHeader.split(':')[0];
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  );
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req, maxBytes = 32_768) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request payload too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sanitizeText(value, maxLen = 200) {
  return String(value ?? '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function normalizeRegion(raw) {
  if (typeof raw === 'string' && raw.trim().toLowerCase().includes('us')) {
    return 'us';
  }
  return 'eu';
}

function inspectTlsCertificate(hostname, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const authError = socket.authorizationError
            ? String(socket.authorizationError)
            : null;
          const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
          const daysRemaining =
            validTo && !Number.isNaN(validTo.getTime())
              ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000)
              : null;

          finish({
            valid: Boolean(authorized),
            error: authorized ? null : authError || 'TLS certificate verification failed',
            issuer: cert?.issuer?.O || cert?.issuer?.CN || null,
            validTo: validTo && !Number.isNaN(validTo.getTime()) ? validTo.toISOString() : null,
            daysRemaining,
            subjectAltName: typeof cert?.subjectaltname === 'string' ? cert.subjectaltname : null,
          });
        } catch (err) {
          finish({
            valid: false,
            error: err instanceof Error ? err.message : 'TLS inspection error',
            issuer: null,
            validTo: null,
            daysRemaining: null,
            subjectAltName: null,
          });
        } finally {
          socket.end();
        }
      }
    );

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      finish({
        valid: false,
        error: 'TLS handshake timeout',
        issuer: null,
        validTo: null,
        daysRemaining: null,
        subjectAltName: null,
      });
    });

    socket.on('error', (err) => {
      finish({
        valid: false,
        error: err.message || 'TLS connection failed',
        issuer: null,
        validTo: null,
        daysRemaining: null,
        subjectAltName: null,
      });
    });
  });
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractTagAttr(html, tagRegex, attrName) {
  const tags = html.match(tagRegex) || [];
  for (const tag of tags) {
    const attrRe = new RegExp(`${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
    const match = tag.match(attrRe);
    if (match) {
      return decodeHtmlEntities(match[1] ?? match[2] ?? '').trim();
    }
  }
  return '';
}

function parseHtmlMetadata(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? sanitizeText(decodeHtmlEntities(titleMatch[1]), 160) : '';

  const metaDescription = sanitizeText(
    extractTagAttr(
      html,
      /<meta\b[^>]*\bname\s*=\s*(?:"description"|'description')[^>]*>/gi,
      'content'
    ),
    260
  );

  const metaRobots = sanitizeText(
    extractTagAttr(
      html,
      /<meta\b[^>]*\bname\s*=\s*(?:"robots"|'robots')[^>]*>/gi,
      'content'
    ),
    120
  );

  const canonicalUrl = sanitizeText(
    extractTagAttr(
      html,
      /<link\b[^>]*\brel\s*=\s*(?:"canonical"|'canonical')[^>]*>/gi,
      'href'
    ),
    200
  );

  const ogTitle = sanitizeText(
    extractTagAttr(
      html,
      /<meta\b[^>]*\bproperty\s*=\s*(?:"og:title"|'og:title')[^>]*>/gi,
      'content'
    ),
    160
  );

  const twitterCard = sanitizeText(
    extractTagAttr(
      html,
      /<meta\b[^>]*\bname\s*=\s*(?:"twitter:card"|'twitter:card')[^>]*>/gi,
      'content'
    ),
    60
  );

  const hreflangTags =
    html.match(/<link\b[^>]*\brel\s*=\s*(?:"alternate"|'alternate')[^>]*\bhreflang\s*=[^>]*>/gi) || [];
  const hreflangs = [];
  for (const tag of hreflangTags) {
    const langMatch = tag.match(/hreflang\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (langMatch) {
      hreflangs.push((langMatch[1] ?? langMatch[2] ?? '').trim());
    }
  }

  const jsonLdTypes = [];
  const ldMatches = html.matchAll(
    /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          if (item && typeof item['@type'] === 'string') {
            jsonLdTypes.push(item['@type']);
          }
        }
      } else if (typeof parsed['@type'] === 'string') {
        jsonLdTypes.push(parsed['@type']);
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  return {
    title,
    metaDescription,
    metaRobots,
    canonicalUrl,
    hasOpenGraph: Boolean(ogTitle),
    hasTwitterCard: Boolean(twitterCard),
    hreflangs,
    jsonLdTypes,
  };
}

async function probeLivePage(target) {
  const parsedUrl = new URL(target.url);
  const tlsPromise = inspectTlsCertificate(parsedUrl.hostname);
  const start = performance.now();

  let httpResult;
  try {
    const response = await fetch(target.url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'GreysonDashboardAudit/1.0 (+https://greyson.nl)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const ttfbMs = Math.round(performance.now() - start);
    const html = await response.text();
    const totalMs = Math.round(performance.now() - start);
    const meta = parseHtmlMetadata(html);
    const xRobotsTag = response.headers.get('x-robots-tag') || '';

    httpResult = {
      reachable: true,
      statusCode: response.status,
      ok: response.ok,
      finalUrl: response.url,
      redirected: response.redirected,
      ttfbMs,
      totalMs,
      xRobotsTag: sanitizeText(xRobotsTag, 120),
      contentType: sanitizeText(response.headers.get('content-type') || '', 80),
      cacheControl: sanitizeText(response.headers.get('cache-control') || '', 80),
      xFrameOptions: sanitizeText(response.headers.get('x-frame-options') || '', 40),
      xContentTypeOptions: sanitizeText(response.headers.get('x-content-type-options') || '', 40),
      error: null,
      meta,
    };
  } catch (err) {
    const totalMs = Math.round(performance.now() - start);
    const causeCode =
      err && typeof err === 'object' && 'cause' in err && err.cause && typeof err.cause === 'object'
        ? err.cause.code || err.cause.message
        : null;
    const errMsg = causeCode
      ? `${err instanceof Error ? err.message : 'Fetch error'} (${causeCode})`
      : err instanceof Error
        ? err.message
        : 'Fetch failed';

    httpResult = {
      reachable: false,
      statusCode: null,
      ok: false,
      finalUrl: target.url,
      redirected: false,
      ttfbMs: null,
      totalMs,
      xRobotsTag: '',
      contentType: '',
      cacheControl: '',
      xFrameOptions: '',
      xContentTypeOptions: '',
      error: sanitizeText(errMsg, 180),
      meta: {
        title: '',
        metaDescription: '',
        metaRobots: '',
        canonicalUrl: '',
        hasOpenGraph: false,
        hasTwitterCard: false,
        hreflangs: [],
        jsonLdTypes: [],
      },
    };
  }

  const tlsInfo = await tlsPromise;
  const robotsNoIndex =
    httpResult.xRobotsTag.toLowerCase().includes('noindex') ||
    httpResult.meta.metaRobots.toLowerCase().includes('noindex');

  let issue = null;
  if (!httpResult.reachable) {
    issue = tlsInfo.valid ? httpResult.error || 'Niet bereikbaar' : tlsInfo.error || httpResult.error;
  } else if (!tlsInfo.valid) {
    issue = tlsInfo.error || 'TLS-certificaat ongeldig';
  } else if (!httpResult.ok) {
    issue = `HTTP ${httpResult.statusCode} — zoekmachines indexeren foutpagina's niet`;
  } else if (robotsNoIndex) {
    issue = 'Bevat noindex-richtlijn';
  } else if (!httpResult.meta.title || !httpResult.meta.metaDescription) {
    issue = 'Titel of meta description ontbreekt';
  }

  return {
    id: target.id,
    label: target.label,
    url: target.url,
    ...httpResult,
    tls: tlsInfo,
    indexable: Boolean(httpResult.reachable && httpResult.ok && tlsInfo.valid && !robotsNoIndex),
    issue,
  };
}

function parseRobotsTxt(text) {
  const lines = text.split(/\r?\n/);
  const sitemaps = [];
  const rulesByAgent = new Map();
  let currentAgents = [];
  let lastWasRule = false;

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'sitemap') {
      sitemaps.push(value);
      continue;
    }

    if (directive === 'user-agent') {
      const agent = value.toLowerCase();
      if (currentAgents.length === 0 || lastWasRule) {
        currentAgents = [agent];
      } else {
        currentAgents.push(agent);
      }
      lastWasRule = false;
      if (!rulesByAgent.has(agent)) {
        rulesByAgent.set(agent, []);
      }
      continue;
    }

    if ((directive === 'allow' || directive === 'disallow') && currentAgents.length > 0) {
      lastWasRule = true;
      for (const agent of currentAgents) {
        const list = rulesByAgent.get(agent) || [];
        list.push({ directive, path: value });
        rulesByAgent.set(agent, list);
      }
    }
  }

  const botAccess = CHECKED_BOTS.map((bot) => {
    const specific = rulesByAgent.get(bot.toLowerCase());
    const fallback = rulesByAgent.get('*');
    const rules = specific && specific.length > 0 ? specific : fallback || [];
    const disallowsRoot = rules.some((r) => r.directive === 'disallow' && r.path === '/');
    const allowsRoot = rules.some((r) => r.directive === 'allow' && r.path === '/');
    return {
      bot,
      allowed: allowsRoot || !disallowsRoot,
      ruleSource: specific && specific.length > 0 ? 'explicit' : 'wildcard',
    };
  });

  const disallowsDashboard = (rulesByAgent.get('*') || []).some(
    (r) => r.directive === 'disallow' && r.path.startsWith('/dashboard')
  );

  return { sitemaps, botAccess, disallowsDashboard };
}

function parseSitemapXml(text) {
  const urls = [];
  const urlBlocks = text.matchAll(/<url>([\s\S]*?)<\/url>/gi);
  for (const block of urlBlocks) {
    const inner = block[1];
    const locMatch = inner.match(/<loc>([\s\S]*?)<\/loc>/i);
    const lastmodMatch = inner.match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
    if (locMatch) {
      const loc = locMatch[1].trim();
      try {
        const parsed = new URL(loc);
        if (parsed.hostname === 'greyson.nl' || parsed.hostname.endsWith('.greyson.nl')) {
          urls.push({
            loc,
            lastmod: lastmodMatch ? lastmodMatch[1].trim() : '',
          });
        }
      } catch {
        // Ignore invalid URL in sitemap
      }
    }
  }
  return urls;
}

async function probeDiscoveryFile(target) {
  const start = performance.now();
  try {
    const res = await fetch(target.url, {
      method: 'GET',
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'GreysonDashboardAudit/1.0 (+https://greyson.nl)' },
    });
    const text = await res.text();
    const latencyMs = Math.round(performance.now() - start);
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      ok: res.ok,
      statusCode: res.status,
      bytes: Buffer.byteLength(text, 'utf8'),
      latencyMs,
      text: res.ok ? text : '',
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      ok: false,
      statusCode: null,
      bytes: 0,
      latencyMs: Math.round(performance.now() - start),
      text: '',
      error: err instanceof Error ? sanitizeText(err.message, 140) : 'Fetch failed',
    };
  }
}

async function runSiteAudit() {
  const [pages, rawFiles] = await Promise.all([
    Promise.all(SITE_AUDIT_TARGETS.map((target) => probeLivePage(target))),
    Promise.all(DISCOVERY_FILE_TARGETS.map((target) => probeDiscoveryFile(target))),
  ]);

  const robotsFile = rawFiles.find((f) => f.id === 'robots');
  const sitemapFile = rawFiles.find((f) => f.id === 'sitemap');

  const robotsAnalysis = robotsFile?.ok ? parseRobotsTxt(robotsFile.text) : null;
  const sitemapEntries = sitemapFile?.ok ? parseSitemapXml(sitemapFile.text) : [];

  const pageStatusByUrl = new Map(pages.map((p) => [p.url, p]));
  const sitemapUrls = await Promise.all(
    sitemapEntries.slice(0, 15).map(async (entry) => {
      const existing = pageStatusByUrl.get(entry.loc);
      if (existing) {
        return {
          loc: entry.loc,
          lastmod: entry.lastmod,
          statusCode: existing.statusCode,
          ok: existing.ok,
          tlsValid: existing.tls.valid,
          error: existing.issue,
        };
      }
      try {
        const res = await fetch(entry.loc, {
          method: 'GET',
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'GreysonDashboardAudit/1.0 (+https://greyson.nl)' },
        });
        return {
          loc: entry.loc,
          lastmod: entry.lastmod,
          statusCode: res.status,
          ok: res.ok,
          tlsValid: true,
          error: res.ok ? null : `HTTP ${res.status}`,
        };
      } catch (err) {
        const causeCode =
          err && typeof err === 'object' && 'cause' in err && err.cause && typeof err.cause === 'object'
            ? err.cause.code || err.cause.message
            : null;
        return {
          loc: entry.loc,
          lastmod: entry.lastmod,
          statusCode: null,
          ok: false,
          tlsValid: false,
          error: sanitizeText(causeCode || (err instanceof Error ? err.message : 'Fetch error'), 140),
        };
      }
    })
  );

  const files = rawFiles.map(({ text: _stripped, ...rest }) => rest);

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    pages,
    files,
    robots: robotsAnalysis,
    sitemapUrls,
  };
}

async function resolveDnsViaGoogle(hostname, recordType) {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${encodeURIComponent(recordType)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { status: null, records: [] };
    const data = await res.json();
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    return {
      status: typeof data.Status === 'number' ? data.Status : null,
      records: answers.map((a) => ({
        type: a.type,
        ttl: a.TTL,
        data: sanitizeText(a.data, 200),
      })),
    };
  } catch {
    // Fallback to OS DNS for A records
    if (recordType === 'A') {
      try {
        const addrs = await dns.resolve4(hostname);
        return {
          status: 0,
          records: addrs.map((ip) => ({ type: 1, ttl: 0, data: ip })),
        };
      } catch {
        return { status: null, records: [] };
      }
    }
    return { status: null, records: [] };
  }
}

async function runDiscoveryAudit() {
  const dnsPromises = DNS_HOSTS.map(async (host) => {
    const [aRes, aaaaRes, cnameRes, txtRes] = await Promise.all([
      resolveDnsViaGoogle(host, 'A'),
      resolveDnsViaGoogle(host, 'AAAA'),
      resolveDnsViaGoogle(host, 'CNAME'),
      host === 'greyson.nl' ? resolveDnsViaGoogle(host, 'TXT') : Promise.resolve({ status: 0, records: [] }),
    ]);

    return {
      host,
      a: aRes.records.filter((r) => r.type === 1).map((r) => r.data),
      aaaa: aaaaRes.records.filter((r) => r.type === 28).map((r) => r.data),
      cname: cnameRes.records.filter((r) => r.type === 5).map((r) => r.data),
      txt: txtRes.records.filter((r) => r.type === 16).map((r) => r.data),
      dnsStatus: aRes.status,
    };
  });

  const rdapPromise = (async () => {
    try {
      const res = await fetch('https://rdap.sidn.nl/domain/greyson.nl', {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        return { ok: false, error: `SIDN RDAP HTTP ${res.status}` };
      }
      const data = await res.json();
      const events = Array.isArray(data.events) ? data.events : [];
      const registeredEvent = events.find((e) => e.eventAction === 'registration');
      const changedEvent = events.find((e) => e.eventAction === 'last changed');
      const nameservers = Array.isArray(data.nameservers)
        ? data.nameservers.map((n) => sanitizeText(n.ldhName, 80)).filter(Boolean)
        : [];
      return {
        ok: true,
        domain: sanitizeText(data.ldhName || 'greyson.nl', 80),
        status: Array.isArray(data.status) ? data.status.map((s) => sanitizeText(s, 40)) : [],
        registeredAt: registeredEvent?.eventDate || null,
        lastChangedAt: changedEvent?.eventDate || null,
        nameservers,
        dnssecSigned: Boolean(data.secureDNS?.delegationSigned),
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? sanitizeText(err.message, 120) : 'RDAP fetch failed',
      };
    }
  })();

  const waybackPromise = (async () => {
    try {
      const res = await fetch('https://archive.org/wayback/available?url=greyson.nl', {
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) {
        return { ok: false, available: false, error: `Wayback HTTP ${res.status}` };
      }
      const data = await res.json();
      const closest = data?.archived_snapshots?.closest;
      if (!closest || !closest.available) {
        return { ok: true, available: false };
      }
      return {
        ok: true,
        available: true,
        status: sanitizeText(closest.status, 16),
        timestamp: sanitizeText(closest.timestamp, 20),
        archiveUrl: sanitizeText(closest.url, 200),
      };
    } catch (err) {
      return {
        ok: false,
        available: false,
        error: err instanceof Error ? sanitizeText(err.message, 120) : 'Wayback check failed',
      };
    }
  })();

  const [dnsHosts, rdap, wayback] = await Promise.all([
    Promise.all(dnsPromises),
    rdapPromise,
    waybackPromise,
  ]);

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    dnsHosts,
    rdap,
    wayback,
  };
}

function parseCruxMetrics(experience) {
  if (!experience || !experience.metrics) return null;
  const m = experience.metrics;
  const readPercentile = (key) => {
    const val = m[key]?.percentile;
    return typeof val === 'number' && Number.isFinite(val) ? val : null;
  };
  return {
    overallCategory: sanitizeText(experience.overall_category || '', 32),
    fcpMs: readPercentile('FIRST_CONTENTFUL_PAINT_MS'),
    lcpMs: readPercentile('LARGEST_CONTENTFUL_PAINT_MS'),
    inpMs: readPercentile('INTERACTION_TO_NEXT_PAINT'),
    cls: readPercentile('CUMULATIVE_LAYOUT_SHIFT_SCORE') !== null
      ? Number((readPercentile('CUMULATIVE_LAYOUT_SHIFT_SCORE') / 100).toFixed(3))
      : null,
    ttfbMs: readPercentile('EXPERIMENTAL_TIME_TO_FIRST_BYTE'),
  };
}

async function runPageSpeedAudit(body, env) {
  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : 'https://greyson.nl/';
  if (!PAGESPEED_ALLOWED_URLS.has(rawUrl)) {
    return {
      statusCode: 400,
      payload: { ok: false, error: 'Unsupported target URL for PageSpeed check.' },
    };
  }

  const strategy = body?.strategy === 'desktop' ? 'desktop' : 'mobile';
  const userApiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim().slice(0, 256) : '';
  const apiKey = userApiKey || String(env.GOOGLE_PAGESPEED_API_KEY || '').trim();

  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', rawUrl);
  endpoint.searchParams.set('strategy', strategy);
  endpoint.searchParams.append('category', 'PERFORMANCE');
  endpoint.searchParams.append('category', 'SEO');
  endpoint.searchParams.append('category', 'ACCESSIBILITY');
  endpoint.searchParams.append('category', 'BEST_PRACTICES');
  if (apiKey) {
    endpoint.searchParams.set('key', apiKey);
  }

  try {
    const res = await fetch(endpoint.toString(), {
      signal: AbortSignal.timeout(45_000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        data?.error?.message || `PageSpeed API error (HTTP ${res.status}).`;
      return {
        statusCode: res.status,
        payload: {
          ok: false,
          status: res.status,
          url: rawUrl,
          strategy,
          usedApiKey: Boolean(apiKey),
          error: sanitizeText(msg, 220),
        },
      };
    }

    const categories = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};
    const toScore = (cat) =>
      typeof cat?.score === 'number' ? Math.round(cat.score * 100) : null;

    const seoAudits = SEO_AUDIT_KEYS.map((id) => {
      const audit = audits[id];
      if (!audit) return null;
      return {
        id,
        title: sanitizeText(audit.title || id, 120),
        score: typeof audit.score === 'number' ? audit.score : null,
        displayValue: sanitizeText(audit.displayValue || '', 80),
        scoreDisplayMode: sanitizeText(audit.scoreDisplayMode || '', 32),
      };
    }).filter(Boolean);

    return {
      statusCode: 200,
      payload: {
        ok: true,
        checkedAt: new Date().toISOString(),
        url: rawUrl,
        strategy,
        usedApiKey: Boolean(apiKey),
        scores: {
          performance: toScore(categories.performance),
          seo: toScore(categories.seo),
          accessibility: toScore(categories.accessibility),
          bestPractices: toScore(categories['best-practices']),
        },
        labMetrics: {
          fcpMs: audits['first-contentful-paint']?.numericValue ?? null,
          lcpMs: audits['largest-contentful-paint']?.numericValue ?? null,
          cls: audits['cumulative-layout-shift']?.numericValue ?? null,
          tbtMs: audits['total-blocking-time']?.numericValue ?? null,
          speedIndexMs: audits['speed-index']?.numericValue ?? null,
        },
        fieldData: {
          page: parseCruxMetrics(data?.loadingExperience),
          origin: parseCruxMetrics(data?.originLoadingExperience),
        },
        seoAudits,
      },
    };
  } catch (err) {
    return {
      statusCode: 502,
      payload: {
        ok: false,
        url: rawUrl,
        strategy,
        usedApiKey: Boolean(apiKey),
        error: err instanceof Error ? sanitizeText(err.message, 180) : 'PageSpeed request failed.',
      },
    };
  }
}

function attachMiddleware(middlewares, env) {
  const posthogPersonalKey = String(env.POSTHOG_PERSONAL_API_KEY || '').trim();
  const posthogProjectId = String(env.POSTHOG_PROJECT_ID || '').trim();
  const posthogRegion = normalizeRegion(env.POSTHOG_REGION || env.VITE_POSTHOG_HOST || 'eu');
  const hasPageSpeedKey = Boolean(String(env.GOOGLE_PAGESPEED_API_KEY || '').trim());

  middlewares.use(async (req, res, next) => {
    const reqUrl = req.url || '';
    if (!reqUrl.startsWith('/__dashboard_api/')) {
      next();
      return;
    }

    if (!isLoopbackRequest(req)) {
      sendJson(res, 403, { ok: false, error: 'Dashboard API is restricted to localhost.' });
      return;
    }

    const pathname = reqUrl.split('?')[0];

    try {
      if (pathname === '/__dashboard_api/config-status' && req.method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          posthogEnvConfigured: Boolean(
            posthogPersonalKey.startsWith('phx_') && /^[a-zA-Z0-9_-]{1,32}$/.test(posthogProjectId)
          ),
          posthogProjectId: /^[a-zA-Z0-9_-]{1,32}$/.test(posthogProjectId) ? posthogProjectId : '',
          posthogRegion,
          hasPageSpeedKey,
        });
        return;
      }

      if (pathname === '/__dashboard_api/site-audit' && req.method === 'GET') {
        const result = await runSiteAudit();
        sendJson(res, 200, result);
        return;
      }

      if (pathname === '/__dashboard_api/discovery-audit' && req.method === 'GET') {
        const result = await runDiscoveryAudit();
        sendJson(res, 200, result);
        return;
      }

      if (pathname === '/__dashboard_api/pagespeed' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const { statusCode, payload } = await runPageSpeedAudit(body, env);
        sendJson(res, statusCode, payload);
        return;
      }

      if (pathname === '/__dashboard_api/posthog-query' && req.method === 'POST') {
        if (!posthogPersonalKey.startsWith('phx_')) {
          sendJson(res, 400, {
            ok: false,
            error: 'Server-side POSTHOG_PERSONAL_API_KEY is not configured in .env.',
          });
          return;
        }
        const body = await readJsonBody(req, 65_536);
        const query = typeof body?.query === 'string' ? body.query.trim() : '';
        const targetProjectId =
          typeof body?.projectId === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(body.projectId.trim())
            ? body.projectId.trim()
            : posthogProjectId;
        const targetRegion = normalizeRegion(body?.region || posthogRegion);

        if (!query || !targetProjectId) {
          sendJson(res, 400, { ok: false, error: 'Missing query or Project ID.' });
          return;
        }

        const apiUrl =
          targetRegion === 'us' ? 'https://us.posthog.com' : 'https://eu.posthog.com';
        const phRes = await fetch(
          `${apiUrl}/api/projects/${encodeURIComponent(targetProjectId)}/query/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${posthogPersonalKey}`,
            },
            body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
            signal: AbortSignal.timeout(15_000),
          }
        );

        const text = await phRes.text();
        res.statusCode = phRes.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(text);
        return;
      }

      sendJson(res, 404, { ok: false, error: 'Unknown dashboard endpoint.' });
    } catch (err) {
      sendJson(res, 500, {
        ok: false,
        error: err instanceof Error ? sanitizeText(err.message, 180) : 'Internal dashboard probe error.',
      });
    }
  });
}

export function dashboardLocalApiPlugin(env = {}) {
  return {
    name: 'greyson-dashboard-local-api',
    configureServer(server) {
      attachMiddleware(server.middlewares, env);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares, env);
    },
  };
}
