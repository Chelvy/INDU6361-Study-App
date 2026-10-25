// TSP trainers (slides 201-203, extra slides 202, sheet 20E): cycle covers and subtour rows, row generation,
// fractional separation, MTZ.
import { Frac, ZERO, ONE } from '../math/frac.js';
import { cyclesFromSuccessor, subtourRowCount, outflow, internal, rowGeneration, separateSubtour, mtzPositions } from '../math/tsp.js';
import { graphFigure, matrixTable, circleLayout } from '../viz.js';
import { setText, dataTable, frag, ul } from './common.js';

const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const ids = (n) => Array.from({ length: n }, (_, i) => String(i + 1));
const succFromCycles = (n, cycles) => { const s = new Array(n + 1).fill(0); cycles.forEach((c) => c.forEach((v, k) => { s[v] = c[(k + 1) % c.length]; })); return s; };
const shortest = (cycles) => cycles.slice().sort((a, b) => a.length - b.length || Math.min(...a) - Math.min(...b))[0];
const arrow = (c) => c.concat([c[0]]).join(' → ');
const setTex = (S) => `${'\\{'}${S.join(',')}${'\\}'}`;
// Positions for graphFigure: an explicit map, or plotted coordinates (y upwards, as in the slides' figures).
const layout = (inst, nodes) => inst.pos || (inst.pts ? Object.fromEntries(nodes.map((v) => [v, [inst.pts[Number(v) - 1][0], -inst.pts[Number(v) - 1][1]]])) : circleLayout(nodes));

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
// Sheet 20E, exercise 3: a set S gives a violated row exactly when no selected arc leaves it, that is when S
// contains every cycle completely or not at all. With r cycles: 2^r - 2 such sets (empty set and V excluded).
function unionsStep(cycles, n) {
  const r = cycles.length;
  const sorted = cycles.map((c) => c.slice().sort((a, b) => a - b));
  const unions = [];
  for (let mask = 1; mask < (1 << r) - 1; mask++) unions.push(sorted.filter((_, i) => mask & (1 << i)).flat().sort((a, b) => a - b));
  const count = unions.length;
  const fields = [{
    type: 'int', label: 'How many nonempty proper subsets $S$ give a violated subtour row at this solution?', answer: count,
    mis: [{ value: r, msg: 'Unions of whole cycles are violated too: no selected arc leaves them either.' }, { value: 2 ** r, msg: 'Leave out the empty set and the full set $V$: they are not proper subsets.' }, { value: 2 ** r - 1, msg: 'Leave out both the empty set and the full set $V$.' }].filter((m) => m.value !== count),
  }];
  let options = null;
  if (r <= 3) {
    // three sets that split a cycle (never violated), to mix with the 2^r - 2 violated ones
    const splits = [
      sorted[0].slice(0, -1),
      sorted[1].concat([sorted[(2 % r)][0]]).sort((a, b) => a - b),
      sorted.map((c) => c[0]).sort((a, b) => a - b),
    ];
    const key = (S) => S.join(',');
    const all = unions.map((S) => ({ S, viol: true })).concat(splits.filter((S, i, arr) => arr.findIndex((T) => key(T) === key(S)) === i && !unions.some((U) => key(U) === key(S))).map((S) => ({ S, viol: false })));
    all.sort((a, b) => a.S.length - b.S.length || key(a.S).localeCompare(key(b.S)));
    options = all.map((o) => ({ value: key(o.S), label: `$${setTex(o.S)}$`, viol: o.viol }));
    fields.push({ type: 'multi', label: 'Which of these sets give a violated row?', options: options.map(({ value, label }) => ({ value, label })), answer: options.filter((o) => o.viol).map((o) => o.value) });
  }
  const names = r <= 3 ? ['A', 'B', 'C'].slice(0, r) : null;
  return {
    title: 'Every violated subtour row',
    text: 'The separation routine returns one row per cycle. How many subsets $S$ are violated in total, unions of cycles included?',
    fields,
    explain: () => frag(
      `A row is violated exactly when no selected arc leaves $S$ (left-hand side of the cutset form $=0\\lt 1$). Every vertex has one selected outgoing arc, and that arc stays inside the vertex's cycle. So if $S$ contains part of a cycle but not all of it, some selected arc leaves $S$ and the row holds. A violated set must therefore contain <b>each cycle completely or not at all</b>.`,
      ` With $r=${r}$ cycles there are $2^${r}=${2 ** r}$ such choices; removing the empty set and $V$ leaves $2^r-2=${count}$ violated sets${names ? `: with ${names.map((nm, i) => `$${nm}=${setTex(sorted[i])}$`).join(', ')} they are ${unions.map((S) => `$${setTex(S)}$`).join(', ')}` : ''}.`,
      ` (Sheet 20E, exercise 3.) Under the degree equations the row of a union is equivalent to the row of the complementary cycles, so a usual integer separator returns only the $r$ cycle rows.`,
    ),
  };
}

