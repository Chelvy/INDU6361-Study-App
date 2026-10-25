// Problem-specific valid inequalities (slides 206; exercises 9-14 of sheet 20E): covers, lifting and facets, cliques, flow covers, lot sizing.
import { Frac, ZERO, ONE } from '../math/frac.js';
import { knapsackLP, isCover, isMinimalCover, minimalCovers, allCovers, extendedCover, coverSeparation, sequentialLifting, knapsackFace, knapsackAllOptima } from '../math/knapsack.js';
import { flowCover, flowCoverLhs, lotSizingCumulative, maxWeightClique, maximalCliques } from '../math/cuts.js';
import { solveLP } from '../math/lp.js';
import { graphFigure, circleLayout } from '../viz.js';
import { linTex, ineqTex, ineqText } from '../util.js';
import { dataTable, frag, ul } from './common.js';

const fr = (v) => Frac.of(v);
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const xn = (n) => Array.from({ length: n }, (_, j) => `x${j + 1}`);
const one = (set) => set.map((j) => j + 1);          // 0-based -> 1-based
const zero = (set) => set.map((j) => j - 1);         // 1-based -> 0-based
const braces = (set) => `\\{${set.join(',')}\\}`;
const indicator = (n, set) => Array.from({ length: n }, (_, j) => (set.includes(j) ? 1 : 0));
const knapTex = (a, b) => `${linTex(a, xn(a.length))}\\le ${b}`;
const orList = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);
const andList = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
// Lexicographic order on sorted index sets ({1,2} < {1,2,3} < {1,3} < {2,3}).
const cmpSets = (p, q) => { for (let i = 0; i < Math.min(p.length, q.length); i++) if (p[i] !== q[i]) return p[i] - q[i]; return p.length - q.length; };
const sameSet = (p, q) => p.length === q.length && p.every((v, i) => v === q[i]);

// ---------------------------------------------------------------- covers
function buildCovers(inst) {
  const { a, b } = inst;
  const c = Array.isArray(inst.c) ? inst.c : null; // 20E, Exercise 10 gives no objective
  const n = a.length;
  const names = xn(n);
  const cands = inst.cand.map(zero);
  const C = zero(inst.C);
  const mins = minimalCovers(a, b);
  const covers = allCovers(a, b);
  const askAll = inst.allCovers !== undefined ? !!inst.allCovers : n <= 4;
  const ext = extendedCover(a, C);
  const coverText = ineqText(indicator(n, C), names, '<=', C.length - 1);
  const extText = ineqText(indicator(n, ext), names, '<=', C.length - 1);
  const setTex = (S) => `$${braces(one(S))}$`;
  const steps = [
    {
      title: 'Which sets are covers?',
      fields: [{
        type: 'table', label: 'For each set: its total weight, whether it is a cover, and whether it is a minimal cover', corner: 'Set',
        columns: [{ key: 'w', head: 'Weight', kind: 'num', plain: 'weight' }, { key: 'cov', head: 'Cover?', kind: 'choice', options: YN, plain: 'cover' }, { key: 'min', head: 'Minimal cover?', kind: 'choice', options: YN, plain: 'minimal' }],
        rows: cands.map((S) => ({ head: setTex(S), cells: { w: S.reduce((s, j) => s + a[j], 0), cov: isCover(a, b, S) ? 'yes' : 'no', min: isMinimalCover(a, b, S) ? 'yes' : 'no' } })),
      }],
      explain: ul(cands.map((S) => {
        const w = S.reduce((s, j) => s + a[j], 0);
        if (!isCover(a, b, S)) return `${setTex(S)}: weight ${w} ≤ ${b}, the items fit together: not a cover.`;
        if (isMinimalCover(a, b, S)) return `${setTex(S)}: weight ${w} &gt; ${b}, a cover. Removing item ${orList(one(S))} leaves ${orList(S.map((j) => w - a[j]))}, ${S.length === 2 ? 'both' : 'all'} ≤ ${b}: a minimal cover.`;
        const drop = S.find((j) => w - a[j] > b);
        return `${setTex(S)}: weight ${w} &gt; ${b}, a cover, but without item ${drop + 1} the weight is still ${w - a[drop]} &gt; ${b}: not minimal.`;
      })),
    },
    {
      title: 'Cover inequalities',
      fields: [
        ...(askAll ? [{ type: 'int', label: 'Number of covers of this knapsack, minimal or not (count every subset, not only the sets above)', answer: covers.length }] : []),
        { type: 'int', label: 'Number of minimal covers of this knapsack', answer: mins.length },
        { type: 'ineq', label: `Cover inequality of $C=${braces(one(C))}$`, answer: coverText, answerText: coverText, order: names, placeholder: 'e.g. x1 + x4 <= 1' },
      ],
      explain: [
        a.every((v) => v <= b) ? `No single item weighs more than ${b}, so there is no one-item cover.` : '',
        `Minimal covers (${mins.length}): ${mins.map(setTex).join(', ')}.`,
        askAll ? (covers.length > mins.length ? `The other ${covers.length - mins.length} covers are not minimal: ${covers.filter((S) => !isMinimalCover(a, b, S)).map(setTex).join(', ')}. That makes ${covers.length} covers in all.` : `Every cover is minimal: ${covers.length} in all.`) : '',
        `Every cover gives a valid inequality, because choosing all its items would exceed the capacity. For $C=${braces(one(C))}$: not all $|C|=${C.length}$ items can be chosen, so $${ineqTex(indicator(n, C), names, '<=', C.length - 1)}$.`,
      ].filter(Boolean).join(' '),
    },
    {
      title: 'Extended cover',
      text: `$E(C)=C\\cup\\{j:\\ a_j\\ge\\max_{i\\in C}a_i\\}$ for $C=${braces(one(C))}$. The right-hand side stays $|C|-1$.`,
      fields: [
        { type: 'set', label: '$E(C)$', answer: one(ext).map(String), placeholder: 'e.g. 1, 2, 3, 4' },
        { type: 'ineq', label: 'Extended cover inequality', answer: extText, answerText: extText, order: names },
      ],
      explain: ext.length > C.length
        ? `The heaviest item of $C$ weighs ${Math.max(...C.map((j) => a[j]))}; item${ext.length - C.length > 1 ? 's' : ''} ${one(ext.filter((j) => !C.includes(j))).join(', ')} weigh${ext.length - C.length > 1 ? '' : 's'} at least as much and can be added: $${ineqTex(indicator(n, ext), names, '<=', C.length - 1)}$. It is valid: any ${C.length} items of $E(C)$ weigh at least as much as the ${C.length} items of $C$, that is at least $${C.map((j) => a[j]).join('+')}=${C.reduce((s, j) => s + a[j], 0)}\\gt ${b}$. It dominates the cover inequality (same right-hand side, more terms).`
        : `No item outside $C$ is at least as heavy as the heaviest item of $C$ (${Math.max(...C.map((j) => a[j]))}), so $E(C)=C$ and nothing is gained.`,
    },
  ];
  // Separation needs a fractional point: the LP optimum (when an objective is given) or a point given by the instance.
  if (c || inst.xbar) {
    const xbar = inst.xbar ? inst.xbar.map((v) => Frac.parse(String(v))) : knapsackLP(a, c, b).x;
    const lpVal = c ? xbar.reduce((s, v, j) => s.add(v.mul(c[j])), ZERO) : null;
    const sep = coverSeparation(a, b, xbar);
    const sepLhs = sep.cover.reduce((s, j) => s.add(xbar[j]), ZERO);
    steps.push({
      title: c ? 'Separation at the LP optimum' : 'Separation at a fractional point',
      text: `${c ? `The LP relaxation has an optimal solution $\\bar x=(${xbar.map((v) => v.toLatex()).join(',\\ ')})$ with value $${lpVal.toLatex()}$.` : `Take the fractional point $\\bar x=(${xbar.map((v) => v.toLatex()).join(',\\ ')})$.`} Consider the cover $C^*=${braces(one(sep.cover))}$.`,
      fields: [
        { type: 'num', label: '$\\sum_{j\\in C^*}(1-\\bar x_j)$', answer: sep.value },
        { type: 'num', label: 'Left-hand side $\\sum_{j\\in C^*}\\bar x_j$', answer: sepLhs },
        { type: 'choice', label: 'Is the cover inequality of $C^*$ violated by $\\bar x$?', options: YN, answer: sep.violated ? 'yes' : 'no' },
      ],
      explain: `$\\sum_{C^*}(1-\\bar x_j)=${sep.value.toLatex()}$, which is ${sep.violated ? 'below 1: violated' : 'at least 1: not violated'}. Equivalently $\\sum_{C^*}\\bar x_j=${sepLhs.toLatex()}$ against $|C^*|-1=${sep.cover.length - 1}$. The separation problem $\\min\\sum_j(1-\\bar x_j)z_j$ s.t. $\\sum_ja_jz_j\\ge b+1$, $z$ binary, finds the most violated cover; here its optimal value is $${sep.value.toLatex()}$.${c ? ` For reference the integer optimum is ${knapsackAllOptima(a, c, b).value} and the LP bound is $${lpVal.toLatex()}$.` : ''}`,
    });
  }
  return {
    id: 'covers', topic: 't206a', title: inst.title || 'Cover inequalities',
    statement: () => frag(c
      ? `Binary knapsack: $$\\max\\ ${linTex(c, names)}\\qquad\\text{s.t.}\\qquad ${knapTex(a, b)},\\qquad x\\in\\{0,1\\}^{${n}}.$$`
      : `Binary knapsack constraint: $$${knapTex(a, b)},\\qquad x\\in\\{0,1\\}^{${n}}.$$`),
    rules: 'A set $C$ is a <b>cover</b> if $\\sum_{j\\in C}a_j\\gt b$; it is <b>minimal</b> if removing any one item leaves a set that fits. Cover inequality: $\\sum_{j\\in C}x_j\\le|C|-1$.',
    steps,
    wrapup: 'Every cover gives a valid inequality, and an exercise may ask you to list them all (20E, Exercise 10). For cutting, minimal covers are enough (beyond the slides, but easy to check): a non-minimal cover contains a minimal one, and its inequality follows from that one plus the bounds $x_j\\le 1$. The number of covers can grow exponentially with $n$ (slides 206), so large models search for violated ones (separation) instead of listing them.',
  };
}

