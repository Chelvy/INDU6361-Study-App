// Cutting planes for convex functions (slides E201): tangent cuts with the Kelley loop, and perspective cuts.
import { Frac } from '../math/frac.js';
import { kelley, perspectiveCut } from '../math/convex.js';
import { ineqText } from '../util.js';
import { dataTable, frag } from './common.js';

const fr = (v) => Frac.of(v);
const P = (v) => fr(v).pretty(8);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const lineTex = (cut) => `${cut.slope.isZero() ? '' : `${P(cut.slope)}x`}${cut.intercept.sign() >= 0 ? (cut.slope.isZero() ? '' : '+') : ''}${cut.intercept.isZero() && !cut.slope.isZero() ? '' : P(cut.intercept)}`.replace('+-', '-');
const fTex = (f) => `${fr(f.q).eq(1) ? '' : P(f.q)}(x-${P(f.c)})^2${fr(f.d || 0).isZero() ? '' : `+${P(f.d)}`}`;

function buildKelley(inst) {
  const f = { q: Frac.parse(String(inst.q)), c: Frac.parse(String(inst.c)), d: Frac.parse(String(inst.d || 0)) };
  const { lo, hi, start } = inst;
  const iters = inst.iterations || 2;
  const K = kelley(f, lo, hi, start, iters);
  const recs = K.records;
  const cutIneq = (cut) => ineqText([1, cut.slope.neg()], ['t', 'x'], '>=', cut.intercept);
  const steps = [
    {
      title: 'Initial tangent cuts',
      text: `The tangent to $f$ at $a$ is $t\\ge f(a)+f'(a)(x-a)$. Give each tangent as $t\\ge \\text{slope}\\cdot x+\\text{intercept}$.`,
      fields: [{
        type: 'table', label: 'Tangents at the starting points', corner: '$a$',
        columns: [{ key: 's', head: 'slope $f\'(a)$', kind: 'num', plain: 'slope' }, { key: 'i', head: 'intercept $f(a)-f\'(a)\\,a$', kind: 'num', plain: 'intercept' }],
        rows: K.initialCuts.map((cut) => ({ head: `$${P(cut.a)}$`, cells: { s: cut.slope, i: cut.intercept } })),
      }],
      explain: `$f'(x)=${P(fr(2).mul(f.q))}(x-${P(f.c)})$. ${K.initialCuts.map((cut) => `At $a=${P(cut.a)}$: $t\\ge ${lineTex(cut)}$`).join('; ')}.`,
    },
  ];
  recs.forEach((r, k) => {
    const cutsSoFar = K.initialCuts.concat(recs.slice(0, k).map((x) => x.newCut));
    const fields = [
      { type: 'num', label: 'Master optimum $\\bar x$', answer: r.x },
      { type: 'num', label: 'Lower bound $L=\\bar t$', answer: r.L },
      { type: 'num', label: '$f(\\bar x)$', answer: r.fx },
      { type: 'num', label: 'Upper bound $U$ (best $f$ value found so far)', answer: r.U },
      { type: 'num', label: 'Gap $U-L$', answer: r.gap },
    ];
    if (r.newCut) fields.push({ type: 'ineq', label: 'New tangent cut at $\\bar x$', answer: cutIneq(r.newCut), answerText: cutIneq(r.newCut), order: ['t', 'x'], placeholder: 'e.g. t >= 0.4x - 0.56' });
    steps.push({
      title: `Master solve ${k + 1}`,
      text: () => frag(
        `Master problem: $\\min t$ subject to the ${cutsSoFar.length} cuts below and $${lo}\\le x\\le ${hi}$. Its optimum is the lowest point of the upper envelope of the lines.`,
        dataTable(['Cut from $a$'].concat(cutsSoFar.map((cut) => P(cut.a))), [['$t\\ge$'].concat(cutsSoFar.map((cut) => `$${lineTex(cut)}$`))], 'compact'),
      ),
      fields,
      explain: `The envelope is lowest at $\\bar x=${P(r.x)}$ with $\\bar t=${P(r.L)}$: a lower bound, since the master is a relaxation. $f(\\bar x)=${P(r.fx)}$ is the cost of a feasible point, so $U=${P(r.U)}$ and $U-L=${P(r.gap)}$. The violation is $\\delta=f(\\bar x)-\\bar t=${P(r.violation)}${r.violation.sign() > 0 ? '\\gt 0' : ''}$${r.newCut ? `, so add the tangent at $\\bar x$: $t\\ge ${lineTex(r.newCut)}$.` : '.'}`,
    });
  });
  return {
    id: 'kelley', topic: 'tE201', title: inst.title || 'Tangent cuts and the Kelley loop',
    statement: () => frag(`Minimise the convex function $f(x)=${fTex(f)}$ on $[${lo},${hi}]$ using the epigraph form $\\min t$ s.t. $t\\ge f(x)$, replaced by tangent cuts. Start with tangents at $a\\in\\{${start.join(', ')}\\}$.`),
    rules: 'Each master is a linear program in $(x,t)$. $L$ is the master value, $U$ the smallest $f(\\bar x)$ seen so far. Stop when $U-L$ is below the tolerance.',
    steps,
    wrapup: 'Tangents of a convex function never cut into its epigraph, so every master is a relaxation and L only goes up. For a nonconvex function a tangent can cut off feasible points and the method is not valid.',
  };
}

