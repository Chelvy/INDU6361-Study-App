// Trainers for classes 7-10 (heuristics, Lagrangian relaxation, Benders, column generation).
// The instructor's slides for these classes were not released when the app was built: the exercises follow the
// standard textbook treatment (Wolsey, Integer Programming, ch. 10-13) and are checked by brute force in the tests.
import { Frac, ZERO } from '../math/frac.js';
import { solveLP } from '../math/lp.js';
import { tspBrute } from '../math/tsp.js';
import { matrixTable } from '../viz.js';
import { linTex, ineqText, ineqTex } from '../util.js';
import { dataTable, frag } from './common.js';

const fr = (v) => Frac.of(v);
const P = (v) => fr(v).pretty(6);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const xn = (n) => Array.from({ length: n }, (_, j) => `x${j + 1}`);

// ---------------------------------------------------------------- Lagrangian relaxation of a covering constraint
export function lagrangianValue(c, a, b, lam) {
  const L = fr(lam);
  const red = c.map((cj, j) => fr(cj).sub(L.mul(a[j])));
  const x = red.map((r) => (r.sign() < 0 ? 1 : 0));
  const value = L.mul(b).add(red.reduce((s, r) => (r.sign() < 0 ? s.add(r) : s), ZERO));
  const g = fr(b).sub(a.reduce((s, aj, j) => s + aj * x[j], 0));
  return { red, x, value, g, tie: red.some((r) => r.isZero()) };
}
export function coveringBrute(c, a, b) {
  const n = c.length;
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    let w = 0, cost = 0;
    for (let j = 0; j < n; j++) if (mask & (1 << j)) { w += a[j]; cost += c[j]; }
    if (w >= b && (best === null || cost < best.cost)) best = { cost, x: Array.from({ length: n }, (_, j) => (mask & (1 << j) ? 1 : 0)) };
  }
  return best;
}