function randomCovers(rng, level) {
  const n = level === 1 ? 4 : 5;
  for (let t = 0; t < 800; t++) {
    const a = Array.from({ length: n }, () => rng.int(2, 9)).sort((p, q) => p - q);
    const total = a.reduce((s, v) => s + v, 0);
    const b = rng.int(Math.floor(total * 0.4), Math.floor(total * 0.65));
    if (a[n - 1] > b) continue;
    const c = a.map((v) => v + rng.int(0, 4));
    const mins = minimalCovers(a, b);
    if (mins.length < 2 || mins.length > 7) continue;
    const xbar = knapsackLP(a, c, b).x;
    if (xbar.every((v) => v.isInt())) continue;
    const sep = coverSeparation(a, b, xbar);
    if (!sep || (!sep.violated && rng.bool(0.8))) continue;
    const C = rng.pick(mins.filter((S) => extendedCover(a, S).length > S.length).concat(level === 1 ? [] : mins.slice(0, 1))) || mins[0];
    // candidates: a minimal cover, a non-minimal cover, a non-cover
    const all = [];
    for (let mask = 1; mask < 1 << n; mask++) { const S = []; for (let j = 0; j < n; j++) if (mask & (1 << j)) S.push(j); if (S.length >= 2) all.push(S); }
    const nonMin = rng.shuffle(all.filter((S) => isCover(a, b, S) && !isMinimalCover(a, b, S)))[0];
    const non = rng.shuffle(all.filter((S) => !isCover(a, b, S)))[0];
    if (!nonMin || !non) continue;
    const cand = rng.shuffle([rng.pick(mins), nonMin, non, rng.pick(all)]).filter((S, i, arr) => arr.findIndex((T) => T.join() === S.join()) === i);
    if (cand.length < 3) continue;
    return { a, b, c, C: one(C), cand: cand.map(one) };
  }
  return { a: [4, 4, 4, 7], b: 10, c: [6, 6, 6, 10], C: [1, 2, 3], cand: [[1, 4], [1, 2], [1, 2, 3, 4], [1, 2, 3]], xbar: ['1/2', '1', '1', '0'] };
}

// All subsets with at least two of the items 1..n (1-based), smallest first.
const subsetsFrom2 = (n) => {
  const out = [];
  for (let mask = 1; mask < 1 << n; mask++) { const S = []; for (let j = 0; j < n; j++) if (mask & (1 << j)) S.push(j + 1); if (S.length >= 2) out.push(S); }
  return out.sort((p, q) => p.length - q.length || cmpSets(p, q));
};

export const coversDrill = {
  id: 'covers', title: 'Cover inequalities', topic: 't206a', minutes: 8,
  blurb: 'Covers (all of them, and the minimal ones), extended covers and the separation test at an LP point.',
  presets: [
    { id: 'slides', label: 'Knapsack 4, 4, 4, 7 ≤ 10 (slides 206)', make: () => ({ a: [4, 4, 4, 7], b: 10, c: [6, 6, 6, 10], C: [1, 2, 3], cand: [[1, 4], [1, 2], [1, 2, 3, 4], [1, 2, 3]], xbar: ['1/2', '1', '1', '0'], title: 'Cover inequalities — knapsack of slides 206' }) },
    { id: '20e10', label: 'Every cover of 5, 6, 7, 13 ≤ 17 (20E, exercises 10–11)', make: () => ({ a: [5, 6, 7, 13], b: 17, C: [1, 2, 3], cand: subsetsFrom2(4), allCovers: true, title: 'Cover inequalities — 20E, exercises 10 and 11' }) },
  ],
  random: (rng, level) => ({ ...randomCovers(rng, level), title: 'Cover inequalities — practice' }),
  build: buildCovers,
};