function buildSubtours(inst) {
  const { n, succ } = inst;
  const cycles = cyclesFromSuccessor(succ);
  const given = inst.S ? inst.S.slice().sort((a, b) => a - b) : null;
  if (given && !cycles.some((c) => c.slice().sort((a, b) => a - b).join() === given.join())) throw new Error('The chosen set S must be one of the cycles.');
  const S = given || shortest(cycles).slice().sort((a, b) => a - b);
  const nodes = ids(n);
  const pos = layout(inst, nodes);
  const inS = new Set(S);
  const fig = (hl) => graphFigure({
    nodes, pos, directed: true,
    edges: nodes.map((v) => ({ u: v, v: String(succ[Number(v)]), cls: hl && inS.has(Number(v)) ? 'hl' : 'sel' })),
    nodeCls: hl ? Object.fromEntries(nodes.map((v) => [v, inS.has(Number(v)) ? 'settled' : ''])) : null,
    caption: hl ? `Orange: the arcs inside S = ${setText(S)}.` : 'Arcs with x = 1.', height: 300,
  });
  const k = S.length;
  const steps = [
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
      text: `Two equivalent ways to forbid the subtour on $S=${setTex(S)}$: $\\ \\sum_{i\\in S}\\sum_{j\\in S,\\,j\\ne i}x_{ij}\\le |S|-1\\ $ and $\\ \\sum_{i\\in S}\\sum_{j\\notin S}x_{ij}\\ge 1$.`,
      fields: [
        { type: 'int', label: 'Right-hand side $|S|-1$', answer: k - 1 },
        { type: 'int', label: 'Left-hand side of the first form at the current solution', answer: k },
        { type: 'int', label: 'Number of variables $x_{ij}$ in the first form', answer: k * (k - 1), mis: [{ value: k, msg: 'The row contains every arc with both ends in $S$, not only the arcs of the current cycle.' }, { value: (k * (k - 1)) / 2, msg: 'The graph is directed: both $x_{ij}$ and $x_{ji}$ appear.' }].filter((m) => m.value !== k * (k - 1)) },
        { type: 'int', label: 'Number of variables in the cutset form (arcs leaving $S$)', answer: k * (n - k) },
        { type: 'int', label: 'Left-hand side of the cutset form at the current solution', answer: 0 },
      ],
      explain: () => frag(`The cycle uses $|S|=${k}$ arcs inside $S$, one more than the allowed $${k - 1}$, and no arc leaves $S$ ($0\\lt 1$): both forms are violated. The first form sums over all ${k}·${k - 1} = ${k * (k - 1)} ordered pairs in $S$; the cutset form over ${k}·${n - k} = ${k * (n - k)} arcs from $S$ to its complement. Given the degree equations the two forms are equivalent, because $x(E(S))+x(\\delta^+(S))=|S|$.`, fig(true)),
    },
  ];
  if (inst.unions && cycles.length >= 2) steps.push(unionsStep(cycles, n));
  steps.push({
    title: 'Size of the formulations',
    fields: [
      { type: 'int', label: `Subtour rows needed in total for $n=${n}$ (sets with $2\\le|S|\\le n-1$)`, answer: subtourRowCount(n), mis: [{ value: 2 ** n, msg: 'Remove the empty set, the full set and the $n$ singletons.' }, { value: 2 ** n - 2, msg: 'Singletons give no useful row: also remove the $n$ sets of size 1.' }] },
      { type: 'int', label: `MTZ rows for the same $n$ (ordered pairs $i\\ne j$, both different from vertex 1)`, answer: (n - 1) * (n - 2) },
    ],
    explain: `$2^n-n-2=${subtourRowCount(n)}$ subset rows against $(n-1)(n-2)=${(n - 1) * (n - 2)}$ MTZ rows. The subset formulation is exponential, but its LP bound is never below the MTZ bound: its LP relaxation gives the same bound as the multicommodity-flow model (slides 201), and extra slides 202 prove that this bound is never below the MTZ bound. On the 10-vertex lecture instance it is much stronger: its LP bound equals the optimum 359.81, while the MTZ root bound is 282.47 (a 21.5% gap). Slides 201 list $n=10$: 1,012 rows; $n=20$: 1,048,554; $n=30$: 1,073,741,792.`,
  });
  return {
    id: 'subtours', topic: 't201', title: inst.title || 'Cycle covers and subtour elimination rows',
    statement: () => frag(
      `A directed TSP on $n=${n}$ vertices is solved with the <b>degree constraints only</b> (one arc out of and one arc into every vertex). The solver returns $x_{ij}=1$ on these arcs:`,
      dataTable(['From $i$'].concat(nodes), [['To $j$'].concat(nodes.map((v) => succ[Number(v)]))], 'compact'),
      inst.note || null,
      fig(false),
    ),
    rules: given
      ? `List a cycle starting from its smallest vertex. $S$ is the set highlighted on the slide, $S=${setTex(S)}$.`
      : 'List a cycle starting from its smallest vertex. $S$ denotes the vertex set of the shortest cycle (ties: the one containing the smallest vertex).',
    steps,
    wrapup: 'Degree constraints alone give an assignment problem (integral, easy) whose solutions may split into subtours. Subtour rows are too many to write down, which is why they are generated only when violated.',
  };
}

// Drawing positions after the figure of slides 201 ("Degree equations alone", "A disconnected subtour"): read
// approximately from the plot, with vertices 6, 9 and 10 spread out so that the circles do not overlap.
const PTS201 = [[0.21, 0.86], [0.70, 0.47], [0.40, 0.92], [0.62, 0.98], [0.94, 0.57], [0.18, 0.52], [0.94, 0.02], [0.69, 0.01], [0.06, 0.36], [0.30, 0.66]];

