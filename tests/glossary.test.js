// Glossary: unique terms, valid lesson links, KaTeX-safe text, and the page renders and searches.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, installStubDom, collectHtml } from './helpers.js';

installStubDom();
const { GLOSSARY } = await import('../js/data/glossary.js');
const { topicById } = await import('../js/data/topics.js');
const view = await import('../js/views/glossary.js');

test('the glossary has at least 100 well-formed entries with unique terms', () => {
  assert.ok(GLOSSARY.length >= 100, `only ${GLOSSARY.length} entries`);
  const seen = new Set();
  GLOSSARY.forEach((e, i) => {
    const w = `glossary[${i}] ${e.term}`;
    assert.equal(typeof e.term, 'string', `${w}: term`);
    assert.ok(e.term.trim().length > 0, `${w}: empty term`);
    const key = e.term.trim().toLowerCase();
    assert.ok(!seen.has(key), `${w}: duplicate term`);
    seen.add(key);
    checkHtml(e.term, `${w} term`);
    checkHtml(e.plain, `${w} plain`);
    checkHtml(e.example, `${w} example`);
    if (e.also !== undefined) {
      assert.ok(Array.isArray(e.also) && e.also.length > 0, `${w}: also must be a non-empty list`);
      e.also.forEach((a, k) => checkHtml(a, `${w} also[${k}]`));
    }
    assert.ok(Array.isArray(e.topics) && e.topics.length > 0, `${w}: topics`);
    e.topics.forEach((t) => assert.ok(topicById(t), `${w}: unknown topic ${t}`));
    // simple English: definitions stay short (at most three sentences)
    const sentences = view.plainText(e.plain).split(/[.!?](\s|$)/).filter((s) => s && s.trim().length > 2);
    assert.ok(sentences.length <= 3, `${w}: definition too long (${sentences.length} sentences)`);
  });
});

test('the terms the lessons rely on are all defined', () => {
  const names = new Set(GLOSSARY.flatMap((e) => [e.term, ...(e.also || [])]).map((s) => view.plainText(s).trim()));
  const has = (w) => [...names].some((n) => n === w || n.startsWith(`${w} `) || n.includes(`${w} (`));
  ['feasible', 'relaxation', 'incumbent', 'dual bound', 'gap', 'fathom', 'convex hull', 'facet', 'affine independence', 'dimension',
    'totally unimodular', 'determinant', 'cycle cover', 'subtour', 'separation', 'lazy constraint', 'user cut', 'valid inequality',
    'chvatal–gomory cut', 'fractional part', 'floor', 'ceiling', 'mir', 'cover', 'minimal cover', 'extended cover', 'lifting', 'clique',
    'conflict graph', 'flow cover', 'excess capacity', 'lot sizing', 'epigraph', 'convex function', 'tangent', 'perspective',
    'lagrangian', 'surrogate', 'big-m', 'linking constraint', 'extended formulation', 'projection', 'compact', 'simplex tableau',
    'basic variable', 'slack', 'reduced cost', 'residual graph', 'augmenting path'].forEach((w) => assert.ok(has(w), `no entry for “${w}”`));
});

test('search finds terms by name, by other name and by text, ignoring accents', () => {
  const first = (q) => view.filterEntries(q)[0];
  assert.equal(first('facet').term, 'Facet');
  assert.equal(first('chvatal').term, 'Chvátal–Gomory cut');
  assert.equal(first('residual graph').term, 'Residual network');
  assert.equal(first('lambda').term, 'Excess capacity');
  assert.equal(view.filterEntries('').length, GLOSSARY.length);
  assert.equal(view.filterEntries('zzzz-no-such-word').length, 0);
  const sorted = view.sortedEntries().map((e) => e.term);
  assert.equal(sorted[0], '2-opt');
  assert.equal(view.letterOf('2-opt'), '#');
  assert.equal(view.letterOf('Chvátal–Gomory cut'), 'C');
});

test('the glossary page renders every entry with KaTeX-safe HTML and lesson links', () => {
  const root = document.createElement('div');
  view.render(root, { parts: [], params: {} });
  const html = collectHtml(root);
  assert.ok(html.length >= 2 * GLOSSARY.length, 'entries were not rendered');
  html.forEach((s, i) => checkHtml(s, `rendered html ${i}`));
  const hrefs = [];
  const walk = (n) => { if (n && n.attrs && n.attrs.href) hrefs.push(n.attrs.href); (n && n.children ? n.children : []).forEach(walk); };
  walk(root);
  assert.ok(hrefs.length >= GLOSSARY.length, 'lesson links missing');
  hrefs.forEach((href) => {
    const m = /^#\/learn\/([A-Za-z0-9]+)$/.exec(href);
    assert.ok(m && topicById(m[1]), `bad link ${href}`);
  });
  const searched = document.createElement('div');
  view.render(searched, { parts: [], params: { q: 'facet' } });
  assert.ok(collectHtml(searched).length < html.length, 'a search should show fewer entries');
});
