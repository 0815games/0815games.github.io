// Unmounted HTTP adapter for the experimental release-session exchange.
// Production additionally requires HTTPS, distributed rate limits, logging
// redaction, managed identity, health/alerts and independent security review.
import http from 'node:http';

export function createReleaseSessionHttpServer({exchange, allowedOrigins} = {}) {
  if (typeof exchange?.exchange !== 'function' || !Array.isArray(allowedOrigins) || !allowedOrigins.length) {
    throw Error('Exchange and explicit allowed HTTPS origins are required');
  }
  for (const origin of allowedOrigins) {
    let url; try { url = new URL(origin); } catch { throw Error('Invalid origin'); }
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw Error('Invalid origin');
  }
  const origins = new Set(allowedOrigins);
  const headers = origin => ({
    'cache-control':'no-store', 'pragma':'no-cache', 'content-type':'application/json; charset=utf-8',
    'x-content-type-options':'nosniff', 'content-security-policy':"default-src 'none'; frame-ancestors 'none'",
    'vary':'Origin', ...(origins.has(origin) ? {'access-control-allow-origin':origin} : {})
  });
  const reply = (res, status, payload, origin) => {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, headers(origin));
    res.end(JSON.stringify(payload));
  };
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (!origins.has(origin)) { req.resume(); return reply(res, 403, {status:'origin-denied'}, origin); }
    // Exact route only. Never accept tokens in a URL or in access-log fields.
    if (req.url !== '/v1/session') { req.resume(); return reply(res, 404, {status:'not-found'}, origin); }
    if (req.method === 'OPTIONS') {
      if (req.headers['access-control-request-method'] !== 'POST') return reply(res, 405, {status:'method-not-allowed'}, origin);
      res.writeHead(204, {...headers(origin), 'access-control-allow-methods':'POST',
        'access-control-allow-headers':'Authorization, Content-Type', 'access-control-max-age':'300'});
      return res.end();
    }
    if (req.method !== 'POST') { req.resume(); return reply(res, 405, {status:'method-not-allowed'}, origin); }
    const auth = req.headers.authorization;
    if (typeof auth !== 'string' || !/^Bearer [^\s]{1,8192}$/.test(auth)) {
      req.resume(); return reply(res, 401, {status:'unauthorized'}, origin);
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      req.resume(); return reply(res, 415, {status:'invalid-content-type'}, origin);
    }
    let length = 0, chunks = [], tooLarge = false;
    req.on('data', chunk => {
      length += chunk.length;
      if (length > 1024) { tooLarge = true; chunks = []; }
      else if (!tooLarge) chunks.push(chunk);
    });
    req.on('aborted', () => reply(res, 400, {status:'invalid'}, origin));
    req.on('error', () => reply(res, 400, {status:'invalid'}, origin));
    req.on('end', async () => {
      if (tooLarge) return reply(res, 413, {status:'body-too-large'}, origin);
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return reply(res, 400, {status:'invalid'}, origin); }
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          Object.keys(body).length !== 1 || !Object.hasOwn(body, 'build')) {
        return reply(res, 400, {status:'invalid'}, origin);
      }
      try {
        const result = await exchange.exchange({idToken:auth.slice(7), build:body.build});
        const codes = new Map([['ok',200], ['invalid',400], ['unauthorized',401], ['outdated',409], ['maintenance',503], ['unavailable',503]]);
        let kind = codes.has(result?.status) ? result.status : 'unavailable';
        if (kind === 'ok' && (typeof result.customToken !== 'string' || !result.customToken || result.customToken.length > 16384)) kind = 'unavailable';
        // Never reflect a verifier exception, caller token, UID or arbitrary result.
        const payload = kind === 'ok' ? {status:'ok', customToken:result.customToken} : {status:kind};
        return reply(res, codes.get(kind), payload, origin);
      } catch { return reply(res, 503, {status:'unavailable'}, origin); }
    });
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 15000;
  return server;
}
