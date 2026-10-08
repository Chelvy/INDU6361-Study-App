// Formulation-strength trainers (slides 104; lab 104): smallest big-M, fixed-charge mix, facility-location linking.
import { Frac } from '../math/frac.js';
import { solveLP } from '../math/lp.js';
import { linTex, ineqText, ineqTex } from '../util.js';
import { dataTable, frag } from './common.js';

const fr = (v) => Frac.of(v);
const P = (v) => fr(v).pretty(4);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

// ---------------------------------------------------------------- smallest big-M for an implication
function buildBigM(inst) {
  const { a, lo, hi, b } = inst;
  const n = a.length;
  const names = a.map((_, j) => `x${j + 1}`);
  const pick = a.map((aj, j) => (aj >= 0 ? hi[j] : lo[j]));
  const contrib = a.map((aj, j) => aj * pick[j]);
  const maxLhs = contrib.reduce((s, v) => s + v, 0);
  const M = Math.max(0, maxLhs - b);
  const loose = inst.loose || (M > 0 ? 2 * M + 10 : 10);
  const delta = inst.delta;
  const zTight = M > 0 ? fr(1).sub(fr(delta).div(M)) : null;
  const zLoose = fr(1).sub(fr(delta).div(loose));
  const coefs = a.concat([M]);
  const all = names.concat(['z']);
  const steps = [
    {
      title: 'Largest possible left-hand side',
      text: `Over the box, each term $a_j x_j$ is maximised separately: take the upper bound when $a_j \\gt 0$ and the lower bound when $a_j \\lt 0$.`,
      fields: [
        { type: 'table', label: 'Value of $x_j$ that maximises $a_jx_j$, and the term it gives', corner: '', columns: names.map((nm, j) => ({ key: `k${j}`, head: `$x_{${j + 1}}$`, kind: 'num', plain: nm })),
          rows: [{ head: 'best $x_j$', cells: Object.fromEntries(pick.map((v, j) => [`k${j}`, v])) }, { head: '$a_jx_j$', cells: Object.fromEntries(contrib.map((v, j) => [`k${j}`, v])) }] },
        { type: 'num', label: '$\\max_{x\\in X_0} a^\\top x$', answer: maxLhs },
      ],
      explain: `$${a.map((aj, j) => `${aj < 0 ? `(${aj})` : aj}\\cdot ${pick[j]}`).join(' + ')} = ${maxLhs}$.`,
    },
    {
      title: 'Smallest valid M',
      fields: [{ type: 'num', label: '$M^*=\\max\\{0,\\ \\max_{x\\in X_0}(a^\\top x-b)\\}$', answer: M, mis: [{ value: maxLhs, msg: 'Subtract the right-hand side $b$: $M$ only has to cover the amount by which the constraint can be violated.' }, { value: maxLhs - b, msg: 'A negative value means the constraint can never be violated: then $M^*=0$.' }].filter((m) => m.value !== M) }],
      explain: M > 0 ? `$M^*=${maxLhs}-${b < 0 ? `(${b})` : b}=${M}$. With $z=0$ the constraint reads $a^\\top x\\le ${b}+${M}=${maxLhs}$, which every point of the box satisfies; any smaller $M$ would cut off a feasible point.` : `The largest left-hand side is ${maxLhs} ≤ ${b}: the constraint always holds, so $M^*=0$ and the implication needs no binary at all.`,
    },
    {
      title: 'Write the constraint',
      text: 'Give the linear constraint that enforces the implication with $M=M^*$ (any equivalent form is accepted).',
      fields: [{ type: 'ineq', label: 'Big-M constraint in $x$ and $z$', answer: ineqText(coefs, all, '<=', b + M), answerText: ineqText(coefs, all, '<=', b + M), order: all, placeholder: 'e.g. 2x1 + 3x2 + 7z <= 12' }],
      explain: `$a^\\top x\\le b+M(1-z)$, that is $${ineqTex(coefs, all, '<=', b + M)}$. Check: $z=1$ gives $a^\\top x\\le ${b}$; $z=0$ gives $a^\\top x\\le ${b + M}$.`,
    },
  ];
  if (M > 0) {
    steps.push({
      title: 'Why the smallest M matters',
      text: `Take a point of the box with $a^\\top \\bar x=${b + delta}$ (it violates the original constraint by ${delta}). In the LP relaxation $z$ may be fractional. What is the largest $z$ that the big-M constraint allows at this point?`,
      fields: [
        { type: 'num', label: `Largest $z$ with $M=M^*=${M}$`, answer: zTight },
        { type: 'num', label: `Largest $z$ with a loose $M=${loose}$`, answer: zLoose },
        { type: 'choice', label: 'Which value of $M$ gives the stronger LP relaxation?', options: [{ value: 'tight', label: `$M=${M}$` }, { value: 'loose', label: `$M=${loose}$` }, { value: 'same', label: 'They are equally strong' }], answer: 'tight' },
      ],
      explain: `From $a^\\top\\bar x\\le b+M(1-z)$: $z\\le 1-\\dfrac{a^\\top\\bar x-b}{M}$. With $M=${M}$: $z\\le ${zTight.toLatex()}$; with $M=${loose}$: $z\\le ${zLoose.toLatex()}$. The loose constant lets the relaxation keep $z$ almost at 1 while violating the constraint, so its feasible region is larger and its bound is weaker. Both formulations have the same integer solutions.`,
    });
  }
  return {
    id: 'bigm', topic: 't104', title: inst.title || 'Smallest valid big-M',
    statement: () => frag(
      `A binary variable $z$ must switch a constraint on: $$z=1\\ \\Rightarrow\\ ${linTex(a, names)}\\le ${b}.$$ The variables live in the box $X_0$:`,
      dataTable(['Variable'].concat(names.map((_, j) => `$x_{${j + 1}}$`)), [['Lower bound'].concat(lo), ['Upper bound'].concat(hi), ['Coefficient $a_j$'].concat(a)], 'compact'),
    ),
    rules: 'Model the implication as $a^\\top x\\le b+M(1-z)$ and use the smallest valid constant.',
    steps,
    wrapup: 'Big-M formulations are correct for any large enough M, but the LP relaxation gets weaker as M grows. Always compute M from the bounds of the variables.',
  };
}

