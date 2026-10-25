// Facets and integer hulls in the plane (sheet 20E, Exercise 12; slides 206 "faces and facets").
// A 2-D polytope P given by rows a1 x + a2 y <= b, its facets, the integer hull Q after an added
// inequality, and which inequalities are facets of Q. Exact rational arithmetic throughout.
import { Frac, ZERO } from '../math/frac.js';
import { affineRank } from '../math/knapsack.js';
import { sameInequality, makeInequality } from '../math/parse.js';
import { plotFigure } from '../viz.js';
import { linTex, ineqText } from '../util.js';
import { frag, ul } from './common.js';

const R = String.raw;
const NAMES = ['x', 'y'];
const fr = (v) => Frac.of(v);
const dot = (a, p) => a[0].mul(p[0]).add(a[1].mul(p[1]));
const numTex = (f) => { const p = f.pretty(); return p.includes('/') ? f.toLatex() : p; };
const ptTex = (p) => `(${numTex(p[0])},${numTex(p[1])})`;
const ptsTex = (ps) => ps.map((p) => `$${ptTex(p)}$`).join(', ');
// "2\cdot 2+1\cdot 1=5": the left-hand side evaluated at a point, written out.
const evalTex = (a, p) => `${a.map((c, i) => (c.isZero() ? null : `${numTex(c)}\\cdot ${numTex(p[i])}`)).filter(Boolean).join('+').replace(/\+-/g, '-')}=${numTex(dot(a, p))}`;
const key = (p) => `${p[0]},${p[1]}`;
const toRow = ([a0, a1, b]) => ({ a: [fr(a0), fr(a1)], b: fr(b) });
const asIneq = (r) => makeInequality({ x: r.a[0], y: r.a[1] }, '<=', r.b);
const same = (r, t) => sameInequality(asIneq(r), asIneq(t));
const holds = (r, p) => dot(r.a, p).le(r.b);
const isAxis = (r) => r.b.isZero() && ((r.a[0].sign() < 0 && r.a[1].isZero()) || (r.a[1].sign() < 0 && r.a[0].isZero()));

// "2x + y \le 4.5"; rows with only nonpositive coefficients are shown as ">=" (x >= 0 rather than -x <= 0).
function rowTex(r) {
  const neg = r.a.every((v) => v.sign() <= 0);
  const a = neg ? r.a.map((v) => v.neg()) : r.a;
  return `${linTex(a, NAMES)} ${neg ? R`\ge` : R`\le`} ${numTex(neg ? r.b.neg() : r.b)}`;
}
function rowPlain(r) {
  const neg = r.a.every((v) => v.sign() <= 0);
  const lhs = ineqText(neg ? r.a.map((v) => v.neg()) : r.a, NAMES, '<=', 0).replace(/ <= 0$/, '');
  return `${lhs} ${neg ? '≥' : '≤'} ${(neg ? r.b.neg() : r.b).pretty()}`;
}
function rowText(r) {
  const neg = r.a.every((v) => v.sign() <= 0);
  return neg ? ineqText(r.a.map((v) => v.neg()), NAMES, '>=', r.b.neg()) : ineqText(r.a, NAMES, '<=', r.b);
}

// Corners of {z : every row holds}, counter-clockwise, starting from the lexicographically smallest one.
function polygonCorners(rows) {
  const out = new Map();
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const [p, q] = rows[i].a, [s, t] = rows[j].a;
    const det = p.mul(t).sub(q.mul(s));
    if (det.isZero()) continue;
    const x = rows[i].b.mul(t).sub(q.mul(rows[j].b)).div(det);
    const y = p.mul(rows[j].b).sub(rows[i].b.mul(s)).div(det);
    const z = [x, y];
    if (rows.every((r) => holds(r, z))) out.set(key(z), z);
  }
  return ccw([...out.values()]);
}
function ccw(pts) {
  if (pts.length < 3) return pts.slice().sort((u, v) => u[0].cmp(v[0]) || u[1].cmp(v[1]));
  const cx = pts.reduce((s, p) => s + p[0].toNumber(), 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1].toNumber(), 0) / pts.length;
  const sorted = pts.slice().sort((u, v) => Math.atan2(u[1].toNumber() - cy, u[0].toNumber() - cx) - Math.atan2(v[1].toNumber() - cy, v[0].toNumber() - cx));
  let k = 0;
  sorted.forEach((p, i) => { const m = sorted[k]; if (p[0].lt(m[0]) || (p[0].eq(m[0]) && p[1].lt(m[1]))) k = i; });
  return sorted.slice(k).concat(sorted.slice(0, k));
}