// ---------------------------------------------------------------- lifting and facets
function buildLifting(inst) {
  const { a, b } = inst;
  const n = a.length;
  const names = xn(n);
  const C = zero(inst.cover);
  const order = zero(inst.order);
  const lift = sequentialLifting(a, b, C, order);
  const beta = C.length - 1;
  const baseCoef = indicator(n, C);
  const steps = [];
  let coefSoFar = baseCoef.map(fr);
  lift.steps.forEach((st) => {
    const before = coefSoFar.slice();
    const k = st.k;
    const maxVal = st.max === null ? ZERO : st.max;
    const left = b - a[k];
    const others = a.map((_, j) => j).filter((j) => j !== k);
    const fitting = others.filter((j) => a[j] <= left);
    const used = st.argmax ? others.filter((j) => st.argmax[j]) : [];
    let how;
    if (!st.argmax) how = ` No feasible point has $x_{${k + 1}}=1$, so the variable can never be 1.`;
    else if (!fitting.length) how = ` No other item fits in the remaining capacity ${left} (the lightest other item weighs ${Math.min(...others.map((j) => a[j]))}), so the other terms must all be 0 and the maximum is $0$.`;
    else if (!used.length || maxVal.isZero()) how = ` The best the other terms can do is $${maxVal.toLatex()}$.`;
    else how = ` The best the other terms can do is $${maxVal.toLatex()}$, for example with item${used.length > 1 ? 's' : ''} ${one(used).join(', ')}.`;
    const cert = st.argmax ? ` The coefficient cannot be larger: the feasible point $(${st.argmax.join(',')})$ has $x_{${k + 1}}=1$ and left-hand side $${maxVal.toLatex()}+${st.alpha.toLatex()}=${beta}$, so a bigger $\\alpha_{${k + 1}}$ would cut it off.` : '';
    steps.push({
      title: `Lift $x_{${k + 1}}$`,
      text: `Current inequality: $${ineqTex(before, names, '<=', beta)}$. Fix $x_{${k + 1}}=1$ and find how much of the left-hand side can still be collected.`,
      fields: [
        { type: 'num', label: `Capacity left when $x_{${k + 1}}=1$`, answer: left },
        { type: 'num', label: `$\\max$ of the current left-hand side over feasible points with $x_{${k + 1}}=1$`, answer: maxVal },
        { type: 'num', label: `Lifting coefficient $\\alpha_{${k + 1}}$`, answer: st.alpha, mis: [{ value: maxVal, msg: 'That is the maximum; the coefficient is $\\beta$ minus this maximum.' }].filter((m) => !fr(m.value).eq(st.alpha)) },
      ],
      explain: `With $x_{${k + 1}}=1$ the remaining capacity is $${b}-${a[k]}=${left}$.${how} So $\\alpha_{${k + 1}}=\\beta-\\max=${beta}-${maxVal.toLatex()}=${st.alpha.toLatex()}$. Validity: when $x_{${k + 1}}=0$ the previous inequality applies; when $x_{${k + 1}}=1$ the maximisation proves it.${cert}`,
    });
    coefSoFar = coefSoFar.slice();
    coefSoFar[k] = st.alpha;
  });
  const liftedText = ineqText(lift.coef, names, '<=', beta);
  const baseFace = knapsackFace(baseCoef, beta, a, b);
  const liftFace = knapsackFace(lift.coef, beta, a, b);
  const pointText = (p) => `(${p.join(',')})`;
  const last = {
    title: 'The lifted inequality and its face',
    text: `A valid inequality defines a <b>facet</b> of $\\operatorname{conv}(X)$ when $\\dim\\operatorname{conv}(X)=n=${n}$ and ${n} affinely independent feasible points satisfy it with equality.`,
    fields: [{ type: 'ineq', label: 'Lifted inequality', answer: liftedText, answerText: liftedText, order: names }],
    explain: () => frag(
      `$${ineqTex(lift.coef, names, '<=', beta)}$.`,
      n <= 4 ? ` Feasible points tight for the base cover inequality: ${baseFace.tight.map(pointText).join(', ')} — ${baseFace.tight.length} points spanning a face of dimension ${baseFace.faceDim}, ${baseFace.isFacet ? 'a facet' : 'not a facet'}. Tight for the lifted inequality: ${liftFace.tight.map(pointText).join(', ')} — dimension ${liftFace.faceDim}, ${liftFace.isFacet ? `a facet (dimension $n-1=${n - 1}$)` : 'still not a facet'}.` : ` Its face has dimension ${liftFace.faceDim}; a facet needs dimension ${n - 1}.`,
    ),
  };
  if (n <= 4) {
    last.fields.push({ type: 'int', label: 'Feasible 0–1 points tight for the <b>base</b> cover inequality', answer: baseFace.tight.length });
    last.fields.push({ type: 'int', label: 'Feasible 0–1 points tight for the <b>lifted</b> inequality', answer: liftFace.tight.length });
  }
  last.fields.push({ type: 'choice', label: 'Does the lifted inequality define a facet?', options: YN, answer: liftFace.isFacet ? 'yes' : 'no' });
  steps.push(last);
  return {
    id: 'lifting', topic: 't206b', title: inst.title || 'Lifting a cover inequality',
    statement: () => frag(`Knapsack set $X=\\{x\\in\\{0,1\\}^{${n}}:\\ ${knapTex(a, b)}\\}$ and the minimal cover $C=${braces(inst.cover)}$ with cover inequality $$${ineqTex(baseCoef, names, '<=', beta)}.$$ Lift the variable${order.length > 1 ? 's' : ''} ${order.map((k) => `$x_{${k + 1}}$`).join(', then ')}.${inst.note ? ` ${inst.note}` : ''}`),
    rules: 'Sequential lifting: $\\alpha_k=\\beta-\\max\\{\\text{current left-hand side}:\\ x\\in X,\\ x_k=1\\}$. Variables already lifted keep their coefficients in the next maximisation.',
    steps,
    wrapup: 'Lifting keeps the inequality valid and gives the lifted variable the largest coefficient that stays valid. With several variables the result can depend on the lifting order.',
  };
}

function randomLifting(rng, level) {
  const n = level === 3 ? 5 : 4;
  for (let t = 0; t < 1500; t++) {
    const a = Array.from({ length: n }, () => rng.int(2, 9)).sort((p, q) => p - q);
    const total = a.reduce((s, v) => s + v, 0);
    const b = rng.int(Math.floor(total * 0.4), Math.floor(total * 0.7));
    if (a[n - 1] > b) continue;
    const mins = minimalCovers(a, b).filter((S) => S.length >= 2 && S.length < n);
    if (!mins.length) continue;
    const C = rng.pick(mins);
    const rest = Array.from({ length: n }, (_, j) => j).filter((j) => !C.includes(j));
    const order = rng.shuffle(rest).slice(0, level === 1 ? 1 : Math.min(2, rest.length));
    const lift = sequentialLifting(a, b, C, order);
    if (lift.steps.every((s) => s.alpha.isZero())) continue;
    if (level >= 2 && order.length < 2) continue;
    return { a, b, cover: one(C), order: one(order) };
  }
  return { a: [4, 4, 4, 7], b: 10, cover: [1, 2, 3], order: [4] };
}