export const subtourDrill = {
  id: 'subtours', title: 'Cycle covers and subtour rows', topic: 't201', minutes: 5,
  blurb: 'Read the cycles of a degree-constrained solution, write the violated subtour row in both forms, count the violated sets, and count rows.',
  presets: [
    { id: 'slide202', label: 'Slides 202: two triangles', make: () => ({ n: 6, succ: succFromCycles(6, [[1, 2, 3], [4, 5, 6]]), title: 'Subtour rows — slides 202 example (two triangles)' }) },
    { id: '20e3', label: 'Sheet 20E, Exercise 3', make: () => ({ n: 9, succ: succFromCycles(9, [[1, 4, 7], [2, 8, 5, 9], [3, 6]]), unions: true, pos: { 1: [0.5, 0], 4: [1, 1.3], 7: [0, 1.3], 2: [2, 0], 8: [3, 0], 5: [3, 1.3], 9: [2, 1.3], 3: [4.2, 0.2], 6: [4.2, 1.1] }, title: 'Subtour rows — sheet 20E, exercise 3 (three cycles)' }) },
    { id: 'lecture10', label: 'Slides 201: ten vertices, degree equations only', make: () => ({ n: 10, succ: succFromCycles(10, [[1, 10], [2, 5], [3, 4], [6, 9], [7, 8]]), S: [2, 5], pts: PTS201, note: '<p>This is the solution of the degree equations alone on the ten-vertex lecture instance of slides 201 (five two-vertex subtours). The slides highlight $S=\\{2,5\\}$.</p>', title: 'Subtour rows — ten-vertex lecture instance (slides 201)' }) },
    { id: 'six', label: 'Six vertices, two triangles', make: () => ({ n: 6, succ: succFromCycles(6, [[1, 3, 5], [2, 6, 4]]), title: 'Subtour rows — six vertices' }) },
  ],
  random: (rng, level) => {
    const n = level === 1 ? 6 : level === 2 ? rng.int(7, 8) : rng.int(8, 9);
    const k = level === 3 ? 3 : rng.pick([2, 2, 3]);
    return { n, succ: succFromCycles(n, randomCycles(rng, n, k)), unions: level === 3, title: 'Subtour rows — practice' };
  },
  build: buildSubtours,
};

// ---------------------------------------------------------------- row generation
// A precomputed trace (successor lists of the master solves): the solver's own rule then picks each row.
function traceFrom(succLists, objectives) {
  const history = succLists.map((s, k) => {
    const succ = [0].concat(s.split(' ').map(Number));
    const cycles = cyclesFromSuccessor(succ);
    return { objective: objectives[k], succ, cycles, added: cycles.length > 1 ? shortest(cycles).slice().sort((a, b) => a - b) : null };
  });
  const last = history[history.length - 1];
  return { status: last.cycles.length === 1 ? 'optimal' : 'unfinished', history, rows: history.filter((h) => h.added).map((h) => h.added), cost: last.objective, tour: last.cycles[0] };
}

