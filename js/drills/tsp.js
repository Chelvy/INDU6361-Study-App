// TSP trainers (slides 201-203): cycle covers and subtour rows, row generation, fractional separation, MTZ.
import { Frac, ZERO, ONE } from '../math/frac.js';
import { cyclesFromSuccessor, subtourRowCount, outflow, internal, rowGeneration, separateSubtour, mtzPositions } from '../math/tsp.js';
import { graphFigure, matrixTable, circleLayout } from '../viz.js';
import { setText, dataTable, frag, ul } from './common.js';

const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const ids = (n) => Array.from({ length: n }, (_, i) => String(i + 1));
const succFromCycles = (n, cycles) => { const s = new Array(n + 1).fill(0); cycles.forEach((c) => c.forEach((v, k) => { s[v] = c[(k + 1) % c.length]; })); return s; };
const shortest = (cycles) => cycles.slice().sort((a, b) => a.length - b.length || Math.min(...a) - Math.min(...b))[0];
const arrow = (c) => c.concat([c[0]]).join(' → ');

function randomCycles(rng, n, k) {
  // split 1..n into k cycles, each of length >= 2
  for (let t = 0; t < 200; t++) {
    const perm = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1));
    const cuts = rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, k - 1).sort((a, b) => a - b);
    const parts = []; let prev = 0;
    cuts.concat([n]).forEach((c) => { parts.push(perm.slice(prev, c)); prev = c; });
    if (parts.every((p) => p.length >= 2)) return parts;
  }
  return [[1, 2, 3], Array.from({ length: n - 3 }, (_, i) => i + 4)];
}

