// Trainers of Module 1 and of the TSP decks (branch and bound, gaps, big-M, fixed charge, TU, cuts, Dijkstra,
// Kruskal, Edmonds–Karp, Hungarian, knapsack DP, subtour rows, row generation, fractional separation, MTZ):
// every new preset reproduces the instructor's numbers (slides 102–106, 201–203, extra slides 202, sheets 10E
// and 20E), every answer key is accepted by its own grader, and every rendered string passes the KaTeX/HTML check.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, installStubDom } from './helpers.js';

installStubDom();
const { bbDrill, gapsDrill } = await import('../js/drills/bb.js');
const { bigMDrill, fixedChargeDrill } = await import('../js/drills/formulations.js');
const { tuDrill, cutDrill } = await import('../js/drills/tu.js');
const { subtourDrill, mtzDrill, rowGenDrill, fracSepDrill } = await import('../js/drills/tsp.js');
const { kruskalDrill } = await import('../js/drills/kruskal.js');
const dijkstraDrill = (await import('../js/drills/dijkstra.js')).default;
const maxflowDrill = (await import('../js/drills/maxflow.js')).default;
const hungarianDrill = (await import('../js/drills/hungarian.js')).default;
const knapsackDrill = (await import('../js/drills/knapsackdp.js')).default;
const { gradeField } = await import('../js/grade.js');
const { makeRng } = await import('../js/util.js');
const { Frac } = await import('../js/math/frac.js');
const { hungarian } = await import('../js/math/graphs.js');
const { branchAndBound } = await import('../js/math/bb.js');
const { cyclesFromSuccessor, degreeCheck } = await import('../js/math/tsp.js');

const MINE = [bbDrill, gapsDrill, bigMDrill, fixedChargeDrill, tuDrill, cutDrill, subtourDrill, mtzDrill, rowGenDrill, fracSepDrill, kruskalDrill, dijkstraDrill, maxflowDrill, hungarianDrill, knapsackDrill];

// ---------------------------------------------------------------- helpers
const numText = (a) => (a === Infinity ? 'inf' : a instanceof Frac ? a.toString() : String(a));
function canonical(def) {
  switch (def.type) {
    case 'num': case 'int': return numText(def.answer);
    case 'choice': return String(def.answer);
    case 'multi': return def.answer.map(String);
    case 'set': return def.answer.length ? def.answer.join(', ') : 'none';
    case 'seq': return def.answer.join(' ');
    case 'ineq': case 'expr': return def.answerText;
    case 'grid': return def.answer.map((r) => r.map((v) => (v === null || v === undefined ? '' : numText(v))));
    case 'table': return def.rows.map((row) => Object.fromEntries(def.columns.filter((c) => c.kind !== 'given' && row.cells[c.key] !== null && row.cells[c.key] !== undefined).map((c) => {
      const a = row.cells[c.key];
      return [c.key, a === '—' ? '-' : c.kind === 'num' ? numText(a) : Array.isArray(a) ? a.join(' ') : String(a)];
    })));
    default: throw new Error(`unexpected field type ${def.type}`);
  }
}
const render = (x) => (typeof x === 'function' ? x() : x);
function textOf(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  return [node._html || '', node._text || ''].concat((node.children || []).map(textOf)).join(' ');
}
function walk(node, where) {
  if (!node) return;
  if (typeof node === 'string') { checkHtml(node, where); return; }
  if (node._html) checkHtml(node._html, where);
  (node.children || []).forEach((c) => walk(c, where));
}
function checkBuilt(drill, built, tag) {
  assert.equal(built.id, drill.id, `${tag}: id`);
  walk(render(built.statement), `${tag} statement`);
  checkHtml(built.rules, `${tag} rules`);
  checkHtml(built.wrapup, `${tag} wrapup`);
  built.steps.forEach((st, i) => {
    const w = `${tag} step ${i + 1} (${st.title})`;
    walk(render(st.text), `${w} text`);
    walk(render(st.explain), `${w} explain`);
    (st.fields || []).forEach((def, k) => {
      checkHtml(def.label, `${w} field ${k + 1}`);
      (def.options || []).forEach((o) => checkHtml(String(o.label), `${w} field ${k + 1} option`));
      if (def.type === 'ineq') assert.equal(typeof def.answerText, 'string', `${w}: ineq needs answerText`);
      const res = gradeField(def, canonical(def));
      assert.ok(res.ok, `${w} field ${k + 1} (${def.label}): answer key rejected (${res.msg})`);
    });
  });
}
const build = (drill, presetId) => {
  const p = drill.presets.find((x) => x.id === presetId);
  assert.ok(p, `${drill.id} has no preset ${presetId}`);
  return drill.build(p.make());
};
const stepOf = (b, re) => { const s = b.steps.find((x) => re.test(x.title)); assert.ok(s, `no step matching ${re}`); return s; };
const fieldOf = (b, re) => {
  for (const s of b.steps) for (const f of s.fields || []) if (re.test(f.label)) return f;
  assert.fail(`no field matching ${re}`);
};
const eqNum = (got, want, msg) => assert.ok(Frac.of(got).eq(Frac.of(want)), `${msg}: got ${numText(got)}, want ${want}`);
const cells = (f) => Object.fromEntries(Object.entries(f.rows[0].cells).map(([k, v]) => [k, numText(v)]));

