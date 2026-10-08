// Knapsack DP, covers and lifting, Gomory tableaux, MIR, flow cover, lot sizing, TSP separation, TU and tangent cuts:
// every number below is taken from slides 105, 106, 201-206, E201 or the solved exercises 10E.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Frac, F } from '../js/math/frac.js';
import { solveLP } from '../js/math/lp.js';
import {
  knapsackDP, knapsackOneRow, knapsackAllOptima, knapsackLP, minimalCovers, extendedCover, coverSeparation,
  liftCoefficient, sequentialLifting, knapsackFace, isValidForKnapsack, isCover, isMinimalCover,
} from '../js/math/knapsack.js';
import {
  chvatalGomory, gomoryCuttingPlanes, mirCapacityCut, mirMixedRow, mirParameters, flowCover, flowCoverLhs,
  lotSizingCumulative, maxWeightClique, maximalCliques, scaleToIntegers,
} from '../js/math/cuts.js';
import { cyclesFromSuccessor, subtourRowCount, rowGeneration, tspBrute, separateSubtour, mtzRow, outflow, internal, solveMaster } from '../js/math/tsp.js';
import { isTotallyUnimodular, sufficientCondition, signPatternForCriterion, incidenceMatrix } from '../js/math/tu.js';
import { kelley, tangentCut, tangentPlane, diskCut, perspectiveCut } from '../js/math/convex.js';

const S = (v) => v.toString();
const row = (r) => r.coef.map(S).concat([S(r.rhs)]);

test('knapsack DP: lecture 105 table and reconstruction', () => {
  const r = knapsackDP([2, 3, 4, 5], [3, 5, 6, 8], 7);
  assert.deepEqual(r.F.slice(1), [
    [0, 0, 3, 3, 3, 3, 3, 3],
    [0, 0, 3, 5, 5, 8, 8, 8],
    [0, 0, 3, 5, 6, 8, 9, 11],
    [0, 0, 3, 5, 6, 8, 9, 11],
  ]);
  assert.equal(r.value, 11);
  assert.deepEqual(r.items, [2, 3]);
  assert.deepEqual(knapsackAllOptima([2, 3, 4, 5], [3, 5, 6, 8], 7).sets, [[1, 4], [2, 3]]);
  assert.deepEqual(knapsackOneRow([2, 3, 4, 5], [3, 5, 6, 8], 7).rows[3], [0, 0, 3, 5, 6, 8, 9, 11]);
  // ascending capacities reuse an item: weight 2, profit 3 gives D[4] = 6
  assert.equal(knapsackOneRow([2], [3], 4, true).rows[0][4], 6);
  assert.equal(knapsackOneRow([2], [3], 4, false).rows[0][4], 3);
});

test('knapsack DP: exercise 5 (10E)', () => {
  const r = knapsackDP([2, 3, 4, 5], [4, 5, 7, 9], 8);
  assert.deepEqual(r.F.slice(1), [
    [0, 0, 4, 4, 4, 4, 4, 4, 4],
    [0, 0, 4, 5, 5, 9, 9, 9, 9],
    [0, 0, 4, 5, 7, 9, 11, 12, 12],
    [0, 0, 4, 5, 7, 9, 11, 13, 14],
  ]);
  assert.equal(r.value, 14);
  assert.deepEqual(r.items, [2, 4]);
  assert.deepEqual(r.walk.map((w) => [w.i, w.c, w.take]), [[4, 8, true], [3, 3, false], [2, 3, true], [1, 0, false]]);
});

const ka = [4, 4, 4, 7], kc = [6, 6, 6, 10], kb = 10;

