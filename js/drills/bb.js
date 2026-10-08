// Branch-and-bound trainers (slides 102 and 104): the search tree with the instructor's log, and bounds / gaps.
import { Frac } from '../math/frac.js';
import { branchAndBound, relativeGap } from '../math/bb.js';
import { integerPoints } from '../math/lp.js';
import { plotFigure, treeFigure } from '../viz.js';
import { NA } from '../grade.js';
import { linTex } from '../util.js';
import { dataTable, frag, ul } from './common.js';

const fr = (v) => Frac.of(v);
const P = (v) => (v === null || v === undefined ? '—' : fr(v).pretty(4));
const pctOf = (g) => (g === null ? null : g.mul(100));
const pctText = (g) => (g === null ? '—' : `${g.mul(100).toNumber().toFixed(1)}%`);
const pctTex = (g) => (g === null ? '' : `${g.mul(100).toNumber().toFixed(1)}\\%`); // for use inside $...$

// ---------------------------------------------------------------- 2-variable branch and bound
export function toModel(inst) {
  return { sense: 'max', c: inst.c, rows: inst.rows.map((r) => ({ a: r.a, op: '<=', b: Frac.parse(String(r.b)) })), names: inst.names || ['x', 'y'] };
}
function rowTex(r, names) { return `${linTex(r.a, names)} \\le ${Frac.parse(String(r.b)).pretty(4)}`; }
function feasible(model, pt) {
  return model.rows.every((r) => r.a.reduce((s, a, j) => s.add(fr(a).mul(fr(pt[j]))), fr(0)).le(fr(r.b)));
}
function boxOf(model) {
  // crude bounding box from single-variable and positive-coefficient rows
  const ub = [12, 12];
  model.rows.forEach((r) => {
    const a = r.a.map(fr);
    if (a.every((v) => v.sign() >= 0)) a.forEach((v, j) => { if (v.sign() > 0) ub[j] = Math.min(ub[j], Math.floor(fr(r.b).div(v).toNumber())); });
  });
  return ub;
}

export function replay(res, initialInc) {
  const { nodes } = res;
  const status = { 0: 'open' };
  let inc = initialInc;
  const steps = [];
  res.log.filter((L) => L.action.startsWith('branch on')).forEach((L) => {
    const sel = nodes[L.node];
    const before = { ...status };
    const openBefore = Object.keys(status).map(Number).filter((id) => status[id] === 'open').sort((a, b) => a - b);
    const kids = sel.children.map((id) => nodes[id]);
    status[sel.id] = 'branched';
    let newInc = null;
    kids.forEach((k) => { if (k.newIncumbent) newInc = k.bound; });
    const outcome = kids.map((k) => {
      if (k.fate === 'infeasible') return 'infeasible';
      if (k.fate === 'integral') return k.newIncumbent ? 'integral-new' : 'integral-old';
      if (k.fate === 'bound' && !k.closedLater) return 'bound';
      if (newInc !== null && k.bound.le(newInc)) return 'bound';
      return 'open';
    });
    kids.forEach((k, i) => { status[k.id] = outcome[i] === 'open' ? 'open' : outcome[i] === 'infeasible' ? 'inf' : outcome[i].startsWith('integral') ? 'inc' : 'bound'; });
    const otherClosed = [];
    if (newInc !== null) {
      inc = newInc;
      Object.keys(status).map(Number).forEach((id) => { if (status[id] === 'open' && nodes[id].bound.le(inc)) { status[id] = 'bound'; otherClosed.push(id); } });
    }
    steps.push({ L, sel, kids, outcome, before, openBefore, after: { ...status }, incAfter: inc, otherClosed });
  });
  return steps;
}

