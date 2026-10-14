const CACHE='schattengruft-v0.5.0';
const SCOPE=new URL(self.registration.scope).pathname;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('schattengruft-')&&k!==CACHE).map(k=>caches.delete(k)));}catch(error){console.warn('Spielcache konnte nicht bereinigt werden:',error);}await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;
 const staticAsset=request.mode==='navigate'||/\.(?:html|js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);
 if(!staticAsset)return;
 let cacheWrite=Promise.resolve();
 const network=fetch(request,{cache:'no-cache'}).then(response=>{
  if(response.ok&&response.type!=='opaque'){
   const copy=response.clone();
   cacheWrite=caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(error=>{console.warn('Optionaler Spielcache nicht verfügbar:',error);});
  }
  return response;
 });
 event.waitUntil(network.then(()=>cacheWrite).catch(()=>{}));
 event.respondWith(network.catch(async()=>{
  try{const cache=await caches.open(CACHE);const cached=await cache.match(request);if(cached)return cached;if(request.mode==='navigate'){const page=await cache.match(new URL('index.html',self.registration.scope).href);if(page)return page;}}catch(error){console.warn('Offlinecache nicht verfügbar:',error);}
  return new Response('Offline: Diese Spieldatei wurde noch nicht gespeichert.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});