test('knapsack covers, extension, lifting, dominance and facets (slides 206)', () => {
  assert.equal(S(knapsackLP(ka, kc, kb).value), '15');
  assert.deepEqual(minimalCovers(ka, kb), [[0, 3], [1, 3], [2, 3], [0, 1, 2]]);
  assert.ok(isCover(ka, kb, [0, 1, 2, 3]) && !isMinimalCover(ka, kb, [0, 1, 2, 3]));
  assert.deepEqual(extendedCover(ka, [0, 1, 2]), [0, 1, 2, 3]);
  const sep = coverSeparation(ka, kb, ['0.5', 1, 1, 0]);
  assert.deepEqual(sep.cover, [0, 1, 2]);
  assert.equal(S(sep.value), '1/2');
  assert.ok(sep.violated);
  assert.equal(S(sep.lhs), '5/2');
  const lift = liftCoefficient(ka, kb, [1, 1, 1, 0], 2, 3);
  assert.equal(S(lift.alpha), '2');
  assert.deepEqual(sequentialLifting(ka, kb, [0, 1, 2], [3]).coef.map(S), ['1', '1', '1', '2']);
  assert.ok(isValidForKnapsack([1, 1, 1, 2], 2, ka, kb));
  assert.ok(!isValidForKnapsack([1, 1, 1, 3], 2, ka, kb));
  const base = knapsackFace([1, 1, 1, 0], 2, ka, kb);
  assert.deepEqual([base.tight.length, base.faceDim, base.hullDim, base.isFacet], [3, 2, 4, false]);
  const lifted = knapsackFace([1, 1, 1, 2], 2, ka, kb);
  assert.deepEqual([lifted.tight.length, lifted.faceDim, lifted.isFacet], [4, 3, true]);
  // LP bounds: all four minimal covers give 104/7; the lifted cover alone gives 12
  const bounds = [0, 1, 2, 3].map((j) => ({ a: [0, 1, 2, 3].map((q) => (q === j ? 1 : 0)), op: '<=', b: 1 }));
  const knap = { a: ka, op: '<=', b: kb };
  const cov = (set, rhs) => ({ a: [0, 1, 2, 3].map((q) => (set.includes(q) ? 1 : 0)), op: '<=', b: rhs });
  const all = solveLP({ sense: 'max', c: kc, rows: [knap, ...bounds, cov([0, 3], 1), cov([1, 3], 1), cov([2, 3], 1), cov([0, 1, 2], 2)] });
  assert.equal(S(all.obj), '104/7');
  const lif = solveLP({ sense: 'max', c: kc, rows: [knap, ...bounds, { a: [1, 1, 1, 2], op: '<=', b: 2 }] });
  assert.equal(S(lif.obj), '12');
});

test('Chvatal-Gomory rounding', () => {
  const cg = chvatalGomory([{ a: [-1, 1], b: '3.7' }, { a: [1, 1], b: '6.3' }], ['1/2', '1/2']);
  assert.deepEqual(cg.aggregated.a.map(S), ['0', '1']);
  assert.equal(S(cg.aggregated.b), '5');
  const one = chvatalGomory([{ a: [1, 1], b: '6.3' }], [1]);
  assert.deepEqual(one.cut.a.map(S).concat(S(one.cut.b)), ['1', '1', '6']);
  const neg = chvatalGomory([{ a: ['-1/2', '3/2'], b: '7/2' }], [1]);
  assert.deepEqual(neg.cut.a.map(S).concat(S(neg.cut.b)), ['-1', '1', '3']);
});

