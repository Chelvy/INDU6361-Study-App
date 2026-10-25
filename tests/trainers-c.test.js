// Trainers of slides 206 / sheet 20E (cliques, covers, lifting, flow cover, lot sizing) and of slides EXTRA-201
// (tangent-cut refinement, perspective cut): every preset reproduces the instructor's numbers, every answer key is
// accepted by its own grader, and the kelleyTable / strength widget captions say what the slides say.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, installStubDom, collectHtml } from './helpers.js';

installStubDom();
const { cliqueDrill, coversDrill, liftingDrill, flowCoverDrill, lotDrill } = await import('../js/drills/covers.js');
const { kelleyDrill, perspectiveDrill } = await import('../js/drills/convexdrills.js');
const { gradeField } = await import('../js/grade.js');
const { makeRng } = await import('../js/util.js');
const { Frac } = await import('../js/math/frac.js');
const { allCovers, minimalCovers } = await import('../js/math/knapsack.js');

const MINE = [cliqueDrill, coversDrill, liftingDrill, flowCoverDrill, lotDrill, kelleyDrill, perspectiveDrill];

// ---------------------------------------------------------------- helpers
const numText = (a) => (a instanceof Frac ? a.toString() : String(a));
function canonical(def) {
  switch (def.type) {
    case 'num': case 'int': return numText(def.answer);
    case 'choice': return String(def.answer);
    case 'multi': return def.answer.map(String);
    case 'set': return def.answer.length ? def.answer.join(', ') : 'none';
    case 'ineq': case 'expr': return def.answerText;
    case 'table': return def.rows.map((row) => Object.fromEntries(def.columns.filter((c) => row.cells[c.key] !== null && row.cells[c.key] !== undefined).map((c) => [c.key, c.kind === 'num' ? numText(row.cells[c.key]) : String(row.cells[c.key])])));
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
      if (def.type === 'ineq') assert.equal(typeof def.answerText, 'string', `${w}: ineq needs answerText`);
      const res = gradeField(def, canonical(def));
      assert.ok(res.ok, `${w} field ${k + 1} (${def.label}): answer key rejected (${res.msg})`);
    });
  });
}
const steps = (b) => b.steps.map((s) => s.title);
const stepOf = (b, title) => { const s = b.steps.find((x) => x.title === title); assert.ok(s, `no step "${title}" in [${steps(b).join(' | ')}]`); return s; };
const field = (st, part) => { const f = st.fields.find((x) => x.label.includes(part)); assert.ok(f, `no field "${part}" in step "${st.title}"`); return f; };
const eqNum = (f, v) => assert.ok(Frac.of(f.answer).eq(Frac.parse(String(v))), `${f.label}: ${numText(f.answer)} ≠ ${v}`);
const accepts = (f, text) => assert.ok(gradeField(f, text).ok, `${f.label}: "${text}" should be accepted`);
const build = (drill, id) => { const p = drill.presets.find((x) => x.id === id); assert.ok(p, `${drill.id} has no preset ${id}`); return drill.build(p.make()); };
const tableCol = (f, key) => f.rows.map((r) => r.cells[key]);

// ---------------------------------------------------------------- every preset and many random instances
for (const drill of MINE) {
  test(`trainer ${drill.id}: presets and 120 random instances build, and every answer key grades as correct`, () => {
    drill.presets.forEach((p) => checkBuilt(drill, drill.build(p.make()), `${drill.id}/${p.id}`));
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 40; seed++) {
      const inst = drill.random(makeRng(seed * 7919 + level), level);
      checkBuilt(drill, drill.build(inst), `${drill.id}/L${level}/seed${seed}`);
    }
  });
}

