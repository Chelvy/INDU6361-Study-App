// Dijkstra trace trainer (slides 105; solved exercises 1 and 1B).
import { dijkstra, reverseArcs } from '../math/graphs.js';
import { graphFigure, LAYOUTS, circleLayout } from '../viz.js';
import { inf, pathText, dataTable, frag, ul, generateUntil, parseTriples } from './common.js';

const A = (list) => list.map(([u, v, w]) => ({ u, v, w }));

const LECTURE = A([['s', 'a', 4], ['s', 'b', 2], ['b', 'a', 1], ['a', 'c', 4], ['b', 'c', 5], ['b', 'd', 7], ['c', 'd', 1], ['c', 't', 5], ['d', 't', 2]]);
const EX1 = A([['s', 'a', 4], ['s', 'b', 7], ['s', 'c', 2], ['c', 'b', 2], ['a', 'b', 1], ['a', 't', 8], ['b', 'd', 0], ['d', 't', 3], ['d', 'a', 1]]);

function randomInstance(rng, level) {
  const make = () => {
    const len = () => (level >= 2 ? rng.int(0, 8) : rng.int(1, 9));
    const arcs = [{ u: 's', v: 'a', w: rng.int(1, 9) }, { u: 's', v: 'b', w: rng.int(1, 9) }, { u: 'a', v: 'c', w: len() }, { u: 'b', v: 'd', w: len() }, { u: 'c', v: 't', w: rng.int(1, 9) }, { u: 'd', v: 't', w: rng.int(1, 9) }];
    if (rng.bool(0.85)) arcs.push(rng.bool() ? { u: 'a', v: 'b', w: len() } : { u: 'b', v: 'a', w: len() });
    if (rng.bool(0.85)) arcs.push(rng.bool() ? { u: 'c', v: 'd', w: len() } : { u: 'd', v: 'c', w: len() });
    if (rng.bool(0.5)) arcs.push({ u: 'a', v: 'd', w: len(), t: 0.3 });
    else arcs.push({ u: 'b', v: 'c', w: len(), t: 0.3 });
    if (level >= 3 && rng.bool(0.6)) arcs.push(rng.bool() ? { u: 'd', v: 'a', w: len(), t: 0.3 } : { u: 'c', v: 'b', w: len(), t: 0.3 });
    return { nodes: ['s', 'a', 'b', 'c', 'd', 't'], arcs, source: 's', target: 't', layout: 'six' };
  };
  const accept = (inst) => {
    const seen = new Set();
    for (const a of inst.arcs) { const k = a.u + a.v; const k2 = a.v + a.u; if (seen.has(k) || (a.t && seen.has(k2))) return false; seen.add(k); }
    const r = dijkstra([...inst.nodes].sort(), inst.arcs, 's');
    if (r.order.length < 6) return false;
    const improvements = r.steps.reduce((n, st) => n + st.relax.filter((x) => x.updated && x.old !== Infinity).length, 0);
    const ties = r.steps.some((st, i) => i > 0 && inst.nodes.some((v) => v !== st.selected && !r.steps[i - 1].settled.includes(v) && r.steps[i - 1].dist[v] === st.label));
    if (improvements < 1) return false;
    if (level >= 2 && !ties) return false;
    if (level === 1 && ties) return false;
    return r.pathTo('t').length >= 4;
  };
  return generateUntil(rng, make, accept);
}