// ---------------------------------------------------------------- cycle covers and subtour rows
function buildSubtours(inst) {
  const { n, succ } = inst;
  const cycles = cyclesFromSuccessor(succ);
  const S = shortest(cycles).slice().sort((a, b) => a - b);
  const nodes = ids(n);
  const pos = circleLayout(nodes);
  const inS = new Set(S);
  const fig = (hl) => graphFigure({
    nodes, pos, directed: true,
    edges: nodes.map((v) => ({ u: v, v: String(succ[Number(v)]), cls: hl && inS.has(Number(v)) ? 'hl' : 'sel' })),
    nodeCls: hl ? Object.fromEntries(nodes.map((v) => [v, inS.has(Number(v)) ? 'settled' : ''])) : null,
    caption: hl ? `Orange: the arcs inside S = ${setText(S)}.` : 'Arcs with x = 1.', height: 300,
  });
  const k = S.length;
  return {
    id: 'subtours', topic: 't201', title: inst.title || 'Cycle covers and subtour elimination rows',
    statement: () => frag(
      `A directed TSP on $n=${n}$ vertices is solved with the <b>degree constraints only</b> (one arc out of and one arc into every vertex). The solver returns $x_{ij}=1$ on these arcs:`,
      dataTable(['From $i$'].concat(nodes), [['To $j$'].concat(nodes.map((v) => succ[Number(v)]))], 'compact'),
      fig(false),
    ),
    rules: 'List a cycle starting from its smallest vertex. $S$ denotes the vertex set of the shortest cycle (ties: the one containing the smallest vertex).',
    steps: [
      {
        title: 'Read the solution',
        fields: [
          { type: 'int', label: 'Number of cycles', answer: cycles.length },
          { type: 'seq', label: 'The cycle through vertex 1, starting at 1', answer: cycles[0].map(String), placeholder: 'e.g. 1 - 4 - 2' },
          { type: 'choice', label: 'Is this a feasible tour?', options: YN, answer: cycles.length === 1 ? 'yes' : 'no' },
        ],
        explain: `Follow successors: ${cycles.map(arrow).join(';&nbsp; ')}. ${cycles.length} cycles: the degree constraints describe a <b>cycle cover</b> (an assignment), not a tour.`,
      },
      {
        title: `The subtour row for S = ${setText(S)}`,
        text: `Two equivalent ways to forbid the subtour on $S=${'\\{'}${S.join(',')}${'\\}'}$: $\\ \\sum_{i\\in S}\\sum_{j\\in S,\\,j\\ne i}x_{ij}\\le |S|-1\\ $ and $\\ \\sum_{i\\in S}\\sum_{j\\notin S}x_{ij}\\ge 1$.`,
        fields: [
          { type: 'int', label: 'Right-hand side $|S|-1$', answer: k - 1 },
          { type: 'int', label: 'Left-hand side of the first form at the current solution', answer: k },
          { type: 'int', label: 'Number of variables $x_{ij}$ in the first form', answer: k * (k - 1), mis: [{ value: k, msg: 'The row contains every arc with both ends in $S$, not only the arcs of the current cycle.' }, { value: (k * (k - 1)) / 2, msg: 'The graph is directed: both $x_{ij}$ and $x_{ji}$ appear.' }].filter((m) => m.value !== k * (k - 1)) },
          { type: 'int', label: 'Number of variables in the cutset form (arcs leaving $S$)', answer: k * (n - k) },
          { type: 'int', label: 'Left-hand side of the cutset form at the current solution', answer: 0 },
        ],
        explain: () => frag(`The cycle uses $|S|=${k}$ arcs inside $S$, one more than the allowed $${k - 1}$, and no arc leaves $S$ ($0\\lt 1$): both forms are violated. The first form sums over all ${k}·${k - 1} = ${k * (k - 1)} ordered pairs in $S$; the cutset form over ${k}·${n - k} = ${k * (n - k)} arcs from $S$ to its complement. Given the degree equations the two forms are equivalent, because $x(E(S))+x(\\delta^+(S))=|S|$.`, fig(true)),
      },
      {
        title: 'Size of the formulations',
        fields: [
          { type: 'int', label: `Subtour rows needed in total for $n=${n}$ (sets with $2\\le|S|\\le n-1$)`, answer: subtourRowCount(n), mis: [{ value: 2 ** n, msg: 'Remove the empty set, the full set and the $n$ singletons.' }, { value: 2 ** n - 2, msg: 'Singletons give no useful row: also remove the $n$ sets of size 1.' }] },
          { type: 'int', label: `MTZ rows for the same $n$ (ordered pairs $i\\ne j$, both different from vertex 1)`, answer: (n - 1) * (n - 2) },
        ],
        explain: `$2^n-n-2=${subtourRowCount(n)}$ subset rows against $(n-1)(n-2)=${(n - 1) * (n - 2)}$ MTZ rows. The subset formulation is exponential but much stronger: on the 10-vertex lecture instance its LP bound equals the optimum 359.81, while the MTZ root bound is 282.47 (a 21.5% gap). Slides 201 list $n=10$: 1,012 rows; $n=20$: 1,048,554; $n=30$: 1,073,741,792.`,
      },
    ],
    wrapup: 'Degree constraints alone give an assignment problem (integral, easy) whose solutions may split into subtours. Subtour rows are too many to write down, which is why they are generated only when violated.',
  };
}

export const subtourDrill = {
  id: 'subtours', title: 'Cycle covers and subtour rows', topic: 't201', minutes: 5,
  blurb: 'Read the cycles of a degree-constrained solution, write the violated subtour row in both forms, and count rows.',
  presets: [{ id: 'six', label: 'Six vertices, two triangles', make: () => ({ n: 6, succ: succFromCycles(6, [[1, 3, 5], [2, 6, 4]]), title: 'Subtour rows — six vertices' }) }],
  random: (rng, level) => {
    const n = level === 1 ? 6 : level === 2 ? rng.int(7, 8) : rng.int(8, 9);
    const k = level === 3 ? 3 : rng.pick([2, 2, 3]);
    return { n, succ: succFromCycles(n, randomCycles(rng, n, k)), title: 'Subtour rows — practice' };
  },
  build: buildSubtours,
};

