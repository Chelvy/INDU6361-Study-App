// Integrality trainers (slides 106): recognising total unimodularity; flows, cuts and the min-cut integer program.
import { Frac, ZERO } from '../math/frac.js';
import { isTotallyUnimodular, sufficientCondition, signPatternForCriterion, incidenceMatrix } from '../math/tu.js';
import { edmondsKarp, cutCapacity } from '../math/graphs.js';
import { graphFigure, matrixTable, LAYOUTS, circleLayout } from '../viz.js';
import { setText, frag, parseMatrix } from './common.js';

const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

// ---------------------------------------------------------------- total unimodularity
function buildTU(inst) {
  const M = inst.M;
  const m = M.length, n = M[0].length;
  const crit = sufficientCondition(M);
  const tu = isTotallyUnimodular(M);
  const badCols = [];
  for (let j = 0; j < n; j++) {
    const plus = M.filter((r) => r[j] === 1).length, minus = M.filter((r) => r[j] === -1).length;
    if (plus > 1 || minus > 1) badCols.push(j + 1);
  }
  const pattern = !crit.holds && tu.tu ? signPatternForCriterion(M) : null;
  const verdict = !tu.tu ? 'not' : crit.holds ? 'crit' : 'other';
  const heads = { rowHeads: M.map((_, i) => `r${i + 1}`), colHeads: M[0].map((_, j) => `c${j + 1}`) };
  const steps = [
    {
      title: 'The criterion from the slides',
      text: 'Sufficient condition: every entry is $0$, $+1$ or $-1$, and every column has at most one $+1$ and at most one $-1$.',
      fields: [
        { type: 'choice', label: 'Are all entries in $\\{-1,0,1\\}$?', options: YN, answer: crit.entriesOk ? 'yes' : 'no' },
        { type: 'set', label: 'Columns with more than one $+1$ or more than one $-1$ (numbers, or <code>none</code>)', answer: badCols.map(String), placeholder: 'e.g. 2, 3 or none' },
        { type: 'choice', label: 'Does the criterion apply to this matrix as it is written?', options: YN, answer: crit.holds ? 'yes' : 'no' },
      ],
      explain: crit.holds ? 'Every column has at most one $+1$ and at most one $-1$, and all entries are in $\\{-1,0,1\\}$: the criterion applies. This is the shape of a node–arc incidence matrix.' : `The criterion does not apply: ${crit.reasons.slice(0, 4).join('; ')}${crit.reasons.length > 4 ? '; …' : ''}. That alone does <b>not</b> show the matrix fails to be TU, because the condition is sufficient, not necessary.`,
    },
  ];
  if (!tu.tu) {
    const w = tu.witness;
    steps.push({
      title: 'A certificate that it is not TU',
      text: () => frag(`Consider the square submatrix on rows ${setText(w.rows.map((i) => `r${i + 1}`))} and columns ${setText(w.cols.map((j) => `c${j + 1}`))}:`, matrixTable(w.sub, { rowHeads: w.rows.map((i) => `r${i + 1}`), colHeads: w.cols.map((j) => `c${j + 1}`) })),
      fields: [
        { type: 'num', label: 'Its determinant', answer: w.det },
        { type: 'choice', stack: true, label: 'Conclusion', options: [{ value: 'crit', label: 'Totally unimodular' }, { value: 'not', label: 'Not totally unimodular: a square submatrix has a determinant outside $\\{-1,0,1\\}$' }], answer: 'not' },
      ],
      explain: `The determinant is $${w.det.toLatex()}$, which is not in $\\{-1,0,1\\}$. One such submatrix is enough: the matrix is not TU, and for some integer right-hand side the polyhedron has a fractional vertex.`,
    });
  } else {
    steps.push({
      title: 'Verdict',
      fields: [{
        type: 'choice', stack: true, label: 'Which statement is true?', answer: verdict,
        options: [
          { value: 'crit', label: 'Totally unimodular, by the criterion.' },
          { value: 'other', label: 'Totally unimodular, although the criterion does not apply directly.' },
          { value: 'not', label: 'Not totally unimodular.' },
        ],
        mis: verdict === 'other' ? { not: 'Failing a sufficient condition proves nothing. Check the determinants of the square submatrices, or look for row sign changes.' } : {},
      }],
      explain: verdict === 'crit' ? 'The criterion is sufficient, so the matrix is TU.'
        : pattern ? `Multiplying row${pattern.negate.length > 1 ? 's' : ''} ${pattern.negate.map((i) => `r${i + 1}`).join(', ')} by $-1$ does not change the absolute value of any subdeterminant, and afterwards every column has at most one $+1$ and one $-1$. So the matrix is TU. (This is how the assignment constraint matrix is recognised: negate the rows of one side.)`
          : 'Every square submatrix has determinant $-1$, $0$ or $1$ (checked exhaustively), so the matrix is TU even though the simple criterion does not show it. Matrices whose columns have their ones in consecutive rows are a classical example.',
    });
  }
  steps.push({
    title: 'What it means for the integer program',
    text: 'Suppose the right-hand side $b$ is integer.',
    fields: [{
      type: 'choice', stack: true, label: 'For $P=\\{x\\ge 0: Ax\\le b\\}$:', answer: tu.tu ? 'int' : 'maybe',
      options: [
        { value: 'int', label: 'Every extreme point of $P$ is integer, so the LP relaxation solves the integer program.' },
        { value: 'maybe', label: 'Integrality is not guaranteed: for some integer $b$ the polyhedron has a fractional extreme point.' },
        { value: 'never', label: 'The LP relaxation never has an integer optimal solution.' },
      ],
      mis: { never: 'Not TU does not mean always fractional: for a particular $b$ and objective the LP optimum may still be integer.' },
    }],
    explain: tu.tu ? 'A TU and $b$ integer ⟹ the polyhedron is integral: simplex returns an integer vertex and no branching is needed.' : 'Without total unimodularity nothing is guaranteed. A particular instance may still give an integer LP optimum, but it cannot be relied upon.',
  });
  return {
    id: 'tu', topic: 't106', title: inst.title || 'Recognising total unimodularity',
    statement: () => frag('Is the matrix $A$ totally unimodular (every square submatrix has determinant $-1$, $0$ or $1$)?', matrixTable(M, { ...heads, corner: '$A$' }), inst.note || ''),
    rules: 'Recognition level, as in the course: apply the column criterion; if it fails, look for a small submatrix with determinant ±2 or argue by row sign changes.',
    steps,
    wrapup: 'Changing one coefficient or adding one side constraint can destroy total unimodularity, and with it the integrality of the LP.',
  };
}

