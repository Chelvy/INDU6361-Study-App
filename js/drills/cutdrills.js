// Cutting-plane trainers (slides 204-205, sheet 20E): Chvatal-Gomory rounding, Gomory cuts from the tableau, MIR.
import { Frac, ZERO, ONE } from '../math/frac.js';
import { solveLP } from '../math/lp.js';
import {
  chvatalGomory, gomoryCuttingPlanes, mirCapacityCut, mirContinuousRow,
  gomoryFloorCut, gomoryFractionalForm, gomoryCutRow, substituteSlacks, reduceCut, cutImplies,
} from '../math/cuts.js';
import { tableauTable } from '../viz.js';
import { linTex, ineqTex, ineqText, vtex } from '../util.js';
import { frag } from './common.js';

const R = String.raw;
const fr = (v) => Frac.of(v);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const dot = (a, x) => a.reduce((s, v, j) => s.add(fr(v).mul(fr(x[j]))), ZERO);
// Short decimals as on the slides (2.5, 0.6, 1.4); other fractions as \tfrac.
const dtex = (v) => { const f = fr(v); const p = f.pretty(4); return p.includes('/') ? f.toLatex() : p; };
const ptTex = (xs, nt = dtex) => `(${xs.map(nt).join(',\\ ')})`;
const rowTex = (a, names, op, b, nt = dtex) => `${linTex(a, names)} ${op === '>=' ? '\\ge' : op === '=' ? '=' : '\\le'} ${nt(b)}`;
// Value of c.x written out with the numbers, e.g. 1.5 + 10(4.5).
const evalTex = (c, x, nt = dtex) => c.map(fr).map((v, j) => ({ v, xj: x[j] })).filter(({ v }) => !v.isZero()).map(({ v, xj }, i) => `${v.sign() < 0 ? (i ? ' - ' : '-') : (i ? ' + ' : '')}${v.abs().eq(ONE) ? nt(xj) : `${v.abs().toLatex()}(${nt(xj)})`}`).join('');

// ---------------------------------------------------------------- Chvatal-Gomory rounding
// Instance: { rows:[{a, b, op?:'<='|'>=', tag?}], names, u, point?, pointText? } for one cut, or
// { rows, names, cuts:[{u, point?, pointText?, note?, compareWith?, compareNote?}], objective?:{c}, resolve? } for several
// roundings in a row (20E exercise 4; slides 204 reading version, "Rounding both constraints").
function buildCG(inst) {
  const { names } = inst;
  const rows = inst.rows.map((r, i) => ({ a: r.a.map(fr), b: Frac.parse(String(r.b)), op: r.op || '<=', tag: r.tag || `(${i + 1})` }));
  const le = rows.map((r) => (r.op === '>=' ? { a: r.a.map((v) => v.neg()), b: r.b.neg() } : { a: r.a, b: r.b }));
  const lpRows = rows.map((r) => ({ a: r.a, op: r.op, b: r.b }));
  const multi = Array.isArray(inst.cuts);
  // keep the instructor's number format: decimals when the rows are written with decimals, fractions otherwise
  const nt = inst.rows.some((r) => String(r.b).includes('.')) ? dtex : (v) => fr(v).toLatex();
  const rt = (a, op, b) => rowTex(a, names, op, b, nt);
  const specs = multi ? inst.cuts : [{ u: inst.u, point: inst.point, pointText: inst.pointText }];
  const cols = names.map((nm, j) => ({ key: `k${j}`, head: `$${vtex(nm)}$`, kind: 'num', plain: `coefficient of ${nm}` })).concat([{ key: 'b', head: 'right-hand side', kind: 'num', plain: 'right-hand side' }]);
  const cells = (a, b) => ({ ...Object.fromEntries(a.map((v, j) => [`k${j}`, v])), b });
  const steps = [];
  const built = [];
  const plan = [];
  specs.forEach((spec, ci) => {
    const u = spec.u.map((v) => Frac.parse(String(v)));
    const cg = chvatalGomory(le, u);
    const nz = u.map((v, i) => i).filter((i) => !u[i].isZero());
    const single = nz.length === 1 ? nz[0] : -1;
    const scaled = single >= 0 && !u[single].eq(ONE);
    const flip = single >= 0 && rows[single].op === '>=';
    const sgn = (v) => (flip ? v.neg() : v);
    const agg = { a: cg.aggregated.a.map(sgn), b: sgn(cg.aggregated.b) };
    const cut = { a: cg.cut.a.map(sgn), b: sgn(cg.cut.b), op: flip ? '>=' : '<=' };
    const cutT = rt(cut.a, cut.op, cut.b);
    const cutText = ineqText(cut.a, names, cut.op, cut.b);
    const tag = single >= 0 ? rows[single].tag : null;
    const pre = multi ? `Cut ${ci + 1}: ` : '';
    plan.push(single >= 0 ? (scaled ? `multiply row ${tag} by $${u[single].toLatex()}$, then round` : `round row ${tag}`) : `combine the rows with $u=(${u.map((v) => v.toLatex()).join(',\\ ')})$, then round`);
    if (single < 0 || scaled) {
      steps.push({
        title: single < 0 ? `${pre}Combine the rows` : `${pre}Scale row ${tag}`,
        text: single < 0 ? `Multiply row $i$ by $u_i$ and add: $\\ \\sum_j (u^\\top A_j)\\,x_j\\le u^\\top b$.` : `Multiply row ${tag} by $${u[single].toLatex()}$. A positive multiplier keeps the row valid.`,
        fields: [{ type: 'table', label: single < 0 ? 'Aggregated row' : 'Scaled row', columns: cols, rows: [{ cells: cells(agg.a, agg.b) }] }],
        explain: `$${rt(agg.a, cut.op, agg.b)}$. It is valid for the LP relaxation because $u\\ge 0$.`,
      });
    }
    const intCoef = agg.a.every((v) => v.isInt());
    const floored = agg.a.filter((v) => !v.isInt());
    const roundText = intCoef
      ? `The coefficients are integers, so the left-hand side is an integer at every integer point. Round the right-hand side ${flip ? '<b>up</b>, because this row is “≥”' : 'down'}.`
      : flip
        ? 'Because $x\\ge 0$, rounding the coefficients <b>up</b> keeps a “≥” row valid; the left-hand side is then an integer, so the right-hand side can be rounded up too.'
        : 'Because $x\\ge 0$, flooring the coefficients keeps the row valid; because $x$ is integer, the left-hand side is then an integer and the right-hand side can be floored too.';
    const rhsWhy = flip
      ? `. Written as a “≤” row it is $${rt(cg.aggregated.a, '<=', cg.aggregated.b)}$; flooring gives $${rt(cg.cut.a, '<=', cg.cut.b)}$, which is $${cutT}$. So a “≥” row has its right-hand side rounded <b>up</b>: $\\lceil ${nt(agg.b)}\\rceil=${cut.b}$.`
      : ` (coefficients $\\lfloor u^\\top A_j\\rfloor$${floored.length ? `, e.g. ${floored.map((v) => `$\\lfloor ${v.toLatex()}\\rfloor=${v.floor()}$`).join(', ')} (the floor goes toward $-\\infty$)` : ''}; right-hand side $\\lfloor u^\\top b\\rfloor=\\lfloor ${nt(agg.b)}\\rfloor=${cut.b}$).`;
    steps.push({
      title: multi && single >= 0 && !scaled ? `${pre}Round row ${tag}` : `${pre}Round down`,
      text: roundText,
      fields: [{ type: 'ineq', label: multi ? 'Rounded inequality' : 'Chvátal–Gomory inequality', answer: cutText, answerText: cutText, order: names, placeholder: `e.g. ${names[0]} + ${names[1]} <= 4` }],
      explain: `$${cutT}$${rhsWhy}${spec.note ? ` ${spec.note}` : ''}`,
    });
    built.push({ cut, le: cg.cut, tex: cutT });
    if (spec.point) {
      const point = spec.point.map((v) => Frac.parse(String(v)));
      const lhs = dot(cut.a, point);
      const viol = flip ? lhs.lt(cut.b) : lhs.gt(cut.b);
      const fields = [
        { type: 'num', label: `Left-hand side of $${cutT}$ at this point`, answer: lhs },
        { type: 'choice', label: 'Is the point cut off?', options: YN, answer: viol ? 'yes' : 'no' },
      ];
      let compare = '';
      if (spec.compareWith !== undefined) {
        const other = built[spec.compareWith];
        const ab = cutImplies(lpRows, { a: cg.cut.a, b: cg.cut.b }, { a: other.le.a, b: other.le.b });
        const ba = cutImplies(lpRows, { a: other.le.a, b: other.le.b }, { a: cg.cut.a, b: cg.cut.b });
        const ans = ab && ba ? 'same' : ab ? 'this' : ba ? 'other' : 'neither';
        fields.push({ type: 'choice', stack: true, label: 'On the LP region, which inequality is stronger?', answer: ans, options: [
          { value: 'this', label: `$${cutT}$` },
          { value: 'other', label: `$${other.tex}$` },
          { value: 'same', label: 'They are equivalent there.' },
          { value: 'neither', label: 'Neither one implies the other.' },
        ] });
        compare = ans === 'this' ? ` On the LP region $${cutT}$ implies $${other.tex}$, but not the other way round: it is the stronger cut.`
          : ans === 'other' ? ` On the LP region $${other.tex}$ implies $${cutT}$: the earlier cut is the stronger one.`
            : ans === 'same' ? ' On the LP region the two inequalities imply each other.' : ' Neither inequality implies the other on the LP region.';
        if (spec.compareNote) compare += ` ${spec.compareNote}`;
      }
      steps.push({
        title: multi ? `${pre}Test a point` : 'Does it cut off the LP point?',
        text: spec.pointText || `The LP relaxation has the solution $(${names.map(vtex).join(', ')})=${ptTex(point, nt)}$.`,
        fields,
        explain: `$${nt(lhs)}${viol ? (flip ? '\\lt' : '\\gt') : (flip ? '\\ge' : '\\le')} ${cut.b}$: the point is ${viol ? 'cut off, while every integer feasible point still satisfies the inequality' : (multi ? 'not cut off by this inequality' : 'not cut off; a different choice of multipliers is needed to separate it')}.${compare}`,
      });
    }
  });
  const obj = inst.objective ? inst.objective.c.map(fr) : null;
  const lp0 = obj && inst.resolve ? solveLP({ sense: 'max', c: obj, rows: lpRows }) : null;
  const lp1 = lp0 ? solveLP({ sense: 'max', c: obj, rows: lpRows.concat(built.map((b) => ({ a: b.le.a, op: '<=', b: b.le.b }))) }) : null;
  if (lp0 && lp0.status === 'optimal' && lp1.status === 'optimal') {
    const integral = lp1.x.every((v) => v.isInt());
    steps.push({
      title: 'Re-solve the LP with the rounded rows',
      text: `Add ${built.length > 1 ? 'all the rounded rows' : 'the rounded row'} to the LP relaxation and solve it again.`,
      fields: [
        { type: 'num', label: 'New LP upper bound', answer: lp1.obj },
        { type: 'choice', label: 'Is the new LP optimum integer?', options: YN, answer: integral ? 'yes' : 'no' },
      ],
      explain: `The LP optimum moves from $${ptTex(lp0.x, nt)}$ to $${ptTex(lp1.x, nt)}$ and the bound from $${nt(lp0.obj)}$ to $${evalTex(obj, lp1.x, nt)}=${nt(lp1.obj)}$. ${integral ? 'The optimum is integer: it solves the integer program.' : 'The corner is still fractional, so rounding rows one at a time is not enough; the next idea is to combine rows (a Chvátal–Gomory cut).'}`,
    });
  }
  const head = obj ? `\\max\\ ${linTex(obj, names)}\\quad\\text{s.t.}\\quad ` : '';
  const rowList = rows.map((r) => `${rt(r.a, r.op, r.b)}${multi ? `\\ \\text{${r.tag}}` : ''}`).join(',\\qquad ');
  const hasGe = rows.some((r) => r.op === '>=');
  return {
    id: 'cg', topic: 't204', title: inst.title || 'Chvátal–Gomory rounding',
    statement: () => frag(
      obj
        ? `$$${head}${rowList},\\qquad ${names.map(vtex).join(', ')}\\in\\mathbb{Z}_+ .$$`
        : `The variables are nonnegative integers and satisfy $$${rowList}.$$`,
      multi ? `Work through these roundings in order, keeping every inequality obtained before: ${plan.join('; ')}.` : `Use the multipliers $u=(${specs[0].u.map((v) => Frac.parse(String(v)).toLatex()).join(',\\ ')})$.`,
    ),
    rules: `Chvátal–Gomory: for $u\\ge 0$, $\\ \\sum_j\\lfloor u^\\top A_j\\rfloor x_j\\le\\lfloor u^\\top b\\rfloor$ is valid for all integer $x\\ge 0$ with $Ax\\le b$.${hasGe ? ' A “≥” row is first written as “≤” (multiply by $-1$); this is the same as rounding its right-hand side <b>up</b>.' : ''}`,
    steps,
    wrapup: `Two roundings, two different reasons: coefficients may be floored because x ≥ 0, the right-hand side because the left-hand side has become an integer.${specs.some((s) => s.compareWith !== undefined) ? ' Scaling a row by a positive number before rounding is a Chvátal–Gomory cut with another multiplier; different multipliers give different cuts, and some are stronger.' : ''}`,
  };
}

