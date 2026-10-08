// Minimum spanning trees: Kruskal trace (slides 105, solved exercises 2 and 2B) and Prim (lab 105b).
import { kruskal, prim, listMinimumSpanningTrees, edgeName } from '../math/graphs.js';
import { graphFigure, LAYOUTS, circleLayout } from '../viz.js';
import { setText, dataTable, frag, ul, generateUntil, parseTriples } from './common.js';

const E = (list) => list.map(([u, v, w]) => ({ u, v, w }));
const LECTURE = E([['a', 'b', 1], ['b', 'c', 2], ['a', 'c', 3], ['b', 'd', 4], ['d', 'e', 5], ['c', 'd', 6], ['e', 'f', 7], ['d', 'f', 8], ['c', 'e', 9]]);
const EX2 = E([['a', 'b', 1], ['a', 'c', 2], ['b', 'c', 2], ['b', 'd', 4], ['c', 'd', 3], ['c', 'e', 5], ['d', 'e', 3], ['a', 'e', 8]]);
const EX2B = E([['a', 'b', 1], ['b', 'c', 5], ['c', 'd', 8], ['e', 'f', 2], ['f', 'g', 6], ['g', 'h', 9], ['a', 'e', 3], ['b', 'f', 4], ['c', 'g', 7], ['d', 'h', 10], ['b', 'g', 11], ['c', 'f', 12]]);
const LAB = E([['a', 'b', 1], ['d', 'e', 2], ['e', 'f', 3], ['d', 'f', 4], ['b', 'c', 5], ['a', 'c', 6], ['b', 'd', 7], ['c', 'd', 8], ['c', 'e', 9]]);
const SIX = ['a', 'b', 'c', 'd', 'e', 'f'];
// lecture picture: a left, b top-left, c bottom-left, d top-right, e bottom-right, f right
const POS6 = { a: [0, 1], b: [1, 0], c: [1, 2], d: [2.4, 0], e: [2.4, 2], f: [3.4, 1] };
const PAIRS6 = [['a', 'b'], ['a', 'c'], ['b', 'c'], ['b', 'd'], ['c', 'e'], ['c', 'd'], ['d', 'e'], ['d', 'f'], ['e', 'f']];

function randomEdges(rng, level) {
  const make = () => {
    const pairs = rng.shuffle(PAIRS6).slice(0, rng.int(8, 9));
    let weights;
    if (level === 1) weights = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, pairs.length);
    else weights = pairs.map(() => rng.int(1, level >= 3 ? 5 : 6));
    return pairs.map(([u, v], i) => ({ u, v, w: weights[i] }));
  };
  const accept = (edges) => {
    const r = kruskal(SIX, edges);
    if (!r.connected) return false;
    const rejects = r.trace.filter((t) => !t.accept).length;
    if (rejects < 1) return false;
    const count = listMinimumSpanningTrees(SIX, edges).length;
    if (level === 1) return count === 1;
    if (level >= 2) return new Set(edges.map((e) => e.w)).size < edges.length;
    return true;
  };
  return generateUntil(rng, make, accept);
}

function figureFor(inst, selected = [], last = null, lastCls = 'hl') {
  const sel = new Set(selected);
  const pos = inst.pos || LAYOUTS[inst.layout] || circleLayout(inst.nodes);
  return graphFigure({
    nodes: inst.nodes, pos, directed: false,
    edges: inst.edges.map((e) => {
      const nm = edgeName(e.u, e.v);
      return { u: e.u, v: e.v, label: e.w, cls: nm === last ? lastCls : sel.has(nm) ? 'sel' : '' };
    }),
    caption: selected.length ? 'Blue: selected edges.' : 'Edge labels: weight',
  });
}