export const kelleyDrill = {
  id: 'kelley', title: 'Tangent cuts and the Kelley loop', topic: 'tE201', minutes: 9,
  blurb: 'Build tangents, solve the master on the envelope, track L, U and the gap, and add the next cut.',
  presets: [{ id: 'slides', label: '(x − 1.3)² on [0, 2] (slides E201)', make: () => ({ q: '1', c: '1.3', d: '0', lo: 0, hi: 2, start: [0, 1, 2], iterations: 1, title: 'Tangent cuts — (x − 1.3)² on [0, 2] (slides E201)' }) }],
  random: (rng, level) => {
    const hi = rng.pick([2, 3, 4]);
    const start = level === 1 ? [0, hi] : Array.from({ length: hi + 1 }, (_, i) => i).filter((i) => level === 3 || i === 0 || i === hi || i === Math.floor(hi / 2));
    const c = `${rng.int(0, hi - 1)}.${rng.pick(['2', '3', '4', '6', '7', '8'])}`;
    return { q: level === 3 ? rng.pick(['1', '2', '0.5']) : '1', c, d: '0', lo: 0, hi, start: [...new Set(start)], iterations: 1, title: 'Tangent cuts — practice' };
  },
  build: buildKelley,
};

function buildPerspective(inst) {
  const q = Frac.parse(String(inst.q)), U = inst.U;
  const x = Frac.parse(String(inst.x)), z = Frac.parse(String(inst.z)), t = Frac.parse(String(inst.t));
  const pc = perspectiveCut(q, x, z);
  const naiveOk = t.ge(pc.original) && x.le(fr(U).mul(z));
  const cutText = ineqText([1, pc.cx.neg(), pc.cz.neg()], ['t', 'x', 'z'], '>=', 0);
  const fx = `${q.eq(1) ? '' : P(q)}x^2`;
  const violated = t.lt(pc.required);
  return {
    id: 'perspective', topic: 'tE201', title: inst.title || 'Perspective cut',
    statement: () => frag(`An on/off variable $z\\in\\{0,1\\}$ switches a quantity $x$ with a convex cost: $$0\\le x\\le ${U}z,\\qquad t\\ge ${fx}.$$ The continuous relaxation ($0\\le z\\le 1$) returns the point $(\\bar x,\\bar z,\\bar t)=(${P(x)},\\ ${P(z)},\\ ${P(t)})$.`),
    rules: 'Perspective of $f$: $t\\ge z\\,f(x/z)$ for $z\\gt 0$. Perspective cut at $a=\\bar x/\\bar z$: $\\ t\\ge f\'(a)\\,x+\\big(f(a)-f\'(a)\\,a\\big)z$.',
    steps: [
      {
        title: 'The weak relaxation accepts the point',
        fields: [
          { type: 'num', label: `$${fx}$ at $\\bar x$`, answer: pc.original },
          { type: 'choice', label: 'Does the point satisfy $t\\ge f(x)$ and $x\\le Uz$?', options: YN, answer: naiveOk ? 'yes' : 'no' },
        ],
        explain: `$f(\\bar x)=${P(pc.original)}\\le\\bar t=${P(t)}$ and $\\bar x=${P(x)}\\le ${U}\\cdot ${P(z)}=${P(fr(U).mul(z))}$: the relaxation accepts it.`,
      },
      {
        title: 'What the perspective demands',
        fields: [
          { type: 'num', label: `$\\bar z\\,f(\\bar x/\\bar z)$`, answer: pc.required, mis: [{ value: pc.original, msg: 'That is $f(\\bar x)$. The perspective evaluates $f$ at $\\bar x/\\bar z$ and multiplies by $\\bar z$.' }] },
          { type: 'choice', label: 'Is the point cut off by the perspective constraint?', options: YN, answer: violated ? 'yes' : 'no' },
        ],
        explain: `$\\bar z f(\\bar x/\\bar z)=${P(z)}\\cdot ${q.eq(1) ? '' : `${P(q)}\\cdot`}(${P(x)}/${P(z)})^2=${P(pc.required)}$${violated ? `, which exceeds $\\bar t=${P(t)}$: the point is infeasible for the stronger relaxation.` : `, which is at most $\\bar t$.`} Intuition: with $z=${P(z)}$ the unit is "on" only that fraction of the time, so it must run at rate $\\bar x/\\bar z=${P(pc.a)}$ while on.`,
      },
      {
        title: 'The perspective cut',
        fields: [
          { type: 'num', label: '$a=\\bar x/\\bar z$', answer: pc.a },
          { type: 'ineq', label: 'Linear cut in $t$, $x$, $z$', answer: cutText, answerText: cutText, order: ['t', 'x', 'z'], placeholder: 'e.g. t >= 8x - 16z' },
          { type: 'num', label: 'Right-hand side of the cut at $(\\bar x,\\bar z)$', answer: pc.rhsAtPoint },
        ],
        explain: `$f'(a)=${P(pc.cx)}$ and $f(a)-f'(a)a=${P(pc.cz)}$, so the cut is $t\\ge ${P(pc.cx)}x${pc.cz.sign() < 0 ? '-' : '+'}${P(pc.cz.abs())}z$. At the point its right-hand side is $${P(pc.rhsAtPoint)}$, exactly the perspective value. With $z=1$ it is the ordinary tangent of $f$ at $a$; with $x=z=0$ it reads $t\\ge 0$, so both integer states stay feasible.`,
      },
    ],
    wrapup: 'The perspective formulation is the convex hull of the two states "off" (x = 0, t = 0) and "on" (t ≥ f(x)). It can be written as a rotated second-order cone, x² ≤ t z, or approximated by perspective cuts.',
  };
}

