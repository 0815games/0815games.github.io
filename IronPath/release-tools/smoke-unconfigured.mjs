// Opt-in probe for a deliberately unconfigured, isolated session deployment.
// It sends no real credentials and does not exercise a configured service.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBoundedJson} from './bounded-json.mjs';

export async function probeUnconfiguredSession(endpoint, {fetcher=globalThis.fetch, timeoutMs=8000} = {}) {
  let url;
  try { url=new URL(endpoint); } catch { throw Error('Invalid session endpoint'); }
  if (url.protocol!=='https:' || url.username || url.password || url.port || url.search || url.hash ||
      url.pathname!=='/api/session' || typeof fetcher!=='function' ||
      !Number.isInteger(timeoutMs) || timeoutMs<1 || timeoutMs>30000) throw Error('Invalid session endpoint');

  const origin='https://0815games.github.io';
  const requests=[
    {method:'GET'},
    {method:'OPTIONS',headers:{origin,'access-control-request-method':'POST',
      'access-control-request-headers':'authorization,content-type'}},
    {method:'POST',headers:{origin,'content-type':'application/json',
      authorization:'Bearer synthetic-invalid-probe'},body:JSON.stringify({build:'smoke-test'})}
  ];
  const results=[];
  for (const request of requests) {
    const controller=new AbortController();let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Probe timed out'));},timeoutMs);});
    const work=(async()=>{
      const response=await fetcher(url.href,{...request,signal:controller.signal,
        cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
      if (response?.status!==503 || !/^application\/json(?:\s*;|$)/i.test(response.headers?.get('content-type')||'') ||
          !/(?:^|,)\s*no-store\s*(?:,|$)/i.test(response.headers?.get('cache-control')||'') ||
          response.headers?.get('x-content-type-options')?.toLowerCase()!=='nosniff') {
        try { void response?.body?.cancel().catch(()=>{}); } catch {}
        throw Error(`${request.method}: unexpected response`);
      }
      const body=await readBoundedJson(response,1024);
      if (!body || Array.isArray(body) || Object.keys(body).length!==1 || body.status!=='unavailable') {
        throw Error(`${request.method}: unexpected response`);
      }
      return {method:request.method,status:response.status};
    })();
    try { results.push(await Promise.race([work,timeout])); }
    finally { clearTimeout(timer);controller.abort(); }
  }
  return results;
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length!==3) {
    console.error('Usage: node smoke-unconfigured.mjs <https://host/api/session>');
    process.exitCode=2;
  } else {
    probeUnconfiguredSession(process.argv[2])
      .then(results=>console.log(`Unconfigured service: ${results.map(item=>`${item.method} ${item.status}`).join(', ')}; no-store JSON.`))
      .catch(()=>{console.error('Unconfigured service probe failed; no credentials were sent.');process.exitCode=1;});
  }
}
