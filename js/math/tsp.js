// Directed TSP helpers for lectures 201-203: cycle covers, subtour rows, row generation and min-cut separation.
import { Frac, ZERO, ONE } from './frac.js';
import { edmondsKarp } from './graphs.js';

const fr = (v) => Frac.of(v);

// succ: array where succ[i] is the successor of vertex i (vertices 1..n, index 0 unused).
// Cycles are listed starting from the smallest unvisited vertex, as in lab 202a.
export function cyclesFromSuccessor(succ) {
  const n = succ.length - 1;
  const seen = new Array(n + 1).fill(false);
  const cycles = [];
  for (let s = 1; s <= n; s++) {
    if (seen[s]) continue;
    const cyc = [];
    let v = s;
    while (!seen[v]) { seen[v] = true; cyc.push(v); v = succ[v]; }
    cycles.push(cyc);
  }
  return cycles;
}

// Number of subset rows with 2 <= |S| <= n-1 (slides 201): 2^n - n - 2.
export function subtourRowCount(n) { return 2 ** n - n - 2; }

// sum of x over arcs leaving S.
export function outflow(x, S, n) {
  const inS = new Set(S);
  let tot = ZERO;
  for (const i of S) for (let j = 1; j <= n; j++) if (!inS.has(j) && j !== i) tot = tot.add(fr(x[i][j] || 0));
  return tot;
}
// sum of x over arcs with both ends in S.
export function internal(x, S) {
  let tot = ZERO;
  for (const i of S) for (const j of S) if (i !== j) tot = tot.add(fr(x[i][j] || 0));
  return tot;
}

export function tourCost(cost, succ) {
  let c = 0;
  for (let i = 1; i < succ.length; i++) c += cost[i][succ[i]];
  return c;
}

// Minimum-cost cycle cover (assignment without self-loops) subject to extra subtour rows.
// rows: array of vertex sets S; a permutation is allowed only if every S has fewer than |S| internal arcs.
// Enumerative (n <= 8). Ties are broken lexicographically on the successor list so traces are reproducible.
export function solveMaster(cost, rows = []) {
  const n = cost.length - 1;
  let best = null;
  const succ = new Array(n + 1).fill(0);
  const used = new Array(n + 1).fill(false);
  const feasible = () => rows.every((S) => {
    const inS = new Set(S);
    let cnt = 0;
    for (const i of S) if (inS.has(succ[i])) cnt++;
    return cnt <= S.length - 1;
  });
  const rec = (i, acc) => {
    if (best !== null && acc > best.cost) return;
    if (i > n) {
      if (!feasible()) return;
      if (best === null || acc < best.cost - 1e-12) best = { cost: acc, succ: succ.slice() };
      return;
    }
    for (let j = 1; j <= n; j++) {
      if (j === i || used[j]) continue;
      used[j] = true; succ[i] = j;
      rec(i + 1, acc + cost[i][j]);
      used[j] = false;
    }
  };
  rec(1, 0);
  return best;
}

// Row generation of lecture 202: solve the master, pick a shortest proper cycle (ties: smallest vertex), add its row, repeat.
export function rowGeneration(cost, maxIter = 50) {
  const rows = [];
  const history = [];
  for (let it = 0; it < maxIter; it++) {
    const sol = solveMaster(cost, rows);
    if (!sol) return { history, rows, status: 'infeasible' };
    const cycles = cyclesFromSuccessor(sol.succ);
    const entry = { objective: sol.cost, succ: sol.succ, cycles, added: null };
    history.push(entry);
    if (cycles.length === 1) return { history, rows, status: 'optimal', tour: cycles[0], cost: sol.cost };
    const pick = cycles.slice().sort((a, b) => a.length - b.length || Math.min(...a) - Math.min(...b))[0];
    const S = pick.slice().sort((a, b) => a - b);
    rows.push(S);
    entry.added = S;
  }
  return { history, rows, status: 'iteration-limit' };
}

// Optimal tour by enumeration (n <= 9), for checking.
export function tspBrute(cost) {
  const n = cost.length - 1;
  let best = null;
  const order = [1];
  const used = new Array(n + 1).fill(false);
  used[1] = true;
  const rec = (acc) => {
    if (best !== null && acc >= best.cost) return;
    if (order.length === n) {
      const total = acc + cost[order[n - 1]][1];
      if (best === null || total < best.cost) best = { cost: total, tour: order.slice() };
      return;
    }
    const last = order[order.length - 1];
    for (let j = 2; j <= n; j++) {
      if (used[j]) continue;
      used[j] = true; order.push(j);
      rec(acc + cost[last][j]);
      order.pop(); used[j] = false;
    }
  };
  rec(0);
  return best;
}

/**
 * Fractional subtour separation (lecture 203): treat xbar_ij as capacities, fix a root r and for each t != r
 * compute a minimum directed r-t cut. A cut below 1 gives a violated row x(delta+(S)) >= 1.
 * x: (n+1) x (n+1) matrix of Frac-compatible values. Returns the per-target cuts and the most violated one.
 */
export function separateSubtour(x, n, root = 1) {
  const nodes = Array.from({ length: n }, (_, i) => String(i + 1));
  const arcs = [];
  for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) {
    if (i === j) continue;
    const v = fr(x[i][j] || 0);
    if (v.sign() > 0) arcs.push({ u: String(i), v: String(j), cap: v });
  }
  const perTarget = [];
  let best = null;
  for (let t = 1; t <= n; t++) {
    if (t === root) continue;
    // Order the node list so that BFS tie-breaking is by vertex number.
    const r = edmondsKarp(nodes, arcs, String(root), String(t));
    const S = r.S.map(Number).sort((a, b) => a - b);
    const entry = { t, capacity: r.value, S };
    perTarget.push(entry);
    if (best === null || r.value.lt(best.capacity)) best = entry;
  }
  return { perTarget, best, violated: best !== null && best.capacity.lt(ONE), violation: best ? ONE.sub(best.capacity) : null };
}

// MTZ row for arc (i, j), i, j != 1:  u_i - u_j + (n - 1) x_ij <= n - 2.
export function mtzRow(n, ui, uj, xij) {
  const lhs = fr(ui).sub(fr(uj)).add(fr(n - 1).mul(fr(xij)));
  return { lhs, rhs: fr(n - 2), ok: lhs.le(fr(n - 2)) };
}

// Positions u for a tour given as a visiting order starting at vertex 1: u = 2..n along the tour.
export function mtzPositions(order) {
  const u = {};
  order.forEach((v, k) => { if (k > 0) u[v] = k + 1; });
  return u;
}

export function degreeCheck(x, n) {
  const out = []; const inn = [];
  for (let i = 1; i <= n; i++) {
    let o = ZERO, d = ZERO;
    for (let j = 1; j <= n; j++) if (i !== j) { o = o.add(fr(x[i][j] || 0)); d = d.add(fr(x[j][i] || 0)); }
    out[i] = o; inn[i] = d;
  }
  return { out, inn, ok: out.slice(1).every((v) => v.eq(ONE)) && inn.slice(1).every((v) => v.eq(ONE)) };
}
