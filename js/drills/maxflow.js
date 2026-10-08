// Edmonds-Karp trainer (slides 105; solved exercises 3 and 3B; lab 105c).
import { edmondsKarp } from '../math/graphs.js';
import { Frac, ZERO } from '../math/frac.js';
import { graphFigure, LAYOUTS, circleLayout } from '../viz.js';
import { setText, pathText, dataTable, frag, ul, generateUntil, parseTriples } from './common.js';

const C = (list) => list.map(([u, v, cap, t]) => ({ u, v, cap, t }));
const N6 = ['s', 'a', 'b', 'c', 'd', 't'];
const UNIT = C([['s', 'a', 1], ['s', 'b', 1], ['a', 'c', 1], ['a', 'd', 1], ['b', 'c', 1], ['c', 't', 1], ['d', 't', 1]]);
const EX3 = C([['s', 'a', 3], ['s', 'b', 2], ['a', 'c', 4], ['a', 'd', 2, 0.3], ['b', 'c', 2, 0.3], ['c', 't', 3], ['d', 't', 2]]);
const EX3B = C([['s', 'a', 5], ['s', 'b', 4], ['a', 'c', 4], ['a', 'd', 2, 0.35], ['c', 'd', 2], ['c', 't', 3], ['b', 'd', 4], ['d', 't', 5]]);
const LAB = C([['s', 'a', 2], ['s', 'b', 1], ['a', 'c', 3], ['a', 'd', 1], ['b', 'c', 1], ['c', 't', 2], ['d', 't', 1]]);
const POS_MID = { s: [0, 1], a: [1.1, 1], c: [2.3, 1], t: [3.4, 1], b: [1.7, 0], d: [1.7, 2] };

const arcName = (a) => a.u + a.v;

function randomInstance(rng, level) {
  const make = () => {
    const cap = () => rng.int(1, level === 1 ? 4 : 6);
    const arcs = [{ u: 's', v: 'a', cap: cap() + 1 }, { u: 's', v: 'b', cap: cap() }, { u: 'a', v: 'c', cap: cap() + 1 }, { u: 'b', v: 'd', cap: cap() }, { u: 'c', v: 't', cap: cap() }, { u: 'd', v: 't', cap: cap() }];
    const extra = rng.shuffle([{ u: 'a', v: 'd', t: 0.3 }, { u: 'b', v: 'c', t: 0.3 }, { u: 'c', v: 'd' }, { u: 'a', v: 'b' }]).slice(0, rng.int(1, 2));
    if (extra.some((e) => e.u === 'a' && e.v === 'd') && extra.some((e) => e.u === 'b' && e.v === 'c')) extra.pop();
    extra.forEach((e) => arcs.push({ ...e, cap: cap() }));
    // optionally drop b->d so that flow must be rerouted
    if (rng.bool(0.5)) { const i = arcs.findIndex((a) => a.u === 'b' && a.v === 'd'); if (arcs.some((a) => a.u === 'b' && a.v === 'c')) arcs.splice(i, 1); }
    return arcs;
  };
  const accept = (arcs) => {
    const r = edmondsKarp(N6, arcs, 's', 't');
    const k = r.augmentations.length;
    const usesReverse = r.augmentations.some((x) => x.steps.some((st) => st.kind === 'reverse'));
    if (k < 2 || k > (level >= 3 ? 5 : 4)) return false;
    if (level === 1) return !usesReverse;
    if (level >= 2) return usesReverse;
    return true;
  };
  return generateUntil(rng, make, accept, 2000);
}

