/* Roda o site + a API no seu computador SEM instalar PHP:
 * o PHP roda dentro do Node (php-wasm) e os dados ficam num arquivo SQLite (servidor/dados-local.db).
 * Serve para testar a lista compartilhada na rede de casa/serviço (outros aparelhos no mesmo Wi-Fi).
 *
 *   npm i @php-wasm/node @php-wasm/universal
 *   node servidor/rodar-local.mjs            → http://localhost:8080
 *
 * Códigos: equipe = "equipe", admin = "admin" (troque com as variáveis TW_EQUIPE e TW_ADMIN).
 * Para usar o MySQL de verdade, use PHP normal (veja documentacao/BASE-MYSQL.md).
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime } from '@php-wasm/node';

const aqui = dirname(fileURLToPath(import.meta.url));
const site = join(aqui, '..', 'prototipo');
const arqBanco = join(aqui, 'dados-local.db');
const PORTA = +(process.env.PORT || 8080);

const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: 1 } }));
php.mkdir('/www');
php.writeFile('/www/api.php', readFileSync(join(aqui, 'api.php'), 'utf8'));
php.writeFile('/www/config.php', `<?php return ['dsn' => 'sqlite:/www/dados.db', 'codigo_equipe' => ${JSON.stringify(process.env.TW_EQUIPE || 'equipe')}, 'codigo_admin' => ${JSON.stringify(process.env.TW_ADMIN || 'admin')}, 'origens' => ['*']];`);
if (existsSync(arqBanco)) php.writeFile('/www/dados.db', readFileSync(arqBanco));
const guardar = () => { try { if (php.fileExists('/www/dados.db')) writeFileSync(arqBanco, php.readFileAsBuffer('/www/dados.db')); } catch (e) { console.error(e.message); } };

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
let fila = Promise.resolve(); // uma chamada por vez (como um banco com transação)

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.endsWith('/api.php')) {
    const partes = []; for await (const c of req) partes.push(c);
    fila = fila.then(async () => {
      const r = await php.run({ scriptPath: '/www/api.php', method: req.method, headers: { 'Content-Type': 'application/json', origin: req.headers.origin || '' }, body: new Uint8Array(Buffer.concat(partes)) });
      guardar();
      const h = {}; for (const [k, v] of Object.entries(r.headers)) h[k] = Array.isArray(v) ? v.join(', ') : v;
      res.writeHead(r.httpStatusCode, h); res.end(r.bytes ? Buffer.from(r.bytes) : r.text);
    }).catch((e) => { res.writeHead(500); res.end(JSON.stringify({ ok: false, erro: e.message })); });
    return;
  }
  if (url.pathname === '/js/config.js') { // aponta o site para esta API
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    return res.end("window.THEWAY_CONFIG = { apiUrl: './api.php' };");
  }
  let caminho = normalize(join(site, decodeURIComponent(url.pathname)));
  if (!caminho.startsWith(site)) { res.writeHead(403); return res.end(); }
  if (existsSync(caminho) && statSync(caminho).isDirectory()) caminho = join(caminho, 'index.html');
  if (!existsSync(caminho)) { res.writeHead(404); return res.end('não encontrado'); }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(readFileSync(caminho));
}).listen(PORTA, () => console.log(`THE WAY local com lista compartilhada: http://localhost:${PORTA}/?equipe=${process.env.TW_EQUIPE || 'equipe'}`));