function randomCG(rng, level) {
  const n = level === 3 ? 3 : 2;
  const names = n === 2 ? ['x', 'y'] : ['x1', 'x2', 'x3'];
  const mults = level === 1 ? ['1/2', '1/2'] : null;
  for (let t = 0; t < 600; t++) {
    const rows = [0, 1].map(() => ({ a: Array.from({ length: n }, () => (level >= 2 && rng.bool(0.25) ? -rng.int(1, 3) : rng.int(1, 5))), b: String(rng.int(6, 20)) }));
    const u = mults || [rng.pick(['1/2', '1/3', '2/3', '1/4', '3/4']), rng.pick(['1/2', '1/3', '2/3', '1/4', '1'])];
    const cg = chvatalGomory(rows.map((r) => ({ a: r.a, b: fr(r.b) })), u.map((v) => Frac.parse(v)));
    if (cg.aggregated.b.isInt()) continue;
    if (cg.cut.a.every((v) => v.isZero()) || cg.cut.a.some((v) => v.sign() < 0 && level < 2)) continue;
    const lp = solveLP({ sense: 'max', c: cg.cut.a.map((v) => (v.sign() > 0 ? v : fr(1))), rows: rows.map((r) => ({ a: r.a, op: '<=', b: r.b })) });
    if (lp.status !== 'optimal' || lp.x.every((v) => v.isInt())) continue;
    if (lp.x.some((v) => v.d > 20n)) continue;
    const viol = dot(cg.cut.a, lp.x).gt(cg.cut.b);
    if (!viol && rng.bool(0.75)) continue;
    return { rows, u, names, point: lp.x.map((v) => v.toString()) };
  }
  return { rows: [{ a: [1, 1], b: '6' }, { a: [-1, 1], b: '3' }], u: ['1/2', '1/2'], names: ['x', 'y'], point: ['3/2', '9/2'] };
}