function buildBB(inst) {
  const model = toModel(inst);
  const names = model.names;
  const incPoint = inst.incumbent || null;
  const res = branchAndBound(model, { incumbent: incPoint ? { x: incPoint } : undefined, branchRule: inst.branchRule || 'first' });
  if (res.status !== 'optimal') throw new Error(res.status === 'infeasible' ? 'The LP relaxation is infeasible.' : 'The search tree is too large for this trainer.');
  const root = res.nodes[0];
  if (!res.log.some((L) => L.action.startsWith('branch on'))) throw new Error('The LP relaxation is already integral: there is nothing to branch on.');
  const incVal0 = incPoint ? incPoint.reduce((s, v, j) => s.add(fr(model.c[j]).mul(fr(v))), fr(0)) : null;
  const steps = replay(res, incVal0);
  const order = inst.branchRule === 'last' ? [...names].reverse() : names;
  const allUnique = res.nodes.every((nd) => nd.lp.status !== 'optimal' || nd.lp.unique);
  const ub = boxOf(model);
  const pts = integerPoints(model.rows, ub);
  const best = res.incumbent.value;
  const optima = pts.filter((p) => p.reduce((s, v, j) => s.add(fr(model.c[j]).mul(v)), fr(0)).eq(best));

  const xmax = inst.xmax || Math.max(4, ub[0] + 1), ymax = inst.ymax || Math.max(4, Math.min(12, Math.ceil(root.lp.x[1].toNumber()) + 2));
  const plot = (marks, extra) => plotFigure({
    xmax, ymax, names,
    cons: model.rows.map((r) => ({ a: r.a[0], b: r.a[1], c: r.b })), extra: extra || [],
    marks, caption: 'Shaded: LP relaxation. Large dots: feasible integer points.',
  });
  const nodeLines = (nd) => (nd.lp.status === 'optimal' ? [`#${nd.id}   ${P(nd.bound)}`, `(${nd.lp.x.map((v) => P(v)).join(', ')})`] : [`#${nd.id}`, 'infeasible']);
  const edgeText = (nd) => (nd.branch ? `${names[nd.branch.var]} ${nd.branch.op === '<=' ? '≤' : '≥'} ${nd.branch.val}` : '');
  const tree = (status, cur, caption) => treeFigure(
    res.nodes.filter((nd) => status[nd.id] !== undefined).map((nd) => ({
      id: nd.id, parent: nd.parent, lines: nodeLines(nd), edge: edgeText(nd),
      cls: `${status[nd.id] === 'open' ? 'open' : status[nd.id] === 'branched' ? '' : status[nd.id]}${nd.id === cur ? ' cur' : ''}`,
    })), caption);
  const OUT = [
    { value: 'open', label: 'Fractional, bound beats the incumbent: stays open', short: 'Stays open' },
    { value: 'infeasible', label: 'Infeasible: closed', short: 'Infeasible' },
    { value: 'integral-new', label: 'Integer and better: new incumbent', short: 'Integer: new incumbent' },
    { value: 'integral-old', label: 'Integer but not better: closed', short: 'Integer: not better' },
    { value: 'bound', label: 'Fractional, bound no better than the incumbent: closed by bound', short: 'Closed by bound' },
  ];
  const outText = { open: 'stays open', infeasible: 'infeasible, closed', 'integral-new': 'integer: new incumbent', 'integral-old': 'integer but not better, closed', bound: 'closed by bound' };

  const built = [];
  const g0 = incVal0 !== null ? relativeGap(incVal0, root.bound) : null;
  built.push({
    title: 'Root node',
    text: `Solve the LP relaxation (graphically: slide the objective line to the last point of the shaded region).${incPoint ? ` ${inst.incumbentNote || 'A feasible integer point is already known'}: $(${incPoint.join(', ')})$.` : ''}`,
    fields: [
      ...(allUnique ? names.map((nm, j) => ({ type: 'num', label: `LP optimum: $${nm}$`, answer: root.lp.x[j] })) : []),
      { type: 'num', label: 'Dual bound from the root, $z_D$', answer: root.bound, mis: incVal0 !== null ? [{ value: incVal0, msg: 'That is the value of the incumbent (the primal bound). The dual bound comes from the relaxation.' }] : undefined },
      ...(incVal0 !== null ? [
        { type: 'num', label: 'Primal bound from the incumbent, $z_P$', answer: incVal0 },
        { type: 'num', label: 'Relative gap $|z_P-z_D|/|z_P|$ in %', answer: pctOf(g0), tol: 0.06, suffix: '%', mis: [{ value: root.bound.sub(incVal0).div(root.bound).mul(100), msg: 'Divide by the incumbent value $|z_P|$, not by the bound.' }] },
      ] : []),
    ],
    explain: () => frag(
      `The LP optimum is $(${root.lp.x.map((v) => v.toLatex()).join(',\\ ')})$ with value $${root.bound.toLatex()}$${root.bound.isInt() ? '' : ` $= ${P(root.bound)}$`}. It is fractional, so it is only an upper bound.`,
      incVal0 !== null ? ` The incumbent gives $z_P=${P(incVal0)}$, so $${P(incVal0)}\\le z^*\\le ${P(root.bound)}$ and the gap is $(${P(root.bound)}-${P(incVal0)})/${P(incVal0)}=${pctTex(g0)}$.` : '',
      plot([{ x: root.lp.x[0], y: root.lp.x[1], cls: 'lp', label: 'LP' }].concat(incPoint ? [{ x: incPoint[0], y: incPoint[1], cls: 'opt', label: 'incumbent' }] : [])),
    ),
  });

  steps.forEach((s, k) => {
    const { L, sel, kids, outcome } = s;
    const v = sel.lp.x[sel.branchVar];
    const fractional = names.filter((_, j) => !sel.lp.x[j].isInt());
    const cols = [];
    if (allUnique) names.forEach((nm, j) => cols.push({ key: `x${j}`, head: `$${nm}$`, kind: 'num', plain: `${nm} of the child LP` }));
    cols.push({ key: 'b', head: 'LP value', kind: 'num', plain: 'LP value' });
    cols.push({ key: 'o', head: 'Outcome', kind: 'choice', options: OUT, plain: 'outcome' });
    const rows = kids.map((kid, i) => {
      const cells = { o: outcome[i], b: kid.lp.status === 'optimal' ? kid.bound : NA };
      if (allUnique) names.forEach((_, j) => { cells[`x${j}`] = kid.lp.status === 'optimal' ? kid.lp.x[j] : NA; });
      return { head: `Node ${kid.id}: $${names[kid.branch.var]} ${kid.branch.op === '<=' ? '\\le' : '\\ge'} ${kid.branch.val}$`, cells };
    });
    const fields = [];
    if (s.openBefore.length > 1) {
      fields.push({
        type: 'choice', label: 'Which open node is processed next (best-bound rule)?',
        options: s.openBefore.map((id) => ({ value: id, label: `Node ${id} (bound ${P(res.nodes[id].bound)})` })), answer: sel.id,
        mis: Object.fromEntries(s.openBefore.filter((id) => id !== sel.id).map((id) => [id, 'Best-bound selection takes the open node with the largest LP value (for a maximisation).'])),
      });
    }
    fields.push({ type: 'num', label: 'Best bound $z_D$ at this moment', answer: L.best });
    if (L.gap !== null) fields.push({ type: 'num', label: 'Gap at this moment, in %', answer: pctOf(L.gap), tol: 0.06, suffix: '%' });
    fields.push({ type: 'choice', label: 'Branching variable', options: names.map((nm) => ({ value: nm, label: `$${nm}$` })), answer: names[sel.branchVar] });
    fields.push({ type: 'table', label: `The two children (write <code>-</code> where a child has no LP value)`, corner: 'Child', columns: cols, rows });
    if (s.incAfter !== null) fields.push({ type: 'num', label: 'Incumbent value after this step', answer: s.incAfter });

    built.push({
      title: `Process node ${sel.id}`,
      text: () => frag(
        k === 0 ? 'The root is the only open node.' : 'Tree so far (amber: open, green: integer, red: closed):',
        k === 0 ? null : tree(s.before, null, `Incumbent value: ${L.incumbent === null ? 'none' : P(L.incumbent)}`),
        `Branch, solve both child LPs, and decide what happens to each child.`,
      ),
      fields,
      explain: () => {
        const lines = [];
        if (s.openBefore.length > 1) lines.push(`Open nodes: ${s.openBefore.map((id) => `${id} (${P(res.nodes[id].bound)})`).join(', ')}. Node ${sel.id} has the largest bound, so it is processed and $z_D=${P(L.best)}$${L.gap !== null ? `, gap $(${P(L.best)}-${P(L.incumbent)})/${P(L.incumbent)}=${pctTex(L.gap)}$` : ''}.`);
        else lines.push(`$z_D=${P(L.best)}$${L.gap !== null ? ` and the gap is ${pctText(L.gap)}` : ''}.`);
        lines.push(`Its LP optimum is $(${sel.lp.x.map((x) => P(x)).join(', ')})$. ${fractional.length > 1 ? `Both variables are fractional; the rule takes $${names[sel.branchVar]}$ first.` : `Only $${names[sel.branchVar]}$ is fractional.`} Branch: $${names[sel.branchVar]}\\le ${v.floor()}$ or $${names[sel.branchVar]}\\ge ${v.ceil()}$.`);
        kids.forEach((kid, i) => {
          const where = `Node ${kid.id} ($${names[kid.branch.var]} ${kid.branch.op === '<=' ? '\\le' : '\\ge'} ${kid.branch.val}$)`;
          if (kid.lp.status !== 'optimal') lines.push(`${where}: the LP is infeasible, so the node is closed.`);
          else lines.push(`${where}: LP optimum $(${kid.lp.x.map((x) => P(x)).join(', ')})$ with value ${P(kid.bound)} — <b>${outText[outcome[i]]}</b>${outcome[i] === 'bound' ? ` (${P(kid.bound)} ≤ incumbent ${P(s.incAfter)})` : ''}.`);
        });
        if (s.otherClosed.length) lines.push(`The new incumbent ${P(s.incAfter)} also closes node${s.otherClosed.length > 1 ? 's' : ''} ${s.otherClosed.join(', ')} by bound.`);
        return frag(ul(lines), tree(s.after, null, `After this step. Incumbent value: ${s.incAfter === null ? 'none' : P(s.incAfter)}`));
      },
    });
  });

  const count = (f) => res.nodes.filter((nd) => nd.fate === f).length;
  built.push({
    title: 'Conclusion',
    text: 'No open node is left. Report the result and how the tree certifies it.',
    fields: [
      { type: 'num', label: 'Optimal value $z^*$', answer: best },
      ...(optima.length === 1 ? names.map((nm, j) => ({ type: 'num', label: `Optimal $${nm}$`, answer: res.incumbent.x[j] })) : []),
      { type: 'int', label: 'Nodes in the tree (root included)', answer: res.nodes.length },
      { type: 'int', label: 'Leaves closed by infeasibility', answer: count('infeasible') },
      { type: 'int', label: 'Leaves closed by integrality', answer: count('integral') },
      { type: 'int', label: 'Leaves closed by bound', answer: count('bound') },
    ],
    explain: () => frag(
      `$z^*=${P(best)}$ at $(${res.incumbent.x.map((x) => P(x)).join(', ')})$${optima.length > 1 ? ` (other optimal points: ${optima.filter((p) => !p.every((v, j) => fr(v).eq(res.incumbent.x[j]))).map((p) => `(${p.join(', ')})`).join(', ')})` : ''}. Every leaf is closed for one of the three reasons, so no unexplored region can contain a better integer point: the tree is the optimality certificate.`,
      dataTable(['Node', 'Depth', 'Local bound', 'Incumbent', 'Best bound', 'Gap', 'Action'], res.log.map((L) => [L.node, L.depth, P(L.local), P(L.incumbent), P(L.best), pctText(L.gap), `${L.action}${L.closed.length ? `; close ${L.closed.join(', ')}` : ''}`]), 'compact'),
      tree(steps.length ? steps[steps.length - 1].after : { 0: 'inc' }, null, 'Complete tree'),
    ),
  });

  return {
    id: 'bb2d', topic: 't102', title: inst.title || 'Branch and bound',
    statement: () => frag(
      `Solve by LP-based branch and bound: $$\\max\\ ${linTex(model.c, names)}\\quad\\text{s.t.}\\quad ${model.rows.map((r) => rowTex(r, names)).join(',\\quad ')},\\quad ${names.join(', ')}\\in\\mathbb{Z}_+ .$$`,
      plot([]),
    ),
    rules: `Branch on the first fractional variable in the order $${order.join(', ')}$. Solve both children as soon as they are created (left child: $\\le$, right child: $\\ge$; nodes are numbered in order of creation). A child is closed at once if it is infeasible, integer, or its value is no better than the incumbent. Always process the open node with the best bound next. Gap $=|z_P-z_D|/|z_P|$.`,
    steps: built,
    wrapup: 'Dual bounds only come down and the incumbent only goes up, so the gap shrinks to zero. On an exam, state for every leaf which of the three reasons closes it.',
  };
}

