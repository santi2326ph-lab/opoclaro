import {
  DIFFICULTIES,
  HISTORY_KEY,
  addHistoryEntry,
  availableTestLengths,
  calculateResults,
  countAvailable,
  formatElapsed,
  readHistory,
  selectQuestions
} from './test-engine.mjs';

const form = document.querySelector('#test-setup-form');
if (form) initializeTests();

async function initializeTests() {
  const oppositionSelect = document.querySelector('#test-opposition');
  const topicSelect = document.querySelector('#test-topic');
  const countSelect = document.querySelector('#test-count');
  const difficultySelect = document.querySelector('#test-difficulty');
  const modeSelect = document.querySelector('#test-mode');
  const timerToggle = document.querySelector('#test-timer');
  const startButton = document.querySelector('#start-test');
  const status = document.querySelector('#bank-status');
  const setupSection = document.querySelector('.test-setup');
  const runner = document.querySelector('#test-runner');
  const resultsSection = document.querySelector('#test-results');
  const questionTitle = document.querySelector('#question-title');
  const answerOptions = document.querySelector('#answer-options');
  const practiceFeedback = document.querySelector('#practice-feedback');
  const progressText = document.querySelector('#test-progress-text');
  const progress = document.querySelector('#test-progress');
  const answeredCount = document.querySelector('#answered-count');
  const clock = document.querySelector('#test-clock');
  const historyList = document.querySelector('#history-list');
  const historyEmpty = document.querySelector('#history-empty');

  let catalog = [];
  let currentBank = null;
  let banksByFile = new Map();
  let bankLoads = new Map();
  let allQuestions = [];
  let currentTopicQuestions = [];
  let currentTopic = null;
  let activeQuestions = [];
  let answers = [];
  let currentIndex = 0;
  let currentStartedAt = 0;
  let timerHandle = null;
  let lastQuestionIds = [];
  let selectedMode = 'practica';

  const appendText = (parent, tag, text, className = '') => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  };

  function fillSelect(select, options, selectedValue) {
    select.replaceChildren();
    const groups = new Map();
    for (const option of options) {
      let parent = select;
      if (option.group) {
        if (!groups.has(option.group)) {
          const group = document.createElement('optgroup');
          group.label = option.group;
          groups.set(option.group, group);
          select.append(group);
        }
        parent = groups.get(option.group);
      }
      const element = document.createElement('option');
      element.value = String(option.value);
      element.textContent = option.label;
      element.disabled = Boolean(option.disabled);
      parent.append(element);
    }
    if (options.some(option => String(option.value) === String(selectedValue) && !option.disabled)) select.value = String(selectedValue);
  }

  function selectedOpposition() {
    return catalog.find(item => item.id === oppositionSelect.value);
  }

  function questionsForTopic(topic) {
    if (!topic?.archivo) return [];
    const bank = banksByFile.get(topic.archivo);
    if (!bank) return [];
    return bank.preguntas.filter(question => Number(question.temaNumero) === topic.numero);
  }

  function renderTopicOptions() {
    const opposition = selectedOpposition();
    const topics = opposition?.temas || [];
    const amountForTopic = topic => Number(topic.preguntas) || questionsForTopic(topic).length;
    const covered = topics.filter(topic => topic.archivo && amountForTopic(topic) > 0);
    const coveredCount = new Set(covered.map(topic => topic.numero)).size;
    const mixedCount = covered.reduce((sum, topic) => sum + amountForTopic(topic), 0);
    const options = [{
      value: 'mixto',
      group: '',
      label: 'Mezcladas · ' + mixedCount + ' preguntas de ' + coveredCount + ' temas',
      disabled: mixedCount < 10
    }];
    for (const topic of topics) {
      const amount = amountForTopic(topic);
      options.push({
        value: topic.id,
        group: topic.bloque,
        label: 'Tema ' + topic.numero + ' · ' + topic.nombre + ' — ' + (amount ? amount + ' preguntas' : 'Próximamente'),
        disabled: amount === 0
      });
    }
    const selected = topicSelect.value === 'mixto' || topics.some(item => item.id === topicSelect.value) ? topicSelect.value : 'mixto';
    fillSelect(topicSelect, options, selected);
    topicSelect.disabled = false;
  }

  async function loadBankFile(file) {
    if (banksByFile.has(file)) return banksByFile.get(file);
    if (bankLoads.has(file)) return bankLoads.get(file);
    const opposition = selectedOpposition();
    const load = (async () => {
      const response = await fetch(new URL('../data/tests/' + file, window.location.href));
      if (!response.ok) throw new Error('No se pudo cargar el banco ' + file + ' (' + response.status + ').');
      const bank = await response.json();
      if (bank.oposicion !== opposition.id || !Array.isArray(bank.preguntas)) {
        throw new Error('El banco ' + file + ' no coincide con la oposición seleccionada.');
      }
      banksByFile.set(file, bank);
      allQuestions = [...new Map([...banksByFile.values()].flatMap(item => item.preguntas).map(question => [question.id, question])).values()];
      return bank;
    })();
    bankLoads.set(file, load);
    try { return await load; }
    catch (error) { bankLoads.delete(file); throw error; }
    finally { bankLoads.delete(file); }
  }

  async function loadAllBanks() {
    const opposition = selectedOpposition();
    const files = [...new Set((opposition?.temas || []).map(topic => topic.archivo).filter(Boolean))];
    await Promise.all(files.map(loadBankFile));
    renderTopicOptions();
  }

  function refreshFilters() {
    const pool = currentTopicQuestions;
    let difficulty = difficultySelect.value || 'todas';
    let lengths = availableTestLengths(pool, difficulty);
    if (!lengths.length) {
      difficulty = 'todas';
      lengths = availableTestLengths(pool, difficulty);
    }
    const previousCount = Number(countSelect.value);
    const preferredCount = lengths.includes(previousCount) ? previousCount : lengths[0];
    fillSelect(countSelect, lengths.map(length => ({ value: length, label: length + ' preguntas' })), preferredCount);
    countSelect.disabled = lengths.length === 0;

    const minimum = lengths.length ? Number(countSelect.value) : 10;
    const difficultyOptions = DIFFICULTIES.map(item => {
      const available = countAvailable(pool, item.id);
      return {
        value: item.id,
        label: item.label + ' · ' + available + ' disponibles',
        disabled: available < minimum
      };
    });
    if (difficultyOptions.find(item => item.value === difficulty)?.disabled) difficulty = 'todas';
    fillSelect(difficultySelect, difficultyOptions, difficulty);
    difficultySelect.disabled = pool.length === 0;

    const startableLengths = availableTestLengths(pool, difficultySelect.value);
    startButton.disabled = startableLengths.length === 0 || !currentTopicQuestions.length;
    const opposition = selectedOpposition();
    const topic = opposition?.temas.find(item => item.id === topicSelect.value);
    if (!pool.length) {
      status.textContent = 'Este tema todavía no tiene preguntas. No se puede iniciar un test vacío.';
    } else if (!startableLengths.length) {
      status.textContent = pool.length + ' preguntas disponibles, pero la selección actual no alcanza el mínimo de 10 para iniciar un test. Prueba el modo mezclado o cambia los filtros.';
    } else {
      const levels = DIFFICULTIES.slice(1).map(level => countAvailable(pool, level.id) + ' ' + level.label.toLowerCase()).join(', ');
      const note = currentBank?.nota ? ' ' + currentBank.nota : '';
      status.textContent = pool.length + ' preguntas compatibles con este tema' + (topic?.numero ? ' (Tema ' + topic.numero + ')' : '') + ' · ' + levels + '.' + note;
    }
  }

  async function loadTopicBank() {
    const opposition = selectedOpposition();
    const topic = opposition?.temas.find(item => item.id === topicSelect.value);
    currentTopic = topic || null;
    if (topicSelect.value === 'mixto') {
      await loadAllBanks();
      currentBank = null;
      currentTopicQuestions = allQuestions;
    } else if (topic?.archivo) {
      currentBank = await loadBankFile(topic.archivo);
      currentTopicQuestions = questionsForTopic(topic);
    } else {
      currentBank = null;
      currentTopicQuestions = [];
    }
    refreshFilters();
  }

  function renderHistory() {
    let history = [];
    try { history = readHistory(window.localStorage, HISTORY_KEY); } catch { history = []; }
    historyList.replaceChildren();
    historyEmpty.hidden = history.length > 0;
    for (const entry of history) {
      const item = document.createElement('li');
      const date = new Date(entry.fecha);
      const when = Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
      appendText(item, 'strong', `${entry.aciertos}/${entry.total} · ${entry.porcentaje}%`);
      appendText(item, 'span', `${when} · ${entry.nombreTema} · ${entry.total} preguntas · ${entry.errores} errores · ${entry.sinResponder} en blanco`);
      historyList.append(item);
    }
  }

  function clearTimer() {
    if (timerHandle !== null) window.clearInterval(timerHandle);
    timerHandle = null;
  }

  function elapsedSeconds() {
    return currentStartedAt ? Math.floor((Date.now() - currentStartedAt) / 1000) : 0;
  }

  function updateAnsweredCount() {
    const answered = answers.filter(answer => answer !== null && answer !== undefined).length;
    answeredCount.textContent = `Respondidas: ${answered} de ${activeQuestions.length} · Puedes dejar preguntas en blanco.`;
  }

  function showPracticeFeedback(question, selectedAnswer) {
    practiceFeedback.replaceChildren();
    practiceFeedback.hidden = false;
    const isCorrect = selectedAnswer === question.respuestaCorrecta;
    appendText(practiceFeedback, 'strong', isCorrect ? 'Respuesta correcta' : 'No es la respuesta correcta', isCorrect ? 'feedback-correct' : 'feedback-incorrect');
    appendText(practiceFeedback, 'p', question.explicacion);
    const source = document.createElement('a');
    source.href = question.fuente.url;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = `Consultar ${question.fuente.referencia} ↗`;
    practiceFeedback.append(source);
  }

  function renderQuestion() {
    const question = activeQuestions[currentIndex];
    if (!question) return;
    progressText.textContent = `PREGUNTA ${currentIndex + 1} DE ${activeQuestions.length}`;
    progress.max = activeQuestions.length;
    progress.value = currentIndex + 1;
    questionTitle.textContent = question.enunciado;
    answerOptions.replaceChildren();
    question.opciones.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-option';
      button.textContent = option;
      button.setAttribute('aria-pressed', String(answers[currentIndex] === index));
      if (answers[currentIndex] === index) button.classList.add('is-selected');
      if (selectedMode === 'practica' && answers[currentIndex] !== null) {
        if (index === question.respuestaCorrecta) button.classList.add('is-correct');
        else if (answers[currentIndex] === index) button.classList.add('is-incorrect');
      }
      button.addEventListener('click', () => {
        answers[currentIndex] = index;
        if (selectedMode === 'practica') showPracticeFeedback(question, index);
        renderQuestion();
      });
      answerOptions.append(button);
    });
    if (selectedMode !== 'practica' || answers[currentIndex] === null) practiceFeedback.hidden = true;
    else showPracticeFeedback(question, answers[currentIndex]);
    document.querySelector('#previous-question').disabled = currentIndex === 0;
    document.querySelector('#next-question').disabled = currentIndex === activeQuestions.length - 1;
    updateAnsweredCount();
  }

  function startTest(previousIds = []) {
    if (!currentTopicQuestions.length || startButton.disabled) return;
    selectedMode = modeSelect.value;
    activeQuestions = selectQuestions(currentTopicQuestions, {
      count: Number(countSelect.value),
      difficulty: difficultySelect.value,
      previousIds
    });
    answers = Array(activeQuestions.length).fill(null);
    currentIndex = 0;
    currentStartedAt = Date.now();
    setupSection.hidden = true;
    resultsSection.hidden = true;
    runner.hidden = false;
    clock.hidden = !timerToggle.checked;
    clearTimer();
    if (timerToggle.checked) {
      clock.textContent = '00:00';
      timerHandle = window.setInterval(() => { clock.textContent = formatElapsed(elapsedSeconds()); }, 1000);
    }
    renderQuestion();
    questionTitle.focus();
    runner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addSummaryItem(container, label, value) {
    const item = document.createElement('div');
    item.className = 'result-stat';
    appendText(item, 'span', label);
    appendText(item, 'strong', value);
    container.append(item);
  }

  function renderReview() {
    const list = document.querySelector('#answer-review');
    list.replaceChildren();
    activeQuestions.forEach((question, index) => {
      const item = document.createElement('li');
      item.className = answers[index] === null ? 'review-item is-blank' : answers[index] === question.respuestaCorrecta ? 'review-item is-correct' : 'review-item is-incorrect';
      appendText(item, 'h3', question.enunciado);
      const chosenText = answers[index] === null ? 'Sin responder' : question.opciones[answers[index]];
      appendText(item, 'p', `Tu respuesta: ${chosenText}`);
      appendText(item, 'p', `Respuesta correcta: ${question.opciones[question.respuestaCorrecta]}`, 'review-correct-answer');
      appendText(item, 'p', question.explicacion);
      const source = document.createElement('a');
      source.href = question.fuente.url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = `Fuente: ${question.fuente.referencia} · BOE ↗`;
      item.append(source);
      list.append(item);
    });
  }

  function finishTest() {
    clearTimer();
    const result = calculateResults(activeQuestions, answers);
    const opposition = selectedOpposition();
    const topic = opposition.temas.find(item => item.id === topicSelect.value);
    const historyEntry = {
      tema: topicSelect.value === 'mixto' ? 'mixto' : (topic?.id || currentBank?.tema || 'sin-tema'),
      nombreTema: topicSelect.value === 'mixto' ? 'Temas mezclados' : (topic?.nombre || currentBank?.nombreTema || 'Tema'),
      oposicion: selectedOpposition()?.id,
      fecha: new Date().toISOString(),
      total: result.total,
      aciertos: result.correct,
      errores: result.wrong,
      sinResponder: result.unanswered,
      porcentaje: result.percentage,
      dificultad: difficultySelect.value,
      modo: selectedMode,
      duracionSegundos: elapsedSeconds()
    };
    let stored = true;
    try { addHistoryEntry(window.localStorage, historyEntry); } catch { stored = false; }

    const summary = document.querySelector('#result-summary');
    summary.replaceChildren();
    addSummaryItem(summary, 'Aciertos', String(result.correct));
    addSummaryItem(summary, 'Errores', String(result.wrong));
    addSummaryItem(summary, 'En blanco', String(result.unanswered));
    addSummaryItem(summary, 'Resultado', `${result.percentage}%`);
    document.querySelector('#result-message').textContent = stored
      ? `Has terminado en ${formatElapsed(elapsedSeconds())}. El resultado se guardó en el historial local de este navegador.`
      : `Has terminado en ${formatElapsed(elapsedSeconds())}. No se pudo guardar el historial en este navegador.`;
    lastQuestionIds = activeQuestions.map(question => question.id);
    renderReview();
    runner.hidden = true;
    resultsSection.hidden = false;
    document.querySelector('#results-title').focus();
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderHistory();
  }

  function returnToSetup() {
    clearTimer();
    runner.hidden = true;
    resultsSection.hidden = true;
    setupSection.hidden = false;
    setupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    startTest();
  });
  countSelect.addEventListener('change', refreshFilters);
  difficultySelect.addEventListener('change', refreshFilters);
  oppositionSelect.addEventListener('change', async () => {
    banksByFile = new Map();
    bankLoads = new Map();
    allQuestions = [];
    try {
      renderTopicOptions();
      await loadTopicBank();
    } catch (error) {
      status.textContent = 'No se pudo preparar el banco. ' + error.message;
      startButton.disabled = true;
    }
  });
  topicSelect.addEventListener('change', async () => {
    try { await loadTopicBank(); }
    catch (error) { status.textContent = 'No se pudo preparar el banco. ' + error.message; startButton.disabled = true; }
  });
  document.querySelector('#previous-question').addEventListener('click', () => { currentIndex -= 1; renderQuestion(); questionTitle.focus(); });
  document.querySelector('#next-question').addEventListener('click', () => { currentIndex += 1; renderQuestion(); questionTitle.focus(); });
  document.querySelector('#finish-test').addEventListener('click', () => {
    const unanswered = answers.filter(answer => answer === null).length;
    const message = unanswered
      ? `Quedan ${unanswered} preguntas sin responder. ¿Quieres finalizar el test y corregirlo?`
      : '¿Quieres finalizar el test y ver la corrección?';
    if (window.confirm(message)) finishTest();
  });
  document.querySelector('#repeat-test').addEventListener('click', () => startTest(lastQuestionIds));
  document.querySelector('#edit-test-settings').addEventListener('click', returnToSetup);
  document.querySelector('#clear-history').addEventListener('click', () => {
    if (!window.confirm('¿Borrar todo el historial de tests guardado en este navegador?')) return;
    try { window.localStorage.removeItem(HISTORY_KEY); } catch { /* Browser storage may be disabled. */ }
    renderHistory();
  });

  renderHistory();
  try {
    const response = await fetch(new URL('../data/tests/catalog.json', window.location.href));
    if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    const data = await response.json();
    catalog = Array.isArray(data.oposiciones) ? data.oposiciones : [];
    if (!catalog.length) throw new Error('El catálogo todavía no contiene oposiciones.');
    fillSelect(oppositionSelect, catalog.map(item => ({ value: item.id, label: item.nombre })), catalog[0].id);
    oppositionSelect.disabled = catalog.length <= 1;
    renderTopicOptions();
    const firstAvailable = selectedOpposition()?.temas.find(topic => topic.archivo && Number(topic.preguntas) > 0);
    if (firstAvailable) topicSelect.value = firstAvailable.id;
    await loadTopicBank();
  } catch (error) {
    status.textContent = `No se pudo preparar el test. ${error.message}`;
    startButton.disabled = true;
  }
}
