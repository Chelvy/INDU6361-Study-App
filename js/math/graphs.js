// Step-by-step traces of the "well-solved problem" algorithms, with the tie rules used in the course
// (lecture 105 and the solved exercises 10E).
import { Frac, ZERO } from './frac.js';

const fr = (v) => Frac.of(v);

// ---------------------------------------------------------------- Dijkstra
// nodes: names in tie-break order. arcs: [{u, v, w}] directed, w >= 0.
// Tie rule: among equal smallest labels pick the earliest name in `nodes`.
// A predecessor changes only when the label strictly improves; settled vertices are never relabelled.
export function dijkstra(nodes, arcs, source) {
  for (const a of arcs) if (a.w < 0) throw new Error('Dijkstra needs nonnegative lengths');
  const dist = {}; const pred = {};
  nodes.forEach((v) => { dist[v] = Infinity; pred[v] = null; });
  dist[source] = 0;
  const settled = new Set();
  const steps = [];
  const out = {};
  nodes.forEach((v) => { out[v] = []; });
  arcs.forEach((a) => out[a.u].push(a));
  for (;;) {
    let u = null;
    for (const v of nodes) {
      if (settled.has(v) || dist[v] === Infinity) continue;
      if (u === null || dist[v] < dist[u]) u = v;
    }
    if (u === null) break;
    settled.add(u);
    const relax = [];
    for (const a of out[u]) {
      const cand = dist[u] + a.w;
      if (settled.has(a.v)) { relax.push({ u, v: a.v, w: a.w, cand, old: dist[a.v], updated: false, skipped: true }); continue; }
      const old = dist[a.v];
      const updated = cand < old;
      if (updated) { dist[a.v] = cand; pred[a.v] = u; }
      relax.push({ u, v: a.v, w: a.w, cand, old, updated, skipped: false });
    }
    steps.push({ selected: u, label: dist[u], relax, dist: { ...dist }, pred: { ...pred }, settled: [...settled] });
  }
  const pathTo = (t) => {
    if (dist[t] === Infinity) return null;
    const p = [t];
    while (p[0] !== source) p.unshift(pred[p[0]]);
    return p;
  };
  return { steps, order: steps.map((s) => s.selected), dist, pred, pathTo };
}

// Reverse every arc (used in exercise 1B: shortest paths INTO a vertex).
export function reverseArcs(arcs) { return arcs.map((a) => ({ ...a, u: a.v, v: a.u })); }