function buildLagrange(inst) {
  const { c, a, b } = inst;
  const n = c.length;
  const names = xn(n);
  const l1 = Frac.parse(String(inst.lam)), step = Frac.parse(String(inst.step));
  const r1 = lagrangianValue(c, a, b, l1);
  let l2 = l1.add(step.mul(r1.g));
  if (l2.sign() < 0) l2 = ZERO;
  const r2 = lagrangianValue(c, a, b, l2);
  const opt = coveringBrute(c, a, b);
  const lp = solveLP({ sense: 'min', c, rows: [{ a, op: '>=', b }].concat(c.map((_, j) => ({ a: c.map((__, k) => (k === j ? 1 : 0)), op: '<=', b: 1 }))) });
  const cols = names.map((_, j) => ({ key: `k${j}`, head: `$j=${j + 1}$`, kind: 'num', plain: `item ${j + 1}` }));
  const row = (vals) => ({ cells: Object.fromEntries(vals.map((v, j) => [`k${j}`, v])) });
  const evalStep = (title, lam, r, extra) => ({
    title,
    text: `Evaluate the Lagrangian function at $\\lambda=${lam.toLatex()}$: $\\ L(\\lambda)=\\lambda b+\\sum_j\\min\\{0,\\ c_j-\\lambda a_j\\}$.`,
    fields: [
      { type: 'table', label: 'Lagrangian costs $c_j-\\lambda a_j$', columns: cols, rows: [row(r.red)] },
      { type: 'set', label: 'Items with $x_j=1$ in the Lagrangian subproblem (or <code>none</code>)', answer: r.x.map((v, j) => (v ? String(j + 1) : null)).filter(Boolean), placeholder: 'e.g. 1, 3' },
      { type: 'num', label: '$L(\\lambda)$', answer: r.value },
      ...extra,
    ],
    explain: `Costs: ${r.red.map((v, j) => `$${c[j]}-${lam.toLatex()}\\cdot ${a[j]}=${v.toLatex()}$`).join(', ')}. The subproblem sets $x_j=1$ exactly when the cost is negative: ${r.x.some((v) => v) ? `items ${r.x.map((v, j) => (v ? j + 1 : null)).filter(Boolean).join(', ')}` : 'no item'}. $L=${lam.toLatex()}\\cdot ${b}${r.red.filter((v) => v.sign() < 0).map((v) => v.toLatex()).join('')}=${r.value.toLatex()}$.`,
  });
  const better = r2.value.gt(r1.value) ? 'second' : r2.value.lt(r1.value) ? 'first' : 'same';
  const bestL = r2.value.gt(r1.value) ? r2.value : r1.value;
  return {
    id: 'lagrange', topic: 't401', title: inst.title || 'Lagrangian relaxation: evaluate and update',
    statement: () => frag(
      `Minimisation problem with one complicating constraint: $$z^*=\\min\\ ${linTex(c, names)}\\quad\\text{s.t.}\\quad ${ineqTex(a, names, '>=', b)},\\quad x\\in\\{0,1\\}^{${n}}.$$ Dualise the constraint with a multiplier $\\lambda\\ge 0$: $$L(\\lambda)=\\min_{x\\in\\{0,1\\}^{${n}}}\\ c^\\top x+\\lambda\\,(b-a^\\top x).$$`,
    ),
    rules: 'For a “≥” constraint in a minimisation the penalty is $\\lambda(b-a^\\top x)$ with $\\lambda\\ge 0$. A subgradient of $L$ at $\\lambda$ is $g=b-a^\\top x(\\lambda)$; the update is $\\lambda\\leftarrow\\max\\{0,\\lambda+\\text{step}\\cdot g\\}$.',
    steps: [
      evalStep('First multiplier', l1, r1, [
        { type: 'choice', label: '$L(\\lambda)$ is', options: [{ value: 'lb', label: 'a lower bound on $z^*$' }, { value: 'ub', label: 'an upper bound on $z^*$' }], answer: 'lb', mis: { ub: 'Any feasible $x$ has $b-a^\\top x\\le 0$, so the penalty only lowers its cost: the relaxed minimum cannot exceed $z^*$.' } },
        { type: 'num', label: 'Subgradient $g=b-a^\\top x(\\lambda)$', answer: r1.g },
      ]),
      {
        title: 'Subgradient step',
        text: `Use step size $${step.toLatex()}$.`,
        fields: [
          { type: 'choice', label: 'Is $x(\\lambda)$ feasible for the original problem?', options: YN, answer: r1.g.sign() <= 0 ? 'yes' : 'no' },
          { type: 'num', label: 'New multiplier', answer: l2 },
        ],
        explain: `$g=${r1.g.toLatex()}$ is ${r1.g.sign() > 0 ? 'positive: the constraint is violated by the subproblem solution, so the price of violating it must go up' : r1.g.sign() < 0 ? 'negative: the constraint is over-satisfied, so the price goes down' : 'zero: the constraint holds with equality'}. $\\lambda\\leftarrow\\max\\{0,\\ ${l1.toLatex()}+${step.toLatex()}\\cdot(${r1.g.toLatex()})\\}=${l2.toLatex()}$.`,
      },
      evalStep('Second multiplier', l2, r2, [
        { type: 'choice', label: 'Which multiplier gives the better bound?', options: [{ value: 'first', label: `$\\lambda=${l1.toLatex()}$` }, { value: 'second', label: `$\\lambda=${l2.toLatex()}$` }, { value: 'same', label: 'Both give the same bound' }], answer: better },
      ]),
      {
        title: 'How good is the bound?',
        text: `By enumeration the optimal value is $z^*=${opt.cost}$.`,
        fields: [
          { type: 'num', label: 'Best lower bound found', answer: bestL },
          { type: 'num', label: 'Absolute gap $z^*-$ best bound', answer: fr(opt.cost).sub(bestL) },
          { type: 'choice', stack: true, label: 'The best possible bound $\\max_{\\lambda\\ge 0}L(\\lambda)$ for this relaxation is', answer: 'lp', options: [
            { value: 'lp', label: 'equal to the LP relaxation bound, because the remaining set $\\{0,1\\}^n$ has the integrality property.' },
            { value: 'ip', label: 'always equal to $z^*$.' },
            { value: 'weaker', label: 'strictly weaker than the LP relaxation bound.' },
          ] },
        ],
        explain: `Lower bounds: $${r1.value.toLatex()}$ and $${r2.value.toLatex()}$; the larger is better for a minimisation. $z^*-${bestL.toLatex()}=${fr(opt.cost).sub(bestL).toLatex()}$. The Lagrangian dual is never weaker than the LP bound, and it equals it when the constraints kept in the subproblem describe an integral polyhedron, as here: the LP bound is $${lp.obj.toLatex()}$. A stronger bound needs a subproblem that is not solved by its own LP relaxation.`,
      },
    ],
    wrapup: 'Every λ ≥ 0 gives a valid bound (weak duality). L is piecewise linear and concave; the subgradient method climbs it without ever needing the LP.',
  };
}