export const cgDrill = {
  id: 'cg', title: 'Chvátal–Gomory rounding', topic: 't204', minutes: 5,
  blurb: 'Aggregate rows with multipliers, floor coefficients and right-hand side (round “≥” rows up), and test the cut on a point.',
  presets: [
    { id: 'round', label: 'x + y ≤ 6.3 (slides 204)', make: () => ({ rows: [{ a: [1, 1], b: '6.3' }], u: ['1'], names: ['x', 'y'], point: ['1.3', '5'], pointText: R`In the workshop model of slides 204 ($\max\ x+10y$ with $x\le 3$, $-x+y\le 3.7$, $x+y\le 6.3$), the LP optimum is $(x,y)=(1.3,\ 5)$.`, title: 'Integer rounding — x + y ≤ 6.3 (slides 204)' }) },
    {
      id: 'round2', label: 'Round both sloping rows (slides 204, reading version)',
      make: () => ({
        rows: [{ a: [1, 0], b: '3' }, { a: [-1, 1], b: '3.7' }, { a: [1, 1], b: '6.3' }], names: ['x', 'y'], objective: { c: [1, 10] }, resolve: true,
        cuts: [
          { u: ['0', '1', '0'], point: ['1.3', '5'], pointText: R`The LP relaxation has the solution $(x,y)=(1.3,\ 5)$, with upper bound 51.3.` },
          { u: ['0', '0', '1'], point: ['1.3', '5'], pointText: R`Test the same LP solution $(1.3,\ 5)$ on this row.` },
        ],
        title: 'Integer rounding — both sloping rows of the workshop (slides 204, reading version)',
      }),
    },
    { id: 'workshop', label: 'x + y ≤ 6 and y − x ≤ 3 (slides 204 reading version, 206)', make: () => ({ rows: [{ a: [1, 1], b: '6' }, { a: [-1, 1], b: '3' }], u: ['1/2', '1/2'], names: ['x', 'y'], point: ['3/2', '9/2'], title: 'Chvátal–Gomory — the rounded workshop rows (slides 204 reading version, 206)' }) },
    {
      id: '20e4', label: 'Three rows (a), (b), (c) (20E ex. 4)',
      make: () => ({
        rows: [{ a: [2, 3], b: '38/3', tag: '(a)' }, { a: [2, 1], b: '2/3', op: '>=', tag: '(b)' }, { a: ['-1/2', '3/2'], b: '7/4', tag: '(c)' }], names: ['x', 'y'], objective: { c: [1, 1] },
        cuts: [
          { u: ['1', '0', '0'], point: ['19/3', '0'], pointText: R`The point $(38/6,\ 0)$ satisfies all the original rows (it lies on row (a)).` },
          { u: ['0', '1', '0'], point: ['1/3', '0'], pointText: R`The point $(1/3,\ 0)$ satisfies the original rows and the rounded row (a).` },
          { u: ['0', '0', '1'], point: ['1/2', '4/3'], pointText: R`The point $(1/2,\ 4/3)$ satisfies the original rows (it lies on row (c)) and the rounded rows (a) and (b).`, note: R`The original row (c) stays in the model. The point $(0,\ 7/6)$, which lies on row (c), is removed by this cut.` },
          { u: ['0', '0', '2'], point: ['1/2', '4/3'], pointText: R`Test the same point $(1/2,\ 4/3)$ on the cut obtained by scaling first.`, compareWith: 2, compareNote: R`In words: $-x+3y\le3$ gives $y\le 1+x/3$, while coefficient flooring gives only $y\le 1+x$. The point $(0,\ 7/6)$ is removed by both cuts; $(1/2,\ 4/3)$ survives flooring but not scaling.` },
        ],
        title: 'Integer rounding of three rows — 20E exercise 4',
      }),
    },
  ],
  random: (rng, level) => ({ ...randomCG(rng, level), title: 'Chvátal–Gomory rounding — practice' }),
  build: buildCG,
};

// ---------------------------------------------------------------- Gomory cuts from the tableau
// Instance: { c, rows:[{a, b}], names, rounds?, fractional?, furtherRounding?:{point}, compare? }.
// fractional: also ask for the fractional form sum f_j col_j >= f_0 (20E ex. 5-6) instead of the "cut added" row;
// furtherRounding: after cut 1, round the cut once more and certify the given integer point (20E ex. 5);
// compare: after cut 1, also derive the cut of another fractional row and compare the two (20E ex. 6).
function colTex(col) { return col.kind === 'x' ? vtex(col.name) : `s_{${col.index + 1}}`; }
const colName = (col) => (col.kind === 'x' ? col.name : `s${col.index + 1}`);
// " (for example the fractional part of -1/3 is 2/3, not 1/3)", using the row's own first negative fractional coefficient.
const negEx = (coef) => { const v = coef.find((a) => a.sign() < 0 && !a.isInt()); return v ? ` (for example the fractional part of $${v.toLatex()}$ is $${v.fracPart().toLatex()}$, not $${v.abs().toLatex()}$)` : ''; };

function zRowTex(t) {
  const basic = new Set(t.rows.map((r) => r.basic));
  const terms = t.zrow.coef.map((d, j) => ({ d, j })).filter(({ d, j }) => !basic.has(j) && !d.isZero());
  return `z=${t.zrow.rhs.toLatex()}${terms.map(({ d, j }) => ` ${d.sign() > 0 ? '-' : '+'} ${d.abs().eq(ONE) ? '' : d.abs().toLatex()}${colTex(t.cols[j])}`).join('')}`;
}