export const liftingDrill = {
  id: 'lifting', title: 'Lifting and facets', topic: 't206b', minutes: 7,
  blurb: 'Compute lifting coefficients one variable at a time, then count tight points to decide whether the result is a facet.',
  presets: [
    { id: 'slides', label: 'Lift x4 into x1 + x2 + x3 ≤ 2 (slides 206)', make: () => ({ a: [4, 4, 4, 7], b: 10, cover: [1, 2, 3], order: [4], title: 'Lifting — the example of slides 206' }) },
    { id: '20e11', label: 'Lift x4, knapsack 5, 6, 7, 13 ≤ 17 (20E, exercise 11)', make: () => ({ a: [5, 6, 7, 13], b: 17, cover: [1, 2, 3], order: [4], note: 'Exercise 11 starts from the extension $x_1+x_2+x_3+x_4\\le 2$. Lifting replaces the coefficient of $x_4$, so the work is the same: fix $x_4=1$ and maximise $x_1+x_2+x_3$.', title: 'Lifting — 20E, exercise 11' }) },
  ],
  random: (rng, level) => ({ ...randomLifting(rng, level), title: 'Lifting — practice' }),
  build: buildLifting,
};

// ---------------------------------------------------------------- clique inequalities
// Instance: { n, edges (0-based pairs), xbar? (LP values; omit for a graph-only exercise), cand (1-based sets),
//   minSize? (smallest clique size counted as maximal, default 2), noBound? (xbar is not an LP optimum: skip the bound step),
//   pos? (layout { '1': [x, y], ... }) }
function buildClique(inst) {
  const { n, edges } = inst;
  const names = xn(n);
  const hasLP = Array.isArray(inst.xbar);
  const xbar = hasLP ? inst.xbar.map((v) => Frac.parse(String(v))) : null;
  const adj = Array.from({ length: n }, () => new Array(n).fill(false));
  edges.forEach(([i, j]) => { adj[i][j] = true; adj[j][i] = true; });
  const isClique = (S) => S.every((i, p) => S.slice(p + 1).every((j) => adj[i][j]));
  const missingPair = (S) => { for (let p = 0; p < S.length; p++) for (let q = p + 1; q < S.length; q++) if (!adj[S[p]][S[q]]) return `{${S[p] + 1},${S[q] + 1}}`; return null; };
  const weight = (S) => S.reduce((s, j) => s.add(xbar[j]), ZERO);
  const cands = (inst.cand || []).map(zero);
  const minSize = inst.minSize || 2;
  const maxCl = maximalCliques(n, edges).filter((S) => S.length >= minSize).sort(cmpSets);
  const setTex = (S) => `$${braces(one(S))}$`;
  const nodes = Array.from({ length: n }, (_, i) => String(i + 1));
  const best = hasLP ? maxWeightClique(n, edges, xbar) : null;
  const K = best ? best.clique : [];
  const fig = (hl) => graphFigure({
    nodes, pos: inst.pos || circleLayout(nodes), directed: false, height: 280,
    edges: edges.map(([i, j]) => ({ u: String(i + 1), v: String(j + 1), cls: hl && K.includes(i) && K.includes(j) ? 'hl' : '' })),
    badges: hasLP ? Object.fromEntries(nodes.map((v, i) => [v, xbar[i].toString()])) : null,
    nodeCls: hl ? Object.fromEntries(nodes.map((v, i) => [v, K.includes(i) ? 'cur' : ''])) : null,
    caption: `Conflict graph: one vertex per variable, an edge when the two variables cannot both be 1.${hasLP ? ' Numbers: the LP values.' : ''}`,
  });
  const steps = [];
  if (cands.length) {
    steps.push({
      title: hasLP ? 'Cliques and their LP weight' : 'Which sets are cliques?',
      fields: [{
        type: 'table', label: hasLP ? 'For each set: is it a clique, and what is $\\bar x(K)$?' : 'For each set: is it a clique?', corner: 'Set',
        columns: [{ key: 'c', head: 'Clique?', kind: 'choice', options: YN, plain: 'clique' }].concat(hasLP ? [{ key: 'w', head: '$\\bar x(K)$', kind: 'num', plain: 'weight' }] : []),
        rows: cands.map((S) => ({ head: setTex(S), cells: hasLP ? { c: isClique(S) ? 'yes' : 'no', w: weight(S) } : { c: isClique(S) ? 'yes' : 'no' } })),
      }],
      explain: ul(cands.map((S) => {
        if (!isClique(S)) return `${setTex(S)} is not a clique: ${missingPair(S)} is not a conflict, so both can be 1 and the inequality would not be valid.`;
        if (!hasLP) return `${setTex(S)} is a clique: ${S.length === 2 ? 'its two variables conflict' : `each of its ${(S.length * (S.length - 1)) / 2} pairs is a conflict`}.`;
        const w = weight(S);
        return `${setTex(S)} is a clique, $\\bar x(K)=${w.toLatex()}$${w.gt(ONE) ? ' &gt; 1: its inequality is violated' : ' ≤ 1: satisfied'}.`;
      })),
    });
  }
  // Every maximal clique, plus a few sets that are not: cliques inside a larger one, and sets with a missing pair.
  const key = (S) => one(S).join('-');
  let options = inst.options ? inst.options.map(zero) : null;
  if (!options) {
    const extra = [];
    const add = (S) => { if (S.length >= minSize && !maxCl.concat(extra).some((T) => sameSet(T, S))) extra.push(S); };
    maxCl.forEach((S) => { if (S.length > minSize) add(S.slice(0, -1)); });
    const K0 = maxCl[0];
    const v = K0 ? Array.from({ length: n }, (_, i) => i).find((i) => !K0.includes(i) && K0.some((j) => adj[i][j])) : undefined;
    if (v !== undefined) add(K0.concat([v]).sort((p, q) => p - q));
    if (minSize === 2) {
      const pair = []; for (let i = 0; i < n && !pair.length; i++) for (let j = i + 1; j < n; j++) if (!adj[i][j]) { pair.push(i, j); break; }
      if (pair.length && extra.length < 3) add(pair);
    }
    options = maxCl.concat(extra.slice(0, 3)).sort(cmpSets);
  }
  const isolated = minSize === 2 ? nodes.filter((_, i) => !adj[i].some(Boolean)) : [];
  const whyMaximal = (S) => {
    const outside = Array.from({ length: n }, (_, i) => i).filter((i) => !S.includes(i));
    if (!outside.length) return 'it contains every vertex.';
    if (outside.length > 4) return 'no outside vertex is joined to all of its members.';
    return outside.map((i) => `vertex ${i + 1} is not joined to ${S.find((j) => !adj[i][j]) + 1}`).join('; ') + '.';
  };
  steps.push({
    title: 'All maximal cliques',
    text: `A clique is <b>maximal</b> when no other vertex can be added to it: no outside vertex is joined to every one of its members. ${minSize === 2 ? 'Count only cliques with at least two vertices: a single vertex gives just the bound $x_j\\le 1$.' : `Count only cliques with at least ${minSize} vertices.`}`,
    fields: [
      { type: 'int', label: `Number of maximal cliques${minSize > 2 ? ` with at least ${minSize} vertices` : ''}`, answer: maxCl.length },
      { type: 'multi', label: `Tick every maximal clique${minSize > 2 ? ` with at least ${minSize} vertices` : ''} in this list`, options: options.map((S) => ({ value: key(S), label: setTex(S) })), answer: maxCl.filter((S) => options.some((T) => sameSet(S, T))).map(key) },
    ],
    explain: () => frag(
      ul(options.map((S) => {
        if (!isClique(S)) return `${setTex(S)}: not a clique, because ${missingPair(S)} is not a conflict.`;
        const big = maxCl.find((T) => T.length > S.length && S.every((j) => T.includes(j)));
        if (big) return `${setTex(S)}: a clique, but not maximal: it lies inside the larger clique ${setTex(big)}.`;
        return `${setTex(S)}: a maximal clique. It cannot be extended: ${whyMaximal(S)}`;
      })),
      `${maxCl.length === 1 ? 'The only maximal clique' : 'The maximal cliques'}${minSize > 2 ? ` with at least ${minSize} vertices` : ''} ${maxCl.length === 1 ? 'is' : 'are'} ${andList(maxCl.map(setTex))}.${minSize === 2 ? ` Every edge lies inside ${maxCl.length === 1 ? 'it, so its inequality implies' : 'one of them, so their inequalities imply'} all ${edges.length} pair rows.` : ''}${isolated.length ? ` Vertex ${isolated.join(', ')} ${isolated.length > 1 ? 'have' : 'has'} no conflict, so ${isolated.length > 1 ? 'they lie' : 'it lies'} in no clique with two or more vertices.` : ''}`,
      hasLP ? ` LP weights: ${maxCl.map((S) => `${setTex(S)}: $${weight(S).toLatex()}$`).join('; ')}. A clique inside a larger clique never weighs more than it (the LP values are nonnegative), so if any clique is violated, a maximal clique containing it is violated too.` : '',
    ),
  });
  if (!hasLP) {
    const shown = maxCl.slice(0, 6);
    steps.push({
      title: 'Their clique inequalities',
      text: maxCl.length === 1 ? `The only maximal clique is ${setTex(maxCl[0])}. Write its clique inequality.` : `The maximal cliques are ${andList(maxCl.map(setTex))}. Write the clique inequality of each.`,
      fields: shown.map((S) => { const t = ineqText(indicator(n, S), names, '<=', 1); return { type: 'ineq', label: `Clique inequality of ${setTex(S)}`, answer: t, answerText: t, order: names }; }),
      explain: `${shown.map((S) => `$${ineqTex(indicator(n, S), names, '<=', 1)}$`).join(' and ')}. Within a clique every pair conflicts, so at most one of its variables can be 1.${minSize === 2 ? ` These ${maxCl.length} rows imply all ${edges.length} pair rows of the model, so they can replace them.` : ''}`,
    });
  } else {
    const cutText = ineqText(indicator(n, K), names, '<=', 1);
    steps.push({
      title: 'The most violated clique inequality',
      text: `Separation: find a clique of maximum LP weight. Here it is $K^*=${braces(one(K))}$.`,
      fields: [
        { type: 'ineq', label: 'Clique inequality of $K^*$', answer: cutText, answerText: cutText, order: names },
        { type: 'num', label: 'Its violation $\\bar x(K^*)-1$', answer: best.weight.gt(ONE) ? best.weight.sub(ONE) : 0 },
        { type: 'int', label: 'Number of edge constraints it replaces (pairs inside $K^*$)', answer: (K.length * (K.length - 1)) / 2 },
      ],
      explain: () => frag(`$${ineqTex(indicator(n, K), names, '<=', 1)}$; at $\\bar x$ the left-hand side is $${best.weight.toLatex()}$${best.weight.gt(ONE) ? `, violated by $${best.weight.sub(ONE).toLatex()}$` : ', not violated'}. One clique row dominates the ${(K.length * (K.length - 1)) / 2} edge rows inside it: adding the edge rows only gives $\\sum_{K^*}x_j\\le ${fr(K.length).div(2).toLatex()}$.`, fig(true)),
    });
    if (!inst.noBound) {
      const total = xbar.reduce((s, v) => s.add(v), ZERO);
      steps.push({
        title: 'Effect on the bound',
        text: `Suppose the objective is $\\max\\sum_jx_j$ and $\\bar x$ is LP-optimal for the edge formulation.`,
        fields: [
          { type: 'num', label: 'LP value of $\\bar x$', answer: total },
          { type: 'choice', label: 'Does the clique inequality of $K^*$ cut off $\\bar x$?', options: YN, answer: best.weight.gt(ONE) ? 'yes' : 'no' },
        ],
        explain: `$\\sum_j\\bar x_j=${total.toLatex()}$. ${best.weight.gt(ONE) ? 'The point violates the clique inequality, so the bound must drop when the row is added. In the meetings example of slides 206 it goes from 2.5 to 2, which is the integer optimum.' : 'The point satisfies every clique inequality.'}`,
      });
    }
  }
  return {
    id: 'clique', topic: 't206a', title: inst.title || 'Clique inequalities',
    statement: () => frag(
      `Binary variables $x_1,\\dots,x_{${n}}$ with pairwise conflicts $x_i+x_j\\le 1$ for the pairs ${edges.map(([i, j]) => `{${i + 1},${j + 1}}`).join(', ')}.${hasLP ? ` The LP relaxation of the edge formulation gives $\\bar x=(${xbar.map((v) => v.toLatex()).join(',\\ ')})$.` : ' Find the maximal cliques of the conflict graph and write their inequalities.'}`,
      fig(false),
    ),
    rules: 'A clique is a set of variables that are pairwise in conflict. Clique inequality: $\\sum_{j\\in K}x_j\\le 1$. A clique is maximal when no other vertex can be added to it.',
    steps,
    wrapup: 'Maximal cliques give the strongest clique inequalities (beyond the slides, but easy to check): the row of a smaller clique follows from the row of a larger clique that contains it, because the extra variables are nonnegative. To separate at an LP point, look for a clique of weight above 1 (the weighted clique search of slides 206). Also beyond the slides: half-integral LP points like the meetings one are typical of edge formulations, and finding a maximum-weight clique is itself a hard problem, so solvers use heuristics.',
  };
}

