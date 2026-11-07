/* Build substitutes the release key and exact allowlist. */
const cacheName='boliche-__BUILD__';
const paths=['__PATHS__'];
const files=new Set(paths);
const shellPaths=new Set(['/','/reglamento','/privacidad','/terminos','/borrar-cuenta','/creditos','/soporte']);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(paths)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('boliche-')&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'&&(shellPaths.has(url.pathname)||/^\/sala\/[A-Z2-9]{6}$/.test(url.pathname))){
  event.respondWith(fetch(request).catch(()=>caches.open(cacheName).then(cache=>cache.match('/'))));return;
 }
 if(files.has(url.pathname))event.respondWith(caches.open(cacheName).then(cache=>cache.match(url.pathname)).then(response=>response??fetch(request)));
});
