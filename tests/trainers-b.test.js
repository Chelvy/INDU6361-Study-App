// Cutting-plane trainers (cg, gomory, mir): the presets taken from sheet 20E and from the reading versions of
// slides 204-205 reproduce the instructor's numbers step by step, and the grader accepts the instructor's written forms.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installStubDom, collectHtml, checkHtml } from './helpers.js';

installStubDom();
const { cgDrill, gomoryDrill, mirDrill } = await import('../js/drills/cutdrills.js');
const { gradeField } = await import('../js/grade.js');
const { sameInequality } = await import('../js/math/parse.js');
const { Frac } = await import('../js/math/frac.js');
const { solveLP } = await import('../js/math/lp.js');
const {
  gomoryCuttingPlanes, gomoryCutRow, gomoryFractionalForm, reduceCut, cutImplies, mirContinuousRow,
} = await import('../js/math/cuts.js');

const F = (v) => Frac.of(v);
const build = (drill, id) => { const p = drill.presets.find((x) => x.id === id); assert.ok(p, `${drill.id} has no preset ${id}`); return drill.build(p.make()); };
const step = (b, re) => { const s = b.steps.find((x) => re.test(x.title)); assert.ok(s, `no step matching ${re} in ${b.title}`); return s; };
const field = (s, re) => { const f = (s.fields || []).find((x) => re.test(x.label || '')); assert.ok(f, `no field matching ${re} in step "${s.title}"`); return f; };
const num = (f, v) => assert.ok(F(f.answer).eq(F(v)), `${f.label}: expected ${v}, key is ${f.answer}`);
const ineq = (f, text) => assert.ok(sameInequality(f.answerText, text), `${f.label}: expected ${text}, key is ${f.answerText}`);
const accepts = (f, typed) => assert.ok(gradeField(f, typed).ok, `${f.label}: the grader rejects "${typed}"`);
const html = (x) => { const v = typeof x === 'function' ? x() : x; return typeof v === 'string' ? v : collectHtml(v).join(' '); };
html.node = (x) => (typeof x === 'function' ? x() : x);
const rowVals = (r) => r.coef.concat([r.rhs]).map(String);
const tableCells = (f) => Object.values(f.rows[0].cells).map(String);

// ------------------------------------------------------------------ Gomory, 20E exercise 5
test('gomory 20e5: the instructor tableau, the tie rule, both forms of the cut and the further rounding', () => {
  const res = gomoryCuttingPlanes({ c: [1, 1], rows: [{ a: [2, 1], op: '<=', b: 4 }, { a: [1, 2], op: '<=', b: 4 }], names: ['x', 'y'] });
  const t = res.rounds[0].lp.tableau;
  assert.deepEqual(t.rows.map((r) => r.name), ['x', 'y']);
  assert.deepEqual(rowVals(t.rows[0]), ['1', '0', '2/3', '-1/3', '4/3']);
  assert.deepEqual(rowVals(t.rows[1]), ['0', '1', '-1/3', '2/3', '4/3']);
  assert.deepEqual(t.zrow.coef.map(String).concat([String(t.zrow.rhs)]), ['0', '0', '1/3', '1/3', '8/3']);
  assert.equal(res.rounds[0].rowIndex, 0, 'tie between x and y (1/3 each) is broken by row order: the x row');

  const b = build(gomoryDrill, '20e5');
  assert.match(b.rules, /ties: the row listed first/);
  const s1 = step(b, /Cut 1: source row/);
  assert.equal(field(s1, /Source row/).answer, 'x');
  assert.deepEqual(tableCells(field(s1, /Floor every/)), ['1', '0', '0', '-1', '1']); // x - s2 <= 1
  const ff = field(s1, /fractional form/);
  ineq(ff, '2/3 s1 + 2/3 s2 >= 1/3');
  accepts(ff, '2/3 s1 + 2/3 s2 >= 1/3');
  accepts(ff, '2s1 + 2s2 >= 1');
  num(field(s1, /Left-hand side of the fractional form/), 0); // "the cut requires 0 >= 1/3"
  assert.match(html(s1.explain), /row listed first/);

  const s2 = step(b, /Cut 1: back to the original/);
  const cut = field(s2, /^Cut 1 in/);
  ineq(cut, 'x + y <= 5/2');
  accepts(cut, '2(4 - 2x - y) + 2(4 - x - 2y) >= 1'); // the instructor's substituted form
  num(field(s2, /Left-hand side of the cut/), '8/3'); // "x + y = 8/3 > 5/2"
  assert.equal(field(s2, /cut off/).answer, 'yes');

  const s3 = step(b, /further rounding/);
  ineq(field(s3, /Strengthened/), 'x + y <= 2');
  num(field(s3, /Objective value/), 2);
  assert.equal(field(s3, /optimal/).answer, 'yes');
  // the sheet rounds again instead of taking a second tableau cut from a non-unique LP optimum
  assert.doesNotMatch(html(s2.explain), /another cut is needed|\(\\tfrac\{3\}\{2\},\\ 1\)/);
  assert.doesNotMatch(html(step(b, /Where the method/).explain), /cuts in all/);
});