test('Gomory cuts: first example of slides 204 (tableaux and both cuts)', () => {
  const g = gomoryCuttingPlanes({ c: [4, -1], names: ['x1', 'x2'], rows: [{ a: [7, -2], op: '<=', b: 14 }, { a: [0, 1], op: '<=', b: 3 }, { a: [2, -2], op: '<=', b: 3 }] });
  assert.equal(g.status, 'integral');
  assert.equal(g.rounds.length, 2);
  const t0 = g.rounds[0].lp.tableau;
  assert.deepEqual(t0.rows.map((r) => r.name), ['x1', 'x2', 's3']);
  assert.deepEqual(t0.rows.map(row), [
    ['1', '0', '1/7', '2/7', '0', '20/7'],
    ['0', '1', '0', '1', '0', '3'],
    ['0', '0', '-2/7', '10/7', '1', '23/7'],
  ]);
  assert.deepEqual(row(t0.zrow), ['0', '0', '4/7', '1/7', '0', '59/7']);
  assert.equal(g.rounds[0].rowIndex, 0);
  assert.deepEqual(g.rounds[0].cut.a.map(S).concat(S(g.rounds[0].cut.b)), ['1', '0', '2']); // x1 <= 2
  const t1 = g.rounds[1].lp.tableau;
  assert.deepEqual(t1.rows.map((r) => r.name), ['x1', 'x2', 's1', 's2']);
  assert.deepEqual(t1.rows.map(row), [
    ['1', '0', '0', '0', '0', '1', '2'],
    ['0', '1', '0', '0', '-1/2', '1', '1/2'],
    ['0', '0', '1', '0', '-1', '-5', '1'],
    ['0', '0', '0', '1', '1/2', '-1', '5/2'],
  ]);
  assert.deepEqual(row(t1.zrow), ['0', '0', '0', '0', '1/2', '3', '15/2']);
  assert.deepEqual(g.rounds[1].tableauCut.coef.map(S).concat(S(g.rounds[1].tableauCut.rhs)), ['0', '1', '0', '0', '-1', '1', '0']); // x2 - s3 + s4 <= 0
  assert.deepEqual(g.rounds[1].cut.a.map(S).concat(S(g.rounds[1].cut.b)), ['1', '-1', '1']); // x1 - x2 <= 1
  const tf = g.final.tableau;
  assert.deepEqual(g.final.x.map(S), ['2', '1']);
  assert.equal(S(g.final.obj), '7');
  assert.deepEqual(tf.rows.map(row), [
    ['1', '0', '0', '0', '0', '1', '0', '2'],
    ['0', '1', '0', '0', '0', '1', '-1', '1'],
    ['0', '0', '1', '0', '0', '-5', '-2', '2'],
    ['0', '0', '0', '1', '0', '-1', '1', '2'],
    ['0', '0', '0', '0', '1', '0', '-2', '1'],
  ]);
  assert.deepEqual(row(tf.zrow), ['0', '0', '0', '0', '0', '3', '1', '7']);
});

test('Gomory cuts: workshop example of slides 204 (three cuts)', () => {
  const r2 = scaleToIntegers([-1, 1], '3.7');
  const r3 = scaleToIntegers([1, 1], '6.3');
  assert.deepEqual(r2.a.map(S).concat(S(r2.b)), ['-10', '10', '37']);
  const g = gomoryCuttingPlanes({ c: [1, 10], names: ['x', 'y'], rows: [{ a: [1, 0], op: '<=', b: 3 }, { a: r2.a, op: '<=', b: r2.b }, { a: r3.a, op: '<=', b: r3.b }] });
  assert.equal(g.status, 'integral');
  assert.equal(g.rounds.length, 3);
  assert.deepEqual(g.rounds[0].lp.tableau.rows.map(row), [
    ['1', '0', '0', '-1/20', '1/20', '13/10'],
    ['0', '1', '0', '1/20', '1/20', '5'],
    ['0', '0', '1', '1/20', '-1/20', '17/10'],
  ]);
  assert.deepEqual(row(g.rounds[0].lp.tableau.zrow), ['0', '0', '0', '9/20', '11/20', '513/10']);
  assert.deepEqual(g.rounds.map((r) => r.lp.tableau.rows[r.rowIndex].name), ['x', 'y', 'x']);
  assert.deepEqual(g.rounds.map((r) => r.cut.a.map(S).concat(S(r.cut.b))), [['-9', '10', '38'], ['0', '1', '4'], ['1', '1', '6']]);
  assert.deepEqual(g.rounds.map((r) => r.lp.x.map(S)), [['13/10', '5'], ['25/19', '947/190'], ['23/10', '4']]);
  assert.deepEqual(g.rounds.map((r) => S(r.lp.obj)), ['513/10', '972/19', '423/10']);
  assert.deepEqual(g.rounds[1].lp.tableau.rows.map(row), [
    ['1', '0', '0', '0', '1/19', '-1/19', '25/19'],
    ['0', '1', '0', '0', '9/190', '1/19', '947/190'],
    ['0', '0', '1', '0', '-1/19', '1/19', '32/19'],
    ['0', '0', '0', '1', '1/19', '-20/19', '6/19'],
  ]);
  assert.deepEqual(g.rounds[2].lp.tableau.rows.map(row), [
    ['1', '0', '0', '0', '1/10', '0', '-1', '23/10'],
    ['0', '1', '0', '0', '0', '0', '1', '4'],
    ['0', '0', '1', '0', '-1/10', '0', '1', '7/10'],
    ['0', '0', '0', '1', '1', '0', '-20', '20'],
    ['0', '0', '0', '0', '9/10', '1', '-19', '187/10'],
  ]);
  assert.deepEqual(g.final.x.map(S), ['2', '4']);
  assert.deepEqual(g.final.tableau.rows.map(row), [
    ['1', '0', '0', '0', '0', '0', '-1', '1', '2'],
    ['0', '1', '0', '0', '0', '0', '1', '0', '4'],
    ['0', '0', '1', '0', '0', '0', '1', '-1', '1'],
    ['0', '0', '0', '1', '0', '0', '-20', '10', '17'],
    ['0', '0', '0', '0', '1', '0', '0', '-10', '3'],
    ['0', '0', '0', '0', '0', '1', '-19', '9', '16'],
  ]);
  assert.deepEqual(row(g.final.tableau.zrow), ['0', '0', '0', '0', '0', '0', '9', '1', '42']);
});