// ---------------------------------------------------------------- row generation
function buildRowGen(inst) {
  const { cost, pts } = inst;
  const n = cost.length - 1;
  const rg = rowGeneration(cost);
  if (rg.status !== 'optimal') throw new Error('Row generation did not finish on this instance.');
  const nodes = ids(n);
  const pos = pts ? Object.fromEntries(nodes.map((v) => [v, pts[Number(v) - 1]])) : circleLayout(nodes);
  const fig = (h, S) => {
    const inS = new Set(S || []);
    return graphFigure({ nodes, pos, directed: true, edges: nodes.map((v) => ({ u: v, v: String(h.succ[Number(v)]), label: cost[Number(v)][h.succ[Number(v)]], cls: inS.has(Number(v)) ? 'hl' : 'sel' })), caption: `Master solution, cost ${h.objective}`, height: 290 });
  };
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? '–' : cost[i + 1][j + 1])));
  const steps = rg.history.map((h, k) => {
    const isTour = h.cycles.length === 1;
    const fields = [
      { type: 'int', label: 'Number of cycles in this solution', answer: h.cycles.length },
      { type: 'choice', label: 'Is it a tour?', options: YN, answer: isTour ? 'yes' : 'no' },
    ];
    if (!isTour) {
      fields.push({ type: 'set', label: 'Vertex set $S$ of the row to add', answer: h.added.map(String), placeholder: 'e.g. 2, 5' });
      fields.push({ type: 'int', label: 'Its right-hand side in the form $x(S)\\le |S|-1$', answer: h.added.length - 1 });
    }
    return {
      title: `Master solve ${k + 1}`,
      text: () => frag(
        k === 0 ? 'The master contains the degree constraints only.' : `Rows added so far: ${rg.rows.slice(0, k).map((S) => `$x(${'\\{'}${S.join(',')}${'\\}'})\\le ${S.length - 1}$`).join(', ')}.`,
        fig(h),
        `Optimal master solution: ${nodes.map((v) => `${v}→${h.succ[Number(v)]}`).join(', ')} with objective <b>${h.objective}</b>.`,
      ),
      fields,
      explain: () => frag(
        `Cycles: ${h.cycles.map(arrow).join(';&nbsp; ')}.`,
        isTour ? ' A single cycle through all vertices: the separation routine finds no violated row.' : ` Not a tour. The shortest cycle is on $S=${'\\{'}${h.added.join(',')}${'\\}'}$, so add $x(S)\\le ${h.added.length - 1}$; the current solution has $x(S)=${h.added.length}$.`,
        k > 0 ? ` The objective went from ${rg.history[k - 1].objective} to ${h.objective}: adding a row can only keep or raise the optimum of a minimisation master.` : '',
        isTour ? null : fig(h, h.added),
      ),
    };
  });
  steps.push({
    title: 'Why the last solution is optimal',
    fields: [
      { type: 'num', label: 'Length of the optimal tour', answer: rg.cost },
      { type: 'int', label: 'Subtour rows that were generated', answer: rg.rows.length },
      { type: 'int', label: `Subtour rows in the full formulation for $n=${n}$`, answer: subtourRowCount(n) },
      { type: 'choice', stack: true, label: 'Why is the final tour optimal for the full problem?', answer: 'relax', options: [
        { value: 'relax', label: 'Every tour is feasible for the master, so the master optimum is a lower bound; this optimum is itself a tour, so it attains the bound.' },
        { value: 'all', label: 'Because by the end every subtour row has been added to the master.' },
        { value: 'heur', label: 'It is only the best tour found; optimality would need the remaining rows.' },
        { value: 'lp', label: 'Because the LP relaxation of the master is integral.' },
      ], mis: { all: `Only ${rg.rows.length} of ${subtourRowCount(n)} rows were added.`, heur: 'No: a relaxation whose optimum is feasible for the original problem solves the original problem.' } },
    ],
    explain: `The master's feasible set contains every tour (it is a relaxation), so $z_M\\le z^*$. Its optimal solution satisfies all omitted rows, so it is feasible for the full problem and $z_M\\ge z^*$. Hence $z^*=${rg.cost}$ with only ${rg.rows.length} of the ${subtourRowCount(n)} rows. Termination is guaranteed because there are finitely many cycle covers and each added row removes the current one.`,
  });
  return {
    id: 'rowgen', topic: 't202', title: inst.title || 'Row generation for the TSP',
    statement: () => frag(`Directed TSP on $n=${n}$ vertices with the cost matrix below. Solve it by row generation: start from the degree constraints and add one subtour row per iteration.`, matrixTable(M, { rowHeads: nodes, colHeads: nodes, corner: '$c_{ij}$' })),
    rules: 'After each master solve, add the row $x(S)\\le|S|-1$ of the <b>shortest</b> cycle (ties: the cycle containing the smallest vertex). The master solutions are given; you do the separation.',
    steps,
    wrapup: 'Exact row generation needs two things: a master that is a relaxation of the full model, and a separation routine that never misses a violated row when the candidate is infeasible.',
  };
}