function buildGomory(inst) {
  const { c, rows, names } = inst;
  const model = { c, rows: rows.map((r) => ({ a: r.a, op: '<=', b: r.b })), names };
  const maxRounds = inst.rounds || 1;
  const res = gomoryCuttingPlanes(model, 8);
  if (!res.rounds.length) throw new Error('The LP optimum is already integer: there is no Gomory cut to derive.');
  const use = res.rounds.slice(0, maxRounds);
  const steps = [];
  let further = null; // result of the optional further rounding step (20E ex. 5)
  use.forEach((rd, k) => {
    const t = rd.lp.tableau;
    const src = t.rows[rd.rowIndex];
    const cn = t.cols.map(colName);
    const basic = new Set(t.rows.map((r) => r.basic));
    const fracRows = t.rows.filter((r) => t.cols[r.basic].kind === 'x' && !r.rhs.isInt());
    const next = k + 1 < res.rounds.length ? res.rounds[k + 1].lp : res.final;
    const newSlack = `s_{${rd.lp.rowsLE.length + 1}}`;
    const red = reduceCut(rd.cut.a, rd.cut.b);
    const cutT = ineqTex(red.a, names, '<=', red.b);
    const cutText = ineqText(red.a, names, '<=', red.b);
    const lhsX = dot(red.a, rd.lp.x);
    const values = t.cols.map((_, j) => { const r = t.rows.find((row) => row.basic === j); return r ? r.rhs : ZERO; });
    const floorLhs = dot(rd.tableauCut.coef, values);
    const tie = fracRows.filter((r) => r.rhs.fracPart().eq(src.rhs.fracPart())).length > 1;
    const ff = gomoryFractionalForm(t, rd.rowIndex);
    const useFrac = inst.fractional && ff.coef.some((v) => !v.isZero());
    const ffTex = ineqTex(ff.coef, cn, '>=', ff.rhs);
    const ffText = ineqText(ff.coef, cn, '>=', ff.rhs);
    const floorCols = t.cols.map((col, j) => ({ key: `c${j}`, head: `$${colTex(col)}$`, kind: 'num', plain: col.name })).concat([{ key: 'rhs', head: 'RHS', kind: 'num', plain: 'right-hand side' }]);
    const floorCells = { ...Object.fromEntries(rd.tableauCut.coef.map((v, j) => [`c${j}`, v])), rhs: rd.tableauCut.rhs };
    const slackUsed = t.cols.map((col, j) => ({ col, j })).filter(({ col, j }) => col.kind === 's' && !rd.tableauCut.coef[j].isZero());
    const fields1 = [
      { type: 'choice', label: 'Source row (basic variable)', options: t.rows.map((r) => ({ value: r.name, label: `$${colTex(t.cols[r.basic])}$` })), answer: src.name },
      { type: 'table', label: 'Floor every coefficient and the right-hand side of that row', columns: floorCols, rows: [{ cells: floorCells }] },
    ];
    if (useFrac) {
      fields1.push({ type: 'ineq', label: 'The same cut in fractional form (subtract the floored row from the tableau row)', answer: ffText, answerText: ffText, order: cn, placeholder: 'e.g. (1/3)s1 + (2/3)s2 >= 1/2' });
      fields1.push({ type: 'num', label: 'Left-hand side of the fractional form at the current LP optimum', answer: ZERO });
    } else {
      fields1.push({ type: 'num', label: 'Left-hand side of the floored row at the current LP optimum', answer: floorLhs });
    }
    steps.push({
      title: `Cut ${k + 1}: source row and rounding`,
      text: () => frag(
        k === 0 ? 'Optimal tableau of the LP relaxation:' : `After adding cut ${k}, the new optimal tableau (slack $s_{${rd.lp.rowsLE.length}}$ belongs to that cut):`,
        tableauTable(t),
        `LP optimum: $(${names.map(vtex).join(', ')})=(${rd.lp.x.map((v) => v.toLatex()).join(',\\ ')})$, $z=${rd.lp.obj.toLatex()}$.`,
      ),
      fields: fields1,
      explain: () => frag(
        `Fractional parts of the right-hand sides of the basic decision variables: ${t.rows.filter((r) => t.cols[r.basic].kind === 'x').map((r) => `$${colTex(t.cols[r.basic])}$: $${r.rhs.fracPart().toLatex()}$`).join(', ')}. The largest is in the row of $${colTex(t.cols[src.basic])}$${tie ? ' (a tie: take the row listed first)' : ''}.`,
        ` Source row: $${linTex(src.coef, cn)}=${src.rhs.toLatex()}$. All variables are nonnegative integers, so flooring gives $${ineqTex(rd.tableauCut.coef, cn, '<=', rd.tableauCut.rhs)}$.`,
        useFrac
          ? ` Subtracting this floored row from the tableau row leaves the fractional parts $a-\\lfloor a\\rfloor$${negEx(src.coef)}: $${ffTex}$. At the LP optimum every nonbasic variable is 0, so it reads $0\\ge ${ff.rhs.toLatex()}$, which is false: the cut is violated.`
          : ` At the LP optimum the nonbasic variables are 0, so the floored row's left-hand side is $${floorLhs.toLatex()}\\gt ${rd.tableauCut.rhs.toLatex()}$: the current point violates it.`,
        tableauTable(t, { highlightRow: rd.rowIndex }),
      ),
    });
    const rounding = k === 0 && inst.furtherRounding;
    const resolveText = !next.unique
      ? `Re-solving gives the bound $z=${next.obj.toLatex()}$, reached by several LP solutions (the optimum is no longer unique).${rounding ? ' The sheet does not re-solve here: it rounds the cut once more (next step).' : ''}`
      : `Re-solving gives $(${next.x.map((v) => v.toLatex()).join(',\\ ')})$ with $z=${next.obj.toLatex()}$${next.x.every((v) => v.isInt()) ? ', which is integer: the problem is solved.' : rounding ? ', still fractional. The sheet rounds the cut once more instead (next step).' : ', still fractional: another cut is needed.'}${inst.fractional && !rounding ? ' (This re-solve is computed here; it is beyond the sheet.)' : ''}`;
    steps.push({
      title: `Cut ${k + 1}: back to the original variables`,
      text: slackUsed.length ? `Substitute the slack${slackUsed.length > 1 ? 's' : ''} ${slackUsed.map(({ col }) => `$s_{${col.index + 1}}=${rd.lp.rowsLE[col.index].b.toLatex()}-(${linTex(rd.lp.rowsLE[col.index].a, names)})$`).join(', ')} and simplify.` : 'No slack variable appears in the rounded row, so it is already in the original variables.',
      fields: [
        { type: 'ineq', label: `Cut ${k + 1} in $${names.map(vtex).join(', ')}$`, answer: cutText, answerText: cutText, order: names, placeholder: `e.g. ${names[0]} - ${names[1]} <= 1` },
        { type: 'num', label: 'Left-hand side of the cut at the current LP optimum (write the cut as “… ≤ number” with whole-number coefficients that share no common factor)', answer: lhsX },
        { type: 'choice', label: 'Is the current LP optimum cut off?', options: YN, answer: 'yes' },
      ],
      explain: `$${ineqTex(rd.cut.a, names, '<=', rd.cut.b)}$${red.factor.gt(ONE) ? `; dividing by ${red.factor} gives $${cutT}$. The cut enters the model as $${ineqTex(rd.cut.a, names, '<=', rd.cut.b)}$, with integer data, so its slack $${newSlack}$ is an integer too` : ''}. At the LP optimum the left-hand side is $${lhsX.toLatex()}\\gt ${red.b.toLatex()}$, so the point is removed; a Gomory cut always cuts off the vertex it was read from.${useFrac ? ` ${resolveText}` : ''}`,
    });
    if (!useFrac) {
      const cr = gomoryCutRow(t, rd.rowIndex);
      const nb = t.cols.map((col, j) => ({ col, j })).filter(({ j }) => !basic.has(j));
      steps.push({
        title: `Cut ${k + 1}: into the tableau`,
        text: `Add the cut to the model with a new integer slack: $${linTex(rd.cut.a, names)}+${newSlack}=${rd.cut.b.toLatex()}$. The current basic variables appear in it, so eliminate them: use each one's tableau row to write it in the nonbasic variables. What is the new row, written in the nonbasic variables (coefficient 1 on $${newSlack}$)?`,
        fields: [{ type: 'table', label: `New row of $${newSlack}$`, columns: nb.map(({ col, j }) => ({ key: `n${j}`, head: `$${colTex(col)}$`, kind: 'num', plain: col.name })).concat([{ key: 'rhs', head: 'RHS', kind: 'num', plain: 'right-hand side' }]), rows: [{ cells: { ...Object.fromEntries(nb.map(({ j }) => [`n${j}`, cr.coef[j]])), rhs: cr.rhs } }] }],
        explain: `New row: $${linTex(nb.map(({ j }) => cr.coef[j]), nb.map(({ col }) => colName(col)))}+${newSlack}=${cr.rhs.toLatex()}$. The right-hand side is negative: the new basic variable $${newSlack}$ would equal $${cr.rhs.toLatex()}$, so the current corner is no longer feasible and the LP is re-optimised. A shortcut (derived here, beyond the slides; it matches every slide tableau): the new row is the floored row minus the source row, so its coefficients are minus the fractional parts of the source row and its right-hand side is $-${src.rhs.fracPart().toLatex()}$. ${resolveText}`,
      });
    }
    if (rounding && red.a.every((v) => v.isInt()) && !red.b.isInt()) {
      const strong = { a: red.a, b: red.b.floor() };
      const sText = ineqText(strong.a, names, '<=', strong.b);
      const pt = inst.furtherRounding.point.map(fr);
      const val = dot(c, pt);
      const lp2 = solveLP({ sense: 'max', c, rows: model.rows.concat([{ a: strong.a, op: '<=', b: strong.b }]) });
      const feasible = model.rows.every((r) => dot(r.a, pt).le(fr(r.b))) && dot(strong.a, pt).le(strong.b);
      const optimal = feasible && val.eq(lp2.obj);
      further = { strong, lp2, pt, val, optimal };
      steps.push({
        title: 'A further rounding step',
        text: `The cut $${cutT}$ has whole-number coefficients, so its left-hand side is an integer at every integer point. This is a separate step, after the tableau cut.`,
        fields: [
          { type: 'ineq', label: 'Strengthened inequality', answer: sText, answerText: sText, order: names, placeholder: `e.g. ${names[0]} + ${names[1]} <= 3` },
          { type: 'num', label: `Objective value of the integer point $${ptTex(pt)}$`, answer: val },
          { type: 'choice', label: `Does this prove that $${ptTex(pt)}$ is optimal?`, options: YN, answer: optimal ? 'yes' : 'no' },
        ],
        explain: `Round the right-hand side down: $${ineqTex(strong.a, names, '<=', strong.b)}$. With it the LP bound is $${lp2.obj.toLatex()}$, and the integer point $${ptTex(pt)}$ ${optimal ? `reaches $${val.toLatex()}$, so it is optimal: no integer point can do better` : `has value $${val.toLatex()}$ only, so optimality is not proved yet`}. Keep the tableau cut and this extra rounding distinct.`,
      });
    }
    const others = fracRows.filter((r) => r !== src);
    if (k === 0 && inst.compare && others.length) {
      const o = others[0];
      const oi = t.rows.indexOf(o);
      const ofl = gomoryFloorCut(t, oi);
      const oc = substituteSlacks(ofl, rd.lp);
      const ored = reduceCut(oc.a, oc.b);
      const oTex = ineqTex(ored.a, names, '<=', ored.b);
      const oText = ineqText(ored.a, names, '<=', ored.b);
      const off = gomoryFractionalForm(t, oi);
      const ab = cutImplies(model.rows, { a: red.a, b: red.b }, { a: ored.a, b: ored.b });
      const ba = cutImplies(model.rows, { a: ored.a, b: ored.b }, { a: red.a, b: red.b });
      const ans = ab && ba ? 'same' : ab ? 'src' : ba ? 'other' : 'neither';
      const oLhs = dot(ored.a, rd.lp.x);
      const srcV = `$${colTex(t.cols[src.basic])}$`, othV = `$${colTex(t.cols[o.basic])}$`;
      const again = ored.a.every((v) => v.isInt()) && !ored.b.isInt() ? ` Rounding $${oTex}$ once more would give $${ineqTex(ored.a, names, '<=', ored.b.floor())}$.` : '';
      steps.push({
        title: `Compare with the cut from the ${colName(t.cols[o.basic])} row`,
        text: `Build the Gomory cut from the ${othV} row as well, even though the rule did not pick it.`,
        fields: [
          { type: 'ineq', label: `Cut from the ${othV} row, in $${names.map(vtex).join(', ')}$`, answer: oText, answerText: oText, order: names, placeholder: `e.g. ${names[1]} <= 2` },
          { type: 'choice', label: 'Does it also cut off the current LP optimum?', options: YN, answer: oLhs.gt(ored.b) ? 'yes' : 'no' },
          { type: 'choice', stack: true, label: 'On the LP region, which cut is stronger?', answer: ans, options: [
            { value: 'src', label: `The cut from the ${srcV} row` },
            { value: 'other', label: `The cut from the ${othV} row` },
            { value: 'same', label: 'They are equivalent there.' },
            { value: 'neither', label: 'Neither one implies the other.' },
          ] },
        ],
        explain: `The ${othV} row is $${linTex(o.coef, cn)}=${o.rhs.toLatex()}$. Fractional form: $${ineqTex(off.coef, cn, '>=', off.rhs)}$${negEx(o.coef)}. Floored row $${ineqTex(ofl.coef, cn, '<=', ofl.rhs)}$; after substituting the slacks, $${oTex}$. At the LP optimum its left-hand side is $${oLhs.toLatex()}${oLhs.gt(ored.b) ? '\\gt' : '\\le'} ${ored.b.toLatex()}$. ${ans === 'src' ? `On the LP region $${cutT}$ implies $${oTex}$ but not the reverse: the ${srcV}-row cut is stronger (before any further rounding).` : ans === 'other' ? `On the LP region $${oTex}$ implies $${cutT}$: the ${othV}-row cut is stronger.` : ans === 'same' ? 'The two cuts imply each other on the LP region.' : 'Neither cut implies the other on the LP region.'}${again}`,
      });
    }
  });
  const total = res.rounds.length;
  const solved = res.status === 'integral';
  steps.push({
    title: 'Where the method stands',
    fields: [
      { type: 'num', label: 'LP bound before any cut', answer: res.rounds[0].lp.obj },
      { type: 'num', label: `LP bound after cut ${use.length}`, answer: (use.length < total ? res.rounds[use.length].lp : res.final).obj },
      { type: 'choice', stack: true, label: 'Each Gomory cut', answer: 'valid', options: [
        { value: 'valid', label: 'keeps every integer feasible point and can only lower the LP bound of a maximisation.' },
        { value: 'heur', label: 'may remove integer feasible points, so the result must be checked.' },
        { value: 'raise', label: 'raises the LP bound, because the feasible region gets larger.' },
      ] },
    ],
    explain: () => frag(
      `The bound goes $${res.rounds.map((r) => r.lp.obj.toLatex()).concat([res.final.obj.toLatex()]).slice(0, use.length + 1).join('\\ \\to\\ ')}$. ${further ? `With the further rounding step, $${ineqTex(further.strong.a, names, '<=', further.strong.b)}$ brings the LP bound to $${further.lp2.obj.toLatex()}$${further.optimal ? `, and the integer point $${ptTex(further.pt)}$ reaches it: the optimal value is $${further.val.toLatex()}$` : ''}.` : !solved ? '' : total > use.length ? `Continuing with the same rule, ${total} cuts in all reach the integer optimum $z=${res.final.obj.toLatex()}$ at $(${res.final.x.map((v) => v.toLatex()).join(', ')})$.` : `The integer optimum is $z=${res.final.obj.toLatex()}$ at $(${res.final.x.map((v) => v.toLatex()).join(', ')})$.`}${inst.fractional && !further ? ' The sheet does not re-solve: the bound after the cut, the optimum and the final tableau are computed here (beyond the sheet).' : ''}`,
      solved && !further ? `Final tableau${total > use.length ? ` (after all ${total} cuts)` : ''}: every basic variable is integer, and the objective row reads $${zRowTex(res.final.tableau)}\\le ${res.final.tableau.zrow.rhs.toLatex()}$ because the nonbasic variables are nonnegative.` : '',
      solved && !further ? tableauTable(res.final.tableau) : '',
    ),
  });
  return {
    id: 'gomory', topic: 't204', title: inst.title || 'Gomory cuts from the tableau',
    statement: () => frag(`Pure integer program: $$\\max\\ ${linTex(c, names)}\\quad\\text{s.t.}\\quad ${rows.map((r) => ineqTex(r.a, names, '<=', r.b)).join(',\\quad ')},\\quad ${names.map(vtex).join(', ')}\\in\\mathbb{Z}_+ .$$ Slack variables $s_i$ are numbered in the order of the constraints. All data are integer, so the slacks are integer too. The tableaux below leave out the slides' $z$ column (it is 0 in every constraint row and 1 in the $z$ row).`),
    rules: 'Source row: among the basic <b>decision</b> variables with a fractional value, take the largest fractional part of the right-hand side (ties: the row listed first). Read the row as “≤”, floor every coefficient and the right-hand side, then substitute the slacks.',
    steps,
    wrapup: 'The floor step is Chvátal–Gomory rounding applied to a tableau row. If a constraint has fractional data, scale it to integers first, otherwise its slack is not an integer variable and the rounding is not valid.',
  };
}

