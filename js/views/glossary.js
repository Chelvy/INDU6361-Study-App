// Glossary: every technical term of the lessons, alphabetical and searchable, with links to the lessons.
import { h, rich, clear, renderMath } from '../util.js';
import { GLOSSARY } from '../data/glossary.js';
import { topicById } from '../data/topics.js';

// Plain lower-case text of an HTML/LaTeX string, for searching ("Chvátal" also matches "chvatal").
export const plainText = (s) => String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\$/g, ' ')
  .replace(/\\[a-zA-Z]+/g, ' ')
  .normalize('NFD').replace(/\p{Mn}/gu, '')
  .toLowerCase();

const sortKey = (term) => plainText(term).replace(/^[^a-z0-9]+/, '');

// All entries in alphabetical order of their term.
export function sortedEntries(list = GLOSSARY) {
  return list.slice().sort((a, b) => sortKey(a.term).localeCompare(sortKey(b.term), 'en'));
}

// Entries matching every word of the query: in the term or its other names first, then anywhere in the text.
export function filterEntries(query, list = GLOSSARY) {
  const words = plainText(query).split(/\s+/).filter(Boolean);
  const all = sortedEntries(list);
  if (!words.length) return all;
  const names = (e) => plainText([e.term, ...(e.also || [])].join(' '));
  const body = (e) => `${names(e)} ${plainText(e.plain)} ${plainText(e.example)}`;
  const inNames = all.filter((e) => words.every((w) => names(e).includes(w)));
  const inBody = all.filter((e) => !inNames.includes(e) && words.every((w) => body(e).includes(w)));
  return inNames.concat(inBody);
}

// First letter used for grouping: A–Z, or # for terms that start with a digit.
export function letterOf(term) {
  const c = sortKey(term).charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

function entryCard(e) {
  const topics = (e.topics || []).map(topicById).filter(Boolean);
  const ahead = topics.length && topics.every((t) => !t.released);
  const box = h('div', { class: 'gloss-entry', id: `g-${sortKey(e.term).replace(/[^a-z0-9]+/g, '-')}`, style: 'break-inside:avoid;margin:0 0 .9rem' });
  box.appendChild(h('div', { style: 'margin-bottom:.15rem' },
    h('b', null, e.term),
    e.also && e.also.length ? h('span', { class: 'muted small' }, `  ·  also: ${e.also.join(', ')}`) : null,
    ahead ? h('span', { class: 'chip', style: 'margin-left:.4rem', title: 'Classes 7–10: the slides were not yet released; this follows the textbook' }, 'Ahead of slides') : null));
  box.appendChild(rich(e.plain, 'div'));
  box.appendChild(rich(`<i>Example.</i> ${e.example}`, 'div', 'small'));
  if (topics.length) {
    const links = h('div', { class: 'small muted', style: 'margin-top:.15rem' }, 'Lessons: ');
    topics.forEach((t, i) => {
      if (i) links.appendChild(document.createTextNode(' · '));
      links.appendChild(h('a', { href: `#/learn/${t.id}` }, `${t.code} ${t.short}`));
    });
    box.appendChild(links);
  }
  return box;
}

export function render(root, ctx = {}) {
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Glossary'),
    h('p', null, `${GLOSSARY.length} technical terms of the course, each in a few short sentences with a tiny example and the lessons that use it. Numbers come from the instructor’s slides and exercise sheets unless an entry says otherwise.`)));
  const params = ctx.params || {};
  const parts = ctx.parts || [];
  const initial = params.q || (parts[0] ? String(parts[0]) : '');
  const search = h('input', { type: 'text', class: 'search', placeholder: 'Search, e.g. facet, gap, big-M, lazy…', 'aria-label': 'Search the glossary', value: initial || null });
  const count = h('span', { class: 'muted small' });
  root.appendChild(h('div', { class: 'filters' }, search, count));
  const host = h('div', { class: 'sheet' });
  root.appendChild(host);

  const draw = () => {
    const q = typeof search.value === 'string' ? search.value : initial;
    const list = filterEntries(q);
    clear(host);
    count.textContent = q && q.trim() ? `${list.length} of ${GLOSSARY.length} terms` : `${GLOSSARY.length} terms`;
    if (!list.length) { host.appendChild(h('p', { class: 'muted' }, 'No term matches that search.')); return; }
    if (q && q.trim()) {
      // a search shows the matches in one block, best matches (in the term itself) first
      const sec = h('section', null, h('h3', null, 'Matches'));
      list.forEach((e) => sec.appendChild(entryCard(e)));
      host.appendChild(sec);
    } else {
      let sec = null;
      let letter = '';
      list.forEach((e) => {
        const l = letterOf(e.term);
        if (l !== letter) { letter = l; sec = h('section', null, h('h3', null, l)); host.appendChild(sec); }
        sec.appendChild(entryCard(e));
      });
    }
    renderMath(host);
  };
  search.addEventListener('input', draw);
  draw();
}
