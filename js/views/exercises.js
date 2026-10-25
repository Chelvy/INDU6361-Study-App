// The instructor's exercise sheets (10E, 20E): guided hints, step-by-step solutions, self-marking.
import { h, rich, renderMath, todayKey } from '../util.js';
import { store } from '../store.js';
import { topicById } from '../data/topics.js';
import { SHEETS, exerciseById } from '../data/exercises/index.js';
import { createField } from '../fields.js';
import { drillById } from '../drills/index.js';

const MARKS = [
  { label: 'Solved it on my own', score: 1, quality: 2, cls: 'primary' },
  { label: 'Solved it with hints', score: 0.6, quality: 1, cls: '' },
  { label: 'Not yet', score: 0, quality: 0, cls: 'ghost' },
];

export const partKey = (ex, k) => `ex-${ex.id}-${k + 1}`;

function partStats(ex) {
  const q = store.get().questions;
  const done = ex.parts.filter((p, k) => q[partKey(ex, k)]).length;
  const best = ex.parts.reduce((acc, p, k) => { const r = q[partKey(ex, k)]; return acc + (r ? r.ok / r.n : 0); }, 0);
  return { done, total: ex.parts.length, avg: ex.parts.length ? best / ex.parts.length : 0 };
}

export function exercisesDue() {
  const cards = store.get().cards;
  const today = todayKey();
  let n = 0;
  SHEETS.forEach((sh) => sh.exercises.forEach((ex) => ex.parts.forEach((p, k) => { const c = cards[partKey(ex, k)]; if (c && c.due <= today) n += 1; })));
  return n;
}

function statusChip(ex) {
  const st = partStats(ex);
  if (!st.done) return h('span', { class: 'chip' }, 'Not started');
  if (st.done < st.total) return h('span', { class: 'chip warn' }, `${st.done}/${st.total} parts`);
  return h('span', { class: `chip ${st.avg > 0.85 ? 'ok' : 'warn'}` }, st.avg > 0.85 ? 'Done' : 'Review');
}

function index(root) {
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Instructor’s exercises'),
    h('p', null, 'The exercise sheets of the course, with the instructor’s own solutions. Work on paper first. Each part has hints that get stronger, a solution you can reveal one step at a time, and a self-mark that schedules the part for review.')));
  root.appendChild(rich('<div class="callout-title">How to use this page</div><ol><li>Read the statement and try the part on paper, as in the exam.</li><li>Stuck? Open <b>one hint at a time</b>. Each hint tells you a little more.</li><li>Compare with the solution <b>step by step</b>: reveal the next step only after you have written yours.</li><li>Mark yourself honestly. Parts you miss come back for review and go to the Mistakes page.</li></ol>', 'div', 'callout'));
  SHEETS.forEach((sh) => {
    root.appendChild(h('div', { class: 'module-head' }, h('h2', null, sh.title), h('span', null, sh.note)));
    const grid = h('div', { class: 'grid two' });
    sh.exercises.forEach((ex) => {
      const topic = topicById(ex.topic);
      grid.appendChild(h('a', { class: 'card', href: `#/exercises/${sh.id}/${ex.n}`, style: 'text-decoration:none;color:inherit;display:block' },
        h('div', { class: 'row', style: 'margin-bottom:.35rem' }, h('span', { class: 'chip blue' }, `Exercise ${ex.label || ex.n}`), topic ? h('span', { class: 'chip' }, topic.short) : null, statusChip(ex)),
        h('h3', { style: 'margin:0 0 .25rem' }, ex.title),
        rich(ex.blurb || '', 'p', 'muted small')));
    });
    root.appendChild(grid);
  });
}