// ------------------------------------------------------------------ Gomory, 20E exercise 6
test('gomory 20e6: the y row wins (4/5 against 3/5), gives y <= 1; the x row gives y <= 3/2, which is weaker', () => {
  const res = gomoryCuttingPlanes({ c: [1, 2], rows: [{ a: [2, 1], op: '<=', b: 5 }, { a: [-1, 2], op: '<=', b: 2 }], names: ['x', 'y'] });
  const t = res.rounds[0].lp.tableau;
  assert.deepEqual(rowVals(t.rows[0]), ['1', '0', '2/5', '-1/5', '8/5']);
  assert.deepEqual(rowVals(t.rows[1]), ['0', '1', '1/5', '2/5', '9/5']);
  assert.deepEqual(t.zrow.coef.map(String).concat([String(t.zrow.rhs)]), ['0', '0', '4/5', '3/5', '26/5']);
  assert.deepEqual(gomoryFractionalForm(t, 0).coef.map(String).concat([String(gomoryFractionalForm(t, 0).rhs)]), ['0', '0', '2/5', '4/5', '3/5']);

  const b = build(gomoryDrill, '20e6');
  const s1 = step(b, /Cut 1: source row/);
  assert.equal(field(s1, /Source row/).answer, 'y');
  const ff = field(s1, /fractional form/);
  ineq(ff, '1/5 s1 + 2/5 s2 >= 4/5');
  accepts(ff, 's1 + 2s2 >= 4');
  const s2 = step(b, /Cut 1: back to the original/);
  ineq(field(s2, /^Cut 1 in/), 'y <= 1');
  accepts(field(s2, /^Cut 1 in/), '9 - 5y >= 4');
  num(field(s2, /Left-hand side of the cut/), '9/5');
  const s3 = step(b, /Compare with the cut from the x row/);
  ineq(field(s3, /Cut from the/), 'y <= 3/2');
  accepts(field(s3, /Cut from the/), '18 - 10y >= 3');
  assert.equal(field(s3, /also cut off/).answer, 'yes');
  assert.equal(field(s3, /stronger/).answer, 'src');
});

