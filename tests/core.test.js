// Core arithmetic, parser, LP and branch-and-bound checks against the numbers in the course slides.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Frac, F } from '../js/math/frac.js';
import { parseLinear, parseInequality, sameInequality, satisfies, inequalityToLatex } from '../js/math/parse.js';
import { solveLP, det, integerPoints, dualValues } from '../js/math/lp.js';
import { branchAndBound, relativeGap } from '../js/math/bb.js';

const s = (f) => f.toString();

test('Frac basics', () => {
  assert.equal(s(F('1.3')), '13/10');
  assert.equal(s(F(51.3)), '513/10');
  assert.equal(s(F('20/7').floor()), '2');
  assert.equal(s(F('-1/2').floor()), '-1');
  assert.equal(s(F('-1/2').ceil()), '0');
  assert.equal(s(F('947/190').fracPart()), '187/190');
  assert.equal(s(F('3').fracPart()), '0');
  assert.equal(F('972/19').toDecimal(3), '51.158');
  assert.equal(F('-0.25').toDecimal(2), '-0.25');
  assert.equal(F('1/3').pretty(), '1/3');
  assert.equal(F('13/10').pretty(), '1.3');
  assert.equal(F('.5').toString(), '1/2');
  assert.ok(F('2/4').eq('0.5'));
  assert.equal(Frac.tryParse('abc'), null);
});

test('linear parser', () => {
  const l = parseLinear('2x1 - x2 + 3/2 y - 4');
  assert.equal(s(l.terms.get('x1')), '2');
  assert.equal(s(l.terms.get('x2')), '-1');
  assert.equal(s(l.terms.get('y')), '3/2');
  assert.equal(s(l.c), '-4');
  assert.ok(sameInequality('y <= 6 + 4x', '-4x + y <= 6'));
  assert.ok(sameInequality('x + s/4 >= 2', '4x + s >= 8'));
  assert.ok(sameInequality('y1 + y2 <= 2 + 4(x1 + x2)', 'y1 + y2 + 4(1 - x1) + 4(1 - x2) <= 10'));
  assert.ok(sameInequality('x1 - x2 <= 1', '-x1 + x2 >= -1'));
  assert.ok(sameInequality('-9x + 10y ≤ 38', '10y - 9x <= 38'));
  assert.ok(!sameInequality('x1 + x2 <= 2', 'x1 + x2 <= 3'));
  assert.ok(!sameInequality('x1 + x2 <= 2', 'x1 + x2 >= 2'));
  assert.ok(sameInequality('t >= 8x - 16z', 't - 8x + 16z >= 0'));
  assert.ok(sameInequality('x_1 + x_{2} <= 1', 'x1+x2<=1'));
  assert.throws(() => parseLinear('x*y'));
  assert.throws(() => parseInequality('x + y'));
  assert.ok(satisfies('x1 + x2 + x3 + 2x4 <= 2', { x1: 1, x2: 1, x3: 0, x4: 0 }));
  assert.ok(!satisfies('x1 + x2 + x3 + 2x4 <= 2', { x1: '0.75', x2: 0, x3: 0, x4: 1 }));
  assert.equal(inequalityToLatex('x1 + 2x4 <= 2'), 'x_{1} + 2x_{4} \\le 2');
});

const workshop = {
  sense: 'max', c: [1, 10], names: ['x', 'y'],
  rows: [
    { a: [1, 0], op: '<=', b: 3 },
    { a: [-1, 1], op: '<=', b: '3.7' },
    { a: [1, 1], op: '<=', b: '6.3' },
  ],
};

test('LP: workshop relaxation (slides 102)', () => {
  const r = solveLP(workshop);
  assert.equal(r.status, 'optimal');
  assert.deepEqual(r.x.map(s), ['13/10', '5']);
  assert.equal(s(r.obj), '513/10');
  assert.ok(r.unique && !r.degenerate);
});

test('LP: infeasible, unbounded, min, >= rows, equality rows', () => {
  assert.equal(solveLP({ sense: 'max', c: [1], rows: [{ a: [1], op: '<=', b: 1 }, { a: [1], op: '>=', b: 2 }] }).status, 'infeasible');
  assert.equal(solveLP({ sense: 'max', c: [1, 1], rows: [{ a: [1, -1], op: '<=', b: 1 }] }).status, 'unbounded');
  const m = solveLP({ sense: 'min', c: [2, 3], rows: [{ a: [1, 1], op: '>=', b: 4 }, { a: [1, 0], op: '<=', b: 3 }] });
  assert.equal(s(m.obj), '9');
  assert.deepEqual(m.x.map(s), ['3', '1']);
  const e = solveLP({ sense: 'max', c: [1, 2], rows: [{ a: [1, 1], op: '=', b: 4 }, { a: [0, 1], op: '<=', b: 3 }] });
  assert.equal(s(e.obj), '7');
  // redundant equality rows are handled
  const red = solveLP({ sense: 'max', c: [1, 1], rows: [{ a: [1, 1], op: '=', b: 2 }, { a: [2, 2], op: '=', b: 4 }] });
  assert.equal(s(red.obj), '2');
});