// ---------------------------------------------------------------- 20E, exercise 9: maximal cliques, no LP point
test('clique 20e9: two triangles sharing job 3, maximal cliques {1,2,3} and {3,4,5}', () => {
  const b = build(cliqueDrill, '20e9');
  assert.ok(!steps(b).includes('The most violated clique inequality') && !steps(b).includes('Effect on the bound'), 'no LP steps without an LP point');
  const m = stepOf(b, 'All maximal cliques');
  eqNum(field(m, 'Number of maximal cliques'), 2);
  assert.deepEqual(field(m, 'Tick every maximal clique').answer, ['1-2-3', '3-4-5']);
  const q = stepOf(b, 'Their clique inequalities');
  assert.deepEqual(q.fields.map((f) => f.answerText), ['x1 + x2 + x3 <= 1', 'x3 + x4 + x5 <= 1']);
  assert.ok(/imply all 6 pair rows/.test(q.explain), 'the two rows replace the six pair rows');
  assert.ok(!/LP values/.test(textOf(render(b.statement))), 'no LP values in the figure caption');
});

test('clique graph11 (slides 206): separator finds {2,5,7,9} with weight 1.85; no bound step', () => {
  const b = build(cliqueDrill, 'graph11');
  assert.ok(!steps(b).includes('Effect on the bound'), 'the 11-vertex point is not LP-optimal: no bound step');
  const s = stepOf(b, 'The most violated clique inequality');
  assert.equal(field(s, 'Clique inequality').answerText, 'x2 + x5 + x7 + x9 <= 1');
  eqNum(field(s, 'violation'), '17/20');
  eqNum(field(s, 'edge constraints'), 6);
  const m = stepOf(b, 'All maximal cliques');
  eqNum(field(m, 'Number of maximal cliques'), 4); // {1,4,8}, {2,5,7,9}, {3,6,10}, {4,8,11}
  assert.deepEqual(field(m, 'Tick').answer, ['1-4-8', '2-5-7-9', '3-6-10', '4-8-11']);
});

test('clique random: the bound step appears only when the all-1/2 point is LP-optimal for max sum x', async () => {
  const { solveLP } = await import('../js/math/lp.js');
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 60; seed++) {
    const inst = cliqueDrill.random(makeRng(seed * 7919 + level), level);
    const n = inst.n;
    const unit = (k) => Array.from({ length: n }, (_, q) => (q === k ? 1 : 0));
    const rows = inst.edges.map(([i, j]) => ({ a: unit(i).map((v, q) => v + (q === j ? 1 : 0)), op: '<=', b: 1 })).concat(Array.from({ length: n }, (_, k) => ({ a: unit(k), op: '<=', b: 1 })));
    const lpMax = solveLP({ sense: 'max', c: new Array(n).fill(1), rows }).obj;
    const hasBound = steps(cliqueDrill.build(inst)).includes('Effect on the bound');
    assert.equal(hasBound, lpMax.eq(Frac.of(n).div(2)), `L${level}/seed${seed}: LP max ${lpMax} vs ${n}/2`);
  }
});

test('clique meetings (slides 206): LP value 2.5 and violation 1/2 are kept', () => {
  const b = build(cliqueDrill, 'meetings');
  eqNum(field(stepOf(b, 'Effect on the bound'), 'LP value'), '5/2');
  eqNum(field(stepOf(b, 'The most violated clique inequality'), 'violation'), '1/2');
  assert.ok(!/4\/2|3\/2\$\./.test(String(render(stepOf(b, 'The most violated clique inequality').explain)._html)), 'no unsimplified |K|/2');
});

