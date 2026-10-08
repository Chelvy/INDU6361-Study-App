// 0-1 knapsack dynamic programme (slides 105; solved exercise 5; lab 105d).
import { knapsackDP, knapsackAllOptima } from '../math/knapsack.js';
import { matrixTable } from '../viz.js';
import { setText, dataTable, frag, ul, generateUntil, parseList } from './common.js';

function randomInstance(rng, level) {
  const n = level >= 3 ? 5 : 4;
  const make = () => {
    const weights = rng.shuffle([2, 3, 4, 5, 6, 1].slice(0, level === 1 ? 5 : 6)).slice(0, n).sort((a, b) => a - b);
    const profits = weights.map((w) => w + rng.int(0, 4) + (rng.bool(0.4) ? 1 : 0));
    const total = weights.reduce((a, b) => a + b, 0);
    const C = Math.min(level >= 3 ? 10 : 9, Math.max(6, Math.floor(total * 0.55)));
    return { weights, profits, C };
  };
  const accept = (k) => {
    const dp = knapsackDP(k.weights, k.profits, k.C);
    if (dp.items.length < 2 || dp.items.length === k.weights.length) return false;
    const optima = knapsackAllOptima(k.weights, k.profits, k.C).sets.length;
    if (level === 1) return optima === 1;
    return true;
  };
  return generateUntil(rng, make, accept, 1000);
}

function build(inst) {
  const { weights, profits, C } = inst;
  const n = weights.length;
  const dp = knapsackDP(weights, profits, C);
  const caps = Array.from({ length: C + 1 }, (_, c) => c);
  const tableUpTo = (rows, mark) => matrixTable(dp.F.slice(0, rows + 1), {
    rowHeads: Array.from({ length: rows + 1 }, (_, i) => `$i=${i}$`), colHeads: caps.map((c) => `${c}`), corner: '$F(i,c)$',
    cls: mark || (() => ''),
  });
  const steps = [];
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1], p = profits[i - 1];
    steps.push({
      title: `Row ${i}: item ${i} (weight ${w}, profit ${p})`,
      text: () => frag('Table so far:', tableUpTo(i - 1), `Fill row $i=${i}$ using only the row above: $F(${i},c)=F(${i - 1},c)$ if $${w}>c$, otherwise $\\max\\{F(${i - 1},c),\\ ${p}+F(${i - 1},c-${w})\\}$.`),
      fields: [{ type: 'grid', label: `$F(${i},c)$ for $c=0,\\dots,${C}$`, answer: [dp.F[i].slice()], colHeads: caps.map((c) => `$c=${c}$`) }],
      explain: () => {
        const lines = [];
        for (let c = 0; c <= C; c++) {
          const ch = dp.choice[i][c];
          if (!ch.fits) continue;
          if (ch.take > ch.skip) lines.push(`$c=${c}$: skip gives ${ch.skip}, take gives $${p}+F(${i - 1},${c - w})=${ch.take}$ → <b>${ch.take}</b>`);
          else if (ch.take === ch.skip && ch.take > 0) lines.push(`$c=${c}$: skip ${ch.skip}, take ${ch.take} — a tie, value ${ch.skip}`);
        }
        const head = w > 0 ? `Item ${i} does not fit for $c<${w}$, so those entries copy the row above.` : '';
        return frag(head, lines.length ? ul(lines) : 'Taking the item never beats skipping it in this row.', 'Entries not listed keep the value from the row above.');
      },
    });
  }
  const optima = knapsackAllOptima(weights, profits, C);
  steps.push({
    title: 'Recover an optimal subset',
    text: () => frag('Completed table:', tableUpTo(n), `Start at $(i,c)=(${n},${C})$ and compare each entry with the one above it. Tie rule: if $F(i,c)=F(i-1,c)$, <b>skip</b> item $i$.`),
    fields: [
      { type: 'num', label: 'Optimal profit', answer: dp.value },
      { type: 'set', label: 'Selected items (with the tie rule)', answer: dp.items.map(String), placeholder: 'e.g. 2, 3' },
      { type: 'num', label: 'Their total weight', answer: dp.weight },
    ],
    explain: () => frag(
      ul(dp.walk.map((s) => (s.take
        ? `$(${s.i},${s.c})$: $F=${s.value}>F(${s.i - 1},${s.c})=${s.above}$, so <b>take item ${s.i}</b>; capacity becomes $${s.c}-${weights[s.i - 1]}=${s.next}$.`
        : `$(${s.i},${s.c})$: $F=${s.value}=F(${s.i - 1},${s.c})$, so skip item ${s.i}.`))),
      `Selected items ${setText(dp.items)}: weight ${dp.weight}, profit ${dp.value}.`,
      optima.sets.length > 1 ? ` Other optimal subsets exist (${optima.sets.filter((x) => x.join() !== dp.items.join()).map(setText).join(', ')}); the table gives the optimal value and the tie rule picks one subset.` : '',
      tableUpTo(n, (i, c) => (dp.walk.some((s) => s.i === i && s.c === c) ? 'cell-pick' : '')),
    ),
  });
  return {
    id: 'knapsack-dp', topic: 't105e', title: inst.title || 'Knapsack dynamic programme',
    statement: () => frag(
      `Each item is available at most once. The capacity is $C=${C}$. Compute $F(i,c)$, the best profit using the first $i$ items with capacity $c$, then recover an optimal subset.`,
      dataTable(['Item $i$'].concat(weights.map((_, i) => i + 1)), [['Weight $w_i$'].concat(weights), ['Profit $p_i$'].concat(profits)], 'compact'),
    ),
    rules: '$F(0,c)=0$. Both choices for item $i$ read the previous row, so an item is never used twice. Capacities are upper bounds: the knapsack need not be full.',
    steps,
    wrapup: `The table has $n(C+1)$ states: time $O(nC)$, which is polynomial in the numeric value of $C$ but not in its encoded length $\\log_2 C$ — a pseudo-polynomial algorithm. With one array, capacities must be processed in descending order or an item can be reused.`,
  };
}

