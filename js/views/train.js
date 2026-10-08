// Trainer catalogue and runner.
import { h, rich, clear, makeRng, newSeed, pct, renderMath } from '../util.js';
import { store } from '../store.js';
import { DRILLS, drillById } from '../drills/index.js';
import { MODULES, TOPICS, topicById } from '../data/topics.js';
import { mountDrill } from '../drill-ui.js';
import { levelFor } from '../plan.js';

const customInstances = {}; // drill id -> last instance entered by hand (kept for this page load)
const LEVELS = [{ v: 1, label: 'Warm-up' }, { v: 2, label: 'Exam level' }, { v: 3, label: 'Harder' }];

function go(hash) { if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = hash; }

function catalogue(root) {
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Trainers'),
    h('p', null, 'Each trainer generates an instance, asks for every intermediate result an exam solution must show, and grades it with exact arithmetic. Start with the instructor’s example, then practise on fresh instances until the first-try score stays above 85%.')));

  const state = store.get();
  MODULES.forEach((m) => {
    const drills = DRILLS.filter((d) => { const t = topicById(d.topic); return t && t.module === m.id; });
    if (!drills.length) return;
    drills.sort((a, b) => TOPICS.findIndex((t) => t.id === a.topic) - TOPICS.findIndex((t) => t.id === b.topic));
    root.appendChild(h('div', { class: 'module-head' }, h('h2', null, m.title)));
    const grid = h('div', { class: 'grid two' });
    drills.forEach((d) => grid.appendChild(drillCard(d, state)));
    root.appendChild(grid);
  });
}

function drillCard(d, state) {
  const topic = topicById(d.topic);
  const st = state.drills[d.id];
  const card = h('section', { class: 'card drill-card' });
  card.appendChild(h('div', { class: 'meta' },
    h('a', { class: 'chip blue', href: `#/learn/${d.topic}`, style: 'text-decoration:none' }, topic ? `${topic.code} · ${topic.short}` : d.topic),
    h('span', { class: 'chip' }, `≈ ${d.minutes || 8} min`),
    topic && !topic.released ? h('span', { class: 'chip', title: 'Slides not yet released; follows the textbook' }, 'Ahead of slides') : null,
    st ? h('span', { class: `chip ${st.lastScore >= 0.85 ? 'ok' : st.lastScore >= 0.6 ? 'warn' : 'bad'}` }, `last ${pct(st.lastScore, 0)} · best ${pct(st.best, 0)} · ${st.n}×`) : h('span', { class: 'chip' }, 'not tried yet')));
  card.appendChild(h('h3', null, d.title));
  card.appendChild(h('p', null, d.blurb));

  const launch = h('div', { class: 'launch' });
  let level = levelFor(state, d.topic);
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Difficulty' });
  const segBtns = LEVELS.map((L) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(L.v === level) }, L.label);
    b.addEventListener('click', () => { level = L.v; segBtns.forEach((x, i) => x.setAttribute('aria-pressed', String(LEVELS[i].v === level))); });
    seg.appendChild(b);
    return b;
  });
  launch.appendChild(h('div', { class: 'row' },
    h('button', { type: 'button', class: 'btn primary', onclick: () => go(`#/train/${d.id}?level=${level}&seed=${newSeed()}`) }, 'New instance'),
    seg));
  if (d.presets && d.presets.length) {
    const row = h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'From the course:'));
    d.presets.forEach((p) => row.appendChild(h('a', { class: 'btn small', href: `#/train/${d.id}?p=${p.id}` }, p.label)));
    launch.appendChild(row);
  }
  if (d.custom) launch.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn ghost small', href: `#/train/${d.id}?custom=edit` }, 'Enter your own instance (e.g. from a past exam)')));
  card.appendChild(launch);
  return card;
}