function randomBigM(rng, level) {
  const n = level === 1 ? 2 : 3;
  for (let t = 0; t < 500; t++) {
    const a = Array.from({ length: n }, () => (level >= 2 && rng.bool(0.35) ? -rng.int(1, 4) : rng.int(1, 5)));
    const lo = a.map(() => (level >= 3 ? rng.int(0, 2) : 0));
    const hi = lo.map((l) => l + rng.int(2, 8));
    const maxLhs = a.reduce((s, aj, j) => s + aj * (aj >= 0 ? hi[j] : lo[j]), 0);
    const minLhs = a.reduce((s, aj, j) => s + aj * (aj >= 0 ? lo[j] : hi[j]), 0);
    const b = rng.int(Math.max(minLhs + 1, Math.floor(maxLhs / 3)), maxLhs - 2);
    const M = maxLhs - b;
    if (M < 3 || b <= minLhs) continue;
    const delta = rng.int(1, M - 1);
    return { a, lo, hi, b, delta, loose: rng.pick([10, 100, 1000].filter((x) => x > M)) || 10 * M };
  }
  return { a: [2, 3], lo: [0, 0], hi: [4, 5], b: 12, delta: 5, loose: 100 };
}

export const bigMDrill = {
  id: 'bigm', title: 'Smallest valid big-M', topic: 't104', minutes: 5,
  blurb: 'Compute M* from variable bounds, write the on/off constraint, and see what a loose M does to the relaxation.',
  presets: [{ id: 'basic', label: 'Two-variable example', make: () => ({ a: [2, 3], lo: [0, 0], hi: [4, 5], b: 12, delta: 5, loose: 100, title: 'Smallest valid big-M — worked example' }) }],
  random: (rng, level) => ({ ...randomBigM(rng, level), title: 'Smallest valid big-M — practice' }),
  build: buildBigM,
};