function randomRowGen(rng, level) {
  const n = level === 1 ? 5 : 6;
  for (let t = 0; t < 600; t++) {
    // two or three clusters of points, so that subtours are attractive
    const centres = rng.shuffle([[0.4, 0.4], [3, 0.5], [1.6, 2.2], [3.1, 2.3], [0.3, 2.1]]).slice(0, level === 3 ? 3 : 2);
    const pts = Array.from({ length: n }, (_, i) => { const c = centres[i % centres.length]; return [c[0] + rng.int(-3, 3) / 10, c[1] + rng.int(-3, 3) / 10]; });
    const cost = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (i !== j) cost[i][j] = Math.max(1, Math.round(10 * Math.hypot(pts[i - 1][0] - pts[j - 1][0], pts[i - 1][1] - pts[j - 1][1])) + (level >= 2 ? rng.int(0, 2) : 0));
    let distinct = true;
    for (let i = 0; i < n && distinct; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 0.25) { distinct = false; break; }
    if (!distinct) continue;
    const rg = rowGeneration(cost);
    if (rg.status !== 'optimal') continue;
    const k = rg.history.length;
    if (k < 2 || k > (level === 1 ? 3 : 4)) continue;
    return { cost, pts };
  }
  return null;
}

const RG_PRESET = () => {
  const pts = [[0.3, 0.3], [0.9, 0.2], [0.5, 0.9], [3.0, 2.0], [3.6, 2.2], [3.2, 2.8]];
  const n = 6;
  const cost = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (i !== j) cost[i][j] = Math.round(10 * Math.hypot(pts[i - 1][0] - pts[j - 1][0], pts[i - 1][1] - pts[j - 1][1]));
  return { cost, pts, title: 'Row generation — two clusters of three' };
};

export const rowGenDrill = {
  id: 'rowgen', title: 'Row generation for the TSP', topic: 't202', minutes: 8,
  blurb: 'Separate integer master solutions: find the cycles, add the violated row, and argue why the final tour is optimal.',
  presets: [{ id: 'clusters', label: 'Two clusters of three vertices', make: RG_PRESET }],
  random: (rng, level) => ({ ...(randomRowGen(rng, level) || RG_PRESET()), title: 'Row generation — practice' }),
  build: buildRowGen,
};

// ---------------------------------------------------------------- fractional separation
function fracPoint(n, tour, cover, lam) {
  const L = Frac.parse(String(lam));
  const x = Array.from({ length: n + 1 }, () => Array.from({ length: n + 1 }, () => ZERO));
  tour.forEach((v, k) => { const w = tour[(k + 1) % n]; x[v][w] = x[v][w].add(ONE.sub(L)); });
  cover.forEach((c) => c.forEach((v, k) => { const w = c[(k + 1) % c.length]; x[v][w] = x[v][w].add(L); }));
  return x;
}