// Convex hull of integer points (Andrew's monotone chain, collinear points dropped), counter-clockwise.
function hull(points) {
  const P = points.map((p) => [p[0].toNumber(), p[1].toNumber()]).sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  if (P.length < 3) return P.map((p) => p.map(fr));
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => { const h = []; list.forEach((p) => { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }); return h; };
  const lower = half(P), upper = half(P.slice().reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1)).map((p) => p.map(fr));
}
const igcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
// Edge p -> q of a counter-clockwise polygon with integer corners: the outward row n.z <= n.p, coprime coefficients.
function edgeRow(p, q) {
  const dx = q[0].toNumber() - p[0].toNumber(), dy = q[1].toNumber() - p[1].toNumber();
  const g = igcd(dx, dy) || 1;
  const a = [fr(dy / g), fr(-dx / g)];
  return { a, b: dot(a, p) };
}

// Everything the trainer needs, computed from the instance.
export function facetData(inst) {
  const rows = inst.rows.map(toRow);
  const added = toRow(inst.added);
  const V = polygonCorners(rows);
  const dimP = affineRank(V);
  const rowInfo = rows.map((r) => {
    const tight = V.filter((p) => dot(r.a, p).eq(r.b));
    const faceDim = affineRank(tight);
    return { r, tight, faceDim, facet: faceDim === dimP - 1 };
  });
  const xs = V.map((p) => p[0]), ys = V.map((p) => p[1]);
  const lo = (arr) => arr.reduce((m, v) => (v.lt(m) ? v : m)).ceil().toNumber();
  const hi = (arr) => arr.reduce((m, v) => (v.gt(m) ? v : m)).floor().toNumber();
  const intP = [];
  for (let i = lo(xs); i <= hi(xs); i++) for (let j = lo(ys); j <= hi(ys); j++) { const z = [fr(i), fr(j)]; if (rows.every((r) => holds(r, z))) intP.push(z); }
  const kept = intP.filter((p) => holds(added, p));
  const removed = intP.filter((p) => !holds(added, p));
  const corners = hull(kept);
  const dimQ = affineRank(kept);
  const qFacets = corners.length >= 3 ? corners.map((p, i) => ({ row: edgeRow(p, corners[(i + 1) % corners.length]), ends: [p, corners[(i + 1) % corners.length]] })) : [];
  const cands = rows.concat([added]);
  const candInfo = cands.map((r) => {
    const tight = corners.filter((p) => dot(r.a, p).eq(r.b));
    const max = corners.length ? corners.map((p) => dot(r.a, p)).reduce((m, v) => (v.gt(m) ? v : m)) : ZERO;
    const cls = tight.length >= 2 ? 'facet' : tight.length === 1 ? 'one' : 'never';
    return { r, tight, max, cls, valid: max.le(r.b) };
  });
  qFacets.forEach((f) => { f.listed = cands.some((r) => same(r, f.row)); });
  const newFacets = qFacets.filter((f) => !f.listed);
  const rounded = { a: added.a, b: added.b.floor() };
  // the added row on the LP polygon P ∩ {added}: there it is an edge (it cuts P), unlike on Q
  const cutEdge = polygonCorners(rows.concat([added])).filter((p) => dot(added.a, p).eq(added.b));
  const xmax = Math.max(3, hi(xs) + 1), ymax = Math.max(3, hi(ys) + 1);
  return { rows, added, V, dimP, rowInfo, intP, kept, removed, corners, dimQ, qFacets, newFacets, candInfo, rounded, cutEdge, xmax, ymax };
}

const CLS = [
  { value: 'facet', label: 'facet of Q', short: 'facet of Q' },
  { value: 'one', label: 'valid, tight at one point only', short: 'valid, tight at one point only' },
  { value: 'never', label: 'valid, never tight', short: 'valid, never tight' },
];
const plotRow = (r, cls) => ({ a: r.a[0].toNumber(), b: r.a[1].toNumber(), c: r.b.toNumber(), cls });

