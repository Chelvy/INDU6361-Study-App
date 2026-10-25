// Surrogate relaxation (slides 103, revised deck): aggregate two rows with multipliers u >= 0,
// solve the one-row integer problem by enumeration, read the direction of the bound, compare multipliers.
import { plotFigure } from '../viz.js';
import { linTex, ineqTex, ineqText } from '../util.js';
import { dataTable, frag } from './common.js';

const R = String.raw;
const NAMES = ['x', 'y'];
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const vec = (u) => `(${u.join(',')})`;
const aggregate = (A, b, u) => ({ a: [u[0] * A[0][0] + u[1] * A[1][0], u[0] * A[0][1] + u[1] * A[1][1]], b: u[0] * b[0] + u[1] * b[1] });
const fits = (row, x, y) => row.a[0] * x + row.a[1] * y <= row.b;

// Enumerate x, y in Z+ satisfying every row (all coefficients positive, so the set is finite).
// For each x the best y is the largest allowed one, because the objective coefficients are positive.
function solve(rows, c) {
  const xmax = Math.min(...rows.map((r) => Math.floor(r.b / r.a[0])));
  const table = [];
  let best = null, argmax = [];
  for (let x = 0; x <= xmax; x++) {
    const y = Math.min(...rows.map((r) => Math.floor((r.b - r.a[0] * x) / r.a[1])));
    if (y < 0) continue;
    const v = c[0] * x + c[1] * y;
    table.push({ x, y, v });
    if (best === null || v > best) { best = v; argmax = []; }
  }
  // every optimal point (not only the largest-y one of each column)
  for (let x = 0; x <= xmax; x++) for (let y = 0; rows.every((r) => fits(r, x, y)); y++) if (c[0] * x + c[1] * y === best) argmax.push([x, y]);
  return { value: best, argmax, table };
}

const rowTex = (r) => ineqTex(r.a, NAMES, '<=', r.b);
const rowText = (r) => ineqText(r.a, NAMES, '<=', r.b);

function enumTable(res, label) {
  return dataTable(['$x$', R`largest $y$ allowed`, label], res.table.map((t) => [String(t.x), String(t.y), `${t.v}${t.v === res.value ? ' ←' : ''}`]), 'compact');
}

function analyse(inst) {
  const { c, A, b, u, u2 } = inst;
  const rows = A.map((a, i) => ({ a, b: b[i] }));
  const agg = aggregate(A, b, u), agg2 = aggregate(A, b, u2);
  const orig = solve(rows, c), rel = solve([agg], c), rel2 = solve([agg2], c);
  const xr = rel.argmax[0];
  const feasible = rows.every((r) => fits(r, xr[0], xr[1]));
  // (beyond the slides) the best multipliers with entries 0..3, by enumeration
  let best = null;
  for (let p = 0; p <= 3; p++) for (let q = 0; q <= 3; q++) {
    if (p === 0 && q === 0) continue;
    const v = solve([aggregate(A, b, [p, q])], c).value;
    if (best === null || v < best.v) best = { v, u: [p, q] };
  }
  return { rows, agg, agg2, orig, rel, rel2, xr, feasible, best };
}

function regionFig(rows, marks, caption) {
  // one unit of margin so that the labels of points on the axes stay inside the figure
  const xmax = Math.max(3, ...rows.map((r) => Math.ceil(r.b / r.a[0]))) + 1;
  const ymax = Math.max(3, ...rows.map((r) => Math.ceil(r.b / r.a[1]))) + 1;
  return plotFigure({ xmax: Math.min(xmax, 14), ymax: Math.min(ymax, 14), cons: rows.map((r) => ({ a: r.a[0], b: r.a[1], c: r.b })), marks, caption });
}

