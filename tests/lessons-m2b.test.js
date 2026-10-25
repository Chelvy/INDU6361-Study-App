// Checks for the slides-206 / EXTRA-201 lessons, the refresher t003 and bank m2d: the numbers the lessons
// state that are not already covered by cuts.test.js (root-bound ladder, 20E exercises 9-14), and the
// format rules of the new questions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { solveLP } from '../js/math/lp.js';
import { knapsackFace, knapsackPoints, affineRank, isCover, isMinimalCover, extendedCover, liftCoefficient } from '../js/math/knapsack.js';
import { flowCover, flowCoverLhs, lotSizingCumulative, maximalCliques } from '../js/math/cuts.js';
import { getLesson } from '../js/data/lessons/index.js';
import m2d from '../js/data/bank/m2d.js';

const S = (v) => v.toString();

test('root-bound ladder of the lecture knapsack (t206a table)', () => {
  const c = [6, 6, 6, 10];
  const base = [{ a: [4, 4, 4, 7], op: '<=', b: 10 }, ...[0, 1, 2, 3].map((j) => ({ a: [0, 1, 2, 3].map((q) => (q === j ? 1 : 0)), op: '<=', b: 1 }))];
  const row = (a, b) => ({ a, op: '<=', b });
  const cover123 = row([1, 1, 1, 0], 2);
  const four = [row([1, 0, 0, 1], 1), row([0, 1, 0, 1], 1), row([0, 0, 1, 1], 1), cover123];
  const ext = row([1, 1, 1, 1], 2);
  const lifted = row([1, 1, 1, 2], 2);
  const lp = (rows) => solveLP({ sense: 'max', c, rows: [...base, ...rows] });
  assert.equal(S(lp([]).obj), '15');
  const one = lp([cover123]);
  assert.equal(S(one.obj), '104/7');
  assert.deepEqual(one.x.map(S), ['1', '1', '0', '2/7']);
  assert.equal(S(lp(four).obj), '104/7');
  const withExt = lp([...four, ext]);
  assert.equal(S(withExt.obj), '14');
  assert.deepEqual(withExt.x.map(S), ['1/2', '1/2', '1/2', '1/2']);
  assert.equal(S(lp([...four, ext, lifted]).obj), '12');
  // the certificate for 14: 4 * extended + 2 * each {i,4} cover reproduces the objective
  const comb = [0, 1, 2, 3].map((j) => 4 * ext.a[j] + 2 * (four[0].a[j] + four[1].a[j] + four[2].a[j]));
  assert.deepEqual(comb, c);
  assert.equal(4 * 2 + 2 * 3, 14);
});

test('facet checks stated in t206b: extended cover is not a facet, x1 + x4 <= 1 is', () => {
  const ext = knapsackFace([1, 1, 1, 1], 2, [4, 4, 4, 7], 10);
  assert.deepEqual([ext.tight.length, ext.faceDim, ext.isFacet], [3, 2, false]);
  const c14 = knapsackFace([1, 0, 0, 1], 1, [4, 4, 4, 7], 10);
  assert.deepEqual([c14.tight.length, c14.faceDim, c14.isFacet], [4, 3, true]);
  assert.equal(affineRank(knapsackPoints([4, 4, 4, 7], 10)), 4);
});

test('20E exercises 9-12 as stated in the lessons', () => {
  assert.deepEqual(maximalCliques(5, [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4]]), [[0, 1, 2], [2, 3, 4]]);
  const a = [5, 6, 7, 13];
  const sets = [];
  for (let m = 1; m < 16; m++) sets.push([0, 1, 2, 3].filter((i) => m & (1 << i)));
  const covers = sets.filter((s) => isCover(a, 17, s));
  assert.equal(covers.length, 8);
  assert.equal(covers.filter((s) => isMinimalCover(a, 17, s)).length, 4);
  assert.deepEqual(extendedCover(a, [0, 1, 2]), [0, 1, 2, 3]);
  assert.equal(S(liftCoefficient(a, 17, [1, 1, 1, 0], 2, 3).alpha), '2');
  // Exercise 12: integer points of the pentagon, the hull Q after 2x + y <= 4.5, and the face dimensions
  const P = [];
  for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) if (x + y <= 3) P.push([x, y]);
  const Q = P.filter(([x, y]) => 2 * x + y <= 4.5);
  assert.equal(P.length - Q.length, 1);
  assert.equal(affineRank(Q), 2);
  const face = (f, b) => affineRank(Q.filter((p) => f(p) === b));
  assert.equal(face(([x]) => x, 2), 0);
  assert.equal(face(([x, y]) => x + y, 3), 0);
  assert.equal(face(([x, y]) => 2 * x + y, 4.5), -1);
  assert.equal(face(([x, y]) => 2 * x + y, 4), 1);
  assert.equal(face(([, y]) => y, 2), 1);
});

test('20E exercises 13-14 as stated in t206c', () => {
  const fc = flowCover([7, 9, 5], 12, [0, 1]);
  assert.deepEqual([S(fc.lambda), S(fc.coef[0]), S(fc.coef[1])], ['4', '3', '5']);
  assert.equal(S(flowCoverLhs(fc, [0, 1], ['1', '1/2', '0'], ['7', '9/2', '0'])), '14');
  // the weaker line y1 + y2 <= 6 + 3(x1 + x2) is valid, the line 2 + 5(x1 + x2) is not
  const maxFlow = (x1, x2) => Math.min(7 * x1 + 9 * x2, 12);
  const states = [[0, 0], [1, 0], [0, 1], [1, 1]];
  assert.ok(states.every(([x1, x2]) => maxFlow(x1, x2) <= 6 + 3 * (x1 + x2)));
  assert.ok(!states.every(([x1, x2]) => maxFlow(x1, x2) <= 2 + 5 * (x1 + x2)));
  assert.equal(11.5 - (6 + 3 * 1.5), 1);
  assert.equal(S(flowCover([6, 6], 14, [0, 1]).lambda), '-2');
  assert.deepEqual(lotSizingCumulative([5, 8, 6], 12).map((r) => S(r.rhs)), ['1', '2', '2']);
  // the plan with no set-up in period 3
  const y = [7, 12, 0], s = [2, 6, 0], d = [5, 8, 6];
  let prev = 0;
  y.forEach((yt, t) => { assert.equal(prev + yt - s[t], d[t]); prev = s[t]; });
});

test('refresher t003 and bank m2d follow the content rules', () => {
  const l = getLesson('t003');
  assert.ok(l && l.sections.length >= 3 && l.moves.length >= 2 && l.traps.length >= 2 && l.refs.length >= 2);
  assert.ok(/beyond the slides/i.test(l.sections[0].html), 't003 must say it is a refresher beyond the slides');
  assert.ok(m2d.length >= 20, `only ${m2d.length} questions in m2d`);
  assert.ok(m2d.filter((q) => q.topic === 't003').length >= 4, 'at least 4 questions on t003');
  const positional = /\b(first|second|third|fourth|last) option\b|\boption [1-5a-d]\b|\boptions [1-5a-d]\b/i;
  m2d.filter((q) => q.type === 'mcq').forEach((q) => assert.ok(!positional.test(q.explain), `${q.id}: explanation refers to an option position`));
  ['t206a', 't206b', 't206c', 'tE201'].forEach((id) => assert.ok(getLesson(id).sections.length >= 3, id));
});