function hintBlock(part) {
  const box = h('div', { class: 'ex-hints' });
  if (!part.hints || !part.hints.length) return box;
  let shown = 0;
  const btn = h('button', { type: 'button', class: 'btn small' }, `Hint 1 of ${part.hints.length}`);
  btn.addEventListener('click', () => {
    if (shown >= part.hints.length || !btn.parentNode) return;
    const el = rich(part.hints[shown], 'div', 'callout hint');
    box.insertBefore(el, btn);
    renderMath(el);
    shown += 1;
    if (shown >= part.hints.length) btn.remove();
    else btn.textContent = `Hint ${shown + 1} of ${part.hints.length}`;
  });
  box.appendChild(btn);
  return box;
}

function checkBlock(part) {
  if (!part.check || !part.check.length) return null;
  const box = h('div', { class: 'ex-check' });
  box.appendChild(h('div', { class: 'small muted' }, 'Optional: type your final answers to check them.'));
  const fields = part.check.map((def) => { const f = createField(def); box.appendChild(f.el); return f; });
  const btn = h('button', { type: 'button', class: 'btn small' }, 'Check my answers');
  const reveal = h('button', { type: 'button', class: 'btn small ghost', hidden: true }, 'Show the expected answers');
  btn.addEventListener('click', () => { fields.forEach((f) => f.showResult(f.grade(), false)); reveal.hidden = false; });
  reveal.addEventListener('click', () => { fields.forEach((f) => f.showResult(f.grade(), true)); reveal.hidden = true; });
  box.appendChild(h('div', { class: 'row' }, btn, reveal));
  return box;
}

function solutionBlock(part) {
  const box = h('div', { class: 'ex-solution' });
  const list = h('ol', { class: 'ex-steps' });
  let shown = 0;
  const n = part.steps.length;
  const next = h('button', { type: 'button', class: 'btn small' }, n > 1 ? `Show solution step 1 of ${n}` : 'Show the solution');
  const all = h('button', { type: 'button', class: 'btn small ghost' }, 'Show the whole solution');
  const showOne = () => {
    if (shown >= n) return;
    const step = part.steps[shown];
    const li = rich(typeof step === 'string' ? step : step.html, 'li');
    if (typeof step === 'object' && step.figure) { try { li.appendChild(step.figure()); } catch (e) { li.appendChild(h('p', { class: 'error' }, `Figure unavailable: ${e.message}`)); } }
    list.appendChild(li);
    renderMath(li);
    shown += 1;
    if (shown >= n) { next.remove(); all.remove(); if (part.after) { const a = rich(part.after, 'div', 'callout move'); box.appendChild(a); renderMath(a); } }
    else next.textContent = `Show solution step ${shown + 1} of ${n}`;
  };
  next.addEventListener('click', showOne);
  all.addEventListener('click', () => { while (shown < n) showOne(); });
  box.appendChild(list);
  box.appendChild(h('div', { class: 'row' }, next, n > 1 ? all : null));
  return box;
}

function markBlock(ex, part, k) {
  const key = partKey(ex, k);
  const prev = store.get().questions[key];
  const box = h('div', { class: 'ex-mark' });
  const note = h('span', { class: 'small muted' }, prev ? `Marked ${prev.n} time${prev.n === 1 ? '' : 's'} so far.` : 'How did it go?');
  const row = h('div', { class: 'row' });
  MARKS.forEach((m) => {
    const b = h('button', { type: 'button', class: `btn small ${m.cls}` }, m.label);
    b.addEventListener('click', () => {
      store.recordQuestion(key, ex.topic, m.score);
      const c = store.rateCard(key, m.quality);
      if (m.score < 1) store.addMistake({ kind: 'exercise', topic: ex.topic, ref: `${ex.sheet}/${ex.n}`, title: `${ex.sheetTitle}, Exercise ${ex.label || ex.n} (${part.short || `part ${k + 1}`})`, detail: [], score: m.score });
      note.textContent = `Saved. Next review in ${c.interval} day${c.interval === 1 ? '' : 's'}.`;
    });
    row.appendChild(b);
  });
  box.appendChild(row);
  box.appendChild(note);
  return box;
}

