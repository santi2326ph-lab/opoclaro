import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './site-files.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'dist');

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`No se permiten enlaces simbólicos en dist: ${relative}`);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Tipo de archivo no permitido en dist: ${relative}`);
  }
  return files.sort();
}

// Rebuild only this generated directory. The allowlist prevents dotfiles,
// repository metadata, local state and documentation from entering the upload.
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const relative of publicFiles) {
  const source = path.join(projectRoot, ...relative.split('/'));
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) throw new Error(`Falta un archivo público requerido: ${relative}`);
  const destination = path.join(outputDir, ...relative.split('/'));
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

const builtFiles = await listFiles(outputDir);
const expectedFiles = [...publicFiles].sort();
if (JSON.stringify(builtFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(`El contenido de dist no coincide con la lista pública permitida. Recibidos: ${builtFiles.join(', ')}`);
}

console.log(`Salida limpia creada en dist (${builtFiles.length} archivos):`);
for (const file of builtFiles) console.log(`  ${file}`);