// ---------------------------------------------------------------- fixed-charge production mix
function buildFixed(inst) {
  const { A, B, beta, tbar } = inst;
  const lp = solveLP({ sense: 'max', c: [1, 0], rows: [{ a: [1, 1], op: '<=', b: A }, { a: [1, beta], op: '<=', b: B }] });
  const M = lp.obj; // max q
  const T0 = solveLP({ sense: 'max', c: [0, 1], rows: [{ a: [1, 1], op: '<=', b: A }, { a: [1, beta], op: '<=', b: B }, { a: [1, 0], op: '<=', b: 0 }] }).obj;
  const T1 = solveLP({ sense: 'max', c: [1, 1], rows: [{ a: [1, 1], op: '<=', b: A }, { a: [1, beta], op: '<=', b: B }] }).obj;
  const qbar = Frac.of(Math.min(A - tbar, B - beta * tbar));
  const ybar = qbar.div(M);
  const slope = T1.sub(T0);
  const lhs = qbar.add(fr(tbar));
  const rhs = T0.add(slope.mul(ybar));
  const violated = lhs.gt(rhs);
  const cutText = ineqText([1, 1, slope.neg()], ['q', 't', 'y'], '<=', T0);
  return {
    id: 'fixedcharge', topic: 't104', title: inst.title || 'Fixed charge and a valid inequality',
    statement: () => frag(
      `A product can be made in quantity $q$ only if a set-up is paid ($y=1$); a second product has quantity $t$. $$\\max\\ ${inst.obj || '5q+3t-6y'}\\quad\\text{s.t.}\\quad q+t\\le ${A},\\quad q+${beta}t\\le ${B},\\quad q\\le My,\\quad q,t\\ge 0,\\ y\\in\\{0,1\\}.$$`,
    ),
    rules: 'Use the smallest valid $M$. A point is feasible for the LP relaxation when it satisfies every constraint with $0\\le y\\le 1$.',
    steps: [
      {
        title: 'Smallest valid M',
        text: '$M$ must be at least the largest value $q$ can take in any feasible solution.',
        fields: [{ type: 'num', label: 'Smallest valid $M$', answer: M, mis: [{ value: B, msg: `$q$ is also limited by $q+t\\le ${A}$.` }, { value: A + B, msg: 'Each constraint bounds $q$ on its own; take the tighter one, not the sum.' }].filter((m) => !fr(m.value).eq(M)) }],
        explain: `With $t=0$ the two constraints give $q\\le ${A}$ and $q\\le ${B}$, so $q\\le ${P(M)}$ and $M=${P(M)}$.`,
      },
      {
        title: 'A fractional point of the relaxation',
        text: `Consider $(q,t,y)=(${P(qbar)},\\ ${tbar},\\ ${ybar.toLatex()})$ with $M=${P(M)}$.`,
        fields: [
          { type: 'num', label: 'Right-hand side $My$ at this point', answer: M.mul(ybar) },
          { type: 'choice', label: 'Is the point feasible for the LP relaxation?', options: YN, answer: 'yes' },
          { type: 'choice', label: 'Is it feasible for the integer problem?', options: YN, answer: ybar.isInt() ? 'yes' : 'no' },
        ],
        explain: `$q+t=${P(lhs)}\\le ${A}$, $q+${beta}t=${P(qbar.add(fr(beta * tbar)))}\\le ${B}$ and $q=${P(qbar)}\\le My=${P(M.mul(ybar))}$: every constraint holds, so the relaxation accepts it. It pays only ${ybar.toLatex()} of the set-up cost while producing, which is why the LP bound is too optimistic.`,
      },
      {
        title: 'Derive a valid inequality',
        text: 'Find the largest total output $q+t$ in each of the two cases of the binary variable.',
        fields: [
          { type: 'num', label: 'Largest $q+t$ when $y=0$', answer: T0 },
          { type: 'num', label: 'Largest $q+t$ when $y=1$', answer: T1 },
          { type: 'ineq', label: 'Inequality $q+t\\le \\alpha+\\beta y$ that is tight in both cases', answer: cutText, answerText: cutText, order: ['q', 't', 'y'], placeholder: 'e.g. q + t <= 4 + 2y' },
        ],
        explain: `If $y=0$ then $q=0$ and $t\\le\\min\\{${A},\\ ${B}/${beta}\\}=${P(T0)}$. If $y=1$ the best is $q+t=${P(T1)}$. The line through the two cases is $q+t\\le ${P(T0)}+${P(slope)}y$; it holds for every integer solution, so it is a valid inequality.`,
      },
      {
        title: 'Does it cut off the fractional point?',
        fields: [
          { type: 'num', label: 'Left-hand side $q+t$ at the point', answer: lhs },
          { type: 'num', label: `Right-hand side $${P(T0)}+${P(slope)}y$ at the point`, answer: rhs },
          { type: 'choice', label: 'Is the point cut off?', options: YN, answer: violated ? 'yes' : 'no' },
        ],
        explain: `$${P(lhs)}${violated ? '\\gt' : '\\le'} ${rhs.toLatex()}$, so the point is ${violated ? 'cut off: the formulation with this inequality is strictly stronger' : 'not cut off by this inequality'}.`,
      },
    ],
    wrapup: 'A valid inequality must hold for every integer solution; it strengthens the formulation when it removes fractional points of the LP relaxation.',
  };
}