function build(inst) {
  const tie = [...inst.nodes].sort();
  const run = dijkstra(tie, inst.arcs, inst.source);
  const cols = inst.nodes.filter((v) => v !== inst.source);
  const pos = inst.pos || LAYOUTS[inst.layout] || circleLayout(inst.nodes);
  const figure = (upto) => () => {
    const st = upto >= 0 ? run.steps[upto] : null;
    const settled = new Set(st ? st.settled : []);
    const predArc = new Set();
    if (st) Object.entries(st.pred).forEach(([v, p]) => { if (p) predArc.add(p + '>' + v); });
    const badges = {};
    inst.nodes.forEach((v) => { badges[v] = `d=${inf(st ? st.dist[v] : (v === inst.source ? 0 : Infinity))}`; });
    return graphFigure({
      nodes: inst.nodes, pos, directed: true,
      edges: inst.arcs.map((a) => ({ u: a.u, v: a.v, label: a.w, t: a.t, cls: predArc.has(a.u + '>' + a.v) ? 'sel' : '' })),
      nodeCls: Object.fromEntries(inst.nodes.map((v) => [v, settled.has(v) ? (st && st.selected === v ? 'cur' : 'settled') : ''])),
      badges,
      caption: upto < 0 ? 'Arc labels: length' : 'Blue: predecessor arcs and permanent labels. Orange: vertex just selected.',
    });
  };
  const traceTable = (upto) => dataTable(
    ['Selected'].concat(cols.map((v) => `$d_${v}$`)),
    run.steps.slice(0, upto).map((st) => [st.selected].concat(cols.map((v) => inf(st.dist[v])))),
  );
  const steps = run.steps.map((st, k) => ({
    title: `Iteration ${k + 1}`,
    text: () => frag(
      k === 0
        ? `Initially $d_${inst.source}=0$ and every other label is $\\infty$. No vertex is permanent yet.`
        : 'Trace so far (labels after each selected vertex):',
      k > 0 ? traceTable(k) : null,
      'Which vertex is selected now, and what are the labels after relaxing its outgoing arcs?',
    ),
    fields: [
      { type: 'choice', label: 'Selected vertex', options: inst.nodes.map((v) => ({ value: v, label: v })), answer: st.selected },
      {
        type: 'table', label: 'Labels after this iteration (write <code>inf</code> for $\\infty$)',
        columns: cols.map((v) => ({ key: v, head: `$d_${v}$`, kind: 'num', plain: `d_${v}` })),
        rows: [{ cells: Object.fromEntries(cols.map((v) => [v, st.dist[v]])) }],
      },
    ],
    explain: () => {
      const lines = [`Select <b>${st.selected}</b>: it has the smallest tentative label among the vertices that are not yet permanent ($d_${st.selected}=${inf(st.label)}$${k > 0 && inst.nodes.some((v) => v !== st.selected && !run.steps[k - 1].settled.includes(v) && run.steps[k - 1].dist[v] === st.label) ? '; the tie is broken alphabetically' : ''}).`];
      if (!st.relax.length) lines.push('It has no outgoing arcs to relax.');
      st.relax.forEach((r) => {
        if (r.skipped) lines.push(`Arc $(${r.u},${r.v})$: ${r.v} is already permanent, so it is skipped (the candidate ${r.cand} could not improve $d_${r.v}=${inf(r.old)}$ anyway).`);
        else if (r.updated) lines.push(`Arc $(${r.u},${r.v})$: $d_${r.v}=\\min\\{${inf(r.old) === '∞' ? '\\infty' : r.old},\\ ${st.label}+${r.w}\\}=${r.cand}$, so the label improves and $p_${r.v}=${r.u}$.`);
        else lines.push(`Arc $(${r.u},${r.v})$: $\\min\\{${r.old},\\ ${st.label}+${r.w}\\}=${r.old}$ — no strict improvement, so the label and predecessor stay as they are.`);
      });
      return frag(ul(lines), figure(k)());
    },
  }));
  const target = inst.target;
  const path = run.pathTo(target);
  const reach = cols.filter((v) => run.pred[v] !== null);
  steps.push({
    title: 'Recover a shortest path',
    text: () => frag('Complete trace:', traceTable(run.steps.length), `Use the predecessors to recover a shortest path from <b>${inst.source}</b> to <b>${target}</b>.`),
    fields: [
      {
        type: 'table', label: 'Final predecessors',
        columns: reach.map((v) => ({ key: v, head: `$p_${v}$`, kind: 'tokens', plain: `p_${v}` })),
        rows: [{ cells: Object.fromEntries(reach.map((v) => [v, [run.pred[v]]])) }],
      },
      { type: 'seq', label: `Shortest path from ${inst.source} to ${target}`, answer: path, chars: true, placeholder: `e.g. ${inst.source}-a-${target}` },
      { type: 'num', label: 'Its length', answer: run.dist[target] },
    ],
    explain: `Follow predecessors backwards from ${target}: ${path.slice().reverse().join(' ← ')}. The path is <b>${pathText(path)}</b> with length ${run.dist[target]}. Because a predecessor only changes on a strict improvement, ties keep the first path found.`,
  });
  return {
    id: 'dijkstra', topic: 't105a',
    title: inst.title || "Dijkstra's algorithm",
    statement: () => frag(
      `Use <b>Dijkstra’s algorithm</b> from source <b>${inst.source}</b>. Record the labels after each selected vertex, then recover a shortest path to <b>${target}</b>.`,
      dataTable(['Arc'].concat(inst.arcs.map((a) => `${a.u}→${a.v}`)), [['Length'].concat(inst.arcs.map((a) => a.w))], 'compact'),
    ),
    figure: figure(-1),
    rules: 'Select vertices alphabetically when labels tie. Change a predecessor only when its label strictly improves. A permanent (selected) vertex is never relabelled.',
    steps,
    wrapup: 'When a vertex is selected its label is final: any other route to it must leave the permanent set through a vertex with a label at least as large, and the remaining arcs have nonnegative length. A single negative length breaks this argument.',
  };
}

