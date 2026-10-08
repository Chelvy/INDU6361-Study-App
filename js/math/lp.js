// Exact two-phase simplex (Bland's rule) on rationals.
// Variables are nonnegative. Rows are a.x (<= | >= | =) b.
import { Frac, ZERO, ONE } from './frac.js';

const fr = (v) => Frac.of(v);

function pivot(T, basis, r, c) {
  const pr = T[r];
  const pv = pr[c];
  for (let j = 0; j < pr.length; j++) pr[j] = pr[j].div(pv);
  for (let i = 0; i < T.length; i++) {
    if (i === r) continue;
    const f = T[i][c];
    if (f.isZero()) continue;
    const row = T[i];
    for (let j = 0; j < row.length; j++) row[j] = row[j].sub(f.mul(pr[j]));
  }
  basis[r] = c;
}

// Maximise cost.x over the current tableau using columns [0, ncols). Returns 'optimal' | 'unbounded'.
function runSimplex(T, basis, cost, ncols) {
  const rhs = T.length ? T[0].length - 1 : 0;
  for (let iter = 0; iter < 10000; iter++) {
    let enter = -1;
    const inBasis = new Set(basis);
    for (let j = 0; j < ncols; j++) {
      if (inBasis.has(j)) continue;
      let r = cost[j];
      for (let i = 0; i < T.length; i++) {
        const cb = cost[basis[i]];
        if (!cb.isZero() && !T[i][j].isZero()) r = r.sub(cb.mul(T[i][j]));
      }
      if (r.sign() > 0) { enter = j; break; }
    }
    if (enter < 0) return 'optimal';
    let leave = -1;
    let best = null;
    for (let i = 0; i < T.length; i++) {
      const a = T[i][enter];
      if (a.sign() <= 0) continue;
      const ratio = T[i][rhs].div(a);
      if (best === null || ratio.lt(best) || (ratio.eq(best) && basis[i] < basis[leave])) { best = ratio; leave = i; }
    }
    if (leave < 0) return 'unbounded';
    pivot(T, basis, leave, enter);
  }
  throw new Error('Simplex did not terminate');
}

/**
 * model: { sense: 'max'|'min', c: [..], rows: [{a:[..], op:'<='|'>='|'=', b}], names?: [..] }
 * Returns { status, x, obj, slack, rowsLE, tableau, basisVars, unique, degenerate }.
 * rowsLE[i] = {a, b, hasSlack}: row i rewritten so that its slack s_i = b - a.x >= 0.
 */
export function solveLP(model) {
  const n = model.c.length;
  const sense = model.sense || 'max';
  const c = model.c.map(fr).map((v) => (sense === 'max' ? v : v.neg()));
  const names = model.names || Array.from({ length: n }, (_, i) => `x${i + 1}`);

  const rowsLE = model.rows.map((r) => {
    let a = r.a.map(fr);
    let b = fr(r.b);
    if (r.op === '>=') { a = a.map((v) => v.neg()); b = b.neg(); }
    return { a, b, hasSlack: r.op !== '=' };
  });
  const m = rowsLE.length;
  const slackCol = [];
  let ns = 0;
  rowsLE.forEach((r, i) => { slackCol[i] = r.hasSlack ? n + ns++ : -1; });
  const nReal = n + ns;

  // Build rows; decide where artificials are needed.
  const T = [];
  const basis = [];
  const artRows = [];
  rowsLE.forEach((r, i) => {
    const row = Array.from({ length: nReal }, () => ZERO);
    r.a.forEach((v, j) => { row[j] = v; });
    if (r.hasSlack) row[slackCol[i]] = ONE;
    let b = r.b;
    let flipped = false;
    if (b.sign() < 0) { for (let j = 0; j < nReal; j++) row[j] = row[j].neg(); b = b.neg(); flipped = true; }
    T.push({ row, b, needArt: !r.hasSlack || flipped });
    if (!r.hasSlack || flipped) artRows.push(i);
  });
  const nArt = artRows.length;
  const ncolsAll = nReal + nArt;
  const M = T.map((t, i) => {
    const full = t.row.concat(Array.from({ length: nArt }, () => ZERO));
    if (t.needArt) {
      const k = artRows.indexOf(i);
      full[nReal + k] = ONE;
      basis[i] = nReal + k;
    } else basis[i] = slackCol[i];
    full.push(t.b);
    return full;
  });

  let tableauRows = M;
  if (nArt > 0) {
    const cost1 = Array.from({ length: ncolsAll }, (_, j) => (j >= nReal ? ONE.neg() : ZERO));
    runSimplex(tableauRows, basis, cost1, ncolsAll);
    let infeas = ZERO;
    for (let i = 0; i < tableauRows.length; i++) if (basis[i] >= nReal) infeas = infeas.add(tableauRows[i][ncolsAll]);
    if (infeas.sign() > 0) return { status: 'infeasible', names };
    // Drive remaining (zero-valued) artificials out of the basis, dropping redundant rows.
    for (let i = tableauRows.length - 1; i >= 0; i--) {
      if (basis[i] < nReal) continue;
      let col = -1;
      for (let j = 0; j < nReal; j++) if (!tableauRows[i][j].isZero()) { col = j; break; }
      if (col >= 0) pivot(tableauRows, basis, i, col);
      else { tableauRows.splice(i, 1); basis.splice(i, 1); }
    }
    tableauRows = tableauRows.map((row) => row.slice(0, nReal).concat([row[ncolsAll]]));
  }

  const cost2 = Array.from({ length: nReal }, (_, j) => (j < n ? c[j] : ZERO));
  const st = runSimplex(tableauRows, basis, cost2, nReal);
  if (st === 'unbounded') return { status: 'unbounded', names };

  const val = Array.from({ length: nReal }, () => ZERO);
  basis.forEach((bcol, i) => { val[bcol] = tableauRows[i][nReal]; });
  const x = val.slice(0, n);
  let zmax = ZERO;
  for (let j = 0; j < n; j++) zmax = zmax.add(c[j].mul(x[j]));
  const obj = sense === 'max' ? zmax : zmax.neg();
  const slack = rowsLE.map((r, i) => (r.hasSlack ? val[slackCol[i]] : null));

  // Reduced-cost row in the "z + sum d_j x_j = z*" convention (d_j >= 0 at a max optimum).
  const d = Array.from({ length: nReal }, () => ZERO);
  for (let j = 0; j < nReal; j++) {
    let s = cost2[j].neg();
    for (let i = 0; i < tableauRows.length; i++) {
      const cb = cost2[basis[i]];
      if (!cb.isZero()) s = s.add(cb.mul(tableauRows[i][j]));
    }
    d[j] = s;
  }

  const cols = [];
  for (let j = 0; j < n; j++) cols.push({ kind: 'x', index: j, name: names[j] });
  rowsLE.forEach((r, i) => { if (r.hasSlack) cols[slackCol[i]] = { kind: 's', index: i, name: `s${i + 1}` }; });
  const order = basis.map((b, i) => [b, i]).sort((p, q) => p[0] - q[0]);
  const rows = order.map(([b, i]) => ({ basic: b, name: cols[b].name, coef: tableauRows[i].slice(0, nReal), rhs: tableauRows[i][nReal] }));
  const inBasis = new Set(basis);
  let unique = true;
  for (let j = 0; j < nReal; j++) if (!inBasis.has(j) && d[j].isZero()) unique = false;
  const degenerate = rows.some((r) => r.rhs.isZero());

  return {
    status: 'optimal', names, sense, x, obj, slack, rowsLE,
    tableau: { cols, rows, zrow: { coef: d, rhs: zmax }, n, nReal },
    basisVars: rows.map((r) => r.name),
    unique, degenerate,
  };
}