test('Gomory cuts are valid and cut off the LP point on random pure-integer programs', () => {
  let seed = 31337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  let withCuts = 0;
  for (let k = 0; k < 120; k++) {
    const rows = [{ a: [ri(1, 9), ri(-3, 9)], op: '<=', b: ri(8, 40) }, { a: [ri(-3, 9), ri(1, 9)], op: '<=', b: ri(8, 40) }, { a: [1, 0], op: '<=', b: 8 }, { a: [0, 1], op: '<=', b: 8 }];
    const c = [ri(1, 9), ri(1, 9)];
    const g = gomoryCuttingPlanes({ c, rows }, 25);
    let best = -Infinity;
    const pts = [];
    for (let x = 0; x <= 8; x++) for (let y = 0; y <= 8; y++) if (rows.every((r) => r.a[0] * x + r.a[1] * y <= r.b)) { pts.push([x, y]); best = Math.max(best, c[0] * x + c[1] * y); }
    for (const rd of g.rounds) {
      withCuts++;
      for (const [x, y] of pts) assert.ok(rd.cut.a[0].mul(F(x)).add(rd.cut.a[1].mul(F(y))).le(rd.cut.b), 'cut must keep every integer point');
      const lhs = rd.cut.a[0].mul(rd.lp.x[0]).add(rd.cut.a[1].mul(rd.lp.x[1]));
      assert.ok(lhs.gt(rd.cut.b), 'cut must remove the LP optimum');
    }
    if (g.status === 'integral') assert.equal(g.final.obj.toNumber(), best);
  }
  assert.ok(withCuts > 50);
});