function buildRowGen(inst) {
  const { cost, pts } = inst;
  const n = cost.length - 1;
  const rg = inst.trace ? traceFrom(inst.trace.succ, inst.trace.objective) : rowGeneration(cost);
  if (rg.status !== 'optimal') throw new Error('Row generation did not finish on this instance.');
  const nodes = ids(n);
  const pos = inst.trace ? layout({ pts }, nodes) : pts ? Object.fromEntries(nodes.map((v) => [v, pts[Number(v) - 1]])) : circleLayout(nodes);
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
        k === 0 ? 'The master contains the degree constraints only.' : `Rows added so far: ${rg.rows.slice(0, k).map((S) => `$x(${setTex(S)})\\le ${S.length - 1}$`).join(', ')}.`,
        fig(h),
        `Optimal master solution: ${nodes.map((v) => `${v}→${h.succ[Number(v)]}`).join(', ')} with objective <b>${h.objective}</b>.`,
      ),
      fields,
      explain: () => frag(
        `Cycles: ${h.cycles.map(arrow).join(';&nbsp; ')}.`,
        isTour ? ' A single cycle through all vertices: the separation routine finds no violated row.' : ` Not a tour. The shortest cycle is on $S=${setTex(h.added)}$, so add $x(S)\\le ${h.added.length - 1}$; the current solution has $x(S)=${h.added.length}$.`,
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
    statement: () => frag(`Directed TSP on $n=${n}$ vertices with the cost matrix below. Solve it by row generation: start from the degree constraints and add one subtour row per iteration.`, inst.note || null, matrixTable(M, { rowHeads: nodes, colHeads: nodes, corner: '$c_{ij}$' })),
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

// The twelve-vertex instance of lab 202a and slides 202 ("One row at a time"): the instructor's generator
// (MersenneTwister(203), c_ij = 5 + 100 d_ij (1 + 0.3 sin(theta_ij + phi))), costs rounded to 2 decimals for display.
// The successor lists are the nine master optima; the objectives are the slides' values. Too slow to re-solve in
// the browser (enumerative master), so the trace is stored.
const LECTURE202 = {
  // The generator's coordinates are (0.5826, 0.2481) for vertex 6, (0.6496, 0.9046) for 7 and (0.5562, 0.2283) for 9;
  // these three are moved slightly apart below, only for drawing, so that the circles do not overlap.
  pts: [[0.5819, 0.4104], [0.4368, 0.8061], [0.0377, 0.8753], [0.6998, 0.9763], [0.3576, 0.2547], [0.62, 0.27], [0.63, 0.88], [0.484, 0.6597], [0.52, 0.21], [0.0112, 0.323], [0.6936, 0.1965], [0.8301, 0.8629]],
  cost: [
    [0, 59.65, 93.52, 78.72, 29.09, 16.46, 68.99, 39.7, 18.2, 63.62, 22.17, 68.4],
    [34.64, 0, 49.95, 39.73, 44.99, 45.39, 30.05, 15.8, 46.3, 57.76, 51.68, 44.03],
    [59.62, 41.06, 0, 70.94, 54.65, 66.36, 63.42, 45.53, 65.76, 44.22, 75.48, 79.09],
    [46.89, 32.91, 73.01, 0, 65.73, 58.07, 11.95, 35.32, 60.06, 84.89, 60.11, 18.16],
    [35.53, 76.44, 95, 104, 0, 25.96, 93.59, 58.57, 23.05, 44.41, 35.36, 97.04],
    [26, 79.95, 109.81, 99.44, 29.06, 0, 89.87, 60.01, 7.88, 68.29, 15.05, 87.84],
    [40.77, 26.84, 69.1, 15.56, 58.92, 52.11, 0, 28.37, 53.97, 78.13, 54.88, 21.21],
    [23.86, 24.97, 63.6, 51.32, 36.29, 34.63, 40.76, 0, 35.63, 56.01, 40.96, 49.02],
    [28.59, 81.71, 110.06, 102.28, 27.01, 8.73, 92.59, 61.86, 0, 66.4, 17.34, 91.12],
    [61.85, 81, 76.36, 114.95, 36.2, 56.97, 104.59, 70.07, 54.23, 0, 66.56, 114],
    [36.09, 90.62, 123.31, 105.86, 42.84, 19.43, 97.02, 70.72, 20.87, 82.25, 0, 91.78],
    [44.82, 45.45, 89.41, 26.4, 67.01, 54.71, 25.85, 41.26, 57.13, 92.18, 54.27, 0],
  ],
  trace: {
    objective: [330.19, 332.94, 334.79, 360.19, 360.56, 362.41, 364.46, 365.13, 367.21],
    succ: [
      '5 8 10 7 1 9 12 2 11 3 6 4', '5 8 10 7 9 11 12 2 6 3 1 4', '5 8 2 7 10 9 12 1 11 3 6 4',
      '11 3 2 12 10 9 8 7 6 5 1 4', '5 7 10 12 9 11 8 2 6 3 1 4', '5 7 2 12 10 9 8 1 11 3 6 4',
      '5 7 2 12 10 9 4 1 11 3 6 8', '6 3 2 7 10 9 8 12 11 5 1 4', '8 3 10 7 9 11 2 12 6 5 1 4',
    ],
  },
};

export const rowGenDrill = {
  id: 'rowgen', title: 'Row generation for the TSP', topic: 't202', minutes: 8,
  blurb: 'Separate integer master solutions: find the cycles, add the violated row, and argue why the final tour is optimal.',
  presets: [
    { id: 'lecture12', label: 'Slides 202: twelve vertices, nine solves', make: () => ({ cost: [new Array(13).fill(0)].concat(LECTURE202.cost.map((r) => [0].concat(r))), pts: LECTURE202.pts, trace: LECTURE202.trace, note: '<p>The twelve-vertex instance of lab 202a, run on slides 202 (“One row at a time”): nine master solves, eight rows, optimal tour 367.21. Costs are shown rounded to 2 decimals; the objectives are the slides’ values. Some cycles may be drawn in the opposite direction from the slides: on this instance both directions of a cycle cost the same (beyond the slides).</p>', title: 'Row generation — lecture instance (slides 202)' }) },
    { id: 'clusters', label: 'Two clusters of three vertices', make: RG_PRESET },
  ],
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
// A point given arc by arc: [[i, j, value], ...] (values as numbers or strings such as '0.8' or '1/2').
function fromArcs(n, list) {
  const x = Array.from({ length: n + 1 }, () => Array.from({ length: n + 1 }, () => ZERO));
  list.forEach(([i, j, v]) => { x[i][j] = x[i][j].add(Frac.parse(String(v))); });
  return x;
}
const num = (f) => (f.isTerminating() ? f.pretty() : f.toLatex()); // inside $...$

// Sheet 20E, exercise 2: the separation problem written as an integer program.
function separationIpStep(n, sep) {
  const best = sep.best;
  const inBest = new Set(best.S);
  const leaving = [];
  for (const i of best.S) for (let j = 1; j <= n; j++) if (!inBest.has(j)) leaving.push(`${i}${j}`);
  // "Recover the cut" (20E): which w_ij are forced to 1 — asked only when the list is short and unambiguous.
  const askW = n < 10 && leaving.length <= 6;
  return {
    title: 'The separation problem as an integer program',
    text: `Sheet 20E writes the search for the most violated row as an optimization problem. The values $\\bar x_{ij}$ are <b>data</b>; $z_i=1$ means $i\\in S$, and $w_{ij}$ marks the arcs that leave $S$: $$\\theta(\\bar x)=\\min\\ \\sum_{i\\ne j}\\bar x_{ij}w_{ij}\\quad\\text{s.t.}\\quad w_{ij}\\ge z_i-z_j\\ (i\\ne j),\\quad 1\\le\\sum_i z_i\\le n-1,\\quad z_i\\in\\{0,1\\},\\ 0\\le w_{ij}\\le 1.$$`,
    fields: [
      { type: 'choice', stack: true, label: 'Which constraint forces $w_{ij}=1$ on an arc that leaves $S$?', answer: 'out', options: [
        { value: 'out', label: '$w_{ij}\\ge z_i-z_j$: for $i\\in S$, $j\\notin S$ the right-hand side is $1$.' },
        { value: 'in', label: '$w_{ij}\\ge z_j-z_i$' },
        { value: 'both', label: '$w_{ij}\\ge z_i+z_j-1$' },
      ], mis: { in: 'That marks the arcs that ENTER $S$.', both: 'That marks the arcs with both ends in $S$ (internal arcs).' } },
      { type: 'choice', stack: true, label: 'Why is $1\\le\\sum_i z_i\\le n-1$ needed?', answer: 'proper', options: [
        { value: 'proper', label: 'Without it, $S=\\emptyset$ (all $z_i=0$) or $S=V$ gives the useless value 0.' },
        { value: 'root', label: 'It forces vertex 1 to be in $S$.' },
        { value: 'lp', label: 'It makes the separation problem a linear program.' },
      ], mis: { root: 'It does not mention vertex 1: it only excludes the empty set and the full set.', lp: 'The $z_i$ are still binary: it is an integer program.' } },
      ...(askW ? [{ type: 'set', label: `For $S=${setTex(best.S)}$ (that is $z_i=1$ exactly for $i\\in S$): the arcs whose $w_{ij}$ is forced to 1, written as <code>ij</code>`, answer: leaving, placeholder: `e.g. ${leaving[0]}, ...` }] : []),
      { type: 'num', label: 'Optimal value $\\theta(\\bar x)$', answer: best.capacity },
      { type: 'choice', label: 'Does $\\theta(\\bar x)$ show that a subtour row is violated?', options: YN, answer: best.capacity.lt(ONE) ? 'yes' : 'no' },
    ],
    explain: `On an arc with $z_i=1$, $z_j=0$ the constraint gives $w_{ij}\\ge 1$, so $w_{ij}=1$. Every other $w_{ij}$ can be $0$ at an optimum, because its cost $\\bar x_{ij}$ is nonnegative. So the objective is exactly $\\bar x(\\delta^+(S))$ for $S=\\{i:z_i=1\\}$, and $\\theta(\\bar x)$ is its smallest value over all nonempty proper $S$. Here $\\theta(\\bar x)=${num(best.capacity)}$, attained by $S=${setTex(best.S)}$ (and by its complement: under the degree equations a set and its complement have the same outflow).${askW ? ` For this $S$ the model forces $${leaving.map((a) => `w_{${a}}`).join('=')}=1$ and every other $w_{ij}$ can be $0$.` : ''} ${best.capacity.lt(ONE) ? `Since $\\theta\\lt 1$, return the row $\\sum_{i\\in S}\\sum_{j\\notin S}x_{ij}\\ge 1$.` : 'Since $\\theta\\ge 1$, no subtour row is violated.'} The minimum-cut computation of the next step solves this problem.`,
  };
}

function buildFracSep(inst) {
  const { n, sets } = inst;
  const x = inst.arcs ? fromArcs(n, inst.arcs) : fracPoint(n, inst.tour, inst.cover, inst.lam);
  const nodes = ids(n);
  const pos = layout(inst, nodes);
  const sub = (i, j) => (n >= 10 ? `${i},${j}` : `${i}${j}`);
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
      edges: arcs.map((a) => ({ u: String(a.i), v: String(a.j), label: a.v.pretty(), cls: S && inS.has(a.i) && !inS.has(a.j) ? 'hl' : a.v.eq(ONE) ? 'sel' : '' })),
      nodeCls: S ? Object.fromEntries(nodes.map((v) => [v, inS.has(Number(v)) ? 'settled' : ''])) : null,
      caption: S ? `Orange: arcs leaving S = ${setText(S)}.` : 'Arc labels: the fractional values of x.',
    });
  };
  const best = sep.best;
  const steps = [
    {
      title: 'Evaluate candidate sets',
      fields: [{
        type: 'table', label: 'For each set: the value of $\\bar x(\\delta^+(S))$ and whether the row is violated', corner: '$S$',
        columns: [{ key: 'v', head: '$\\bar x(\\delta^+(S))$', kind: 'num', plain: 'outflow' }, { key: 'viol', head: 'Violated?', kind: 'choice', options: YN, plain: 'violated' }],
        rows: sets.map((S, k) => ({ head: `$${setTex(S)}$`, cells: { v: vals[k], viol: vals[k].lt(ONE) ? 'yes' : 'no' } })),
      }],
      explain: () => frag(ul(sets.map((S, k) => {
        const terms = arcs.filter((a) => S.includes(a.i) && !S.includes(a.j));
        return `$S=${setTex(S)}$: ${terms.length ? terms.map((a) => `$\\bar x_{${sub(a.i, a.j)}}=${num(a.v)}$`).join(' + ') : 'no arc leaves'} $=${num(vals[k])}$ ${vals[k].lt(ONE) ? '<b>&lt; 1, violated</b>' : '≥ 1, satisfied'}.`;
      })), fig(sets[vals.findIndex((v) => v.lt(ONE)) >= 0 ? vals.findIndex((v) => v.lt(ONE)) : 0])),
    },
  ];
  if (inst.ip) steps.push(separationIpStep(n, sep));
  steps.push(
    {
      title: 'Separation as a minimum cut',
      text: `Treat $\\bar x_{ij}$ as arc capacities, fix the root $r=1$ and compute, for a target $t$, the minimum capacity of a cut separating $1$ from $t$.`,
      fields: [
        { type: 'num', label: `Minimum $1$–$${target}$ cut value`, answer: tcut.capacity },
        { type: 'num', label: 'Smallest cut value over all targets $t\\ne 1$', answer: best.capacity },
        { type: 'num', label: 'Violation $1-\\bar x(\\delta^+(S))$ of the most violated row', answer: sep.violated ? ONE.sub(best.capacity) : 0 },
        { type: 'num', label: 'For that set $S$: the value of $\\bar x(E(S))$, the arcs inside $S$', answer: internal(x, best.S) },
      ],
      explain: `A set $S\\ni 1$ with $t\\notin S$ has $\\bar x(\\delta^+(S))$ equal to the capacity of the cut, so the most violated row is a minimum cut. For $t=${target}$ the minimum is $${num(tcut.capacity)}$ with $S=${setTex(tcut.S)}$. Over all targets the smallest value is $${num(best.capacity)}$ at $S=${setTex(best.S)}$: ${sep.violated ? `violated by $${num(ONE.sub(best.capacity))}$` : 'no subtour row is violated'}. With the degree equations, $\\bar x(E(S))=|S|-\\bar x(\\delta^+(S))=${best.S.length}-${num(best.capacity)}=${num(internal(x, best.S))}$, to be compared with $|S|-1=${best.S.length - 1}$. One root is enough because the complement of a violated set is violated too.`,
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
  );
  return {
    id: 'fracsep', topic: 't203', title: inst.title || 'Separating a fractional point',
    statement: () => frag(
      `The LP relaxation of a directed TSP on $n=${n}$ vertices (degree equations plus the subtour rows found so far) has this solution $\\bar x$; arcs not listed are $0$.`,
      dataTable(['Arc'].concat(arcs.map((a) => `${a.i}→${a.j}`)), [['$\\bar x_{ij}$'].concat(arcs.map((a) => a.v.pretty()))], 'compact'),
      inst.note || null,
      fig(null),
    ),
    rules: 'Use the cutset form $x(\\delta^+(S))=\\sum_{i\\in S,\\ j\\notin S}x_{ij}\\ge 1$. A row is violated when its left-hand side is below 1. (A solver works with rounded numbers, so it tests “below $1-\\varepsilon$” for a small tolerance $\\varepsilon$, as on slides 203; this trainer uses exact fractions.)',
    steps,
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
    return { n, tour, cover, lam, sets: rng.shuffle(sets), target: A[0], ip: level === 3 };
  }
  return { n: 6, tour: [1, 2, 3, 4, 5, 6], cover: [[1, 3, 2], [4, 6, 5]], lam: '1/2', sets: [[1, 4], [4, 5, 6], [2, 3]], target: 4 };
}