function build(inst) {
  const { nodes, arcs } = inst;
  const s = inst.source || 's', t = inst.sink || 't';
  const r = edmondsKarp(nodes, arcs, s, t);
  const pos = inst.pos || LAYOUTS[inst.layout] || circleLayout(nodes);
  const flowFigure = (flow, cutSet, hlPath) => () => {
    const inS = cutSet ? new Set(cutSet) : null;
    const onPath = new Set();
    if (hlPath) hlPath.forEach((st) => onPath.add(st.arc));
    return graphFigure({
      nodes, pos, directed: true,
      edges: arcs.map((a, k) => ({
        u: a.u, v: a.v, t: a.t, label: `${flow[k].pretty()}/${a.cap}`,
        cls: inS && inS.has(a.u) && !inS.has(a.v) ? 'hl' : onPath.has(k) ? 'hl' : flow[k].sign() > 0 ? 'sel' : '',
      })),
      nodeCls: inS ? Object.fromEntries(nodes.map((v) => [v, inS.has(v) ? 'settled' : ''])) : null,
      caption: cutSet ? 'Arc labels: flow / capacity. Filled vertices: source side S. Orange: cut arcs.' : 'Arc labels: flow / capacity. Blue: positive flow.',
    });
  };
  const zero = arcs.map(() => ZERO);
  const residualTable = (flow) => dataTable(
    ['Original arc', 'Flow / capacity', 'Forward residual', 'Reverse residual'],
    arcs.map((a, k) => [`${a.u}→${a.v}`, `${flow[k].pretty()}/${a.cap}`, Frac.of(a.cap).sub(flow[k]).pretty(), `$r_{${a.v}${a.u}}=${flow[k].pretty()}$`]),
  );
  const steps = [];
  r.augmentations.forEach((aug, k) => {
    const before = k === 0 ? zero : r.augmentations[k - 1].flow;
    const valueBefore = k === 0 ? ZERO : r.augmentations[k - 1].value;
    const resid = (u, v) => {
      let tot = ZERO;
      arcs.forEach((a, i) => {
        if (a.u === u && a.v === v) tot = tot.add(Frac.of(a.cap).sub(before[i]));
        if (a.v === u && a.u === v) tot = tot.add(before[i]);
      });
      return tot;
    };
    const check = (toks) => {
      if (toks.length < 2 || toks[0] !== s || toks[toks.length - 1] !== t) return null;
      if (new Set(toks).size !== toks.length) return null;
      for (let i = 0; i + 1 < toks.length; i++) if (!nodes.includes(toks[i]) || !nodes.includes(toks[i + 1]) || resid(toks[i], toks[i + 1]).sign() <= 0) return { ok: false, score: 0, msg: `${toks[i]}→${toks[i + 1]} has no positive residual capacity at this point.` };
      if (toks.length === aug.path.length) return { ok: false, score: 0.5, msg: 'That is an augmenting path with the fewest arcs, but BFS with alphabetical neighbour order discovers a different one first.' };
      return { ok: false, score: 0.25, msg: 'That path has positive residual capacity, but Edmonds–Karp uses a path with the fewest arcs (BFS).' };
    };
    steps.push({
      title: `Augmenting path ${k + 1}`,
      text: () => frag(
        k === 0 ? 'Every flow is zero, so each residual capacity equals the arc capacity. Run BFS from the source.'
          : frag(`Current flow value: ${valueBefore.pretty()}. Residual capacities (forward $c_{uv}-f_{uv}$, reverse $f_{uv}$):`, residualTable(before)),
        'Give the path BFS finds, its bottleneck, and the flow value after augmenting.',
      ),
      figure: k === 0 ? null : flowFigure(before),
      fields: [
        { type: 'seq', label: 'BFS augmenting path', answer: aug.path, chars: true, check, placeholder: `e.g. ${s}-a-c-${t}` },
        { type: 'num', label: 'Bottleneck $\\delta$', answer: aug.delta },
        { type: 'num', label: 'Flow value after the augmentation', answer: aug.value },
      ],
      explain: () => frag(
        ul([
          `BFS discovers the vertices in the order ${aug.bfsOrder.join(', ')} and stops when it reaches ${t}.`,
          `Path: <b>${pathText(aug.path)}</b>; residual capacities along it: ${aug.steps.map((st) => st.residual.pretty()).join(', ')}, so $\\delta=${aug.delta.pretty()}$.`,
          ...aug.steps.filter((st) => st.kind === 'reverse').map((st) => `The step ${st.from}→${st.to} is a <b>reverse</b> arc: it cancels ${aug.delta.pretty()} unit(s) of the flow on ${st.to}→${st.from}.`),
          `New flow value: ${valueBefore.pretty()} + ${aug.delta.pretty()} = ${aug.value.pretty()}.`,
        ]),
        flowFigure(aug.flow, null, aug.steps)(),
      ),
    });
  });
  const cutNames = r.cutArcs.map((k) => arcName(arcs[k]));
  steps.push({
    title: 'Stopping and the minimum cut',
    text: () => frag(`Flow value is now ${r.value.pretty()}. Run BFS once more in the residual network.`, residualTable(r.flow)),
    figure: flowFigure(r.flow),
    fields: [
      { type: 'set', label: 'Vertices reachable from the source (the set $S$)', answer: r.S, chars: true, placeholder: 'e.g. s, a' },
      { type: 'set', label: 'Original arcs leaving $S$ (the cut arcs)', answer: cutNames, placeholder: 'e.g. sa, sb' },
      { type: 'num', label: 'Capacity of this cut', answer: r.cutCapacity },
    ],
    explain: () => frag(
      `BFS reaches $S=${'\\{'}${r.S.join(', ')}${'\\}'}$ and not ${t}, so no augmenting path remains. Every original arc leaving $S$ is saturated and every arc entering $S$ carries zero flow: the cut arcs are ${cutNames.join(', ')} with capacity ${r.cutArcs.map((k) => arcs[k].cap).join(' + ')} = ${r.cutCapacity.pretty()}. Flow value equals cut capacity, which proves both are optimal (max-flow/min-cut).`,
      flowFigure(r.flow, r.S)(),
    ),
  });
  steps.push({
    title: 'Final flows',
    text: 'Report the final flow on every original arc.',
    fields: [{
      type: 'table', label: 'Flow on each arc',
      columns: arcs.map((a) => ({ key: arcName(a), head: `${a.u}→${a.v}`, kind: 'num', plain: arcName(a) })),
      rows: [{ cells: Object.fromEntries(arcs.map((a, k) => [arcName(a), r.flow[k]])) }],
    }],
    explain: () => {
      const cons = nodes.filter((v) => v !== s && v !== t).map((v) => {
        const inn = arcs.map((a, k) => (a.v === v ? r.flow[k] : null)).filter((x) => x !== null);
        const out = arcs.map((a, k) => (a.u === v ? r.flow[k] : null)).filter((x) => x !== null);
        return `${v}: in ${inn.map((x) => x.pretty()).join(' + ') || 0} = out ${out.map((x) => x.pretty()).join(' + ') || 0}`;
      });
      return `Flow conservation holds at every intermediate vertex — ${cons.join('; ')}. The sink receives ${r.value.pretty()} units.`;
    },
  });
  return {
    id: 'maxflow', topic: 't105c', title: inst.title || 'Edmonds–Karp maximum flow',
    statement: () => frag(
      `Find a <b>maximum flow</b> from ${s} to ${t} with the Edmonds–Karp algorithm, starting from zero flow. For each BFS path give the bottleneck; finish with the final flows and a minimum cut.`,
      dataTable(['Arc'].concat(arcs.map((a) => `${a.u}→${a.v}`)), [['Capacity'].concat(arcs.map((a) => a.cap))], 'compact'),
    ),
    figure: flowFigure(zero),
    rules: 'BFS visits residual neighbours alphabetically and marks a vertex on first discovery. Use only positive residual capacities. “Shortest” means fewest arcs.',
    steps,
    wrapup: 'Reverse residual arcs let a later path cancel flow sent earlier. At termination the vertices reachable in the residual network form the source side of a minimum cut.',
  };
}