export default {
  id: 'dijkstra',
  title: "Dijkstra's algorithm",
  topic: 't105a',
  blurb: 'Fill the label table iteration by iteration with the exam tie rules, then recover the path from predecessors.',
  minutes: 8,
  presets: [
    { id: 'lecture', label: 'Slides 105 example', make: () => ({ nodes: ['s', 'a', 'b', 'c', 'd', 't'], arcs: LECTURE, source: 's', target: 't', pos: { s: [0, 1], a: [1, 0], b: [1, 2], c: [2.4, 0], d: [2.4, 2], t: [3.4, 1] }, title: "Dijkstra — slides 105 example" }) },
    { id: 'ex1', label: 'Solved exercise 1', make: () => ({ nodes: ['s', 'a', 'b', 'c', 'd', 't'], arcs: EX1, source: 's', target: 't', layout: 'ex1', title: 'Dijkstra — solved exercise 1' }) },
    { id: 'ex1b', label: 'Solved exercise 1B (reversed arcs)', make: () => ({ nodes: ['s', 'a', 'b', 'c', 'd', 't'], arcs: reverseArcs(EX1), source: 't', target: 's', layout: 'ex1', title: 'Dijkstra — solved exercise 1B (every arc reversed, start at t)' }) },
  ],
  random: (rng, level) => ({ ...randomInstance(rng, level), title: "Dijkstra's algorithm — practice instance" }),
  build,
  custom: {
    help: 'One arc per line: <code>from to length</code>. Lengths must be nonnegative. Vertices are single letters.',
    fields: [
      { key: 'arcs', label: 'Arcs', kind: 'textarea', value: 's a 4\ns b 2\nb a 1\na c 4\nb c 5\nb d 7\nc d 1\nc t 5\nd t 2' },
      { key: 'source', label: 'Source', kind: 'text', value: 's' },
      { key: 'target', label: 'Target', kind: 'text', value: 't' },
    ],
    parse(v) {
      const arcs = parseTriples(v.arcs);
      if (arcs.some((a) => a.w < 0)) throw new Error('Dijkstra needs nonnegative lengths.');
      const names = [...new Set(arcs.flatMap((a) => [a.u, a.v]))];
      if (names.some((x) => x.length !== 1)) throw new Error('Use single-letter vertex names.');
      const source = v.source.trim().toLowerCase(), target = v.target.trim().toLowerCase();
      if (!names.includes(source) || !names.includes(target)) throw new Error('Source and target must appear in the arc list.');
      const nodes = [source].concat(names.filter((x) => x !== source && x !== target).sort(), [target]);
      const run = dijkstra([...nodes].sort(), arcs, source);
      if (run.dist[target] === Infinity) throw new Error('The target is not reachable from the source.');
      return { nodes, arcs, source, target, title: "Dijkstra's algorithm — your instance" };
    },
  },
};
