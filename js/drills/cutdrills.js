// Cutting-plane trainers (slides 204-205): Chvatal-Gomory rounding, Gomory cuts from the tableau, MIR.
import { Frac, ZERO } from '../math/frac.js';
import { solveLP } from '../math/lp.js';
import { chvatalGomory, gomoryCuttingPlanes, mirCapacityCut, mirMixedRow } from '../math/cuts.js';
import { tableauTable } from '../viz.js';
import { linTex, ineqTex, ineqText, vtex } from '../util.js';
import { frag } from './common.js';

const fr = (v) => Frac.of(v);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const dot = (a, x) => a.reduce((s, v, j) => s.add(fr(v).mul(fr(x[j]))), ZERO);

// ---------------------------------------------------------------- Chvatal-Gomory rounding
function buildCG(inst) {
  const { rows, names } = inst;
  const u = inst.u.map((v) => Frac.parse(String(v)));
  const R = rows.map((r) => ({ a: r.a, b: Frac.parse(String(r.b)) }));
  const cg = chvatalGomory(R, u);
  const point = inst.point ? inst.point.map((v) => Frac.parse(String(v))) : null;
  const cutText = ineqText(cg.cut.a, names, '<=', cg.cut.b);
  const cols = names.map((nm, j) => ({ key: `k${j}`, head: `$${vtex(nm)}$`, kind: 'num', plain: `coefficient of ${nm}` })).concat([{ key: 'b', head: 'right-hand side', kind: 'num', plain: 'right-hand side' }]);
  const cells = (a, b) => ({ ...Object.fromEntries(a.map((v, j) => [`k${j}`, v])), b });
  const steps = [
    {
      title: 'Combine the rows',
      text: `Multiply row $i$ by $u_i$ and add: $\\ \\sum_j (u^\\top A_j)\\,x_j\\le u^\\top b$.`,
      fields: [{ type: 'table', label: 'Aggregated row', columns: cols, rows: [{ cells: cells(cg.aggregated.a, cg.aggregated.b) }] }],
      explain: `$${ineqTex(cg.aggregated.a, names, '<=', cg.aggregated.b)}$. It is valid for the LP relaxation because $u\\ge 0$.`,
    },
    {
      title: 'Round down',
      text: 'Because $x\\ge 0$, flooring the coefficients keeps the row valid; because $x$ is integer, the left-hand side is then an integer and the right-hand side can be floored too.',
      fields: [{ type: 'ineq', label: 'Chvátal–Gomory inequality', answer: cutText, answerText: cutText, order: names, placeholder: `e.g. ${names[0]} + ${names[1]} <= 4` }],
      explain: `$${ineqTex(cg.cut.a, names, '<=', cg.cut.b)}$ (coefficients $\\lfloor u^\\top A_j\\rfloor$, right-hand side $\\lfloor u^\\top b\\rfloor=\\lfloor ${cg.aggregated.b.toLatex()}\\rfloor=${cg.cut.b}$).`,
    },
  ];
  if (point) {
    const lhs = dot(cg.cut.a, point);
    const viol = lhs.gt(cg.cut.b);
    steps.push({
      title: 'Does it cut off the LP point?',
      text: `The LP relaxation has the solution $(${names.map(vtex).join(', ')})=(${point.map((v) => v.toLatex()).join(',\\ ')})$.`,
      fields: [
        { type: 'num', label: 'Left-hand side of the cut at this point', answer: lhs },
        { type: 'choice', label: 'Is the point cut off?', options: YN, answer: viol ? 'yes' : 'no' },
      ],
      explain: `$${lhs.toLatex()}${viol ? '\\gt' : '\\le'} ${cg.cut.b}$: the point is ${viol ? 'cut off, while every integer feasible point still satisfies the inequality' : 'not cut off; a different choice of multipliers is needed to separate it'}.`,
    });
  }
  return {
    id: 'cg', topic: 't204', title: inst.title || 'Chvátal–Gomory rounding',
    statement: () => frag(
      `The variables are nonnegative integers and satisfy $$${R.map((r) => ineqTex(r.a, names, '<=', r.b)).join(',\\qquad ')}.$$ Use the multipliers $u=(${u.map((v) => v.toLatex()).join(',\\ ')})$.`,
    ),
    rules: 'Chvátal–Gomory: for $u\\ge 0$, $\\ \\sum_j\\lfloor u^\\top A_j\\rfloor x_j\\le\\lfloor u^\\top b\\rfloor$ is valid for all integer $x\\ge 0$ with $Ax\\le b$.',
    steps,
    wrapup: 'Two roundings, two different reasons: coefficients may be floored because x ≥ 0, the right-hand side because the left-hand side has become an integer.',
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
  id: 'cg', title: 'Chvátal–Gomory rounding', topic: 't204', minutes: 4,
  blurb: 'Aggregate rows with multipliers, floor coefficients and right-hand side, and test the cut on the LP point.',
  presets: [
    { id: 'round', label: 'x + y ≤ 6.3 (slides 204)', make: () => ({ rows: [{ a: [1, 1], b: '6.3' }], u: ['1'], names: ['x', 'y'], point: ['1.3', '5'], title: 'Integer rounding — x + y ≤ 6.3 (slides 204)' }) },
    { id: 'workshop', label: 'x + y ≤ 6 and y − x ≤ 3 (slides 206)', make: () => ({ rows: [{ a: [1, 1], b: '6' }, { a: [-1, 1], b: '3' }], u: ['1/2', '1/2'], names: ['x', 'y'], point: ['3/2', '9/2'], title: 'Chvátal–Gomory — the workshop rows (slides 206)' }) },
  ],
  random: (rng, level) => ({ ...randomCG(rng, level), title: 'Chvátal–Gomory rounding — practice' }),
  build: buildCG,
};

// ---------------------------------------------------------------- Gomory cuts from the tableau
function colTex(col) { return col.kind === 'x' ? vtex(col.name) : `s_{${col.index + 1}}`; }

function buildGomory(inst) {
  const { c, rows, names } = inst;
  const model = { c, rows: rows.map((r) => ({ a: r.a, op: '<=', b: r.b })), names };
  const maxRounds = inst.rounds || 1;
  const res = gomoryCuttingPlanes(model, 8);
  if (!res.rounds.length) throw new Error('The LP optimum is already integer: there is no Gomory cut to derive.');
  const use = res.rounds.slice(0, maxRounds);
  const steps = [];
  use.forEach((rd, k) => {
    const t = rd.lp.tableau;
    const src = t.rows[rd.rowIndex];
    const decisionRows = t.rows.filter((r) => t.cols[r.basic].kind === 'x');
    const next = k + 1 < res.rounds.length ? res.rounds[k + 1].lp : res.final;
    const cutText = ineqText(rd.cut.a, names, '<=', rd.cut.b);
    const floorCols = t.cols.map((col, j) => ({ key: `c${j}`, head: `$${colTex(col)}$`, kind: 'num', plain: col.name })).concat([{ key: 'rhs', head: 'RHS', kind: 'num', plain: 'right-hand side' }]);
    const floorCells = { ...Object.fromEntries(rd.tableauCut.coef.map((v, j) => [`c${j}`, v])), rhs: rd.tableauCut.rhs };
    const slackUsed = t.cols.map((col, j) => ({ col, j })).filter(({ col, j }) => col.kind === 's' && !rd.tableauCut.coef[j].isZero());
    steps.push({
      title: `Cut ${k + 1}: source row and rounding`,
      text: () => frag(
        k === 0 ? 'Optimal tableau of the LP relaxation:' : `After adding cut ${k}, the new optimal tableau (slack $s_{${rd.lp.rowsLE.length}}$ belongs to that cut):`,
        tableauTable(t),
        `LP optimum: $(${names.map(vtex).join(', ')})=(${rd.lp.x.map((v) => v.toLatex()).join(',\\ ')})$, $z=${rd.lp.obj.toLatex()}$.`,
      ),
      fields: [
        { type: 'choice', label: 'Source row (basic variable)', options: t.rows.map((r) => ({ value: r.name, label: `$${colTex(t.cols[r.basic])}$` })), answer: src.name },
        { type: 'table', label: 'Floor every coefficient and the right-hand side of that row', columns: floorCols, rows: [{ cells: floorCells }] },
      ],
      explain: () => frag(
        `Fractional parts of the right-hand sides of the basic decision variables: ${decisionRows.map((r) => `$${colTex(t.cols[r.basic])}$: $${r.rhs.fracPart().toLatex()}$`).join(', ')}. The largest is in the row of $${colTex(t.cols[src.basic])}$${decisionRows.filter((r) => r.rhs.fracPart().eq(src.rhs.fracPart())).length > 1 ? ' (tie broken by row order)' : ''}.`,
        ` Source row: $${linTex(src.coef, t.cols.map((col) => (col.kind === 'x' ? col.name : `s${col.index + 1}`)))}=${src.rhs.toLatex()}$. All variables are nonnegative integers, so flooring gives $${ineqTex(rd.tableauCut.coef, t.cols.map((col) => (col.kind === 'x' ? col.name : `s${col.index + 1}`)), '<=', rd.tableauCut.rhs)}$.`,
        tableauTable(t, { highlightRow: rd.rowIndex }),
      ),
    });
    steps.push({
      title: `Cut ${k + 1}: back to the original variables`,
      text: slackUsed.length ? `Substitute the slack${slackUsed.length > 1 ? 's' : ''} ${slackUsed.map(({ col }) => `$s_{${col.index + 1}}=${rd.lp.rowsLE[col.index].b.toLatex()}-(${linTex(rd.lp.rowsLE[col.index].a, names)})$`).join(', ')} and simplify.` : 'No slack variable appears in the rounded row, so it is already in the original variables.',
      fields: [
        { type: 'ineq', label: `Cut ${k + 1} in $${names.map(vtex).join(', ')}$`, answer: cutText, answerText: cutText, order: names, placeholder: `e.g. ${names[0]} - ${names[1]} <= 1` },
        { type: 'num', label: 'Left-hand side of the cut at the current LP optimum', answer: dot(rd.cut.a, rd.lp.x) },
        { type: 'choice', label: 'Is the current LP optimum cut off?', options: YN, answer: 'yes' },
      ],
      explain: `$${ineqTex(rd.cut.a, names, '<=', rd.cut.b)}$. At the LP optimum the left-hand side is $${dot(rd.cut.a, rd.lp.x).toLatex()}\\gt ${rd.cut.b.toLatex()}$, so the point is removed; a Gomory cut always cuts off the vertex it was read from. Re-solving gives $(${next.x.map((v) => v.toLatex()).join(',\\ ')})$ with $z=${next.obj.toLatex()}$${next.x.every((v) => v.isInt()) ? ', which is integer: the problem is solved.' : ', still fractional: another cut is needed.'}`,
    });
  });
  const total = res.rounds.length;
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
    explain: `The bound goes $${res.rounds.map((r) => r.lp.obj.toLatex()).concat([res.final.obj.toLatex()]).slice(0, use.length + 1).join('\\ \\to\\ ')}$. ${total > use.length ? `Continuing with the same rule, ${total} cuts in all reach the integer optimum $z=${res.final.obj.toLatex()}$ at $(${res.final.x.map((v) => v.toLatex()).join(', ')})$.` : `The integer optimum is $z=${res.final.obj.toLatex()}$ at $(${res.final.x.map((v) => v.toLatex()).join(', ')})$.`}`,
  });
  return {
    id: 'gomory', topic: 't204', title: inst.title || 'Gomory cuts from the tableau',
    statement: () => frag(`Pure integer program: $$\\max\\ ${linTex(c, names)}\\quad\\text{s.t.}\\quad ${rows.map((r) => ineqTex(r.a, names, '<=', r.b)).join(',\\quad ')},\\quad ${names.map(vtex).join(', ')}\\in\\mathbb{Z}_+ .$$ Slack variables $s_i$ are numbered in the order of the constraints. All data are integer, so the slacks are integer too.`),
    rules: 'Source row: among the basic <b>decision</b> variables with a fractional value, take the largest fractional part of the right-hand side (ties: the higher row). Read the row as “≤”, floor every coefficient and the right-hand side, then substitute the slacks.',
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
  id: 'gomory', title: 'Gomory cuts from the tableau', topic: 't204', minutes: 12,
  blurb: 'Pick the source row, floor it, substitute the slacks and check the cut, on exact simplex tableaux.',
  presets: [
    { id: 'ex1', label: 'Example 1 (slides 204)', make: () => ({ c: [4, -1], rows: [{ a: [7, -2], b: 14 }, { a: [0, 1], b: 3 }, { a: [2, -2], b: 3 }], names: ['x1', 'x2'], rounds: 2, title: 'Gomory cuts — example 1 (slides 204)' }) },
    { id: 'workshop', label: 'Workshop, rows scaled by 10 (slides 204)', make: () => ({ c: [1, 10], rows: [{ a: [1, 0], b: 3 }, { a: [-10, 10], b: 37 }, { a: [10, 10], b: 63 }], names: ['x', 'y'], rounds: 3, title: 'Gomory cuts — workshop with integer data (slides 204)' }) },
  ],
  random: (rng, level) => ({ ...randomGomory(rng, level), title: 'Gomory cuts — practice' }),
  build: buildGomory,
};

