import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { addLesson, parseArgs } from '../scripts/lesson-add.mjs';
import { validateProject, validateRecords } from '../scripts/validate.mjs';

const subject = { id: 'tmm', name: 'Teoría de Máquinas', abbreviation: 'TMM', year: 3, color: '#dfb878', position: { x: 0, y: 0 } };
async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'universo-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'portal'), source = path.join(directory, 'source');
  await mkdir(path.join(root, 'src/data'), { recursive: true });
  await mkdir(path.join(source, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'src/data/subjects.json'), JSON.stringify([subject]));
  await writeFile(path.join(root, 'src/data/lessons.json'), '[]');
  await writeFile(path.join(source, 'index.html'), '<link rel="stylesheet" href="assets/style.css"><script type="module" src="assets/app.js"></script><img src="assets/image.svg">');
  await writeFile(path.join(source, 'assets/style.css'), 'body { background: url("image.svg"); }');
  await writeFile(path.join(source, 'assets/app.js'), 'import "./helper.js"; document.body.dataset.ready = "yes";');
  await writeFile(path.join(source, 'assets/helper.js'), 'export const value = 42;');
  await writeFile(path.join(source, 'assets/image.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  return { root, source };
}
const options = (source, overrides = {}) => ({ subject: 'tmm', title: 'Mecanismo de cuatro barras', source, category: 'notas-clase', ...overrides });

test('imports a complete interactive folder and registers a permanent URL', async t => {
  const { root, source } = await fixture(t);
  const result = await addLesson(root, options(source, { date: '2026-10-20', tags: 'cinemática, mecanismos' }));
  assert.equal(result.lesson.id, 'tmm-mecanismo-de-cuatro-barras');
  assert.equal(result.route, '#/lesson/tmm-mecanismo-de-cuatro-barras');
  assert.equal(await readFile(path.join(root, 'public', result.lesson.path.replace('index.html', 'assets/helper.js')), 'utf8'), 'export const value = 42;');
  assert.deepEqual(await validateProject(root), { subjects: 1, lessons: 1 });
});
test('refuses duplicate identifiers and titles without changing earlier lessons', async t => {
  const { root, source } = await fixture(t);
  await addLesson(root, options(source));
  const before = await readFile(path.join(root, 'src/data/lessons.json'), 'utf8');
  await assert.rejects(addLesson(root, options(source)), /ya existe/);
  await assert.rejects(addLesson(root, options(source, { id: 'different', title: '  MECANISMO DE CUATRO BARRAS  ' })), /ya está registrado/);
  assert.equal(await readFile(path.join(root, 'src/data/lessons.json'), 'utf8'), before);
});
test('rejects missing dependencies and unknown subjects before modifying registry', async t => {
  const { root, source } = await fixture(t);
  await assert.rejects(addLesson(root, options(source, { subject: 'unknown' })), /Asignatura desconocida/);
  await rm(path.join(source, 'assets/helper.js'));
  await assert.rejects(addLesson(root, options(source)), /Dependencia no encontrada/);
  assert.equal(await readFile(path.join(root, 'src/data/lessons.json'), 'utf8'), '[]');
});
test('rejects uncompiled sources, traversal and paths incompatible with repository Pages', async t => {
  const { root, source } = await fixture(t);
  await assert.rejects(addLesson(root, options(source, { id: '../escape' })), /identificador/);
  await writeFile(path.join(source, 'index.html'), '<img src="/assets/image.svg">');
  await assert.rejects(addLesson(root, options(source)), /rutas relativas/);
  await writeFile(path.join(source, 'index.html'), '<img src="../outside.svg">');
  await assert.rejects(addLesson(root, options(source)), /fuera de la carpeta/);
  await rm(path.join(source, 'index.html'));
  await assert.rejects(addLesson(root, options(source)), /ENOENT|index.html/);
});
test('updates require an explicit stable id and retain a recoverable backup', async t => {
  const { root, source } = await fixture(t);
  const first = await addLesson(root, options(source));
  const original = await readFile(path.join(source, 'index.html'), 'utf8');
  await writeFile(path.join(source, 'index.html'), '<h1>Versión nueva</h1>');
  await assert.rejects(addLesson(root, options(source, { update: true })), /requiere --id/);
  const updated = await addLesson(root, options(source, { id: first.lesson.id, update: true }));
  assert.equal(await readFile(path.join(updated.backup, 'previous/index.html'), 'utf8'), original);
  assert.equal(await readFile(path.join(root, 'public', updated.lesson.path), 'utf8'), '<h1>Versión nueva</h1>');
  assert.deepEqual(await validateProject(root), { subjects: 1, lessons: 1 });
});

test('incorporation order ignores academic dates and survives updates of older lessons', async t => {
  const { root, source } = await fixture(t);
  const first = await addLesson(root, options(source, { date: '2026-10-20' }));
  const newest = await addLesson(root, options(source, { id: 'tmm-practica', title: 'Práctica sin fecha' }));
  const registry = () => readFile(path.join(root, 'src/data/lessons.json'), 'utf8').then(JSON.parse);
  assert.equal((await registry()).at(-1).id, newest.lesson.id);
  await addLesson(root, options(source, { id: first.lesson.id, update: true, date: '2027-01-01' }));
  assert.deepEqual((await registry()).map(lesson => lesson.id), [first.lesson.id, newest.lesson.id]);
  assert.equal((await registry()).at(-1).date, undefined);
});
test('validates dates and controlled categories, and catches malformed command arguments', () => {
  const lesson = { id: 'example', subjectId: 'tmm', title: 'Ejemplo', description: '', path: 'lessons/example/index.html' };
  assert.throws(() => validateRecords([subject], [{ ...lesson, date: '2026-02-30' }]), /Fecha inválida/);
  assert.throws(() => validateRecords([subject], [{ ...lesson, category: 'invented' }]), /Categoría inválida/);
  assert.throws(() => parseArgs(['--subject', 'tmm', '--title']), /Argumento inválido/);
  assert.throws(() => parseArgs(['--unknown', 'value']), /Argumento inválido/);
});
test('refuses accidental publication of private environment files', async t => {
  const { root, source } = await fixture(t);
  await writeFile(path.join(source, '.env'), 'PRIVATE_KEY=example');
  await assert.rejects(addLesson(root, options(source)), /archivos privados/);
  assert.equal(await readFile(path.join(root, 'src/data/lessons.json'), 'utf8'), '[]');
});


test('accepts generated blob downloads while still checking real CSS resources', async t => {
  const { root, source } = await fixture(t);
  const html = '<style>body { background: url("assets/image.svg"); }</style><script>const url=URL.createObjectURL(new Blob(["data"])); setTimeout(()=>URL.revokeObjectURL(url),2000);</script>';
  await writeFile(path.join(source, 'index.html'), html);
  const result = await addLesson(root, options(source));
  assert.equal(await readFile(path.join(root, 'public', result.lesson.path), 'utf8'), html);
  await writeFile(path.join(source, 'index.html'), '<style>body { background: url("missing.svg"); }</style>');
  await assert.rejects(addLesson(root, options(source, { id: 'missing-css', title: 'Missing CSS' })), /Dependencia no encontrada/);
});
