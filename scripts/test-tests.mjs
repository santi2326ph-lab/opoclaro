import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HISTORY_KEY,
  addHistoryEntry,
  availableTestLengths,
  calculateResults,
  combineQuestionBanks,
  countAvailable,
  filterByTopic,
  formatElapsed,
  readHistory,
  selectQuestions
} from '../assets/test-engine.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(projectRoot, 'data', 'tests', 'catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
assert.equal(catalog.oposiciones[0].temas.length, 45, 'el selector debe cubrir los 45 temas oficiales de la convocatoria vigente');
assert.equal(catalog.convocatoria, 'BOE-A-2026-15055');
const bankPath = path.join(projectRoot, 'data', 'tests', 'policia-nacional', 'constitucion-espanola.json');
const bank = JSON.parse(await readFile(bankPath, 'utf8'));
const tema1Path = path.join(projectRoot, 'data', 'tests', 'policia-nacional', 'derecho-persona.json');
const tema1Bank = JSON.parse(await readFile(tema1Path, 'utf8'));
const tema1Questions = tema1Bank.preguntas;

assert.equal(bank.oposicion, 'policia-nacional');
assert.equal(bank.tema, 'constitucion-espanola');
assert.equal(bank.tipoBanco, 'demostrativo');
assert.equal(bank.preguntas.length, 48, 'el banco constitucional actualizado contiene 48 preguntas');
const questions = bank.preguntas.filter(question => question.temaNumero === 2);
assert.equal(new Set(questions.map(question => question.id)).size, questions.length, 'los identificadores deben ser únicos');
assert.equal(questions.filter(question => question.temaNumero === 2).length, 28, '28 preguntas corresponden al Tema 2');
assert.equal(bank.preguntas.filter(question => question.temaNumero === 3).length, 20, '20 preguntas corresponden al Tema 3');
assert.equal(filterByTopic(questions, 2).length, 28);
assert.equal(filterByTopic(bank.preguntas, 3).length, 20);
assert.equal(combineQuestionBanks([bank, bank]).length, 48, 'el modo mixto no debe duplicar bancos repetidos');
assert.equal(tema1Bank.tema, 'derecho-persona');
assert.equal(tema1Bank.tipoBanco, 'demostrativo');
assert.equal(tema1Questions.length, 20, 'el banco nuevo debe contener exactamente 20 preguntas');
assert.equal(new Set(tema1Questions.map(question => question.id)).size, 20, 'los identificadores del Tema 1 deben ser únicos');
assert.equal(filterByTopic(tema1Questions, 1).length, 20);
assert.deepEqual(['facil', 'media', 'dificil'].map(level => countAvailable(tema1Questions, level)), [7, 7, 6]);
assert.deepEqual(availableTestLengths(tema1Questions), [10, 20]);
for (const level of ['facil', 'media', 'dificil']) assert.deepEqual(availableTestLengths(tema1Questions, level), [], `${level}: no debe habilitar cantidades insuficientes`);
assert.equal(combineQuestionBanks([bank, tema1Bank]).length, 68, 'el modo mixto debe combinar ambos bancos');
assert.equal(combineQuestionBanks([bank, tema1Bank, tema1Bank]).length, 68, 'el modo mixto debe deduplicar archivos repetidos');
const allTopics = catalog.oposiciones[0].temas;
const topicBanks = new Map();
for (const topic of allTopics) {
  if (!topicBanks.has(topic.archivo)) topicBanks.set(topic.archivo, JSON.parse(await readFile(path.join(projectRoot, 'data/tests', topic.archivo), 'utf8')));
  const current = topicBanks.get(topic.archivo);
  const questionsForTopic = current.preguntas.filter(question => question.temaNumero === topic.numero);
  assert.equal(questionsForTopic.length, topic.preguntas);
  assert.ok(questionsForTopic.length >= 1);
  const lengths = availableTestLengths(questionsForTopic);
  assert.deepEqual(lengths, [10, 20, 50, 100].filter(count => count <= questionsForTopic.length));
  for (const difficulty of ['facil', 'media', 'dificil']) {
    const compatible = questionsForTopic.filter(question => question.dificultad === difficulty);
    assert.deepEqual(availableTestLengths(compatible), [10, 20, 50, 100].filter(count => count <= compatible.length));
    if (compatible.length >= 10) assert.ok(selectQuestions(questionsForTopic, { count: 10, difficulty }).every(question => question.dificultad === difficulty));
    else assert.throws(() => selectQuestions(questionsForTopic, { count: 10, difficulty }), RangeError);
  }
}
const completeBanks = [...topicBanks.values()];
const uniqueQuestions = combineQuestionBanks(completeBanks);
assert.equal(uniqueQuestions.length, completeBanks.reduce((sum, item) => sum + item.preguntas.length, 0));
const catalogTema1 = catalog.oposiciones[0].temas.find(topic => topic.numero === 1);
assert.equal(catalogTema1.archivo, 'policia-nacional/derecho-persona.json', 'el Tema 1 debe apuntar a su banco disponible');