function randomGomory(rng, level) {
  const names = ['x1', 'x2'];
  for (let t = 0; t < 1500; t++) {
    const rows = [{ a: [rng.int(1, 5), rng.int(1, 5)], b: rng.int(8, 24) }, { a: [rng.int(-2, 4), rng.int(1, 4)], b: rng.int(4, 16) }];
    if (level >= 2 && rng.bool(0.5)) rows.push({ a: rng.bool() ? [1, 0] : [0, 1], b: rng.int(2, 5) });
    if (rows[1].a[0] === 0) continue;
    const c = [rng.int(1, 6), rng.int(1, 6)];
    let res;
    try { res = gomoryCuttingPlanes({ c, rows: rows.map((r) => ({ a: r.a, op: '<=', b: r.b })), names }, 6); } catch { continue; }
    if (res.status !== 'integral' || !res.rounds.length) continue;
    const want = level === 1 ? 1 : 2;
    if (res.rounds.length < want || res.rounds.length > 4) continue;
    const ok = res.rounds.slice(0, want).every((rd) => rd.lp.unique && rd.lp.tableau.rows.every((r) => r.coef.concat([r.rhs]).every((v) => v.d <= 12n)) && !rd.cut.a.every((v) => v.isZero()));
    if (!ok) continue;
    return { c, rows, names, rounds: want };
  }
  return { c: [4, -1], rows: [{ a: [7, -2], b: 14 }, { a: [0, 1], b: 3 }, { a: [2, -2], b: 3 }], names, rounds: 2 };
}

export const gomoryDrill = {
  id: 'gomory', title: 'Gomory cuts from the tableau', topic: 't204', minutes: 15,
  blurb: 'Pick the source row, floor it, substitute the slacks, check the cut and put it into the tableau, on exact simplex tableaux.',
  presets: [
    { id: 'ex1', label: 'Example 1 (slides 204)', make: () => ({ c: [4, -1], rows: [{ a: [7, -2], b: 14 }, { a: [0, 1], b: 3 }, { a: [2, -2], b: 3 }], names: ['x1', 'x2'], rounds: 2, title: 'Gomory cuts — example 1 (slides 204)' }) },
    { id: 'workshop', label: 'Workshop, rows scaled by 10 (slides 204)', make: () => ({ c: [1, 10], rows: [{ a: [1, 0], b: 3 }, { a: [-10, 10], b: 37 }, { a: [10, 10], b: 63 }], names: ['x', 'y'], rounds: 3, title: 'Gomory cuts — workshop with integer data (slides 204)' }) },
    { id: '20e5', label: '2x + y ≤ 4, x + 2y ≤ 4 (20E ex. 5)', make: () => ({ c: [1, 1], rows: [{ a: [2, 1], b: 4 }, { a: [1, 2], b: 4 }], names: ['x', 'y'], rounds: 1, fractional: true, furtherRounding: { point: ['2', '0'] }, title: 'Gomory cut from the x row — 20E exercise 5' }) },
    { id: '20e6', label: '2x + y ≤ 5, −x + 2y ≤ 2 (20E ex. 6)', make: () => ({ c: [1, 2], rows: [{ a: [2, 1], b: 5 }, { a: [-1, 2], b: 2 }], names: ['x', 'y'], rounds: 1, fractional: true, compare: true, title: 'Two rows, two Gomory cuts — 20E exercise 6' }) },
  ],
  random: (rng, level) => ({ ...randomGomory(rng, level), title: 'Gomory cuts — practice' }),
  build: buildGomory,
};