function buildFracSep(inst) {
  const { n, tour, cover, lam, sets } = inst;
  const x = fracPoint(n, tour, cover, lam);
  const nodes = ids(n);
  const pos = circleLayout(nodes);
  const arcs = [];
  for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (i !== j && x[i][j].sign() > 0) arcs.push({ i, j, v: x[i][j] });
  const sep = separateSubtour(x, n, 1);
  const vals = sets.map((S) => outflow(x, S, n));
  const target = inst.target;
  const tcut = sep.perTarget.find((p) => p.t === target);
  const fig = (S) => {
    const inS = new Set(S || []);
    return graphFigure({
      nodes, pos, directed: true, height: 320,
      edges: arcs.map((a) => ({ u: String(a.i), v: String(a.j), label: a.v.toString(), cls: S && inS.has(a.i) && !inS.has(a.j) ? 'hl' : a.v.eq(ONE) ? 'sel' : '' })),
      nodeCls: S ? Object.fromEntries(nodes.map((v) => [v, inS.has(Number(v)) ? 'settled' : ''])) : null,
      caption: S ? `Orange: arcs leaving S = ${setText(S)}.` : 'Arc labels: the fractional values of x.',
    });
  };
  const best = sep.best;
  return {
    id: 'fracsep', topic: 't203', title: inst.title || 'Separating a fractional point',
    statement: () => frag(
      `The LP relaxation of a directed TSP on $n=${n}$ vertices (degree equations plus the subtour rows found so far) has this optimal solution $\\bar x$; arcs not listed are $0$.`,
      dataTable(['Arc'].concat(arcs.map((a) => `${a.i}→${a.j}`)), [['$\\bar x_{ij}$'].concat(arcs.map((a) => a.v.toString()))], 'compact'),
      fig(null),
    ),
    rules: 'Use the cutset form $x(\\delta^+(S))=\\sum_{i\\in S,\\ j\\notin S}x_{ij}\\ge 1$. A row is violated when its left-hand side is below 1.',
    steps: [
      {
        title: 'Evaluate candidate sets',
        fields: [{
          type: 'table', label: 'For each set: the value of $\\bar x(\\delta^+(S))$ and whether the row is violated', corner: '$S$',
          columns: [{ key: 'v', head: '$\\bar x(\\delta^+(S))$', kind: 'num', plain: 'outflow' }, { key: 'viol', head: 'Violated?', kind: 'choice', options: YN, plain: 'violated' }],
          rows: sets.map((S, k) => ({ head: `$${'\\{'}${S.join(',')}${'\\}'}$`, cells: { v: vals[k], viol: vals[k].lt(ONE) ? 'yes' : 'no' } })),
        }],
        explain: () => frag(ul(sets.map((S, k) => {
          const terms = arcs.filter((a) => S.includes(a.i) && !S.includes(a.j));
          return `$S=${'\\{'}${S.join(',')}${'\\}'}$: ${terms.length ? terms.map((a) => `$\\bar x_{${a.i}${a.j}}=${a.v.toLatex()}$`).join(' + ') : 'no arc leaves'} $=${vals[k].toLatex()}$ ${vals[k].lt(ONE) ? '<b>&lt; 1, violated</b>' : '≥ 1, satisfied'}.`;
        })), fig(sets[vals.findIndex((v) => v.lt(ONE)) >= 0 ? vals.findIndex((v) => v.lt(ONE)) : 0])),
      },
      {
        title: 'Separation as a minimum cut',
        text: `Treat $\\bar x_{ij}$ as arc capacities, fix the root $r=1$ and compute, for a target $t$, the minimum capacity of a cut separating $1$ from $t$.`,
        fields: [
          { type: 'num', label: `Minimum $1$–$${target}$ cut value`, answer: tcut.capacity },
          { type: 'num', label: 'Smallest cut value over all targets $t\\ne 1$', answer: best.capacity },
          { type: 'num', label: 'Violation $1-\\bar x(\\delta^+(S))$ of the most violated row', answer: sep.violated ? ONE.sub(best.capacity) : 0 },
          { type: 'num', label: 'For that set $S$: the value of $\\bar x(E(S))$, the arcs inside $S$', answer: internal(x, best.S) },
        ],
        explain: `A set $S\\ni 1$ with $t\\notin S$ has $\\bar x(\\delta^+(S))$ equal to the capacity of the cut, so the most violated row is a minimum cut. For $t=${target}$ the minimum is $${tcut.capacity.toLatex()}$ with $S=${'\\{'}${tcut.S.join(',')}${'\\}'}$. Over all targets the smallest value is $${best.capacity.toLatex()}$ at $S=${'\\{'}${best.S.join(',')}${'\\}'}$: ${sep.violated ? `violated by $${ONE.sub(best.capacity).toLatex()}$` : 'no subtour row is violated'}. With the degree equations, $\\bar x(E(S))=|S|-\\bar x(\\delta^+(S))=${best.S.length}-${best.capacity.toLatex()}=${internal(x, best.S).toLatex()}$, to be compared with $|S|-1=${best.S.length - 1}$. One root is enough because the complement of a violated set is violated too.`,
      },
      {
        title: 'How the row enters the solver',
        fields: [{ type: 'choice', stack: true, label: 'This row was found at a <b>fractional</b> LP solution. Which statement is correct?', answer: 'user', options: [
          { value: 'user', label: 'It is added as a user cut: it tightens the relaxation, but correctness must still be ensured by lazy constraints checked on integer candidates.' },
          { value: 'lazyonly', label: 'Fractional separation alone guarantees that every incumbent is a tour, so no lazy constraint is needed.' },
          { value: 'invalid', label: 'It cannot be added: cuts may only be generated from integer solutions.' },
        ], mis: { lazyonly: 'The solver is not obliged to call the user-cut callback at every node, and heuristics can produce integer candidates directly.', invalid: 'Any valid inequality may be added to cut off a fractional point; that is the purpose of a cutting plane.' } }],
        explain: 'Lazy constraints are part of the definition of the feasible set and are checked whenever an integer candidate appears. User cuts only strengthen the LP relaxation; the solver may ignore the callback, so they cannot replace the lazy constraints.',
      },
    ],
    wrapup: 'Integer candidates are separated by finding connected components; fractional points need a minimum cut. Adding subtour rows at fractional points raises the bound faster, but it does not always close the gap (the 20-vertex lecture instance keeps a 0.86% gap).',
  };
}