for (const question of questions) {
  assert.equal(question.oposicion, bank.oposicion);
  assert.equal(question.tema, bank.tema);
  assert.ok(question.enunciado.length > 0);
  assert.equal(question.opciones.length, 4, `${question.id}: debe haber cuatro opciones`);
  assert.ok(Number.isInteger(question.respuestaCorrecta) && question.respuestaCorrecta >= 0 && question.respuestaCorrecta < 4);
  assert.ok(question.explicacion.length > 0);
  assert.ok(['facil', 'media', 'dificil'].includes(question.dificultad));
  assert.match(question.fuente.url, /^https:\/\/www\.boe\.es\//);
  assert.match(question.fuente.referencia, /^Constitución Española, artículo \d+/);
  assert.match(question.fechaRevision, /^\d{4}-\d{2}-\d{2}$/);
}

for (const level of ['facil', 'media', 'dificil']) assert.ok(countAvailable(questions, level) >= 2);
for (const question of tema1Questions) {
  assert.equal(question.oposicion, 'policia-nacional');
  assert.equal(question.tema, tema1Bank.tema);
  assert.equal(question.temaNumero, 1);
  assert.ok(question.enunciado.length > 0);
  assert.equal(question.opciones.length, 4, `${question.id}: debe haber cuatro opciones`);
  assert.equal(new Set(question.opciones).size, 4, `${question.id}: las opciones deben ser distintas`);
  assert.ok(Number.isInteger(question.respuestaCorrecta) && question.respuestaCorrecta >= 0 && question.respuestaCorrecta < 4);
  assert.ok(question.explicacion.length > 0);
  assert.ok(['facil', 'media', 'dificil'].includes(question.dificultad));
  assert.match(question.fuente.url, /^https:\/\/www\.boe\.es\//);
  assert.match(question.fuente.referencia, /^(Código Civil, artículo|Convención sobre los derechos de las personas con discapacidad, artículo|Constitución Española, artículo)/);
  assert.match(question.fechaRevision, /^\d{4}-\d{2}-\d{2}$/);
}
assert.deepEqual(availableTestLengths(filterByTopic(tema1Questions, 1)), [10, 20]);
assert.ok(selectQuestions(tema1Questions, { count: 10, random: () => 0.29 }).every(question => question.temaNumero === 1));
assert.throws(() => selectQuestions(tema1Questions, { count: 10, difficulty: 'dificil' }), RangeError);
assert.deepEqual(availableTestLengths(filterByTopic(questions, 2)), [10, 20]);
assert.deepEqual(availableTestLengths(filterByTopic(bank.preguntas, 3)), [10, 20]);
const tema2Dificil = filterByTopic(questions, 2).filter(question => question.dificultad === 'dificil');
assert.equal(tema2Dificil.length, 8, 'la dificultad debe combinarse con el tema seleccionado');
assert.deepEqual(availableTestLengths(tema2Dificil), [], 'no debe ofrecer cantidad inferior a 10 ni iniciar una selección insuficiente');
const tema2MediaSet = selectQuestions(filterByTopic(questions, 2), { count: 10, difficulty: 'media', random: () => 0.31 });
assert.ok(tema2MediaSet.every(question => question.temaNumero === 2 && question.dificultad === 'media'));
const allQuestions = combineQuestionBanks([bank, tema1Bank]);
const mixedSet = selectQuestions(allQuestions, { count: 20, random: () => 0.31 });
assert.ok(mixedSet.every(question => [1, 2, 3].includes(question.temaNumero)));
assert.ok(new Set(mixedSet.map(question => question.temaNumero)).size > 1, 'el test mixto debe incluir preguntas de más de un tema cuando existen');
assert.deepEqual(availableTestLengths(allQuestions), [10, 20, 50]);
assert.deepEqual(availableTestLengths(filterByTopic(questions, 2).filter(question => question.dificultad === 'dificil')), []);
assert.deepEqual(availableTestLengths(questions, 'todas'), [10, 20]);
assert.deepEqual(availableTestLengths(questions, 'facil'), [10]);
assert.deepEqual(availableTestLengths(questions, 'media'), [10]);
assert.deepEqual(availableTestLengths(questions, 'dificil'), []);
assert.throws(() => selectQuestions(questions, { count: 50 }), RangeError, 'no debe permitir pedir más preguntas de las disponibles');
assert.throws(() => selectQuestions(questions, { count: 20, difficulty: 'facil' }), RangeError);

const originalIds = questions.map(question => question.id);
const firstSet = selectQuestions(questions, { count: 10, random: () => 0.31 });
const secondSet = selectQuestions(questions, { count: 10, random: () => 0.83, previousIds: firstSet.map(question => question.id) });
assert.equal(firstSet.length, 10);
assert.equal(new Set(firstSet.map(question => question.id)).size, 10);
assert.equal(new Set(secondSet.map(question => question.id)).size, 10);
assert.ok(firstSet.some(question => !secondSet.some(next => next.id === question.id)), 'la nueva partida debe cambiar al menos una pregunta cuando hay alternativas');
assert.deepEqual(questions.map(question => question.id), originalIds, 'la selección no debe mutar el banco');
assert.ok(selectQuestions(questions, { count: 10, difficulty: 'media' }).every(question => question.dificultad === 'media'));

const score = calculateResults(questions.slice(0, 3), [questions[0].respuestaCorrecta, (questions[1].respuestaCorrecta + 1) % 4, null]);
assert.deepEqual(score, { total: 3, correct: 1, wrong: 1, unanswered: 1, percentage: 33.33 });
assert.equal(formatElapsed(0), '00:00');
assert.equal(formatElapsed(125), '02:05');
assert.equal(formatElapsed(3661), '01:01:01');

const memory = new Map();
const storage = {
  getItem(key) { return memory.get(key) ?? null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};
const saved = addHistoryEntry(storage, { tema: bank.tema, total: 10, aciertos: 7, errores: 2, sinResponder: 1, porcentaje: 70, fecha: '2026-10-19T10:00:00.000Z' });
assert.equal(saved.tema, bank.tema);
assert.equal(readHistory(storage, HISTORY_KEY).length, 1, 'el historial debe persistir localmente');
assert.equal(JSON.parse(memory.get(HISTORY_KEY))[0].porcentaje, 70);
storage.removeItem(HISTORY_KEY);
assert.equal(readHistory(storage).length, 0, 'el historial debe poder borrarse');

const sourcePage = await readFile(path.join(projectRoot, 'tests', 'policia-nacional.html'), 'utf8');
const selectorPage = await readFile(path.join(projectRoot, 'tests', 'index.html'), 'utf8');
const runner = await readFile(path.join(projectRoot, 'assets', 'tests.js'), 'utf8');
const sitemap = await readFile(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const robots = await readFile(path.join(projectRoot, 'robots.txt'), 'utf8');
assert.match(sourcePage, /name="description"/);
assert.match(sourcePage, /rel="canonical" href="https:\/\/opoclaro\.santi2326ph\.workers\.dev\/tests\/policia-nacional\.html"/);
assert.match(sourcePage, /value="practica"/);
assert.match(sourcePage, /value="examen"/);
assert.match(sourcePage, /BOE-A-2026-15055/);
assert.match(sourcePage, /id="test-timer"/);
assert.match(selectorPage, /rel="canonical" href="https:\/\/opoclaro\.santi2326ph\.workers\.dev\/tests\/"/);
assert.match(runner, /window\.localStorage/);
assert.match(runner, /window\.confirm/);
assert.match(runner, /showPracticeFeedback/);
assert.match(runner, /finishTest/);
assert.match(runner, /async function loadBankFile/);
assert.match(runner, /await loadBankFile\(topic\.archivo\)/);
assert.match(runner, /await loadAllBanks\(\)/);
assert.match(runner, /firstAvailable/);
assert.equal(catalogTema1.preguntas, 20);
assert.equal(catalog.oposiciones[0].temas.find(topic => topic.numero === 2).preguntas, 28);
assert.equal(catalog.oposiciones[0].temas.find(topic => topic.numero === 3).preguntas, 20);

assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset[^>]+>/);
assert.match(sitemap, /<\/urlset>\s*$/);
assert.equal([...sitemap.matchAll(/<url>/g)].length, [...sitemap.matchAll(/<\/url>/g)].length, 'el sitemap debe cerrar cada elemento URL');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(sitemapUrls.length, 9, 'deben indexarse las 7 páginas actuales y las 2 páginas útiles de tests');
assert.ok(!sitemapUrls.some(url => /despliegue\.html|404\.html/.test(url)), 'el sitemap debe excluir páginas técnicas y de error');
for (const value of sitemapUrls) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'opoclaro.santi2326ph.workers.dev');
  const route = url.pathname === '/' ? 'index.html' : url.pathname === '/tests/' ? 'tests/index.html' : url.pathname.slice(1);
  const html = await readFile(path.join(projectRoot, route), 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal(canonical?.[1], value, `canonical de ${route} debe coincidir con sitemap`);
}
assert.match(robots, /^User-agent:\s*\*\s*\r?\nAllow:\s*\//m);
assert.match(robots, /Sitemap:\s*https:\/\/opoclaro\.santi2326ph\.workers\.dev\/sitemap\.xml/);
const builtBank = JSON.parse(await readFile(path.join(projectRoot, 'dist', 'data', 'tests', 'policia-nacional', 'constitucion-espanola.json'), 'utf8'));
assert.equal(builtBank.preguntas.length, 48, 'el banco constitucional debe incluirse en dist al compilar');
const builtTema1Bank = JSON.parse(await readFile(path.join(projectRoot, 'dist', 'data', 'tests', 'policia-nacional', 'derecho-persona.json'), 'utf8'));
assert.equal(builtTema1Bank.preguntas.length, 20, 'el banco del Tema 1 debe incluirse en dist al compilar');
const builtCatalog = JSON.parse(await readFile(path.join(projectRoot, 'dist', 'data', 'tests', 'catalog.json'), 'utf8'));
for (const number of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]) {
  const topic = builtCatalog.oposiciones[0].temas.find(item => item.numero === number);
  assert.ok(topic.preguntas >= 1);
  const built = JSON.parse(await readFile(path.join(projectRoot, 'dist', 'data', 'tests', topic.archivo), 'utf8'));
  assert.equal(built.preguntas.length, topic.preguntas);
}
assert.equal(builtCatalog.oposiciones[0].temas.find(topic => topic.numero === 1).archivo, 'policia-nacional/derecho-persona.json');

console.log('OK: bancos (' + uniqueQuestions.length + ' preguntas únicas), 45 temas, cantidades 10/20/50/100 según disponibilidad, filtros, selección y funciones de tests.');