function randomFixed(rng) {
  for (let i = 0; i < 400; i++) {
    const beta = rng.pick([2, 2, 3]);
    const A = rng.int(5, 9);
    const B = rng.int(A, A + 5);
    if (B / beta >= A) continue;
    const T0 = Math.min(A, B / beta);
    const tbar = rng.int(1, Math.floor(T0));
    const qbar = Math.min(A - tbar, B - beta * tbar);
    if (qbar <= 0 || qbar >= A) continue;
    const y = qbar / A;
    if (qbar + tbar > T0 + (A - T0) * y + 1e-9 && Number.isInteger(B) && (B % beta === 0 || beta === 2)) return { A, B, beta, tbar };
  }
  return { A: 6, B: 8, beta: 2, tbar: 3 };
}

export const fixedChargeDrill = {
  id: 'fixedcharge', title: 'Fixed charge: smallest M and a valid inequality', topic: 't104', minutes: 7,
  blurb: 'The production-mix example of slides 104: tight M, a fractional LP point, and the inequality that removes it.',
  presets: [{ id: 'slides', label: 'Production mix (slides 104)', make: () => ({ A: 6, B: 8, beta: 2, tbar: 3, title: 'Fixed charge — production mix (slides 104)' }) }],
  random: (rng) => ({ ...randomFixed(rng), title: 'Fixed charge — practice' }),
  build: buildFixed,
};