export const perspectiveDrill = {
  id: 'perspective', title: 'Perspective cut', topic: 'tE201', minutes: 5,
  blurb: 'Show that a fractional on/off point survives the weak relaxation, compute what the perspective requires, and write the linear cut.',
  presets: [
    { id: 'slides', label: 't ≥ x², x ≤ 10z at (2, 0.5, 4) (slides E201)', make: () => ({ q: '1', U: 10, x: '2', z: '0.5', t: '4', title: 'Perspective cut — example of slides E201' }) },
    { id: 'exercise', label: 't ≥ 3x², x ≤ 8z at (1, 0.25, 3) (slides E201)', make: () => ({ q: '3', U: 8, x: '1', z: '0.25', t: '3', title: 'Perspective cut — exercise of slides E201' }) },
  ],
  random: (rng, level) => {
    const q = level === 1 ? 1 : rng.pick([1, 2, 3]);
    const z = rng.pick(level === 1 ? ['0.5'] : ['0.5', '0.25', '0.2', '0.4']);
    const a = rng.int(2, 6);
    const x = fr(a).mul(Frac.parse(z));
    const U = rng.int(a + 1, a + 6);
    const t = fr(q).mul(x).mul(x);
    return { q: String(q), U, x: x.toString(), z, t: t.toString(), title: 'Perspective cut — practice' };
  },
  build: buildPerspective,
};