// ---------------------------------------------------------------- mixed-integer rounding
function buildMir(inst) {
  if (inst.kind === 'capacity') {
    const { a, U } = inst;
    const m = mirCapacityCut(a, U);
    const k = m.k, f = m.f;
    const cutText = ineqText([m.slope.neg(), 1], ['x', 'y'], '<=', m.intercept);
    const xbar = m.lpVertex.x;
    return {
      id: 'mir', topic: 't205', title: inst.title || 'Mixed-integer rounding',
      statement: () => frag(`Mixed-integer set: $$y\\le ${a}x,\\qquad 0\\le y\\le ${U},\\qquad x\\in\\mathbb{Z}_+,\\ y\\in\\mathbb{R}.$$ Think of $x$ as the number of machines of capacity ${a} and $y$ as the production, limited to ${U}.`),
      rules: 'Basic MIR: if $z+u\\ge k+f$ with $z$ integer, $u\\ge 0$, $k$ integer and $0\\lt f\\lt 1$, then $z+\\dfrac{u}{f}\\ge k+1$.',
      steps: [
        {
          title: 'The fractional vertex',
          text: 'Maximising $y$ while using as little $x$ as possible, the LP relaxation reaches the vertex where $y=U$ and $y=ax$.',
          fields: [{ type: 'num', label: '$\\bar x$ at this vertex', answer: xbar }, { type: 'num', label: '$\\bar y$', answer: U }],
          explain: `$\\bar y=${U}$ and $\\bar x=${U}/${a}=${xbar.toLatex()}$, which is fractional.`,
        },
        {
          title: 'Bring the row into the basic form',
          text: `Let $s=${U}-y\\ge 0$. From $y\\le ${a}x$: $${a}x+s\\ge ${U}$, that is $x+\\dfrac{s}{${a}}\\ge ${xbar.toLatex()}$. Identify $k$ and $f$.`,
          fields: [{ type: 'int', label: '$k$', answer: k }, { type: 'num', label: '$f$', answer: f }],
          explain: `$${U}/${a}=${k}+${f.toLatex()}$, so $k=${k}$ and $f=${f.toLatex()}$, with $z=x$ and $u=s/${a}$.`,
        },
        {
          title: 'Apply MIR and return to x and y',
          fields: [{ type: 'ineq', label: 'MIR inequality in $x$ and $y$', answer: cutText, answerText: cutText, order: ['x', 'y'], placeholder: 'e.g. y <= 6 + 4x' }],
          explain: `$x+\\dfrac{s}{${a}\\cdot ${f.toLatex()}}\\ge ${k.add(1)}$, i.e. $x+\\dfrac{s}{${fr(a).mul(f).toLatex()}}\\ge ${k.add(1)}$. With $s=${U}-y$: $\\ y\\le ${m.intercept.toLatex()}+${m.slope.toLatex()}x$.`,
        },
        {
          title: 'Check the cut',
          fields: [
            { type: 'num', label: `Largest $y$ the cut allows at $x=${k}$`, answer: m.intercept.add(m.slope.mul(k)) },
            { type: 'num', label: `Largest $y$ the cut allows at $x=${k.add(1)}$`, answer: m.intercept.add(m.slope.mul(k.add(1))) },
            { type: 'num', label: 'Largest $y$ the cut allows at $x=\\bar x$', answer: m.intercept.add(m.slope.mul(xbar)) },
            { type: 'choice', label: 'Is the LP vertex cut off?', options: YN, answer: 'yes' },
          ],
          explain: `At $x=${k}$ the cut gives $y\\le ${m.intercept.add(m.slope.mul(k)).toLatex()}=${a}\\cdot ${k}$ and at $x=${k.add(1)}$ it gives $y\\le ${U}$: it passes through the two integer-$x$ points $(${k},${fr(a).mul(k).toLatex()})$ and $(${k.add(1)},${U})$, so it is a facet of the convex hull. At $\\bar x=${xbar.toLatex()}$ it allows only $${m.intercept.add(m.slope.mul(xbar)).toLatex()}\\lt ${U}$.`,
        },
      ],
      wrapup: 'MIR is integer rounding for rows that also contain continuous variables: the continuous part is divided by the fractional part f instead of being rounded away.',
    };
  }
  const { aInt, c, b, names } = inst;
  const B = Frac.parse(String(b));
  const m = mirMixedRow(aInt, c, B);
  const f = m.f;
  const all = names.concat(['z']);
  const cutCoefs = aInt.map(fr).concat([m.contCoef]);
  const cutText = ineqText(cutCoefs, all, '<=', m.rhs);
  // LP point: put all of b on the first integer variable, z = 0
  const xbar = [B.div(aInt[0])].concat(aInt.slice(1).map(() => ZERO));
  return {
    id: 'mir', topic: 't205', title: inst.title || 'Mixed-integer rounding',
    statement: () => frag(`Mixed-integer row: $$${linTex(aInt.concat([-c]), all)}\\le ${B.toLatex()},\\qquad ${names.map(vtex).join(', ')}\\in\\mathbb{Z}_+,\\quad z\\ge 0\\ \\text{continuous}.$$`),
    rules: 'Basic MIR: if $w+u\\ge k+f$ with $w$ integer, $u\\ge 0$, $k$ integer and $0\\lt f\\lt 1$, then $w+\\dfrac{u}{f}\\ge k+1$.',
    steps: [
      {
        title: 'Basic form',
        text: `Write the row as $w+u\\ge k+f$ with $w=-(${linTex(aInt, names)})$ (an integer) and $u=${c === 1 ? '' : c}z\\ge 0$.`,
        fields: [{ type: 'int', label: '$k$', answer: m.k }, { type: 'num', label: '$f$', answer: f }],
        explain: `$w+u\\ge -${B.toLatex()}$, and $-${B.toLatex()}=${m.k}+${f.toLatex()}$: $k=\\lfloor -${B.toLatex()}\\rfloor=${m.k}$, $f=${f.toLatex()}$. Equivalently $f=\\lceil b\\rceil-b$.`,
      },
      {
        title: 'The MIR inequality',
        fields: [
          { type: 'num', label: 'Coefficient of $z$ in the cut (with its sign)', answer: m.contCoef },
          { type: 'ineq', label: 'MIR inequality', answer: cutText, answerText: cutText, order: all, placeholder: 'e.g. x + y - 2z <= 2' },
        ],
        explain: `$w+\\dfrac{u}{f}\\ge k+1$ gives $-(${linTex(aInt, names)})+${fr(c).div(f).toLatex()}z\\ge ${m.k.add(1)}$, i.e. $${ineqTex(cutCoefs, all, '<=', m.rhs)}$. The right-hand side is $\\lfloor b\\rfloor$ and the continuous coefficient is divided by $f$.`,
      },
      {
        title: 'Check on a fractional point',
        text: `The point $(${names.map(vtex).join(', ')},z)=(${xbar.map((v) => v.toLatex()).join(', ')},\\ 0)$ satisfies the original row with equality.`,
        fields: [
          { type: 'num', label: 'Left-hand side of the MIR cut at this point', answer: dot(cutCoefs, xbar.concat([ZERO])) },
          { type: 'choice', label: 'Is the point cut off?', options: YN, answer: dot(cutCoefs, xbar.concat([ZERO])).gt(m.rhs) ? 'yes' : 'no' },
        ],
        explain: `With $z=0$ the cut reads $${linTex(aInt, names)}\\le ${m.rhs}$ (pure integer rounding); the point has left-hand side $${B.toLatex()}\\gt ${m.rhs}$ and is cut off. When $z\\gt 0$ the cut is relaxed at rate $${fr(c).div(f).toLatex()}$ per unit of $z$ instead of $${c}$.`,
      },
    ],
    wrapup: 'With no continuous variable MIR reduces to integer rounding. Gomory mixed-integer cuts are MIR applied to tableau rows.',
  };
}

export const mirDrill = {
  id: 'mir', title: 'Mixed-integer rounding', topic: 't205', minutes: 6,
  blurb: 'Identify k and f, apply z + u/f ≥ k + 1, and translate back to the original variables.',
  presets: [
    { id: 'capacity', label: 'y ≤ 10x, y ≤ 14 (slides 205)', make: () => ({ kind: 'capacity', a: 10, U: 14, title: 'MIR — capacity example (slides 205)' }) },
    { id: 'mixed', label: 'x + y − z ≤ 2.5 (slides 205)', make: () => ({ kind: 'mixed', aInt: [1, 1], c: 1, b: '2.5', names: ['x', 'y'], title: 'MIR — three-variable example (slides 205)' }) },
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
