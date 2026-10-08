// Renders one question-bank item (true/false, multiple choice, numeric, open with rubric, flashcard).
import { h, rich, renderMath, clear, makeRng } from './util.js';
import { gradeField } from './grade.js';
import { topicById } from './data/topics.js';

const KEEP_ORDER = /\b(above|below|both|all of|none of|neither|either of)\b|\([a-e]\)|\b[A-D]\s+and\s+[A-D]\b/i;
const TYPE_LABEL = { tf: 'True / false', mcq: 'Multiple choice', num: 'Numeric', short: 'Open answer', card: 'Flashcard' };

export function sourceLine(item) {
  const s = item.source || {};
  const wrap = h('div', { class: 'q-source' });
  wrap.appendChild(document.createTextNode('Source: '));
  if (s.url) wrap.appendChild(h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.label || s.url));
  else wrap.appendChild(document.createTextNode(s.label || 'course material'));
  if (s.solution === 'worked') wrap.appendChild(document.createTextNode(' · the source gives no solution; this one was worked and re-checked for this app.'));
  return wrap;
}

/**
 * mountQuestion(container, item, opts)
 * opts: { mode: 'practice' | 'exam', onAnswer(result), seed, number, points, showMeta }
 * returns { result(), lock(), reveal(), el }
 */