const WORKSHOP = [{ a: [1, 0], b: '3' }, { a: [-1, 1], b: '3.7' }, { a: [1, 1], b: '6.3' }];

function randomBB(rng, level) {
  const frac = () => rng.pick(['.2', '.3', '.5', '.7', '.8']);
  const make = () => {
    if (level <= 2) {
      const ux = rng.int(3, 5);
      const p = `${rng.int(1, 3)}${frac()}`, q = `${rng.int(5, 8)}${frac()}`;
      const c = rng.bool(0.7) ? [rng.int(1, 3), rng.int(5, 10)] : [rng.int(4, 9), rng.int(2, 5)];
      const rows = [{ a: [1, 0], b: String(ux) }, { a: [-1, 1], b: p }, { a: [1, 1], b: q }];
      if (level === 2 && rng.bool(0.4)) rows.push({ a: [0, 1], b: `${rng.int(3, 5)}${frac()}` });
      return { c, rows, branchRule: 'first' };
    }
    const rows = [{ a: [rng.int(1, 4), rng.int(1, 4)], b: `${rng.int(9, 20)}${rng.bool(0.5) ? '.5' : ''}` }, { a: [rng.int(-2, 3), rng.int(1, 4)], b: `${rng.int(6, 14)}` }, { a: [1, 0], b: String(rng.int(3, 6)) }];
    return { c: [rng.int(2, 7), rng.int(2, 9)], rows, branchRule: rng.bool(0.3) ? 'last' : 'first' };
  };
  const accept = (inst) => {
    const model = toModel(inst);
    let root;
    try { root = branchAndBound(model, { branchRule: inst.branchRule, maxNodes: 40 }); } catch { return false; }
    if (root.status !== 'optimal' || root.nodes[0].fate !== 'branched') return false;
    const floorPt = root.nodes[0].lp.x.map((v) => Number(v.floor().toString()));
    if (!feasible(model, floorPt) || floorPt.every((v) => v === 0)) return false;
    inst.incumbent = floorPt;
    inst.incumbentNote = 'Rounding the LP optimum down gives a feasible point';
    const res = branchAndBound(model, { incumbent: { x: floorPt }, branchRule: inst.branchRule, maxNodes: 40 });
    if (res.status !== 'optimal') return false;
    const n = res.nodes.length;
    const [lo, hi] = level === 1 ? [3, 5] : level === 2 ? [5, 9] : [5, 11];
    if (n < lo || n > hi) return false;
    if (!res.nodes.every((nd) => nd.lp.status !== 'optimal' || (nd.lp.unique && nd.lp.x.concat([nd.bound]).every((v) => v.isTerminating() && v.pretty(3) === v.pretty(8))))) return false;
    if (res.incumbent.value.sign() <= 0) return false;
    const ub = boxOf(model);
    const best = res.incumbent.value;
    return integerPoints(model.rows, ub).filter((p) => p.reduce((s, v, j) => s.add(fr(model.c[j]).mul(v)), fr(0)).eq(best)).length === 1;
  };
  for (let i = 0; i < 4000; i++) { const inst = make(); if (accept(inst)) return inst; }
  return { c: [1, 10], rows: WORKSHOP, incumbent: [1, 4], incumbentNote: 'Rounding the LP optimum and repairing it gives a feasible point', xmax: 4, ymax: 6 };
}

