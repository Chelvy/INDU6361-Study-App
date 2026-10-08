// Total unimodularity at "recognition level" (lecture 106): the sufficient condition from the slides,
// plus an exhaustive determinant check for small matrices.
import { Frac } from './frac.js';
import { det } from './lp.js';

function combinations(n, k) {
  const out = [];
  const cur = [];
  const rec = (start) => {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = start; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); }
  };
  rec(0);
  return out;
}

// Exhaustive test: every square submatrix has determinant in {-1, 0, 1}. Returns a violating submatrix if any.
export function isTotallyUnimodular(M) {
  const m = M.length;
  const n = M[0].length;
  for (let k = 1; k <= Math.min(m, n); k++) {
    const rowSets = combinations(m, k);
    const colSets = combinations(n, k);
    for (const R of rowSets) for (const C of colSets) {
      const sub = R.map((i) => C.map((j) => M[i][j]));
      const d = det(sub);
      if (d.abs().gt(Frac.of(1))) return { tu: false, witness: { rows: R, cols: C, det: d, sub } };
    }
  }
  return { tu: true, witness: null };
}

// Slides 106: entries in {-1, 0, 1} and every column has at most one +1 and at most one -1.
// Sufficient, not necessary.
export function sufficientCondition(M) {
  const reasons = [];
  let entriesOk = true;
  M.forEach((row, i) => row.forEach((v, j) => { if (![-1, 0, 1].includes(v)) { entriesOk = false; reasons.push(`entry (${i + 1},${j + 1}) = ${v} is not in {-1,0,1}`); } }));
  let colsOk = true;
  for (let j = 0; j < M[0].length; j++) {
    const plus = M.filter((row) => row[j] === 1).length;
    const minus = M.filter((row) => row[j] === -1).length;
    if (plus > 1) { colsOk = false; reasons.push(`column ${j + 1} has ${plus} entries equal to +1`); }
    if (minus > 1) { colsOk = false; reasons.push(`column ${j + 1} has ${minus} entries equal to -1`); }
  }
  return { holds: entriesOk && colsOk, entriesOk, colsOk, reasons };
}

// Multiplying a set of rows by -1 keeps total unimodularity. Search for a row sign pattern after which the
// slide criterion applies (this is how the assignment matrix is recognised: negate one side of the bipartition).
export function signPatternForCriterion(M) {
  const m = M.length;
  if (m > 12) return null;
  for (let mask = 0; mask < 1 << m; mask++) {
    const N = M.map((row, i) => row.map((v) => ((mask >> i) & 1 ? -v : v)));
    if (sufficientCondition(N).holds) return { negate: Array.from({ length: m }, (_, i) => i).filter((i) => (mask >> i) & 1), matrix: N };
  }
  return null;
}

// Node-arc incidence matrix, +1 at the tail and -1 at the head (outflow minus inflow convention).
export function incidenceMatrix(nodes, arcs) {
  return nodes.map((v) => arcs.map((a) => (a.u === v ? 1 : a.v === v ? -1 : 0)));
}
