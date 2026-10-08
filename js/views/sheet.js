// Cheat sheet: compact, searchable, printable.
import { h, rich, clear, renderMath } from '../util.js';
import { SHEET } from '../data/sheet.js';
import { topicById } from '../data/topics.js';

const strip = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\$/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').toLowerCase();

export function render(root) {
  root.appendChild(h('div', { class: 'page-head no-print' },
    h('h1', null, 'Cheat sheet'),
    h('p', null, 'Definitions, formulas and procedures in the course’s notation. Use it for a last pass before the exam, or print it (the exam itself is closed book).')));
  const search = h('input', { type: 'text', class: 'search', placeholder: 'Filter, e.g. gap, cover, big-M, MTZ…', 'aria-label': 'Filter the cheat sheet' });
  const count = h('span', { class: 'muted small' });
  root.appendChild(h('div', { class: 'filters no-print' }, search, h('button', { type: 'button', class: 'btn', onclick: () => window.print() }, 'Print'), count));
  const host = h('div', { class: 'sheet' });
  root.appendChild(host);

  const draw = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    clear(host);
    let shown = 0;
    SHEET.forEach((sec) => {
      const titleHit = words.length && words.every((w) => sec.title.toLowerCase().includes(w));
      const items = sec.items.filter((it) => !words.length || titleHit || words.every((w) => strip(it).includes(w)));
      if (!items.length) return;
      shown += items.length;
      const topic = sec.topic ? topicById(sec.topic) : null;
      const el = h('section', null, h('h3', null, topic ? h('a', { href: `#/learn/${topic.id}`, style: 'color:inherit;text-decoration:none' }, sec.title) : sec.title));
      el.appendChild(rich(`<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`, 'div'));
      host.appendChild(el);
    });
    count.textContent = words.length ? `${shown} line${shown === 1 ? '' : 's'} match` : '';
    if (!shown) host.appendChild(h('p', { class: 'muted' }, 'Nothing matches that filter.'));
    renderMath(host);
  };
  search.addEventListener('input', draw);
  draw();
}