// ---------------------------------------------------------------- every preset and many random instances
test('trainers-a: every preset and 60 random instances pass the strict HTML/KaTeX check and grade their own keys', () => {
  for (const d of MINE) {
    d.presets.forEach((p) => checkBuilt(d, d.build(p.make()), `${d.id}/${p.id}`));
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 20; seed++) {
      checkBuilt(d, d.build(d.random(makeRng(seed * 104729 + level), level)), `${d.id}/L${level}/s${seed}`);
    }
  }
});

test('exercise-page preset ids of sheet 20E exist (subtours 20e3; mtz 20e1; fracsep 20e2)', () => {
  assert.ok(subtourDrill.presets.some((p) => p.id === '20e3'));
  assert.equal(subtourDrill.presets.find((p) => p.id === '20e3').label, 'Sheet 20E, Exercise 3');
  assert.ok(mtzDrill.presets.some((p) => p.id === '20e1'));
  assert.ok(fracSepDrill.presets.some((p) => p.id === '20e2'));
});

// ---------------------------------------------------------------- slides 102 / 103 / 104: branch and bound
test('bb2d workshop (slides 102): unambiguous conclusion counts 9 / 2 / 2 / 1 and UB/LB node labels', () => {
  const b = build(bbDrill, 'workshop');
  eqNum(fieldOf(b, /Nodes in the tree/).answer, 9, 'nodes');
  eqNum(fieldOf(b, /closed by infeasibility/).answer, 2, 'infeasible');
  eqNum(fieldOf(b, /whose LP optimum is integer/).answer, 2, 'integer leaves (nodes 3 and 7)');
  eqNum(fieldOf(b, /Fractional.*closed by bound/).answer, 1, 'fractional leaves closed by bound (node 8)');
  const txt = textOf(render(b.steps[b.steps.length - 1].explain));
  assert.match(txt, /UB 51\.3/);
  assert.match(txt, /LB 42/);
  assert.match(txt, /node 3\) passes both the integrality test and the bound test/);
  assert.match(textOf(render(stepOf(b, /Process node 1/).explain)), /bound test would also close it/);
});