// Brute-force all-pairs check (Floyd-Warshall), for tests.
export function floydWarshall(nodes, arcs) {
  const d = {};
  nodes.forEach((a) => { d[a] = {}; nodes.forEach((b) => { d[a][b] = a === b ? 0 : Infinity; }); });
  arcs.forEach((a) => { d[a.u][a.v] = Math.min(d[a.u][a.v], a.w); });
  for (const k of nodes) for (const i of nodes) for (const j of nodes) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

// ---------------------------------------------------------------- Kruskal / Prim
export function edgeName(u, v) { return u < v ? u + v : v + u; }

function sortedEdges(edges) {
  return edges
    .map((e) => ({ ...e, name: edgeName(e.u, e.v) }))
    .sort((a, b) => a.w - b.w || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

function componentsOf(nodes, comp) {
  const groups = new Map();
  nodes.forEach((v) => { const c = comp[v]; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(v); });
  return [...groups.values()].map((g) => g.slice().sort()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

function treePath(adj, from, to) {
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const x = queue.shift();
    if (x === to) break;
    for (const y of adj[x] || []) if (!(y in prev)) { prev[y] = x; queue.push(y); }
  }
  if (!(to in prev)) return null;
  const p = [to];
  while (prev[p[0]] !== null) p.unshift(prev[p[0]]);
  return p;
}

// Tie rule: equal weights are examined alphabetically by edge name ("ac" before "bc").
// Stops after n-1 accepted edges (or when the edges run out: minimum spanning forest).
export function kruskal(nodes, edges) {
  const order = sortedEdges(edges);
  const comp = {};
  nodes.forEach((v, i) => { comp[v] = i; });
  const adj = {};
  nodes.forEach((v) => { adj[v] = []; });
  const trace = [];
  const tree = [];
  let weight = 0;
  for (const e of order) {
    if (tree.length === nodes.length - 1) break;
    if (comp[e.u] === comp[e.v]) {
      const path = treePath(adj, e.u, e.v);
      trace.push({ edge: e.name, u: e.u, v: e.v, w: e.w, accept: false, cycle: path.concat([e.u]), components: componentsOf(nodes, comp), weight });
      continue;
    }
    const keep = comp[e.u], drop = comp[e.v];
    nodes.forEach((v) => { if (comp[v] === drop) comp[v] = keep; });
    adj[e.u].push(e.v); adj[e.v].push(e.u);
    tree.push(e.name);
    weight += e.w;
    trace.push({ edge: e.name, u: e.u, v: e.v, w: e.w, accept: true, components: componentsOf(nodes, comp), weight });
  }
  const connected = tree.length === nodes.length - 1;
  return { order: order.map((e) => e.name), sorted: order, trace, tree, weight, connected, unexamined: order.slice(trace.length).map((e) => e.name) };
}

// Start at `start`; repeatedly add the cheapest edge with exactly one reached endpoint (ties: edge name).
export function prim(nodes, edges, start) {
  const all = sortedEdges(edges);
  const reached = new Set([start]);
  const trace = [];
  let weight = 0;
  while (reached.size < nodes.length) {
    const crossing = all.filter((e) => reached.has(e.u) !== reached.has(e.v));
    if (!crossing.length) break;
    const e = crossing[0];
    reached.add(e.u); reached.add(e.v);
    weight += e.w;
    trace.push({ edge: e.name, w: e.w, crossing: crossing.map((c) => c.name), reached: nodes.filter((v) => reached.has(v)), weight });
  }
  return { trace, tree: trace.map((t) => t.edge), weight, connected: reached.size === nodes.length };
}

// All spanning trees whose weight equals the minimum (small graphs only), as lists of edge names.
export function listMinimumSpanningTrees(nodes, edges) {
  const E = sortedEdges(edges);
  const n = nodes.length;
  const target = kruskal(nodes, edges);
  if (!target.connected) return [];
  const index = Object.fromEntries(nodes.map((v, i) => [v, i]));
  const trees = [];
  const pick = [];
  const isTree = () => {
    const parent = nodes.map((_, i) => i);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (const k of pick) {
      const a = find(index[E[k].u]), b = find(index[E[k].v]);
      if (a === b) return false;
      parent[a] = b;
    }
    return true;
  };
  const rec = (start, w) => {
    if (w > target.weight) return;
    if (pick.length === n - 1) { if (w === target.weight && isTree()) trees.push(pick.map((k) => E[k].name)); return; }
    for (let i = start; i < E.length; i++) { pick.push(i); rec(i + 1, w + E[i].w); pick.pop(); }
  };
  rec(0, 0);
  return trees;
}

// 1 means the minimum spanning tree is unique.
export function countMinimumSpanningTrees(nodes, edges) { return listMinimumSpanningTrees(nodes, edges).length; }

// ---------------------------------------------------------------- Edmonds-Karp
// arcs: [{u, v, cap}]. BFS visits residual neighbours alphabetically and marks a vertex on first discovery;
// it stops as soon as the sink is discovered. Capacities are exact rationals.
export function edmondsKarp(nodes, arcs, s, t, opts = {}) {
  const cap = arcs.map((a) => fr(a.cap));
  const flow = arcs.map(() => ZERO);
  const augmentations = [];

  const bfs = (stopAtSink) => {
    const prev = { [s]: null };
    const order = [s];
    const queue = [s];
    let found = false;
    while (queue.length && !found) {
      const u = queue.shift();
      const moves = [];
      arcs.forEach((a, k) => {
        if (a.u === u && cap[k].sub(flow[k]).sign() > 0) moves.push({ to: a.v, k, kind: 'forward', residual: cap[k].sub(flow[k]) });
        if (a.v === u && flow[k].sign() > 0) moves.push({ to: a.u, k, kind: 'reverse', residual: flow[k] });
      });
      moves.sort((p, q) => (p.to < q.to ? -1 : p.to > q.to ? 1 : (p.kind === q.kind ? p.k - q.k : p.kind === 'forward' ? -1 : 1)));
      for (const m of moves) {
        if (m.to in prev) continue;
        prev[m.to] = { from: u, ...m };
        order.push(m.to);
        queue.push(m.to);
        if (stopAtSink && m.to === t) { found = true; break; }
      }
    }
    return { prev, order };
  };

  let value = ZERO;
  const limit = opts.maxAugmentations || 200;
  for (let it = 0; it < limit; it++) {
    const { prev, order } = bfs(true);
    if (!(t in prev)) break;
    const steps = [];
    let x = t;
    while (prev[x] !== null) { steps.unshift({ ...prev[x], to: x }); x = prev[x].from; }
    let delta = steps[0].residual;
    steps.forEach((st) => { if (st.residual.lt(delta)) delta = st.residual; });
    steps.forEach((st) => { flow[st.k] = st.kind === 'forward' ? flow[st.k].add(delta) : flow[st.k].sub(delta); });
    value = value.add(delta);
    augmentations.push({
      bfsOrder: order,
      path: [s].concat(steps.map((st) => st.to)),
      steps: steps.map((st) => ({ from: st.from, to: st.to, kind: st.kind, arc: st.k, residual: st.residual })),
      delta, value, flow: flow.slice(),
    });
  }
  const fin = bfs(false);
  const S = nodes.filter((v) => v in fin.prev);
  const inS = new Set(S);
  const cutArcs = [];
  let cutCapacity = ZERO;
  arcs.forEach((a, k) => { if (inS.has(a.u) && !inS.has(a.v)) { cutArcs.push(k); cutCapacity = cutCapacity.add(cap[k]); } });
  return { augmentations, flow, value, S, cutArcs, cutCapacity, finalBfsOrder: fin.order, cap };
}

// Capacity of the cut (S, V \ S): sum of capacities of arcs leaving S.
export function cutCapacity(arcs, S) {
  const inS = new Set(S);
  return arcs.reduce((acc, a) => (inS.has(a.u) && !inS.has(a.v) ? acc.add(fr(a.cap)) : acc), ZERO);
}

// Brute-force minimum s-t cut over all vertex subsets (small graphs), for tests and for "check a cut" drills.
export function minCutBrute(nodes, arcs, s, t) {
  const others = nodes.filter((v) => v !== s && v !== t);
  let best = null;
  for (let mask = 0; mask < 1 << others.length; mask++) {
    const S = [s].concat(others.filter((_, i) => mask & (1 << i)));
    const c = cutCapacity(arcs, S);
    if (best === null || c.lt(best.capacity)) best = { S, capacity: c };
  }
  return best;
}

// ---------------------------------------------------------------- Hungarian method
// Follows the classroom procedure (exercise 4 / lab 105c): row reduction, column reduction, then assign
// workers in numerical order by BFS over zero reduced costs (jobs visited numerically); on a stalled
// search update labels with Delta = min over reached rows / unreached columns and search again.
export function hungarian(cost) {
  const n = cost.length;
  const u = cost.map((row) => Math.min(...row));
  let v = new Array(n).fill(0);
  const reducedNow = () => cost.map((row, i) => row.map((c, j) => c - u[i] - v[j]));
  const events = [];
  events.push({ type: 'rows', u: u.slice(), reduced: reducedNow(), lb: u.reduce((a, b) => a + b, 0) });
  const afterRows = reducedNow();
  v = v.map((_, j) => Math.min(...afterRows.map((row) => row[j])));
  const lb0 = u.reduce((a, b) => a + b, 0) + v.reduce((a, b) => a + b, 0);
  events.push({ type: 'cols', v: v.slice(), reduced: reducedNow(), lb: lb0 });

  const jobOf = new Array(n).fill(-1);
  const workerOf = new Array(n).fill(-1);
  for (let root = 0; root < n; root++) {
    let guard = 0;
    while (jobOf[root] === -1) {
      if (++guard > 4 * n * n) throw new Error('Hungarian method did not terminate');
      const S = new Array(n).fill(false);
      const T = new Array(n).fill(false);
      S[root] = true;
      const prevWorker = new Array(n).fill(-1);
      const queue = [root];
      let qi = 0;
      let freeJob = -1;
      const visits = [];
      while (qi < queue.length && freeJob === -1) {
        const i = queue[qi++];
        for (let j = 0; j < n; j++) {
          if (T[j] || cost[i][j] - u[i] - v[j] !== 0) continue;
          T[j] = true;
          prevWorker[j] = i;
          visits.push({ worker: i, job: j, occupiedBy: workerOf[j] });
          if (workerOf[j] === -1) { freeJob = j; break; }
          const other = workerOf[j];
          if (!S[other]) { S[other] = true; queue.push(other); }
        }
      }
      if (freeJob !== -1) {
        const pairs = [];
        let j = freeJob;
        while (j !== -1) {
          const i = prevWorker[j];
          const old = jobOf[i];
          pairs.unshift([i, j]);
          jobOf[i] = j;
          workerOf[j] = i;
          j = old;
        }
        // alternating path as W.. J.. W.. J.. starting from the root worker
        const path = [];
        pairs.forEach(([i, jj]) => { path.push({ kind: 'W', index: i }); path.push({ kind: 'J', index: jj }); });
        events.push({ type: 'augment', root, visits, path, pairs, jobOf: jobOf.slice() });
      } else {
        let delta = Infinity;
        for (let i = 0; i < n; i++) if (S[i]) for (let j = 0; j < n; j++) if (!T[j]) delta = Math.min(delta, cost[i][j] - u[i] - v[j]);
        const before = reducedNow();
        for (let i = 0; i < n; i++) if (S[i]) u[i] += delta;
        for (let j = 0; j < n; j++) if (T[j]) v[j] -= delta;
        events.push({
          type: 'stall', root, visits,
          S: S.map((b, i) => (b ? i : -1)).filter((i) => i >= 0),
          T: T.map((b, j) => (b ? j : -1)).filter((j) => j >= 0),
          delta, before, u: u.slice(), v: v.slice(), reduced: reducedNow(),
          lb: u.reduce((a, b) => a + b, 0) + v.reduce((a, b) => a + b, 0),
        });
      }
    }
  }
  const total = jobOf.reduce((acc, j, i) => acc + cost[i][j], 0);
  return { events, jobOf, cost: total, u, v, lb: u.reduce((a, b) => a + b, 0) + v.reduce((a, b) => a + b, 0), reduced: reducedNow() };
}

// Brute-force optimal assignment cost over all permutations (n <= 7), for tests.
export function assignmentBrute(cost) {
  const n = cost.length;
  let best = Infinity;
  const used = new Array(n).fill(false);
  const rec = (i, acc) => {
    if (acc >= best) return;
    if (i === n) { best = acc; return; }
    for (let j = 0; j < n; j++) if (!used[j]) { used[j] = true; rec(i + 1, acc + cost[i][j]); used[j] = false; }
  };
  rec(0, 0);
  return best;
}
