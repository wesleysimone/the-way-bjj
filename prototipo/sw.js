/* Service worker da The Way.
 * Estratégia: "rede primeiro, sem cache HTTP". Com internet, o app SEMPRE busca a versão
 * mais nova de cada arquivo (por isso toda alteração publicada aparece no app instalado).
 * Sem internet, usa a última cópia salva (o app abre mesmo offline).
 * Ao publicar mudanças, aumente VERSION: o navegador detecta o sw.js novo, instala
 * na hora (skipWaiting) e a página recarrega sozinha (ver core.js).
 */
const VERSION = '0.3.0';
const CACHE = 'theway-' + VERSION;
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './css/styles.css', './js/data.js', './js/core.js', './js/site.js', './js/aluno.js', './js/admin.js', './js/rosto.js',
  './assets/icons/logo-256.png', './assets/icons/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== 'theway-compartilhada').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Foto compartilhada do WhatsApp/galeria → app (Android, app instalado): guarda e abre o painel
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/compartilhar-foto')) {
    e.respondWith((async () => {
      const dados = await req.formData();
      const foto = dados.get('foto');
      if (foto) {
        const c = await caches.open('theway-compartilhada');
        await c.put('./_foto-compartilhada', new Response(foto, { headers: { 'Content-Type': foto.type || 'image/jpeg' } }));
      }
      return Response.redirect('./?foto=compartilhada#/admin/hoje', 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
  } else if (url.hostname.includes('fonts.g') || url.pathname.includes('/@vladmandic/face-api@')) {
    // Fontes e modelos de reconhecimento facial: cache primeiro (versão fixa, não mudam)
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data === 'versao') e.source.postMessage({ versao: VERSION });
});