export const bbDrill = {
  id: 'bb2d', title: 'Branch and bound: tree and log', topic: 't102', minutes: 14,
  blurb: 'Process the tree node by node with best-bound selection: child LPs, fathoming reason, incumbent, bound and gap, exactly as in the lecture log.',
  presets: [
    { id: 'workshop', label: 'Workshop example (slides 102)', make: () => ({ c: [1, 10], rows: WORKSHOP, incumbent: [1, 4], incumbentNote: 'Rounding the LP optimum and repairing it gives a feasible point', xmax: 4, ymax: 6, title: 'Branch and bound — workshop example (slides 102)' }) },
    { id: 'plus-xy6', label: 'Workshop + x + y ≤ 6 (slides 104)', make: () => ({ c: [1, 10], rows: WORKSHOP.concat([{ a: [1, 1], b: '6' }]), incumbent: [1, 4], incumbentNote: 'The same starting incumbent is used', xmax: 4, ymax: 6, title: 'Branch and bound — stronger formulation with x + y ≤ 6 (slides 104)' }) },
    { id: 'plus-yx3', label: 'Workshop + y ≤ x + 3, branch on y first (slides 104)', make: () => ({ c: [1, 10], rows: WORKSHOP.concat([{ a: [-1, 1], b: '3' }]), incumbent: [1, 4], incumbentNote: 'The same starting incumbent is used', branchRule: 'last', xmax: 4, ymax: 6, title: 'Branch and bound — with y ≤ x + 3, branching on y first (slides 104)' }) },
  ],
  random: (rng, level) => ({ ...randomBB(rng, level), title: 'Branch and bound — practice instance' }),
  build: buildBB,
  custom: {
    help: 'A maximisation problem in two nonnegative integer variables $x, y$. Objective coefficients, then one constraint per line as <code>a b rhs</code> meaning $a\\,x + b\\,y \\le \\text{rhs}$. Optionally a known feasible integer point.',
    fields: [
      { key: 'c', label: 'Objective coefficients (x y)', kind: 'text', value: '1 10' },
      { key: 'rows', label: 'Constraints (a b rhs)', kind: 'textarea', value: '1 0 3\n-1 1 3.7\n1 1 6.3' },
      { key: 'inc', label: 'Known feasible point (optional)', kind: 'text', value: '1 4' },
      { key: 'rule', label: 'Branch first on (x or y)', kind: 'text', value: 'x' },
    ],
    parse(v) {
      const nums = (s) => String(s).trim().split(/[\s,]+/).filter(Boolean);
      const c = nums(v.c).map(Number);
      if (c.length !== 2 || c.some((x) => !Number.isFinite(x))) throw new Error('Give two objective coefficients.');
      const rows = String(v.rows).split(/\n+/).map((l) => nums(l)).filter((t) => t.length).map((t) => {
        if (t.length !== 3) throw new Error(`Each constraint needs three numbers: "${t.join(' ')}"`);
        if (!Frac.tryParse(t[2]) || t.slice(0, 2).some((x) => !Number.isInteger(Number(x)))) throw new Error('Use integer coefficients and a numeric right-hand side.');
        return { a: [Number(t[0]), Number(t[1])], b: t[2] };
      });
      if (rows.length < 2 || rows.length > 6) throw new Error('Use between 2 and 6 constraints.');
      const inst = { c, rows, branchRule: /^y/i.test(String(v.rule).trim()) ? 'last' : 'first', title: 'Branch and bound — your instance' };
      const incT = nums(v.inc);
      if (incT.length === 2) {
        const pt = incT.map(Number);
        if (pt.some((x) => !Number.isInteger(x) || x < 0)) throw new Error('The known point must have nonnegative integer coordinates.');
        if (!feasible(toModel(inst), pt)) throw new Error('The known point violates a constraint.');
        inst.incumbent = pt;
      } else if (incT.length) throw new Error('The known point needs two coordinates (or leave it empty).');
      return inst;
    },
  },
};