function randomClique(rng, level) {
  const n = level === 1 ? 5 : 6;
  for (let t = 0; t < 500; t++) {
    const k = rng.int(3, level === 3 ? 4 : 3);
    const K = rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, k).sort((p, q) => p - q);
    const edges = [];
    for (let p = 0; p < k; p++) for (let q = p + 1; q < k; q++) edges.push([K[p], K[q]]);
    const rest = Array.from({ length: n }, (_, i) => i).filter((i) => !K.includes(i));
    rest.forEach((r) => { rng.shuffle(K).slice(0, rng.int(1, 2)).forEach((v) => edges.push([Math.min(r, v), Math.max(r, v)])); });
    if (rest.length >= 2 && rng.bool(0.5)) edges.push([rest[0], rest[1]]);
    const xbar = Array.from({ length: n }, () => '1/2');
    const best = maxWeightClique(n, edges, xbar.map((v) => Frac.parse(v)));
    if (best.clique.length !== k) continue;
    const adj = (i, j) => edges.some(([p, q]) => (p === i && q === j) || (p === j && q === i));
    const nonClique = rng.shuffle(rest.flatMap((r) => K.filter((v) => !adj(r, v)).map((v) => [Math.min(r, v), Math.max(r, v), K.find((w) => w !== v)].sort((p, q) => p - q))))[0];
    const pair = rng.pick(edges);
    if (!nonClique) continue;
    const cand = [best.clique, nonClique, pair].map(one);
    // The bound step assumes the all-1/2 point is LP-optimal for max sum x_j; when it is not, skip that step.
    const unit = (k) => Array.from({ length: n }, (_, q) => (q === k ? 1 : 0));
    const rows = edges.map(([i, j]) => ({ a: unit(i).map((v, q) => v + (q === j ? 1 : 0)), op: '<=', b: 1 })).concat(Array.from({ length: n }, (_, k) => ({ a: unit(k), op: '<=', b: 1 })));
    const optimal = solveLP({ sense: 'max', c: new Array(n).fill(1), rows }).obj.eq(fr(n).div(2));
    return { n, edges, xbar, cand: rng.shuffle(cand), ...(optimal ? {} : { noBound: true }) };
  }
  return null;
}

