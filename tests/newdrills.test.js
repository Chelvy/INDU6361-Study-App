// The trainers added on 24 October 2026: facets in the plane (20E ex. 12), surrogate relaxation (slides 103)
// and the EXTRA-202 proof that the flow model is at least as strong as MTZ. The presets must reproduce the
// instructor's numbers; random instances must keep the properties the steps rely on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, installStubDom, collectHtml } from './helpers.js';

installStubDom();
const { facetsDrill, facetData } = await import('../js/drills/facets.js');
const { surrogateDrill } = await import('../js/drills/surrogate.js');
const { mcfMtzDrill } = await import('../js/drills/proofs.js');
const { gradeField } = await import('../js/grade.js');
const { makeRng } = await import('../js/util.js');
const { sameInequality, parseInequality } = await import('../js/math/parse.js');

const preset = (d, id) => d.build(d.presets.find((p) => p.id === id).make());
const field = (built, step, k) => built.steps[step].fields[k];
const pt = (p) => p.map((v) => v.toString()).join(',');
const render = (x) => (typeof x === 'function' ? x() : x);

// Every string a trainer renders (statement, rules, step texts, explanations, labels, options) is KaTeX-safe.
function checkAllText(built, where) {
  const nodes = [built.statement, built.figure].concat(...built.steps.map((st) => [st.text, st.figure, st.explain, st.after]));
  nodes.forEach((x, i) => {
    const v = render(x);
    if (!v) return;
    if (typeof v === 'string') checkHtml(v, `${where} node ${i}`);
    else collectHtml(v).forEach((s, k) => checkHtml(s, `${where} node ${i}.${k}`));
  });
  if (built.rules) checkHtml(built.rules, `${where} rules`);
  if (built.wrapup) checkHtml(built.wrapup, `${where} wrapup`);
  built.steps.forEach((st, i) => (st.fields || []).forEach((f, k) => {
    const w = `${where} step ${i + 1} field ${k + 1}`;
    if (f.label) checkHtml(f.label, w);
    (f.options || []).forEach((o) => checkHtml(String(o.label), `${w} option`));
    (f.items || []).forEach((o) => checkHtml(o.label, `${w} item`));
    (f.rows || []).forEach((r) => { if (r.head) checkHtml(r.head, `${w} row head`); });
    (f.columns || []).forEach((c) => { checkHtml(c.head, `${w} column head`); (c.options || []).forEach((o) => assert.ok(!/[$<]/.test(o.short || o.label), `${w}: select options are plain text`)); });
    if (f.mis && !Array.isArray(f.mis)) Object.values(f.mis).forEach((m) => checkHtml(m, `${w} mis`));
    if (Array.isArray(f.mis)) f.mis.forEach((m) => checkHtml(m.msg, `${w} mis`));
  }));
}