// Exact Gaussian elimination: solves A y = b for square A (arrays of Frac-compatible values). Returns null if singular.
export function solveLinear(A, b) {
  const n = A.length;
  const M = A.map((row, i) => row.map(fr).concat([fr(b[i])]));
  for (let col = 0; col < n; col++) {
    let p = -1;
    for (let i = col; i < n; i++) if (!M[i][col].isZero()) { p = i; break; }
    if (p < 0) return null;
    [M[col], M[p]] = [M[p], M[col]];
    const pv = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] = M[col][j].div(pv);
    for (let i = 0; i < n; i++) {
      if (i === col || M[i][col].isZero()) continue;
      const f = M[i][col];
      for (let j = col; j <= n; j++) M[i][j] = M[i][j].sub(f.mul(M[col][j]));
    }
  }
  return M.map((row) => row[n]);
}

// Determinant by fraction-preserving elimination.
export function det(A) {
  const n = A.length;
  const M = A.map((row) => row.map(fr));
  let dsign = ONE;
  let d = ONE;
  for (let col = 0; col < n; col++) {
    let p = -1;
    for (let i = col; i < n; i++) if (!M[i][col].isZero()) { p = i; break; }
    if (p < 0) return ZERO;
    if (p !== col) { [M[col], M[p]] = [M[p], M[col]]; dsign = dsign.neg(); }
    const pv = M[col][col];
    d = d.mul(pv);
    for (let i = col + 1; i < n; i++) {
      if (M[i][col].isZero()) continue;
      const f = M[i][col].div(pv);
      for (let j = col; j < n; j++) M[i][j] = M[i][j].sub(f.mul(M[col][j]));
    }
  }
  return d.mul(dsign);
}

// Dual values y (one per original row, in the row's ORIGINAL orientation) for an optimal LP.
// For a max problem with <= rows the duals are >= 0; for a min problem with >= rows they are >= 0.
export function dualValues(model, sol) {
  if (sol.status !== 'optimal') return null;
  const t = sol.tableau;
  const sense = model.sense || 'max';
  // In the internal max / <= form, dual of row i = reduced cost d of its slack column.
  return model.rows.map((r, i) => {
    const sc = t.cols.findIndex((cdef) => cdef && cdef.kind === 's' && cdef.index === i);
    if (sc < 0) return null; // equality rows: not provided
    let y = t.zrow.coef[sc]; // dual for the max / <= form
    if (r.op === '>=') y = y.neg();
    if (sense === 'min') y = y.neg();
    return y;
  });
}

// All integer points of {x >= 0 : rows} inside a box [0, ub_j]; used for brute-force verification on small models.
export function integerPoints(rows, ub) {
  const n = ub.length;
  const R = rows.map((r) => ({ a: r.a.map(fr), op: r.op, b: fr(r.b) }));
  const pts = [];
  const x = new Array(n).fill(0);
  const ok = () => R.every((r) => {
    let s = ZERO;
    for (let j = 0; j < n; j++) if (x[j] !== 0) s = s.add(r.a[j].mul(fr(x[j])));
    const cmp = s.cmp(r.b);
    return r.op === '<=' ? cmp <= 0 : r.op === '>=' ? cmp >= 0 : cmp === 0;
  });
  const rec = (j) => {
    if (j === n) { if (ok()) pts.push(x.slice()); return; }
    for (let v = 0; v <= ub[j]; v++) { x[j] = v; rec(j + 1); }
    x[j] = 0;
  };
  rec(0);
  return pts;
}
