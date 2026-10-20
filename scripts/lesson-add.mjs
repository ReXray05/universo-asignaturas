import { cp, mkdir, readFile, writeFile, rename, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { readRegistry, validateProject, validateRecords, validateLessonFiles, normalizedTitle, slugPattern, isWithin } from './validate.mjs';

export function parseArgs(args) {
  const options = {};
  const allowed = new Set(['subject', 'title', 'source', 'id', 'description', 'date', 'category', 'tags']);
  for (let i = 0; i < args.length; i++) {
    const name = args[i].replace(/^--/, '');
    if (args[i] === '--help') return { help: true };
    if (args[i] === '--update') { options.update = true; continue; }
    if (!args[i].startsWith('--') || !allowed.has(name) || options[name] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Argumento inválido o sin valor: ${args[i]}`);
    options[name] = args[++i];
  }
  for (const key of ['subject', 'title', 'source']) if (!options[key]?.trim()) throw new Error(`Falta --${key}`);
  return options;
}
export const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const exists = async value => { try { await lstat(value); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };

export async function addLesson(root, options) {
  root = path.resolve(root);
  // Validate the existing portal before modifying its accumulated collection.
  await validateProject(root);
  const { subjects, lessons } = await readRegistry(root);
  const source = path.resolve(options.source);
  const id = options.id ?? `${options.subject}-${slugify(options.title)}`;
  if (!slugPattern.test(id)) throw new Error('El identificador debe contener letras minúsculas, números y guiones.');
  const previous = lessons.find(lesson => lesson.id === id);
  if (options.update && !options.id) throw new Error('--update requiere --id con el identificador existente.');
  if (previous && !options.update) throw new Error(`La clase ${id} ya existe. Para actualizarla usa --update --id ${id}.`);
  if (!previous && options.update) throw new Error(`No existe la clase que se quiere actualizar: ${id}`);
  const conflict = lessons.find(lesson => lesson.id !== id && lesson.subjectId === options.subject && normalizedTitle(lesson.title) === normalizedTitle(options.title));
  if (conflict) throw new Error(`Ese título ya está registrado como ${conflict.id}; actualiza esa entrada.`);
  const lesson = {
    ...(previous ?? {}), id, subjectId: options.subject, title: options.title.trim(),
    description: options.description ?? previous?.description ?? '',
    path: `lessons/${id}/index.html`,
  };
  for (const key of ['date', 'category']) if (options[key] !== undefined) lesson[key] = options[key];
  if (options.tags !== undefined) lesson.tags = options.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  const next = previous ? lessons.map(item => item.id === id ? lesson : item) : [...lessons, lesson];
  validateRecords(subjects, next);
  const destination = path.join(root, 'public/lessons', id);
  if (!isWithin(path.join(root, 'public/lessons'), destination)) throw new Error('Destino fuera de la biblioteca.');
  if (isWithin(destination, source) || isWithin(source, destination)) throw new Error('La carpeta de origen y la de destino deben ser independientes.');
  await validateLessonFiles(source);
  if (!previous && await exists(destination)) throw new Error(`Ya hay archivos sin registrar en ${destination}; no se sobrescriben.`);
  const transaction = path.join(root, 'work', `import-${randomUUID()}`);
  const staged = path.join(transaction, 'lesson');
  const backup = path.join(transaction, 'previous');
  const registry = path.join(root, 'src/data/lessons.json');
  const originalRegistry = await readFile(registry, 'utf8');
  await mkdir(transaction, { recursive: true });
  let installed = false, backedUp = false;
  try {
    await cp(source, staged, { recursive: true, errorOnExist: true, force: false });
    await validateLessonFiles(staged);
    await mkdir(path.dirname(destination), { recursive: true });
    if (previous) { await rename(destination, backup); backedUp = true; }
    await rename(staged, destination); installed = true;
    // The previous registry and previous lesson remain available for recovery.
    await writeFile(path.join(transaction, 'lessons.before.json'), originalRegistry);
    const stagedRegistry = path.join(path.dirname(registry), `.lessons-${randomUUID()}.tmp`);
    try {
      await writeFile(stagedRegistry, `${JSON.stringify(next, null, 2)}\n`);
      await rename(stagedRegistry, registry);
    } finally { await rm(stagedRegistry, { force: true }); }
    await validateProject(root);
  } catch (error) {
    if (installed) await rm(destination, { recursive: true, force: true });
    if (backedUp) await rename(backup, destination);
    await writeFile(registry, originalRegistry);
    throw error;
  }
  return { lesson, backup: previous ? transaction : null, route: `#/lesson/${id}` };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('npm run lesson:add -- --subject tmm --title "Nombre" --source "./programa" [--id id] [--description "Texto"] [--date YYYY-MM-DD] [--category notas-clase|apuntes-estudio|laboratorio] [--tags "etiqueta,otra"] [--update]');
    else {
      const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
      const result = await addLesson(root, options);
      console.log(`Clase registrada: ${result.lesson.title}\nRuta permanente: ${result.route}\nArchivos: public/lessons/${result.lesson.id}/`);
      if (result.backup) console.log(`Copia anterior conservada en: ${result.backup}`);
      console.log('Ejecuta npm test y npm run build; revisa los cambios antes de commit y push.');
    }
  } catch (error) { console.error(`No se pudo incorporar la clase: ${error.message}`); process.exitCode = 1; }
}