function customForm(root, d) {
  root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/train' }, 'Trainers'), ' / ', d.title));
  root.appendChild(h('div', { class: 'page-head' }, h('h1', null, `${d.title}: your own instance`), h('p', null, 'Type the data of any exercise (a past exam, the textbook, a friend’s question). The trainer solves it with the course’s tie rules and grades your trace.')));
  const card = h('section', { class: 'card' });
  card.appendChild(rich(d.custom.help, 'p'));
  const form = h('form', { class: 'custom-form' });
  const inputs = {};
  d.custom.fields.forEach((f) => {
    const el = f.kind === 'textarea' ? h('textarea', { rows: Math.min(14, String(f.value).split('\n').length + 2) }) : h('input', { type: 'text' });
    el.value = f.value;
    inputs[f.key] = el;
    form.appendChild(h('label', null, f.label, el));
  });
  const err = h('div', { class: 'error', role: 'alert' });
  form.appendChild(err);
  form.appendChild(h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'btn primary' }, 'Build exercise'), h('a', { class: 'btn', href: '#/train' }, 'Cancel')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const values = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value]));
      const inst = d.custom.parse(values);
      d.build(inst); // make sure it can be solved before navigating
      customInstances[d.id] = inst;
      go(`#/train/${d.id}?custom=run`);
    } catch (ex) { err.textContent = ex.message || String(ex); }
  });
  card.appendChild(form);
  root.appendChild(card);
  renderMath(card);
}

function runner(root, d, params) {
  if (params.custom === 'edit') { customForm(root, d); return; }
  let inst; let meta; let badge;
  if (params.custom === 'run' && customInstances[d.id]) {
    inst = customInstances[d.id]; meta = { drill: d.id, custom: true }; badge = 'Your instance';
  } else if (params.p && d.presets && d.presets.find((p) => p.id === params.p)) {
    const p = d.presets.find((x) => x.id === params.p);
    inst = p.make(); meta = { drill: d.id, preset: p.id }; badge = 'From the course';
  } else {
    const level = [1, 2, 3].includes(Number(params.level)) ? Number(params.level) : levelFor(store.get(), d.topic);
    let seed = Number(params.seed);
    if (!Number.isFinite(seed) || seed <= 0) {
      seed = newSeed();
      history.replaceState(null, '', `#/train/${d.id}?level=${level}&seed=${seed}`);
    }
    inst = d.random(makeRng(seed), level);
    meta = { drill: d.id, seed, level };
    badge = `${LEVELS[level - 1].label} · #${seed}`;
  }
  const topic = topicById(d.topic);
  root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/train' }, 'Trainers'), ' / ', topic ? h('a', { href: `#/learn/${topic.id}` }, topic.title) : null));
  const host = h('div');
  root.appendChild(host);
  const level = meta.level || levelFor(store.get(), d.topic);
  mountDrill(host, d.build(inst), {
    mode: 'practice', meta, badge,
    actions: [
      { label: 'New instance', primary: true, onClick: () => go(`#/train/${d.id}?level=${level}&seed=${newSeed()}`) },
      { label: 'Same instance again', onClick: () => go(location.hash) },
      { label: 'Open the lesson', onClick: () => go(`#/learn/${d.topic}`) },
      { label: 'All trainers', onClick: () => go('#/train') },
    ],
  });
}

export function render(root, ctx) {
  const d = ctx.parts[0] ? drillById(ctx.parts[0]) : null;
  if (!d) { catalogue(root); return; }
  try { runner(root, d, ctx.params); } catch (e) {
    clear(root);
    root.appendChild(h('div', { class: 'card' }, h('h2', null, 'This instance could not be built'), h('p', { class: 'error' }, e.message || String(e)), h('a', { class: 'btn', href: '#/train' }, 'Back to trainers')));
  }
}

// Link that reproduces the exercise recorded in a mistake-notebook entry.
export function hrefForMeta(meta) {
  if (!meta || !meta.drill) return '#/train';
  if (meta.preset) return `#/train/${meta.drill}?p=${meta.preset}`;
  if (meta.seed) return `#/train/${meta.drill}?level=${meta.level || 2}&seed=${meta.seed}`;
  return `#/train/${meta.drill}`;
}