test('LP duals: max with <= rows gives nonnegative prices and strong duality', () => {
  const model = { sense: 'max', c: [3, 5], rows: [{ a: [1, 0], op: '<=', b: 4 }, { a: [0, 2], op: '<=', b: 12 }, { a: [3, 2], op: '<=', b: 18 }] };
  const r = solveLP(model);
  assert.equal(s(r.obj), '36');
  const y = dualValues(model, r);
  assert.deepEqual(y.map(s), ['0', '3/2', '1']);
  const dualObj = y.reduce((acc, yi, i) => acc.add(yi.mul(F(model.rows[i].b))), F(0));
  assert.equal(s(dualObj), '36');
});

test('determinant', () => {
  assert.equal(s(det([[1, 1, 0], [1, 0, 1], [0, 1, 1]])), '-2');
  assert.equal(s(det([[2, 0], [0, 3]])), '6');
  assert.equal(s(det([[1, 2], [2, 4]])), '0');
});

test('B&B: workshop tree and log match slides 102', () => {
  const r = branchAndBound({ ...workshop, integer: [true, true] }, { incumbent: { x: [1, 4] } });
  assert.equal(r.status, 'optimal');
  assert.equal(r.nodes.length, 9);
  assert.deepEqual(r.incumbent.x.map(s), ['2', '4']);
  assert.equal(s(r.incumbent.value), '42');
  const b = (i) => (r.nodes[i].bound ? r.nodes[i].bound.toDecimal(2) : r.nodes[i].fate);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].map(b), ['51.3', '48', '45', '41', 'infeasible', '42.3', 'infeasible', '42', '36']);
  assert.deepEqual(r.nodes.map((nd) => nd.fate), ['branched', 'branched', 'branched', 'integral', 'infeasible', 'branched', 'infeasible', 'integral', 'bound']);
  // Log rows: node, local UB, incumbent, best UB, gap %
  const rows = r.log.map((L) => [L.node, L.depth, L.local.toDecimal(2), L.incumbent.toDecimal(2), L.best.toDecimal(2), (L.gap.toNumber() * 100).toFixed(1)]);
  assert.deepEqual(rows, [
    [0, 0, '51.3', '41', '51.3', '25.1'],
    [1, 1, '48', '41', '48', '17.1'],
    [2, 1, '45', '41', '45', '9.8'],
    [5, 2, '42.3', '41', '42.3', '3.2'],
    [7, 3, '42', '42', '42', '0.0'],
  ]);
  assert.deepEqual(r.log.map((L) => L.closed), [[], [3, 4], [6], [], [8]]);
});

test('B&B: stronger formulations from slides 104 (node counts and root bounds)', () => {
  const withRow = (a, b) => ({ ...workshop, rows: workshop.rows.concat([{ a, op: '<=', b }]), integer: [true, true] });
  const r1 = branchAndBound(withRow([1, 1], 6), { incumbent: { x: [1, 4] } });
  assert.equal(r1.nodes[0].bound.toDecimal(2), '49.65');
  assert.equal(r1.nodes.length, 5);
  // With y <= x + 3 the root (1.65, 4.65) has two fractional variables: the slide's 5-node trace
  // corresponds to branching on y first; branching on x first needs 7 nodes.
  const r2 = branchAndBound(withRow([-1, 1], 3), { incumbent: { x: [1, 4] }, branchRule: 'last' });
  assert.equal(r2.nodes[0].bound.toDecimal(2), '48.15');
  assert.equal(r2.nodes.length, 5);
  assert.equal(branchAndBound(withRow([-1, 1], 3), { incumbent: { x: [1, 4] } }).nodes.length, 7);
  // integer hull: x + y <= 6, y - x <= 3, y <= 4 -> one node
  const hull = { ...workshop, rows: workshop.rows.concat([{ a: [1, 1], op: '<=', b: 6 }, { a: [-1, 1], op: '<=', b: 3 }, { a: [0, 1], op: '<=', b: 4 }]), integer: [true, true] };
  const r3 = branchAndBound(hull, { incumbent: { x: [1, 4] } });
  assert.equal(r3.nodes.length, 1);
  assert.equal(s(r3.incumbent.value), '42');
});

test('B&B agrees with brute force on random small integer programs', () => {
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  for (let k = 0; k < 150; k++) {
    const n = ri(2, 3);
    const rows = [];
    const m = ri(2, 3);
    for (let i = 0; i < m; i++) rows.push({ a: Array.from({ length: n }, () => ri(-2, 6)), op: '<=', b: ri(5, 30) + (rnd() < 0.5 ? 0.5 : 0) });
    for (let j = 0; j < n; j++) rows.push({ a: Array.from({ length: n }, (_, q) => (q === j ? 1 : 0)), op: '<=', b: 7 });
    const c = Array.from({ length: n }, () => ri(1, 9));
    const model = { sense: 'max', c, rows, integer: Array(n).fill(true) };
    const r = branchAndBound(model, { branchRule: k % 2 ? 'first' : 'mostFractional' });
    const pts = integerPoints(rows, Array(n).fill(7));
    const best = pts.reduce((acc, p) => Math.max(acc, p.reduce((t, v, j) => t + v * c[j], 0)), -Infinity);
    assert.equal(r.status, 'optimal');
    assert.equal(r.incumbent.value.toNumber(), best, `instance ${k}`);
  }
});

test('relative gap follows the Gurobi definition', () => {
  assert.equal(relativeGap(1000, 1020).toDecimal(4), '0.02');
  assert.equal(relativeGap(0, 0).toString(), '0');
  assert.equal(relativeGap(0, 5), null);
});