// Slides 203, "A violated fractional cut": the twelve-vertex point (orange arcs 0.5, blue arcs 1) on the lab 202a
// instance. Arc values read from the figure; the degree equations hold.
const LECTURE203_ARCS = [[1, 5, '1/2'], [1, 11, '1/2'], [2, 3, '1/2'], [2, 7, '1/2'], [3, 2, '1/2'], [3, 10, '1/2'], [4, 12, 1], [5, 1, '1/2'], [5, 10, '1/2'], [6, 9, 1],
  [7, 4, 1], [8, 2, '1/2'], [8, 7, '1/2'], [9, 6, '1/2'], [9, 11, '1/2'], [10, 3, '1/2'], [10, 5, '1/2'], [11, 1, '1/2'], [11, 6, '1/2'], [12, 8, 1]];

export const fracSepDrill = {
  id: 'fracsep', title: 'Separating a fractional point', topic: 't203', minutes: 7,
  blurb: 'Evaluate cutset rows at a fractional TSP solution, write the separation problem, find the most violated row as a minimum cut, and place it correctly in branch-and-cut.',
  presets: [
    { id: '20e2', label: 'Sheet 20E, Exercise 2', make: () => ({ n: 4, arcs: [[1, 2, '0.8'], [2, 1, '0.8'], [3, 4, '0.8'], [4, 3, '0.8'], [1, 3, '0.2'], [3, 1, '0.2'], [2, 4, '0.2'], [4, 2, '0.2']], sets: [[1, 2], [1, 3], [3, 4]], target: 3, ip: true, pos: { 1: [0, 0], 2: [2, 0], 3: [0, 2], 4: [2, 2] }, note: '<p>Sheet 20E, exercise 2: a point of the degree relaxation (no subtour row added yet). Every vertex has one arc of value 0.8 and one of value 0.2 going out, and the same coming in.</p>', title: 'Fractional separation — sheet 20E, exercise 2' }) },
    { id: 'lecture203', label: 'Slides 203: twelve vertices, cut of capacity 0.50', make: () => ({ n: 12, arcs: LECTURE203_ARCS, sets: [[1, 6, 9, 11], [1, 5], [4, 7, 12]], target: 5, ip: true, pts: LECTURE202.pts, note: '<p>The fractional point of slides 203 (“A violated fractional cut”) on the twelve-vertex lab instance. The slides circle the set $\\{1,6,9,11\\}$, which sends only 0.50 units to its complement.</p>', title: 'Fractional separation — lecture example (slides 203)' }) },
    { id: 'half', label: 'Half tour, half two triangles', make: () => ({ n: 6, tour: [1, 2, 3, 4, 5, 6], cover: [[1, 3, 2], [4, 6, 5]], lam: '1/2', sets: [[1, 4], [4, 5, 6], [2, 3]], target: 4, title: 'Fractional separation — worked example' }) },
  ],
  random: (rng, level) => ({ ...randomFracSep(rng, level), title: 'Fractional separation — practice' }),
  build: buildFracSep,
};