test('MIR, flow cover, lot sizing, clique (slides 205-206)', () => {
  const m = mirCapacityCut(10, 14);
  assert.deepEqual([S(m.k), S(m.f), S(m.slope), S(m.intercept)], ['1', '2/5', '4', '6']); // y <= 6 + 4x
  const p = mirParameters('-2.5');
  assert.deepEqual([S(p.k), S(p.f)], ['-3', '1/2']);
  const mx = mirMixedRow([1, 1], 1, '2.5');
  assert.deepEqual([S(mx.contCoef), S(mx.rhs)], ['-2', '2']); // x + y - 2z <= 2
  assert.equal(mirCapacityCut(5, 10).applicable, false);

  const fc = flowCover([6, 6], 10, [0, 1]);
  assert.deepEqual([S(fc.lambda), S(fc.coef[0]), S(fc.coef[1]), S(fc.rhsCollected)], ['2', '4', '4', '2']);
  assert.equal(S(flowCoverLhs(fc, [0, 1], ['5/6', '5/6'], [5, 5])), '34/3');
  assert.equal(flowCover([3, 4], 10, [0, 1]).valid, false);
  const fc2 = flowCover([7, 2, 5], 10, [0, 1, 2]); // lambda = 4 -> coefficients (3, 0, 1)
  assert.deepEqual([S(fc2.lambda), S(fc2.coef[0]), S(fc2.coef[1]), S(fc2.coef[2])], ['4', '3', '0', '1']);

  assert.deepEqual(lotSizingCumulative([6, 6], 10).map((r) => S(r.rhs)), ['1', '2']);
  assert.deepEqual(lotSizingCumulative([4, 9, 3, 15], 10).map((r) => S(r.rhs)), ['1', '2', '2', '4']);

  const cl = maxWeightClique(4, [[0, 1], [0, 2], [1, 2]], ['1/2', '1/2', '1/2', 1]);
  assert.deepEqual(cl.clique, [0, 1, 2]);
  assert.equal(S(cl.weight), '3/2');
  assert.deepEqual(maximalCliques(4, [[0, 1], [0, 2], [1, 2]]), [[0, 1, 2], [3]]);
});

test('TSP: cycles, row counts, row generation, fractional separation, MTZ rows', () => {
  assert.deepEqual(cyclesFromSuccessor([0, 2, 3, 1, 5, 6, 4]), [[1, 2, 3], [4, 5, 6]]);
  assert.deepEqual([6, 10, 15, 20, 25, 30].map(subtourRowCount), [56, 1012, 32751, 1048554, 33554405, 1073741792]);
  let seed = 2024;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let k = 0; k < 25; k++) {
    const n = 6;
    const cost = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (i !== j) cost[i][j] = 1 + Math.floor(rnd() * 20);
    const rg = rowGeneration(cost);
    assert.equal(rg.status, 'optimal');
    assert.equal(rg.cost, tspBrute(cost).cost);
    for (let h = 1; h < rg.history.length; h++) assert.ok(rg.history[h].objective >= rg.history[h - 1].objective);
    // each added row is violated by the solution that produced it
    rg.history.forEach((h) => { if (h.added) { const inS = new Set(h.added); assert.equal(h.added.filter((i) => inS.has(h.succ[i])).length, h.added.length); } });
  }
  // fractional point on 4 vertices: S = {1, 2} has outgoing weight 1/2
  const x = Array.from({ length: 5 }, () => new Array(5).fill(0));
  x[1][2] = '3/4'; x[2][1] = '3/4'; x[1][3] = '1/4'; x[3][1] = '1/4'; x[3][4] = '3/4'; x[4][3] = '3/4'; x[2][4] = '1/4'; x[4][2] = '1/4';
  assert.equal(S(outflow(x, [1, 2], 4)), '1/2');
  assert.equal(S(internal(x, [1, 2])), '3/2');
  const sep = separateSubtour(x, 4, 1);
  assert.ok(sep.violated);
  assert.equal(S(sep.best.capacity), '1/2');
  assert.deepEqual(sep.best.S, [1, 2]);
  assert.equal(S(sep.violation), '1/2');
  // MTZ rows of slides 201 (n = 10): fractional arcs with x = 2/9 let positions decrease
  assert.deepEqual([S(mtzRow(10, 3, 2, '2/9').lhs), mtzRow(10, 3, 2, '2/9').ok], ['3', true]);
  assert.deepEqual([S(mtzRow(10, 2, 3, 1).lhs), mtzRow(10, 2, 3, 1).ok], ['8', true]);
  assert.equal(mtzRow(10, 3, 2, 1).ok, false);
  // master with a subtour row forbids the 2-cycle
  const c3 = [[0, 0, 0, 0, 0], [0, 0, 1, 9, 9], [0, 1, 0, 9, 9], [0, 9, 9, 0, 1], [0, 9, 9, 1, 0]];
  assert.deepEqual(cyclesFromSuccessor(solveMaster(c3).succ), [[1, 2], [3, 4]]);
  assert.equal(cyclesFromSuccessor(solveMaster(c3, [[1, 2]]).succ).length, 1);
});