const MEETINGS = () => ({ n: 4, edges: [[0, 1], [0, 2], [1, 2]], xbar: ['1/2', '1/2', '1/2', '1'], cand: [[1, 2, 3], [1, 2, 4], [1, 3]], title: 'Clique inequalities — meetings example (slides 206)' });

export const cliqueDrill = {
  id: 'clique', title: 'Clique inequalities', topic: 't206a', minutes: 6,
  blurb: 'Recognise cliques in a conflict graph, list the maximal ones, find the most violated clique inequality and see why it dominates edge constraints.',
  presets: [
    { id: 'meetings', label: 'Meetings example (slides 206)', make: MEETINGS },
    {
      id: 'graph11', label: '11-vertex conflict graph (slides 206)',
      make: () => ({
        n: 11,
        edges: [[0, 1], [0, 3], [0, 7], [1, 4], [1, 6], [1, 8], [2, 4], [2, 5], [2, 9], [3, 6], [3, 7], [3, 10], [4, 6], [4, 8], [5, 6], [5, 9], [6, 8], [7, 8], [7, 10], [8, 9], [9, 10]],
        xbar: ['1/5', '9/20', '3/10', '7/20', '1/2', '1/4', '2/5', '2/5', '1/2', '3/10', '1/5'],
        cand: [[2, 5, 7, 9], [1, 4, 8], [2, 5, 9, 10], [5, 7, 9]],
        minSize: 3, noBound: true, // the slides give no objective, and this point is not an LP optimum
        title: 'Clique inequalities — 11-vertex conflict graph (slides 206)',
      }),
    },
    {
      id: '20e9', label: 'Two triangles sharing job 3 (20E, exercise 9)',
      make: () => ({
        n: 5, edges: [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4]], cand: [[1, 2, 3], [1, 3, 4], [2, 3], [3, 4, 5]],
        pos: { 1: [0, 0], 2: [0, 2], 3: [1.6, 1], 4: [3.2, 0], 5: [3.2, 2] },
        title: 'Maximal cliques — 20E, exercise 9',
      }),
    },
  ],
  random: (rng, level) => ({ ...(randomClique(rng, level) || MEETINGS()), title: 'Clique inequalities — practice' }),
  build: buildClique,
};

// ---------------------------------------------------------------- flow cover
// Instance: { a, b, C (1-based), xbar, ybar, testPoint? (the point is a given test point, not an LP solution) }
function buildFlowCover(inst) {
  const { a, b } = inst;
  const C = zero(inst.C);
  const n = a.length;
  const outside = a.map((_, j) => j).filter((j) => !C.includes(j));
  const fc = flowCover(a, b, C);
  const xbar = inst.xbar.map((v) => Frac.parse(String(v)));
  const ybar = inst.ybar.map((v) => Frac.parse(String(v)));
  const lhs = flowCoverLhs(fc, C, xbar, ybar);
  const B = fr(b);
  const yNames = C.map((j) => `y${j + 1}`), xNames = C.map((j) => `x${j + 1}`);
  const cutCoefs = C.map(() => 1).concat(C.map((j) => fc.coef[j].neg()));
  const cutText = ineqText(cutCoefs, yNames.concat(xNames), '<=', fc.rhsCollected);
  const flow = ybar.reduce((s, v) => s.add(v), ZERO);
  const linksOk = ybar.every((v, j) => v.le(xbar[j].mul(a[j])));
  // Validity check over the open/closed patterns of the channels in C (x of the first channel changes fastest).
  const patterns = Array.from({ length: 1 << C.length }, (_, m) => C.map((_, i) => (m >> i) & 1));
  const patternRow = (p) => {
    const open = C.filter((_, i) => p[i]);
    const cap = open.reduce((s, j) => s + a[j], 0);
    const maxFlow = fr(Math.min(cap, b));
    const closedCoef = C.filter((_, i) => !p[i]).map((j) => fc.coef[j]);
    return { cap, maxFlow, closedCoef, maxLhs: closedCoef.reduce((s, v) => s.add(v), maxFlow) };
  };
  const pointTex = `$\\bar x=(${xbar.map((v) => v.toLatex()).join(', ')})$, $\\bar y=(${ybar.map((v) => v.toLatex()).join(', ')})$`;
  return {
    id: 'flowcover', topic: 't206c', title: inst.title || 'Flow cover inequality',
    statement: () => frag(
      `Single-node fixed-charge flow set: $$\\sum_{j=1}^{${n}}y_j\\le ${b},\\qquad 0\\le y_j\\le a_jx_j,\\qquad x_j\\in\\{0,1\\},$$ with capacities $a=(${a.join(', ')})$. Take $C=${braces(inst.C)}$.${outside.length ? ` Channel${outside.length > 1 ? 's' : ''} ${one(outside).join(', ')} ${outside.length > 1 ? 'stay' : 'stays'} in the model but not in the inequality.` : ''}`,
      inst.testPoint ? `Test the point ${pointTex}.` : `The LP relaxation admits the point ${pointTex}.`,
    ),
    rules: 'For $C$ with $\\lambda=\\sum_{j\\in C}a_j-b\\gt 0$: $\\ \\sum_{j\\in C}y_j+\\sum_{j\\in C}(a_j-\\lambda)^+(1-x_j)\\le b$.',
    steps: [
      {
        title: 'Excess of the cover',
        fields: [{ type: 'num', label: '$\\lambda=\\sum_{j\\in C}a_j-b$', answer: fc.lambda }, { type: 'choice', label: 'Is $C$ a flow cover?', options: YN, answer: 'yes' }],
        explain: `$\\lambda=${C.map((j) => a[j]).join('+')}-${b}=${fc.lambda.toLatex()}\\gt 0$: opening all channels of $C$ gives more capacity than the node can absorb.`,
      },
      {
        title: 'Coefficients',
        fields: [{ type: 'table', label: '$(a_j-\\lambda)^+$ for $j\\in C$', columns: C.map((j) => ({ key: `k${j}`, head: `$j=${j + 1}$`, kind: 'num', plain: `channel ${j + 1}` })), rows: [{ cells: Object.fromEntries(C.map((j) => [`k${j}`, fc.coef[j]])) }] }],
        explain: C.map((j) => `$(${a[j]}-${fc.lambda.toLatex()})^+=${fc.coef[j].toLatex()}$`).join(', ') + '. Closing channel $j$ removes $a_j$ of capacity but only $\\lambda$ of it was excess, so the flow must drop by $a_j-\\lambda$ (if positive).',
      },
      {
        title: 'The inequality',
        text: 'Write it with all variables on the left and a constant on the right.',
        fields: [{ type: 'ineq', label: 'Flow cover inequality', answer: cutText, answerText: cutText, order: yNames.concat(xNames), placeholder: 'e.g. y1 + y2 - 4x1 - 4x2 <= 2' }],
        explain: `$${C.map((j) => `y_{${j + 1}}`).join('+')}+${C.map((j) => `${fc.coef[j].toLatex()}(1-x_{${j + 1}})`).join('+')}\\le ${b}$, i.e. $${ineqTex(cutCoefs, yNames.concat(xNames), '<=', fc.rhsCollected)}$.${outside.length ? ` The flow sum includes only the channels in $C$.` : ''}`,
      },
      {
        title: 'Check validity on every open/closed pattern',
        text: `Prove the inequality valid by checking each pattern of the channels in $C$. For each one, give the largest possible flow through $C$ and the largest possible left-hand side.`,
        fields: [{
          type: 'table', label: 'Largest values for each pattern', corner: `$(${C.map((j) => `x_{${j + 1}}`).join(',')})$`,
          columns: [{ key: 'f', head: `Largest $${C.map((j) => `y_{${j + 1}}`).join('+')}$`, kind: 'num', plain: 'flow' }, { key: 'l', head: 'Largest left-hand side', kind: 'num', plain: 'left-hand side' }],
          rows: patterns.map((p) => { const r = patternRow(p); return { head: `$(${p.join(',')})$`, cells: { f: r.maxFlow, l: r.maxLhs } }; }),
        }],
        explain: ul(patterns.map((p) => {
          const r = patternRow(p);
          const sum = r.closedCoef.length ? `${[r.maxFlow].concat(r.closedCoef).map((v) => v.toLatex()).join('+')}=` : '';
          return `$(${p.join(',')})$: open capacity ${r.cap}, so the flow through $C$ is at most $\\min(${r.cap},${b})=${r.maxFlow.toLatex()}$; the left-hand side is at most $${sum}${r.maxLhs.toLatex()}\\le ${b}$.`;
        })) + `Every pattern stays within ${b}, so the inequality is valid.${outside.length ? ` Flow on channel${outside.length > 1 ? 's' : ''} ${one(outside).join(', ')} can only take room away from the channels in $C$.` : ''}`,
      },
      {
        title: inst.testPoint ? 'Test the point' : 'Test the LP point',
        fields: [
          { type: 'num', label: 'Left-hand side $\\sum_C\\bar y_j+\\sum_C(a_j-\\lambda)^+(1-\\bar x_j)$', answer: lhs },
          { type: 'num', label: `Left-hand side minus ${b} (a positive value is the violation)`, answer: lhs.sub(B) },
          { type: 'choice', label: 'Is the point cut off?', options: YN, answer: lhs.gt(B) ? 'yes' : 'no' },
        ],
        explain: `${linksOk && flow.le(B) ? `The point satisfies every link $\\bar y_j\\le a_j\\bar x_j$ and has total flow $${flow.toLatex()}\\le ${b}$. ` : ''}Its left-hand side is $${C.map((j) => ybar[j].toLatex()).concat(C.map((j) => `${fc.coef[j].toLatex()}(${fr(1).sub(xbar[j]).toLatex()})`)).join('+')}=${lhs.toLatex()}${lhs.gt(B) ? '\\gt' : '\\le'} ${b}$: ${lhs.gt(B) ? `the cut is violated by $${lhs.sub(B).toLatex()}$, so the point is cut off` : 'the point is not cut off'}. In the relaxation an $x_j$ can be as small as $\\bar y_j/a_j$; the inequality charges for that.`,
      },
    ],
    wrapup: 'A flow cover is a set of channels whose capacities exceed the limit by $\\lambda\\gt 0$; if a channel of $C$ closes, the flow through $C$ must drop by $(a_j-\\lambda)^+$. Add the cut only if its left-hand side exceeds $b$ by more than the tolerance. A knapsack-style row such as $x_1+x_2\\le 1$ is not valid here: all channels can be open at once.',
  };
}

