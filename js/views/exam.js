// Timed mock exam: quick questions + computational exercises (auto-graded, no feedback until the end)
// + open questions marked against a rubric after submission.
import { h, clear, makeRng, newSeed, pct, renderMath } from '../util.js';
import { store } from '../store.js';
import { SCOPES, topicById } from '../data/topics.js';
import { DRILLS } from '../drills/index.js';
import { loadBank, bankNow } from '../bank.js';
import { mountQuestion } from '../question-ui.js';
import { mountDrill } from '../drill-ui.js';
import { effectiveMastery } from '../plan.js';
import { setLeaveGuard } from '../nav-guard.js';
import { titleOf } from './bank.js';

const BLUEPRINTS = {
  30: { quick: 5, drills: 1, open: 1 },
  60: { quick: 8, drills: 2, open: 2 },
  90: { quick: 10, drills: 3, open: 3 },
  120: { quick: 12, drills: 4, open: 4 },
};
const PTS = { quick: 2, drill: 10, open: 6 };
const prefs = { scope: 'm12', minutes: 60, source: '' };

// Weighted sampling without replacement, favouring weak and heavily weighted topics.
function sample(rng, pool, n, weightOf) {
  const items = pool.map((x) => ({ x, key: Math.pow(rng.next(), 1 / Math.max(0.05, weightOf(x))) }));
  return items.sort((a, b) => b.key - a.key).slice(0, n).map((i) => i.x);
}

function compose(scopeId, minutes, seed) {
  const rng = makeRng(seed);
  const state = store.get();
  const topics = new Set(SCOPES[scopeId].topics);
  const bp = BLUEPRINTS[minutes];
  const w = (topicId) => { const t = topicById(topicId); return (t ? t.weight : 1) * (1.3 - effectiveMastery(state.topics[topicId])); };
  const pool = bankNow().filter((q) => topics.has(q.topic) && (!prefs.source || (prefs.source === 'ext') === !!q.ext));
  const quickPool = pool.filter((q) => ['tf', 'mcq', 'num'].includes(q.type));
  const openPool = pool.filter((q) => q.type === 'short');
  // spread quick questions over topics: at most 2 per topic
  const quick = [];
  const perTopic = {};
  for (const q of sample(rng, quickPool, quickPool.length, (x) => w(x.topic))) {
    if ((perTopic[q.topic] || 0) >= 2) continue;
    perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
    quick.push(q);
    if (quick.length >= bp.quick) break;
  }
  const drillPool = DRILLS.filter((d) => topics.has(d.topic));
  const drills = [];
  const usedTopics = new Set();
  for (const d of sample(rng, drillPool, drillPool.length, (x) => w(x.topic))) {
    if (usedTopics.has(d.topic)) continue;
    usedTopics.add(d.topic);
    drills.push({ drill: d, seed: rng.int(1, 2 ** 30), level: 2 });
    if (drills.length >= bp.drills) break;
  }
  const open = [];
  const openTopics = new Set();
  for (const q of sample(rng, openPool, openPool.length, (x) => w(x.topic))) {
    if (openTopics.has(q.topic)) continue;
    openTopics.add(q.topic);
    open.push(q);
    if (open.length >= bp.open) break;
  }
  return { quick, drills, open, seed, scopeId, minutes };
}