export default {
  id: 'knapsack-dp', title: 'Knapsack dynamic programme', topic: 't105e', minutes: 8,
  blurb: 'Fill the F(i, c) table row by row and reconstruct the items with the tie rule.',
  presets: [
    { id: 'ex5', label: 'Solved exercise 5 (C = 8)', make: () => ({ weights: [2, 3, 4, 5], profits: [4, 5, 7, 9], C: 8, title: 'Knapsack DP — solved exercise 5' }) },
    { id: 'lecture', label: 'Slides 105 example (C = 7)', make: () => ({ weights: [2, 3, 4, 5], profits: [3, 5, 6, 8], C: 7, title: 'Knapsack DP — slides 105 example' }) },
  ],
  random: (rng, level) => ({ ...randomInstance(rng, level), title: 'Knapsack DP — practice instance' }),
  build,
  custom: {
    help: 'Positive integer weights, nonnegative profits (same number of each) and an integer capacity up to 15.',
    fields: [
      { key: 'weights', label: 'Weights', kind: 'text', value: '2 3 4 5' },
      { key: 'profits', label: 'Profits', kind: 'text', value: '4 5 7 9' },
      { key: 'C', label: 'Capacity', kind: 'text', value: '8' },
    ],
    parse(v) {
      const weights = parseList(v.weights), profits = parseList(v.profits);
      const C = Number(v.C);
      if (weights.length !== profits.length) throw new Error('Give one profit per weight.');
      if (weights.length > 7) throw new Error('Use at most 7 items.');
      if (!Number.isInteger(C) || C < 1 || C > 15) throw new Error('Capacity must be an integer between 1 and 15.');
      if (weights.some((w) => !Number.isInteger(w) || w < 1)) throw new Error('Weights must be positive integers.');
      if (profits.some((p) => p < 0 || !Number.isInteger(p))) throw new Error('Profits must be nonnegative integers.');
      return { weights, profits, C, title: 'Knapsack DP — your instance' };
    },
  },
};
