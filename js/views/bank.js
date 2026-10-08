// Question bank with spaced repetition.
import { h, clear, makeRng, newSeed, pct, renderMath } from '../util.js';
import { store } from '../store.js';
import { MODULES, topicsOfModule, topicById } from '../data/topics.js';
import { loadBank, bankNow, bankLoaded, dueItems, bankStats } from '../bank.js';
import { mountQuestion } from '../question-ui.js';

const TYPES = [['', 'All types'], ['tf', 'True / false'], ['mcq', 'Multiple choice'], ['num', 'Numeric'], ['short', 'Open answer'], ['card', 'Flashcards']];
const prefs = { topic: '', type: '', source: '', diff: '', n: '10' };

export const plainText = (html) => { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
// Short one-line title of a question for the mistake notebook; never cuts through a $...$ formula.
export function titleOf(html, max = 120) {
  let t = plainText(html);
  if (t.length > max) {
    t = t.slice(0, max);
    if (((t.match(/\$/g) || []).length) % 2) t = t.slice(0, t.lastIndexOf('$'));
    t = `${t.trimEnd()}…`;
  }
  return t.replace(/</g, '&lt;');
}

function filtered() {
  return bankNow().filter((q) => (!prefs.topic || q.topic === prefs.topic || (prefs.topic.startsWith('m') && (topicById(q.topic) || {}).module === prefs.topic))
    && (!prefs.type || q.type === prefs.type)
    && (!prefs.source || (prefs.source === 'ext') === !!q.ext)
    && (!prefs.diff || String(q.difficulty) === prefs.diff));
}

// Order: due reviews first, then unseen, then the items answered worst; random inside each group.
function pick(pool, n, seed) {
  const rng = makeRng(seed);
  const s = store.get();
  const due = new Set(dueItems(pool).map((q) => q.id));
  const rank = (q) => {
    if (due.has(q.id)) return 0;
    if (!s.cards[q.id]) return q.ext ? 1.3 : 1; // unseen: questions built on the instructor's slides first
    const st = s.questions[q.id];
    return 2 + (st && st.n ? st.ok / st.n : 0.5);
  };
  return rng.shuffle(pool).map((q) => ({ q, r: rank(q) })).sort((a, b) => a.r - b.r).slice(0, n).map((x) => x.q);
}

function landing(root) {
  const stats = bankStats();
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Question bank'),
    h('p', null, 'Course-aligned questions written from the instructor’s slides, plus questions from real exams and problem sets of comparable courses (each one cites its source). Every answer schedules the next review.')));
  root.appendChild(h('div', { class: 'row', style: 'margin-bottom:1rem' },
    h('span', { class: 'chip' }, `${stats.total} questions`),
    h('span', { class: 'chip blue' }, `${stats.seen} seen`),
    h('span', { class: `chip ${stats.due ? 'warn' : ''}` }, `${stats.due} due today`),
    h('span', { class: 'chip ok' }, `${stats.mature} well known`),
    bankLoaded() ? null : h('span', { class: 'chip' }, 'loading external questions…')));

  const card = h('section', { class: 'card' });
  const sel = (key, options) => {
    const s = h('select', { 'aria-label': key });
    options.forEach((o) => {
      if (o.group) { const g = h('optgroup', { label: o.group }); o.items.forEach(([v, l]) => g.appendChild(h('option', { value: v }, l))); s.appendChild(g); }
      else s.appendChild(h('option', { value: o[0] }, o[1]));
    });
    s.value = prefs[key];
    s.addEventListener('change', () => { prefs[key] = s.value; update(); });
    return s;
  };
  const topicOptions = [['', 'All topics']].concat(MODULES.map((m) => ({ group: m.title, items: [[m.id, `Everything in ${m.title.split(' · ')[0]}`]].concat(topicsOfModule(m.id).map((t) => [t.id, `${t.code} · ${t.title}`])) })));
  const count = h('span', { class: 'muted small' });
  const startBtn = h('button', { type: 'button', class: 'btn primary' }, 'Start practice');
  const dueBtn = h('button', { type: 'button', class: 'btn' }, 'Review what is due');
  const freshBtn = h('button', { type: 'button', class: 'btn' }, 'Only unseen');
  card.appendChild(h('div', { class: 'filters' },
    sel('topic', topicOptions), sel('type', TYPES),
    sel('source', [['', 'All sources'], ['course', 'Course-aligned'], ['ext', 'External exams & books']]),
    sel('diff', [['', 'Any difficulty'], ['1', 'Easy'], ['2', 'Exam level'], ['3', 'Hard']]),
    sel('n', [['10', '10 questions'], ['20', '20 questions'], ['40', '40 questions'], ['999', 'All matching']])));
  card.appendChild(h('div', { class: 'row' }, startBtn, dueBtn, freshBtn, count));
  root.appendChild(card);

  function update() {
    const pool = filtered();
    const due = dueItems(pool).length;
    const cards = store.get().cards;
    const fresh = pool.filter((q) => !cards[q.id]).length;
    count.textContent = `${pool.length} matching · ${due} due · ${fresh} unseen`;
    startBtn.disabled = !pool.length; dueBtn.disabled = !due; freshBtn.disabled = !fresh;
  }
  startBtn.addEventListener('click', () => session(root, pick(filtered(), Number(prefs.n), newSeed()), 'Practice'));
  dueBtn.addEventListener('click', () => session(root, makeRng(newSeed()).shuffle(dueItems(filtered())).slice(0, Number(prefs.n) === 999 ? 999 : Math.max(Number(prefs.n), 25)), 'Review'));
  freshBtn.addEventListener('click', () => { const cards = store.get().cards; session(root, makeRng(newSeed()).shuffle(filtered().filter((q) => !cards[q.id])).slice(0, Number(prefs.n)), 'New questions'); });
  update();

  // per-topic overview
  const table = h('table', { class: 'data-table left', style: 'width:100%' });
  table.appendChild(h('thead', null, h('tr', null, ...['Topic', 'Questions', 'Seen', 'Due', 'Accuracy', ''].map((x) => h('th', null, x)))));
  const body = h('tbody');
  const s = store.get();
  MODULES.forEach((m) => topicsOfModule(m.id).forEach((t) => {
    const pool = bankNow().filter((q) => q.topic === t.id);
    if (!pool.length) return;
    const st = bankStats(pool);
    let n = 0, ok = 0;
    pool.forEach((q) => { const r = s.questions[q.id]; if (r) { n += r.n; ok += r.ok; } });
    body.appendChild(h('tr', null,
      h('td', null, h('a', { href: `#/learn/${t.id}` }, `${t.code} · ${t.title}`)),
      h('td', null, String(st.total)), h('td', null, String(st.seen)), h('td', null, st.due ? h('span', { class: 'chip warn' }, String(st.due)) : '0'),
      h('td', null, n ? pct(ok / n, 0) : '—'),
      h('td', null, h('a', { class: 'btn small', href: `#/bank?topic=${t.id}&n=10` }, 'Practise'))));
  }));
  table.appendChild(body);
  root.appendChild(h('h2', { style: 'margin-top:1.4rem' }, 'By topic'));
  root.appendChild(h('div', { class: 'grid-scroll' }, table));
}

