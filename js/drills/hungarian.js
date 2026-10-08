// Hungarian method trainer (slides 105; solved exercise 4; lab 105c).
import { hungarian } from '../math/graphs.js';
import { matrixTable } from '../viz.js';
import { setText, frag, ul, generateUntil, parseMatrix } from './common.js';

const W = (i) => `W${i + 1}`;
const J = (j) => `J${j + 1}`;

function randomCost(rng, level) {
  const n = level === 1 ? 3 : 4;
  const make = () => Array.from({ length: n }, () => Array.from({ length: n }, () => rng.int(0, 9)));
  const accept = (cost) => {
    const r = hungarian(cost);
    const stalls = r.events.filter((e) => e.type === 'stall').length;
    if (level === 1) return stalls === 1;
    if (level === 2) return stalls >= 1 && stalls <= 2;
    return stalls >= 2 && stalls <= 3;
  };
  return generateUntil(rng, make, accept, 3000);
}

function build(inst) {
  const cost = inst.cost;
  const n = cost.length;
  const r = hungarian(cost);
  const heads = { rowHeads: cost.map((_, i) => W(i)), colHeads: cost.map((_, j) => J(j)) };
  const zeroCls = (M, assign) => (i, j) => (assign && assign[i] === j ? 'cell-pick' : M[i][j] === 0 ? 'cell-zero' : '');
  const vecField = (label, prefix, vals) => ({
    type: 'table', label,
    columns: vals.map((_, k) => ({ key: `k${k}`, head: `${prefix}${k + 1}`, kind: 'num', plain: `${prefix}${k + 1}` })),
    rows: [{ cells: Object.fromEntries(vals.map((x, k) => [`k${k}`, x])) }],
  });
  const gridField = (label, M) => ({ type: 'grid', label, answer: M, rowHeads: heads.rowHeads, colHeads: heads.colHeads });

  const rowsEv = r.events[0], colsEv = r.events[1];
  const steps = [
    {
      title: 'Row reduction',
      text: 'Subtract each row minimum. Give the row amounts $u_i$ and the reduced costs $\\bar c_{ij}=c_{ij}-u_i$.',
      fields: [vecField('Row amounts $u$', 'u', rowsEv.u), gridField('Reduced costs after the row step', rowsEv.reduced)],
      explain: `Row minima: $u=(${rowsEv.u.join(', ')})$. The lower bound so far is $\\sum_i u_i=${rowsEv.lb}$.`,
    },
    {
      title: 'Column reduction',
      text: 'Now subtract each column minimum of that matrix. Give $v_j$, the reduced costs $\\bar c_{ij}=c_{ij}-u_i-v_j$ and the lower bound.',
      fields: [vecField('Column amounts $v$', 'v', colsEv.v), gridField('Reduced costs after the column step', colsEv.reduced), { type: 'num', label: 'Lower bound $\\sum_i u_i+\\sum_j v_j$', answer: colsEv.lb }],
      explain: () => frag(`Column minima: $v=(${colsEv.v.join(', ')})$, so the bound is ${rowsEv.lb} + ${colsEv.v.reduce((a, b) => a + b, 0)} = ${colsEv.lb}. A complete assignment that uses only zeros would cost exactly ${colsEv.lb} and would be optimal.`, matrixTable(colsEv.reduced, { ...heads, cls: zeroCls(colsEv.reduced) })),
    },
  ];
  let current = colsEv.reduced;
  let assign = new Array(n).fill(-1);
  r.events.slice(2).forEach((ev) => {
    const before = current;
    const assignBefore = assign.slice();
    const context = () => frag(
      'Current reduced costs (zeros highlighted, current assignments boxed):',
      matrixTable(before, { ...heads, cls: zeroCls(before, assignBefore) }),
      `Current assignment: ${assignBefore.some((j) => j >= 0) ? assignBefore.map((j, i) => (j >= 0 ? `${W(i)}→${J(j)}` : null)).filter(Boolean).join(', ') : 'none yet'}.`,
    );
    if (ev.type === 'stall') {
      steps.push({
        title: `Search from ${W(ev.root)} stalls`,
        text: () => frag(context(), `Search from the unassigned worker ${W(ev.root)} through zero reduced costs (jobs in numerical order), returning along existing assignments. The search reaches no free job. Give the reached sets and the label update.`),
        fields: [
          { type: 'set', label: 'Reached workers $S$', answer: ev.S.map((i) => `w${i + 1}`), placeholder: 'e.g. W1, W2', expected: setText(ev.S.map(W)) },
          { type: 'set', label: 'Reached jobs $T$', answer: ev.T.map((j) => `j${j + 1}`), placeholder: 'e.g. J2', expected: setText(ev.T.map(J)) },
          { type: 'num', label: '$\\Delta=\\min_{i\\in S,\\ j\\notin T}\\bar c_{ij}$', answer: ev.delta, mis: [{ value: 0, msg: 'Take the minimum over reached rows and UNREACHED columns only — those entries are all positive.' }] },
          vecField('New row amounts $u$', 'u', ev.u),
          vecField('New column amounts $v$', 'v', ev.v),
          { type: 'num', label: 'New lower bound', answer: ev.lb },
        ],
        explain: () => frag(ul([
          `Reached workers $S=${'\\{'}${ev.S.map(W).join(', ')}${'\\}'}$, reached jobs $T=${'\\{'}${ev.T.map(J).join(', ')}${'\\}'}$: $|S|=|T|+1$, so these workers cannot all be assigned using zeros.`,
          `$\\Delta=${ev.delta}$ is the smallest entry in reached rows outside the reached columns.`,
          `Increase $u_i$ by $\\Delta$ on $S$ and decrease $v_j$ by $\\Delta$ on $T$: $u=(${ev.u.join(', ')})$, $v=(${ev.v.join(', ')})$. The bound rises by $\\Delta(|S|-|T|)=${ev.delta}$ to ${ev.lb}.`,
          'Entries in reached rows and unreached columns drop by $\\Delta$ (creating a new zero); entries in unreached rows and reached columns rise by $\\Delta$; existing assigned zeros are preserved.',
        ]), 'Updated reduced costs:', matrixTable(ev.reduced, { ...heads, cls: zeroCls(ev.reduced, assignBefore) })),
      });
      current = ev.reduced;
    } else {
      const path = ev.path.map((p) => (p.kind === 'W' ? `w${p.index + 1}` : `j${p.index + 1}`));
      const pathShown = ev.path.map((p) => (p.kind === 'W' ? W(p.index) : J(p.index))).join(' → ');
      const direct = ev.pairs.length === 1;
      steps.push({
        title: `Search from ${W(ev.root)} reaches a free job`,
        text: () => frag(context(), `Search from ${W(ev.root)} through zeros (jobs in numerical order), returning along existing assignments. Give the alternating path to the first free job reached, and the assignment after reversing along it.`),
        fields: [
          { type: 'seq', label: 'Alternating path', answer: path, expected: pathShown, placeholder: direct ? `e.g. ${W(ev.root)} - J1` : 'e.g. W3 - J1 - W1 - J2' },
          vecField('Job of each worker afterwards (0 if unassigned)', 'W', ev.jobOf.map((j) => j + 1)),
        ],
        explain: direct
          ? `${W(ev.root)} has a zero at the free job ${J(ev.pairs[0][1])}, so it is assigned at once.`
          : `The path is ${pathShown}. Reversing along it adds ${ev.pairs.map(([i, j]) => `${W(i)}${J(j)}`).join(', ')} and removes the assignments it passes back through, so one more worker is assigned.`,
      });
      assign = ev.jobOf.slice();
    }
  });
  steps.push({
    title: 'Optimal assignment and certificate',
    text: 'Give the total cost in the ORIGINAL matrix and the final dual bound.',
    fields: [
      { type: 'num', label: 'Total cost of the assignment', answer: r.cost },
      { type: 'num', label: 'Final lower bound $\\sum_i u_i+\\sum_j v_j$', answer: r.lb },
    ],
    explain: () => frag(
      `Assignment: ${r.jobOf.map((j, i) => `${W(i)}↦${J(j)}`).join(', ')} with cost ${r.jobOf.map((j, i) => cost[i][j]).join(' + ')} = ${r.cost}. The labels satisfy $u_i+v_j\\le c_{ij}$ for every pair, so every assignment costs at least ${r.lb}; this one attains the bound, hence it is optimal.`,
      matrixTable(cost, { ...heads, cls: (i, j) => (r.jobOf[i] === j ? 'cell-pick' : ''), caption: 'Original costs with the selected entries boxed' }),
    ),
  });
  return {
    id: 'hungarian', topic: 't105d', title: inst.title || 'Hungarian method',
    statement: () => frag('Assign each worker to exactly one job and each job to exactly one worker at <b>minimum total cost</b>. Rows are workers, columns are jobs.', matrixTable(cost, { ...heads, corner: '$c_{ij}$' })),
    rules: 'Apply row then column reductions. Assign workers in numerical order; search zero reduced-cost pairs by BFS, visiting jobs in numerical order. When a search stalls, update the labels and search again from the same worker. (The slides sometimes pick the obvious zeros first and only then search; the order changes the intermediate steps, not the optimal cost.)',
    steps,
    wrapup: 'Original cost = ∑u + ∑v + total reduced cost for every complete assignment, so a complete assignment on zeros attains the lower bound. A stalled search exhibits more workers than zero-cost jobs (|S| = |T| + 1), which is why the labels must change.',
  };
}