function randomTU(rng, level) {
  const kind = rng.pick(level === 1 ? ['inc', 'inc', 'two', 'odd'] : level === 2 ? ['inc', 'bip', 'odd', 'two', 'int'] : ['bip', 'odd', 'int', 'rand', 'rand']);
  if (kind === 'inc') {
    const nodes = ['1', '2', '3', '4'];
    const pairs = rng.shuffle([['1', '2'], ['1', '3'], ['2', '3'], ['2', '4'], ['3', '4'], ['1', '4'], ['3', '2']]).slice(0, 5);
    const M = incidenceMatrix(nodes, pairs.map(([u, v]) => ({ u, v })));
    return { M: rng.bool(0.5) ? M.slice(0, 3) : M };
  }
  if (kind === 'two') {
    const M = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => rng.pick([0, 1, -1, 0])));
    M[rng.int(0, 2)][rng.int(0, 2)] = 2;
    return { M };
  }
  if (kind === 'odd') {
    const base = [[1, 1, 0], [0, 1, 1], [1, 0, 1]];
    const perm = rng.shuffle([0, 1, 2]);
    const M = perm.map((i) => base[i].slice());
    if (rng.bool(0.5)) M.forEach((r) => r.push(rng.pick([0, 1])));
    return { M };
  }
  if (kind === 'bip') {
    // edge-vertex incidence of a bipartite graph (rows = vertices): TU, but columns have two +1
    const edges = rng.shuffle([[0, 2], [0, 3], [1, 2], [1, 3], [0, 4], [1, 4]]).slice(0, rng.int(4, 5));
    const rows = 5;
    const M = Array.from({ length: rows }, (_, i) => edges.map(([u, v]) => (u === i || v === i ? 1 : 0)));
    return { M: M.filter((r) => r.some((v) => v !== 0)) };
  }
  if (kind === 'int') {
    // consecutive ones in every column (interval matrix): TU
    const M = Array.from({ length: 4 }, () => new Array(4).fill(0));
    for (let j = 0; j < 4; j++) { const a = rng.int(0, 2); const b = rng.int(a + 1, 3); for (let i = a; i <= b; i++) M[i][j] = 1; }
    return { M };
  }
  for (let t = 0; t < 200; t++) {
    const M = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => rng.pick([0, 1, 1, -1, 0])));
    if (M.some((r) => r.every((v) => v === 0))) continue;
    return { M };
  }
  return { M: [[1, 1, 0], [0, 1, 1], [1, 0, 1]] };
}