test('bb2d separate example (slides 102): the root LP optimum (2,4) is integer, z* = 42, no branching', () => {
  const b = build(bbDrill, 'separate');
  assert.equal(b.steps.length, 2);
  eqNum(fieldOf(b, /LP optimum: \$x\$/).answer, 2, 'x');
  eqNum(fieldOf(b, /LP optimum: \$y\$/).answer, 4, 'y');
  eqNum(fieldOf(b, /Dual bound from the root/).answer, 42, 'z_D');
  assert.equal(fieldOf(b, /Do we need to branch/).answer, 'no');
  eqNum(fieldOf(b, /Optimal value/).answer, 42, 'z*');
  eqNum(fieldOf(b, /Nodes in the tree/).answer, 1, 'nodes');
});

test('bb2d surrogate example (slides 103): original z* = 8 at (2,1); surrogate u = (1,1) gives 9 at (3,0)', () => {
  const o = build(bbDrill, 'surrogate-orig');
  eqNum(fieldOf(o, /Dual bound from the root/).answer, '25/3', 'original LP');
  eqNum(fieldOf(o, /Optimal value/).answer, 8, 'z*');
  eqNum(fieldOf(o, /Optimal \$x\$/).answer, 2, 'x*');
  eqNum(fieldOf(o, /Optimal \$y\$/).answer, 1, 'y*');
  eqNum(fieldOf(o, /Nodes in the tree/).answer, 3, 'nodes');
  const s = build(bbDrill, 'surrogate-relaxed');
  eqNum(fieldOf(s, /Dual bound from the root/).answer, 10, 'surrogate LP');
  eqNum(fieldOf(s, /Optimal value/).answer, 9, 'z_R');
  eqNum(fieldOf(s, /Optimal \$x\$/).answer, 3, 'x');
  eqNum(fieldOf(s, /Optimal \$y\$/).answer, 0, 'y');
  eqNum(fieldOf(s, /Nodes in the tree/).answer, 5, 'nodes');
  eqNum(fieldOf(s, /Fractional.*closed by bound/).answer, 1, 'node (7/3, 1) = 9 closed by bound');
  // not listed under t103: there the surrogate trainer stays the first trainer of the relaxations lesson
  assert.ok(!(bbDrill.topics || []).includes('t103'));
});

test('math/bb: when both children improve the incumbent in turn, the log names the second one', () => {
  const r = branchAndBound({ sense: 'max', c: [3, 2], rows: [{ a: [2, 1], op: '<=', b: Frac.of(5) }, { a: [1, 2], op: '<=', b: Frac.of(5) }], names: ['x', 'y'] });
  const row = r.log.find((L) => L.action === 'incumbent');
  assert.equal(row.node, 2);
  eqNum(row.local, 8, 'local bound of the incumbent row');
  assert.deepEqual(row.closed, [1]);
});

test('bb2d slides 104 presets: 5 nodes each, with the branching-rule note', () => {
  for (const id of ['plus-xy6', 'plus-yx3']) {
    const b = build(bbDrill, id);
    eqNum(fieldOf(b, /Nodes in the tree/).answer, 5, id);
    assert.match(textOf(render(b.statement)), /do not state a branching rule/);
  }
});

test('gaps: faithful preset reproduces log rows 1 to 2 (17.07%, then 9.76%); the old one is labelled hypothetical', () => {
  assert.equal(gapsDrill.presets[0].id, 'log-rows-1-2');
  const b = build(gapsDrill, 'log-rows-1-2');
  const s1 = b.steps[0];
  eqNum(s1.fields.find((f) => /Global dual bound/.test(f.label)).answer, 48, 'z_D row 1');
  eqNum(s1.fields.find((f) => /Relative gap in/.test(f.label)).answer, '700/41', 'gap row 1');
  const s3 = b.steps[2];
  assert.equal(s3.fields[0].answer, 'no');
  eqNum(s3.fields[1].answer, 41, 'incumbent stays 41');
  eqNum(s3.fields[2].answer, 45, 'z_D row 2');
  eqNum(s3.fields[3].answer, '400/41', 'gap row 2');
  assert.ok(Math.abs(Frac.of(b.steps[3].fields[0].answer).toNumber() - 22.14) < 0.01, 'root gap 22.1% (slides 104)');
  assert.match(gapsDrill.presets.find((p) => p.id === 'slides').label, /hypothetical/);
});

