// General-purpose cutting planes as taught in lectures 204-206:
// integer rounding, Chvatal-Gomory, Gomory cuts read from the simplex tableau (floor every coefficient),
// mixed-integer rounding, flow covers, lot-sizing and clique inequalities.
import { Frac, ZERO, ONE } from './frac.js';
import { solveLP } from './lp.js';

const fr = (v) => Frac.of(v);

// --------------------------------------------------------------- integer rounding and Chvatal-Gomory
// rows: [{a:[..], b}] meaning a.x <= b with x >= 0 integer; u: nonnegative multipliers.
export function chvatalGomory(rows, u) {
  const n = rows[0].a.length;
  const mult = u.map(fr);
  if (mult.some((m) => m.sign() < 0)) throw new Error('Multipliers must be nonnegative');
  const agg = Array.from({ length: n }, () => ZERO);
  let rhs = ZERO;
  rows.forEach((r, i) => {
    r.a.forEach((v, j) => { agg[j] = agg[j].add(mult[i].mul(fr(v))); });
    rhs = rhs.add(mult[i].mul(fr(r.b)));
  });
  return { aggregated: { a: agg, b: rhs }, cut: { a: agg.map((v) => v.floor()), b: rhs.floor() } };
}

// --------------------------------------------------------------- Gomory cuts from the tableau
// Classroom row rule: among basic DECISION variables with fractional value choose the largest fractional
// part of the right-hand side; break ties by row order.
export function gomorySourceRow(tableau) {
  let best = -1;
  let bestF = ZERO;
  tableau.rows.forEach((row, i) => {
    if (tableau.cols[row.basic].kind !== 'x') return;
    const f = row.rhs.fracPart();
    if (f.gt(bestF)) { bestF = f; best = i; }
  });
  return best;
}

// Floor every coefficient and the right-hand side of the row (treated as "<=").
export function gomoryFloorCut(tableau, rowIndex) {
  const row = tableau.rows[rowIndex];
  return { coef: row.coef.map((v) => v.floor()), rhs: row.rhs.floor(), source: row };
}

// Rewrite a cut over tableau columns (structural + slack) in the structural variables only,
// using s_i = b_i - a_i.x for every slack.
export function substituteSlacks(cut, lp) {
  const t = lp.tableau;
  const n = t.n;
  const a = Array.from({ length: n }, (_, j) => cut.coef[j]);
  let b = cut.rhs;
  t.cols.forEach((col, k) => {
    if (!col || col.kind !== 's') return;
    const ck = cut.coef[k];
    if (ck.isZero()) return;
    const src = lp.rowsLE[col.index];
    for (let j = 0; j < n; j++) a[j] = a[j].sub(ck.mul(src.a[j]));
    b = b.sub(ck.mul(src.b));
  });
  return { a, b };
}

/**
 * Pure-integer Gomory cutting-plane method as in slides 204.
 * model: { c, rows:[{a, op:'<=', b}], names } - maximisation, integer data (scale decimal rows first so slacks are integer).
 * Returns { rounds:[{lp, rowIndex, tableauCut, cut}], final }.
 */
export function gomoryCuttingPlanes(model, maxRounds = 12) {
  const rows = model.rows.map((r) => ({ a: r.a.slice(), op: r.op || '<=', b: r.b }));
  const rounds = [];
  for (let it = 0; it <= maxRounds; it++) {
    const lp = solveLP({ sense: 'max', c: model.c, rows, names: model.names });
    if (lp.status !== 'optimal') return { rounds, final: lp, status: lp.status };
    const rowIndex = gomorySourceRow(lp.tableau);
    if (rowIndex < 0) return { rounds, final: lp, status: 'integral' };
    if (it === maxRounds) return { rounds, final: lp, status: 'round-limit' };
    const tableauCut = gomoryFloorCut(lp.tableau, rowIndex);
    const cut = substituteSlacks(tableauCut, lp);
    rounds.push({ lp, rowIndex, tableauCut, cut, slackIndex: rows.length + 1 });
    rows.push({ a: cut.a, op: '<=', b: cut.b });
  }
  return { rounds, final: null, status: 'round-limit' };
}

// Multiply a row by the smallest positive integer that makes every coefficient and the rhs integer.
export function scaleToIntegers(a, b) {
  const all = a.map(fr).concat([fr(b)]);
  let l = 1n;
  const g = (x, y) => { x = x < 0n ? -x : x; y = y < 0n ? -y : y; while (y) [x, y] = [y, x % y]; return x; };
  for (const v of all) l = (l / g(l, v.d)) * v.d;
  const f = new Frac(l);
  return { a: a.map((v) => fr(v).mul(f)), b: fr(b).mul(f), factor: f };
}

// --------------------------------------------------------------- mixed-integer rounding
// Basic MIR (slides 205): z + u >= k + f with z integer, u >= 0, k integer, 0 < f < 1  ==>  z + u/f >= k + 1.
export function mirParameters(rhs) {
  const r = fr(rhs);
  const k = r.floor();
  const f = r.sub(k);
  return { k, f, applicable: !f.isZero() };
}