export const tuDrill = {
  id: 'tu', title: 'Recognising total unimodularity', topic: 't106', minutes: 5,
  blurb: 'Apply the column criterion, find a ±2 determinant when the matrix is not TU, and state what follows for the LP.',
  presets: [
    { id: 'flow', label: 'Node–arc incidence matrix (slides 106 network)', make: () => ({ M: incidenceMatrix(['s', 'a', 'b', 't'], [{ u: 's', v: 'a' }, { u: 's', v: 'b' }, { u: 'a', v: 'b' }, { u: 'a', v: 't' }, { u: 'b', v: 't' }]), note: 'Rows: vertices s, a, b, t. Columns: arcs sa, sb, ab, at, bt (+1 at the tail, −1 at the head).', title: 'Total unimodularity — flow conservation matrix' }) },
    { id: 'assign', label: 'Assignment constraints (2 workers, 2 jobs)', make: () => ({ M: [[1, 1, 0, 0], [0, 0, 1, 1], [1, 0, 1, 0], [0, 1, 0, 1]], note: 'Rows: worker 1, worker 2, job 1, job 2. Columns: $x_{11}, x_{12}, x_{21}, x_{22}$.', title: 'Total unimodularity — assignment constraints' }) },
    { id: 'odd', label: 'Odd-cycle matrix', make: () => ({ M: [[1, 1, 0], [0, 1, 1], [1, 0, 1]], note: 'Rows: the three edges of a triangle. Columns: its vertices.', title: 'Total unimodularity — triangle matrix' }) },
  ],
  random: (rng, level) => ({ ...randomTU(rng, level), title: 'Total unimodularity — practice' }),
  build: buildTU,
  custom: {
    help: 'A matrix with integer entries (at most 5 rows and 6 columns): one row per line.',
    fields: [{ key: 'M', label: 'Matrix', kind: 'textarea', value: '1 1 0\n0 1 1\n1 0 1' }],
    parse(v) {
      const M = parseMatrix(v.M);
      if (M.length > 5 || M[0].length > 6) throw new Error('Use at most 5 rows and 6 columns.');
      if (M.some((r) => r.some((x) => !Number.isInteger(x)))) throw new Error('Use integer entries.');
      return { M, title: 'Total unimodularity — your matrix' };
    },
  },
};

// ---------------------------------------------------------------- flows, cuts and the min-cut IP
const arcName = (a) => a.u + a.v;