function buildKruskal(inst) {
  const r = kruskal(inst.nodes, inst.edges);
  const all = listMinimumSpanningTrees(inst.nodes, inst.edges);
  const unique = all.length === 1;
  const decision = {};
  r.trace.forEach((t) => { decision[t.edge] = t.accept ? 'A' : 'R'; });
  const options = [{ value: 'A', label: 'Accept', short: 'Accept' }, { value: 'R', label: 'Reject (cycle)', short: 'Reject' }, { value: 'N', label: 'Not examined', short: 'Not examined' }];
  const n = inst.nodes.length;
  const steps = [
    {
      title: 'Order the edges',
      text: 'List the edges in the order Kruskal examines them (nondecreasing weight; equal weights alphabetically by edge name, e.g. <code>ac</code> before <code>bc</code>).',
      fields: [{ type: 'seq', label: 'Examination order', answer: r.order, placeholder: 'e.g. ab, bc, ac, ...' }],
      explain: `Sorted order: ${r.sorted.map((e) => `${e.name} (${e.w})`).join(' ≺ ')}.`,
    },
    {
      title: 'Accept or reject each edge',
      text: `Go through the edges in that order. Stop as soon as $n-1=${n - 1}$ edges have been accepted; mark the remaining edges “Not examined”.`,
      fields: [{
        type: 'table', label: 'Decision for every edge',
        columns: [
          { key: 'edge', head: 'Edge (weight)', kind: 'given' },
          { key: 'dec', head: 'Decision', kind: 'choice', options, plain: 'decision' },
        ],
        rows: r.sorted.map((e) => ({ cells: { edge: `${e.name} (${e.w})`, dec: decision[e.name] || 'N' } })),
      }],
      explain: () => frag(
        dataTable(['Edge', 'Decision', 'Components after the decision', 'Weight so far'],
          r.trace.map((t) => [`${t.edge} (${t.w})`, t.accept ? 'Accept' : `Reject — closes the cycle ${t.cycle.join(', ')}`, t.components.map(setText).join(', '), t.weight])),
        r.unexamined.length ? `Edges ${r.unexamined.join(', ')} need not be examined: the tree already has ${n - 1} edges.` : 'Every edge was examined.',
      ),
    },
    {
      title: 'The tree and its uniqueness',
      text: 'Give the minimum spanning tree found, its total weight, and say whether the minimum spanning tree is unique.',
      fields: [
        { type: 'set', label: 'Edges of the tree', answer: r.tree, placeholder: 'e.g. ab, bc, bd' },
        { type: 'num', label: 'Total weight', answer: r.weight },
        { type: 'choice', label: 'Is the minimum spanning tree unique?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], answer: unique ? 'yes' : 'no' },
      ],
      explain: () => {
        const distinct = new Set(inst.edges.map((e) => e.w)).size === inst.edges.length;
        let why;
        if (unique && distinct) why = 'All weights are distinct, so every choice Kruskal made was forced and the tree is unique.';
        else if (unique) why = 'Some weights tie, but swapping tied edges never produces another spanning tree of the same weight here, so the tree is still unique.';
        else {
          const other = all.find((t) => t.slice().sort().join() !== r.tree.slice().sort().join());
          why = `It is not unique: ${setText(other)} is another spanning tree of weight ${r.weight} (${all.length} minimum spanning trees in total). Ties in the edge weights make this possible.`;
        }
        return frag(`$T=${'\\{'}${r.tree.join(', ')}${'\\}'}$ with $w(T)=${r.trace.filter((t) => t.accept).map((t) => t.w).join('+')}=${r.weight}$. ${why}`, figureFor(inst, r.tree));
      },
    },
  ];
  return {
    id: 'kruskal', topic: 't105b', title: inst.title || "Kruskal's algorithm",
    statement: () => frag(
      'Find a <b>minimum spanning tree</b> with Kruskal’s algorithm. Record every acceptance or rejection.',
      dataTable(['Edge'].concat(inst.edges.map((e) => edgeName(e.u, e.v))), [['Weight'].concat(inst.edges.map((e) => e.w))], 'compact'),
    ),
    figure: () => figureFor(inst),
    rules: 'Break equal-weight ties alphabetically by edge name. An edge is rejected exactly when its endpoints already lie in the same component.',
    steps,
    wrapup: 'Each accepted edge is the lightest edge crossing the cut around one of the current components, so by the cut property (exchange argument) it can belong to a minimum spanning tree.',
  };
}

function buildPrim(inst) {
  const r = prim(inst.nodes, inst.edges, inst.start);
  const steps = r.trace.map((t, k) => ({
    title: `Edge ${k + 1}`,
    text: `Reached so far: ${setText(k === 0 ? [inst.start] : r.trace[k - 1].reached)}. Which edge does Prim add next?`,
    fields: [
      { type: 'seq', label: 'Edge added', answer: [t.edge], alts: [[t.edge.split('').reverse().join('')]], placeholder: 'e.g. bd' },
      { type: 'num', label: 'Weight so far', answer: t.weight },
    ],
    explain: `Edges with exactly one reached endpoint: ${t.crossing.join(', ')}. The cheapest is <b>${t.edge}</b> (weight ${t.w}); ties go to the alphabetically first edge. Reached: ${setText(t.reached)}.`,
  }));
  steps.push({
    title: 'Result',
    text: 'Give the total weight of the tree.',
    fields: [{ type: 'num', label: 'Total weight', answer: r.weight }],
    explain: () => frag(`Prim selects ${r.tree.join(', ')} for a total weight of ${r.weight}. The selected weights need not increase: an edge only becomes available once one endpoint is reached.`, figureFor(inst, r.tree)),
  });
  return {
    id: 'prim', topic: 't105b', title: inst.title || "Prim's algorithm",
    statement: () => frag(`Grow a minimum spanning tree with <b>Prim’s algorithm</b> starting at <b>${inst.start}</b>.`,
      dataTable(['Edge'].concat(inst.edges.map((e) => edgeName(e.u, e.v))), [['Weight'].concat(inst.edges.map((e) => e.w))], 'compact')),
    figure: () => figureFor(inst),
    rules: 'At each step add a cheapest edge with exactly one endpoint already reached; break ties alphabetically by edge name.',
    steps,
    wrapup: 'Prim and Kruskal are both justified by the cut property. With distinct weights they return the same tree; with ties they may return different trees of the same weight.',
  };
}

function parseEdges(v) {
  const edges = parseTriples(v.edges);
  const nodes = [...new Set(edges.flatMap((e) => [e.u, e.v]))].sort();
  if (nodes.some((x) => x.length !== 1)) throw new Error('Use single-letter vertex names.');
  if (nodes.length > 9 || edges.length > 16) throw new Error('Keep it to at most 9 vertices and 16 edges.');
  if (!kruskal(nodes, edges).connected) throw new Error('The graph is not connected.');
  return { nodes, edges };
}
const customFields = [{ key: 'edges', label: 'Edges', kind: 'textarea', value: 'a b 1\na c 2\nb c 2\nb d 4\nc d 3\nc e 5\nd e 3\na e 8' }];

export const kruskalDrill = {
  id: 'kruskal', title: "Kruskal's algorithm", topic: 't105b', minutes: 5,
  blurb: 'Sort, accept or reject, and decide whether the minimum spanning tree is unique.',
  presets: [
    { id: 'lecture', label: 'Slides 105 example', make: () => ({ nodes: SIX, edges: LECTURE, pos: POS6, title: 'Kruskal — slides 105 example' }) },
    { id: 'ex2', label: 'Solved exercise 2 (ties)', make: () => ({ nodes: ['a', 'b', 'c', 'd', 'e'], edges: EX2, layout: 'ex2', title: 'Kruskal — solved exercise 2' }) },
    { id: 'ex2b', label: 'Solved exercise 2B (8 vertices)', make: () => ({ nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], edges: EX2B, layout: 'grid8', title: 'Kruskal — solved exercise 2B' }) },
    { id: 'lab', label: 'Lab 105b data', make: () => ({ nodes: SIX, edges: LAB, pos: POS6, title: 'Kruskal — lab 105b data' }) },
  ],
  random: (rng, level) => ({ nodes: SIX, edges: randomEdges(rng, level), pos: POS6, title: "Kruskal's algorithm — practice instance" }),
  build: buildKruskal,
  custom: {
    help: 'One edge per line: <code>u v weight</code> (undirected, single-letter vertices).',
    fields: customFields,
    parse: (v) => ({ ...parseEdges(v), title: "Kruskal's algorithm — your instance" }),
  },
};