function randomLagrange(rng, level) {
  const n = level === 1 ? 3 : 4;
  for (let t = 0; t < 1000; t++) {
    const a = Array.from({ length: n }, () => rng.int(1, 6));
    const c = a.map((aj) => aj * rng.int(1, 3) + rng.int(0, 3));
    const b = rng.int(Math.max(...a), a.reduce((s, v) => s + v, 0) - 1);
    const lam = rng.pick(level === 1 ? ['1', '2'] : ['1', '2', '1/2', '3/2']);
    const step = rng.pick(level === 3 ? ['1/2', '1/4', '1/3'] : ['1/2', '1/4', '1']);
    const r1 = lagrangianValue(c, a, b, Frac.parse(lam));
    if (r1.tie || r1.g.isZero()) continue;
    let l2 = Frac.parse(lam).add(Frac.parse(step).mul(r1.g));
    if (l2.sign() <= 0 || l2.d > 6n) continue;
    const r2 = lagrangianValue(c, a, b, l2);
    if (r2.tie || r2.value.eq(r1.value)) continue;
    if (level >= 2 && !r2.value.gt(r1.value) && rng.bool(0.7)) continue;
    return { c, a, b, lam, step };
  }
  return { c: [6, 5, 8, 4], a: [3, 2, 4, 1], b: 6, lam: '1', step: '1/4' };
}

export const lagrangeDrill = {
  id: 'lagrange', title: 'Lagrangian relaxation: evaluate and update', topic: 't401', minutes: 8,
  blurb: 'Compute L(λ) by inspection, read the subgradient, take a step, and compare the bound with z* and with the LP bound.',
  presets: [{ id: 'cover4', label: 'Four items, one covering constraint', make: () => ({ c: [6, 5, 8, 4], a: [3, 2, 4, 1], b: 6, lam: '3', step: '1/4', title: 'Lagrangian relaxation — worked example' }) }],
  random: (rng, level) => ({ ...randomLagrange(rng, level), title: 'Lagrangian relaxation — practice' }),
  build: buildLagrange,
};

// ---------------------------------------------------------------- cutting stock: pricing a column
export function bestPattern(w, W, pi) {
  const m = w.length;
  let best = { value: ZERO, p: new Array(m).fill(0) };
  const p = new Array(m).fill(0);
  const rec = (i, left, val) => {
    if (i === m) { if (val.gt(best.value)) best = { value: val, p: p.slice() }; return; }
    for (let k = Math.floor(left / w[i]); k >= 0; k--) { p[i] = k; rec(i + 1, left - k * w[i], val.add(pi[i].mul(k))); }
    p[i] = 0;
  };
  rec(0, W, ZERO);
  return best;
}

