export const TEST_LENGTHS = [10, 20, 50, 100];
export const DIFFICULTIES = [
  { id: 'todas', label: 'Todas las dificultades' },
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' }
];
export const HISTORY_KEY = 'opoclaro-tests-history-v1';

export function countAvailable(questions, difficulty = 'todas') {
  return difficulty === 'todas'
    ? questions.length
    : questions.filter(question => question.dificultad === difficulty).length;
}

export function filterByTopic(questions, topicNumber) {
  if (topicNumber === 'mixto' || topicNumber === null || topicNumber === undefined) return [...questions];
  return questions.filter(question => Number(question.temaNumero) === Number(topicNumber));
}

export function combineQuestionBanks(banks) {
  const unique = new Map();
  for (const bank of banks) {
    for (const question of bank?.preguntas || []) {
      if (!unique.has(question.id)) unique.set(question.id, question);
    }
  }
  return [...unique.values()];
}

export function availableTestLengths(questions, difficulty = 'todas') {
  const count = countAvailable(questions, difficulty);
  return TEST_LENGTHS.filter(length => length <= count);
}

export function selectQuestions(questions, { count, difficulty = 'todas', random = Math.random, previousIds = [] } = {}) {
  const pool = questions.filter(question => difficulty === 'todas' || question.dificultad === difficulty);
  if (!Number.isInteger(count) || !availableTestLengths(pool, 'todas').includes(count)) {
    throw new RangeError('No hay ' + count + ' preguntas disponibles para esta selección.');
  }

  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }

  let selected = shuffled.slice(0, count);
  const previousSet = new Set(previousIds);
  if (previousIds.length === count && count < pool.length && selected.every(question => previousSet.has(question.id))) {
    const replacement = shuffled.find(question => !selected.some(item => item.id === question.id));
    if (replacement) selected = [...selected.slice(0, -1), replacement];
  }
  return selected;
}

export function calculateResults(questions, answers) {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  questions.forEach((question, index) => {
    const answer = answers[index];
    if (answer === null || answer === undefined) unanswered += 1;
    else if (answer === question.respuestaCorrecta) correct += 1;
    else wrong += 1;
  });
  return {
    total: questions.length,
    correct,
    wrong,
    unanswered,
    percentage: questions.length ? Math.round((correct / questions.length) * 10000) / 100 : 0
  };
}

export function formatElapsed(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  return hours === '00' ? minutes + ':' + remainder : hours + ':' + minutes + ':' + remainder;
}

export function readHistory(storage, key = HISTORY_KEY) {
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(storage, entry, key = HISTORY_KEY) {
  const history = readHistory(storage, key);
  const savedEntry = { ...entry, fecha: entry.fecha || new Date().toISOString() };
  storage.setItem(key, JSON.stringify([savedEntry, ...history].slice(0, 50)));
  return savedEntry;
}