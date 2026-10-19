import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fakeElement(value = '') {
  return {
    value,
    textContent: '',
    innerHTML: '',
    hidden: false,
    attributes: {},
    listeners: {},
    classes: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute(name, next) { this.attributes[name] = next; },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() {},
    reset() {},
    classList: { toggle(name, enabled) { this.owner.classes[name] = enabled; } }
  };
}

function loadScript(source, document, extra = {}) {
  const context = { document, ...extra };
  vm.runInNewContext(source, context, { timeout: 1000 });
  return context;
}

// Calculator behavior: scoring, cutoff status, invalid answers and option penalty.
const calculatorSource = await readFile(path.join(projectRoot, 'assets/calculadora.js'), 'utf8');
const calculatorForm = fakeElement();
const calculatorFields = new Map([
  ['correct', fakeElement('8')], ['wrong', fakeElement('2')], ['blank', fakeElement('0')],
  ['questions', fakeElement('10')], ['options', fakeElement('4')], ['max-score', fakeElement('10')],
  ['penalty', fakeElement('0.25')], ['cutoff', fakeElement('7')], ['result', fakeElement()],
  ['score-detail', fakeElement()], ['score', fakeElement()], ['result-max', fakeElement()], ['cutoff-state', fakeElement()]
]);
calculatorFields.get('result').classList.owner = calculatorFields.get('result');
calculatorFields.get('cutoff-state').classList.owner = calculatorFields.get('cutoff-state');
const calculatorDocument = {
  addEventListener(name, callback) { if (name === 'DOMContentLoaded') this.ready = callback; },
  querySelector(selector) { return selector === '#score-form' ? calculatorForm : null; },
  getElementById(id) { return calculatorFields.get(id); }
};
loadScript(calculatorSource, calculatorDocument, { Intl });
calculatorDocument.ready();
assert.equal(calculatorFields.get('score').textContent, '7,50', 'la penalización debe producir 7,50/10');
assert.equal(calculatorFields.get('cutoff-state').textContent, 'Sobre el corte');
calculatorFields.get('correct').value = '11';
calculatorForm.listeners.submit({ preventDefault() {} });
assert.equal(calculatorFields.get('result').attributes['aria-invalid'], 'true', 'la suma superior al total debe marcar error');
calculatorFields.get('correct').value = '8';
calculatorFields.get('options').value = '4';
calculatorFields.get('options').listeners.change();
assert.equal(calculatorFields.get('penalty').value, '0.333333', 'la penalización debe actualizarse según las opciones');

// Planner behavior: create, persist and remove a study session.
const plannerSource = await readFile(path.join(projectRoot, 'assets/planificador.js'), 'utf8');
const selectors = new Map([
  ['#week-grid', fakeElement()], ['#week-title', fakeElement()], ['#session-day', fakeElement()],
  ['#week-status', fakeElement()], ['#session-form', fakeElement()], ['#session-title', fakeElement('Bloque de repaso')],
  ['#session-time', fakeElement('09:30')], ['#previous-week', fakeElement()], ['#next-week', fakeElement()],
  ['#current-week', fakeElement()], ['.storage-note', fakeElement()]
]);
const sessionMemory = new Map();
const plannerDocument = {
  addEventListener(name, callback) { if (name === 'DOMContentLoaded') this.ready = callback; },
  querySelector(selector) { return selectors.get(selector); }
};
const localStorage = {
  getItem(key) { return sessionMemory.get(key) ?? null; },
  setItem(key, value) { sessionMemory.set(key, value); }
};
loadScript(plannerSource, plannerDocument, { localStorage, Date, Intl, Math, JSON, String, Array });
plannerDocument.ready();
const today = new Date();
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
selectors.get('#session-day').value = date;
selectors.get('#session-form').listeners.submit({ preventDefault() {}, currentTarget: { reset() {} } });
const saved = JSON.parse(localStorage.getItem('opoclaro-plan-v1'));
assert.equal(saved.length, 1, 'el planificador debe guardar la sesión');
assert.equal(saved[0].title, 'Bloque de repaso');
assert.match(selectors.get('#week-grid').innerHTML, /Bloque de repaso/);
selectors.get('#week-grid').listeners.click({ target: { closest: () => ({ dataset: { remove: saved[0].id } }) } });
assert.equal(JSON.parse(localStorage.getItem('opoclaro-plan-v1')).length, 0, 'el planificador debe permitir eliminarla');

console.log('OK: calculadora (nota, corte, validación y penalización) y planificador (crear, guardar y borrar) funcionan.');