function buildPricing(inst) {
  const { W, w, d, pattern } = inst;
  const m = w.length;
  const cap = w.map((wi) => Math.floor(W / wi));
  const pi = cap.map((k) => fr(1).div(k));
  const x0 = d.map((di, i) => fr(di).div(cap[i]));
  const z0 = x0.reduce((s, v) => s.add(v), ZERO);
  const val = pattern.reduce((s, k, i) => s.add(pi[i].mul(k)), ZERO);
  const rc = fr(1).sub(val);
  const best = bestPattern(w, W, pi);
  const cols = w.map((_, i) => ({ key: `k${i}`, head: `item ${i + 1}`, kind: 'num', plain: `item ${i + 1}` }));
  const row = (head, vals) => ({ head, cells: Object.fromEntries(vals.map((v, i) => [`k${i}`, v])) });
  return {
    id: 'pricing', topic: 't403', title: inst.title || 'Column generation: pricing a cutting pattern',
    statement: () => frag(
      `Cutting stock: rolls of width $W=${W}$ are cut into items. The master problem chooses how many rolls to cut with each pattern, $\\min\\sum_p\\lambda_p$ s.t. $\\sum_p a_{ip}\\lambda_p\\ge d_i$.`,
      dataTable(['Item $i$'].concat(w.map((_, i) => i + 1)), [['Width $w_i$'].concat(w), ['Demand $d_i$'].concat(d)], 'compact'),
      'The restricted master starts with one pattern per item: as many copies of that item as fit in a roll.',
    ),
    rules: 'A pattern $a$ is feasible if $\\sum_iw_ia_i\\le W$ with $a_i$ nonnegative integers. Its reduced cost is $1-\\sum_i\\pi_ia_i$, where $\\pi$ are the dual values of the demand rows. A column can improve the LP only if its reduced cost is negative.',
    steps: [
      {
        title: 'The initial restricted master',
        fields: [
          { type: 'table', label: 'Copies per roll in the single-item patterns, and the dual values', corner: '', columns: cols, rows: [row('$\\lfloor W/w_i\\rfloor$', cap), row('$\\pi_i$', pi)] },
          { type: 'num', label: 'LP value of this restricted master (rolls)', answer: z0 },
        ],
        explain: `Pattern $i$ yields $\\lfloor ${W}/w_i\\rfloor$ copies, so $\\lambda_i=d_i/\\lfloor W/w_i\\rfloor$: ${x0.map((v) => v.toLatex()).join(' + ')} $=${z0.toLatex()}$ rolls. Each column is basic, so its reduced cost is zero: $1-\\pi_i\\lfloor W/w_i\\rfloor=0$, giving $\\pi=(${pi.map((v) => v.toLatex()).join(', ')})$.`,
      },
      {
        title: 'Price a candidate pattern',
        text: `Candidate pattern $a=(${pattern.join(', ')})$ (width used: ${pattern.reduce((s, k, i) => s + k * w[i], 0)} ≤ ${W}).`,
        fields: [
          { type: 'num', label: '$\\sum_i\\pi_ia_i$', answer: val },
          { type: 'num', label: 'Reduced cost', answer: rc },
          { type: 'choice', label: 'Should this column be added to the master?', options: YN, answer: rc.sign() < 0 ? 'yes' : 'no' },
        ],
        explain: `$\\sum\\pi_ia_i=${val.toLatex()}$, reduced cost $1-${val.toLatex()}=${rc.toLatex()}$: ${rc.sign() < 0 ? 'negative, the column can lower the number of rolls and is added' : 'not negative, the column cannot improve the current LP'}.`,
      },
      {
        title: 'The pricing problem',
        text: 'The most negative reduced cost is found by an integer knapsack: $\\max\\sum_i\\pi_ia_i$ s.t. $\\sum_iw_ia_i\\le W$, $a\\in\\mathbb{Z}_+^m$.',
        fields: [
          { type: 'num', label: 'Optimal value of the pricing knapsack', answer: best.value },
          { type: 'choice', stack: true, label: 'Conclusion', answer: best.value.gt(fr(1)) ? 'more' : 'done', options: [
            { value: 'more', label: 'A column with negative reduced cost exists: add it and re-solve the restricted master.' },
            { value: 'done', label: 'No column has negative reduced cost: the restricted master solves the LP relaxation of the full master.' },
            { value: 'int', label: 'The current solution is the integer optimum of the cutting-stock problem.' },
          ], mis: { int: 'Column generation solves the LP relaxation of the master. Integer rolls need rounding or branch-and-price.' } },
        ],
        explain: `Best pattern $a=(${best.p.join(', ')})$ with value $${best.value.toLatex()}$${best.value.gt(fr(1)) ? ` $\\gt 1$: reduced cost $${fr(1).sub(best.value).toLatex()}$, so column generation continues.` : ' $\\le 1$: no improving column exists and the LP master is solved.'} When the loop stops with LP value $z_{LP}$, $\\lceil z_{LP}\\rceil$ is a lower bound on the number of rolls.`,
      },
    ],
    wrapup: 'The master has one column per pattern, far too many to list. Column generation keeps a few and asks the pricing problem for the next useful one: it is the dual of row generation, with the pricing problem in the role of separation.',
  };
}

function randomPricing(rng, level) {
  const m = level === 1 ? 2 : 3;
  for (let t = 0; t < 500; t++) {
    const W = rng.pick([10, 12, 15, 16, 20]);
    const w = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x < W)).slice(0, m).sort((p, q) => q - p);
    const cap = w.map((wi) => Math.floor(W / wi));
    if (cap.some((k) => k > 6)) continue;
    const d = cap.map((k) => k * rng.int(1, 4) + (level >= 2 ? rng.int(0, k - 1) : 0));
    const pi = cap.map((k) => fr(1).div(k));
    const best = bestPattern(w, W, pi);
    // candidate: a random mixed feasible pattern
    const pattern = new Array(m).fill(0);
    let left = W;
    rng.shuffle(w.map((_, i) => i)).forEach((i) => { const k = rng.int(0, Math.floor(left / w[i])); pattern[i] = k; left -= k * w[i]; });
    if (pattern.filter((k) => k > 0).length < 2) continue;
    if (!best.value.gt(fr(1)) && rng.bool(0.8)) continue;
    return { W, w, d, pattern };
  }
  return { W: 10, w: [6, 4, 3], d: [3, 6, 9], pattern: [1, 1, 0] };
}

