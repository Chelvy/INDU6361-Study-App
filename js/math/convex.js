// Tangent (gradient) cuts and perspective cuts for the extra lecture E201.
import { Frac, ZERO, ONE } from './frac.js';

const fr = (v) => Frac.of(v);
const TWO = new Frac(2n);

// f(x) = q (x - c)^2 + d, q > 0.
export function quadValue(f, x) { const X = fr(x); const dx = X.sub(fr(f.c)); return fr(f.q).mul(dx).mul(dx).add(fr(f.d || 0)); }
export function quadSlope(f, x) { return TWO.mul(fr(f.q)).mul(fr(x).sub(fr(f.c))); }

// Tangent at a:  t >= slope * x + intercept.
export function tangentCut(f, a) {
  const A = fr(a);
  const slope = quadSlope(f, A);
  const intercept = quadValue(f, A).sub(slope.mul(A));
  return { a: A, slope, intercept };
}

// min t  s.t.  t >= slope_i x + intercept_i,  lo <= x <= hi   (exact; ties broken toward the smaller x).
export function solveTangentMaster(cuts, lo, hi) {
  const L = fr(lo), H = fr(hi);
  const cand = [L, H];
  for (let i = 0; i < cuts.length; i++) for (let j = i + 1; j < cuts.length; j++) {
    const ds = cuts[i].slope.sub(cuts[j].slope);
    if (ds.isZero()) continue;
    const x = cuts[j].intercept.sub(cuts[i].intercept).div(ds);
    if (x.ge(L) && x.le(H)) cand.push(x);
  }
  let best = null;
  for (const x of cand) {
    let t = null;
    for (const c of cuts) { const v = c.slope.mul(x).add(c.intercept); if (t === null || v.gt(t)) t = v; }
    if (best === null || t.lt(best.t) || (t.eq(best.t) && x.lt(best.x))) best = { x, t };
  }
  return best;
}

/**
 * Kelley / outer-approximation refinement on a one-variable convex quadratic (slides E201, pp. 12-21).
 * Returns the initial cuts and one record per master solve: x, L (master bound), f(x), violation, U (best cost so far).
 */
export function kelley(f, lo, hi, startPoints, iterations) {
  const cuts = startPoints.map((a) => tangentCut(f, a));
  const records = [];
  let U = null;
  for (let k = 0; k <= iterations; k++) {
    const m = solveTangentMaster(cuts, lo, hi);
    const fx = quadValue(f, m.x);
    if (U === null || fx.lt(U)) U = fx;
    const rec = { addedCuts: k, x: m.x, L: m.t, fx, violation: fx.sub(m.t), U, gap: U.sub(m.t), newCut: null };
    records.push(rec);
    if (k === iterations) break;
    const nc = tangentCut(f, m.x);
    rec.newCut = nc;
    cuts.push(nc);
  }
  return { initialCuts: startPoints.map((a) => tangentCut(f, a)), records };
}

// Tangent plane to f(x, y) = alpha x^2 + beta y^2 at (a, b):  t >= 2 alpha a x + 2 beta b y - alpha a^2 - beta b^2.
export function tangentPlane(alpha, beta, a, b) {
  const al = fr(alpha), be = fr(beta), A = fr(a), B = fr(b);
  return { cx: TWO.mul(al).mul(A), cy: TWO.mul(be).mul(B), c0: al.mul(A).mul(A).add(be.mul(B).mul(B)).neg(), value: al.mul(A).mul(A).add(be.mul(B).mul(B)) };
}

// Gradient cut for the convex constraint x1^2 + x2^2 - r2 <= 0 at point (a1, a2):  2 a1 x1 + 2 a2 x2 <= r2 + a1^2 + a2^2.
export function diskCut(r2, a1, a2) {
  const A1 = fr(a1), A2 = fr(a2);
  return { c1: TWO.mul(A1), c2: TWO.mul(A2), rhs: fr(r2).add(A1.mul(A1)).add(A2.mul(A2)), h: A1.mul(A1).add(A2.mul(A2)).sub(fr(r2)) };
}

// On/off cost t >= q x^2 with 0 <= x <= U z.  At (xbar, zbar, tbar), zbar > 0:
//   perspective value q xbar^2 / zbar;  cut  t >= 2 q a x - q a^2 z  with a = xbar / zbar.
export function perspectiveCut(q, xbar, zbar) {
  const Q = fr(q), X = fr(xbar), Z = fr(zbar);
  if (Z.sign() <= 0) throw new Error('zbar must be positive');
  const a = X.div(Z);
  return {
    a,
    required: Q.mul(X).mul(X).div(Z),
    original: Q.mul(X).mul(X),
    cx: TWO.mul(Q).mul(a),
    cz: Q.mul(a).mul(a).neg(),
    rhsAtPoint: TWO.mul(Q).mul(a).mul(X).sub(Q.mul(a).mul(a).mul(Z)),
  };
}

export { ZERO, ONE };