// ---------------------------------------------------------------- 20E, exercises 10 and 11: covers
test('covers 20e10: 5x1 + 6x2 + 7x3 + 13x4 <= 17 has 8 covers, 4 of them minimal', () => {
  const b = build(coversDrill, '20e10');
  assert.ok(!steps(b).some((t) => t.startsWith('Separation')), 'no objective, no point: no separation step');
  const t = field(stepOf(b, 'Which sets are covers?'), 'For each set');
  const rows = Object.fromEntries(t.rows.map((r) => [r.head.replace(/[^0-9,]/g, ''), r.cells]));
  const want = { '1,4': 18, '2,4': 19, '3,4': 20, '1,2,3': 18, '1,2,4': 24, '1,3,4': 25, '2,3,4': 26, '1,2,3,4': 31 };
  Object.entries(want).forEach(([k, w]) => { assert.equal(rows[k].w, w, `weight of {${k}}`); assert.equal(rows[k].cov, 'yes', `{${k}} is a cover`); });
  assert.equal(t.rows.filter((r) => r.cells.cov === 'yes').length, 8);
  assert.deepEqual(t.rows.filter((r) => r.cells.min === 'yes').map((r) => r.head.replace(/[^0-9,]/g, '')), ['1,4', '2,4', '3,4', '1,2,3']);
  assert.equal(rows['1,2'].w, 11); assert.equal(rows['1,3'].w, 12); assert.equal(rows['2,3'].w, 13);
  const s2 = stepOf(b, 'Cover inequalities');
  eqNum(field(s2, 'Number of covers'), 8);
  eqNum(field(s2, 'Number of minimal covers'), 4);
  assert.equal(field(s2, 'Cover inequality').answerText, 'x1 + x2 + x3 <= 2');
  const s3 = stepOf(b, 'Extended cover');
  assert.deepEqual(field(s3, '$E(C)$').answer, ['1', '2', '3', '4']);
  assert.equal(field(s3, 'Extended cover inequality').answerText, 'x1 + x2 + x3 + x4 <= 2');
  assert.ok(/5\+6\+7=18\\gt 17/.test(s3.explain), 'any three items weigh at least 5+6+7=18 > 17');
  const ex1 = String(stepOf(b, 'Which sets are covers?').explain);
  assert.ok(ex1.includes('Removing item 1, 2 or 3 leaves 13, 12 or 11'), 'minimality of {1,2,3}: 13, 12, 11');
  assert.ok(ex1.includes('without item 1 the weight is still 19'), '{1,2,4} is not minimal: 19 > 17');
  assert.equal(allCovers([5, 6, 7, 13], 17).length, 8);
  assert.equal(minimalCovers([5, 6, 7, 13], 17).length, 4);
});

test('covers slides: the separation step is kept (1/2 below 1, left-hand side 5/2)', () => {
  const b = build(coversDrill, 'slides');
  const s = stepOf(b, 'Separation at the LP optimum');
  eqNum(field(s, '(1-\\bar x_j)'), '1/2');
  eqNum(field(s, 'Left-hand side'), '5/2');
  assert.ok(s.text.includes('an optimal solution'), 'several LP optima exist: "an optimal solution"');
  eqNum(field(stepOf(b, 'Cover inequalities'), 'Number of covers'), 8);
});

test('lifting 20e11: residual capacity 4, maximum 0, alpha = 2', () => {
  const b = build(liftingDrill, '20e11');
  const s = b.steps[0];
  eqNum(field(s, 'Capacity left'), 4);
  eqNum(field(s, '$\\max$'), 0);
  eqNum(field(s, 'Lifting coefficient'), 2);
  assert.ok(s.explain.includes('No other item fits in the remaining capacity 4'), 'nothing else fits');
  assert.ok(s.explain.includes('$(0,0,0,1)$'), 'maximality certificate (0,0,0,1)');
  assert.ok(!/items none/.test(s.explain));
  assert.equal(field(b.steps[1], 'Lifted inequality').answerText, 'x1 + x2 + x3 + 2x4 <= 2');
  assert.ok(!/items none/.test(build(liftingDrill, 'slides').steps[0].explain), 'slides preset: no "items none"');
  assert.ok(textOf(render(b.statement)).includes('starts from the extension'), 'Ex 11 lifts from the extension');
});