export const pricingDrill = {
  id: 'pricing', title: 'Column generation: pricing', topic: 't403', minutes: 7,
  blurb: 'Dual values of the restricted master, reduced cost of a pattern, and the knapsack pricing problem for cutting stock.',
  presets: [{ id: 'roll10', label: 'Rolls of width 10, three items', make: () => ({ W: 10, w: [6, 4, 3], d: [3, 6, 9], pattern: [1, 1, 0], title: 'Column generation — cutting stock example' }) }],
  random: (rng, level) => ({ ...randomPricing(rng, level), title: 'Column generation — practice' }),
  build: buildPricing,
};

// ---------------------------------------------------------------- Benders optimality cut (complete recourse)
export function recourse(inst, y) {
  const short = inst.h.map((hi, i) => hi - inst.T[i].reduce((s, tij, j) => s + tij * y[j], 0));
  const x = short.map((v) => Math.max(0, v));
  const u = short.map((v, i) => (v > 0 ? inst.pen[i] : 0));
  const Q = x.reduce((s, v, i) => s + inst.pen[i] * v, 0);
  return { short, x, u, Q };
}

function buildBenders(inst) {
  const { f, h, T, pen, ybar, thetaBar } = inst;
  const n = f.length, m = h.length;
  const r = recourse(inst, ybar);
  const fixed = f.reduce((s, fj, j) => s + fj * ybar[j], 0);
  const UB = fixed + r.Q;
  const LB = fixed + thetaBar;
  const konst = r.u.reduce((s, ui, i) => s + ui * h[i], 0);
  const coef = f.map((_, j) => r.u.reduce((s, ui, i) => s + ui * T[i][j], 0));
  const yNames = f.map((_, j) => `y${j + 1}`);
  const cutText = ineqText([1].concat(coef), ['t'].concat(yNames), '>=', konst);
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) { const y = f.map((_, j) => (mask & (1 << j) ? 1 : 0)); const v = f.reduce((s, fj, j) => s + fj * y[j], 0) + recourse(inst, y).Q; if (best === null || v < best.v) best = { v, y }; }
  const iCols = h.map((_, i) => ({ key: `k${i}`, head: `$i=${i + 1}$`, kind: 'num', plain: `row ${i + 1}` }));
  const row = (head, vals) => ({ head, cells: Object.fromEntries(vals.map((v, i) => [`k${i}`, v])) });
  return {
    id: 'benderscut', topic: 't402', title: inst.title || 'Benders decomposition: one optimality cut',
    statement: () => frag(
      `Design variables $y\\in\\{0,1\\}^{${n}}$ with fixed costs $f=(${f.join(', ')})$. Once $y$ is fixed, the operating problem is the linear program $$Q(y)=\\min\\ ${linTex(pen, h.map((_, i) => `x${i + 1}`))}\\quad\\text{s.t.}\\quad x_i\\ge h_i-\\sum_jT_{ij}y_j\\ \\ (i=1,\\dots,${m}),\\quad x\\ge 0,$$ with $h=(${h.join(', ')})$ and`,
      matrixTable(T, { rowHeads: h.map((_, i) => `row ${i + 1}`), colHeads: yNames.map((_, j) => `$y_{${j + 1}}$`), corner: '$T$' }),
      `The Benders master is $\\min\\ f^\\top y+\\theta$ subject to the cuts found so far. Its current solution is $\\bar y=(${ybar.join(', ')})$, $\\bar\\theta=${thetaBar}$.`,
    ),
    rules: 'Dual of the subproblem: $\\max\\sum_iu_i(h_i-T_i\\bar y)$ with $0\\le u_i\\le c_i$. Optimality cut from a dual optimum $\\bar u$: $\\ \\theta\\ge\\sum_i\\bar u_i(h_i-T_iy)$.',
    steps: [
      {
        title: 'Solve the subproblem at the master solution',
        fields: [
          { type: 'table', label: 'Shortfall $h_i-T_i\\bar y$ and the optimal $x_i$', corner: '', columns: iCols, rows: [row('$h_i-T_i\\bar y$', r.short), row('$x_i$', r.x)] },
          { type: 'num', label: '$Q(\\bar y)$', answer: r.Q },
          { type: 'num', label: 'Upper bound: cost of the feasible solution $(\\bar y,x)$', answer: UB },
          { type: 'num', label: 'Lower bound: master value $f^\\top\\bar y+\\bar\\theta$', answer: LB },
        ],
        explain: `Each $x_i=\\max\\{0,\\ h_i-T_i\\bar y\\}$: $x=(${r.x.join(', ')})$ and $Q(\\bar y)=${r.Q}$. The pair $(\\bar y,x)$ is feasible, so $f^\\top\\bar y+Q(\\bar y)=${fixed}+${r.Q}=${UB}$ is an upper bound. The master is a relaxation, so its value $${fixed}+${thetaBar}=${LB}$ is a lower bound. ${UB > LB ? `They differ: $\\bar\\theta=${thetaBar}$ underestimates $Q(\\bar y)=${r.Q}$, so a cut is needed.` : 'They are equal: the current solution is optimal.'}`,
      },
      {
        title: 'Dual solution',
        fields: [{ type: 'table', label: 'Dual values $\\bar u_i$ (use $u_i=0$ when the shortfall is not positive)', columns: iCols, rows: [row(undefined, r.u)].map((x) => ({ cells: x.cells })) }],
        explain: `The dual objective $\\sum_iu_i(h_i-T_i\\bar y)$ is maximised by $u_i=c_i$ where the shortfall is positive and $u_i=0$ elsewhere: $\\bar u=(${r.u.join(', ')})$, with value $${r.Q}=Q(\\bar y)$ (strong duality).`,
      },
      {
        title: 'The optimality cut',
        text: 'Write the cut with $\\theta$ (type it as <code>t</code>) and the $y$ variables on the left.',
        fields: [
          { type: 'num', label: 'Constant term $\\sum_i\\bar u_ih_i$', answer: konst },
          { type: 'ineq', label: 'Benders optimality cut', answer: cutText, answerText: cutText, order: ['t'].concat(yNames), placeholder: 'e.g. t + 12y1 + 8y2 >= 30' },
          { type: 'num', label: 'Value the cut forces on $\\theta$ at $\\bar y$', answer: r.Q },
        ],
        explain: `$\\theta\\ge\\sum_i\\bar u_i(h_i-T_iy)=${konst}-(${linTex(coef, yNames)})$, i.e. $${ineqTex([1].concat(coef), ['\\theta'].concat(yNames), '>=', konst)}$. At $\\bar y$ it gives $\\theta\\ge ${r.Q}$, so the current master solution ($\\bar\\theta=${thetaBar}$) is cut off. The cut is valid for every $y$ because $\\bar u$ stays dual feasible whatever $y$ is: $Q(y)\\ge\\sum_i\\bar u_i(h_i-T_iy)$.`,
      },
      {
        title: 'What happens next',
        fields: [{ type: 'choice', stack: true, label: 'Which statement is correct?', answer: 'loop', options: [
          { value: 'loop', label: 'Add the cut, re-solve the master (new lower bound), solve the subproblem again (possibly a better upper bound); stop when the bounds meet.' },
          { value: 'feas', label: 'A feasibility cut is needed here because the subproblem was infeasible.' },
          { value: 'one', label: 'One optimality cut always suffices, because the subproblem is a linear program.' },
        ], mis: { feas: 'This subproblem is feasible for every $y$ (take $x$ large enough). Feasibility cuts come from dual rays when a subproblem is infeasible.', one: 'Each cut is exact only at the $y$ where it was generated; $Q$ is the maximum of all such cuts.' } }],
        explain: `$Q(y)$ is convex and piecewise linear: the maximum of one affine function per dual extreme point. Benders adds these pieces on demand. For this instance the optimum is $y=(${best.y.join(', ')})$ with total cost ${best.v}.`,
      },
    ],
    wrapup: 'Benders is row generation on the value function of the continuous variables: optimality cuts from dual extreme points, feasibility cuts from dual extreme rays, lower bound from the master and upper bound from the subproblems.',
  };
}