function randomFracSep(rng, level) {
  const n = level === 1 ? 5 : 6;
  for (let t = 0; t < 400; t++) {
    const cover = randomCycles(rng, n, 2).map((c) => c.slice());
    const A = cover.find((c) => !c.includes(1));
    const B = cover.find((c) => c.includes(1));
    // tour that leaves each part exactly once: all of B (starting at 1) then all of A
    const tourB = [1].concat(rng.shuffle(B.filter((v) => v !== 1)));
    const tour = tourB.concat(rng.shuffle(A));
    const lam = level === 1 ? '1/2' : rng.pick(['1/2', '2/3', '1/3', '3/4']);
    const x = fracPoint(n, tour, cover, lam);
    const sep = separateSubtour(x, n, 1);
    if (!sep.violated) continue;
    const Bs = B.slice().sort((p, q) => p - q), As = A.slice().sort((p, q) => p - q);
    const other = [1, rng.pick(A)].sort((p, q) => p - q);
    const third = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1)).slice(0, 2).sort((p, q) => p - q);
    const sets = [third, As, other].filter((S, i, arr) => arr.findIndex((T) => T.join() === S.join()) === i && S.join() !== Bs.join());
    if (sets.length < 3) continue;
    return { n, tour, cover, lam, sets: rng.shuffle(sets), target: A[0] };
  }
  return { n: 6, tour: [1, 2, 3, 4, 5, 6], cover: [[1, 3, 2], [4, 6, 5]], lam: '1/2', sets: [[1, 4], [4, 5, 6], [2, 3]], target: 4 };
}