export function mountQuestion(container, item, opts = {}) {
  const mode = opts.mode || 'practice';
  const state = { answered: false, score: 0, ok: false, value: null, locked: false, revealed: false };
  const card = h('section', { class: `card q-card${mode === 'exam' ? ' exam-q' : ''}` });
  const topic = topicById(item.topic);

  if (opts.number) card.appendChild(h('h3', null, `Question ${opts.number}`, opts.points ? h('span', { class: 'pts' }, `${opts.points} point${opts.points > 1 ? 's' : ''}`) : null));
  if (opts.showMeta !== false) {
    const meta = h('div', { class: 'q-meta' });
    if (topic) meta.appendChild(h('span', { class: 'chip blue' }, topic.short));
    meta.appendChild(h('span', { class: 'chip' }, TYPE_LABEL[item.type] || item.type));
    meta.appendChild(h('span', { class: 'chip', title: 'difficulty' }, '●'.repeat(item.difficulty || 1) + '○'.repeat(3 - (item.difficulty || 1))));
    if (item.ext) meta.appendChild(h('span', { class: 'chip warn', title: 'From an exam, problem set or book outside the course' }, 'External'));
    if (topic && !topic.released) meta.appendChild(h('span', { class: 'chip', title: 'The instructor’s slides for this topic were not yet released when the app was built' }, 'Ahead of slides'));
    card.appendChild(meta);
  }
  card.appendChild(rich(item.q, 'div', 'q-text'));
  const answerHost = h('div', { class: 'q-answer' });
  card.appendChild(answerHost);
  const feedback = h('div', { class: 'q-explain', hidden: true });
  card.appendChild(feedback);

  let paint = () => {};      // show right/wrong marks
  let readScore = null;      // late-bound scoring (open answers ticked after reveal)

  const showFeedback = () => {
    if (state.revealed) return;
    state.revealed = true;
    paint();
    clear(feedback);
    if (item.type !== 'short' && item.type !== 'card') {
      feedback.appendChild(h('div', { class: `q-verdict ${state.ok ? 'ok' : 'bad'}` }, !state.answered ? 'Not answered' : state.ok ? 'Correct' : 'Not correct'));
      if (!state.ok) {
        let ans = '';
        if (item.type === 'tf') ans = item.answer ? 'True' : 'False';
        else if (item.type === 'mcq') ans = item.options[item.answer];
        else if (item.type === 'num') ans = `${item.answer}${item.unit ? ` ${item.unit}` : ''}`;
        feedback.appendChild(rich(`<b>Answer:</b> ${ans}`, 'div'));
      }
    }
    if (item.explain) feedback.appendChild(rich(item.explain, 'div'));
    feedback.appendChild(sourceLine(item));
    feedback.hidden = false;
    renderMath(feedback);
  };

  const commit = (score, ok, value) => {
    state.answered = true; state.score = score; state.ok = ok; state.value = value;
    if (mode === 'practice') {
      state.locked = true;
      showFeedback();
      if (opts.onAnswer) opts.onAnswer({ ...state });
    }
  };

  if (item.type === 'tf' || item.type === 'mcq') {
    let order = item.type === 'tf' ? [true, false] : item.options.map((_, i) => i);
    if (item.type === 'mcq' && !item.options.some((o) => KEEP_ORDER.test(o)) && !item.fixed) order = makeRng(opts.seed || 1).shuffle(order);
    const correct = item.answer;
    const list = h('div', { class: 'q-options', role: 'group' });
    const buttons = order.map((val, k) => {
      const label = item.type === 'tf' ? (val ? 'True' : 'False') : item.options[val];
      const b = h('button', { type: 'button', class: 'q-option' }, h('span', { class: 'key' }, item.type === 'tf' ? (val ? 'T' : 'F') : String.fromCharCode(65 + k)), rich(label, 'span'));
      b.addEventListener('click', () => {
        if (state.locked) return;
        buttons.forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        if (mode === 'exam') buttons.forEach((x) => { x.style.borderColor = x === b ? 'var(--primary)' : ''; x.style.boxShadow = x === b ? 'inset 0 0 0 1px var(--primary)' : ''; });
        commit(val === correct ? 1 : 0, val === correct, val);
      });
      list.appendChild(b);
      return b;
    });
    answerHost.appendChild(list);
    paint = () => {
      buttons.forEach((b, k) => {
        b.disabled = true; b.style.borderColor = ''; b.style.boxShadow = '';
        if (order[k] === correct) b.classList.add('correct');
        else if (state.answered && order[k] === state.value) b.classList.add('wrong');
      });
    };
  } else if (item.type === 'num') {
    const def = { type: 'num', answer: item.answer, tol: item.tol };
    const input = h('input', { type: 'text', class: 'field-input', autocomplete: 'off', placeholder: 'number or a/b', 'aria-label': 'Your answer' });
    const btn = h('button', { type: 'button', class: 'btn primary' }, 'Check');
    const note = h('span', { class: 'error' });
    const row = h('div', { class: 'row' }, input, item.unit ? h('span', { class: 'muted' }, item.unit) : null, mode === 'practice' ? btn : null, note);
    answerHost.appendChild(row);
    const grade = () => {
      const r = gradeField(def, input.value);
      if (r.blank) { if (mode === 'practice') note.textContent = 'Type an answer first.'; return false; }
      if (r.msg && !r.ok && /not a number/.test(r.msg)) { note.textContent = r.msg; if (mode === 'practice') return false; }
      note.textContent = '';
      commit(r.ok ? 1 : 0, r.ok, input.value);
      return true;
    };
    btn.addEventListener('click', grade);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && mode === 'practice' && !state.locked) { e.preventDefault(); grade(); } });
    if (mode === 'exam') input.addEventListener('input', () => { const r = gradeField(def, input.value); state.answered = !r.blank; state.score = r.ok ? 1 : 0; state.ok = !!r.ok; state.value = input.value; });
    paint = () => { input.disabled = true; btn.hidden = true; input.style.borderColor = state.ok ? 'var(--ok)' : 'var(--bad)'; };
  } else if (item.type === 'short') {
    const notes = h('textarea', { class: 'self-notes', rows: 5, placeholder: 'Write your answer (or work on paper), then compare with the model answer.' });
    const btn = h('button', { type: 'button', class: 'btn primary' }, 'Show model answer');
    const model = h('div', { class: 'self-model', hidden: true });
    const boxes = [];
    answerHost.appendChild(notes);
    if (mode === 'practice') answerHost.appendChild(h('div', { class: 'actions' }, btn));
    answerHost.appendChild(model);
    const done = h('button', { type: 'button', class: 'btn primary' }, 'Record my mark');
    const openModel = () => {
      if (!model.hidden) return;
      model.hidden = false; btn.hidden = true;
      model.appendChild(rich(item.model, 'div', 'self-answer'));
      const rub = h('div', { class: 'rubric' }, h('div', { class: 'rubric-title' }, 'Tick each point your answer covers:'));
      item.rubric.forEach((r) => {
        const cb = h('input', { type: 'checkbox' });
        boxes.push(cb);
        rub.appendChild(h('label', { class: 'choice' }, cb, rich(r, 'span')));
      });
      model.appendChild(rub);
      if (mode === 'practice') model.appendChild(h('div', { class: 'actions' }, done));
      renderMath(model);
    };
    readScore = () => (boxes.length ? boxes.filter((b) => b.checked).length / boxes.length : 0);
    btn.addEventListener('click', openModel);
    done.addEventListener('click', () => {
      if (state.locked) return;
      const sc = readScore();
      boxes.forEach((b) => { b.disabled = true; });
      done.hidden = true;
      commit(sc, sc > 0.999, notes.value);
    });
    if (mode === 'exam') notes.addEventListener('input', () => { state.answered = notes.value.trim() !== ''; state.value = notes.value; });
    paint = () => { notes.disabled = mode === 'practice'; openModel(); };
  } else if (item.type === 'card') {
    const btn = h('button', { type: 'button', class: 'btn primary' }, 'Show answer');
    const back = h('div', { class: 'flash-back', hidden: true });
    answerHost.appendChild(h('div', { class: 'actions' }, btn));
    answerHost.appendChild(back);
    btn.addEventListener('click', () => {
      btn.hidden = true;
      back.hidden = false;
      back.appendChild(rich(item.a, 'div'));
      renderMath(back);
      const grade = (score) => () => { if (state.locked) return; row.hidden = true; commit(score, score >= 0.999, score); };
      const row = h('div', { class: 'rate-row' }, h('span', { class: 'muted small' }, 'Before looking, did you know it?'),
        h('button', { type: 'button', class: 'btn', onclick: grade(0) }, 'No'),
        h('button', { type: 'button', class: 'btn', onclick: grade(0.5) }, 'Partly'),
        h('button', { type: 'button', class: 'btn', onclick: grade(1) }, 'Yes'));
      back.appendChild(row);
    });
  }

  container.appendChild(card);
  renderMath(card);

  return {
    el: card,
    item,
    result: () => {
      if (readScore && state.revealed) { const sc = readScore(); return { ...state, score: sc, ok: sc > 0.999, self: true }; }
      return { ...state, self: item.type === 'short' };
    },
    lock: () => { state.locked = true; },
    reveal: () => { state.locked = true; showFeedback(); },
    focus: () => { const el = card.querySelector('button, input, textarea'); if (el) el.focus({ preventScroll: true }); },
  };
}