// ---------------------------------------------------------------- MTZ
// Sheet 20E, exercise 1: with free positions and the row u_i - u_j + 1 <= M(1 - x_ij), how large must M be?
function bigMStep(n, order) {
  const a2 = order[1], a3 = order[2], an = order[n - 1];
  return {
    title: 'How big must M be?',
    text: 'Use the rows $u_i-u_j+1\\le M(1-x_{ij})$ with free positions. How large must $M$ be so that this tour stays feasible?',
    fields: [
      { type: 'int', label: `Adding the rows of the ${n - 2} selected arcs that avoid vertex 1 gives $u_{${an}}-u_{${a2}}\\ge$`, answer: n - 2 },
      { type: 'choice', stack: true, label: `With $M=${n - 2}$, which ordering row cannot hold?`, answer: 'ret', options: [
        { value: 'ret', label: `The row of the <b>unselected</b> arc $(${an},${a2})$: $u_{${an}}-u_{${a2}}+1\\le M$.` },
        { value: 'sel', label: `The row of the selected arc $(${a2},${a3})$: $u_{${a2}}-u_{${a3}}+1\\le 0$.` },
        { value: 'one', label: `The row of the arc $(${an},1)$ that closes the tour.` },
      ], mis: { sel: 'A selected arc has right-hand side $M(1-1)=0$ whatever $M$ is, and positions that increase by 1 along the tour satisfy it.', one: 'Arcs that touch vertex 1 have no ordering row: that is what lets the tour return to its start.' } },
      { type: 'int', label: 'Smallest $M$ that allows this tour', answer: n - 1, mis: [{ value: n - 2, msg: `The selected arcs force $u_{${an}}-u_{${a2}}+1\\ge ${n - 1}$.` }, { value: n, msg: `$M=${n}$ is valid too, but it is not the smallest.` }] },
    ],
    explain: `A selected arc $(i,j)$ has $x_{ij}=1$, so its row is $u_i-u_j+1\\le 0$, that is $u_j\\ge u_i+1$. The ${n - 2} selected arcs from ${a2} to ${an} add up to $u_{${an}}\\ge u_{${a2}}+${n - 2}$. The arc $(${an},${a2})$ is not selected, so $x_{${n >= 10 ? `${an},${a2}` : `${an}${a2}`}}=0$ and its row reads $u_{${an}}-u_{${a2}}+1\\le M$. Together: $${n - 1}\\le u_{${an}}-u_{${a2}}+1\\le M$. With $M=${n - 2}$ no positions work, so the tour is cut off by the row of $(${an},${a2})$. With $M=${n - 1}$ the positions $${order.slice(1).map((v, k) => `u_{${v}}=${k + 2}`).join(',\\ ')}$ satisfy every row: the selected rows give $0\\le 0$, the row of $(${an},${a2})$ gives $${n}-2+1=${n - 1}\\le ${n - 1}$, and every other unselected row has $u_i-u_j+1\\le ${n}-2+1=${n - 1}$. So the smallest value is $M=n-1=${n - 1}$.`,
  };
}