// ---------------------------------------------------------------- mixed-integer rounding
// Capacity instance: { kind:'capacity', a, U, xub?, maxY?, story? }  (y <= a x, 0 <= y <= U, x integer).
function buildMirCapacity(inst) {
  const { a, U } = inst;
  const m = mirCapacityCut(a, U);
  const k = m.k, f = m.f;
  const af = fr(a).mul(f);
  const cutText = ineqText([m.slope.neg(), 1], ['x', 'y'], '<=', m.intercept);
  const xbar = m.lpVertex.x;
  if (inst.xub !== undefined && fr(inst.xub).lt(xbar)) throw new Error('The bound on x must keep the fractional vertex.');
  const C0 = fr(U).div(af), C1 = ONE.div(f).sub(ONE);
  const branchTex = `${C0.toLatex()}-${C1.eq(ONE) ? '' : C1.toLatex()}x`;
  const cons = [`y\\le ${a}x`, `0\\le y\\le ${U}`].concat(inst.xub !== undefined ? [`0\\le x\\le ${inst.xub}`] : []);
  const yAt = (x) => m.intercept.add(m.slope.mul(x));
  return {
    id: 'mir', topic: 't205', title: inst.title || 'Mixed-integer rounding',
    statement: () => frag(`${inst.maxY ? 'Mixed-integer program' : 'Mixed-integer set'}: $$${inst.maxY ? '\\max\\ y\\quad\\text{s.t.}\\quad ' : ''}${cons.join(',\\qquad ')},\\qquad x\\in\\mathbb{Z}_+,\\ y\\in\\mathbb{R}_+.$$ ${inst.story === false ? 'The quantity $y$ is continuous; $x$ is integer.' : `Think of $x$ as the number of machines of capacity ${a} and $y$ as the production, limited to ${U} (an illustration of this app, not on the slides).`}`),
    rules: 'Basic MIR: if $z+u\\ge k+f$ with $z$ integer, $u\\ge 0$, $k$ integer and $0\\lt f\\lt 1$, then $z+\\dfrac{u}{f}\\ge k+1$.',
    steps: [
      {
        title: 'The fractional vertex',
        text: `Maximising $y$ while using as little $x$ as possible, the LP relaxation reaches the vertex where $y=${U}$ and $y=${a}x$.`,
        fields: [{ type: 'num', label: '$\\bar x$ at this vertex', answer: xbar }, { type: 'num', label: '$\\bar y$', answer: U }],
        explain: `$\\bar y=${U}$ and $\\bar x=${U}/${a}=${dtex(xbar)}$, which is fractional.`,
      },
      {
        title: 'Bring the row into the basic form',
        text: `Let $s=${U}-y\\ge 0$. From $y\\le ${a}x$: $${a}x+s\\ge ${U}$, that is $x+\\dfrac{s}{${a}}\\ge ${dtex(xbar)}$. Identify $k$ and $f$.`,
        fields: [{ type: 'int', label: '$k$', answer: k }, { type: 'num', label: '$f$', answer: f }],
        explain: `$${dtex(xbar)}=${k}+${dtex(f)}$, so $k=${k}$ and $f=${dtex(f)}$, with $z=x$ and $u=s/${a}$.`,
      },
      {
        title: 'Apply MIR and return to x and y',
        fields: [{ type: 'ineq', label: 'MIR inequality in $x$ and $y$', answer: cutText, answerText: cutText, order: ['x', 'y'], placeholder: 'e.g. y <= 6 + 4x' }],
        explain: `$x+\\dfrac{s/${a}}{${dtex(f)}}\\ge ${k.add(1)}$, i.e. $x+\\dfrac{s}{${af.toLatex()}}\\ge ${k.add(1)}$. With $s=${U}-y$: $\\ y\\le ${m.intercept.toLatex()}+${m.slope.toLatex()}x$.`,
      },
      {
        title: 'Check validity on both sides of the split',
        text: `Every integer $x$ has $x\\le ${k}$ or $x\\ge ${k.add(1)}$. If $x\\le ${k}$, the row gives $s\\ge ${U}-${a}x$, so $x+\\dfrac{s}{${af.toLatex()}}\\ge x+\\dfrac{${U}-${a}x}{${af.toLatex()}}=${branchTex}$.`,
        fields: [
          { type: 'num', label: `Value of $${branchTex}$ at $x=${k}$ (its smallest value when $x\\le ${k}$)`, answer: k.add(1) },
          { type: 'choice', label: `If $x\\ge ${k.add(1)}$, does $x+\\dfrac{s}{${af.toLatex()}}\\ge ${k.add(1)}$ always hold?`, answer: 'yes', options: [{ value: 'yes', label: 'Yes, because $s\\ge 0$' }, { value: 'no', label: 'No, it depends on the value of $s$' }] },
        ],
        explain: `If $x\\le ${k}$: $${branchTex}\\ge ${C0.toLatex()}-${C1.eq(ONE) ? '' : `${C1.toLatex()}\\cdot `}${k}=${k.add(1)}$. If $x\\ge ${k.add(1)}$: $x+\\dfrac{s}{${af.toLatex()}}\\ge x\\ge ${k.add(1)}$ because $s\\ge 0$. Both integer branches satisfy the cut, so it removes no feasible point.`,
      },
      {
        title: 'Check the cut',
        fields: [
          { type: 'num', label: `Largest $y$ the cut allows at $x=${k}$`, answer: yAt(k) },
          { type: 'num', label: `Largest $y$ the cut allows at $x=${k.add(1)}$`, answer: yAt(k.add(1)) },
          { type: 'num', label: 'Largest $y$ the cut allows at $x=\\bar x$', answer: yAt(xbar) },
          { type: 'choice', label: 'Is the LP vertex cut off?', options: YN, answer: 'yes' },
        ],
        explain: `At $x=${k}$ the cut gives $y\\le ${yAt(k).toLatex()}=${a}\\cdot ${k}$ and at $x=${k.add(1)}$ it gives $y\\le ${U}$: it passes through the two integer-$x$ points $(${k},${fr(a).mul(k).toLatex()})$ and $(${k.add(1)},${U})$, so it is an edge of the convex hull of the feasible set (in two dimensions an edge is a facet, see lecture 206). At $\\bar x=${dtex(xbar)}$ it allows only $y\\le ${dtex(yAt(xbar))}\\lt ${U}$, so the vertex $(${dtex(xbar)},\\ ${U})$ is cut off.`,
      },
    ],
    wrapup: 'MIR is integer rounding for rows that also contain continuous variables: the continuous part is divided by the fractional part f instead of being rounded away.',
  };
}