// ---------------------------------------------------------------- facets (20E exercise 12)
test('facets preset 20e12 reproduces the instructor solution', () => {
  const inst = facetsDrill.presets.find((p) => p.id === '20e12').make();
  const D = facetData(inst);
  assert.equal(D.dimP, 2);
  assert.deepEqual(D.V.map(pt), ['0,0', '2,0', '2,1', '1,2', '0,2']);
  assert.deepEqual(D.rowInfo.map((x) => x.tight.map(pt)), [['0,0', '0,2'], ['0,0', '2,0'], ['2,0', '2,1'], ['1,2', '0,2'], ['2,1', '1,2']]);
  assert.ok(D.rowInfo.every((x) => x.facet), 'all five inequalities are facets of P');
  assert.equal(D.intP.length, 8);
  assert.deepEqual(D.removed.map(pt), ['2,1']);
  assert.equal(D.kept.length, 7);
  assert.deepEqual(D.corners.map(pt), ['0,0', '2,0', '1,2', '0,2']);
  assert.equal(D.dimQ, 2);
  assert.equal(D.rounded.b.toString(), '4');
  // on the LP polygon P ∩ {2x + y <= 4.5} the added row is an edge (audit of report J, item 6)
  assert.deepEqual(D.cutEdge.map(pt), ['2,1/2', '3/2,3/2']);

  const b = facetsDrill.build(inst);
  assert.equal(field(b, 0, 0).answer, 2);
  assert.deepEqual(field(b, 0, 1).answer, ['r0', 'r1', 'r2', 'r3', 'r4']);
  assert.equal(String(field(b, 1, 0).answer), '4');
  assert.equal(field(b, 1, 1).answer, 7);
  assert.equal(field(b, 1, 2).answer, 4);
  assert.equal(field(b, 1, 3).answer, 2);
  const table = field(b, 2, 0);
  // x >= 0, y >= 0, x <= 2, y <= 2, x + y <= 3, 2x + y <= 4.5
  assert.deepEqual(table.rows.map((r) => r.cells.cls), ['facet', 'facet', 'one', 'facet', 'one', 'never']);
  assert.deepEqual(table.rows.map((r) => r.cells.k), [2, 2, 1, 2, 1, 0]);
  const nf = field(b, 3, 0);
  assert.ok(sameInequality(nf.answerText, '2x + y <= 4'));
  assert.deepEqual(nf.alts, []);
  assert.ok(gradeField(nf, '2x + y <= 4').ok);
  assert.ok(gradeField(nf, '4x + 2y <= 8').ok, 'a multiple of the facet is the same inequality');
  assert.ok(gradeField(nf, '-2x - y >= -4').ok);
});

test('facets: the new-facet field explains wrong answers', () => {
  const b = preset(facetsDrill, '20e12');
  const nf = field(b, 3, 0);
  const msg = (s) => { const r = gradeField(nf, s); assert.ok(!r.ok, s); assert.ok(r.msg, `${s}: no message`); checkHtml(r.msg, s); return r.msg; };
  assert.match(msg('x <= 2'), /already in the list/);
  assert.match(msg('x + y <= 3'), /already in the list/);
  assert.match(msg('2x + y <= 5'), /never tight/);
  assert.match(msg('x + y <= 2'), /Not valid/);
  assert.match(msg('x + 2y <= 5'), /tight only at/);
  assert.match(msg('2x + y = 4'), /not an equation/);
});

test('facets: random instances are 2-dimensional with a 2-dimensional hull and at least one new facet', () => {
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 60; seed++) {
    const inst = facetsDrill.random(makeRng(seed * 104729 + level), level);
    const D = facetData(inst);
    const w = `L${level} seed ${seed}`;
    assert.equal(D.dimP, 2, w);
    assert.equal(D.dimQ, 2, w);
    assert.ok(D.removed.length >= 1, `${w}: the added inequality cuts off an integer point`);
    assert.ok(D.newFacets.length >= 1, `${w}: a new facet exists`);
    assert.ok(D.candInfo.every((x) => x.valid), `${w}: every listed inequality is valid for Q`);
    assert.equal(D.candInfo[D.candInfo.length - 1].cls, 'never', `${w}: the added inequality is never tight on Q`);
    const V = D.V.map(pt);
    assert.ok(D.V.every((p) => p.every((v) => v.ge(0) && v.le(5))), `${w}: inside the box [0,5]^2 (${V})`);
    const nf = facetsDrill.build(inst).steps[3].fields[0];
    [nf.answerText].concat(nf.alts).forEach((t) => assert.ok(D.newFacets.some((f) => sameInequality(parseInequality(t), { terms: new Map([['x', f.row.a[0]], ['y', f.row.a[1]]]), op: '<=', rhs: f.row.b })), `${w}: ${t} is a hull edge`));
  }
});

