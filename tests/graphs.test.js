// The well-solved-problem algorithms must reproduce every trace in slides 105, the solved exercises 10E and labs 105a-c.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dijkstra, reverseArcs, floydWarshall, kruskal, prim, countMinimumSpanningTrees,
  edmondsKarp, minCutBrute, cutCapacity, hungarian, assignmentBrute,
} from '../js/math/graphs.js';

const A = (list) => list.map(([u, v, w]) => ({ u, v, w }));
const C = (list) => list.map(([u, v, cap]) => ({ u, v, cap }));
const N6 = ['s', 'a', 'b', 'c', 'd', 't'];

test('Dijkstra: lecture 105 example', () => {
  const arcs = A([['s', 'a', 4], ['s', 'b', 2], ['b', 'a', 1], ['a', 'c', 4], ['b', 'c', 5], ['b', 'd', 7], ['c', 'd', 1], ['c', 't', 5], ['d', 't', 2]]);
  const r = dijkstra(N6, arcs, 's');
  assert.deepEqual(r.order, ['s', 'b', 'a', 'c', 'd', 't']);
  assert.deepEqual(r.dist, { s: 0, a: 3, b: 2, c: 7, d: 8, t: 10 });
  assert.deepEqual(r.pathTo('t'), ['s', 'b', 'c', 'd', 't']);
  assert.equal(r.pred.c, 'b'); // tie 3 + 4 = 7 does not change the predecessor
  assert.deepEqual(r.steps[1].dist, { s: 0, a: 3, b: 2, c: 7, d: 9, t: Infinity });
});

test('Dijkstra: exercise 1 and 1B (10E)', () => {
  const nodes = ['s', 'a', 'b', 'c', 'd', 't'];
  const arcs = A([['s', 'a', 4], ['s', 'b', 7], ['s', 'c', 2], ['c', 'b', 2], ['a', 'b', 1], ['a', 't', 8], ['b', 'd', 0], ['d', 't', 3], ['d', 'a', 1]]);
  const r = dijkstra(nodes, arcs, 's');
  assert.deepEqual(r.order, ['s', 'c', 'a', 'b', 'd', 't']);
  const row = (st) => ['a', 'b', 'c', 'd', 't'].map((v) => st.dist[v]);
  assert.deepEqual(r.steps.map(row), [
    [4, 7, 2, Infinity, Infinity],
    [4, 4, 2, Infinity, Infinity],
    [4, 4, 2, Infinity, 12],
    [4, 4, 2, 4, 12],
    [4, 4, 2, 4, 7],
    [4, 4, 2, 4, 7],
  ]);
  assert.deepEqual(r.pred, { s: null, a: 's', b: 'c', c: 's', d: 'b', t: 'd' });
  assert.deepEqual(r.pathTo('t'), ['s', 'c', 'b', 'd', 't']);
  // 1B: reversed graph from t; the tie-break list keeps alphabetical order with t first.
  const rb = dijkstra(['t', 'a', 'b', 'c', 'd', 's'], reverseArcs(arcs), 't');
  assert.deepEqual(rb.order, ['t', 'd', 'b', 'a', 'c', 's']);
  const rowB = (st) => ['s', 'a', 'b', 'c', 'd'].map((v) => st.dist[v]);
  assert.deepEqual(rb.steps.map(rowB), [
    [Infinity, 8, Infinity, Infinity, 3],
    [Infinity, 8, 3, Infinity, 3],
    [10, 4, 3, 5, 3],
    [8, 4, 3, 5, 3],
    [7, 4, 3, 5, 3],
    [7, 4, 3, 5, 3],
  ]);
  assert.deepEqual(rb.pathTo('s'), ['t', 'd', 'b', 'c', 's']);
});

test('Dijkstra agrees with Floyd-Warshall on random graphs', () => {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let k = 0; k < 200; k++) {
    const arcs = [];
    for (const u of N6) for (const v of N6) if (u !== v && rnd() < 0.35) arcs.push({ u, v, w: Math.floor(rnd() * 9) });
    const r = dijkstra(N6, arcs, 's');
    const fw = floydWarshall(N6, arcs);
    for (const v of N6) assert.equal(r.dist[v], fw.s[v]);
  }
});