function buildCut(inst) {
  const { nodes, arcs, S } = inst;
  const s = 's', t = 't';
  const flow = inst.flow.map((v) => Frac.of(v));
  const pos = inst.pos || LAYOUTS[inst.layout] || circleLayout(nodes);
  const inS = new Set(S);
  const value = arcs.reduce((acc, a, k) => (a.u === s ? acc.add(flow[k]) : a.v === s ? acc.sub(flow[k]) : acc), ZERO);
  const forward = arcs.filter((a) => inS.has(a.u) && !inS.has(a.v));
  const backward = arcs.filter((a) => !inS.has(a.u) && inS.has(a.v));
  const cap = cutCapacity(arcs, S);
  const fOut = arcs.reduce((acc, a, k) => (inS.has(a.u) && !inS.has(a.v) ? acc.add(flow[k]) : acc), ZERO);
  const fIn = arcs.reduce((acc, a, k) => (!inS.has(a.u) && inS.has(a.v) ? acc.add(flow[k]) : acc), ZERO);
  const best = edmondsKarp(nodes, arcs, s, t);
  const proven = value.eq(cap);
  const fig = () => graphFigure({
    nodes, pos, directed: true,
    edges: arcs.map((a, k) => ({ u: a.u, v: a.v, t: a.t, label: `${flow[k].pretty()}/${a.cap}`, cls: inS.has(a.u) && !inS.has(a.v) ? 'hl' : !inS.has(a.u) && inS.has(a.v) ? 'dash' : '' })),
    nodeCls: Object.fromEntries(nodes.map((v) => [v, inS.has(v) ? 'settled' : ''])),
    caption: 'Arc labels: flow / capacity. Filled vertices: S. Orange: arcs leaving S. Dashed: arcs entering S.',
  });
  const others = nodes.filter((v) => v !== s && v !== t);
  return {
    id: 'cutcheck', topic: 't106', title: inst.title || 'Flows, cuts and the min-cut program',
    statement: () => frag(
      `A feasible flow from <b>s</b> to <b>t</b> is shown (flow / capacity on each arc), together with the vertex set $S=${'\\{'}${S.join(', ')}${'\\}'}$.`,
      graphFigure({ nodes, pos, directed: true, edges: arcs.map((a, k) => ({ u: a.u, v: a.v, t: a.t, label: `${flow[k].pretty()}/${a.cap}` })), caption: 'Arc labels: flow / capacity.' }),
    ),
    rules: 'The capacity of the cut $(S,\\bar S)$ counts only arcs from $S$ to $\\bar S$. Name an arc by its two letters, e.g. <code>sa</code>.',
    steps: [
      {
        title: 'Value of the flow',
        fields: [{ type: 'num', label: 'Net flow leaving s', answer: value }],
        explain: `Arcs out of s carry ${arcs.map((a, k) => (a.u === s ? `${arcName(a)}: ${flow[k].pretty()}` : null)).filter(Boolean).join(', ')}; the value is ${value.pretty()}.`,
      },
      {
        title: 'Capacity of the cut',
        fields: [
          { type: 'set', label: 'Arcs from $S$ to $\\bar S$', answer: forward.map(arcName), placeholder: 'e.g. sb, at' },
          { type: 'num', label: 'Capacity of the cut', answer: cap, mis: backward.length ? [{ value: cap.add(backward.reduce((x, a) => x.add(Frac.of(a.cap)), ZERO)), msg: 'Arcs that enter $S$ do not count in the capacity of the cut.' }] : undefined },
          { type: 'num', label: 'Flow from $S$ to $\\bar S$ minus flow from $\\bar S$ to $S$', answer: fOut.sub(fIn) },
        ],
        explain: () => frag(`Forward arcs: ${forward.map((a) => `${arcName(a)} (${a.cap})`).join(', ')}; capacity ${cap.pretty()}.${backward.length ? ` Arcs entering $S$ (${backward.map(arcName).join(', ')}) are not counted.` : ''} The net flow across <b>any</b> s–t cut equals the value of the flow: ${fOut.pretty()} − ${fIn.pretty()} = ${value.pretty()}.`, fig()),
      },
      {
        title: 'What the pair proves',
        fields: [
          { type: 'num', label: 'Lower bound on the maximum flow given by this flow', answer: value },
          { type: 'num', label: 'Upper bound on the maximum flow given by this cut', answer: cap },
          { type: 'choice', stack: true, label: 'Conclusion', answer: proven ? 'opt' : 'open', options: [
            { value: 'opt', label: 'The flow is maximum and the cut is minimum.' },
            { value: 'open', label: 'Nothing is proved yet: the bounds differ, so the flow may or may not be maximum.' },
            { value: 'bad', label: 'The flow is infeasible because its value is below the cut capacity.' },
          ], mis: { bad: 'Every feasible flow has value at most every cut capacity (weak duality); that is not infeasibility.' } },
        ],
        explain: proven ? `Value ${value.pretty()} = capacity ${cap.pretty()}: a flow can never exceed a cut, so both are optimal. This pair is the certificate.` : `Every flow value ≤ every cut capacity, so ${value.pretty()} ≤ max flow ≤ ${cap.pretty()}. Here the maximum flow is ${best.value.pretty()} and a minimum cut is $S=${'\\{'}${best.S.join(', ')}${'\\}'}$ with arcs ${best.cutArcs.map((k) => arcName(arcs[k])).join(', ')}.`,
      },
      {
        title: 'The cut as a solution of the min-cut integer program',
        text: 'Slides 106: $\\min\\sum u_{ij}y_{ij}$ with $y_{ij}\\ge z_i-z_j$, $z_s=1$, $z_t=0$, $z$ binary, $y\\ge 0$. Encode the set $S$ above.',
        fields: [
          { type: 'table', label: '$z_i$ for each vertex', columns: others.map((v) => ({ key: v, head: `$z_${v}$`, kind: 'num', plain: `z_${v}` })), rows: [{ cells: Object.fromEntries(others.map((v) => [v, inS.has(v) ? 1 : 0])) }] },
          { type: 'set', label: 'Arcs with $y_{ij}=1$ in the cheapest solution for these $z$', answer: forward.map(arcName), placeholder: 'e.g. sb, at' },
          { type: 'num', label: 'Objective value', answer: cap },
        ],
        explain: `$z_i=1$ exactly for the vertices of $S$. Then $y_{ij}\\ge z_i-z_j$ forces $y_{ij}=1$ only on arcs from $S$ to $\\bar S$ (for arcs entering $S$ the right-hand side is $-1$, so $y=0$ is allowed). The objective is the cut capacity ${cap.pretty()}. The constraint matrix is a network matrix, so the LP relaxation already has integer optimal solutions.`,
      },
    ],
    wrapup: 'Max-flow and min-cut are LP duals of each other with totally unimodular constraint matrices: both LPs have integer optima and equal values.',
  };
}