function buildSurrogate(inst) {
  const { c, u, u2 } = inst;
  const D = analyse(inst);
  const { rows, agg, agg2, orig, rel, rel2, xr, feasible, best } = D;
  const obj = linTex(c, NAMES);
  const zStar = orig.value, zR = rel.value, zR2 = rel2.value;
  const stronger = zR < zR2 ? 'u' : zR2 < zR ? 'u2' : 'same';
  const zeroRow = u2.findIndex((w) => w === 0);
  const sumTex = (w) => `${w[0]}\\,(${rowTex(rows[0]).split(' \\le ')[0]})+${w[1]}\\,(${rowTex(rows[1]).split(' \\le ')[0]})\\le ${w[0]}\\cdot ${rows[0].b}+${w[1]}\\cdot ${rows[1].b}`;
  const origPts = orig.argmax.map((p) => `$${vec(p)}$`).join(' and ');
  const marks = (res) => {
    const p = res.argmax[0], q = orig.argmax[0];
    if (p[0] === q[0] && p[1] === q[1]) return [{ x: p[0], y: p[1], cls: 'opt', label: `zR = z* ${vec(p)}` }];
    return [{ x: p[0], y: p[1], cls: 'lp', label: `zR ${vec(p)}` }, { x: q[0], y: q[1], cls: 'opt', label: `z* ${vec(q)}` }];
  };
  const figCaption = (name, row, res) => {
    const same = res.argmax[0][0] === orig.argmax[0][0] && res.argmax[0][1] === orig.argmax[0][1];
    return `${name}: the single row ${rowText(row).replace('<=', '≤')}. ${same ? 'Green: the relaxed optimum, which is also the original optimum.' : 'Red (zR): the relaxed optimum; green (z*): the original optimum.'}`;
  };
  const violated = rows.map((r, i) => ({ i, r, lhs: r.a[0] * xr[0] + r.a[1] * xr[1] })).filter((t) => t.lhs > t.r.b);
  return {
    id: 'surrogate', topic: 't103', title: inst.title || 'Surrogate relaxation',
    statement: () => frag(
      `Integer program $$z^*=\\max\\{${obj}:\\ ${rowTex(rows[0])},\\ ${rowTex(rows[1])},\\ x,y\\in\\mathbb Z_+\\}.$$ Surrogate multipliers: $u=${vec(u)}$, and later $u'=${vec(u2)}$.`,
      regionFig(rows, [], 'The original problem. Black dots: its feasible integer points.'),
    ),
    rules: R`Write the problem as $X=\{x\in X_0:\ Ax\le b\}$, where $X_0$ keeps everything else (here $x,y\in\mathbb Z_+$). For multipliers (weights) $u\ge 0$, the <b>surrogate relaxation</b> is $R(u)=\{x\in X_0:\ u^TAx\le u^Tb\}$: the selected rows are replaced by one nonnegative weighted sum, and the objective and the domains in $X_0$ do not change (slides 103).`,
    steps: [
      {
        title: 'The aggregated inequality',
        text: `Multiply row 1 by $u_1=${u[0]}$ and row 2 by $u_2=${u[1]}$, then add the two rows.`,
        fields: [{ type: 'ineq', label: R`The surrogate constraint $u^TAx\le u^Tb$`, answer: rowText(agg), answerText: rowText(agg), order: NAMES, placeholder: 'e.g. 3x + 3y <= 10' }],
        explain: `Rule 1: multiplying an inequality by a number $u_i\\ge 0$ keeps its direction. Rule 2: adding two "$\\le$" inequalities side by side gives a "$\\le$" inequality. So $$${sumTex(u)},$$ that is $${rowTex(agg)}$. Every point that satisfies both rows satisfies their sum, so $X\\subseteq R(u)$: a valid relaxation. A negative weight would reverse a row, and the sum would no longer follow from $Ax\\le b$.`,
      },
      {
        title: 'Solve the surrogate relaxation',
        text: `Maximise $${obj}$ over $R(u)=\\{(x,y)\\in\\mathbb Z_+^2:\\ ${rowTex(agg)}\\}$ by enumeration: for each $x$ take the largest $y$ allowed (the objective grows with $y$).`,
        fields: [
          { type: 'int', label: R`Relaxed optimum: $x_R$`, answer: xr[0] },
          { type: 'int', label: R`Relaxed optimum: $y_R$`, answer: xr[1] },
          { type: 'num', label: R`Relaxed optimal value $z_R$`, answer: zR },
          { type: 'choice', label: 'Is this relaxed optimum feasible for the original problem?', options: YN, answer: feasible ? 'yes' : 'no' },
        ],
        explain: () => frag(
          enumTable(rel, `$${obj}$`),
          `The best value is $z_R=${zR}$ at $${vec(xr)}$.`,
          feasible ? `It satisfies both original rows (${rows.map((r) => `$${r.a[0]}\\cdot${xr[0]}+${r.a[1]}\\cdot${xr[1]}=${r.a[0] * xr[0] + r.a[1] * xr[1]}\\le ${r.b}$`).join(', ')}). Slides 103, "A feasible relaxed optimum": an optimal solution of a relaxation that is feasible for the original problem is also optimal for it.`
            : `It violates ${violated.map((t) => `row ${t.i + 1}: $${t.r.a[0]}\\cdot${xr[0]}+${t.r.a[1]}\\cdot${xr[1]}=${t.lhs}\\gt ${t.r.b}$`).join(' and ')}. So it does not solve the original problem: the relaxation only gives a bound.`,
          regionFig([agg], marks(rel), figCaption('R(u)', agg, rel)),
        ),
      },
      {
        title: 'The original problem',
        text: R`Solve the original problem by the same enumeration, now with both rows.`,
        fields: [{ type: 'num', label: R`Original optimal value $z^*$`, answer: zStar }],
        explain: () => frag(enumTable(orig, `$${obj}$`), `The optimum is $z^*=${zStar}$, attained at ${origPts}.`),
      },
      {
        title: 'Direction of the bound',
        fields: [
          { type: 'choice', stack: true, label: 'Which statement is correct?', answer: 'upper', options: [
            { value: 'upper', label: R`$z_R$ is an <b>upper</b> bound: $z^*\le z_R$, because $R(u)$ contains every feasible point and the objective is unchanged.` },
            { value: 'lower', label: R`$z_R$ is a <b>lower</b> bound: $z_R\le z^*$.` },
            { value: 'none', label: R`No bound follows when the relaxed optimum is infeasible for the original problem.` },
            { value: 'equal', label: R`A surrogate relaxation always gives $z_R=z^*$.` },
          ], mis: { lower: 'That is the rule for a minimisation. Here we maximise: a larger feasible set can only give a larger or equal maximum.', none: 'The bound holds whatever the relaxed optimum looks like; only optimality for the original needs feasibility.', equal: 'A relaxation may admit extra points, so its value may be strictly better than $z^*$.' } },
          { type: 'num', label: R`Gap $z_R-z^*$`, answer: zR - zStar },
        ],
        explain: `Slides 103, "Bound from a relaxation": for a minimisation $z_R\\le z^*$ (lower bound); for a maximisation the same enlargement gives an <b>upper</b> bound. Here $z^*=${zStar}\\le z_R=${zR}$, a gap of $${zR - zStar}$.`,
      },
      {
        title: `Other multipliers: u' = ${vec(u2)}`,
        text: `Now aggregate with $u'=${vec(u2)}$ and solve again by enumeration.`,
        fields: [
          { type: 'ineq', label: R`The surrogate constraint for $u'$`, answer: rowText(agg2), answerText: rowText(agg2), order: NAMES },
          { type: 'num', label: R`Its optimal value $z_R(u')$`, answer: zR2 },
          { type: 'choice', stack: true, label: 'Which multipliers give the stronger bound for this maximisation?', answer: stronger, options: [
            { value: 'u', label: `$u=${vec(u)}$` },
            { value: 'u2', label: `$u'=${vec(u2)}$` },
            { value: 'same', label: 'Both give the same bound' },
          ], mis: stronger === 'same'
            ? { u: 'Compare the two values: they are equal, so neither bound is stronger.', u2: 'Compare the two values: they are equal, so neither bound is stronger.' }
            : { [stronger === 'u' ? 'u2' : 'u']: 'For a maximisation the stronger relaxation gives the <b>smaller</b> upper bound (it is closer to $z^*$).' } },
        ],
        explain: () => frag(
          `$$${sumTex(u2)},$$ that is $${rowTex(agg2)}$.`,
          enumTable(rel2, `$${obj}$`),
          regionFig([agg2], marks(rel2), figCaption("R(u')", agg2, rel2)),
          `$z_R(u')=${zR2}$ against $z_R(u)=${zR}$. ${stronger === 'same' ? 'Both bounds are equal here.' : `The smaller upper bound is the stronger one: ${stronger === 'u' ? `$u=${vec(u)}$` : `$u'=${vec(u2)}$`}.`} Slides 103, "Choosing surrogate multipliers": different nonnegative weights can give different bounds, and we look for the tightest one (for a minimisation, the largest lower bound).`,
          zeroRow >= 0 ? `Weight $0$ on row ${zeroRow + 1} removes that row: $0\\cdot(${rowTex(rows[zeroRow]).split(' \\le ')[0]})\\le 0\\cdot ${rows[zeroRow].b}$ is just $0\\le 0$, true for every point. So $R(u')$ is the relaxation "remove row ${zeroRow + 1}" of slides 103 (this link is beyond the slides).` : '',
        ),
      },
    ],
    wrapup: `A surrogate keeps the objective and the integrality, and replaces several rows by one weighted sum, so every feasible point stays feasible and the bound points the usual way (up for a maximisation). Its optimum may violate the original rows. (Beyond the slides, computed by this app:) trying every $u$ with entries $0$ to $3$, the smallest bound here is $${best.v}$ at $u=${vec(best.u)}$${best.v === zStar ? ', which equals $z^*$: well-chosen weights can close the gap' : ''}.`,
  };
}