function exercisePage(root, sheet, ex) {
  const topic = topicById(ex.topic);
  root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/exercises' }, 'Exercises'), ` / ${sheet.title}`));
  const art = h('article', { class: 'lesson exercise' });
  art.appendChild(h('h1', null, `Exercise ${ex.label || ex.n} · ${ex.title}`));
  art.appendChild(h('div', { class: 'row', style: 'margin-bottom:.8rem' },
    topic ? h('a', { class: 'chip blue', href: `#/learn/${topic.id}`, style: 'text-decoration:none' }, `Lesson: ${topic.short}`) : null,
    h('span', { class: 'chip' }, 'Instructor’s exercise'), statusChip(ex)));
  if (ex.statement) art.appendChild(rich(ex.statement, 'div', 'ex-statement'));
  if (ex.figure) { try { art.appendChild(ex.figure()); } catch (e) { art.appendChild(h('p', { class: 'error' }, `Figure unavailable: ${e.message}`)); } }
  if (ex.trainerStatement && ex.trainer) {
    try {
      const d = drillById(ex.trainer.drill);
      const preset = d.presets.find((p) => p.id === ex.trainer.preset);
      const built = d.build(preset.make());
      const st = typeof built.statement === 'function' ? built.statement() : rich(built.statement || '', 'div');
      art.appendChild(h('div', { class: 'card flat' }, st));
      if (built.figure) art.appendChild(typeof built.figure === 'function' ? built.figure() : built.figure);
    } catch (e) { art.appendChild(h('p', { class: 'error' }, `Statement unavailable: ${e.message}`)); }
  }
  if (ex.data) art.appendChild(rich(ex.data, 'div'));
  if (ex.trainer) {
    const d = drillById(ex.trainer.drill);
    if (d) art.appendChild(h('div', { class: 'row', style: 'margin:.4rem 0 1rem' }, h('a', { class: 'btn primary', href: `#/train/${d.id}${ex.trainer.preset ? `?p=${ex.trainer.preset}` : ''}` }, ex.trainer.label || `Do it in the trainer: ${d.title}`), h('span', { class: 'small muted' }, 'The trainer checks every intermediate result.')));
  }
  ex.parts.forEach((part, k) => {
    const card = h('section', { class: 'card ex-part' });
    card.appendChild(h('h2', null, ex.parts.length > 1 ? `Part ${k + 1}` : 'Question'));
    card.appendChild(rich(part.q, 'div', 'ex-q'));
    card.appendChild(hintBlock(part));
    const chk = checkBlock(part);
    if (chk) card.appendChild(chk);
    card.appendChild(solutionBlock(part));
    card.appendChild(markBlock(ex, part, k));
    art.appendChild(card);
  });
  if (ex.traps && ex.traps.length) art.appendChild(rich(`<div class="callout-title">Where marks are lost</div><ul>${ex.traps.map((t) => `<li>${t}</li>`).join('')}</ul>`, 'div', 'callout trap'));
  art.appendChild(h('p', { class: 'small muted' }, `Source: ${ex.src}`));
  const i = sheet.exercises.indexOf(ex);
  const nav = h('div', { class: 'row between', style: 'margin-top:1.4rem' });
  const prev = sheet.exercises[i - 1], next = sheet.exercises[i + 1];
  nav.appendChild(prev ? h('a', { class: 'btn', href: `#/exercises/${sheet.id}/${prev.n}` }, `← Exercise ${prev.label || prev.n}`) : h('span'));
  nav.appendChild(next ? h('a', { class: 'btn', href: `#/exercises/${sheet.id}/${next.n}` }, `Exercise ${next.label || next.n} →`) : h('a', { class: 'btn', href: '#/exercises' }, 'All exercises'));
  art.appendChild(nav);
  root.appendChild(art);
}

export function render(root, ctx) {
  const [sid, n] = ctx.parts;
  const sheet = SHEETS.find((s) => s.id === sid);
  const ex = sheet && n ? exerciseById(sid, n) : null;
  if (ex) exercisePage(root, sheet, ex); else index(root);
}