// ---------------------------------------------------------------- slides 104: big-M and fixed charge
test('bigm exclusive2 (slides 104): M2* = 5, x2 + 5z <= 5, z = 0 with M = 5 and 1/2 with M = 10 (alpha = 2)', () => {
  const b = build(bigMDrill, 'exclusive2');
  eqNum(fieldOf(b, /M\^\*=/).answer, 5, 'M*');
  assert.equal(fieldOf(b, /Big-M constraint/).answerText, 'x2 + 5z <= 5');
  eqNum(fieldOf(b, /Largest \$z\$ with \$M=M\^\*/).answer, 0, 'z, tight M');
  eqNum(fieldOf(b, /loose \$M=10\$/).answer, '1/2', 'z, M = 10');
});

test('fixedcharge slides: the cut is asked as q + t <= c0 + c1 y (no clash with the slides\' alpha); alpha = 2 gives y = 1/6', () => {
  const b = build(fixedChargeDrill, 'slides');
  const cut = fieldOf(b, /Inequality \$q\+t/);
  assert.match(cut.label, /c_0\+c_1 y/);
  assert.doesNotMatch(cut.label, /alpha|beta/);
  assert.equal(cut.answerText, 'q + t - 2y <= 4');
  eqNum(fieldOf(b, /looser constant/).answer, '1/6', 'smallest y at alpha = 2');
  eqNum(fieldOf(b, /Right-hand side \$My\$/).answer, 2, 'My at (2, 3, 1/3)');
});

// ---------------------------------------------------------------- slides 106
test('tu flow preset: exactly the inflow-minus-outflow table of slides 106', () => {
  const inst = tuDrill.presets.find((p) => p.id === 'flow').make();
  assert.deepEqual(inst.M, [[-1, -1, 0, 0, 0], [1, 0, -1, -1, 0], [0, 1, 1, 0, -1], [0, 0, 0, 1, 1]]);
  assert.match(inst.note, /inflow-minus-outflow/);
  const b = tuDrill.build(inst);
  assert.equal(fieldOf(b, /criterion apply/).answer, 'yes');
});

test('cutcheck: the network-matrix remark is labelled as beyond the slides', () => {
  const b = build(cutDrill, 'slides');
  assert.match(b.wrapup, /Beyond the slides/);
  assert.match(textOf(render(b.steps[3].explain)), /Beyond the slides/);
});

// ---------------------------------------------------------------- sheet 10E
test('kruskal (10E ex. 2 and 2B): the rejected-edge cycle is accepted in the instructor\'s spelling', () => {
  const b = build(kruskalDrill, 'ex2');
  const f = fieldOf(b, /Cycle closed by bc/);
  for (const s of ['a, b, c, a', 'b, a, c, b', 'a b c', 'abca', 'c, a, b, c']) assert.ok(gradeField(f, s).ok, s);
  assert.ok(!gradeField(f, 'a, b, d, a').ok);
  const b2 = build(kruskalDrill, 'ex2b');
  assert.ok(gradeField(fieldOf(b2, /Cycle closed by bf/), 'b, a, e, f, b').ok);
  assert.ok(gradeField(fieldOf(b2, /Cycle closed by cg/), 'c, b, a, e, f, g, c').ok);
  assert.match(textOf(render(stepOf(b, /tree and its uniqueness/).explain)), /Orange dashed: edges rejected/);
});

