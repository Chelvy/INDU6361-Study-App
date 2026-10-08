// 0-1 knapsack: dynamic programme (lecture 105) and the cover / lifting machinery of lecture 206.
import { Frac, ZERO, ONE } from './frac.js';

const fr = (v) => Frac.of(v);

// F[i][c] = best profit using the first i items with capacity c. Items are 1-based in the output.
// Reconstruction tie rule (slides): if F(i,c) = F(i-1,c) skip item i.
export function knapsackDP(weights, profits, C) {
  const n = weights.length;
  const F = Array.from({ length: n + 1 }, () => new Array(C + 1).fill(0));
  const choice = Array.from({ length: n + 1 }, () => new Array(C + 1).fill(null));
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1], p = profits[i - 1];
    for (let c = 0; c <= C; c++) {
      const skip = F[i - 1][c];
      const take = w <= c ? p + F[i - 1][c - w] : null;
      F[i][c] = take === null ? skip : Math.max(skip, take);
      choice[i][c] = { skip, take, fits: w <= c };
    }
  }
  const items = [];
  const walk = [];
  let c = C;
  for (let i = n; i >= 1; i--) {
    if (F[i][c] > F[i - 1][c]) {
      walk.push({ i, c, take: true, value: F[i][c], above: F[i - 1][c], next: c - weights[i - 1] });
      items.unshift(i);
      c -= weights[i - 1];
    } else walk.push({ i, c, take: false, value: F[i][c], above: F[i - 1][c], next: c });
  }
  return {
    F, choice, value: F[n][C], items, walk,
    weight: items.reduce((s, i) => s + weights[i - 1], 0),
  };
}

// One-row version: D after each item, capacities processed in DESCENDING order.
export function knapsackOneRow(weights, profits, C, ascending = false) {
  const D = new Array(C + 1).fill(0);
  const rows = [];
  weights.forEach((w, k) => {
    if (ascending) for (let c = w; c <= C; c++) D[c] = Math.max(D[c], profits[k] + D[c - w]);
    else for (let c = C; c >= w; c--) D[c] = Math.max(D[c], profits[k] + D[c - w]);
    rows.push(D.slice());
  });
  return { rows, value: D[C] };
}

// All optimal subsets (as sorted 1-based item lists), by enumeration; n <= 15.
export function knapsackAllOptima(weights, profits, C) {
  const n = weights.length;
  let best = -1; let sets = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    let w = 0, p = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { w += weights[i]; p += profits[i]; }
    if (w > C) continue;
    if (p > best) { best = p; sets = []; }
    if (p === best) sets.push(Array.from({ length: n }, (_, i) => i + 1).filter((i) => mask & (1 << (i - 1))));
  }
  sets.sort((p, q) => p.join(',').localeCompare(q.join(',')));
  return { value: best, sets };
}

// LP relaxation of max c.x, a.x <= b, 0 <= x <= 1: greedy by ratio c_j/a_j (ties: lower index first).
export function knapsackLP(a, c, b) {
  const n = a.length;
  const order = Array.from({ length: n }, (_, j) => j).sort((p, q) => {
    const cmp = fr(c[q]).div(fr(a[q])).cmp(fr(c[p]).div(fr(a[p])));
    return cmp !== 0 ? cmp : p - q;
  });
  const x = new Array(n).fill(ZERO);
  let cap = fr(b);
  let value = ZERO;
  let critical = -1;
  for (const j of order) {
    if (cap.sign() <= 0) break;
    const aj = fr(a[j]);
    if (aj.le(cap)) { x[j] = ONE; cap = cap.sub(aj); value = value.add(fr(c[j])); }
    else { x[j] = cap.div(aj); value = value.add(fr(c[j]).mul(x[j])); cap = ZERO; critical = j; }
  }
  return { x, value, order, critical };
}

const subsetSum = (a, set) => set.reduce((s, j) => s + a[j], 0);

// Sets are arrays of 0-based item indices.
export function isCover(a, b, set) { return subsetSum(a, set) > b; }
export function isMinimalCover(a, b, set) {
  if (!isCover(a, b, set)) return false;
  return set.every((j) => subsetSum(a, set) - a[j] <= b);
}
export function minimalCovers(a, b) {
  const n = a.length;
  const out = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const set = [];
    for (let j = 0; j < n; j++) if (mask & (1 << j)) set.push(j);
    if (isMinimalCover(a, b, set)) out.push(set);
  }
  return out.sort((p, q) => p.length - q.length || p.join(',').localeCompare(q.join(',')));
}
// E(C) = C plus every item at least as heavy as the heaviest item of C.
export function extendedCover(a, set) {
  const M = Math.max(...set.map((j) => a[j]));
  const ext = a.map((_, j) => j).filter((j) => set.includes(j) || a[j] >= M);
  return ext;
}

