// Helpers shared by the trainers.
import { h, rich } from '../util.js';
import { Frac } from '../math/frac.js';

export const inf = (v) => (v === Infinity ? '∞' : v instanceof Frac ? v.pretty() : String(v));
export const setText = (arr) => (arr.length ? `{${arr.join(', ')}}` : '∅');
export const pathText = (arr) => arr.join(' → ');

// Small read-only data table. rows: arrays of strings (HTML allowed).
export function dataTable(headers, rows, cls = '') {
  const table = h('table', { class: `data-table ${cls}` });
  if (headers) {
    const tr = h('tr');
    headers.forEach((x) => tr.appendChild(rich(String(x), 'th')));
    table.appendChild(h('thead', null, tr));
  }
  const body = h('tbody');
  rows.forEach((r) => {
    const tr = h('tr');
    r.forEach((x, i) => tr.appendChild(rich(String(x), i === 0 && r.rowHead ? 'th' : 'td')));
    body.appendChild(tr);
  });
  table.appendChild(body);
  return h('div', { class: 'grid-scroll' }, table);
}

// Horizontal table: first column is a row label, the rest are values.
export function wideTable(rowLabels, cols, corner = '') {
  const table = h('table', { class: 'data-table wide' });
  cols.head && table.appendChild(h('thead', null, h('tr', null, rich(corner, 'th'), ...cols.head.map((c) => rich(String(c), 'th')))));
  const body = h('tbody');
  rowLabels.forEach((lab, i) => body.appendChild(h('tr', null, rich(lab, 'th'), ...cols.rows[i].map((c) => rich(String(c), 'td')))));
  table.appendChild(body);
  return h('div', { class: 'grid-scroll' }, table);
}

export function frag(...nodes) {
  const d = document.createElement('div');
  nodes.flat().forEach((n) => { if (n) d.appendChild(n instanceof Node ? n : rich(String(n))); });
  return d;
}

export function ul(items) { return `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`; }
export function ol(items) { return `<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`; }

// Try a generator until the predicate accepts (keeps instances interesting and well-posed).
export function generateUntil(rng, make, accept, tries = 400) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = make(rng);
    if (last && accept(last)) return last;
  }
  return last;
}

// Parse "u v w" lines (also accepts commas, arrows and semicolons) into [{u, v, w}].
export function parseTriples(text, numeric = true) {
  const out = [];
  String(text).split(/[\n;]+/).forEach((line) => {
    const toks = line.replace(/->|→|,|:|\(|\)/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return;
    if (toks.length !== 3) throw new Error(`Each line needs "from to value": "${line.trim()}"`);
    const w = Number(toks[2]);
    if (numeric && !Number.isFinite(w)) throw new Error(`"${toks[2]}" is not a number`);
    out.push({ u: toks[0].toLowerCase(), v: toks[1].toLowerCase(), w });
  });
  if (!out.length) throw new Error('No data found.');
  return out;
}

export function parseMatrix(text) {
  const rows = String(text).trim().split(/[\n;]+/).map((line) => line.trim().split(/[\s,]+/).filter(Boolean).map(Number));
  if (!rows.length || rows.some((r) => r.some((x) => !Number.isFinite(x)))) throw new Error('Use numbers separated by spaces, one row per line.');
  if (rows.some((r) => r.length !== rows[0].length)) throw new Error('Every row needs the same number of entries.');
  return rows;
}

export function parseList(text) {
  const xs = String(text).trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  if (!xs.length || xs.some((x) => !Number.isFinite(x))) throw new Error('Use numbers separated by spaces or commas.');
  return xs;
}