export const primDrill = {
  id: 'prim', title: "Prim's algorithm", topic: 't105b', minutes: 4,
  blurb: 'Grow the tree from a start vertex, one cheapest crossing edge at a time.',
  presets: [
    { id: 'lab', label: 'Lab 105b data, start at a', make: () => ({ nodes: SIX, edges: LAB, pos: POS6, start: 'a', title: 'Prim — lab 105b data' }) },
    { id: 'lecture', label: 'Slides 105 graph, start at a', make: () => ({ nodes: SIX, edges: LECTURE, pos: POS6, start: 'a', title: 'Prim — slides 105 graph' }) },
  ],
  random: (rng, level) => ({ nodes: SIX, edges: randomEdges(rng, level), pos: POS6, start: rng.pick(SIX), title: "Prim's algorithm — practice instance" }),
  build: buildPrim,
  custom: {
    help: 'One edge per line: <code>u v weight</code>.',
    fields: customFields.concat([{ key: 'start', label: 'Start vertex', kind: 'text', value: 'a' }]),
    parse: (v) => {
      const g = parseEdges(v);
      const start = v.start.trim().toLowerCase();
      if (!g.nodes.includes(start)) throw new Error('The start vertex must appear in the edge list.');
      return { ...g, start, title: "Prim's algorithm — your instance" };
    },
  },
};