// ---------------------------------------------------------------- random instances
const U = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]];
const U2 = [[1, 0], [0, 1], [1, 1], [1, 2], [2, 1], [1, 3], [3, 1]];

function randomSurrogate(rng, level) {
  for (let t = 0; t < 800; t++) {
    const A = [[rng.int(1, 4), rng.int(1, 4)], [rng.int(1, 4), rng.int(1, 4)]];
    if (A[0][0] * A[1][1] === A[0][1] * A[1][0]) continue; // parallel rows
    const b = [rng.int(4, level === 1 ? 8 : 12), rng.int(4, level === 1 ? 8 : 12)];
    const c = [rng.int(1, 5), rng.int(1, 5)];
    const u = rng.pick(level === 1 ? [[1, 1]] : U);
    const u2 = rng.pick(level === 1 ? [[1, 0], [0, 1]] : U2.filter((w) => w[0] * u[1] !== w[1] * u[0]));
    const inst = { c, A, b, u, u2 };
    const D = analyse(inst);
    if (D.orig.table.length < 2 || D.rel.argmax.length !== 1) continue;
    if (D.rel.value === D.orig.value && (level === 1 || rng.bool(0.8))) continue; // mostly a real gap
    // no redundant row: each line must cross the other inside the quadrant (compare the axis intercepts)
    const [r, s] = D.rows;
    if ((r.b * s.a[0] - s.b * r.a[0]) * (r.b * s.a[1] - s.b * r.a[1]) >= 0) continue;
    return inst;
  }
  return PRESET();
}

const PRESET = () => ({ c: [3, 2], A: [[2, 1], [1, 2]], b: [5, 5], u: [1, 1], u2: [1, 0] });

export const surrogateDrill = {
  id: 'surrogate', title: 'Surrogate relaxation', topic: 't103', minutes: 6,
  blurb: 'Aggregate two rows with nonnegative weights, solve the relaxation by enumeration, read the bound, and compare two choices of weights.',
  presets: [{ id: 'slides103', label: 'max 3x + 2y, u = (1, 1) (slides 103)', make: () => ({ ...PRESET(), title: 'Surrogate relaxation — example of slides 103' }) }],
  random: (rng, level) => ({ ...randomSurrogate(rng, level), title: 'Surrogate relaxation — practice' }),
  build: buildSurrogate,
};