// ---------------------------------------------------------------- bounds and gaps
function buildGaps(inst) {
  const { sense, inc, open, cand, zr, zstar } = inst;
  const max = sense === 'max';
  const relPct = (p, d) => fr(p).sub(fr(d)).abs().div(fr(p).abs()).mul(100);
  const best = max ? Math.max(...open) : Math.min(...open);
  const zD = max ? Math.max(best, inc) : Math.min(best, inc);
  const gapPct = relPct(inc, zD);
  const prunable = open.filter((b) => (max ? b <= inc : b >= inc));
  const candBetter = max ? cand.value > inc : cand.value < inc;
  const inc2 = candBetter ? cand.value : inc;
  const open2 = open.filter((b, i) => i !== cand.index && (max ? b > inc2 : b < inc2));
  const zD2 = open2.length ? (max ? Math.max(...open2) : Math.min(...open2)) : inc2;
  const gap2 = relPct(inc2, zD2);
  const rootGap = fr(zr).sub(fr(zstar)).abs().div(fr(Math.max(1, Math.abs(zstar)))).mul(100);
  const word = max ? 'maximisation' : 'minimisation';
  return {
    id: 'gaps', topic: 't102', title: inst.title || 'Bounds and gaps',
    statement: () => frag(
      `A <b>${word}</b> problem is being solved by branch and bound. The incumbent has value <b>${inc}</b>. The open nodes have LP values:`,
      dataTable(['Open node'].concat(open.map((_, i) => String.fromCharCode(65 + i))), [['LP value'].concat(open)], 'compact'),
    ),
    rules: 'Primal bound = value of the best feasible solution known. Dual bound = the best value still possible according to the relaxations. Solver gap $=|z_P-z_D|/|z_P|$.',
    steps: [
      {
        title: 'Which bound is which',
        fields: [
          { type: 'choice', label: 'The incumbent value is', options: [{ value: 'lb', label: 'a lower bound on $z^*$' }, { value: 'ub', label: 'an upper bound on $z^*$' }], answer: max ? 'lb' : 'ub', mis: { [max ? 'ub' : 'lb']: `A feasible solution of a ${word} can only be ${max ? 'at or below' : 'at or above'} the optimum.` } },
          { type: 'num', label: 'Primal bound $z_P$', answer: inc },
          { type: 'num', label: 'Global dual bound $z_D$', answer: zD, mis: [{ value: max ? Math.min(...open) : Math.max(...open), msg: `Take the ${max ? 'largest' : 'smallest'} LP value among the open nodes: the optimum could still be in the most promising one.` }] },
          { type: 'num', label: 'Absolute gap', answer: fr(inc).sub(fr(zD)).abs() },
          { type: 'num', label: 'Relative gap in %', answer: gapPct, tol: 0.06, suffix: '%', mis: [{ value: relPct(zD, inc), msg: 'The solver divides by the incumbent value $|z_P|$, not by the bound.' }] },
        ],
        explain: `In a ${word} the incumbent is ${max ? 'a lower' : 'an upper'} bound and the relaxations give ${max ? 'an upper' : 'a lower'} bound. $z_D=${max ? '\\max' : '\\min'}\\{${open.join(', ')}\\}=${best}$${zD !== best ? `, but the bound is never ${max ? 'below' : 'above'} the incumbent, so $z_D=${zD}$` : ''}. Gap $=|${inc}-${zD}|/|${inc}|=${gapPct.toNumber().toFixed(1)}\\%$.`,
      },
      {
        title: 'Fathoming by bound',
        text: 'Which open nodes can be closed right now, without solving anything else?',
        fields: [{ type: 'set', label: 'Nodes closed by bound (letters, or <code>none</code>)', answer: open.map((b, i) => [b, String.fromCharCode(97 + i)]).filter(([b]) => (max ? b <= inc : b >= inc)).map(([, l]) => l), chars: true, placeholder: 'e.g. B, D or none' }],
        explain: prunable.length ? `A node whose LP value is ${max ? 'at most' : 'at least'} the incumbent ${inc} cannot contain a strictly better solution: ${open.map((b, i) => ((max ? b <= inc : b >= inc) ? `${String.fromCharCode(65 + i)} (${b})` : null)).filter(Boolean).join(', ')}.` : `Every open node still has an LP value ${max ? 'above' : 'below'} the incumbent ${inc}, so none can be closed.`,
      },
      {
        title: 'A new integer solution',
        text: `Node ${String.fromCharCode(65 + cand.index)} is processed and one of its children has an <b>integer</b> LP optimum with value <b>${cand.value}</b>. The other child is infeasible. All other open nodes are unchanged.`,
        fields: [
          { type: 'choice', label: 'Does it become the incumbent?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], answer: candBetter ? 'yes' : 'no' },
          { type: 'num', label: 'Incumbent value afterwards', answer: inc2 },
          { type: 'num', label: 'Global dual bound afterwards', answer: zD2 },
          { type: 'num', label: 'Relative gap afterwards, in %', answer: gap2, tol: 0.06, suffix: '%' },
        ],
        explain: `${cand.value} is ${candBetter ? 'better' : 'not better'} than ${inc}, so the incumbent is ${inc2}. Node ${String.fromCharCode(65 + cand.index)} leaves the open list; the nodes that remain open and can still beat ${inc2} are ${open2.length ? open2.join(', ') : 'none'}, so $z_D=${zD2}$ and the gap is ${gap2.toNumber().toFixed(1)}%.${open2.length ? '' : ' The gap is zero: the incumbent is proved optimal.'}`,
      },
      {
        title: 'Root gap of a formulation',
        text: `A different question, with the formula of slides 104: a formulation has root relaxation value $z_R=${zr}$ and the optimal value is $z^*=${zstar}$.`,
        fields: [{ type: 'num', label: 'Root gap $|z_R-z^*|/\\max\\{1,|z^*|\\}$ in %', answer: rootGap, tol: 0.06, suffix: '%' }],
        explain: `$|${zr}-${zstar}|/\\max\\{1,${Math.abs(zstar)}\\}=${rootGap.toNumber().toFixed(1)}\\%$. This measures a formulation against the true optimum; the solver gap above measures the current incumbent against the current bound.`,
      },
    ],
    wrapup: 'Keep the two sides apart: heuristics and integer leaves move the primal bound, relaxations and branching move the dual bound. A node is closed by bound exactly when its LP value cannot beat the incumbent.',
  };
}

function randomGaps(rng, level) {
  const sense = level === 1 ? 'max' : rng.pick(['max', 'min']);
  const max = sense === 'max';
  const inc = rng.int(4, 30) * 10 + rng.pick([0, 0, 5]);
  const spread = () => rng.int(1, 12) * (level >= 2 ? 0.5 : 1);
  const n = rng.int(3, 4);
  const open = [];
  while (open.length < n) {
    const better = open.length < 2 || rng.bool(0.6);
    const v = better ? (max ? inc + spread() : inc - spread()) : (max ? inc - rng.int(0, 6) : inc + rng.int(0, 6));
    if (!open.includes(v)) open.push(v);
  }
  const candIdx = open.findIndex((b) => (max ? b > inc : b < inc));
  const improving = rng.bool(0.7);
  const delta = rng.int(1, 3) * (level >= 2 ? 0.5 : 1);
  const bnd = open[candIdx];
  let value = improving ? (max ? Math.min(bnd, inc + delta) : Math.max(bnd, inc - delta)) : (max ? inc - rng.int(1, 4) : inc + rng.int(1, 4));
  if (value === inc) value = max ? inc + 0.5 : inc - 0.5;
  if (max ? value > bnd : value < bnd) value = bnd;
  const zstar = rng.int(20, 90);
  const zr = max ? zstar + rng.int(2, 15) + rng.pick([0, 0.3, 0.5, 0.65]) : zstar - rng.int(2, 15) - rng.pick([0, 0.3, 0.5]);
  return { sense, inc, open: rng.shuffle(open), cand: { index: 0, value }, zr, zstar, _b: bnd };
}

export const gapsDrill = {
  id: 'gaps', title: 'Bounds and gaps', topic: 't102', minutes: 5,
  blurb: 'Primal versus dual bound for max and min problems, global bound from open nodes, pruning, and the two gap formulas.',
  presets: [
    { id: 'slides', label: 'Workshop numbers (slides 102, 104)', make: () => ({ sense: 'max', inc: 41, open: [48, 45], cand: { index: 1, value: 42 }, zr: 51.3, zstar: 42, title: 'Bounds and gaps — workshop numbers (slides 102, 104)' }) },
  ],
  random: (rng, level) => {
    const inst = randomGaps(rng, level);
    inst.cand.index = inst.open.indexOf(inst._b);
    delete inst._b;
    return { ...inst, title: 'Bounds and gaps — practice' };
  },
  build: buildGaps,
};