// ------------------------------------------------------------------ Gomory, slides 204: the "cut added" rows
test('gomory slides presets: the new row of each cut matches slides 204 p.22, 32, 38, 42', () => {
  const ex1 = build(gomoryDrill, 'ex1');
  const rows1 = ex1.steps.filter((s) => /into the tableau/.test(s.title)).map((s) => tableCells(s.fields[0]));
  assert.deepEqual(rows1, [['-1/7', '-2/7', '-6/7'], ['-1/2', '0', '-1/2']]);
  const ws = build(gomoryDrill, 'workshop');
  const rows2 = ws.steps.filter((s) => /into the tableau/.test(s.title)).map((s) => tableCells(s.fields[0]));
  assert.deepEqual(rows2, [['-19/20', '-1/20', '-3/10'], ['-9/190', '-1/19', '-187/190'], ['-1/10', '0', '-3/10']]);
  // slides: "At the current LP solution, the left-hand side is 1.3 > 1" (workshop cut 1), 1/2 > 0 (example 1 cut 2)
  num(field(ws.steps[0], /floored row at/), '13/10');
  num(field(ex1.steps.filter((s) => /source row/.test(s.title))[1], /floored row at/), '1/2');
  // final objective rows: z = 7 - 3 s4 - s5 and z = 42 - 9 s5 - s6
  assert.match(html(step(ex1, /Where the method/).explain), /z=7 - 3s_\{4\} - s_\{5\}/);
  assert.match(html(step(ws, /Where the method/).explain), /z=42 - 9s_\{5\} - s_\{6\}/);
});

test('gomoryCutRow is minus the fractional parts of the source row', () => {
  const res = gomoryCuttingPlanes({ c: [4, -1], rows: [{ a: [7, -2], op: '<=', b: 14 }, { a: [0, 1], op: '<=', b: 3 }, { a: [2, -2], op: '<=', b: 3 }], names: ['x1', 'x2'] });
  res.rounds.forEach((rd) => {
    const cr = gomoryCutRow(rd.lp.tableau, rd.rowIndex);
    const src = rd.lp.tableau.rows[rd.rowIndex];
    src.coef.forEach((v, j) => assert.ok(cr.coef[j].eq(v.floor().sub(v))));
    assert.ok(cr.rhs.eq(src.rhs.floor().sub(src.rhs)));
  });
});

// ------------------------------------------------------------------ Chvatal-Gomory, 20E exercise 4
test('cg 20e4: rows (a), (b), (c) rounded in order, then (c) scaled by 2 first', () => {
  const b = build(cgDrill, '20e4');
  const cuts = b.steps.filter((s) => s.fields.some((f) => f.type === 'ineq')).map((s) => s.fields.find((f) => f.type === 'ineq'));
  assert.equal(cuts.length, 4);
  ineq(cuts[0], '2x + 3y <= 12');
  ineq(cuts[1], '2x + y >= 1');
  accepts(cuts[1], '-2x - y <= -1'); // the same row written as "<="
  ineq(cuts[2], '-x + y <= 1');
  ineq(cuts[3], '-x + 3y <= 3');
  assert.deepEqual(tableCells(field(step(b, /Scale row \(c\)/), /Scaled row/)), ['-1', '3', '7/2']);
  const tests = b.steps.filter((s) => /Test a point/.test(s.title));
  assert.equal(tests.length, 4);
  const lhs = tests.map((s) => String(s.fields[0].answer));
  const off = tests.map((s) => s.fields[1].answer);
  assert.deepEqual(lhs, ['38/3', '2/3', '5/6', '7/2']); // (38/6, 0), (1/3, 0), (1/2, 4/3) twice
  assert.deepEqual(off, ['yes', 'yes', 'no', 'yes']); // (1/2, 4/3) survives flooring but not scaling
  assert.equal(field(tests[3], /stronger/).answer, 'this');
  assert.match(html(b.rules), /rounding its right-hand side <b>up<\/b>/);
});

test('cg round2: rounding both sloping workshop rows gives (1.5, 4.5) and the bound 46.5 (slides 204 reading version)', () => {
  const b = build(cgDrill, 'round2');
  const cuts = b.steps.filter((s) => s.fields.some((f) => f.type === 'ineq')).map((s) => s.fields.find((f) => f.type === 'ineq'));
  ineq(cuts[0], '-x + y <= 3');
  ineq(cuts[1], 'x + y <= 6');
  const rs = step(b, /Re-solve/);
  num(field(rs, /bound/), '93/2');
  assert.equal(field(rs, /integer/).answer, 'no');
  assert.match(html(rs.explain), /1\.5 \+ 10\(4\.5\)=46\.5/);
});