// ---------------------------------------------------------------- 20E, exercise 13: flow cover with C a proper subset
test('flowcover 20e13: lambda 4, coefficients 3 and 5, test point violated by 2', () => {
  const b = build(flowCoverDrill, '20e13');
  const st = textOf(render(b.statement));
  assert.ok(st.includes('Test the point') && !st.includes('LP relaxation'), 'a test point, not an LP solution');
  eqNum(field(stepOf(b, 'Excess of the cover'), '\\lambda'), 4);
  const co = stepOf(b, 'Coefficients').fields[0].rows[0].cells;
  assert.deepEqual(Object.values(co).map(String), ['3', '5']);
  const ineq = field(stepOf(b, 'The inequality'), 'Flow cover inequality');
  assert.equal(ineq.answerText, 'y1 + y2 - 3x1 - 5x2 <= 4');
  accepts(ineq, 'y1 + y2 + 3(1 - x1) + 5(1 - x2) <= 12');
  const v = stepOf(b, 'Check validity on every open/closed pattern').fields[0];
  assert.deepEqual(v.rows.map((r) => r.head), ['$(0,0)$', '$(1,0)$', '$(0,1)$', '$(1,1)$']);
  assert.deepEqual(tableCol(v, 'f').map(String), ['0', '7', '9', '12']);
  assert.deepEqual(tableCol(v, 'l').map(String), ['8', '12', '12', '12']);
  const t = stepOf(b, 'Test the point');
  eqNum(field(t, 'Left-hand side $'), 14);
  eqNum(field(t, 'minus 12'), 2);
  assert.equal(field(t, 'cut off').answer, 'yes');
  assert.ok(/23\}\{2\}\\le 12/.test(t.explain), 'total flow 11.5 <= 12');
});

test('flowcover: the largest left-hand side never exceeds b on any pattern (random instances, levels 1-3)', () => {
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 40; seed++) {
    const inst = flowCoverDrill.random(makeRng(seed * 31 + level), level);
    const v = flowCoverDrill.build(inst).steps.find((s) => s.title.startsWith('Check validity')).fields[0];
    v.rows.forEach((r) => assert.ok(Frac.of(r.cells.l).le(inst.b), `L${level}/seed${seed}: ${r.head}`));
  }
});

// ---------------------------------------------------------------- 20E, exercise 14: lot sizing over three periods
test('lotsize 20e14: cumulative right sides 1, 2, 2 and all six inequalities violated', () => {
  const b = build(lotDrill, '20e14');
  const cum = b.steps[0].fields[0].rows;
  assert.deepEqual(Object.values(cum[0].cells).map(String), ['5', '13', '19']);
  assert.deepEqual(Object.values(cum[1].cells).map(String), ['1', '2', '2']);
  const tp = b.steps[1];
  assert.ok(tp.text.startsWith('Test the point'), 'test-point wording');
  assert.deepEqual(Object.values(tp.fields[0].rows[0].cells).map(String), ['5/12', '13/12', '19/12']);
  assert.deepEqual(tp.fields[1].answer, ['1', '2', '3']);
  const sp = stepOf(b, 'Single-period inequalities').fields[0];
  assert.deepEqual(tableCol(sp, 'l').map(String), ['5', '8', '6']);
  assert.deepEqual(tableCol(sp, 'r').map(String), ['25/12', '16/3', '3']);
  assert.deepEqual(tableCol(sp, 'v'), ['yes', 'yes', 'yes']);
  const ns = stepOf(b, 'A period without a set-up');
  assert.equal(ns.fields[0].answer, 'yes');
  assert.ok(ns.explain.includes('$x=(1,1,0)$, $y=(7,12,0)$, $s=(2,6,0)$'), "the instructor's plan");
});

test('lotsize slides: "the LP relaxation admits" and single-period 18/5 in both periods', () => {
  const b = build(lotDrill, 'slides');
  assert.ok(b.steps[1].text.includes('The LP relaxation admits'));
  assert.deepEqual(tableCol(stepOf(b, 'Single-period inequalities').fields[0], 'r').map(String), ['18/5', '18/5']);
  assert.deepEqual(b.steps[0].fields[0].rows[1].cells, { t0: Frac.of(1), t1: Frac.of(2) });
});