function session(root, items, label) {
  clear(root);
  window.scrollTo(0, 0);
  if (!items.length) {
    root.appendChild(h('div', { class: 'card empty' }, h('p', null, 'No questions match.'), h('a', { class: 'btn', href: '#/bank' }, 'Back to the question bank')));
    return;
  }
  let i = 0;
  const results = [];
  const bar = h('div', { class: 'session-bar' });
  const host = h('div');
  const after = h('div');
  root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/bank', onclick: (e) => { e.preventDefault(); render(clear(root), { params: {} }); renderMath(root); } }, 'Question bank'), ` / ${label}`));
  root.appendChild(bar); root.appendChild(host); root.appendChild(after);
  let keyHandler = null;

  const show = () => {
    clear(host); clear(after); clear(bar);
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    if (i >= items.length) { summary(); return; }
    const item = items[i];
    bar.appendChild(h('span', null, `${label} · question ${i + 1} of ${items.length}`));
    bar.appendChild(h('div', { class: 'meter' }, h('span', { style: `width:${(i / items.length) * 100}%` })));
    bar.appendChild(h('button', { type: 'button', class: 'btn ghost small', onclick: () => { items.length = i; show(); } }, 'End session'));
    const q = mountQuestion(host, item, {
      mode: 'practice', seed: newSeed(),
      onAnswer: (res) => {
        results.push({ item, score: res.score });
        store.recordQuestion(item.id, item.topic, res.score);
        if (res.score < 0.999) {
          store.addMistake({ kind: 'question', topic: item.topic, ref: item.id, title: titleOf(item.q), detail: [], score: res.score });
        }
        const next = (quality) => () => { store.rateCard(item.id, quality); i += 1; show(); window.scrollTo(0, 0); };
        const row = h('div', { class: 'rate-row' });
        let defaultAction;
        if (res.score < 0.5) {
          defaultAction = next(0);
          row.appendChild(h('button', { type: 'button', class: 'btn primary', onclick: defaultAction }, i === items.length - 1 ? 'Finish' : 'Next question', h('small', null, ' · comes back today')));
        } else if (res.score < 0.999) {
          defaultAction = next(1);
          row.appendChild(h('button', { type: 'button', class: 'btn primary', onclick: defaultAction }, i === items.length - 1 ? 'Finish' : 'Next question', h('small', null, ' · comes back soon')));
        } else {
          defaultAction = next(2);
          row.appendChild(h('span', { class: 'muted small' }, 'How hard was it?'));
          row.appendChild(h('button', { type: 'button', class: 'btn', onclick: next(1) }, 'Hard', h('small', null, ' (1)')));
          row.appendChild(h('button', { type: 'button', class: 'btn primary', onclick: defaultAction }, 'Good', h('small', null, ' (2 / Enter)')));
          row.appendChild(h('button', { type: 'button', class: 'btn', onclick: next(3) }, 'Easy', h('small', null, ' (3)')));
        }
        after.appendChild(row);
        keyHandler = (e) => {
          if (!host.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
          if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
          if (e.key === 'Enter') { e.preventDefault(); defaultAction(); }
          else if (res.score >= 0.999 && ['1', '2', '3'].includes(e.key)) next(Number(e.key))();
        };
        document.addEventListener('keydown', keyHandler);
        const primary = row.querySelector('.btn.primary');
        if (primary) primary.focus({ preventScroll: true });
      },
    });
    if (i > 0) q.focus();
  };

  const summary = () => {
    const total = results.reduce((a, r) => a + r.score, 0);
    const card = h('section', { class: `card summary ${results.length && total / results.length >= 0.85 ? 'good' : results.length && total / results.length >= 0.6 ? 'mid' : 'low'}` });
    card.appendChild(h('h2', null, 'Session complete'));
    card.appendChild(h('div', { class: 'summary-score' }, h('span', { class: 'big' }, results.length ? pct(total / results.length, 0) : '—'), h('span', null, ` · ${results.length} question${results.length === 1 ? '' : 's'}`)));
    const byTopic = {};
    results.forEach((r) => { const t = r.item.topic; byTopic[t] = byTopic[t] || { n: 0, s: 0 }; byTopic[t].n += 1; byTopic[t].s += r.score; });
    const ul = h('ul', { class: 'summary-wrong' });
    Object.entries(byTopic).sort((a, b) => a[1].s / a[1].n - b[1].s / b[1].n).forEach(([t, v]) => {
      const topic = topicById(t);
      ul.appendChild(h('li', null, h('a', { href: `#/learn/${t}` }, topic ? topic.title : t), ` — ${pct(v.s / v.n, 0)} (${v.n})`));
    });
    if (results.length) card.appendChild(ul);
    card.appendChild(h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn primary', onclick: () => { render(clear(root), { params: {} }); renderMath(root); } }, 'Back to the question bank'),
      h('a', { class: 'btn', href: '#/' }, 'Today')));
    host.appendChild(card);
  };
  show();
  return () => { if (keyHandler) document.removeEventListener('keydown', keyHandler); };
}

export function render(root, ctx) {
  const p = (ctx && ctx.params) || {};
  const start = () => {
    if (p.mode === 'due') { session(root, makeRng(newSeed()).shuffle(dueItems()).slice(0, 30), 'Review'); return true; }
    if (p.topic) {
      const pool = bankNow().filter((q) => q.topic === p.topic);
      session(root, pick(pool, Number(p.n) || 10, newSeed()), (topicById(p.topic) || {}).short || 'Practice');
      return true;
    }
    if (p.q) { const item = bankNow().find((q) => q.id === p.q); if (item) { session(root, [item], 'Retry'); return true; } }
    return false;
  };
  if (p.mode || p.topic || p.q) {
    if (bankLoaded()) { start(); return undefined; }
    root.appendChild(h('p', { class: 'muted' }, 'Loading questions…'));
    loadBank().then(() => { if (root.isConnected) { clear(root); if (!start()) landing(root); renderMath(root); } });
    return undefined;
  }
  landing(root);
  if (!bankLoaded()) loadBank().then(() => { if (root.isConnected && location.hash.startsWith('#/bank') && !root.querySelector('.q-card')) { clear(root); landing(root); renderMath(root); } });
  return undefined;
}