// ------------------------------------------------------------------ MIR, 20E exercise 7
test('mir 20e7: s = 10 - y, x + s/4 >= 5/2, k = 2, f = 1/2, cut y <= 4 + 2x, (2.5, 10) gives 10 <= 9: false', () => {
  const b = build(mirDrill, '20e7');
  const st = html(b.statement);
  assert.match(st, /0\\le x\\le 3/);
  assert.match(st, /\\mathbb\{R\}_\+/);
  const v = step(b, /fractional vertex/);
  num(v.fields[0], '5/2'); num(v.fields[1], 10);
  const bf = step(b, /basic form/);
  num(bf.fields[0], 2); num(bf.fields[1], '1/2');
  const cut = step(b, /Apply MIR/).fields[0];
  ineq(cut, 'y <= 4 + 2x');
  accepts(cut, 'x + (10 - y)/2 >= 3');
  const split = step(b, /both sides of the split/);
  num(split.fields[0], 3); // 5 - x >= 3 at x = 2
  assert.equal(split.fields[1].answer, 'yes');
  const chk = step(b, /Check the cut/);
  assert.deepEqual(chk.fields.slice(0, 3).map((f) => String(f.answer)), ['8', '10', '9']);
  assert.equal(chk.fields[3].answer, 'yes');
});

// ------------------------------------------------------------------ MIR, 20E exercise 8
test('mir 20e8: the instructor row x1 + x2 + y <= 4.4, u = 1 - y, k = -4, f = 0.6, cut 3x1 + 3x2 + 5y <= 14, 15.2 > 14', () => {
  const m = mirContinuousRow([1, 1], 1, '4.4', 1);
  assert.ok(m.k.eq(F(-4)) && m.f.eq(F('3/5')) && m.basicRhs.eq(F('-3.4')));
  assert.deepEqual(m.intForm.a.map(String).concat([String(m.intForm.b)]), ['3', '3', '5', '14']);
  const b = build(mirDrill, '20e8');
  const st = html(b.statement);
  assert.match(st, /x_\{1\} \+ x_\{2\} \+ y \\le 4\.4/);
  assert.match(st, /0\\le y\\le 1/);
  const c0 = step(b, /Check the point in the LP/);
  num(c0.fields[0], '4.4');
  assert.equal(c0.fields[1].answer, 'yes');
  const bf = step(b, /complement/);
  num(field(bf, /Right-hand side/), '-3.4');
  num(field(bf, /^\$k\$$/), -4);
  num(field(bf, /^\$f\$$/), '0.6');
  const mi = step(b, /The MIR inequality/);
  num(field(mi, /Right-hand side/), -3);
  const cut = field(mi, /MIR cut/);
  ineq(cut, '3x1 + 3x2 + 5y <= 14');
  accepts(cut, '-x1 - x2 + (1 - y)/0.6 >= -3');
  const ck = step(b, /fractional point/);
  assert.match(html(ck.text), /\(2,\\ 1\.4,\\ 1\)/);
  num(ck.fields[0], '15.2');
  assert.equal(ck.fields[1].answer, 'yes');
  // r = x1 + x2: r <= 3 gives 9 + 5 = 14; r >= 4 forces r = 4, y <= 0.4, 12 + 2 = 14
  const sp = step(b, /both sides of the split/);
  assert.deepEqual(sp.fields.map((f) => String(f.answer)), ['14', '2/5', '14']);
  assert.match(html(sp.explain), /forces \$r=4\$/);
});