// Cover separation (slides 206): min sum (1 - xbar_j) z_j  s.t.  sum a_j z_j >= b + 1, z binary.
// A value below 1 identifies a violated cover inequality. Enumerative; integer weights.
export function coverSeparation(a, b, xbar) {
  const n = a.length;
  const xb = xbar.map(fr);
  let best = null;
  for (let mask = 1; mask < 1 << n; mask++) {
    let w = 0;
    let val = ZERO;
    const set = [];
    for (let j = 0; j < n; j++) if (mask & (1 << j)) { w += a[j]; val = val.add(ONE.sub(xb[j])); set.push(j); }
    if (w < b + 1) continue;
    if (best === null || val.lt(best.value) || (val.eq(best.value) && set.length < best.cover.length)) best = { cover: set, value: val };
  }
  if (!best) return null;
  const lhs = best.cover.reduce((s, j) => s.add(xb[j]), ZERO);
  return { ...best, lhs, rhs: best.cover.length - 1, violated: best.value.lt(ONE) };
}

export function knapsackPoints(a, b) {
  const n = a.length;
  const pts = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    let w = 0;
    const x = new Array(n).fill(0);
    for (let j = 0; j < n; j++) if (mask & (1 << j)) { w += a[j]; x[j] = 1; }
    if (w <= b) pts.push(x);
  }
  return pts;
}

// Is sum coef_j x_j <= beta valid for the knapsack set?
export function isValidForKnapsack(coef, beta, a, b) {
  const cf = coef.map(fr); const be = fr(beta);
  return knapsackPoints(a, b).every((x) => x.reduce((s, xj, j) => (xj ? s.add(cf[j]) : s), ZERO).le(be));
}

// Sequential lifting coefficient for variable k (slides 206):
// alpha_k = beta - max{ sum coef_j x_j : x in X, x_k = 1 }.  Returns null if no feasible point has x_k = 1.
export function liftCoefficient(a, b, coef, beta, k) {
  const cf = coef.map(fr);
  let best = null;
  let arg = null;
  for (const x of knapsackPoints(a, b)) {
    if (!x[k]) continue;
    const v = x.reduce((s, xj, j) => (xj && j !== k ? s.add(cf[j]) : s), ZERO);
    if (best === null || v.gt(best)) { best = v; arg = x; }
  }
  if (best === null) return null;
  return { alpha: fr(beta).sub(best), max: best, argmax: arg };
}

// Lift the variables in `order` one at a time, starting from the cover inequality of `cover`.
export function sequentialLifting(a, b, cover, order) {
  const n = a.length;
  const coef = new Array(n).fill(ZERO);
  cover.forEach((j) => { coef[j] = ONE; });
  const beta = fr(cover.length - 1);
  const steps = [];
  for (const k of order) {
    const r = liftCoefficient(a, b, coef, beta, k);
    const alpha = r ? r.alpha : ZERO;
    steps.push({ k, alpha, max: r ? r.max : null, argmax: r ? r.argmax : null, residual: b - a[k] });
    coef[k] = alpha;
  }
  return { coef, beta, steps };
}

// Rank of a set of points after subtracting the first one = (number of affinely independent points) - 1.
export function affineRank(points) {
  if (points.length === 0) return -1;
  const base = points[0].map(fr);
  const rows = points.slice(1).map((p) => p.map((v, j) => fr(v).sub(base[j])));
  let rank = 0;
  const m = rows.length;
  const n = base.length;
  let r = 0;
  for (let col = 0; col < n && r < m; col++) {
    let piv = -1;
    for (let i = r; i < m; i++) if (!rows[i][col].isZero()) { piv = i; break; }
    if (piv < 0) continue;
    [rows[r], rows[piv]] = [rows[piv], rows[r]];
    for (let i = r + 1; i < m; i++) {
      if (rows[i][col].isZero()) continue;
      const f = rows[i][col].div(rows[r][col]);
      for (let j = col; j < n; j++) rows[i][j] = rows[i][j].sub(f.mul(rows[r][j]));
    }
    r++; rank++;
  }
  return rank;
}

// Feasible knapsack points on which the inequality holds with equality, and the dimension of that face.
export function knapsackFace(coef, beta, a, b) {
  const cf = coef.map(fr); const be = fr(beta);
  const all = knapsackPoints(a, b);
  const tight = all.filter((x) => x.reduce((s, xj, j) => (xj ? s.add(cf[j]) : s), ZERO).eq(be));
  return { tight, faceDim: affineRank(tight), hullDim: affineRank(all), isFacet: affineRank(tight) === affineRank(all) - 1 };
}
