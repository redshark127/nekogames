const CACHE = 'nekogames-v12';
const PRECACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/icon.svg',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function proxyGame(request) {
  try {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('u');
    if (!target) return Response.redirect(request.referrer || '/', 302);
    const resp = await fetch(target, { mode: 'cors', credentials: 'omit' });
    if (!resp.ok) return Response.redirect(target, 302);
    const ct = resp.headers.get('content-type') || '';
    let html = null;
    if (/text\/html/i.test(ct)) {
      html = await resp.text();
    } else if (/text\/plain/i.test(ct)) {
      const text = await resp.text();
      if (/<(?:!doctype|html|head|body|script|base)[\s>]/i.test(text.slice(0, 2000))) {
        html = text;
      } else {
        const passHeaders = new Headers(resp.headers);
        return new Response(text, { status: resp.status, statusText: resp.statusText, headers: passHeaders });
      }
    } else {
      return resp;
    }
    html = html.replace(/<meta[^>]*http-equiv=["']content-security-policy["'][^>]*>/gi, '');
    const u = new URL(target);
    const base = u.origin + u.pathname.slice(0, u.pathname.lastIndexOf('/') + 1);
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">');
    } else {
      html = '<base href="' + base + '">' + html;
    }
    const shim = '<script>(function(){var _c={},_r=false,_q=[];function _ok(){_r=true;_q.forEach(function(f){f()});_q=[]}window.addEventListener("message",function(e){if(e.data&&e.data.type==="ng-s-init"){_c=e.data.d||{};_ok()}});parent.postMessage({type:"ng-s-req"},'*');var _h={getItem:function(k){return _c[k]!==undefined?_c[k]:null},setItem:function(k,v){_c[k]=String(v);parent.postMessage({type:"ng-s-set",k:k,v:String(v)},'*')},removeItem:function(k){delete _c[k];parent.postMessage({type:"ng-s-del",k:k},'*')},clear:function(){_c={};parent.postMessage({type:"ng-s-clr"},'*')},get length(){return Object.keys(_c).length},key:function(i){return Object.keys(_c)[i]||null}};Object.defineProperty(window,"localStorage",{get:function(){return _h},configurable:true})})();<\/script>';
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, shim + '</head>');
    } else if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, shim + '</body>');
    } else {
      html += shim;
    }
    const headers = new Headers(resp.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('x-frame-options');
    headers.delete('content-security-policy');
    return new Response(html, { status: 200, headers });
  } catch (e) {
    return Response.redirect(target || '/', 302);
  }
}

self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);
  if (reqUrl.pathname.endsWith('/gp/')) {
    event.respondWith(proxyGame(event.request));
    return;
  }
  const hostIsGitRaw = /^(raw\.githubusercontent\.com|rawcdn\.githack\.com|raw\.githack\.com)$/i.test(reqUrl.hostname);
  const isWasm = /\.wasm(\.gz)?$/i.test(reqUrl.pathname);
  if (hostIsGitRaw && (event.request.destination === 'script' || event.request.destination === 'style' || isWasm)) {
    const ct = event.request.destination === 'style' ? 'text/css; charset=utf-8'
      : isWasm ? 'application/wasm'
      : 'application/javascript; charset=utf-8';
    event.respondWith(
      fetch(event.request.url, { mode: 'cors' }).then(resp => {
        if (!resp.ok || !resp.body) return resp;
        const headers = new Headers(resp.headers);
        headers.set('content-type', ct);
        headers.delete('content-encoding');
        return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  if (event.request.url.includes('games.json')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