test('maxflow (10E ex. 3 and 3B): residual capacities along each BFS path', () => {
  const res = (id) => build(maxflowDrill, id).steps.filter((s) => /Augmenting path/.test(s.title)).map((s) => s.fields.find((f) => /Residual capacities/.test(f.label)).answer.join(','));
  assert.deepEqual(res('ex3'), ['3,4,3', '2,2,3,2,2']);
  assert.deepEqual(res('ex3b'), ['5,4,3', '2,2,5', '4,4,3']);
  const f = build(maxflowDrill, 'ex3').steps[0].fields.find((x) => /Residual capacities/.test(x.label));
  assert.ok(gradeField(f, '3, 4.0, 3').ok);
  assert.ok(!gradeField(f, '3, 3, 4').ok);
});

test('hungarian (10E ex. 4): the stalled search is resumed, keeping S and T', () => {
  const b = build(hungarianDrill, 'ex4');
  const st = stepOf(b, /stalls/);
  assert.deepEqual(st.fields[0].answer, ['w1', 'w3']);
  assert.deepEqual(st.fields[1].answer, ['j1']);
  eqNum(st.fields[2].answer, 1, 'Delta');
  const aug = stepOf(b, /Resumed search from W3 reaches a free job/);
  assert.deepEqual(aug.fields[0].answer, ['w3', 'j1', 'w1', 'j2', 'w2', 'j3']);
  assert.match(b.rules, /resume/);
  // a matrix where resuming and restarting differ (audit H): resume gives W1J2, W2J1, W3J3
  const r = hungarian([[4, 3, 0], [1, 2, 3], [2, 4, 0]]);
  assert.deepEqual(r.jobOf, [1, 0, 2]);
  assert.equal(r.cost, 4);
});

test('dijkstra caption and knapsack walk-back use the solved exercises\' words', () => {
  const d = build(dijkstraDrill, 'ex1');
  assert.match(textOf(render(d.steps[0].explain)), /Orange: current vertex and examined arcs/);
  const k = build(knapsackDrill, 'ex5');
  const txt = textOf(render(k.steps[k.steps.length - 1].explain));
  assert.match(txt, /item 3 has weight 4, more than 3, so it cannot fit/);
  assert.match(txt, /the capacity is now 0, so no other item fits/);
});

// ---------------------------------------------------------------- slides 201 / extra slides 202 / sheet 20E: subtours and MTZ
test('subtours 20e3 (sheet 20E, ex. 3): three cycles, S = {3,6}, and the 2^r - 2 = 6 violated unions', () => {
  const b = build(subtourDrill, '20e3');
  eqNum(fieldOf(b, /Number of cycles/).answer, 3, 'cycles');
  assert.deepEqual(fieldOf(b, /cycle through vertex 1/).answer, ['1', '4', '7']);
  eqNum(fieldOf(b, /Right-hand side/).answer, 1, 'RHS of S = {3,6}');
  eqNum(fieldOf(b, /nonempty proper subsets/).answer, 6, '2^3 - 2');
  const multi = fieldOf(b, /Which of these sets/);
  assert.deepEqual(multi.answer.slice().sort(), ['1,2,4,5,7,8,9', '1,3,4,6,7', '1,4,7', '2,3,5,6,8,9', '2,5,8,9', '3,6'].sort());
  assert.equal(multi.options.length, 9);
  assert.match(textOf(render(stepOf(b, /Every violated/).explain)), /each cycle completely or not at all/);
  eqNum(fieldOf(b, /Subtour rows needed/).answer, 501, '2^9 - 9 - 2');
});