test('total unimodularity (slides 106)', () => {
  assert.equal(isTotallyUnimodular([[1, 1, 0], [1, 0, 1], [0, 1, 1]]).tu, false);
  assert.equal(S(isTotallyUnimodular([[1, 1, 0], [1, 0, 1], [0, 1, 1]]).witness.det.abs()), '2');
  const nodes = ['s', 'a', 'b', 't'];
  const arcs = [['s', 'a'], ['s', 'b'], ['a', 'b'], ['a', 't'], ['b', 't']].map(([u, v]) => ({ u, v }));
  const inc = incidenceMatrix(nodes, arcs);
  assert.deepEqual(inc, [[1, 1, 0, 0, 0], [-1, 0, 1, 1, 0], [0, -1, -1, 0, 1], [0, 0, 0, -1, -1]]);
  assert.ok(sufficientCondition(inc).holds);
  assert.ok(isTotallyUnimodular(inc).tu);
  const assign = [[1, 1, 0, 0], [0, 0, 1, 1], [1, 0, 1, 0], [0, 1, 0, 1]];
  assert.ok(isTotallyUnimodular(assign).tu);
  assert.equal(sufficientCondition(assign).holds, false);
  assert.deepEqual(signPatternForCriterion(assign).negate, [0, 1]);
  assert.equal(sufficientCondition([[1, 2], [0, 1]]).holds, false);
  assert.equal(isTotallyUnimodular([[1, 1], [-1, 1]]).tu, false);
});

test('tangent cuts and perspective cuts (slides E201)', () => {
  const f = { q: 1, c: '1.3', d: 0 };
  const k = kelley(f, 0, 2, [0, 1, 2], 3);
  assert.deepEqual(k.initialCuts.map((c) => [c.slope.toDecimal(4), c.intercept.toDecimal(4)]), [['-2.6', '1.69'], ['-0.6', '0.69'], ['1.4', '-2.31']]);
  assert.deepEqual(k.records.map((r) => r.x.toDecimal(6)), ['1.5', '1.25', '1.375', '1.3125']);
  assert.deepEqual(k.records.map((r) => r.L.toDecimal(8)), ['-0.21', '-0.06', '-0.01', '-0.00375']);
  assert.deepEqual(k.records.map((r) => r.U.toDecimal(8)), ['0.04', '0.0025', '0.0025', '0.00015625']);
  assert.deepEqual(k.records.map((r) => r.gap.toDecimal(8)), ['0.25', '0.0625', '0.0125', '0.00390625']);
  assert.deepEqual(k.records.map((r) => r.violation.toDecimal(8)), ['0.25', '0.0625', '0.015625', '0.00390625']);
  assert.deepEqual(k.records.slice(0, 3).map((r) => [r.newCut.slope.toDecimal(6), r.newCut.intercept.toDecimal(6)]), [['0.4', '-0.56'], ['-0.1', '0.1275'], ['0.15', '-0.200625']]);
  const tc = tangentCut(f, 1);
  assert.deepEqual([tc.slope.toDecimal(4), tc.intercept.toDecimal(4)], ['-0.6', '0.69']);
  const tp = tangentPlane(1, 2, 1, 2);
  assert.deepEqual([S(tp.cx), S(tp.cy), S(tp.c0), S(tp.value)], ['2', '8', '-9', '9']);
  const dc = diskCut(1, 1, 1);
  assert.deepEqual([S(dc.c1), S(dc.c2), S(dc.rhs)], ['2', '2', '3']); // x1 + x2 <= 1.5
  const pc = perspectiveCut(1, 2, '0.5');
  assert.deepEqual([S(pc.a), S(pc.required), S(pc.original), S(pc.cx), S(pc.cz), S(pc.rhsAtPoint)], ['4', '8', '4', '8', '-16', '8']);
  const ex = perspectiveCut(3, 1, '0.25');
  assert.deepEqual([S(ex.a), S(ex.required), S(ex.cx), S(ex.cz), S(ex.rhsAtPoint)], ['4', '12', '24', '-48', '12']);
  assert.ok(Frac.of(1));
});