// ---------------------------------------------------------------- facility location: aggregated vs disaggregated linking
function buildUfl(inst) {
  const { x, f } = inst; // x[i][j]: fraction of customer i served by facility j
  const m = x.length, n = f.length;
  const X = x.map((row) => row.map((v) => Frac.parse(String(v))));
  const agg = f.map((_, j) => X.reduce((s, row) => s.add(row[j]), fr(0)).div(m));
  const dis = f.map((_, j) => X.reduce((s, row) => (row[j].gt(s) ? row[j] : s), fr(0)));
  const costAgg = agg.reduce((s, y, j) => s.add(y.mul(f[j])), fr(0));
  const costDis = dis.reduce((s, y, j) => s.add(y.mul(f[j])), fr(0));
  const cols = f.map((_, j) => ({ key: `k${j}`, head: `$y_{${j + 1}}$`, kind: 'num', plain: `y${j + 1}` }));
  const row = (vals) => ({ cells: Object.fromEntries(vals.map((v, j) => [`k${j}`, v])) });
  return {
    id: 'ufl', topic: 't104', title: inst.title || 'Facility location: weak and strong linking',
    statement: () => frag(
      `Uncapacitated facility location with $m=${m}$ customers and $n=${n}$ facilities. $x_{ij}$ is the fraction of customer $i$ served by facility $j$ and $y_j$ opens facility $j$ at fixed cost $f_j$. A solution of the LP relaxation assigns the customers as follows:`,
      dataTable([''].concat(f.map((_, j) => `Facility ${j + 1}`)), X.map((r, i) => [`Customer ${i + 1}`].concat(r.map((v) => P(v)))).concat([['Fixed cost $f_j$'].concat(f)]), 'compact'),
      `<b>Aggregated</b> linking: $\\sum_i x_{ij}\\le m\\,y_j$ for each $j$. <b>Disaggregated</b> linking: $x_{ij}\\le y_j$ for each $i,j$.`,
    ),
    rules: 'The LP minimises cost, so it sets each $y_j$ to the smallest value its linking constraints allow.',
    steps: [
      {
        title: 'Aggregated formulation',
        fields: [{ type: 'table', label: 'Smallest $y_j$ allowed by $\\sum_i x_{ij}\\le m\\,y_j$', columns: cols, rows: [row(agg)] }, { type: 'num', label: 'Fixed cost paid, $\\sum_j f_jy_j$', answer: costAgg }],
        explain: `$y_j\\ge\\frac1m\\sum_i x_{ij}$: ${agg.map((y, j) => `$y_{${j + 1}}=${y.toLatex()}$`).join(', ')}. Fixed cost $${costAgg.toLatex()}$${costAgg.isInt() ? '' : ` $\\approx ${costAgg.toNumber().toFixed(2)}$`}.`,
      },
      {
        title: 'Disaggregated formulation',
        fields: [{ type: 'table', label: 'Smallest $y_j$ allowed by $x_{ij}\\le y_j$', columns: cols, rows: [row(dis)] }, { type: 'num', label: 'Fixed cost paid, $\\sum_j f_jy_j$', answer: costDis }],
        explain: `$y_j\\ge\\max_i x_{ij}$: ${dis.map((y, j) => `$y_{${j + 1}}=${y.toLatex()}$`).join(', ')}. Fixed cost $${costDis.toLatex()}$. The same assignment costs ${P(costDis.sub(costAgg))} more: the bound is higher (better for a minimisation).`,
      },
      {
        title: 'Size and strength',
        fields: [
          { type: 'int', label: 'Number of linking rows, aggregated', answer: n },
          { type: 'int', label: 'Number of linking rows, disaggregated', answer: m * n },
          { type: 'choice', stack: true, label: 'Which statement is correct?', options: [
            { value: 'a', label: 'The aggregated formulation is stronger because it has fewer constraints.' },
            { value: 'b', label: 'The disaggregated formulation is at least as strong: adding its $m$ rows for a facility gives the aggregated row, so its LP region is contained in the aggregated one.' },
            { value: 'c', label: 'They have different integer solutions, so they cannot be compared.' },
            { value: 'd', label: 'They give the same LP bound; only the solution time differs.' },
          ], answer: 'b', mis: { a: 'Fewer rows means a smaller model, not a tighter one. Size alone does not determine strength.', c: 'Both are correct formulations of the same problem: with binary $y$ they have exactly the same solutions.', d: 'The numbers you just computed differ.' } },
        ],
        explain: `Summing $x_{ij}\\le y_j$ over $i$ gives $\\sum_i x_{ij}\\le m\\,y_j$, so every point of the disaggregated relaxation satisfies the aggregated one, but not conversely (this point). In lab 104 (80 customers, 12 facilities) the aggregated LP bound was 1884.20 against an optimum of 2956.00 (a 36.26% root gap), while the disaggregated LP bound was already 2956.00.`,
      },
    ],
    wrapup: 'More constraints can mean a much better bound. Compare formulations by their LP regions (R_A ⊆ R_B), never by their size.',
  };
}

function randomUfl(rng, level) {
  const m = level === 1 ? 3 : 4, n = 2;
  const opts = level >= 2 ? ['0', '1', '1/2', '1/4', '3/4', '1/3', '2/3'] : ['0', '1', '1/2'];
  for (let t = 0; t < 300; t++) {
    const x = Array.from({ length: m }, () => { const a = rng.pick(opts); return [a, fr(1).sub(Frac.parse(a)).toString()]; });
    const col0 = x.map((r) => Frac.parse(r[0]));
    if (col0.every((v) => v.eq(col0[0]))) continue;
    if (col0.every((v) => v.isInt())) continue;
    return { x, f: [rng.int(2, 9) * 10, rng.int(2, 9) * 10] };
  }
  return { x: [['1', '0'], ['1/2', '1/2'], ['0', '1']], f: [60, 40] };
}

export const uflDrill = {
  id: 'ufl', title: 'Facility location: weak versus strong linking', topic: 't104', minutes: 6,
  blurb: 'Compute what the aggregated and disaggregated constraints force on y for the same fractional assignment (lab 104).',
  presets: [{ id: 'small', label: 'Three customers, two facilities', make: () => ({ x: [['1', '0'], ['1/2', '1/2'], ['0', '1']], f: [60, 40], title: 'Facility location — weak versus strong linking' }) }],
  random: (rng, level) => ({ ...randomUfl(rng, level), title: 'Facility location — practice' }),
  build: buildUfl,
};