function randomFlowCover(rng, level) {
  const n = level === 1 ? 2 : 3;
  for (let t = 0; t < 400; t++) {
    const a = Array.from({ length: n }, () => rng.int(4, 9));
    // Level 3 sometimes leaves one channel out of C (as in 20E, exercise 13).
    const C = level === 3 && rng.bool(0.5) ? rng.shuffle(a.map((_, j) => j)).slice(0, 2).sort((p, q) => p - q) : a.map((_, j) => j);
    const total = C.reduce((s, j) => s + a[j], 0);
    const b = rng.int(Math.max(...C.map((j) => a[j])) + 1, total - 1);
    const lambda = total - b;
    if (!C.some((j) => a[j] > lambda)) continue;
    const frac = fr(b).div(total);
    const xbar = a.map((_, j) => (C.includes(j) ? frac.toString() : '0'));
    const ybar = a.map((v, j) => (C.includes(j) ? fr(v).mul(frac).toString() : '0'));
    if (frac.d > 20n) continue;
    return { a, b, C: one(C), xbar, ybar };
  }
  return { a: [6, 6], b: 10, C: [1, 2], xbar: ['5/6', '5/6'], ybar: ['5', '5'] };
}

export const flowCoverDrill = {
  id: 'flowcover', title: 'Flow cover inequality', topic: 't206c', minutes: 7,
  blurb: 'Compute λ and the coefficients, write the inequality, check it on every open/closed pattern, and test it on a fractional point.',
  presets: [
    { id: 'slides', label: 'a = (6, 6), b = 10 (slides 206)', make: () => ({ a: [6, 6], b: 10, C: [1, 2], xbar: ['5/6', '5/6'], ybar: ['5', '5'], title: 'Flow cover — example of slides 206' }) },
    { id: '20e13', label: 'a = (7, 9, 5), b = 12, C = {1, 2} (20E, exercise 13)', make: () => ({ a: [7, 9, 5], b: 12, C: [1, 2], xbar: ['1', '1/2', '0'], ybar: ['7', '9/2', '0'], testPoint: true, title: 'Flow cover — 20E, exercise 13' }) },
  ],
  random: (rng, level) => ({ ...randomFlowCover(rng, level), title: 'Flow cover — practice' }),
  build: buildFlowCover,
};

