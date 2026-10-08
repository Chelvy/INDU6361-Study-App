// LP-based branch-and-bound following the conventions of the course slides (lecture 102):
//  - children are solved when they are created;
//  - a child closes at once if it is infeasible, integral, or cannot improve the incumbent;
//  - the next node processed is the open node with the best bound (ties: smallest id);
//  - the log shows Local bound, Incumbent, Best bound and Gurobi's relative gap |zP - zD| / |zP|.
import { Frac, ZERO } from './frac.js';
import { solveLP } from './lp.js';

const fr = (v) => Frac.of(v);

export function relativeGap(zP, zD) {
  if (zP === null || zD === null) return null;
  const p = fr(zP), d = fr(zD);
  if (p.isZero()) return d.isZero() ? ZERO : null; // null = infinite / undefined
  return p.sub(d).abs().div(p.abs());
}

export function branchAndBound(model, opts = {}) {
  const sense = model.sense || 'max';
  const n = model.c.length;
  const names = model.names || Array.from({ length: n }, (_, i) => `x${i + 1}`);
  const isInt = model.integer || Array.from({ length: n }, () => true);
  const branchRule = opts.branchRule || 'first';
  const maxNodes = opts.maxNodes || 400;
  const better = (a, b) => (sense === 'max' ? a.gt(b) : a.lt(b)); // a strictly better than b
  const cannotImprove = (bound, inc) => (sense === 'max' ? bound.le(inc) : bound.ge(inc));

  let incumbent = null;
  if (opts.incumbent) {
    const x = opts.incumbent.x.map(fr);
    let v = ZERO;
    x.forEach((xi, j) => { v = v.add(fr(model.c[j]).mul(xi)); });
    incumbent = { x, value: v, node: null };
  }

  const nodes = [];
  const log = [];

  const solveNode = (cons) => {
    const rows = model.rows.concat(cons.map((k) => {
      const a = Array.from({ length: n }, (_, j) => (j === k.var ? 1 : 0));
      return { a, op: k.op, b: k.val };
    }));
    return solveLP({ sense, c: model.c, rows, names });
  };

  // 'first' = lowest-index fractional variable, 'last' = highest-index, 'mostFractional' = closest to .5.
  const fractionalVar = (x) => {
    let pick = -1;
    let bestDist = null;
    for (let j = 0; j < n; j++) {
      if (!isInt[j] || x[j].isInt()) continue;
      if (branchRule === 'first') return j;
      if (branchRule === 'last') { pick = j; continue; }
      const f = x[j].fracPart();
      const dist = f.sub(new Frac(1n, 2n)).abs();
      if (bestDist === null || dist.lt(bestDist)) { bestDist = dist; pick = j; }
    }
    return pick;
  };

  const makeNode = (parent, branch) => {
    const cons = parent ? parent.cons.concat([branch]) : [];
    const lp = solveNode(cons);
    const node = {
      id: nodes.length, parent: parent ? parent.id : null, depth: parent ? parent.depth + 1 : 0,
      branch: branch || null, cons, lp, fate: 'open', newIncumbent: false, branchVar: null, children: [],
      bound: lp.status === 'optimal' ? lp.obj : null,
    };
    nodes.push(node);
    if (lp.status !== 'optimal') { node.fate = 'infeasible'; return node; }
    const fv = fractionalVar(lp.x);
    if (fv < 0) {
      node.fate = 'integral';
      if (!incumbent || better(lp.obj, incumbent.value)) {
        incumbent = { x: lp.x, value: lp.obj, node: node.id };
        node.newIncumbent = true;
      }
      return node;
    }
    if (incumbent && cannotImprove(lp.obj, incumbent.value)) { node.fate = 'bound'; return node; }
    node.branchVar = fv;
    return node;
  };

  const openNodes = () => nodes.filter((nd) => nd.fate === 'open');
  const bestOpenBound = () => {
    const open = openNodes();
    if (!open.length) return null;
    return open.map((nd) => nd.bound).reduce((a, b) => (better(b, a) ? b : a));
  };
  const globalBound = () => {
    const b = bestOpenBound();
    if (b === null) return incumbent ? incumbent.value : null;
    if (!incumbent) return b;
    return better(b, incumbent.value) ? b : incumbent.value;
  };
  const pruneByIncumbent = () => {
    const closed = [];
    for (const nd of openNodes()) {
      if (incumbent && cannotImprove(nd.bound, incumbent.value)) { nd.fate = 'bound'; nd.closedLater = true; closed.push(nd.id); }
    }
    return closed;
  };
  const pushLog = (node, action, extra = {}) => {
    const gb = extra.best !== undefined ? extra.best : globalBound();
    log.push({
      node: node.id, depth: node.depth, local: node.bound,
      incumbent: incumbent ? incumbent.value : null,
      best: gb, gap: incumbent && gb !== null ? relativeGap(incumbent.value, gb) : null,
      action, closed: extra.closed || [],
    });
  };

  const root = makeNode(null, null);
  if (root.fate === 'infeasible') return { status: 'infeasible', nodes, log, incumbent: null, sense, names };
  if (root.fate !== 'open') {
    pushLog(root, root.fate === 'integral' ? 'integral: optimal at the root' : 'closed by bound');
    return { status: 'optimal', nodes, log, incumbent, sense, names };
  }

  while (openNodes().length) {
    if (nodes.length > maxNodes) return { status: 'node-limit', nodes, log, incumbent, sense, names };
    const open = openNodes();
    let sel = open[0];
    for (const nd of open) if (better(nd.bound, sel.bound)) sel = nd;
    const bestAtSelection = incumbent && !better(sel.bound, incumbent.value) ? incumbent.value : sel.bound;
    const incBefore = incumbent ? incumbent.value : null;

    sel.fate = 'branched';
    const j = sel.branchVar;
    const v = sel.lp.x[j];
    const kids = [
      makeNode(sel, { var: j, op: '<=', val: v.floor() }),
      makeNode(sel, { var: j, op: '>=', val: v.ceil() }),
    ];
    sel.children = kids.map((k) => k.id);
    const incKid = kids.find((k) => k.newIncumbent);
    const closedKids = kids.filter((k) => k.fate !== 'open' && !k.newIncumbent).map((k) => k.id);

    // Parent row uses the incumbent and bound as they were when the node was selected.
    log.push({
      node: sel.id, depth: sel.depth, local: sel.bound, incumbent: incBefore, best: bestAtSelection,
      gap: incBefore !== null ? relativeGap(incBefore, bestAtSelection) : null,
      action: `branch on ${names[j]}`, closed: incKid ? [] : closedKids,
    });
    if (incKid) {
      const pruned = pruneByIncumbent();
      const closedNow = closedKids.concat(pruned);
      pushLog(incKid, 'incumbent', { closed: closedNow });
    }
  }
  return { status: 'optimal', nodes, log, incumbent, sense, names };
}

// Text description of a node's accumulated branching constraints, e.g. "x >= 2, y <= 4".
export function describeNode(node, names) {
  if (!node.cons.length) return 'root';
  return node.cons.map((k) => `${names[k.var]} ${k.op === '<=' ? '≤' : '≥'} ${k.val}`).join(', ');
}