// Extra slides 202 (MTZ to MCF): on a tour, the total flow entering vertex i is v_i = n + 1 - u_i.
function flowsStep(n, order, u) {
  const others = Array.from({ length: n - 1 }, (_, i) => i + 2);
  return {
    title: 'From flows to positions (extra slides 202)',
    text: `In the multicommodity-flow model, commodity $k\\ne 1$ sends one unit from vertex 1 to vertex $k$. Send every commodity along the tour above. Let $v_i=\\sum_{h}\\sum_{k\\ne 1}f^k_{hi}$ be the <b>total flow entering</b> vertex $i$ (all commodities together).`,
    fields: [{ type: 'table', label: 'Total incoming flow $v_i$', columns: others.map((v) => ({ key: `v${v}`, head: `$v_{${v}}$`, kind: 'num', plain: `v${v}` })), rows: [{ cells: Object.fromEntries(others.map((v) => [`v${v}`, n + 1 - u[v]])) }] }],
    explain: `Commodity $k$ enters vertex $i$ exactly when its destination $k$ is $i$ or comes later on the tour. If $i$ is in position $u_i$, the destinations at or after it are the vertices in positions $u_i,\\dots,n$: there are $n+1-u_i$ of them. So $v_i=n+1-u_i$: ${order.slice(1).map((v) => `$v_{${v}}=${n + 1 - u[v]}$`).join(', ')}. The extra slides set $u_i=n+1-v_i$ and prove more: for <b>any</b> solution of the flow model's LP relaxation, these $u$ satisfy $2\\le u_i\\le n$ and every MTZ row $u_i-u_j+1\\le(n-1)(1-x_{ij})$. So every $x$ allowed by the flow relaxation is allowed by the MTZ relaxation, and $z^{MCF}_{LP}\\ge z^{MTZ}_{LP}$. The two bounds can be equal on a particular instance.`,
  };
}