function buildFacets(inst) {
  const D = facetData(inst);
  const { rows, added, V, dimP, rowInfo, intP, kept, removed, corners, dimQ, qFacets, newFacets, candInfo, rounded, cutEdge, xmax, ymax } = D;
  const addTex = rowTex(added);
  const roundTex = rowTex(rounded);
  const drawn = (rs) => rs.filter((r) => !isAxis(r)).map((r) => plotRow(r));
  const figP = () => plotFigure({ xmax, ymax, cons: drawn(rows), caption: 'The polytope P. Black dots: its integer points.' });
  const figCut = () => plotFigure({
    xmax, ymax, cons: drawn(rows), extra: [plotRow(added)],
    marks: removed.map((p) => ({ x: p[0], y: p[1], cls: 'lp', label: `(${p[0].pretty()}, ${p[1].pretty()}) cut off` })),
    caption: `Dashed: the new inequality ${rowPlain(added)}. Red: the integer points it removes.`,
  });
  const figQ = () => plotFigure({
    xmax, ymax, cons: drawn(qFacets.map((f) => f.row)), extra: [plotRow(added)].concat(newFacets.map((f) => plotRow(f.row, 'second'))),
    marks: corners.map((p) => ({ x: p[0], y: p[1], cls: 'opt' })),
    caption: 'The integer hull Q (green dots: its corners). Red dashed: the added inequality. Green dashed: the new facets.',
  });
  const three = [V[0], V[1], V[V.length - 1]];
  const threeQ = [corners[0], corners[1], corners[corners.length - 1]];
  const others = kept.filter((p) => !corners.some((c) => key(c) === key(p)));
  const listedNew = newFacets.map((f) => rowText(f.row));
  const roundedIsNew = newFacets.some((f) => same(f.row, rounded));
  const roundInfo = corners.filter((p) => dot(rounded.a, p).eq(rounded.b));

  return {
    id: 'facets', topic: 't206b', title: inst.title || 'Facets and integer hulls in the plane',
    statement: () => frag(
      R`The polytope $$P=\{(x,y):\ ${rows.map(rowTex).join(R`,\ `)}\}$$ has the corners ${ptsTex(V)}. Later you keep only its integer points and add the inequality $${addTex}$.`,
      figP(),
    ),
    rules: R`An inequality is <b>valid</b> for a set when every point of the set satisfies it. It is <b>tight</b> at a point where it holds with equality; the tight points form its <b>face</b>. A set has <b>dimension</b> $d$ when it contains $d+1$ affinely independent points and no more: in the plane, three points that are not on one line give dimension 2, two different points give dimension 1, one point gives 0. A valid inequality defines a <b>facet</b> when its face has dimension one less than the set. For a 2-dimensional polygon a facet is an edge: the inequality must be tight at two different points.`,
    steps: [
      {
        title: 'The polytope P: dimension and facets',
        fields: [
          { type: 'int', label: R`Dimension of $P$`, answer: dimP },
          { type: 'multi', label: R`Which listed inequalities define facets of $P$? Tick all that do.`, options: rowInfo.map((x, k) => ({ value: `r${k}`, label: `$${rowTex(x.r)}$` })), answer: rowInfo.map((x, k) => (x.facet ? `r${k}` : null)).filter(Boolean) },
        ],
        explain: () => frag(
          `<b>Dimension.</b> The corners ${ptsTex(three)} of $P$ are not on one line, so $\\dim P=2$.`,
          `<b>Facets.</b> Rule: in a 2-dimensional polygon a valid inequality is a facet when it is tight at two different points (an edge).`,
          ul(rowInfo.map((x) => {
            if (x.facet) return `$${rowTex(x.r)}$: tight at the corners ${ptsTex(x.tight)}. Two different points on its line: an edge of dimension 1, so a <b>facet</b>.`;
            if (x.tight.length === 1) return `$${rowTex(x.r)}$: tight only at $${ptTex(x.tight[0])}$, a face of dimension 0. Valid, but <b>not a facet</b> (beyond the slides: removing it would not change $P$).`;
            return `$${rowTex(x.r)}$: no point of $P$ makes it tight (it is never tight). Valid, but <b>not a facet</b>.`;
          })),
        ),
      },
      {
        title: 'Keep the integer points and add the new inequality',
        text: R`The <b>convex hull</b> of a set of points is the smallest convex set that contains them. In the plane it is a polygon whose corners are some of the points. Call $Q$ the convex hull of the integer points of $P$ that satisfy $${addTex}$.`,
        figure: figCut,
        fields: [
          { type: 'int', label: `At an integer point the left-hand side $${linTex(added.a, NAMES)}$ is an integer. So, for integer points, $${addTex}$ is the same as $${linTex(added.a, NAMES)}\\le k$ with which integer $k$?`, answer: rounded.b, mis: [{ value: added.b.ceil(), msg: `Rounding up would let in points with $${linTex(added.a, NAMES)}=${added.b.ceil().toString()}$, which violate the inequality. Round the right-hand side <b>down</b>.` }].filter((m) => !added.b.isInt()) },
          { type: 'int', label: R`Number of integer points of $P$ that satisfy the new inequality`, answer: kept.length, mis: [{ value: intP.length, msg: 'That is every integer point of $P$. Remove the ones the new inequality cuts off.' }].filter((m) => m.value !== kept.length) },
          { type: 'int', label: R`Number of corners of $Q$`, answer: corners.length, mis: [{ value: kept.length, msg: 'Not every integer point is a corner: points inside $Q$ or in the middle of an edge are not corners.' }].filter((m) => m.value !== corners.length) },
          { type: 'int', label: R`Dimension of $Q$`, answer: dimQ },
        ],
        explain: () => frag(
          `$P$ has ${intP.length} integer points. The new inequality removes ${removed.map((p) => `$${ptTex(p)}$ ($${evalTex(added.a, p)}\\gt ${numTex(added.b)}$)`).join(', ')}.`,
          `Rule: the coefficients are integers, so at an integer point $${linTex(added.a, NAMES)}$ is an integer, and an integer is at most $${numTex(added.b)}$ exactly when it is at most $\\lfloor ${numTex(added.b)}\\rfloor=${rounded.b.toString()}$. So for integer points $${addTex}$ is the same as $${roundTex}$.`,
          `${kept.length} integer points remain. Their convex hull $Q$ has the ${corners.length} corners ${ptsTex(corners)}${others.length ? `; the other points ${ptsTex(others)} lie inside $Q$ or on an edge between two corners` : ''}. The corners ${ptsTex(threeQ)} are not on one line, so $\\dim Q=2$.`,
          figQ(),
        ),
      },
      {
        title: 'Which inequalities are facets of Q?',
        text: R`Each inequality below holds at every remaining integer point, so it also holds at every <b>convex combination</b> of them (a weighted average with nonnegative weights that add up to 1): all of them are <b>valid</b> for $Q$. A linear function is largest on a polygon at a corner, so it is enough to test the corners of $Q$.`,
        fields: [{
          type: 'table', label: R`For each inequality: how many corners of $Q$ make it tight, and what it is for $Q$`, corner: 'Inequality',
          columns: [
            { key: 'k', head: R`Tight corners of $Q$`, kind: 'num', plain: 'tight corners' },
            { key: 'cls', head: R`For $Q$ it is`, kind: 'choice', options: CLS, plain: 'classification' },
          ],
          rows: candInfo.map((x) => ({ head: `$${rowTex(x.r)}$`, cells: { k: x.tight.length, cls: x.cls } })),
        }],
        explain: () => frag(ul(candInfo.map((x) => {
          const lhs = linTex(x.r.a, NAMES);
          if (x.cls === 'facet') return `$${rowTex(x.r)}$: tight at ${ptsTex(x.tight)}, two different points: a <b>facet of $Q$</b>.`;
          if (x.cls === 'one') return `$${rowTex(x.r)}$: tight only at $${ptTex(x.tight[0])}$: a face of dimension 0, <b>valid but not a facet</b> of $Q$.`;
          return `$${rowTex(x.r)}$: the largest value of $${lhs}$ on $Q$ is $${numTex(x.max)}$, below $${numTex(x.r.b)}$. It is <b>never tight</b>: valid, but its face is empty, so not a facet.`;
        })), `The added inequality cuts points off $P$ without defining a facet of the <b>integer hull</b> $Q$.${cutEdge.length >= 2 ? ` (Beyond the slides: on the polygon $P\\cap\\{${addTex}\\}$, before keeping only integer points, it <i>is</i> an edge, from $${ptTex(cutEdge[0])}$ to $${ptTex(cutEdge[cutEdge.length - 1])}$. It stops being one only for $Q$.)` : ''}`),
      },
      {
        title: 'A new facet of Q',
        text: R`$Q$ has ${newFacets.length === 1 ? 'one facet' : `${newFacets.length} facets`} that ${newFacets.length === 1 ? 'is' : 'are'} not in the list above. Write ${newFacets.length === 1 ? 'it' : 'one of them'} with integer coefficients.`,
        fields: [{
          type: 'ineq', label: R`A facet of $Q$ that is not in the list`, answer: listedNew[0], answerText: listedNew[0], alts: listedNew.slice(1), order: NAMES, placeholder: 'e.g. 2x + y <= 4',
          validator: (p) => {
            const names = [...p.terms.keys()];
            if (names.some((k) => k !== 'x' && k !== 'y')) return { ok: false, msg: 'Use only the variables $x$ and $y$.' };
            if (p.op === '=') return { ok: false, msg: 'Write an inequality with $\\le$ or $\\ge$, not an equation.' };
            const s = p.op === '>=' ? -1 : 1;
            const r = { a: [(p.terms.get('x') || ZERO).mul(s), (p.terms.get('y') || ZERO).mul(s)], b: p.rhs.mul(s) };
            if (r.a.every((v) => v.isZero())) return { ok: false, msg: 'The inequality needs $x$ or $y$.' };
            const bad = corners.find((c) => !holds(r, c));
            if (bad) return { ok: false, msg: `Not valid for $Q$: its corner $${ptTex(bad)}$ violates it.` };
            if (candInfo.some((x) => same(x.r, r))) return { ok: false, msg: 'That inequality is already in the list. Look for an edge of $Q$ that no listed inequality describes.' };
            const t = corners.filter((c) => dot(r.a, c).eq(r.b));
            if (t.length === 0) return { ok: false, msg: 'Valid, but never tight on $Q$: lower the right-hand side until the line touches $Q$.' };
            if (t.length === 1) return { ok: false, msg: `Valid, but tight only at $${ptTex(t[0])}$: turn the line so that it runs along an edge of $Q$.` };
            return null;
          },
        }],
        explain: () => frag(
          `The facets of $Q$ are its edges (corners listed counter-clockwise):`,
          ul(qFacets.map((f) => `$${rowTex(f.row)}$, from $${ptTex(f.ends[0])}$ to $${ptTex(f.ends[1])}$${f.listed ? ' (already in the list)' : ': <b>new</b>'}.`)),
          roundedIsNew ? `The new facet $${roundTex}$ is the added inequality with its right-hand side rounded down from $${numTex(added.b)}$ to $${rounded.b.toString()}$: rounding moved the line until it touches $Q$ along an edge.`
            : `Rounding the added inequality down gives $${roundTex}$, which is ${roundInfo.length === 1 ? `tight only at $${ptTex(roundInfo[0])}$` : roundInfo.length === 0 ? 'never tight on $Q$' : 'an edge already listed'}; here the new facet${newFacets.length > 1 ? 's come from other edges' : ' comes from another edge'} of $Q$.`,
        ),
      },
    ],
    wrapup: R`In the plane a facet is an edge: a valid inequality that is tight at two different points. When only integer points are kept, an old facet can shrink to a single corner (dimension 0) and a cut can be valid without ever being tight. With integer coefficients, rounding the right-hand side down keeps every integer point and may give the true facet of the integer hull (20E, Exercise 12: $2x+y\le4.5$ becomes $2x+y\le4$).`,
  };
}