// Mixed row instance: { kind:'mixed', aInt, b, names, c? }  meaning  sum a_j x_j - c z <= b  (legacy form), or with
// cont:{name, coef, ub?} the row  sum a_j x_j + coef * name <= b. A plus sign needs the upper bound ub (complement).
// Optional: bounds (upper bounds of the integer variables), objective:{sense, c} over all variables,
// point (the check point, all variables), checkFirst (first check the point in the LP), boundSource (bounds are on the source).
function buildMirMixed(inst) {
  const { names } = inst;
  const aInt = inst.aInt.map(fr);
  const B = Frac.parse(String(inst.b));
  const cont = inst.cont || { name: 'z', coef: -(inst.c || 1) };
  const cname = cont.name;
  const g = fr(cont.coef);
  const ub = cont.ub !== undefined ? fr(cont.ub) : null;
  const all = names.concat([cname]);
  const m = mirContinuousRow(aInt, g, B, ub);
  if (!m.applicable) throw new Error('The right-hand side must be fractional for MIR.');
  const comp = m.complemented;
  const cAbs = g.abs();
  const f = m.f;
  const ints = m.intForm;
  const cutT = rowTex(ints.a, all, '<=', ints.b);
  const cutText = ineqText(ints.a, all, '<=', ints.b);
  const rowCoef = aInt.concat([g]);
  const rowT = rowTex(rowCoef, all, '<=', B);
  const lin = linTex(aInt, names);
  const uCore = comp ? `${dtex(ub)}-${vtex(cname)}` : vtex(cname);
  const uTex = cAbs.eq(ONE) ? uCore : `${cAbs.toLatex()}${comp ? `(${uCore})` : uCore}`;
  const uTexP = comp && cAbs.eq(ONE) ? `(${uCore})` : uTex; // inside a sum
  // LP data (bounds as rows) for the point checks and the bounds
  const nInt = names.length;
  const unit = (j) => all.map((_, i) => (i === j ? 1 : 0));
  const boundRows = (inst.bounds || []).map((v, j) => ({ a: unit(j), op: '<=', b: v })).concat(ub !== null ? [{ a: unit(nInt), op: '<=', b: ub }] : []);
  const lpRows = [{ a: rowCoef, op: '<=', b: B }].concat(boundRows);
  const obj = inst.objective ? { sense: inst.objective.sense || 'max', c: inst.objective.c.map(fr) } : null;
  const point = inst.point ? inst.point.map((v) => Frac.parse(String(v))) : [m.shifted.div(aInt[0])].concat(aInt.slice(1).map(() => ZERO), [comp ? ub : ZERO]);
  const rowLhs = dot(rowCoef, point);
  const inLP = rowLhs.le(B) && point.every((v) => v.sign() >= 0) && boundRows.every((r) => dot(r.a, point).le(fr(r.b)));
  const fracInts = names.map((nm, j) => ({ nm, v: point[j] })).filter(({ v }) => !v.isInt());
  const lp0 = obj ? solveLP({ sense: obj.sense, c: obj.c, rows: lpRows }) : null;
  const lp1 = obj ? solveLP({ sense: obj.sense, c: obj.c, rows: lpRows.concat([{ a: ints.a, op: '<=', b: ints.b }]) }) : null;
  const isOpt = !!(lp0 && lp0.status === 'optimal' && inLP && dot(obj.c, point).eq(lp0.obj));
  const cutLhs = dot(ints.a, point);
  const uAt = comp ? ub.sub(point[nInt]) : point[nInt];
  const steps = [];
  if (inst.checkFirst) {
    steps.push({
      title: 'Check the point in the LP relaxation',
      text: `Take the point $(${all.map(vtex).join(',')})=${ptTex(point)}$.`,
      fields: [
        { type: 'num', label: `Left-hand side of the row $${rowT}$ at the point`, answer: rowLhs },
        { type: 'choice', label: 'Is the point feasible for the LP relaxation?', options: YN, answer: inLP ? 'yes' : 'no' },
      ],
      explain: `The bounds ${inLP ? 'hold' : 'are checked one by one'} and the row's left-hand side is $${evalTex(rowCoef, point)}${rowLhs.eq(B) ? '=' : `=${dtex(rowLhs)}${rowLhs.lt(B) ? '\\lt ' : '\\gt '}`}${dtex(B)}$${inLP ? `: the point is feasible for the LP relaxation${rowLhs.eq(B) ? ' (the row is tight)' : ''}` : ': the point is not LP-feasible'}${fracInts.length ? `, but ${fracInts.map(({ nm, v }) => `$${vtex(nm)}=${dtex(v)}$`).join(', ')} ${fracInts.length > 1 ? 'are' : 'is'} not an integer` : ''}.${comp ? ` The base inequality is $${rowT}$; the upper bound $${vtex(cname)}\\le ${dtex(ub)}$ supplies the nonnegative complement $${dtex(ub)}-${vtex(cname)}$.` : ''}`,
    });
  }
  steps.push(comp
    ? {
      title: 'Basic form: complement the continuous variable',
      text: `In this “≤” row $${vtex(cname)}$ has a plus sign. After multiplying by $-1$ it would appear as $-${vtex(cname)}$, which is 0 or negative, so it cannot be the continuous part $u$ (MIR needs $u\\ge 0$). Use its upper bound instead: $u=${uTex}\\ge 0$. With the integer $w=-(${lin})$, write the row as $w+u\\ge k+f$.`,
      fields: [
        { type: 'num', label: 'Right-hand side of $w+u\\ge\\ \\dots$', answer: m.basicRhs },
        { type: 'int', label: '$k$', answer: m.k },
        { type: 'num', label: '$f$', answer: f },
      ],
      explain: `$${rowT}$ is the same as $-(${lin})+${uTexP}\\ge -${dtex(B)}+${dtex(cAbs.mul(ub))}=${dtex(m.basicRhs)}$ (multiply by $-1$, then add $${dtex(cAbs.mul(ub))}$ to both sides). Then $${dtex(m.basicRhs)}=${m.k}+${dtex(f)}$: $k=\\lfloor ${dtex(m.basicRhs)}\\rfloor=${m.k}$ (the floor goes toward $-\\infty$) and $f=${dtex(f)}$, always between 0 and 1.`,
    }
    : {
      title: 'Basic form',
      text: `Write the row as $w+u\\ge k+f$ with $w=-(${lin})$ (an integer) and $u=${uTex}\\ge 0$.`,
      fields: [{ type: 'int', label: '$k$', answer: m.k }, { type: 'num', label: '$f$', answer: f }],
      explain: `$w+u\\ge -${dtex(B)}$, and $-${dtex(B)}=${m.k}+${dtex(f)}$: $k=\\lfloor -${dtex(B)}\\rfloor=${m.k}$, $f=${dtex(f)}$. Here $f$ is the fractional part of $-b$, not of $b$; equivalently $f=\\lceil b\\rceil-b$ (a shortcut derived here, not on the slides). Some books write $f_0=b-\\lfloor b\\rfloor$ for the “≤” row and divide by $1-f_0$: that $1-f_0$ is this $f$.`,
    });
  steps.push(comp
    ? {
      title: 'The MIR inequality',
      fields: [
        { type: 'int', label: 'Right-hand side of $w+\\dfrac{u}{f}\\ge\\ \\dots$', answer: m.k.add(1) },
        { type: 'ineq', label: `MIR cut in $${all.map(vtex).join(', ')}$ (clear the fractions)`, answer: cutText, answerText: cutText, order: all, placeholder: 'e.g. 2x1 + 2x2 + 3y <= 9' },
      ],
      explain: `$w+\\dfrac{u}{f}\\ge k+1$ gives $-(${lin})+\\dfrac{${uTex}}{${dtex(f)}}\\ge ${m.k.add(1)}$. ${ints.factor.gt(ONE) ? `Multiply by ${ints.factor} and rearrange` : 'Rearrange'}: $\\boxed{${cutT}}$. Only the continuous part is divided by $f$.`,
    }
    : {
      title: 'The MIR inequality',
      fields: [
        { type: 'num', label: `Coefficient of $${vtex(cname)}$ in the cut, with its sign (keep the coefficients of the integer variables as in the row)`, answer: m.a[nInt] },
        { type: 'ineq', label: 'MIR inequality', answer: cutText, answerText: cutText, order: all, placeholder: 'e.g. x + y - 2z <= 2' },
      ],
      explain: `$w+\\dfrac{u}{f}\\ge k+1$ gives $-(${lin})+${m.uCoef.toLatex()}${vtex(cname)}\\ge ${m.k.add(1)}$, i.e. $${rowTex(m.a, all, '<=', m.rhs)}$${ints.factor.gt(ONE) ? `, or $${cutT}$ with whole numbers` : ''}. The right-hand side is $\\lfloor b\\rfloor$ and the continuous coefficient is divided by $f$.`,
    });
  const viol = cutLhs.gt(ints.b);
  const desc = inst.point
    ? `${isOpt ? 'is an optimal solution of the LP relaxation' : 'is feasible for the LP relaxation'}${rowLhs.eq(B) ? ' and satisfies the row with equality' : ''}`
    : 'satisfies the original row with equality';
  let tail;
  if (!inst.point && !comp) tail = ` With $${vtex(cname)}=0$ the cut reads $${lin}\\le ${dtex(m.rhs)}$ (pure integer rounding); the point has left-hand side $${dtex(B)}\\gt ${dtex(m.rhs)}$ and is cut off. When $${vtex(cname)}\\gt 0$ the cut is relaxed at rate $${m.uCoef.toLatex()}$ per unit of $${vtex(cname)}$ instead of $${cAbs.toLatex()}$.`;
  else tail = uAt.isZero() ? ` At this point $u=${comp ? `${dtex(ub)}-${vtex(cname)}` : vtex(cname)}=0$, so only the integer rounding part of the cut is active.` : '';
  if (obj && lp0.status === 'optimal' && lp1.status === 'optimal') {
    tail += ` Adding the cut moves the LP ${obj.sense === 'max' ? 'upper' : 'lower'} bound from $${dtex(lp0.obj)}$ to $${dtex(lp1.obj)}$${inst.boundSource ? '' : ' (computed here; beyond the sheet)'}.`;
  }
  steps.push({
    title: 'Check on a fractional point',
    text: `The point $(${all.map(vtex).join(', ')})=${ptTex(point)}$ ${desc}.`,
    fields: [
      { type: 'num', label: `Left-hand side of $${cutT}$ at this point`, answer: cutLhs },
      { type: 'choice', label: 'Is the point cut off?', options: YN, answer: viol ? 'yes' : 'no' },
    ],
    explain: `$${dtex(cutLhs)}${viol ? '\\gt' : '\\le'} ${dtex(ints.b)}$: the point is ${viol ? 'cut off' : 'not cut off'}.${tail}`,
  });
  // 20E ex. 8: verify the cut on both sides of the integer split r <= floor(b') or r >= ceil(b'), r = sum of the integer variables.
  if (comp && aInt.every((v) => v.eq(ONE))) {
    const lo = m.shifted.floor(), hi = m.shifted.ceil();
    const yHi = B.sub(hi).div(g);
    if (yHi.sign() >= 0 && yHi.le(ub)) {
      const forced = B.floor().eq(hi);
      const ar = ints.a[0], ay = ints.a[nInt];
      const rcut = linTex([ar, ay], ['r', cname]);
      const val = (r, y) => ar.mul(r).add(ay.mul(y));
      const sumTex = (r, y) => `${ar.eq(ONE) ? '' : `${ar}\\cdot `}${dtex(r)}+${ay.eq(ONE) ? '' : `${ay}\\cdot `}${dtex(y)}`;
      steps.push({
        title: 'Check validity on both sides of the split',
        text: `Let $r=${lin}$, an integer. Every integer point has $r\\le ${lo}$ or $r\\ge ${hi}$. In these terms the cut reads $${rcut}\\le ${ints.b}$; its left-hand side grows with $r$ and with $${vtex(cname)}$.`,
        fields: [
          { type: 'num', label: `Branch $r\\le ${lo}$: value of $${rcut}$ at $(r,${vtex(cname)})=(${lo},\\ ${dtex(ub)})$`, answer: val(lo, ub) },
          { type: 'num', label: `Branch $r\\ge ${hi}$: the largest $${vtex(cname)}$ the row allows when $r=${hi}$`, answer: yHi },
          { type: 'num', label: `Value of $${rcut}$ at that point`, answer: val(hi, yHi) },
        ],
        explain: `If $r\\le ${lo}$: $${rcut}\\le ${sumTex(lo, ub)}=${dtex(val(lo, ub))}$ (using $${vtex(cname)}\\le ${dtex(ub)}$). If $r\\ge ${hi}$: the row $${rowT}$ ${forced ? `forces $r=${hi}$ and $${vtex(cname)}\\le ${dtex(yHi)}$` : `gives $${vtex(cname)}\\le ${dtex(yHi)}$ at $r=${hi}$, and less for larger $r$`}, so $${rcut}\\le ${sumTex(hi, yHi)}=${dtex(val(hi, yHi))}$. Both branches satisfy the cut, so it is valid for every mixed-integer point.`,
      });
    }
  }
  const head = obj ? `\\${obj.sense === 'min' ? 'min' : 'max'}\\ ${linTex(obj.c, all)}\\quad\\text{s.t.}\\quad ` : '';
  const bnd = inst.bounds || [];
  const intB = bnd.length ? (bnd.every((v) => fr(v).eq(fr(bnd[0]))) ? [`0\\le ${names.map(vtex).join(',')}\\le ${dtex(bnd[0])}`] : bnd.map((v, j) => `0\\le ${vtex(names[j])}\\le ${dtex(v)}`)) : [];
  const parts = [rowT].concat(intB, [ub !== null ? `0\\le ${vtex(cname)}\\le ${dtex(ub)}` : `${vtex(cname)}\\ge 0`]);
  return {
    id: 'mir', topic: 't205', title: inst.title || 'Mixed-integer rounding',
    statement: () => frag(`${obj ? '' : 'Mixed-integer row: '}$$${head}${parts.join(',\\quad ')},\\quad ${names.map(vtex).join(', ')}\\in\\mathbb{Z}${bnd.length ? '' : '_+'}.$$ $${vtex(cname)}$ is continuous.`),
    rules: 'Basic MIR: if $w+u\\ge k+f$ with $w$ integer, $u\\ge 0$, $k$ integer and $0\\lt f\\lt 1$, then $w+\\dfrac{u}{f}\\ge k+1$.',
    steps,
    wrapup: `With no continuous variable MIR reduces to integer rounding. Gomory mixed-integer cuts are MIR applied to tableau rows.${comp ? ' A continuous variable with a plus sign in a “≤” row is first complemented with its upper bound (u = bound − variable).' : ''}`,
  };
}