test('Kruskal: lecture 105, exercise 2, exercise 2B, lab 105b', () => {
  const lec = kruskal(['a', 'b', 'c', 'd', 'e', 'f'], A([['a', 'b', 1], ['b', 'c', 2], ['a', 'c', 3], ['b', 'd', 4], ['d', 'e', 5], ['c', 'd', 6], ['e', 'f', 7], ['d', 'f', 8], ['c', 'e', 9]]));
  assert.deepEqual(lec.tree, ['ab', 'bc', 'bd', 'de', 'ef']);
  assert.equal(lec.weight, 19);
  assert.deepEqual(lec.trace.map((t) => [t.edge, t.accept]), [['ab', true], ['bc', true], ['ac', false], ['bd', true], ['de', true], ['cd', false], ['ef', true]]);
  assert.deepEqual(lec.trace[2].cycle, ['a', 'b', 'c', 'a']);
  assert.deepEqual(lec.trace[5].cycle, ['c', 'b', 'd', 'c']);
  assert.deepEqual(lec.unexamined, ['df', 'ce']);

  const ex2edges = A([['a', 'b', 1], ['a', 'c', 2], ['b', 'c', 2], ['b', 'd', 4], ['c', 'd', 3], ['c', 'e', 5], ['d', 'e', 3], ['a', 'e', 8]]);
  const ex2 = kruskal(['a', 'b', 'c', 'd', 'e'], ex2edges);
  assert.deepEqual(ex2.order, ['ab', 'ac', 'bc', 'cd', 'de', 'bd', 'ce', 'ae']);
  assert.deepEqual(ex2.tree, ['ab', 'ac', 'cd', 'de']);
  assert.equal(ex2.weight, 9);
  assert.deepEqual(ex2.trace.map((t) => t.weight), [1, 3, 3, 6, 9]);
  assert.deepEqual(ex2.trace[1].components, [['a', 'b', 'c'], ['d'], ['e']]);
  assert.equal(countMinimumSpanningTrees(['a', 'b', 'c', 'd', 'e'], ex2edges), 2); // swap ac for bc

  const n8 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const e2b = A([['a', 'b', 1], ['b', 'c', 5], ['c', 'd', 8], ['e', 'f', 2], ['f', 'g', 6], ['g', 'h', 9], ['a', 'e', 3], ['b', 'f', 4], ['c', 'g', 7], ['d', 'h', 10], ['b', 'g', 11], ['c', 'f', 12]]);
  const ex2b = kruskal(n8, e2b);
  assert.deepEqual(ex2b.order, ['ab', 'ef', 'ae', 'bf', 'bc', 'fg', 'cg', 'cd', 'gh', 'dh', 'bg', 'cf']);
  assert.deepEqual(ex2b.tree, ['ab', 'ef', 'ae', 'bc', 'fg', 'cd', 'gh']);
  assert.equal(ex2b.weight, 34);
  assert.deepEqual(ex2b.trace.filter((t) => !t.accept).map((t) => t.cycle), [['b', 'a', 'e', 'f', 'b'], ['c', 'b', 'a', 'e', 'f', 'g', 'c']]);
  assert.equal(countMinimumSpanningTrees(n8, e2b), 1);

  const labE = A([['a', 'b', 1], ['d', 'e', 2], ['e', 'f', 3], ['d', 'f', 4], ['b', 'c', 5], ['a', 'c', 6], ['b', 'd', 7], ['c', 'd', 8], ['c', 'e', 9]]);
  const lab = kruskal(['a', 'b', 'c', 'd', 'e', 'f'], labE);
  assert.deepEqual(lab.tree, ['ab', 'de', 'ef', 'bc', 'bd']);
  assert.equal(lab.weight, 18);
  const pr = prim(['a', 'b', 'c', 'd', 'e', 'f'], labE, 'a');
  assert.deepEqual(pr.tree, ['ab', 'bc', 'bd', 'de', 'ef']);
  assert.equal(pr.weight, 18);
});