// ---------------------------------------------------------------- random instances
function sloped(rng, X, Y, corner, fractional) {
  const [p, q] = rng.pick([[1, 1], [1, 2], [2, 1]]);
  const a = corner === 'tr' ? [p, q] : corner === 'tl' ? [-p, q] : [p, -q];
  const pt = corner === 'tr' ? [X, Y] : corner === 'tl' ? [0, Y] : [X, 0];
  const depth = rng.int(1, Math.max(1, Math.min(p * X, q * Y) - 1));
  const rhs = a[0] * pt[0] + a[1] * pt[1] - depth;
  return [a[0], a[1], fractional ? `${2 * rhs - 1}/2` : rhs];
}

function acceptable(inst, level) {
  let D;
  try { D = facetData(inst); } catch { return false; }
  if (D.dimP !== 2 || D.dimQ !== 2) return false;
  if (D.removed.length < 1 || D.kept.length < 4) return false;
  if (D.corners.length < 3 || D.corners.length > 6) return false;
  if (D.newFacets.length < 1) return false;
  if (!D.candInfo.every((x) => x.valid)) return false;
  if (D.rows.some((r, i) => D.rows.some((t, j) => j < i && same(r, t))) || D.rows.some((r) => same(r, D.added))) return false;
  const facets = D.rowInfo.filter((x) => x.facet).length;
  if (facets < 3) return false;
  // the sloped rows (index 4 on) must be edges of P, unless it is the deliberate one-point row of level 3
  const slopedOk = D.rowInfo.slice(4).every((x, i) => x.facet || (level === 3 && inst.decoy === i + 4));
  return slopedOk;
}

