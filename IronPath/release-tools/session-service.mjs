// Shared, still-unreleased Vercel/Node service plumbing. No credentials are
// read, stored or logged here. The public control record is fetched directly
// from Firebase REST for every check; the Admin SDK is used only for Auth.
import {CONTROL_PATH} from './release-control.mjs';
import {createReleaseSessionExchange} from './session-exchange.mjs';
import {readBoundedJson} from './bounded-json.mjs';

export function controlUrl(databaseUrl) {
  let url;
  try { url = new URL(databaseUrl); } catch { throw Error('Invalid Firebase database URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash ||
      !/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:firebasedatabase\.app|firebaseio\.com)$/.test(url.hostname)) {
    throw Error('Invalid Firebase database URL');
  }
  url.pathname = `/${CONTROL_PATH}.json`;
  return url.href;
}

// A bounded response and timeout prevent a broken upstream from tying up a
// function indefinitely. Cache directives do not prove a server's freshness;
// the actual Firebase REST endpoint and production caching still need testing.
export function createFreshControlReader({databaseUrl, fetcher = globalThis.fetch, timeoutMs = 5000} = {}) {
  const url = controlUrl(databaseUrl);
  if (typeof fetcher !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    throw Error('Invalid release control reader');
  }
  return async function readControl() {
    const controller = new AbortController();
    let timer;
    const aborted = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(Error('Control read timed out')), {once:true});
    });
    const work = (async () => {
      const response = await fetcher(url, {
        method:'GET', cache:'no-store', redirect:'error', credentials:'omit',
        headers:{'cache-control':'no-cache, no-store', 'accept':'application/json'}, signal:controller.signal
      });
      if (!response?.ok) throw Error('Control read failed');
      return readBoundedJson(response, 2048);
    })();
    try {
      timer = setTimeout(() => controller.abort(), timeoutMs);
      return await Promise.race([work, aborted]);
    } finally { clearTimeout(timer); }
  };
}

// Inject the real Firebase Admin Auth object (or a test double). The database
// control is public/read-only, so the service does not need Admin DB access.
export function createConfiguredSessionExchange({databaseUrl, adminAuth, fetcher, timeoutMs, now} = {}) {
  if (typeof adminAuth?.verifyIdToken !== 'function' || typeof adminAuth?.createCustomToken !== 'function') {
    throw Error('Firebase Admin Auth is required');
  }
  const readControl = createFreshControlReader({databaseUrl, fetcher, timeoutMs});
  return createReleaseSessionExchange({
    readControl,
    verifyIdToken:(token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
    mintCustomToken:(uid, claims) => adminAuth.createCustomToken(uid, claims),
    ...(now ? {now} : {})
  });
}