function setup(root) {
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Mock exam'),
    h('p', null, 'A timed paper built from your weaker topics: quick theory questions, computational exercises generated on the spot, and open questions. Nothing is corrected until you submit, as in the real exam (closed book, no AI). Work on paper and type the results.')));
  const card = h('section', { class: 'card' });
  const scope = h('select', { 'aria-label': 'Scope' }, ...Object.entries(SCOPES).map(([k, v]) => h('option', { value: k }, v.label)));
  scope.value = prefs.scope;
  const minutes = h('select', { 'aria-label': 'Duration' }, ...Object.keys(BLUEPRINTS).map((m) => h('option', { value: m }, `${m} minutes`)));
  minutes.value = String(prefs.minutes);
  const source = h('select', { 'aria-label': 'Question sources' }, h('option', { value: '' }, 'All question sources'), h('option', { value: 'course' }, 'Course-aligned questions only'), h('option', { value: 'ext' }, 'External exam questions only'));
  source.value = prefs.source;
  const info = h('p', { class: 'muted small' });
  const describe = () => {
    prefs.scope = scope.value; prefs.minutes = Number(minutes.value); prefs.source = source.value;
    const bp = BLUEPRINTS[prefs.minutes];
    const total = bp.quick * PTS.quick + bp.drills * PTS.drill + bp.open * PTS.open;
    info.textContent = `Paper: ${bp.quick} quick questions (${PTS.quick} points each), ${bp.drills} computational exercise${bp.drills > 1 ? 's' : ''} (${PTS.drill} points each), ${bp.open} open question${bp.open > 1 ? 's' : ''} (${PTS.open} points each, self-marked against a rubric) — ${total} points.`;
  };
  [scope, minutes, source].forEach((el) => el.addEventListener('change', describe));
  describe();
  const startBtn = h('button', { type: 'button', class: 'btn primary' }, 'Start the exam');
  card.appendChild(h('div', { class: 'filters' }, scope, minutes, source));
  card.appendChild(info);
  card.appendChild(h('div', { class: 'actions' }, startBtn));
  root.appendChild(card);
  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    loadBank().then(() => { if (root.isConnected) stop = run(root, compose(prefs.scope, prefs.minutes, newSeed())); });
  });

  const hist = store.get().exams;
  if (hist.length) {
    root.appendChild(h('h2', { style: 'margin-top:1.4rem' }, 'Previous mock exams'));
    const table = h('table', { class: 'data-table left score-table' });
    table.appendChild(h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', null, 'Scope'), h('th', { class: 'num' }, 'Time'), h('th', { class: 'num' }, 'Score'), h('th', null, 'Weakest topics'))));
    const body = h('tbody');
    hist.slice(0, 12).forEach((e) => {
      const weak = Object.entries(e.byTopic || {}).filter(([, v]) => v.max > 0).sort((a, b) => a[1].got / a[1].max - b[1].got / b[1].max).slice(0, 3).map(([t]) => (topicById(t) || {}).short || t).join(', ');
      body.appendChild(h('tr', null,
        h('td', null, new Date(e.when).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
        h('td', null, (SCOPES[e.scope] || {}).label || e.scope),
        h('td', { class: 'num' }, `${e.usedMinutes} / ${e.minutes} min`),
        h('td', { class: 'num' }, h('span', { class: `chip ${e.pct >= 0.85 ? 'ok' : e.pct >= 0.6 ? 'warn' : 'bad'}` }, `${e.got.toFixed(1)} / ${e.max} · ${pct(e.pct, 0)}`)),
        h('td', null, weak)));
    });
    table.appendChild(body);
    root.appendChild(h('div', { class: 'grid-scroll' }, table));
  }
}

function run(root, paper) {
  clear(root);
  window.scrollTo(0, 0);
  const started = Date.now();
  const deadline = started + paper.minutes * 60000;
  let submitted = false;
  let timerId = null;

  const timer = h('span', { class: 'timer', role: 'timer', 'aria-live': 'off' });
  const progress = h('span', { class: 'muted small' });
  const submitBtn = h('button', { type: 'button', class: 'btn primary' }, 'Submit exam');
  const bar = h('div', { class: 'exam-bar no-print' }, timer, progress, h('span', { class: 'spacer' }), submitBtn);
  root.appendChild(bar);
  const resultsHost = h('div');
  root.appendChild(resultsHost);
  const paperHost = h('div');
  root.appendChild(paperHost);

  const parts = []; // { kind, topic, max, score(), reveal(), answered() }
  let number = 0;
  const section = (title, note) => paperHost.appendChild(h('div', { class: 'module-head' }, h('h2', null, title), h('span', null, note)));

  if (paper.quick.length) section('Part A · Quick questions', `${PTS.quick} points each. Select or type an answer; you can change it until you submit.`);
  paper.quick.forEach((item) => {
    number += 1;
    const q = mountQuestion(paperHost, item, { mode: 'exam', number, points: PTS.quick, seed: paper.seed + number, showMeta: false });
    parts.push({ kind: 'quick', item, topic: item.topic, max: PTS.quick, q, title: `Question ${number}` });
  });
  if (paper.drills.length) section('Part B · Computational exercises', `${PTS.drill} points each. Steps are locked one at a time and cannot be revisited, so check before you lock.`);
  paper.drills.forEach((d) => {
    number += 1;
    const wrap = h('section', { class: 'exam-q' });
    paperHost.appendChild(wrap);
    const built = d.drill.build(d.drill.random(makeRng(d.seed), d.level));
    built.title = `Question ${number} · ${built.title}`;
    const ctl = mountDrill(wrap, built, { mode: 'exam', record: false, deferReveal: true, badge: `${PTS.drill} points` });
    parts.push({ kind: 'drill', d, topic: d.drill.topic, max: PTS.drill, ctl, title: `Question ${number}`, built });
  });
  if (paper.open.length) section('Part C · Open questions', `${PTS.open} points each. Write your answer; after you submit you mark it against the rubric.`);
  paper.open.forEach((item) => {
    number += 1;
    const q = mountQuestion(paperHost, item, { mode: 'exam', number, points: PTS.open, showMeta: false });
    parts.push({ kind: 'open', item, topic: item.topic, max: PTS.open, q, title: `Question ${number}` });
  });
  if (!parts.length) {
    paperHost.appendChild(h('div', { class: 'card empty' }, 'No questions are available for this scope yet.'));
  }
  renderMath(paperHost);

  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    timer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    timer.classList.toggle('low', left < 5 * 60000);
    const done = parts.filter((p) => (p.kind === 'drill' ? !!p.ctl.result() : p.q.result().answered)).length;
    progress.textContent = `${done} of ${parts.length} answered`;
    if (left <= 0 && !submitted) submit(true);
  };

  const finalise = () => {
    const usedMinutes = Math.min(paper.minutes, Math.max(1, Math.round((Date.now() - started) / 60000)));
    const byTopic = {};
    let got = 0, max = 0;
    const rows = [];
    parts.forEach((p) => {
      const score = p.kind === 'drill' ? (p.ctl.result() ? p.ctl.result().score : 0) : p.q.result().score;
      const pts = score * p.max;
      got += pts; max += p.max;
      byTopic[p.topic] = byTopic[p.topic] || { got: 0, max: 0 };
      byTopic[p.topic].got += pts; byTopic[p.topic].max += p.max;
      rows.push({ p, score, pts });
      if (p.kind === 'drill') {
        const r = p.ctl.result();
        store.recordDrill(p.d.drill.id, p.topic, score, r ? r.ms : 0);
        if (score < 0.999) store.addMistake({ kind: 'drill', topic: p.topic, ref: p.d.drill.id, title: `${p.built.title.replace(/^Question \d+ · /, '')} (mock exam)`, detail: (r ? r.wrong : []).slice(0, 6).map((x) => x.step), meta: { drill: p.d.drill.id, seed: p.d.seed, level: p.d.level }, score });
      } else {
        store.recordQuestion(p.item.id, p.topic, score);
        store.rateCard(p.item.id, score >= 0.999 ? 2 : score >= 0.5 ? 1 : 0);
        if (score < 0.999) store.addMistake({ kind: 'question', topic: p.topic, ref: p.item.id, title: titleOf(p.item.q), detail: [], score });
      }
    });
    const ratio = max ? got / max : 0;
    store.recordExam({ scope: paper.scopeId, minutes: paper.minutes, usedMinutes, got, max, pct: ratio, byTopic, seed: paper.seed });

    clear(resultsHost);
    const card = h('section', { class: `card summary ${ratio >= 0.85 ? 'good' : ratio >= 0.6 ? 'mid' : 'low'}` });
    card.appendChild(h('h2', null, 'Result'));
    card.appendChild(h('div', { class: 'summary-score' }, h('span', { class: 'big' }, pct(ratio, 0)), h('span', null, ` · ${got.toFixed(1)} of ${max} points in ${usedMinutes} min`)));
    card.appendChild(h('p', { class: 'muted small' }, ratio >= 0.85 ? 'At or above the 85% target on this paper. Keep the weak rows below in your plan.' : 'Below the 85% target on this paper. The rows below show where the points went; they are now first in your plan and in the mistake notebook.'));
    const table = h('table', { class: 'data-table left score-table', style: 'width:100%' });
    table.appendChild(h('thead', null, h('tr', null, h('th', null, 'Topic'), h('th', { class: 'num' }, 'Points'), h('th', { class: 'num' }, '%'), h('th', null, ''))));
    const body = h('tbody');
    Object.entries(byTopic).sort((a, b) => a[1].got / a[1].max - b[1].got / b[1].max).forEach(([t, v]) => {
      const topic = topicById(t);
      body.appendChild(h('tr', null, h('td', null, topic ? `${topic.code} · ${topic.title}` : t), h('td', { class: 'num' }, `${v.got.toFixed(1)} / ${v.max}`),
        h('td', { class: 'num' }, h('span', { class: `chip ${v.got / v.max >= 0.85 ? 'ok' : v.got / v.max >= 0.6 ? 'warn' : 'bad'}` }, pct(v.got / v.max, 0))),
        h('td', null, h('a', { class: 'btn small', href: `#/learn/${t}` }, 'Lesson'))));
    });
    table.appendChild(body);
    card.appendChild(h('div', { class: 'grid-scroll' }, table));
    const per = h('p', { class: 'small' });
    rows.forEach((r, i) => { per.appendChild(h('span', { class: `chip ${r.score >= 0.999 ? 'ok' : r.score >= 0.5 ? 'warn' : 'bad'}`, style: 'margin:0 .25rem .25rem 0' }, `Q${i + 1}: ${r.pts.toFixed(1)}/${r.p.max}`)); });
    card.appendChild(per);
    card.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/mistakes' }, 'Open the mistake notebook'), h('a', { class: 'btn', href: '#/' }, 'Today')));
    resultsHost.appendChild(card);
    setLeaveGuard(null);
    bar.style.position = 'static';
    progress.textContent = '';
    window.scrollTo(0, 0);
  };

  const submit = (auto) => {
    if (submitted) return;
    if (!auto) {
      const open = parts.filter((p) => (p.kind === 'drill' ? !p.ctl.result() : !p.q.result().answered)).length;
      if (open && !window.confirm(`${open} question${open > 1 ? 's are' : ' is'} not finished. Submit anyway?`)) return;
    }
    submitted = true;
    clearInterval(timerId);
    submitBtn.hidden = true;
    timer.textContent = auto ? 'Time is up' : 'Submitted';
    parts.forEach((p) => { if (p.kind === 'drill') { p.ctl.finishNow(); p.ctl.reveal(); } else p.q.reveal(); });
    const hasOpen = parts.some((p) => p.kind === 'open');
    clear(resultsHost);
    if (hasOpen) {
      const btn = h('button', { type: 'button', class: 'btn primary' }, 'I have marked my open answers — show my result');
      btn.addEventListener('click', finalise);
      resultsHost.appendChild(h('section', { class: 'card info' }, h('h2', null, 'Mark your open answers'), h('p', null, 'Everything else has been corrected below. For each open question in Part C, compare your answer with the model answer and tick the rubric points you really covered. Then press the button.'), h('div', { class: 'actions' }, btn)));
      const firstOpen = parts.find((p) => p.kind === 'open');
      if (firstOpen) firstOpen.q.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else finalise();
  };

  submitBtn.addEventListener('click', () => submit(false));
  setLeaveGuard(() => (submitted ? null : 'Leave the exam? Your answers on this paper will be lost.'));
  tick();
  timerId = setInterval(tick, 1000);
  return () => clearInterval(timerId);
}

let stop = null;
export function render(root) {
  stop = null;
  setup(root);
  return () => { if (stop) stop(); };
}