export function randomFacets(rng, level) {
  for (let t = 0; t < 500; t++) {
    const X = rng.int(2, level === 1 ? 4 : 5), Y = rng.int(2, level === 1 ? 4 : 5);
    const rows = [[-1, 0, 0], [0, -1, 0], [1, 0, X], [0, 1, Y]];
    const k = level === 1 ? 1 : rng.int(1, 2);
    rng.shuffle(['tr', 'tl', 'br']).slice(0, k).forEach((c, i) => rows.push(sloped(rng, X, Y, c, level === 3 && i === 0 && rng.bool(0.5))));
    const inst = { rows };
    if (level === 3 && rng.bool(0.5)) {
      // a valid row that touches P at a single corner (redundant, so not a facet)
      const V = polygonCorners(rows.map(toRow));
      const d = rng.pick([[1, 1], [1, -1], [-1, 1], [2, 1], [1, 2]]);
      const vals = V.map((p) => dot([fr(d[0]), fr(d[1])], p));
      const max = vals.reduce((m, v) => (v.gt(m) ? v : m));
      if (vals.filter((v) => v.eq(max)).length === 1) { rows.push([d[0], d[1], max.toString()]); inst.decoy = rows.length - 1; }
    }
    // the added inequality cuts off the integer points where c.z is largest
    const P = rows.map(toRow);
    const c = rng.pick([[1, 1], [2, 1], [1, 2], [1, 0], [0, 1], [-1, 1], [1, -1], [2, -1], [-1, 2], [3, 1], [1, 3]]);
    const V = polygonCorners(P);
    if (V.length < 3) continue;
    const xs = V.map((p) => p[0].toNumber()), ys = V.map((p) => p[1].toNumber());
    let M = null;
    for (let i = Math.ceil(Math.min(...xs) - 1e-9); i <= Math.floor(Math.max(...xs) + 1e-9); i++) for (let j = Math.ceil(Math.min(...ys) - 1e-9); j <= Math.floor(Math.max(...ys) + 1e-9); j++) {
      const z = [fr(i), fr(j)];
      if (P.every((r) => holds(r, z))) { const v = c[0] * i + c[1] * j; if (M === null || v > M) M = v; }
    }
    if (M === null) continue;
    const f = level === 1 ? '1/2' : rng.pick(['1/2', '1/2', '1/3', '2/3']);
    inst.added = [c[0], c[1], fr(M - 1).add(fr(f)).toString()];
    if (acceptable(inst, level)) return inst;
  }
  return PRESET();
}

const PRESET = () => ({ rows: [[-1, 0, 0], [0, -1, 0], [1, 0, 2], [0, 1, 2], [1, 1, 3]], added: [2, 1, '9/2'] });

export const facetsDrill = {
  id: 'facets', title: 'Facets and integer hulls in the plane', topic: 't206b', minutes: 8,
  blurb: 'Dimension and facets of a polygon, the integer hull after adding a cut, and which inequalities stay facets.',
  presets: [{ id: '20e12', label: 'Pentagon and 2x + y ≤ 4.5 (20E ex. 12)', make: () => ({ ...PRESET(), title: 'Facets and integer hull — 20E exercise 12' }) }],
  random: (rng, level) => ({ ...randomFacets(rng, level), title: 'Facets and integer hulls — practice' }),
  build: buildFacets,
};