export default {
  id: 'hungarian', title: 'Hungarian method', topic: 't105d', minutes: 10,
  blurb: 'Reductions, alternating search, the Δ label update and the dual optimality certificate.',
  presets: [
    { id: 'ex4', label: 'Solved exercise 4 (3×3)', make: () => ({ cost: [[2, 3, 6], [4, 1, 1], [3, 5, 8]], title: 'Hungarian method — solved exercise 4' }) },
    { id: 'lecture', label: 'Slides 105 matrix (4×4)', make: () => ({ cost: [[4, 1, 3, 6], [2, 0, 5, 7], [3, 2, 2, 5], [5, 4, 1, 2]], title: 'Hungarian method — slides 105 matrix' }) },
    { id: 'lab', label: 'Lab 105c matrix (4×4)', make: () => ({ cost: [[4, 1, 3, 6], [3, 2, 2, 5], [5, 4, 1, 2], [2, 0, 5, 7]], title: 'Hungarian method — lab 105c matrix' }) },
  ],
  random: (rng, level) => ({ cost: randomCost(rng, level), title: 'Hungarian method — practice instance' }),
  build,
  custom: {
    help: 'A square matrix of nonnegative integer costs: one row per line, entries separated by spaces.',
    fields: [{ key: 'cost', label: 'Cost matrix', kind: 'textarea', value: '2 3 6\n4 1 1\n3 5 8' }],
    parse(v) {
      const M = parseMatrix(v.cost);
      if (M.length !== M[0].length) throw new Error('The matrix must be square.');
      if (M.length < 2 || M.length > 6) throw new Error('Use a matrix between 2×2 and 6×6.');
      if (M.some((r) => r.some((x) => !Number.isInteger(x)))) throw new Error('Use integer costs so that zeros can be compared exactly.');
      return { cost: M, title: 'Hungarian method — your instance' };
    },
  },
};
