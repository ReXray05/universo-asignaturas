import { readFile, readdir, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const categories = ['notas-clase', 'apuntes-estudio', 'laboratorio'];
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fail = (message) => { throw new Error(message); };
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
export const normalizedTitle = (title) => title.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
export function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
export async function readRegistry(root) {
  return {
    subjects: JSON.parse(await readFile(path.join(root, 'src/data/subjects.json'), 'utf8')),
    lessons: JSON.parse(await readFile(path.join(root, 'src/data/lessons.json'), 'utf8')),
  };
}
export function validateRecords(subjects, lessons) {
  if (!Array.isArray(subjects) || !Array.isArray(lessons)) fail('Las asignaturas y las clases deben ser listas JSON.');
  const subjectIds = new Set();
  for (const subject of subjects) {
    if (!slugPattern.test(subject.id ?? '') || subjectIds.has(subject.id)) fail(`Identificador de asignatura inválido o duplicado: ${subject.id}`);
    subjectIds.add(subject.id);
    if (!nonempty(subject.name) || !nonempty(subject.abbreviation) || ![3, 4].includes(subject.year) || !/^#[0-9a-f]{6}$/i.test(subject.color ?? '')) fail(`Asignatura incompleta: ${subject.id}`);
    if (!subject.position || !Number.isFinite(subject.position.x) || !Number.isFinite(subject.position.y)) fail(`Posición inválida: ${subject.id}`);
  }
  const ids = new Set(), paths = new Set(), titles = new Set();
  for (const lesson of lessons) {
    if (!slugPattern.test(lesson.id ?? '') || ids.has(lesson.id)) fail(`Identificador de clase inválido o duplicado: ${lesson.id}`);
    ids.add(lesson.id);
    if (!subjectIds.has(lesson.subjectId)) fail(`Asignatura desconocida en ${lesson.id}: ${lesson.subjectId}`);
    if (!nonempty(lesson.title) || typeof lesson.description !== 'string') fail(`Título o descripción inválidos: ${lesson.id}`);
    if (lesson.path !== `lessons/${lesson.id}/index.html`) fail(`Ruta inválida en ${lesson.id}; debe ser lessons/${lesson.id}/index.html`);
    if (paths.has(lesson.path.toLowerCase())) fail(`Ruta duplicada: ${lesson.path}`);
    paths.add(lesson.path.toLowerCase());
    const titleKey = `${lesson.subjectId}:${normalizedTitle(lesson.title)}`;
    if (titles.has(titleKey)) fail(`Ya existe una clase con ese título en ${lesson.subjectId}: ${lesson.title}`);
    titles.add(titleKey);
    if (lesson.date != null && (!/^\d{4}-\d{2}-\d{2}$/.test(lesson.date) || !Number.isFinite(Date.parse(lesson.date)) || new Date(lesson.date).toISOString().slice(0, 10) !== lesson.date)) fail(`Fecha inválida: ${lesson.id}`);
    if (lesson.category != null && !categories.includes(lesson.category)) fail(`Categoría inválida: ${lesson.id}`);
    if (lesson.tags != null && (!Array.isArray(lesson.tags) || lesson.tags.some(tag => !nonempty(tag)) || new Set(lesson.tags).size !== lesson.tags.length)) fail(`Etiquetas inválidas o duplicadas: ${lesson.id}`);
  }
}
export async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (['.git', 'node_modules'].includes(entry.name) || /^\.env(?:\.|$)/i.test(entry.name)) fail(`No publiques dependencias de desarrollo ni archivos privados: ${entryPath}`);
    if (entry.isSymbolicLink()) fail(`No se admiten enlaces simbólicos: ${entryPath}`);
    if (entry.isDirectory()) files.push(...await listFiles(entryPath));
    else if (entry.isFile()) files.push(entryPath);
    else fail(`Archivo especial no admitido: ${entryPath}`);
  }
  return files;
}
function references(text, extension) {
  const found = [];
  if (['.html', '.htm'].includes(extension)) {
    for (const match of text.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) found.push(match[1]);
    for (const match of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
      if (!match[1].startsWith('data:')) found.push(...match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
    }
  }
  if (['.html', '.htm', '.css'].includes(extension)) {
    for (const match of text.matchAll(/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) found.push(match[1]);
    for (const match of text.matchAll(/@import\s+["']([^"']+)["']/gi)) found.push(match[1]);
  }
  if (['.js', '.mjs', '.html', '.htm'].includes(extension)) {
    for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) found.push(match[1]);
  }
  return found;
}
export async function validateLessonFiles(directory) {
  if (!(await lstat(directory)).isDirectory()) fail(`El origen debe ser una carpeta real, sin enlaces simbólicos: ${directory}`);
  const resolved = await realpath(directory);
  const index = path.join(resolved, 'index.html');
  try { if (!(await lstat(index)).isFile()) fail(`Falta index.html en ${directory}`); }
  catch { fail(`Falta index.html en ${directory}; importa una carpeta estática ya compilada.`); }
  const files = await listFiles(resolved);
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (!['.html', '.htm', '.css', '.js', '.mjs'].includes(extension)) continue;
    const text = await readFile(file, 'utf8');
    for (const reference of references(text, extension)) {
      if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue;
      let relative;
      try { relative = decodeURIComponent(reference.split(/[?#]/)[0].replace(/&amp;/g, '&')); }
      catch { fail(`Ruta con codificación inválida en ${file}: ${reference}`); }
      if (!relative) continue;
      if (relative.startsWith('/') || relative.includes('\\')) fail(`Usa rutas relativas para GitHub Pages en ${file}: ${reference}`);
      let target = path.resolve(path.dirname(file), relative);
      if (!isWithin(resolved, target)) fail(`Dependencia fuera de la carpeta de la clase en ${file}: ${reference}`);
      let stat;
      try { stat = await lstat(target); } catch { fail(`Dependencia no encontrada en ${file}: ${reference}`); }
      if (stat.isDirectory()) target = path.join(target, 'index.html');
      try { if (!(await lstat(target)).isFile()) fail(`Dependencia inválida: ${reference}`); }
      catch { fail(`Dependencia no encontrada en ${file}: ${reference}`); }
    }
  }
  return files.length;
}
export async function validateProject(root) {
  const { subjects, lessons } = await readRegistry(root);
  validateRecords(subjects, lessons);
  for (const lesson of lessons) await validateLessonFiles(path.join(root, 'public/lessons', lesson.id));
  return { subjects: subjects.length, lessons: lessons.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateProject(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'))
    .then(result => console.log(`Datos y archivos válidos: ${result.subjects} asignaturas, ${result.lessons} clases.`))
    .catch(error => { console.error(`Validación fallida: ${error.message}`); process.exitCode = 1; });
}