function randomCut(rng, level) {
  const nodes = ['s', 'a', 'b', 'c', 'd', 't'];
  for (let it = 0; it < 500; it++) {
    const cap = () => rng.int(1, 6);
    const arcs = [{ u: 's', v: 'a', cap: cap() + 1 }, { u: 's', v: 'b', cap: cap() }, { u: 'a', v: 'c', cap: cap() + 1 }, { u: 'b', v: 'd', cap: cap() }, { u: 'c', v: 't', cap: cap() }, { u: 'd', v: 't', cap: cap() }];
    arcs.push(rng.bool() ? { u: 'a', v: 'd', cap: cap(), t: 0.3 } : { u: 'b', v: 'c', cap: cap(), t: 0.3 });
    if (level >= 2) arcs.push(rng.bool() ? { u: 'c', v: 'd', cap: cap() } : { u: 'd', v: 'c', cap: cap() });
    const r = edmondsKarp(nodes, arcs, 's', 't');
    if (r.augmentations.length < 2) continue;
    const stop = level === 1 || rng.bool(0.5) ? r.augmentations.length : rng.int(1, r.augmentations.length - 1);
    const flow = stop === r.augmentations.length ? r.flow.map((v) => v.toString()) : r.augmentations[stop - 1].flow.map((v) => v.toString());
    let S;
    if (stop === r.augmentations.length && rng.bool(0.6)) S = r.S.slice();
    else { const k = rng.int(1, 3); S = ['s'].concat(rng.shuffle(['a', 'b', 'c', 'd']).slice(0, k)).sort((p, q) => nodes.indexOf(p) - nodes.indexOf(q)); }
    const inS = new Set(S);
    if (level >= 2 && !arcs.some((a) => !inS.has(a.u) && inS.has(a.v)) && rng.bool(0.7)) continue;
    return { nodes, arcs, flow, S, layout: 'six' };
  }
  return null;
}

export const cutDrill = {
  id: 'cutcheck', title: 'Flows, cuts and the min-cut program', topic: 't106', minutes: 6,
  blurb: 'Value of a flow, capacity of a cut, what the pair proves, and the same cut written as a solution of the min-cut integer program.',
  presets: [{ id: 'slides', label: 'Four-vertex network (slides 106)', make: () => ({ nodes: ['s', 'a', 'b', 't'], arcs: [{ u: 's', v: 'a', cap: 3 }, { u: 's', v: 'b', cap: 2 }, { u: 'a', v: 'b', cap: 1 }, { u: 'a', v: 't', cap: 2 }, { u: 'b', v: 't', cap: 3 }], flow: [3, 2, 1, 2, 3], S: ['s', 'a'], layout: 'four', title: 'Flows and cuts — four-vertex network (slides 106)' }) }],
  random: (rng, level) => ({ ...(randomCut(rng, level) || cutDrill.presets[0].make()), title: 'Flows and cuts — practice' }),
  build: buildCut,
};
