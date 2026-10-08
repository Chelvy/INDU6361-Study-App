// Runs one built drill: shows the statement, then the steps one at a time, grades each field,
// gives targeted feedback, and reports a first-try score.
import { h, rich, renderMath, clear, formatDuration, pct } from './util.js';
import { createField } from './fields.js';
import { expectedHtml } from './grade.js';
import { store } from './store.js';

function node(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === 'function') return node(x());
  if (x instanceof Node) return x;
  return rich(String(x));
}

/**
 * mountDrill(container, built, opts)
 * built: { id, topic, title, statement, figure, rules, steps:[{title,text,figure,fields,explain,after}], wrapup }
 * opts: { mode:'practice'|'exam', record:true, onFinish(result), actions:[{label,onClick}], meta:{preset,seed} }
 */
export function mountDrill(container, built, opts = {}) {
  const mode = opts.mode || 'practice';
  const maxAttempts = mode === 'exam' ? 1 : 2;
  const started = Date.now();
  clear(container);

  const head = h('div', { class: 'drill-head' });
  head.appendChild(h('h2', { class: 'drill-title' }, built.title));
  if (opts.badge) head.appendChild(h('span', { class: 'badge' }, opts.badge));
  container.appendChild(head);

  const statement = h('section', { class: 'card statement' });
  const stBody = node(built.statement);
  if (stBody) statement.appendChild(stBody);
  const fig = node(built.figure);
  if (fig) statement.appendChild(fig);
  if (built.rules) statement.appendChild(rich(`<b>Rules for this exercise.</b> ${built.rules}`, 'div', 'rules'));
  container.appendChild(statement);
  renderMath(statement);

  const progress = h('div', { class: 'step-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': built.steps.length });
  const bar = h('div', { class: 'step-progress-bar' });
  progress.appendChild(bar);
  container.appendChild(progress);

  const stepsHost = h('div', { class: 'steps' });
  container.appendChild(stepsHost);
  const footer = h('div', { class: 'drill-footer' });
  container.appendChild(footer);

  const records = [];
  let current = 0;
  let finished = null;
  let revealed = false;

  const updateBar = () => {
    bar.style.width = `${(current / built.steps.length) * 100}%`;
    progress.setAttribute('aria-valuenow', current);
  };

  const revealAll = () => {
    if (revealed) return;
    revealed = true;
    records.forEach((r) => { if (!r) return; r.fields.forEach((f, k) => { if (r.results[k]) f.showResult(r.results[k], true); }); r.revealExplain(); });
  };

  const finish = () => {
    if (finished) return;
    // Steps that were never reached count as zero.
    const stepScores = built.steps.map((_, i) => {
      const r = records[i];
      if (!r || !r.done) return 0;
      return r.first.length ? r.first.reduce((a, b) => a + b, 0) / r.first.length : 1;
    });
    const score = stepScores.length ? stepScores.reduce((a, b) => a + b, 0) / stepScores.length : 1;
    const ms = Date.now() - started;
    const wrong = [];
    built.steps.forEach((st, i) => {
      const r = records[i];
      if (!r || !r.done) { wrong.push({ step: st.title, count: 1, expected: 'not reached' }); return; }
      const missed = [];
      r.fields.forEach((f, k) => { if (r.first[k] < 0.999) missed.push(expectedHtml(f.def)); });
      if (missed.length) wrong.push({ step: st.title, count: missed.length, expected: missed.filter(Boolean).slice(0, 2).join('; ') });
    });
    const result = { id: built.id, topic: built.topic, score, ms, stepScores, wrong, steps: built.steps.length };
    finished = result;
    if (opts.deferReveal) {
      clear(footer);
      footer.appendChild(h('div', { class: 'step-status' }, 'All steps locked. Feedback appears when you submit the exam.'));
      bar.style.width = '100%';
      if (opts.onFinish) opts.onFinish(result);
      return;
    }
    if (opts.record !== false) {
      store.recordDrill(built.id, built.topic, score, ms);
      if (wrong.length) {
        store.addMistake({
          kind: 'drill', topic: built.topic, ref: built.id, title: built.title,
          detail: wrong.slice(0, 6).map((w) => `${w.step}${w.expected ? ` — answer: ${w.expected}` : ''}`),
          meta: opts.meta || null, score,
        });
      }
    }
    if (mode === 'exam') revealAll(); // deferred feedback: now reveal everything
    clear(footer);
    const cls = score >= 0.85 ? 'good' : score >= 0.6 ? 'mid' : 'low';
    const card = h('section', { class: `card summary ${cls}` },
      h('h3', null, mode === 'exam' ? 'Submitted' : 'Exercise complete'),
      h('div', { class: 'summary-score' }, h('span', { class: 'big' }, pct(score, 0)), h('span', null, ' first-try accuracy'), h('span', { class: 'muted' }, ` · ${formatDuration(ms)}`)),
    );
    if (wrong.length) {
      const ul = h('ul', { class: 'summary-wrong' });
      wrong.slice(0, 10).forEach((w) => ul.appendChild(rich(`<b>${w.step}</b>${w.count > 1 ? ` (${w.count} answers)` : ''}${w.expected ? ` — ${w.expected}` : ''}`, 'li')));
      card.appendChild(h('p', null, 'Review these steps (also saved in your mistake notebook):'));
      card.appendChild(ul);
    } else card.appendChild(h('p', null, 'Every step was right on the first attempt.'));
    if (built.wrapup) card.appendChild(rich(`<b>Take-away.</b> ${built.wrapup}`, 'div', 'wrapup'));
    const actions = h('div', { class: 'actions' });
    (opts.actions || []).forEach((a) => actions.appendChild(h('button', { type: 'button', class: `btn ${a.primary ? 'primary' : ''}`, onclick: a.onClick }, a.label)));
    card.appendChild(actions);
    footer.appendChild(card);
    renderMath(card);
    bar.style.width = '100%';
    if (opts.onFinish) opts.onFinish(result);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const showStep = (i) => {
    current = i;
    updateBar();
    if (i >= built.steps.length) { finish(); return; }
    const st = built.steps[i];
    const sec = h('section', { class: 'card step active' });
    sec.appendChild(h('div', { class: 'step-head' }, h('span', { class: 'step-num' }, `Step ${i + 1} of ${built.steps.length}`), h('h3', null, st.title)));
    const text = node(st.text);
    if (text) { text.classList.add('step-text'); sec.appendChild(text); }
    const sfig = node(st.figure);
    if (sfig) sec.appendChild(sfig);
    const fieldsHost = h('div', { class: 'fields' });
    const fields = (st.fields || []).map((def) => createField(def));
    fields.forEach((f) => fieldsHost.appendChild(f.el));
    sec.appendChild(fieldsHost);
    const status = h('div', { class: 'step-status', 'aria-live': 'polite' });
    const explainHost = h('div', { class: 'explain', hidden: true });
    const btnCheck = h('button', { type: 'button', class: 'btn primary' }, mode === 'exam' ? 'Lock in answer' : 'Check');
    const btnShow = h('button', { type: 'button', class: 'btn ghost' }, 'Show solution');
    const btnNext = h('button', { type: 'button', class: 'btn primary', hidden: true }, i === built.steps.length - 1 ? 'Finish' : 'Next step');
    const controls = h('div', { class: 'actions' }, btnCheck, mode === 'exam' ? null : btnShow, btnNext);
    sec.appendChild(status);
    sec.appendChild(controls);
    sec.appendChild(explainHost);
    stepsHost.appendChild(sec);
    renderMath(sec);

    const rec = { fields, first: [], results: [], attempts: 0, done: false, revealExplain: () => {}, lock: () => {} };
    records[i] = rec;

    const revealExplain = () => {
      if (!explainHost.hidden) return;
      const ex = node(st.explain);
      if (ex) { explainHost.appendChild(h('div', { class: 'explain-title' }, 'Worked solution')); explainHost.appendChild(ex); }
      const after = node(st.after);
      if (after) explainHost.appendChild(after);
      explainHost.hidden = !explainHost.firstChild;
      renderMath(explainHost);
    };
    rec.revealExplain = revealExplain;

    const complete = () => {
      rec.done = true;
      fields.forEach((f) => f.setDisabled(true));
      btnCheck.hidden = true; btnShow.hidden = true; btnNext.hidden = false;
      sec.classList.remove('active');
      sec.classList.add('done');
      btnNext.focus({ preventScroll: true });
    };

    const check = () => {
      if (rec.done) return;
      if (fields.some((f) => f.needsReveal())) {
        fields.forEach((f) => f.forceReveal());
        status.textContent = 'Compare with the model answer, tick the rubric points you covered, then press Check again.';
        return;
      }
      const results = fields.map((f) => f.grade());
      rec.attempts += 1;
      if (rec.attempts === 1) rec.first = results.map((r) => r.score);
      rec.results = results;
      const allOk = results.every((r) => r.ok || (r.self));
      if (mode === 'exam') {
        status.textContent = 'Answer locked. Feedback comes at the end.';
        complete();
        return;
      }
      if (allOk) {
        fields.forEach((f, k) => f.showResult(results[k], true));
        status.textContent = rec.attempts === 1 ? 'Correct.' : 'Correct on the second attempt.';
        status.className = 'step-status ok';
        revealExplain();
        complete();
      } else if (rec.attempts >= maxAttempts) {
        fields.forEach((f, k) => f.showResult(results[k], true));
        status.textContent = 'Not quite — the answers are shown below. Read the worked solution before moving on.';
        status.className = 'step-status bad';
        revealExplain();
        complete();
      } else {
        fields.forEach((f, k) => f.showResult(results[k], false));
        const bad = results.filter((r) => !r.ok).length;
        status.textContent = `${bad} answer${bad > 1 ? 's' : ''} to fix. One more attempt before the solution is shown.`;
        status.className = 'step-status bad';
      }
    };

    // Used when an exam is submitted while this step is still open: grade whatever has been entered.
    rec.lock = () => {
      if (rec.done) return;
      fields.forEach((f) => f.forceReveal());
      const results = fields.map((f) => f.grade());
      if (rec.attempts === 0) rec.first = results.map((r) => (r.self ? 0 : r.score));
      rec.attempts += 1;
      rec.results = results;
      complete();
      btnNext.hidden = true;
    };

    btnCheck.addEventListener('click', check);
    btnShow.addEventListener('click', () => {
      if (rec.done) return;
      fields.forEach((f) => f.forceReveal());
      const results = fields.map((f) => f.grade());
      if (rec.attempts === 0) rec.first = results.map((r) => (r.self ? 0 : r.score));
      rec.results = results;
      fields.forEach((f, k) => f.showResult(results[k], true));
      status.textContent = 'Solution shown.';
      status.className = 'step-status';
      revealExplain();
      complete();
    });
    btnNext.addEventListener('click', () => { btnNext.hidden = true; showStep(i + 1); });
    sec.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
      if (e.target.classList && e.target.classList.contains('cell-input')) return;
      e.preventDefault();
      if (!rec.done) check(); else if (!btnNext.hidden) btnNext.click();
    });

    if (!fields.length) { // information-only step
      btnCheck.hidden = true; btnShow.hidden = true; btnNext.hidden = false; rec.done = true; revealExplain();
    }
    if (i > 0) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstInput = sec.querySelector('input, textarea, select');
    if (firstInput && i > 0) firstInput.focus({ preventScroll: true });
  };

  showStep(0);
  return {
    getRecords: () => records,
    result: () => finished,
    // Close the exercise now (exam time is up or the paper is submitted) and return its result.
    finishNow() {
      if (!finished) {
        const r = records[current];
        if (r && !r.done) r.lock();
        stepsHost.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        finish();
      }
      return finished;
    },
    reveal: revealAll,
  };
}
