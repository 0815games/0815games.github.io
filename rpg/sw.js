const CACHE='schattengruft-v0.4.1';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('schattengruft-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(request,{cache:'no-cache'}).then(response=>{
  if(response.ok)event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,response.clone())));
  return response;
 }).catch(async()=>{const cached=await caches.match(request);if(cached)return cached;if(request.mode==='navigate'){const page=await caches.match(new URL('./index.html',self.location.href).href);if(page)return page;}return new Response('Offline: Datei noch nicht gespeichert.',{status:503});}));
});