// ---------------------------------------------------------------- EXTRA-201
test('kelley slides: four master solves and three added cuts, with the violation graded', () => {
  const b = build(kelleyDrill, 'slides');
  const masters = b.steps.filter((s) => s.title.startsWith('Master solve'));
  assert.equal(masters.length, 4);
  const col = (part) => masters.map((s) => Frac.of(field(s, part).answer).toString());
  assert.deepEqual(col('Master optimum'), ['3/2', '5/4', '11/8', '21/16']);
  assert.deepEqual(col('Lower bound'), ['-21/100', '-3/50', '-1/100', '-3/800']);
  assert.deepEqual(col('Violation'), ['1/4', '1/16', '1/64', '1/256']);       // 0.25, 0.0625, 0.015625, 0.00390625
  assert.deepEqual(col('Upper bound'), ['1/25', '1/400', '1/400', '1/6400']); // U stays 0.0025 after the second cut
  assert.deepEqual(col('Gap'), ['1/4', '1/16', '1/80', '1/256']);             // 0.25, 0.0625, 0.0125, 0.00390625
  const cuts = masters.filter((s) => s.fields.some((f) => f.type === 'ineq')).map((s) => field(s, 'New tangent cut'));
  assert.equal(cuts.length, 3);
  ['t >= 0.4x - 0.56', 't >= -0.1x + 0.1275', 't >= 0.15x - 0.200625'].forEach((txt, i) => accepts(cuts[i], txt));
  assert.ok(/feasibility tolerance/.test(b.rules) && /objective tolerance/.test(b.rules), 'both stopping tolerances');
  assert.ok(/stays at \$0\.0025\$/.test(masters[2].explain), 'U stays in the third solve');
});

test('perspective: part 4 of the exercise (validity at z = 0 and z = 1) is graded', () => {
  const ex = stepOf(build(perspectiveDrill, 'exercise'), 'Check validity at z = 0 and z = 1');
  eqNum(field(ex, 'Off-state'), 0);
  accepts(field(ex, 'On-state'), 't >= 24x - 48');
  eqNum(field(ex, 'Largest value'), 0);
  const sl = stepOf(build(perspectiveDrill, 'slides'), 'Check validity at z = 0 and z = 1');
  accepts(field(sl, 'On-state'), 't >= 8x - 16');
  const b = build(perspectiveDrill, 'exercise');
  accepts(field(stepOf(b, 'The perspective cut'), 'Linear cut'), 't >= 24x - 48z');
  eqNum(field(stepOf(b, 'What the perspective demands'), 'f(\\bar x/\\bar z)'), 12);
});

// ---------------------------------------------------------------- widgets
test('kelleyTable caption: U does not fall after the second cut; only the violation is divided by exactly 4', async () => {
  const { WIDGETS } = await import('../js/widgets.js');
  const host = document.createElement('div');
  WIDGETS.kelleyTable(host);
  const html = collectHtml(host).join(' ');
  collectHtml(host).forEach((s, i) => checkHtml(s, `kelleyTable html ${i}`));
  assert.ok(/stays at 0\.0025/.test(html), html);
  assert.ok(/divided by exactly 4/.test(html));
  assert.ok(/4, 5 and 3\.2/.test(html), 'gap ratios 4, 5 and 3.2');
  assert.ok(!/U\$ falls/.test(html));
  assert.ok(/0\.015625/.test(html), 'violation column');
  // Slides p. 21: violation and gap "need not be equal" (they agree in three rows of four).
  assert.ok(/need not be equal: they differ in the row with 2 added cuts/.test(html));
  assert.ok(!/different numbers/.test(html));
});

test('strength widget: the caption no longer claims a branching rule for the slides', async () => {
  const { WIDGETS } = await import('../js/widgets.js');
  const host = document.createElement('div');
  WIDGETS.strength(host);
  const all = textOf(host);
  assert.ok(/do not state a branching rule/.test(all));
  assert.ok(/9 nodes in this trace, branching on x first \(9 nodes with y first\)/.test(all), all.slice(0, 400));
  assert.ok(!/as on the slide\)/.test(all));
});