function buildMir(inst) {
  return inst.kind === 'capacity' ? buildMirCapacity(inst) : buildMirMixed(inst);
}

export const mirDrill = {
  id: 'mir', title: 'Mixed-integer rounding', topic: 't205', minutes: 8,
  blurb: 'Identify k and f, apply z + u/f ≥ k + 1, check both sides of the split, and translate back to the original variables.',
  presets: [
    { id: 'capacity', label: 'y ≤ 10x, y ≤ 14 (slides 205)', make: () => ({ kind: 'capacity', a: 10, U: 14, title: 'MIR — capacity example (slides 205)' }) },
    { id: 'mixed', label: 'x + y − z ≤ 2.5 (slides 205)', make: () => ({ kind: 'mixed', aInt: [1, 1], cont: { name: 'z', coef: -1, ub: 1 }, b: '2.5', names: ['x', 'y'], bounds: [2, 2], objective: { sense: 'max', c: [1, 1, -2] }, point: ['2', '1/2', '0'], boundSource: true, title: 'MIR — three-variable example (slides 205)' }) },
    { id: 'mixed-html', label: 'x + y + z ≤ 3.5, with u = 1 − z (slides 205, reading version)', make: () => ({ kind: 'mixed', aInt: [1, 1], cont: { name: 'z', coef: 1, ub: 1 }, b: '3.5', names: ['x', 'y'], bounds: [2, 2], objective: { sense: 'min', c: [-1, -1, -2] }, point: ['2', '1/2', '1'], boundSource: true, title: 'MIR — complementing a bounded variable (slides 205, reading version)' }) },
    { id: '20e7', label: 'y ≤ 4x, y ≤ 10, x ≤ 3 (20E ex. 7)', make: () => ({ kind: 'capacity', a: 4, U: 10, xub: 3, maxY: true, story: false, title: 'MIR cut with one integer variable — 20E exercise 7' }) },
    { id: '20e8', label: 'x1 + x2 + y ≤ 4.4, 0 ≤ y ≤ 1 (20E ex. 8)', make: () => ({ kind: 'mixed', aInt: [1, 1], cont: { name: 'y', coef: 1, ub: 1 }, b: '4.4', names: ['x1', 'x2'], bounds: [2, 2], objective: { sense: 'max', c: [1, 1, 2] }, point: ['2', '1.4', '1'], checkFirst: true, title: 'MIR with two integer variables — 20E exercise 8' }) },
  ],
  random: (rng, level) => {
    if (level === 1 || rng.bool(0.5)) {
      for (let t = 0; t < 100; t++) { const a = rng.pick([4, 5, 6, 8, 10]); const U = rng.int(a + 1, 4 * a - 1); if (U % a !== 0) return { kind: 'capacity', a, U, title: 'MIR — practice' }; }
    }
    const b = `${rng.int(2, 9)}.${rng.pick(['5', '25', '75', '2', '4', '8'])}`;
    return { kind: 'mixed', aInt: level >= 3 ? [rng.int(1, 3), rng.int(1, 3)] : [1, 1], c: level >= 2 ? rng.pick([1, 2, 3]) : 1, b, names: ['x', 'y'], title: 'MIR — practice' };
  },
  build: buildMir,
};
