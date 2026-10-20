import { access, readFile, realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
await access(distDir);
const root = await realpath(distDir);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const candidate = path.resolve(root, `.${pathname}`);
    if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== path.join(root, 'index.html')) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(candidate);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(candidate)] ?? 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(candidate));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Vista previa de dist: http://localhost:4173/ (Ctrl+C para detener).');
});