export const fracSepDrill = {
  id: 'fracsep', title: 'Separating a fractional point', topic: 't203', minutes: 7,
  blurb: 'Evaluate cutset rows at a fractional TSP solution, find the most violated one as a minimum cut, and place it correctly in branch-and-cut.',
  presets: [{ id: 'half', label: 'Half tour, half two triangles', make: () => ({ n: 6, tour: [1, 2, 3, 4, 5, 6], cover: [[1, 3, 2], [4, 6, 5]], lam: '1/2', sets: [[1, 4], [4, 5, 6], [2, 3]], target: 4, title: 'Fractional separation — worked example' }) }],
  random: (rng, level) => ({ ...randomFracSep(rng, level), title: 'Fractional separation — practice' }),
  build: buildFracSep,
};

// ---------------------------------------------------------------- MTZ
function buildMtz(inst) {
  const { n, order, sub, pair } = inst;
  const u = mtzPositions(order);
  const others = Array.from({ length: n - 1 }, (_, i) => i + 2);
  const idx = order.findIndex((v, k) => k > 0 && k < n - 1);
  const i1 = order[idx], j1 = order[idx + 1];
  const [p, q] = pair; // not consecutive on the tour, both != 1
  const k = sub.length;
  return {
    id: 'mtz', topic: 't201', title: inst.title || 'Miller–Tucker–Zemlin constraints',
    statement: () => frag(
      `Directed TSP on $n=${n}$ vertices with the MTZ constraints $$u_i-u_j+(n-1)\\,x_{ij}\\le n-2\\qquad\\text{for all } i\\ne j,\\ i,j\\ne 1,\\qquad 2\\le u_i\\le n .$$`,
      `Consider the tour <b>${order.concat([1]).join(' → ')}</b>.`,
    ),
    rules: 'Take $u_i$ = position of vertex $i$ in the tour, with vertex 1 in position 1.',
    steps: [
      {
        title: 'Order variables of the tour',
        fields: [{ type: 'table', label: 'Position variables', columns: others.map((v) => ({ key: `u${v}`, head: `$u_{${v}}$`, kind: 'num', plain: `u${v}` })), rows: [{ cells: Object.fromEntries(others.map((v) => [`u${v}`, u[v]])) }] }],
        explain: `Vertex 1 is first; the next vertices get $2,3,\\dots,n$ along the tour: ${order.slice(1).map((v) => `$u_{${v}}=${u[v]}$`).join(', ')}.`,
      },
      {
        title: 'Check two rows',
        text: `Evaluate the left-hand side $u_i-u_j+(n-1)x_{ij}$ for an arc that the tour uses and for a pair it does not use. The right-hand side is $n-2=${n - 2}$.`,
        fields: [
          { type: 'num', label: `Arc $(${i1},${j1})$, used: left-hand side`, answer: u[i1] - u[j1] + (n - 1) },
          { type: 'num', label: `Pair $(${p},${q})$, not used: left-hand side`, answer: u[p] - u[q] },
          { type: 'choice', label: 'Are both rows satisfied?', options: YN, answer: 'yes' },
        ],
        explain: `Used arc: $u_{${i1}}-u_{${j1}}+(n-1)=${u[i1]}-${u[j1]}+${n - 1}=${n - 2}$, tight. Unused pair: $u_{${p}}-u_{${q}}=${u[p] - u[q]}\\le ${n - 2}$, which always holds because the $u$ values lie between 2 and $n$. So $M=n-1$ is exactly what makes the row inactive when $x_{ij}=0$.`,
      },
      {
        title: 'Why a subtour is impossible',
        text: `Suppose a solution contained the cycle ${arrow(sub)}, which does not pass through vertex 1. Add up the MTZ rows of its ${k} arcs.`,
        fields: [
          { type: 'num', label: 'Sum of the left-hand sides', answer: k * (n - 1) },
          { type: 'num', label: 'Sum of the right-hand sides', answer: k * (n - 2) },
          { type: 'choice', stack: true, label: 'Conclusion', answer: 'contra', options: [
            { value: 'contra', label: 'The sum of the rows is violated, so at least one row is violated: no cycle can avoid vertex 1.' },
            { value: 'ok', label: 'The rows can all hold if the $u$ values are chosen suitably.' },
            { value: 'need', label: 'MTZ rows are also needed for arcs through vertex 1 to exclude this cycle.' },
          ] },
        ],
        explain: `Around a cycle the $u$ terms cancel: $\\sum(u_i-u_j)=0$. With $x=1$ on its ${k} arcs the left-hand sides add to $${k}(n-1)=${k * (n - 1)}$, the right-hand sides to $${k}(n-2)=${k * (n - 2)}$: impossible. The tour itself is not excluded because the arcs entering and leaving vertex 1 have no MTZ row.`,
      },
      {
        title: 'Size and strength',
        fields: [
          { type: 'int', label: 'Number of $u$ variables', answer: n - 1 },
          { type: 'int', label: 'Number of MTZ rows', answer: (n - 1) * (n - 2) },
          { type: 'choice', stack: true, label: 'Compared with the cutset (subtour) formulation, the MTZ formulation is', answer: 'weak', options: [
            { value: 'weak', label: 'compact (polynomial size) but has a weaker LP relaxation.' },
            { value: 'strong', label: 'compact and has a stronger LP relaxation.' },
            { value: 'same', label: 'exponential and equally strong.' },
          ] },
        ],
        explain: `$n-1=${n - 1}$ extra variables and $(n-1)(n-2)=${(n - 1) * (n - 2)}$ rows: $O(n^2)$. The big-M coefficient $(n-1)$ makes the LP relaxation weak: on the 10-vertex lecture instance the MTZ root bound is 282.47 against the optimum 359.81 (21.5%), while the multicommodity-flow and cutset formulations give 359.81.`,
      },
    ],
    wrapup: 'MTZ trades strength for size. It is a valid formulation you can type in directly; the cutset formulation needs row generation but gives far better bounds.',
  };
}

function randomMtz(rng, level) {
  const n = level === 1 ? 5 : rng.int(6, 7);
  const order = [1].concat(rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 2)));
  const pos = Object.fromEntries(order.map((v, k) => [v, k]));
  const cand = [];
  for (let i = 2; i <= n; i++) for (let j = 2; j <= n; j++) if (i !== j && pos[j] !== pos[i] + 1) cand.push([i, j]);
  const sub = rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 2)).slice(0, level === 1 ? 2 : rng.int(2, 3));
  return { n, order, sub, pair: rng.pick(cand) };
}

export const mtzDrill = {
  id: 'mtz', title: 'MTZ constraints', topic: 't201', minutes: 6,
  blurb: 'Position variables of a tour, tight and slack rows, the cancellation argument against subtours, and the size/strength trade-off.',
  presets: [{ id: 'five', label: 'Five vertices', make: () => ({ n: 5, order: [1, 3, 2, 5, 4], sub: [2, 4, 5], pair: [5, 3], title: 'MTZ constraints — five vertices' }) }],
  random: (rng, level) => ({ ...randomMtz(rng, level), title: 'MTZ constraints — practice' }),
  build: buildMtz,
};