function buildMtz(inst) {
  const { n, order, sub, pair } = inst;
  const u = mtzPositions(order);
  const others = Array.from({ length: n - 1 }, (_, i) => i + 2);
  const idx = order.findIndex((v, k) => k > 0 && k < n - 1);
  const i1 = order[idx], j1 = order[idx + 1];
  const [p, q] = pair; // not consecutive on the tour, both != 1
  const k = sub.length;
  const steps = [
    {
      title: 'Order variables of the tour',
      fields: [{ type: 'table', label: 'Position variables', columns: others.map((v) => ({ key: `u${v}`, head: `$u_{${v}}$`, kind: 'num', plain: `u${v}` })), rows: [{ cells: Object.fromEntries(others.map((v) => [`u${v}`, u[v]])) }] }],
      explain: `Vertex 1 is first; the next vertices get $2,3,\\dots,n$ along the tour: ${order.slice(1).map((v) => `$u_{${v}}=${u[v]}$`).join(', ')}.`,
    },
  ];
  if (inst.askM) steps.push(bigMStep(n, order));
  steps.push(
    {
      title: 'Check two rows',
      text: `Evaluate the left-hand side $u_i-u_j+(n-1)x_{ij}$ for an arc that the tour uses and for a pair it does not use. The right-hand side is $n-2=${n - 2}$.`,
      fields: [
        { type: 'num', label: `Arc $(${i1},${j1})$, used: left-hand side`, answer: u[i1] - u[j1] + (n - 1) },
        { type: 'num', label: `Pair $(${p},${q})$, not used: left-hand side`, answer: u[p] - u[q] },
        { type: 'choice', label: 'Are both rows satisfied?', options: YN, answer: 'yes' },
      ],
      explain: `Used arc: $u_{${i1}}-u_{${j1}}+(n-1)=${u[i1]}-${u[j1]}+${n - 1}=${n - 2}$, tight. Unused pair: $u_{${p}}-u_{${q}}=${u[p] - u[q]}\\le ${n - 2}$, which always holds when the positions lie between 2 and $n$. So $M=n-1$ is exactly what makes the row inactive when $x_{ij}=0$: any $M\\ge n-1$ is valid, and $n-1$ is the smallest value (slides 201).`,
    },
    {
      title: 'Why a subtour is impossible',
      text: `Suppose a solution contained the cycle ${arrow(sub)}, which does not pass through vertex 1.${inst.subNote ? ` ${inst.subNote}` : ''} Add up the MTZ rows of its ${k} arcs.`,
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
  );
  if (inst.flows) steps.push(flowsStep(n, order, u));
  steps.push({
    title: 'Size and strength',
    fields: [
      { type: 'int', label: 'Number of $u$ variables', answer: n - 1 },
      { type: 'int', label: 'Number of MTZ rows', answer: (n - 1) * (n - 2) },
      { type: 'choice', stack: true, label: 'Compared with the multicommodity-flow and cutset formulations, the MTZ formulation is', answer: 'weak', options: [
        { value: 'weak', label: 'compact (polynomial size), but its LP relaxation is never stronger, and it is much weaker on the lecture instance.' },
        { value: 'strong', label: 'compact and has a stronger LP relaxation.' },
        { value: 'same', label: 'exponential and equally strong.' },
      ] },
    ],
    explain: `$n-1=${n - 1}$ extra variables and $(n-1)(n-2)=${(n - 1) * (n - 2)}$ rows: $O(n^2)$. Extra slides 202 prove that the multicommodity-flow LP bound is never below the MTZ bound with $M=n-1$: $z^{MCF}_{LP}\\ge z^{MTZ}_{LP}$ (the bounds can be equal on an instance). (Beyond the slides: a larger $M$ only loosens the MTZ rows, so this also holds for any $M\\ge n-1$.) On the 10-vertex lecture instance the difference is large: the MTZ root bound is 282.47 against the optimum 359.81 (21.5%), while the multicommodity-flow and cutset formulations give 359.81.`,
  });
  return {
    id: 'mtz', topic: 't201', title: inst.title || 'Miller–Tucker–Zemlin constraints',
    statement: () => frag(
      inst.askM
        // the form of sheet 20E: general M and free positions
        ? `Directed TSP on $n=${n}$ vertices with degree equations and the ordering rows $$u_i-u_j+1\\le M(1-x_{ij})\\qquad\\text{for all } i\\ne j,\\ i,j\\ne 1,$$ where the positions $u_i$ are continuous and free (no bounds). With $M=n-1$ these are the MTZ rows of slides 201, $u_i-u_j+(n-1)\\,x_{ij}\\le n-2$ (written there with $2\\le u_i\\le n$).`
        : `Directed TSP on $n=${n}$ vertices with the MTZ constraints $$u_i-u_j+(n-1)\\,x_{ij}\\le n-2\\qquad\\text{for all } i\\ne j,\\ i,j\\ne 1,\\qquad 2\\le u_i\\le n .$$`,
      `Consider the tour <b>${order.concat([1]).join(' → ')}</b>.`,
      inst.note || null,
    ),
    rules: inst.askM
      ? 'Choose $u_i$ = position of vertex $i$ in the tour, with vertex 1 in position 1 (only differences of positions appear, so this is one valid choice). Unless a step says otherwise, use $M=n-1$.'
      : 'Take $u_i$ = position of vertex $i$ in the tour, with vertex 1 in position 1.',
    steps,
    wrapup: 'MTZ trades strength for size. It is a valid formulation you can type in directly. The cutset formulation needs row generation, but its LP bound is never worse (extra slides 202) and on the lecture instance it is much better.',
  };
}

function randomMtz(rng, level) {
  const n = level === 1 ? 5 : rng.int(6, 7);
  const order = [1].concat(rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 2)));
  const pos = Object.fromEntries(order.map((v, k) => [v, k]));
  const cand = [];
  for (let i = 2; i <= n; i++) for (let j = 2; j <= n; j++) if (i !== j && pos[j] !== pos[i] + 1) cand.push([i, j]);
  const sub = rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i + 2)).slice(0, level === 1 ? 2 : rng.int(2, 3));
  return { n, order, sub, pair: rng.pick(cand), askM: level >= 2, flows: level === 3 };
}

export const mtzDrill = {
  id: 'mtz', title: 'MTZ constraints', topic: 't201', minutes: 6,
  blurb: 'Position variables of a tour, how large M must be, tight and slack rows, the cancellation argument against subtours, flows versus positions, and the size/strength trade-off.',
  presets: [
    { id: '20e1', label: 'Sheet 20E, Exercise 1 (how big must M be?)', make: () => ({ n: 6, order: [1, 2, 3, 4, 5, 6], sub: [2, 4, 6], pair: [6, 2], askM: true, title: 'MTZ constraints — sheet 20E, exercise 1' }) },
    { id: 'lecture10', label: 'Slides 201: the optimal ten-vertex tour', make: () => ({ n: 10, order: [1, 3, 4, 5, 2, 7, 8, 9, 6, 10], sub: [8, 2, 5, 7], pair: [8, 7], flows: true, subNote: 'Its vertex set $\\{2,5,7,8\\}$ is the closed component of the fractional MTZ root solution on slides 201.', note: '<p>The optimal tour of the ten-vertex lecture instance of slides 201 (cost 359.81).</p>', title: 'MTZ constraints — ten-vertex lecture tour (slides 201)' }) },
    { id: 'five', label: 'Five vertices', make: () => ({ n: 5, order: [1, 3, 2, 5, 4], sub: [2, 4, 5], pair: [5, 3], title: 'MTZ constraints — five vertices' }) },
  ],
  random: (rng, level) => ({ ...randomMtz(rng, level), title: 'MTZ constraints — practice' }),
  build: buildMtz,
};