function randomBenders(rng, level) {
  const n = 2, m = level === 1 ? 2 : 3;
  for (let t = 0; t < 400; t++) {
    const h = Array.from({ length: m }, () => rng.int(3, 9));
    const T = Array.from({ length: m }, () => Array.from({ length: n }, () => rng.pick([0, 2, 3, 4, 5, 6])));
    if (T.some((r) => r.every((v) => v === 0))) continue;
    const pen = Array.from({ length: m }, () => rng.int(2, 6));
    const f = Array.from({ length: n }, () => rng.int(5, 20));
    const ybar = level === 1 ? [0, 0] : rng.pick([[0, 0], [1, 0], [0, 1]]);
    const inst = { f, h, T, pen, ybar, thetaBar: 0 };
    const r = recourse(inst, ybar);
    if (r.Q === 0 || r.short.filter((v) => v > 0).length < (level === 1 ? 1 : 2) || r.short.some((v) => v === 0)) continue;
    if (level >= 2 && r.short.every((v) => v > 0) && rng.bool(0.6)) continue;
    return inst;
  }
  return { f: [10, 14], h: [6, 8], T: [[4, 2], [3, 6]], pen: [3, 4], ybar: [0, 0], thetaBar: 0 };
}

export const bendersDrill = {
  id: 'benderscut', title: 'Benders: derive an optimality cut', topic: 't402', minutes: 8,
  blurb: 'Solve the subproblem at the master solution, read the dual, write the cut, and identify the bounds.',
  presets: [{ id: 'two', label: 'Two design variables, two rows', make: () => ({ f: [10, 14], h: [6, 8], T: [[4, 2], [3, 6]], pen: [3, 4], ybar: [0, 0], thetaBar: 0, title: 'Benders decomposition — worked example' }) }],
  random: (rng, level) => ({ ...randomBenders(rng, level), title: 'Benders decomposition — practice' }),
  build: buildBenders,
};