// ---------------------------------------------------------------- lot sizing
// Instance: { d, C, testPoint? (wording: a given test point), noSetupLast? (ask whether the last period can skip its set-up) }
function buildLot(inst) {
  const { d, C } = inst;
  const T = d.length;
  const cum = lotSizingCumulative(d, C);
  const xbar = d.map((dt) => fr(dt).div(C));
  let run = ZERO;
  const lhs = xbar.map((v) => { run = run.add(v); return run; });
  const cols = d.map((_, t) => ({ key: `t${t}`, head: `$t=${t + 1}$`, kind: 'num', plain: `period ${t + 1}` }));
  const row = (head, vals) => ({ head, cells: Object.fromEntries(vals.map((v, t) => [`t${t}`, v])) });
  const single = d.map((dt, t) => ({ l: fr(dt), r: fr(dt).mul(xbar[t]) }));
  const xTex = `$\\bar x=(${xbar.map((v) => v.toLatex()).join(', ')})$`;
  const steps = [
    {
      title: 'Cumulative set-up bounds',
      fields: [{ type: 'table', label: 'Cumulative demand and the minimum number of set-ups by period $t$', corner: '', columns: cols, rows: [row('$\\sum_{i\\le t}d_i$', cum.map((x) => x.demand)), row('$\\lceil\\sum_{i\\le t}d_i/C\\rceil$', cum.map((x) => x.rhs))] }],
      explain: `Summing the balances through $t$ with $s_0=0$ gives $${C}\\sum_{i\\le t}x_i\\ge\\sum_{i\\le t}y_i=\\sum_{i\\le t}d_i+s_t\\ge\\sum_{i\\le t}d_i$. The number of set-ups is an integer, so round up: ` + cum.map((x) => `$t=${x.t}$: $\\lceil ${x.demand}/${C}\\rceil=${x.rhs}$`).join('; ') + '.',
    },
    {
      title: inst.testPoint ? 'Test the point: cumulative cuts' : 'The LP point',
      text: inst.testPoint
        ? `Test the point ${xTex}, $\\bar y=(${d.join(', ')})$, $\\bar s=0$. It satisfies the balances and the capacity links $\\bar y_t\\le ${C}\\bar x_t$ at equality.`
        : `The LP relaxation admits the point $\\bar y_t=d_t$, $\\bar s_t=0$, $\\bar x_t=d_t/C$: ${xTex}. It is feasible and pays only a fraction of each set-up.`,
      fields: [{
        type: 'table', label: 'Left-hand side $\\sum_{i\\le t}\\bar x_i$ of each cumulative cut', corner: '',
        columns: cols,
        rows: [row('$\\sum_{i\\le t}\\bar x_i$', lhs)],
      }, { type: 'set', label: 'Periods $t$ whose cumulative cut is violated (or <code>none</code>)', answer: cum.filter((x, t) => lhs[t].lt(x.rhs)).map((x) => String(x.t)), placeholder: 'e.g. 1, 2' }],
      explain: cum.map((x, t) => `$t=${x.t}$: $${lhs[t].toLatex()}${lhs[t].lt(x.rhs) ? '\\lt' : '\\ge'} ${x.rhs}$${lhs[t].lt(x.rhs) ? ' (violated)' : ''}`).join('; ') + '. The point pays only a fraction of each set-up; the cuts force whole set-ups.',
    },
    {
      title: 'Single-period inequalities',
      text: `Slides 206 also give $y_t\\le d_t\\,x_t+s_t$: production in period $t$ beyond its own demand must end up in stock. Test it in every period at the same point ($\\bar y_t=d_t$, $\\bar s_t=0$).`,
      fields: [{
        type: 'table', label: 'Both sides of $y_t\\le d_tx_t+s_t$ at the point, period by period', corner: 'Period',
        columns: [{ key: 'l', head: '$\\bar y_t$', kind: 'num', plain: 'left-hand side' }, { key: 'r', head: '$d_t\\bar x_t+\\bar s_t$', kind: 'num', plain: 'right-hand side' }, { key: 'v', head: 'Violated?', kind: 'choice', options: YN, plain: 'violated' }],
        rows: single.map((s, t) => ({ head: `$t=${t + 1}$`, cells: { l: s.l, r: s.r, v: s.l.gt(s.r) ? 'yes' : 'no' } })),
      }],
      explain: ul(single.map((s, t) => `$t=${t + 1}$: $\\bar y_{${t + 1}}=${d[t]}$ against $${d[t]}\\cdot ${xbar[t].toLatex()}+0=${s.r.toLatex()}$: ${s.l.gt(s.r) ? 'violated' : 'not violated'}.`)) + 'Why the inequality is valid: if $x_t=0$, the capacity link forces $y_t=0$; if $x_t=1$, the balance gives $y_t=d_t+s_t-s_{t-1}\\le d_t+s_t$. A fractional $\\bar x_t$ makes the right-hand side too small.',
    },
  ];
  if (inst.noSetupLast) {
    // Set up in periods 1..T-1 and produce as late as possible (capacity C each).
    const y = new Array(T).fill(0);
    let carry = d[T - 1];
    for (let t = T - 2; t >= 0; t--) { const need = d[t] + carry; y[t] = Math.min(C, need); carry = need - y[t]; }
    const ok = carry === 0;
    const s = []; let stock = 0;
    d.forEach((dt, t) => { stock += y[t] - dt; s.push(stock); });
    const x = y.map((v) => (v > 0 ? 1 : 0));
    const total = d.reduce((p, q) => p + q, 0);
    steps.push({
      title: 'A period without a set-up',
      text: `Period ${T} has positive demand. Does it need a set-up? Demand must be met on time, but stock can be carried forward.`,
      fields: [{ type: 'choice', label: `Is there a feasible integer plan with $x_{${T}}=0$?`, options: YN, answer: ok ? 'yes' : 'no' }],
      explain: ok
        ? `Yes. For example $x=(${x.join(',')})$, $y=(${y.join(',')})$, $s=(${s.join(',')})$: the first ${T - 1} periods produce all ${total} units, and the stock serves period ${T} without a set-up there. So positive demand in a period does not by itself force a set-up in that period.`
        : `No. Without a set-up in period ${T}, periods 1 to ${T - 1} can produce at most $${T - 1}\\cdot ${C}=${(T - 1) * C}$ units, but the total demand is ${total}.`,
    });
  }
  return {
    id: 'lotsize', topic: 't206c', title: inst.title || 'Lot-sizing inequalities',
    statement: () => frag(
      `Capacitated lot sizing over ${T} periods: $s_{t-1}+y_t-s_t=d_t$, $0\\le y_t\\le ${C}\\,x_t$, $x_t\\in\\{0,1\\}$, $s_t\\ge 0$, $s_0=0$, no backlog. Production capacity per set-up: $C=${C}$.`,
      dataTable(['Period $t$'].concat(d.map((_, t) => t + 1)), [['Demand $d_t$'].concat(d)], 'compact'),
    ),
    rules: 'Demand up to period $t$ must be produced in periods $1..t$, each set-up giving at most $C$ units: $\\sum_{i\\le t}x_i\\ge\\lceil\\sum_{i\\le t}d_i/C\\rceil$. Single period: $y_t\\le d_tx_t+s_t$.',
    steps,
    wrapup: 'Lot-sizing inequalities use the time structure: the demand up to period t needs enough set-ups by period t. The cumulative cuts use zero initial inventory, no backlogging and a common capacity C; each assumption enters the derivation. Checking every cumulative cut needs only the prefix sums of the demands and of the fractional set-ups.',
  };
}

export const lotDrill = {
  id: 'lotsize', title: 'Lot-sizing inequalities', topic: 't206c', minutes: 6,
  blurb: 'Cumulative demand, minimum number of set-ups, and which cumulative and single-period cuts a fractional point violates.',
  presets: [
    { id: 'slides', label: 'C = 10, d = (6, 6) (slides 206)', make: () => ({ d: [6, 6], C: 10, title: 'Lot sizing — example of slides 206' }) },
    { id: '20e14', label: 'C = 12, d = (5, 8, 6) (20E, exercise 14)', make: () => ({ d: [5, 8, 6], C: 12, testPoint: true, noSetupLast: true, title: 'Lot sizing — 20E, exercise 14' }) },
  ],
  random: (rng, level) => {
    const T = level === 1 ? 3 : 4;
    const C = rng.pick([8, 10, 12]);
    const d = Array.from({ length: T }, () => rng.int(2, C - 1));
    return { d, C, noSetupLast: level === 3, title: 'Lot sizing — practice' };
  },
  build: buildLot,
};