// ---------------------------------------------------------------- surrogate (slides 103)
test('surrogate preset slides103 reproduces the slide example', () => {
  const b = preset(surrogateDrill, 'slides103');
  assert.ok(sameInequality(field(b, 0, 0).answerText, '3x + 3y <= 10'));
  assert.equal(field(b, 1, 0).answer, 3);
  assert.equal(field(b, 1, 1).answer, 0);
  assert.equal(field(b, 1, 2).answer, 9);
  assert.equal(field(b, 1, 3).answer, 'no');
  assert.equal(field(b, 2, 0).answer, 8);
  assert.equal(field(b, 3, 0).answer, 'upper');
  assert.equal(field(b, 3, 1).answer, 1);
  assert.ok(sameInequality(field(b, 4, 0).answerText, '2x + y <= 5'));
  assert.equal(field(b, 4, 1).answer, 10);
  assert.equal(field(b, 4, 2).answer, 'u');
  const explain = collectHtml(b.steps[4].explain()).join(' ');
  assert.match(explain, /removes that row/);
  assert.match(b.wrapup, /8\$ at \$u=\(3,1\)\$/, 'the best weights with entries 0..3 close the gap (app computation)');
});

test('surrogate: random instances have a unique relaxed optimum and bounds pointing up', () => {
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 60; seed++) {
    const b = surrogateDrill.build(surrogateDrill.random(makeRng(seed * 7907 + level), level));
    const zR = field(b, 1, 2).answer, zStar = field(b, 2, 0).answer, zR2 = field(b, 4, 1).answer;
    assert.ok(zStar <= zR && zStar <= zR2, `L${level} seed ${seed}: relaxation bounds`);
    assert.equal(field(b, 3, 1).answer, zR - zStar);
    if (field(b, 1, 3).answer === 'yes') assert.equal(zR, zStar, 'a feasible relaxed optimum is optimal');
    else assert.ok(zR >= zStar);
  }
});

// ---------------------------------------------------------------- EXTRA-202 proof
test('mcf-mtz preset extra202 (n = 6) gives the numbers of the proof', () => {
  const b = preset(mcfMtzDrill, 'extra202');
  const order = field(b, 0, 0);
  assert.deepEqual(order.answer, ['start', 'sum', 'v', 'cancel', 'bound', 'range', 'pos', 'concl']);
  assert.notDeepEqual(order.items.map((x) => x.id), order.answer, 'the steps are shuffled');
  assert.deepEqual([...order.items.map((x) => x.id)].sort(), [...order.answer].sort());
  assert.deepEqual(b.steps[1].fields.map((f) => f.answer), [5, 1, 5]);
  assert.deepEqual(b.steps[2].fields.map((f) => f.answer), ['qij', 'indeg']);
  assert.deepEqual(b.steps[3].fields.map((f) => f.answer), [1, 5, 4, 2, 6]);
  assert.equal(field(b, 4, 0).answer, 'lp');
  assert.ok(gradeField(order, order.answer).ok);
  assert.ok(!gradeField(order, order.items.map((x) => x.id)).ok);
});

test('mcf-mtz: random n between 5 and 12, always shuffled', () => {
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 60; seed++) {
    const inst = mcfMtzDrill.random(makeRng(seed * 31 + level), level);
    assert.ok(inst.n >= 5 && inst.n <= 12);
    assert.ok(inst.v >= 1 && inst.v <= inst.n - 1);
    const b = mcfMtzDrill.build(inst);
    assert.notDeepEqual(b.steps[0].fields[0].items.map((x) => x.id), b.steps[0].fields[0].answer);
    assert.equal(field(b, 3, 2).answer, inst.n + 1 - inst.v);
  }
});

test('every text of the three new trainers is KaTeX-safe', () => {
  for (const d of [facetsDrill, surrogateDrill, mcfMtzDrill]) {
    d.presets.forEach((p) => checkAllText(d.build(p.make()), `${d.id}/${p.id}`));
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 15; seed++) checkAllText(d.build(d.random(makeRng(seed * 13 + level), level)), `${d.id}/L${level}/${seed}`);
  }
});
