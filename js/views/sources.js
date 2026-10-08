// Sources and coverage: what the content is built from, and how each part was checked.
import { h, rich, renderMath } from '../util.js';
import { SOURCES } from '../data/sources.js';
import { loadBank, bankNow, extBatches } from '../bank.js';

function table(headers, rows, cls = '') {
  const t = h('table', { class: `data-table left ledger ${cls}`, style: 'width:100%' });
  t.appendChild(h('thead', null, h('tr', null, ...headers.map((x) => h('th', null, x)))));
  const body = h('tbody');
  rows.forEach((r) => body.appendChild(h('tr', null, ...r.map((c) => (c instanceof Node ? h('td', null, c) : rich(String(c), 'td'))))));
  t.appendChild(body);
  return h('div', { class: 'grid-scroll' }, t);
}

export function render(root) {
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Sources and coverage'),
    h('p', null, 'What this trainer is built from, who read what, and how the answer keys were checked. Use it to judge how far to trust each part.')));

  SOURCES.sections.forEach((sec) => {
    const card = h('section', { class: 'card' }, h('h2', null, sec.title));
    if (sec.html) card.appendChild(rich(sec.html, 'div'));
    if (sec.table) card.appendChild(table(sec.table.headers, sec.table.rows));
    if (sec.after) card.appendChild(rich(sec.after, 'div', 'small muted'));
    root.appendChild(card);
  });

  const ext = h('section', { class: 'card' }, h('h2', null, 'External questions in the bank'));
  const host = h('div', null, h('p', { class: 'muted' }, 'Loading…'));
  ext.appendChild(host);
  root.appendChild(ext);
  loadBank().then(() => {
    if (!host.isConnected) return;
    host.textContent = '';
    const items = bankNow().filter((q) => q.ext);
    if (!items.length) { host.appendChild(h('p', { class: 'muted' }, 'No external question files are installed.')); return; }
    const bySource = new Map();
    items.forEach((q) => {
      const label = (q.source && q.source.label ? q.source.label : 'unknown').replace(/,?\s*(Q|question|ex\.|exercise|problem|p\.|pp\.|item|part)\s*[\w.()–-]+.*$/i, '').trim();
      const key = `${label}|${(q.source && q.source.url) || ''}`;
      const e = bySource.get(key) || { label, url: q.source && q.source.url, n: 0, worked: 0 };
      e.n += 1; if (q.source && q.source.solution === 'worked') e.worked += 1;
      bySource.set(key, e);
    });
    const rows = [...bySource.values()].sort((a, b) => b.n - a.n).map((e) => [
      e.url ? h('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer' }, e.label) : e.label,
      String(e.n),
      e.worked ? `${e.worked} with a solution worked for this app` : 'solutions from the source',
    ]);
    host.appendChild(h('p', null, `${items.length} questions from ${bySource.size} sources, in ${extBatches().length} file(s). Each question shows its own source line when you answer it.`));
    host.appendChild(table(['Source', 'Questions', 'Solutions'], rows));
    renderMath(host);
  });
}