// ---------------------------------------------------------------- TSP heuristics: nearest neighbour and 2-opt
export function nearestNeighbour(D) {
  const n = D.length;
  const tour = [0];
  const used = new Array(n).fill(false);
  used[0] = true;
  while (tour.length < n) {
    const last = tour[tour.length - 1];
    let best = -1;
    for (let j = 0; j < n; j++) if (!used[j] && (best < 0 || D[last][j] < D[last][best])) best = j;
    used[best] = true; tour.push(best);
  }
  return tour;
}
export const tourLength = (D, tour) => tour.reduce((s, v, k) => s + D[v][tour[(k + 1) % tour.length]], 0);
// 2-opt move (i, j), i < j: remove edges (t_i, t_{i+1}) and (t_j, t_{j+1}), reverse the segment between them.
export function twoOptMoves(D, tour) {
  const n = tour.length;
  const moves = [];
  for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = tour[i], b = tour[i + 1], c = tour[j], d = tour[(j + 1) % n];
    moves.push({ i, j, a, b, c, d, delta: D[a][c] + D[b][d] - D[a][b] - D[c][d] });
  }
  return moves;
}

function buildTwoOpt(inst) {
  const D = inst.D;
  const n = D.length;
  const nn = nearestNeighbour(D);
  const len = tourLength(D, nn);
  const moves = twoOptMoves(D, nn);
  const mv = moves[inst.move % moves.length];
  const best = moves.reduce((p, q) => (q.delta < p.delta ? q : p));
  const cost1 = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : D[i - 1][j - 1])));
  const opt = tspBrute(cost1);
  const lab = (v) => v + 1;
  const M = D.map((r, i) => r.map((v, j) => (i === j ? '–' : v)));
  const heads = D.map((_, i) => String(i + 1));
  return {
    id: 'twoopt', topic: 't301', title: inst.title || 'TSP heuristics: nearest neighbour and 2-opt',
    statement: () => frag(`Symmetric TSP on ${n} cities with the distance matrix:`, matrixTable(M, { rowHeads: heads, colHeads: heads, corner: '$d_{ij}$' })),
    rules: 'Nearest neighbour: start at city 1 and always go to the closest unvisited city (ties: the smallest index). A 2-opt move removes two edges $(a,b)$ and $(c,d)$ of the tour and reconnects it with $(a,c)$ and $(b,d)$, reversing the path in between.',
    steps: [
      {
        title: 'Constructive heuristic',
        fields: [
          { type: 'seq', label: 'Nearest-neighbour tour, starting at 1', answer: nn.map((v) => String(lab(v))), placeholder: 'e.g. 1 - 3 - 2 - 5 - 4' },
          { type: 'num', label: 'Its length (including the return to 1)', answer: len, mis: [{ value: len - D[nn[n - 1]][0], msg: 'Add the last edge back to city 1.' }] },
        ],
        explain: `${nn.map((v, k) => (k < n - 1 ? `${lab(v)}→${lab(nn[k + 1])} (${D[v][nn[k + 1]]})` : `${lab(v)}→1 (${D[v][0]})`)).join(', ')}: length ${len}. The closing edge is forced and is often long: the greedy choice is myopic.`,
      },
      {
        title: 'Evaluate one 2-opt move',
        text: `Remove the edges (${lab(mv.a)},${lab(mv.b)}) and (${lab(mv.c)},${lab(mv.d)}) and add (${lab(mv.a)},${lab(mv.c)}) and (${lab(mv.b)},${lab(mv.d)}).`,
        fields: [
          { type: 'num', label: 'Change in length $\\Delta$ (negative = improvement)', answer: mv.delta },
          { type: 'choice', label: 'Would a first-improvement local search accept this move?', options: YN, answer: mv.delta < 0 ? 'yes' : 'no' },
        ],
        explain: `$\\Delta=d_{${lab(mv.a)}${lab(mv.c)}}+d_{${lab(mv.b)}${lab(mv.d)}}-d_{${lab(mv.a)}${lab(mv.b)}}-d_{${lab(mv.c)}${lab(mv.d)}}=${D[mv.a][mv.c]}+${D[mv.b][mv.d]}-${D[mv.a][mv.b]}-${D[mv.c][mv.d]}=${mv.delta}$. Only four distances are needed: the move is evaluated in constant time.`,
      },
      {
        title: 'Local optimality',
        text: `The nearest-neighbour tour has ${moves.length} possible 2-opt moves.`,
        fields: [
          { type: 'num', label: 'Best (most negative) $\\Delta$ among all 2-opt moves; write 0 if none improves', answer: Math.min(0, best.delta) },
          { type: 'choice', label: 'Is the nearest-neighbour tour a local optimum for 2-opt?', options: YN, answer: best.delta < 0 ? 'no' : 'yes' },
          { type: 'num', label: 'Length after applying the best move (or the same length if none improves)', answer: len + Math.min(0, best.delta) },
        ],
        explain: `${best.delta < 0 ? `Best move: replace (${lab(best.a)},${lab(best.b)}) and (${lab(best.c)},${lab(best.d)}) by (${lab(best.a)},${lab(best.c)}) and (${lab(best.b)},${lab(best.d)}), $\\Delta=${best.delta}$, new length ${len + best.delta}.` : 'No move has negative Δ: the tour is 2-opt optimal.'} The optimal tour has length ${opt.cost}${len + Math.min(0, best.delta) === opt.cost ? ', which is reached' : `: a local optimum need not be global (gap ${(((len + Math.min(0, best.delta) - opt.cost) / opt.cost) * 100).toFixed(1)}%)`}. A heuristic gives a primal bound only; it says nothing about optimality.`,
      },
    ],
    wrapup: 'Heuristics improve the primal bound; proving quality needs a dual bound from a relaxation. A good incumbent passed to the solver as a MIP start prunes the tree earlier.',
  };
}

