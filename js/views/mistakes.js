// Mistake notebook: everything missed on a first attempt, with a way to retry it.
import { h, rich, newSeed, renderMath } from '../util.js';
import { store } from '../store.js';
import { topicById } from '../data/topics.js';
import { drillById } from '../drills/index.js';
import { hrefForMeta } from './train.js';

function ago(ms) {
  const d = Math.floor((Date.now() - ms) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

export function render(root) {
  const state = store.get();
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Mistake notebook'),
    h('p', null, 'Every exercise step or question you missed on the first attempt lands here. Retry it, and mark it resolved only when you can do it cold. Most lost exam marks are repeats of the same few slips.')));

  if (!state.mistakes.length) {
    root.appendChild(h('div', { class: 'card empty' }, h('p', null, 'No open mistakes. They will appear here as you train.'), h('a', { class: 'btn primary', href: '#/train' }, 'Go to the trainers')));
    return;
  }

  // Where the mistakes cluster
  const counts = {};
  state.mistakes.forEach((m) => { counts[m.topic] = (counts[m.topic] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cluster = h('section', { class: 'card' }, h('h3', null, 'Where they cluster'));
  const row = h('div', { class: 'row' });
  top.forEach(([t, n]) => { const topic = topicById(t); row.appendChild(h('a', { class: 'chip warn', href: `#/learn/${t}`, style: 'text-decoration:none' }, `${topic ? topic.short : t} × ${n}`)); });
  cluster.appendChild(row);
  cluster.appendChild(h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn danger small', onclick: () => { if (window.confirm('Remove every entry from the notebook?')) { store.clearMistakes(); location.reload(); } } }, 'Clear the notebook')));
  root.appendChild(cluster);

  state.mistakes.forEach((m) => {
    const topic = topicById(m.topic);
    const card = h('section', { class: 'card mistake' });
    const left = h('div');
    left.appendChild(h('div', { class: 'row', style: 'margin-bottom:.3rem' },
      topic ? h('span', { class: 'chip blue' }, topic.short) : null,
      h('span', { class: 'chip' }, m.kind === 'drill' ? 'Trainer' : 'Question'),
      h('span', { class: 'muted small' }, ago(m.when)),
      typeof m.score === 'number' ? h('span', { class: 'muted small' }, `scored ${Math.round(m.score * 100)}%`) : null));
    left.appendChild(rich(m.title || '', 'h4'));
    if (m.detail && m.detail.length) {
      const ul = h('ul');
      m.detail.forEach((d) => ul.appendChild(rich(d, 'li')));
      left.appendChild(h('div', { class: 'small muted' }, 'Missed:'));
      left.appendChild(ul);
    }
    const right = h('div', { class: 'row', style: 'justify-content:flex-end' });
    if (m.kind === 'drill') {
      const d = drillById(m.ref);
      if (d) {
        if (m.meta && (m.meta.seed || m.meta.preset)) right.appendChild(h('a', { class: 'btn small', href: hrefForMeta(m.meta) }, 'Same instance'));
        right.appendChild(h('a', { class: 'btn small primary', href: `#/train/${d.id}?level=${(m.meta && m.meta.level) || 2}&seed=${newSeed()}` }, 'Fresh instance'));
      }
    } else {
      right.appendChild(h('a', { class: 'btn small primary', href: `#/bank?q=${encodeURIComponent(m.ref)}` }, 'Try again'));
    }
    if (topic) right.appendChild(h('a', { class: 'btn small', href: `#/learn/${topic.id}` }, 'Lesson'));
    right.appendChild(h('button', { type: 'button', class: 'btn small ghost', onclick: () => { store.removeMistake(m.id); card.remove(); } }, 'Resolved'));
    card.appendChild(left); card.appendChild(right);
    root.appendChild(card);
  });
  renderMath(root);
}