test('Edmonds-Karp: lecture 105 unit network, exercise 3, exercise 3B, lab 105c', () => {
  const unit = C([['s', 'a', 1], ['s', 'b', 1], ['a', 'c', 1], ['a', 'd', 1], ['b', 'c', 1], ['c', 't', 1], ['d', 't', 1]]);
  const u = edmondsKarp(N6, unit, 's', 't');
  assert.deepEqual(u.augmentations.map((x) => x.path.join('')), ['sact', 'sbcadt']);
  assert.equal(u.value.toString(), '2');
  assert.deepEqual(u.S, ['s']);

  const ex3 = C([['s', 'a', 3], ['s', 'b', 2], ['a', 'c', 4], ['a', 'd', 2], ['b', 'c', 2], ['c', 't', 3], ['d', 't', 2]]);
  const r = edmondsKarp(N6, ex3, 's', 't');
  assert.deepEqual(r.augmentations.map((x) => [x.path.join(''), x.delta.toString()]), [['sact', '3'], ['sbcadt', '2']]);
  assert.deepEqual(r.augmentations[1].bfsOrder, ['s', 'b', 'c', 'a', 'd', 't']);
  assert.deepEqual(r.augmentations[1].steps.map((st) => st.residual.toString()), ['2', '2', '3', '2', '2']);
  assert.equal(r.augmentations[1].steps[2].kind, 'reverse');
  assert.deepEqual(r.flow.map(String), ['3', '2', '1', '2', '2', '3', '2']);
  assert.equal(r.value.toString(), '5');
  assert.deepEqual(r.S, ['s']);
  assert.equal(r.cutCapacity.toString(), '5');

  const ex3b = C([['s', 'a', 5], ['s', 'b', 4], ['a', 'c', 4], ['a', 'd', 2], ['c', 'd', 2], ['c', 't', 3], ['b', 'd', 4], ['d', 't', 5]]);
  const rb = edmondsKarp(N6, ex3b, 's', 't');
  assert.deepEqual(rb.augmentations.map((x) => [x.path.join(''), x.delta.toString()]), [['sact', '3'], ['sadt', '2'], ['sbdt', '3']]);
  assert.equal(rb.value.toString(), '8');
  assert.deepEqual(rb.S, ['s', 'a', 'b', 'c', 'd']);
  assert.equal(rb.cutCapacity.toString(), '8');

  const lab = C([['s', 'a', 2], ['s', 'b', 1], ['a', 'c', 3], ['a', 'd', 1], ['b', 'c', 1], ['c', 't', 2], ['d', 't', 1]]);
  const rl = edmondsKarp(N6, lab, 's', 't');
  assert.deepEqual(rl.augmentations.map((x) => [x.path.join(''), x.delta.toString()]), [['sact', '2'], ['sbcadt', '1']]);
  assert.deepEqual(rl.flow.map(String), ['2', '1', '1', '1', '1', '2', '1']);
  assert.equal(rl.value.toString(), '3');

  // slides 106: four-node network, max flow 5 = min cut; S = {s, a} is also a minimum cut
  const four = C([['s', 'a', 3], ['s', 'b', 2], ['a', 'b', 1], ['a', 't', 2], ['b', 't', 3]]);
  const r4 = edmondsKarp(['s', 'a', 'b', 't'], four, 's', 't');
  assert.equal(r4.value.toString(), '5');
  assert.equal(cutCapacity(four, ['s', 'a']).toString(), '5');
});