function randomTwoOpt(rng, level) {
  const n = level === 1 ? 5 : 6;
  for (let t = 0; t < 300; t++) {
    const pts = Array.from({ length: n }, () => [rng.int(0, 9), rng.int(0, 9)]);
    const D = pts.map((p) => pts.map((q) => Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) * 2) + (p === q ? 0 : level >= 3 ? rng.int(0, 1) : 0)));
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) D[i][j] = D[j][i];
    if (D.some((r, i) => r.some((v, j) => i !== j && v === 0))) continue;
    // nearest neighbour must be free of ties so that the tour is unambiguous
    const nn = nearestNeighbour(D);
    let tie = false;
    const used = new Set();
    nn.forEach((v, k) => { used.add(v); if (k === n - 1) return; const cand = D[v].map((x, j) => (used.has(j) ? Infinity : x)); const mn = Math.min(...cand); if (cand.filter((x) => x === mn).length > 1) tie = true; });
    if (tie) continue;
    const moves = twoOptMoves(D, nn);
    const best = moves.reduce((p, q) => (q.delta < p.delta ? q : p));
    if (level <= 2 && best.delta >= 0) continue;
    return { D, move: rng.int(0, moves.length - 1) };
  }
  return { D: [[0, 3, 8, 9, 4], [3, 0, 5, 9, 7], [8, 5, 0, 4, 9], [9, 9, 4, 0, 6], [4, 7, 9, 6, 0]], move: 1 };
}

export const twoOptDrill = {
  id: 'twoopt', title: 'TSP heuristics: nearest neighbour and 2-opt', topic: 't301', minutes: 7,
  blurb: 'Build a greedy tour, evaluate 2-opt moves by their four-distance formula, and test local optimality.',
  presets: [{ id: 'five', label: 'Five cities', make: () => ({ D: [[0, 8, 3, 4, 6], [8, 0, 6, 8, 2], [3, 6, 0, 3, 4], [4, 8, 3, 0, 6], [6, 2, 4, 6, 0]], move: 1, title: 'TSP heuristics — five cities' }) }],
  random: (rng, level) => ({ ...randomTwoOpt(rng, level), title: 'TSP heuristics — practice' }),
  build: buildTwoOpt,
};
