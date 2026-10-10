// ใช้งานได้แม้ไม่มีเน็ต: หน้าเว็บโหลดจากเน็ตก่อน (ได้เวอร์ชันล่าสุด) ถ้าไม่มีเน็ตใช้สำเนาในเครื่อง
const CACHE='w11-v11';
const PAGES=['./','index.html','news2.html','pews.html','fall.html','adl.html','report.html','settings.html','manifest.webmanifest','icon-192.png','icon-512.png','qr.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PAGES.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
if(u.origin===location.origin){e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>{const f=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>m);return m||f})))}});