test('max flow equals brute-force min cut on random networks', () => {
  let seed = 99;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let k = 0; k < 200; k++) {
    const arcs = [];
    for (const u of N6) for (const v of N6) if (u !== v && v !== 's' && u !== 't' && rnd() < 0.4) arcs.push({ u, v, cap: 1 + Math.floor(rnd() * 6) });
    const r = edmondsKarp(N6, arcs, 's', 't');
    const mc = minCutBrute(N6, arcs, 's', 't');
    assert.equal(r.value.toString(), mc.capacity.toString());
    assert.equal(r.cutCapacity.toString(), r.value.toString());
  }
});

test('Hungarian: lecture 105 matrix, exercise 4, lab 105c', () => {
  const lec = hungarian([[4, 1, 3, 6], [2, 0, 5, 7], [3, 2, 2, 5], [5, 4, 1, 2]]);
  assert.deepEqual(lec.events[0].u, [1, 0, 2, 1]);
  assert.equal(lec.events[0].lb, 4);
  assert.deepEqual(lec.events[1].v, [1, 0, 0, 1]);
  assert.equal(lec.events[1].lb, 6);
  assert.deepEqual(lec.events[1].reduced, [[2, 0, 2, 4], [1, 0, 5, 6], [0, 0, 0, 2], [3, 3, 0, 0]]);
  const stall = lec.events.find((e) => e.type === 'stall');
  assert.deepEqual([stall.S, stall.T, stall.delta, stall.lb], [[0, 1], [1], 1, 7]);
  assert.deepEqual(stall.u, [2, 1, 2, 1]);
  assert.deepEqual(stall.v, [1, -1, 0, 1]);
  assert.deepEqual(stall.reduced, [[1, 0, 1, 3], [0, 0, 4, 5], [0, 1, 0, 2], [3, 4, 0, 0]]);
  assert.deepEqual(lec.jobOf, [1, 0, 2, 3]); // W1-J2, W2-J1, W3-J3, W4-J4
  assert.equal(lec.cost, 7);
  assert.equal(lec.lb, 7);

  const ex4 = hungarian([[2, 3, 6], [4, 1, 1], [3, 5, 8]]);
  assert.deepEqual(ex4.events[0].u, [2, 1, 3]);
  assert.deepEqual(ex4.events[1].v, [0, 0, 0]);
  assert.equal(ex4.events[1].lb, 6);
  const st4 = ex4.events.find((e) => e.type === 'stall');
  assert.deepEqual([st4.root, st4.S, st4.T, st4.delta, st4.lb], [2, [0, 2], [0], 1, 7]);
  assert.deepEqual(st4.u, [3, 1, 4]);
  assert.deepEqual(st4.v, [-1, 0, 0]);
  assert.deepEqual(st4.reduced, [[0, 0, 3], [4, 0, 0], [0, 1, 4]]);
  const aug = ex4.events[ex4.events.length - 1];
  assert.equal(aug.path.map((p) => p.kind + (p.index + 1)).join('-'), 'W3-J1-W1-J2-W2-J3');
  assert.deepEqual(ex4.jobOf, [1, 2, 0]);
  assert.equal(ex4.cost, 7);

  const lab = hungarian([[4, 1, 3, 6], [3, 2, 2, 5], [5, 4, 1, 2], [2, 0, 5, 7]]);
  assert.deepEqual(lab.events[0].u, [1, 2, 1, 0]);
  assert.deepEqual(lab.events[1].v, [1, 0, 0, 1]);
  const stl = lab.events.find((e) => e.type === 'stall');
  assert.deepEqual([stl.root, stl.S, stl.T, stl.delta, stl.lb], [3, [0, 3], [1], 1, 7]);
  assert.deepEqual(lab.jobOf, [1, 2, 3, 0]);
  assert.equal(lab.cost, 7);
});

test('Hungarian is optimal on random matrices and ends with a tight dual bound', () => {
  let seed = 4242;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let k = 0; k < 300; k++) {
    const n = 3 + (k % 3);
    const cost = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(rnd() * 10)));
    const r = hungarian(cost);
    assert.equal(r.cost, assignmentBrute(cost));
    assert.equal(r.lb, r.cost);
    assert.ok(r.reduced.every((row) => row.every((x) => x >= 0)));
  }
});