// y <= a x, 0 <= y <= U, x integer >= 0, y continuous: MIR cut  y <= U - a f (k + 1 - x),
// with U / a = k + f.  (Slides: a = 10, U = 14 gives y <= 6 + 4x.)
export function mirCapacityCut(a, U) {
  const A = fr(a), cap = fr(U);
  const { k, f, applicable } = mirParameters(cap.div(A));
  if (!applicable) return { applicable: false, k, f };
  const slope = A.mul(f);
  const intercept = cap.sub(slope.mul(k.add(ONE)));
  return { applicable: true, k, f, slope, intercept, lpVertex: { x: cap.div(A), y: cap } };
}

// sum_j a_j x_j - c z <= b with x integer (integer a_j), z >= 0 continuous, c > 0, b fractional:
// MIR cut  sum_j a_j x_j - (c / f) z <= floor(b), where f = ceil(b) - b.
// (Slides: x + y - z <= 2.5 gives x + y - 2z <= 2.)
export function mirMixedRow(aInt, c, b) {
  const B = fr(b);
  const { k, f, applicable } = mirParameters(B.neg());
  if (!applicable) return { applicable: false, k, f };
  return { applicable: true, k, f, intCoef: aInt.map(fr), contCoef: fr(c).div(f).neg(), rhs: k.add(ONE).neg() };
}

// --------------------------------------------------------------- flow cover (slides 206)
// sum_j y_j <= b, 0 <= y_j <= a_j x_j, x_j binary.  For C with lambda = sum_C a_j - b > 0:
//   sum_{j in C} y_j + sum_{j in C} (a_j - lambda)^+ (1 - x_j) <= b.
export function flowCover(a, b, C) {
  const A = a.map(fr), B = fr(b);
  const lambda = C.reduce((s, j) => s.add(A[j]), ZERO).sub(B);
  if (lambda.sign() <= 0) return { valid: false, lambda };
  const coef = {};
  C.forEach((j) => { const d = A[j].sub(lambda); coef[j] = d.sign() > 0 ? d : ZERO; });
  // Equivalent form: sum y_j - sum coef_j x_j <= b - sum coef_j
  const constant = C.reduce((s, j) => s.add(coef[j]), ZERO);
  return { valid: true, lambda, coef, rhs: B, rhsCollected: B.sub(constant) };
}
export function flowCoverLhs(fc, C, xbar, ybar) {
  return C.reduce((s, j) => s.add(fr(ybar[j])).add(fc.coef[j].mul(ONE.sub(fr(xbar[j])))), ZERO);
}

// --------------------------------------------------------------- lot sizing (slides 206)
// s_{t-1} + y_t - s_t = d_t, 0 <= y_t <= C x_t, s_0 = 0, no backlog.
// Cumulative cuts: sum_{i<=t} x_i >= ceil(sum_{i<=t} d_i / C).
export function lotSizingCumulative(d, C) {
  let cum = ZERO;
  return d.map((dt, t) => {
    cum = cum.add(fr(dt));
    return { t: t + 1, demand: cum, rhs: cum.div(fr(C)).ceil() };
  });
}

// --------------------------------------------------------------- clique inequalities (slides 206)
// Maximum-weight clique by enumeration (n <= 16). edges: [[i, j], ...] 0-based conflicts.
export function maxWeightClique(n, edges, weights) {
  const adj = Array.from({ length: n }, () => new Array(n).fill(false));
  edges.forEach(([i, j]) => { adj[i][j] = true; adj[j][i] = true; });
  const w = weights.map(fr);
  let best = { clique: [], weight: ZERO };
  for (let mask = 1; mask < 1 << n; mask++) {
    const set = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) set.push(i);
    let ok = true;
    for (let p = 0; p < set.length && ok; p++) for (let q = p + 1; q < set.length; q++) if (!adj[set[p]][set[q]]) { ok = false; break; }
    if (!ok) continue;
    const tot = set.reduce((s, i) => s.add(w[i]), ZERO);
    if (tot.gt(best.weight) || (tot.eq(best.weight) && set.length > best.clique.length)) best = { clique: set, weight: tot };
  }
  return best;
}

export function maximalCliques(n, edges) {
  const adj = Array.from({ length: n }, () => new Array(n).fill(false));
  edges.forEach(([i, j]) => { adj[i][j] = true; adj[j][i] = true; });
  const cliques = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const set = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) set.push(i);
    let ok = true;
    for (let p = 0; p < set.length && ok; p++) for (let q = p + 1; q < set.length; q++) if (!adj[set[p]][set[q]]) { ok = false; break; }
    if (ok) cliques.push({ mask, set });
  }
  return cliques.filter((c) => !cliques.some((d) => d.mask !== c.mask && (d.mask & c.mask) === c.mask)).map((c) => c.set);
}