// ------------------------------------------------------------------ MIR, slides 205: both three-variable versions
test('mir slides 205: PDF model (u = z, bound 2.5 -> 2) and reading version (u = 1 - z, bound -4.5 -> -4)', () => {
  const pdf = build(mirDrill, 'mixed');
  num(step(pdf, /Basic form/).fields[0], -3);
  num(step(pdf, /Basic form/).fields[1], '1/2');
  ineq(step(pdf, /MIR inequality/).fields[1], 'x + y - 2z <= 2');
  const p1 = step(pdf, /fractional point/);
  assert.match(html(p1.text), /\(2,\\ 0\.5,\\ 0\)/);
  num(p1.fields[0], '5/2');
  assert.match(html(p1.explain), /from \$2\.5\$ to \$2\$/);

  const rv = build(mirDrill, 'mixed-html');
  const bf = step(rv, /complement/);
  num(field(bf, /Right-hand side/), '-2.5');
  num(field(bf, /^\$k\$$/), -3);
  ineq(field(step(rv, /MIR inequality/), /MIR cut/), 'x + y + 2z <= 4');
  const p2 = step(rv, /fractional point/);
  num(p2.fields[0], '9/2');
  assert.match(html(p2.explain), /lower bound from \$-4\.5\$ to \$-4\$/);
  assert.deepEqual(step(rv, /both sides of the split/).fields.map((f) => String(f.answer)), ['4', '1/2', '4']);
});

test('mirContinuousRow agrees with the slides row x + y - z <= 2.5 and is valid on every integer pair', () => {
  const m = mirContinuousRow([1, 1], -1, '2.5');
  assert.deepEqual(m.a.map(String).concat([String(m.rhs)]), ['1', '1', '-2', '2']);
  // complemented reading-version row: valid for all integer (x, y) in [0,2]^2 at the largest feasible z
  const c = mirContinuousRow([1, 1], 1, '3.5', 1);
  for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) {
    const zmax = Frac.of(Math.min(1, 3.5 - x - y));
    if (zmax.sign() < 0) continue;
    for (const z of [Frac.of(0), zmax]) assert.ok(c.a[0].mul(x).add(c.a[1].mul(y)).add(c.a[2].mul(z)).le(c.rhs), `(${x}, ${y}, ${z})`);
  }
});

test('every string of the cg, gomory and mir trainers passes the strict KaTeX/HTML check', async () => {
  const { makeRng } = await import('../js/util.js');
  const all = (b, w) => {
    const strs = [b.rules, b.wrapup, ...collectHtml(html.node(b.statement))];
    b.steps.forEach((s) => {
      [s.text, s.explain, s.after].forEach((x) => { if (!x) return; const v = typeof x === 'function' ? x() : x; if (typeof v === 'string') strs.push(v); else strs.push(...collectHtml(v)); });
      (s.fields || []).forEach((f) => { if (f.label) strs.push(f.label); (f.options || []).forEach((o) => strs.push(String(o.label))); });
    });
    strs.filter((x) => typeof x === 'string' && x.trim()).forEach((x, i) => checkHtml(x, `${w} #${i}`));
  };
  for (const d of [cgDrill, gomoryDrill, mirDrill]) {
    d.presets.forEach((p) => all(d.build(p.make()), `${d.id}/${p.id}`));
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 15; seed++) all(d.build(d.random(makeRng(seed * 31 + level), level)), `${d.id}/L${level}/s${seed}`);
  }
});

test('reduceCut and cutImplies', () => {
  const r = reduceCut([2, 2], 5);
  assert.deepEqual(r.a.map(String).concat([String(r.b)]), ['1', '1', '5/2']);
  const rows = [{ a: [2, 1], op: '<=', b: 5 }, { a: [-1, 2], op: '<=', b: 2 }];
  assert.equal(cutImplies(rows, { a: [0, 1], b: 1 }, { a: [0, 1], b: '3/2' }), true);
  assert.equal(cutImplies(rows, { a: [0, 1], b: '3/2' }, { a: [0, 1], b: 1 }), false);
  // the LP bound of 20E ex. 8 after the cut (app-side computation): 27/5 -> 5
  const lp = solveLP({ sense: 'max', c: [1, 1, 2], rows: [{ a: [1, 1, 1], op: '<=', b: '4.4' }, { a: [1, 0, 0], op: '<=', b: 2 }, { a: [0, 1, 0], op: '<=', b: 2 }, { a: [0, 0, 1], op: '<=', b: 1 }, { a: [3, 3, 5], op: '<=', b: 14 }] });
  assert.ok(lp.obj.eq(F(5)));
});
