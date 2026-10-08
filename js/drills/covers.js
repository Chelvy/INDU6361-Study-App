// Problem-specific valid inequalities (slides 206): covers, lifting and facets, cliques, flow covers, lot sizing.
import { Frac, ZERO, ONE } from '../math/frac.js';
import { knapsackLP, isCover, isMinimalCover, minimalCovers, extendedCover, coverSeparation, sequentialLifting, knapsackFace, knapsackAllOptima } from '../math/knapsack.js';
import { flowCover, flowCoverLhs, lotSizingCumulative, maxWeightClique } from '../math/cuts.js';
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

// ---------------------------------------------------------------- covers
function buildCovers(inst) {
  const { a, b, c } = inst;
  const n = a.length;
  const names = xn(n);
  const cands = inst.cand.map(zero);
  const C = zero(inst.C);
  const mins = minimalCovers(a, b);
  const ext = extendedCover(a, C);
  const xbar = inst.xbar ? inst.xbar.map((v) => Frac.parse(String(v))) : knapsackLP(a, c, b).x;
  const lpVal = xbar.reduce((s, v, j) => s.add(v.mul(c[j])), ZERO);
  const sep = coverSeparation(a, b, xbar);
  const ipVal = knapsackAllOptima(a, c, b).value;
  const coverText = ineqText(indicator(n, C), names, '<=', C.length - 1);
  const extText = ineqText(indicator(n, ext), names, '<=', C.length - 1);
  const sepLhs = sep.cover.reduce((s, j) => s.add(xbar[j]), ZERO);
  return {
    id: 'covers', topic: 't206a', title: inst.title || 'Cover inequalities',
    statement: () => frag(`Binary knapsack: $$\\max\\ ${linTex(c, names)}\\qquad\\text{s.t.}\\qquad ${knapTex(a, b)},\\qquad x\\in\\{0,1\\}^{${n}}.$$`),
    rules: 'A set $C$ is a <b>cover</b> if $\\sum_{j\\in C}a_j\\gt b$; it is <b>minimal</b> if removing any one item leaves a set that fits. Cover inequality: $\\sum_{j\\in C}x_j\\le|C|-1$.',
    steps: [
      {
        title: 'Which sets are covers?',
        fields: [{
          type: 'table', label: 'For each set: its total weight, whether it is a cover, and whether it is a minimal cover', corner: 'Set',
          columns: [{ key: 'w', head: 'Weight', kind: 'num', plain: 'weight' }, { key: 'cov', head: 'Cover?', kind: 'choice', options: YN, plain: 'cover' }, { key: 'min', head: 'Minimal cover?', kind: 'choice', options: YN, plain: 'minimal' }],
          rows: cands.map((S) => ({ head: `$${braces(one(S))}$`, cells: { w: S.reduce((s, j) => s + a[j], 0), cov: isCover(a, b, S) ? 'yes' : 'no', min: isMinimalCover(a, b, S) ? 'yes' : 'no' } })),
        }],
        explain: ul(cands.map((S) => {
          const w = S.reduce((s, j) => s + a[j], 0);
          if (!isCover(a, b, S)) return `$${braces(one(S))}$: weight ${w} ≤ ${b}, the items fit together: not a cover.`;
          if (isMinimalCover(a, b, S)) return `$${braces(one(S))}$: weight ${w} &gt; ${b}, and dropping any item gives at most ${Math.max(...S.map((j) => w - a[j]))} ≤ ${b}: a minimal cover.`;
          const drop = S.find((j) => w - a[j] > b);
          return `$${braces(one(S))}$: weight ${w} &gt; ${b}, a cover, but without item ${drop + 1} the weight is still ${w - a[drop]} &gt; ${b}: not minimal.`;
        })),
      },
      {
        title: 'Cover inequalities',
        fields: [
          { type: 'int', label: 'Number of minimal covers of this knapsack', answer: mins.length },
          { type: 'ineq', label: `Cover inequality of $C=${braces(one(C))}$`, answer: coverText, answerText: coverText, order: names, placeholder: 'e.g. x1 + x4 <= 1' },
        ],
        explain: `Minimal covers: ${mins.map((S) => `$${braces(one(S))}$`).join(', ')}. For $C=${braces(one(C))}$: not all $|C|=${C.length}$ items can be chosen, so $${ineqTex(indicator(n, C), names, '<=', C.length - 1)}$.`,
      },
      {
        title: 'Extended cover',
        text: `$E(C)=C\\cup\\{j:\\ a_j\\ge\\max_{i\\in C}a_i\\}$ for $C=${braces(one(C))}$. The right-hand side stays $|C|-1$.`,
        fields: [
          { type: 'set', label: '$E(C)$', answer: one(ext).map(String), placeholder: 'e.g. 1, 2, 3, 4' },
          { type: 'ineq', label: 'Extended cover inequality', answer: extText, answerText: extText, order: names },
        ],
        explain: ext.length > C.length ? `The heaviest item of $C$ weighs ${Math.max(...C.map((j) => a[j]))}; item${ext.length - C.length > 1 ? 's' : ''} ${one(ext.filter((j) => !C.includes(j))).join(', ')} weigh${ext.length - C.length > 1 ? '' : 's'} at least as much and can be added: $${ineqTex(indicator(n, ext), names, '<=', C.length - 1)}$. It dominates the cover inequality (same right-hand side, more terms).` : `No item outside $C$ is at least as heavy as the heaviest item of $C$ (${Math.max(...C.map((j) => a[j]))}), so $E(C)=C$ and nothing is gained.`,
      },
      {
        title: 'Separation at the LP optimum',
        text: `The LP relaxation has the optimal solution $\\bar x=(${xbar.map((v) => v.toLatex()).join(',\\ ')})$ with value $${lpVal.toLatex()}$. Consider the cover $C^*=${braces(one(sep.cover))}$.`,
        fields: [
          { type: 'num', label: '$\\sum_{j\\in C^*}(1-\\bar x_j)$', answer: sep.value },
          { type: 'num', label: 'Left-hand side $\\sum_{j\\in C^*}\\bar x_j$', answer: sepLhs },
          { type: 'choice', label: 'Is the cover inequality of $C^*$ violated by $\\bar x$?', options: YN, answer: sep.violated ? 'yes' : 'no' },
        ],
        explain: `$\\sum_{C^*}(1-\\bar x_j)=${sep.value.toLatex()}$, which is ${sep.violated ? 'below 1: violated' : 'at least 1: not violated'}. Equivalently $\\sum_{C^*}\\bar x_j=${sepLhs.toLatex()}$ against $|C^*|-1=${sep.cover.length - 1}$. The separation problem $\\min\\sum_j(1-\\bar x_j)z_j$ s.t. $\\sum_ja_jz_j\\ge b+1$, $z$ binary, finds the most violated cover; here its optimal value is $${sep.value.toLatex()}$. For reference the integer optimum is ${ipVal} and the LP bound is $${lpVal.toLatex()}$.`,
      },
    ],
    wrapup: 'Only minimal covers are worth generating: a non-minimal cover inequality is implied by a minimal one. The number of minimal covers can be exponential, so they are separated, not enumerated.',
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

export const coversDrill = {
  id: 'covers', title: 'Cover inequalities', topic: 't206a', minutes: 8,
  blurb: 'Covers, minimal covers, extended covers and the separation test at the LP optimum.',
  presets: [{ id: 'slides', label: 'Knapsack 4, 4, 4, 7 ≤ 10 (slides 206)', make: () => ({ a: [4, 4, 4, 7], b: 10, c: [6, 6, 6, 10], C: [1, 2, 3], cand: [[1, 4], [1, 2], [1, 2, 3, 4], [1, 2, 3]], xbar: ['1/2', '1', '1', '0'], title: 'Cover inequalities — knapsack of slides 206' }) }],
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
  lift.steps.forEach((st, i) => {
    const before = coefSoFar.slice();
    const k = st.k;
    const maxVal = st.max === null ? null : st.max;
    steps.push({
      title: `Lift $x_{${k + 1}}$`,
      text: `Current inequality: $${ineqTex(before, names, '<=', beta)}$. Fix $x_{${k + 1}}=1$ and find how much of the left-hand side can still be collected.`,
      fields: [
        { type: 'num', label: `Capacity left when $x_{${k + 1}}=1$`, answer: b - a[k] },
        { type: 'num', label: `$\\max$ of the current left-hand side over feasible points with $x_{${k + 1}}=1$`, answer: maxVal === null ? 0 : maxVal },
        { type: 'num', label: `Lifting coefficient $\\alpha_{${k + 1}}$`, answer: st.alpha, mis: [{ value: maxVal === null ? 0 : maxVal, msg: 'That is the maximum; the coefficient is $\\beta$ minus this maximum.' }].filter((m) => !fr(m.value).eq(st.alpha)) },
      ],
      explain: `With $x_{${k + 1}}=1$ the remaining capacity is $${b}-${a[k]}=${b - a[k]}$. The best the other terms can do is $${maxVal === null ? 0 : maxVal.toLatex()}$${st.argmax ? ` (for example with items ${one(st.argmax.map((v, j) => (v && j !== k ? j : -1)).filter((j) => j >= 0)).join(', ') || 'none'})` : ''}, so $\\alpha_{${k + 1}}=\\beta-\\max=${beta}-${maxVal === null ? 0 : maxVal.toLatex()}=${st.alpha.toLatex()}$.`,
    });
    coefSoFar = coefSoFar.slice();
    coefSoFar[k] = st.alpha;
    void i;
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
    statement: () => frag(`Knapsack set $X=\\{x\\in\\{0,1\\}^{${n}}:\\ ${knapTex(a, b)}\\}$ and the minimal cover $C=${braces(inst.cover)}$ with cover inequality $$${ineqTex(baseCoef, names, '<=', beta)}.$$ Lift the variable${order.length > 1 ? 's' : ''} ${order.map((k) => `$x_{${k + 1}}$`).join(', then ')}.`),
    rules: 'Sequential lifting: $\\alpha_k=\\beta-\\max\\{\\text{current left-hand side}:\\ x\\in X,\\ x_k=1\\}$. Variables already lifted keep their coefficients in the next maximisation.',
    steps,
    wrapup: 'Lifting keeps the inequality valid and makes it as strong as possible in the lifted variable. With several variables the result depends on the lifting order.',
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
  presets: [{ id: 'slides', label: 'Lift x4 into x1 + x2 + x3 ≤ 2 (slides 206)', make: () => ({ a: [4, 4, 4, 7], b: 10, cover: [1, 2, 3], order: [4], title: 'Lifting — the example of slides 206' }) }],
  random: (rng, level) => ({ ...randomLifting(rng, level), title: 'Lifting — practice' }),
  build: buildLifting,
};

// ---------------------------------------------------------------- clique inequalities
function buildClique(inst) {
  const { n, edges } = inst;
  const names = xn(n);
  const xbar = inst.xbar.map((v) => Frac.parse(String(v)));
  const adj = Array.from({ length: n }, () => new Array(n).fill(false));
  edges.forEach(([i, j]) => { adj[i][j] = true; adj[j][i] = true; });
  const isClique = (S) => S.every((i, p) => S.slice(p + 1).every((j) => adj[i][j]));
  const cands = inst.cand.map(zero);
  const best = maxWeightClique(n, edges, xbar);
  const K = best.clique;
  const cutText = ineqText(indicator(n, K), names, '<=', 1);
  const nodes = Array.from({ length: n }, (_, i) => String(i + 1));
  const fig = (hl) => graphFigure({
    nodes, pos: circleLayout(nodes), directed: false, height: 280,
    edges: edges.map(([i, j]) => ({ u: String(i + 1), v: String(j + 1), cls: hl && K.includes(i) && K.includes(j) ? 'hl' : '' })),
    badges: Object.fromEntries(nodes.map((v, i) => [v, xbar[i].toString()])),
    nodeCls: hl ? Object.fromEntries(nodes.map((v, i) => [v, K.includes(i) ? 'cur' : ''])) : null,
    caption: 'Conflict graph. An edge means the two variables cannot both be 1. Numbers: the LP values.',
  });
  const total = xbar.reduce((s, v) => s.add(v), ZERO);
  return {
    id: 'clique', topic: 't206a', title: inst.title || 'Clique inequalities',
    statement: () => frag(
      `Binary variables $x_1,\\dots,x_{${n}}$ with pairwise conflicts $x_i+x_j\\le 1$ for the pairs ${edges.map(([i, j]) => `{${i + 1},${j + 1}}`).join(', ')}. The LP relaxation of the edge formulation gives $\\bar x=(${xbar.map((v) => v.toLatex()).join(',\\ ')})$.`,
      fig(false),
    ),
    rules: 'A clique is a set of variables that are pairwise in conflict. Clique inequality: $\\sum_{j\\in K}x_j\\le 1$.',
    steps: [
      {
        title: 'Cliques and their LP weight',
        fields: [{
          type: 'table', label: 'For each set: is it a clique, and what is $\\bar x(K)$?', corner: 'Set',
          columns: [{ key: 'c', head: 'Clique?', kind: 'choice', options: YN, plain: 'clique' }, { key: 'w', head: '$\\bar x(K)$', kind: 'num', plain: 'weight' }],
          rows: cands.map((S) => ({ head: `$${braces(one(S))}$`, cells: { c: isClique(S) ? 'yes' : 'no', w: S.reduce((s, j) => s.add(xbar[j]), ZERO) } })),
        }],
        explain: ul(cands.map((S) => {
          const w = S.reduce((s, j) => s.add(xbar[j]), ZERO);
          if (isClique(S)) return `$${braces(one(S))}$ is a clique, $\\bar x(K)=${w.toLatex()}$${w.gt(ONE) ? ' &gt; 1: its inequality is violated' : ' ≤ 1: satisfied'}.`;
          const miss = []; S.forEach((i, p) => S.slice(p + 1).forEach((j) => { if (!adj[i][j]) miss.push(`{${i + 1},${j + 1}}`); }));
          return `$${braces(one(S))}$ is not a clique: ${miss[0]} is not a conflict, so both can be 1 and the inequality would not be valid.`;
        })),
      },
      {
        title: 'The most violated clique inequality',
        text: `Separation: find a clique of maximum LP weight. Here it is $K^*=${braces(one(K))}$.`,
        fields: [
          { type: 'ineq', label: 'Clique inequality of $K^*$', answer: cutText, answerText: cutText, order: names },
          { type: 'num', label: 'Its violation $\\bar x(K^*)-1$', answer: best.weight.gt(ONE) ? best.weight.sub(ONE) : 0 },
          { type: 'int', label: 'Number of edge constraints it replaces (pairs inside $K^*$)', answer: (K.length * (K.length - 1)) / 2 },
        ],
        explain: () => frag(`$${ineqTex(indicator(n, K), names, '<=', 1)}$; at $\\bar x$ the left-hand side is $${best.weight.toLatex()}$${best.weight.gt(ONE) ? `, violated by $${best.weight.sub(ONE).toLatex()}$` : ', not violated'}. One clique row dominates the ${(K.length * (K.length - 1)) / 2} edge rows inside it: adding the edge rows only gives $\\sum_{K^*}x_j\\le ${K.length}/2$.`, fig(true)),
      },
      {
        title: 'Effect on the bound',
        text: `Suppose the objective is $\\max\\sum_jx_j$ and $\\bar x$ is LP-optimal for the edge formulation.`,
        fields: [
          { type: 'num', label: 'LP value of $\\bar x$', answer: total },
          { type: 'choice', label: 'Does the clique inequality of $K^*$ cut off $\\bar x$?', options: YN, answer: best.weight.gt(ONE) ? 'yes' : 'no' },
        ],
        explain: `$\\sum_j\\bar x_j=${total.toLatex()}$. ${best.weight.gt(ONE) ? 'The point violates the clique inequality, so the bound must drop when the row is added. In the meetings example of slides 206 it goes from 2.5 to 2, which is the integer optimum.' : 'The point satisfies every clique inequality.'}`,
      },
    ],
    wrapup: 'Half-integral LP solutions on odd structures are typical of edge formulations. Maximal cliques give the strongest inequalities; finding a maximum-weight clique is itself hard, so solvers use heuristics.',
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
    return { n, edges, xbar, cand: rng.shuffle(cand) };
  }
  return null;
}

const MEETINGS = () => ({ n: 4, edges: [[0, 1], [0, 2], [1, 2]], xbar: ['1/2', '1/2', '1/2', '1'], cand: [[1, 2, 3], [1, 2, 4], [1, 3]], title: 'Clique inequalities — meetings example (slides 206)' });

export const cliqueDrill = {
  id: 'clique', title: 'Clique inequalities', topic: 't206a', minutes: 5,
  blurb: 'Recognise cliques in a conflict graph, find the most violated clique inequality and see why it dominates edge constraints.',
  presets: [{ id: 'meetings', label: 'Meetings example (slides 206)', make: MEETINGS }],
  random: (rng, level) => ({ ...(randomClique(rng, level) || MEETINGS()), title: 'Clique inequalities — practice' }),
  build: buildClique,
};

// ---------------------------------------------------------------- flow cover
function buildFlowCover(inst) {
  const { a, b } = inst;
  const C = zero(inst.C);
  const n = a.length;
  const fc = flowCover(a, b, C);
  const xbar = inst.xbar.map((v) => Frac.parse(String(v)));
  const ybar = inst.ybar.map((v) => Frac.parse(String(v)));
  const lhs = flowCoverLhs(fc, C, xbar, ybar);
  const yNames = C.map((j) => `y${j + 1}`), xNames = C.map((j) => `x${j + 1}`);
  const cutCoefs = C.map(() => 1).concat(C.map((j) => fc.coef[j].neg()));
  const cutText = ineqText(cutCoefs, yNames.concat(xNames), '<=', fc.rhsCollected);
  return {
    id: 'flowcover', topic: 't206c', title: inst.title || 'Flow cover inequality',
    statement: () => frag(
      `Single-node fixed-charge flow set: $$\\sum_{j=1}^{${n}}y_j\\le ${b},\\qquad 0\\le y_j\\le a_jx_j,\\qquad x_j\\in\\{0,1\\},$$ with capacities $a=(${a.join(', ')})$. Take $C=${braces(inst.C)}$.`,
      `The LP relaxation has the solution $\\bar x=(${xbar.map((v) => v.toLatex()).join(', ')})$, $\\bar y=(${ybar.map((v) => v.toLatex()).join(', ')})$.`,
    ),
    rules: 'For $C$ with $\\lambda=\\sum_{j\\in C}a_j-b\\gt 0$: $\\ \\sum_{j\\in C}y_j+\\sum_{j\\in C}(a_j-\\lambda)^+(1-x_j)\\le b$.',
    steps: [
      {
        title: 'Excess of the cover',
        fields: [{ type: 'num', label: '$\\lambda=\\sum_{j\\in C}a_j-b$', answer: fc.lambda }, { type: 'choice', label: 'Is $C$ a flow cover?', options: YN, answer: 'yes' }],
        explain: `$\\lambda=${C.map((j) => a[j]).join('+')}-${b}=${fc.lambda.toLatex()}\\gt 0$: opening all arcs of $C$ gives more capacity than the node can absorb.`,
      },
      {
        title: 'Coefficients',
        fields: [{ type: 'table', label: '$(a_j-\\lambda)^+$ for $j\\in C$', columns: C.map((j) => ({ key: `k${j}`, head: `$j=${j + 1}$`, kind: 'num', plain: `arc ${j + 1}` })), rows: [{ cells: Object.fromEntries(C.map((j) => [`k${j}`, fc.coef[j]])) }] }],
        explain: C.map((j) => `$(${a[j]}-${fc.lambda.toLatex()})^+=${fc.coef[j].toLatex()}$`).join(', ') + '. Closing arc $j$ removes $a_j$ of capacity but only $\\lambda$ of it was excess, so the flow must drop by $a_j-\\lambda$ (if positive).',
      },
      {
        title: 'The inequality',
        text: 'Write it with all variables on the left and a constant on the right.',
        fields: [{ type: 'ineq', label: 'Flow cover inequality', answer: cutText, answerText: cutText, order: yNames.concat(xNames), placeholder: 'e.g. y1 + y2 - 4x1 - 4x2 <= 2' }],
        explain: `$${C.map((j) => `y_{${j + 1}}`).join('+')}+${C.map((j) => `${fc.coef[j].toLatex()}(1-x_{${j + 1}})`).join('+')}\\le ${b}$, i.e. $${ineqTex(cutCoefs, yNames.concat(xNames), '<=', fc.rhsCollected)}$.`,
      },
      {
        title: 'Test the LP point',
        fields: [
          { type: 'num', label: 'Left-hand side $\\sum_C\\bar y_j+\\sum_C(a_j-\\lambda)^+(1-\\bar x_j)$', answer: lhs },
          { type: 'choice', label: 'Is the point cut off?', options: YN, answer: lhs.gt(fr(b)) ? 'yes' : 'no' },
        ],
        explain: `$${lhs.toLatex()}${lhs.gt(fr(b)) ? '\\gt' : '\\le'} ${b}$: the point is ${lhs.gt(fr(b)) ? 'cut off' : 'not cut off'}. In the LP the $x_j$ are only as large as $\\bar y_j/a_j$; the inequality charges for that.`,
      },
    ],
    wrapup: 'Flow covers are the cover inequalities of fixed-charge network structures (variable upper bounds y ≤ a x). Solvers report them as "Flow cover" in the cut summary of the log.',
  };
}

function randomFlowCover(rng, level) {
  const n = level === 1 ? 2 : 3;
  for (let t = 0; t < 400; t++) {
    const a = Array.from({ length: n }, () => rng.int(4, 9));
    const total = a.reduce((s, v) => s + v, 0);
    const b = rng.int(Math.max(...a) + 1, total - 1);
    const lambda = total - b;
    if (!a.some((v) => v > lambda)) continue;
    const frac = fr(b).div(total);
    const xbar = a.map(() => frac.toString());
    const ybar = a.map((v) => fr(v).mul(frac).toString());
    if (frac.d > 20n) continue;
    return { a, b, C: a.map((_, j) => j + 1), xbar, ybar };
  }
  return { a: [6, 6], b: 10, C: [1, 2], xbar: ['5/6', '5/6'], ybar: ['5', '5'] };
}

export const flowCoverDrill = {
  id: 'flowcover', title: 'Flow cover inequality', topic: 't206c', minutes: 5,
  blurb: 'Compute λ and the coefficients, write the inequality, and test it on the LP point.',
  presets: [{ id: 'slides', label: 'a = (6, 6), b = 10 (slides 206)', make: () => ({ a: [6, 6], b: 10, C: [1, 2], xbar: ['5/6', '5/6'], ybar: ['5', '5'], title: 'Flow cover — example of slides 206' }) }],
  random: (rng, level) => ({ ...randomFlowCover(rng, level), title: 'Flow cover — practice' }),
  build: buildFlowCover,
};

// ---------------------------------------------------------------- lot sizing
function buildLot(inst) {
  const { d, C } = inst;
  const T = d.length;
  const cum = lotSizingCumulative(d, C);
  const xbar = d.map((dt) => fr(dt).div(C));
  let run = ZERO;
  const lhs = xbar.map((v) => { run = run.add(v); return run; });
  const cols = d.map((_, t) => ({ key: `t${t}`, head: `$t=${t + 1}$`, kind: 'num', plain: `period ${t + 1}` }));
  const row = (head, vals) => ({ head, cells: Object.fromEntries(vals.map((v, t) => [`t${t}`, v])) });
  const tStar = inst.t || 1;
  const dt = d[tStar - 1];
  return {
    id: 'lotsize', topic: 't206c', title: inst.title || 'Lot-sizing inequalities',
    statement: () => frag(
      `Capacitated lot sizing over ${T} periods: $s_{t-1}+y_t-s_t=d_t$, $0\\le y_t\\le ${C}\\,x_t$, $x_t\\in\\{0,1\\}$, $s_0=0$, no backlog. Production capacity per set-up: $C=${C}$.`,
      dataTable(['Period $t$'].concat(d.map((_, t) => t + 1)), [['Demand $d_t$'].concat(d)], 'compact'),
    ),
    rules: 'Demand up to period $t$ must be produced in periods $1..t$, each set-up giving at most $C$ units: $\\sum_{i\\le t}x_i\\ge\\lceil\\sum_{i\\le t}d_i/C\\rceil$.',
    steps: [
      {
        title: 'Cumulative set-up bounds',
        fields: [{ type: 'table', label: 'Cumulative demand and the minimum number of set-ups by period $t$', corner: '', columns: cols, rows: [row('$\\sum_{i\\le t}d_i$', cum.map((x) => x.demand)), row('$\\lceil\\sum_{i\\le t}d_i/C\\rceil$', cum.map((x) => x.rhs))] }],
        explain: cum.map((x) => `$t=${x.t}$: $\\lceil ${x.demand}/${C}\\rceil=${x.rhs}$`).join('; ') + '.',
      },
      {
        title: 'The LP solution',
        text: `Without the cuts, the LP produces $y_t=d_t$ in every period and sets $\\bar x_t=d_t/C$: $\\bar x=(${xbar.map((v) => v.toLatex()).join(', ')})$.`,
        fields: [{
          type: 'table', label: 'Left-hand side $\\sum_{i\\le t}\\bar x_i$ of each cumulative cut, and whether the cut is violated', corner: '',
          columns: d.map((_, t) => ({ key: `t${t}`, head: `$t=${t + 1}$`, kind: 'num', plain: `period ${t + 1}` })),
          rows: [row('$\\sum_{i\\le t}\\bar x_i$', lhs)],
        }, { type: 'set', label: 'Periods $t$ whose cumulative cut is violated (or <code>none</code>)', answer: cum.filter((x, t) => lhs[t].lt(x.rhs)).map((x) => String(x.t)), placeholder: 'e.g. 1, 2' }],
        explain: cum.map((x, t) => `$t=${x.t}$: $${lhs[t].toLatex()}${lhs[t].lt(x.rhs) ? '\\lt' : '\\ge'} ${x.rhs}$${lhs[t].lt(x.rhs) ? ' (violated)' : ''}`).join('; ') + '. The LP pays only a fraction of each set-up cost; the cuts force whole set-ups.',
      },
      {
        title: 'A single-period inequality',
        text: `Slides 206 also give $y_t\\le d_t\\,x_t+s_t$: production in period $t$ beyond its own demand must end up in stock. Test it for $t=${tStar}$ at the LP point above ($\\bar y_t=d_t$, $\\bar s_t=0$).`,
        fields: [
          { type: 'num', label: 'Left-hand side $\\bar y_t$', answer: dt },
          { type: 'num', label: 'Right-hand side $d_t\\bar x_t+\\bar s_t$', answer: fr(dt).mul(xbar[tStar - 1]) },
          { type: 'choice', label: 'Violated?', options: YN, answer: fr(dt).gt(fr(dt).mul(xbar[tStar - 1])) ? 'yes' : 'no' },
        ],
        explain: `$\\bar y_t=${dt}$ against $${dt}\\cdot ${xbar[tStar - 1].toLatex()}+0=${fr(dt).mul(xbar[tStar - 1]).toLatex()}$: ${fr(dt).gt(fr(dt).mul(xbar[tStar - 1])) ? 'violated, because the set-up variable is fractional' : 'not violated: the set-up variable is already 1'}.`,
      },
    ],
    wrapup: 'Lot-sizing inequalities exploit the time structure: what is needed by period t must be set up by period t. They are the reason modern solvers handle production planning far better than the plain big-M model suggests.',
  };
}

export const lotDrill = {
  id: 'lotsize', title: 'Lot-sizing inequalities', topic: 't206c', minutes: 5,
  blurb: 'Cumulative demand, minimum number of set-ups, and which cuts the LP solution violates.',
  presets: [{ id: 'slides', label: 'C = 10, d = (6, 6) (slides 206)', make: () => ({ d: [6, 6], C: 10, t: 1, title: 'Lot sizing — example of slides 206' }) }],
  random: (rng, level) => {
    const T = level === 1 ? 3 : 4;
    const C = rng.pick([8, 10, 12]);
    const d = Array.from({ length: T }, () => rng.int(2, C - 1));
    return { d, C, t: rng.int(1, T), title: 'Lot sizing — practice' };
  },
  build: buildLot,
};
