import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './site-files.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const failures = [];

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

function localTarget(owner, rawUrl) {
  const value = rawUrl.trim();
  if (!value || value.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return null;
  const url = new URL(value, `https://opoclaro.invalid/${owner}`);
  let target = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!target || target.endsWith('/')) target += 'index.html';
  return { target, fragment: url.hash.slice(1) };
}

try {
  await access(distDir);
} catch {
  throw new Error('No existe dist. Ejecuta primero `npm run build`.');
}

const actualFiles = await walk(distDir);
const expectedFiles = [...publicFiles].sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  failures.push(`Lista de publicación distinta a la permitida. Encontrados: ${actualFiles.join(', ')}`);
}

try {
  const wrangler = JSON.parse(await readFile(path.join(projectRoot, 'wrangler.jsonc'), 'utf8'));
  if (wrangler.assets?.directory !== './dist') failures.push('Wrangler no apunta exclusivamente a ./dist.');
  if (wrangler.name !== 'opoclaro') failures.push('El nombre de Worker configurado no es opoclaro.');
} catch (error) {
  failures.push(`No se pudo validar wrangler.jsonc: ${error.message}`);
}

const forbiddenPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/
];
for (const file of actualFiles) {
  const content = await readFile(path.join(distDir, ...file.split('/')));
  if (forbiddenPatterns.some(pattern => pattern.test(content.toString('utf8')))) {
    failures.push(`${file}: contiene un patrón reconocido de credenciales.`);
  }
}

const htmlFiles = actualFiles.filter(file => file.endsWith('.html'));
for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(distDir, ...htmlFile.split('/')), 'utf8');
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]));
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const target = localTarget(htmlFile, match[1]);
    if (!target) continue;
    const absolute = path.join(distDir, ...target.target.split('/'));
    try {
      await access(absolute);
      if (target.fragment && target.target.endsWith('.html')) {
        const targetHtml = target.target === htmlFile ? html : await readFile(absolute, 'utf8');
        const targetIds = target.target === htmlFile ? ids : new Set([...targetHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map(item => item[1]));
        if (!targetIds.has(decodeURIComponent(target.fragment))) failures.push(`${htmlFile}: el destino #${target.fragment} no existe en ${target.target}`);
      }
    } catch {
      failures.push(`${htmlFile}: referencia local sin archivo: ${match[1]}`);
    }
  }
}

for (const script of [
  'assets/calculadora.js',
  'assets/planificador.js',
  'assets/site.js',
  'scripts/build.mjs',
  'scripts/check-site.mjs',
  'scripts/serve-dist.mjs',
  'scripts/site-files.mjs',
  'scripts/test-functionality.mjs'
]) {
  const result = spawnSync(process.execPath, ['--check', path.join(projectRoot, ...script.split('/'))], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${script}: ${result.stderr.trim() || result.stdout.trim()}`);
}

if (failures.length) {
  console.error(`Fallaron ${failures.length} comprobaciones:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`OK: ${actualFiles.length} archivos en la lista permitida, ${htmlFiles.length} páginas HTML, enlaces y recursos locales resueltos, configuración de Wrangler segura y JavaScript válido.`);
}