test('subtours slide202 and lecture10 (slides 202, 201): S = {1,2,3}; S = {2,5} with 16 cutset arcs and 1,012 rows', () => {
  const a = build(subtourDrill, 'slide202');
  assert.match(a.steps[1].title, /\{1, 2, 3\}/);
  eqNum(fieldOf(a, /Right-hand side/).answer, 2, 'RHS');
  eqNum(fieldOf(a, /Left-hand side of the first form/).answer, 3, 'LHS');
  const b = build(subtourDrill, 'lecture10');
  eqNum(fieldOf(b, /Number of cycles/).answer, 5, 'five two-vertex subtours');
  assert.match(b.steps[1].title, /\{2, 5\}/);
  eqNum(fieldOf(b, /cutset form \(arcs leaving/).answer, 16, 'cutset variables');
  eqNum(fieldOf(b, /Subtour rows needed/).answer, 1012, 'rows for n = 10');
  eqNum(fieldOf(b, /MTZ rows for the same/).answer, 72, 'MTZ rows');
});

test('mtz 20e1 (sheet 20E, ex. 1): positions 2..6, M = 4 fails on the row of the unselected arc (6,2), smallest M = 5', () => {
  const b = build(mtzDrill, '20e1');
  assert.match(textOf(render(b.statement)), /M\(1-x_\{ij\}\)/);
  assert.deepEqual(cells(b.steps[0].fields[0]), { u2: '2', u3: '3', u4: '4', u5: '5', u6: '6' });
  const s = stepOf(b, /How big must M be/);
  eqNum(s.fields[0].answer, 4, 'u6 - u2 >=');
  assert.equal(s.fields[1].answer, 'ret');
  assert.match(s.fields[1].options.find((o) => o.value === 'ret').label, /\(6,2\)/);
  eqNum(s.fields[2].answer, 5, 'smallest M');
  eqNum(fieldOf(b, /Pair \$\(6,2\)\$/).answer, 4, 'u6 - u2 = 4 <= n - 2');
});

test('mtz lecture10 (slides 201 tour, extra slides 202): positions, rows 8 and 1, sums 36 vs 32, v = n + 1 - u', () => {
  const b = build(mtzDrill, 'lecture10');
  assert.deepEqual(cells(b.steps[0].fields[0]), { u2: '5', u3: '2', u4: '3', u5: '4', u6: '9', u7: '6', u8: '7', u9: '8', u10: '10' });
  eqNum(fieldOf(b, /Arc \$\(3,4\)\$/).answer, 8, 'used arc (3,4)');
  eqNum(fieldOf(b, /Pair \$\(8,7\)\$/).answer, 1, 'reverse arc (8,7)');
  eqNum(fieldOf(b, /Sum of the left-hand sides/).answer, 36, 'cycle on {2,5,7,8}');
  eqNum(fieldOf(b, /Sum of the right-hand sides/).answer, 32, 'cycle on {2,5,7,8}');
  assert.deepEqual(cells(fieldOf(b, /Total incoming flow/)), { v2: '6', v3: '9', v4: '8', v5: '7', v6: '2', v7: '5', v8: '4', v9: '3', v10: '1' });
  assert.match(textOf(render(stepOf(b, /Size and strength/).explain)), /can be equal/);
});

// ---------------------------------------------------------------- slides 202: row generation on the lecture instance
test('rowgen lecture12 (slides 202): nine solves, the slides\' eight rows, tour 367.21, and a consistent trace', () => {
  const inst = rowGenDrill.presets.find((p) => p.id === 'lecture12').make();
  const b = rowGenDrill.build(inst);
  const rows = b.steps.filter((s) => /Master solve/.test(s.title)).map((s) => (s.fields[2] ? s.fields[2].answer.join(',') : null));
  assert.deepEqual(rows, ['1,5', '2,8', '4,7,12', '1,11', '3,10', '4,12', '6,9,11', '2,3', null]);
  const cyc = b.steps.filter((s) => /Master solve/.test(s.title)).map((s) => s.fields[0].answer);
  assert.deepEqual(cyc, [5, 4, 3, 6, 4, 3, 2, 4, 1]);
  eqNum(fieldOf(b, /Length of the optimal tour/).answer, '367.21', 'tour');
  eqNum(fieldOf(b, /Subtour rows that were generated/).answer, 8, 'rows');
  // the stored trace: permutations, previous rows respected, objectives within rounding of the 2-decimal costs
  const added = [];
  inst.trace.succ.forEach((s, k) => {
    const succ = [0].concat(s.split(' ').map(Number));
    assert.deepEqual(succ.slice(1).slice().sort((p, q) => p - q), Array.from({ length: 12 }, (_, i) => i + 1), `solve ${k + 1}: permutation`);
    assert.ok(succ.every((v, i) => i === 0 || v !== i), `solve ${k + 1}: no loop`);
    added.forEach((S) => { const inS = new Set(S); assert.ok(S.filter((i) => inS.has(succ[i])).length <= S.length - 1, `solve ${k + 1} violates row ${S}`); });
    const cost = succ.slice(1).reduce((acc, j, i) => acc + inst.cost[i + 1][j], 0);
    assert.ok(Math.abs(cost - inst.trace.objective[k]) < 0.06, `solve ${k + 1}: ${cost} vs ${inst.trace.objective[k]}`);
    const cycles = cyclesFromSuccessor(succ);
    if (cycles.length > 1) added.push(cycles.slice().sort((a, c) => a.length - c.length || Math.min(...a) - Math.min(...c))[0]);
    else assert.deepEqual(cycles[0], [1, 8, 12, 4, 7, 2, 3, 10, 5, 9, 6, 11]);
  });
  assert.deepEqual(inst.trace.objective, [330.19, 332.94, 334.79, 360.19, 360.56, 362.41, 364.46, 365.13, 367.21]);
});

// ---------------------------------------------------------------- slides 203 / sheet 20E: fractional separation
test('fracsep 20e2 (sheet 20E, ex. 2): outflow 0.4 at S = {1,2}, theta 0.4, w13 = w14 = w23 = w24 = 1, violation 0.6, internal 1.6', () => {
  const b = build(fracSepDrill, '20e2');
  const t = b.steps[0].fields[0];
  assert.deepEqual(t.rows.map((r) => [numText(r.cells.v), r.cells.viol]), [['2/5', 'yes'], ['8/5', 'no'], ['2/5', 'yes']]);
  eqNum(fieldOf(b, /theta\(\\bar x\)\$$/).answer, '2/5', 'theta');
  assert.deepEqual(fieldOf(b, /forced to 1/).answer, ['13', '14', '23', '24']);
  assert.match(fieldOf(b, /forced to 1/).label, /\\\{1,2\\\}/);
  eqNum(fieldOf(b, /Minimum \$1\$–\$3\$ cut/).answer, '2/5', 'min 1-3 cut');
  eqNum(fieldOf(b, /Violation/).answer, '3/5', 'violation');
  eqNum(fieldOf(b, /the arcs inside/).answer, '8/5', 'internal');
  assert.match(b.rules, /1-\\varepsilon/);
});

test('fracsep lecture203 (slides 203): degree equations hold; {1,6,9,11} sends 0.50; theta 1/2; internal 7/2', () => {
  const inst = fracSepDrill.presets.find((p) => p.id === 'lecture203').make();
  const x = Array.from({ length: 13 }, () => Array.from({ length: 13 }, () => Frac.of(0)));
  inst.arcs.forEach(([i, j, v]) => { x[i][j] = Frac.parse(String(v)); });
  assert.ok(degreeCheck(x, 12).ok);
  const b = fracSepDrill.build(inst);
  assert.deepEqual(b.steps[0].fields[0].rows.map((r) => numText(r.cells.v)), ['1/2', '1', '1']);
  eqNum(fieldOf(b, /theta\(\\bar x\)\$$/).answer, '1/2', 'theta');
  eqNum(fieldOf(b, /Smallest cut value/).answer, '1/2', 'best cut');
  eqNum(fieldOf(b, /the arcs inside/).answer, '7/2', 'internal of {1,6,9,11}');
  assert.match(textOf(render(stepOf(b, /minimum cut/).explain)), /S=\\\{1,6,9,11\\\}\$: violated/);
});