export default {
  id: 'maxflow', title: 'Edmonds–Karp maximum flow', topic: 't105c', minutes: 9,
  blurb: 'BFS augmenting paths, bottlenecks, reverse arcs, final flows and the minimum-cut certificate.',
  presets: [
    { id: 'ex3', label: 'Solved exercise 3', make: () => ({ nodes: N6, arcs: EX3, layout: 'six', title: 'Edmonds–Karp — solved exercise 3' }) },
    { id: 'ex3b', label: 'Solved exercise 3B', make: () => ({ nodes: N6, arcs: EX3B, layout: 'six', title: 'Edmonds–Karp — solved exercise 3B' }) },
    { id: 'unit', label: 'Slides 105 unit-capacity network', make: () => ({ nodes: N6, arcs: UNIT, pos: POS_MID, title: 'Edmonds–Karp — slides 105 example' }) },
    { id: 'lab', label: 'Lab 105c data', make: () => ({ nodes: N6, arcs: LAB, pos: POS_MID, title: 'Edmonds–Karp — lab 105c data' }) },
  ],
  random: (rng, level) => ({ nodes: N6, arcs: randomInstance(rng, level), layout: 'six', title: 'Edmonds–Karp — practice instance' }),
  build,
  custom: {
    help: 'One arc per line: <code>from to capacity</code>. The source must be <code>s</code> and the sink <code>t</code>.',
    fields: [{ key: 'arcs', label: 'Arcs', kind: 'textarea', value: 's a 3\ns b 2\na c 4\na d 2\nb c 2\nc t 3\nd t 2' }],
    parse(v) {
      const raw = parseTriples(v.arcs);
      if (raw.some((a) => a.w <= 0)) throw new Error('Capacities must be positive.');
      const names = [...new Set(raw.flatMap((a) => [a.u, a.v]))];
      if (!names.includes('s') || !names.includes('t')) throw new Error('Name the source s and the sink t.');
      if (names.some((x) => x.length !== 1)) throw new Error('Use single-letter vertex names.');
      const nodes = ['s'].concat(names.filter((x) => x !== 's' && x !== 't').sort(), ['t']);
      const arcs = raw.map((a) => ({ u: a.u, v: a.v, cap: a.w }));
      const r = edmondsKarp(nodes, arcs, 's', 't');
      if (r.augmentations.length === 0) throw new Error('No flow can be sent from s to t.');
      if (r.augmentations.length > 8) throw new Error('This instance needs more than 8 augmentations; try smaller capacities.');
      return { nodes, arcs, title: 'Edmonds–Karp — your instance' };
    },
  },
};
