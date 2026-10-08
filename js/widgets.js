// Interactive figures that lessons can embed: WIDGETS[name](container, options).
import { h, rich, clear, renderMath } from './util.js';
import { Frac } from './math/frac.js';
import { solveLP } from './math/lp.js';
import { branchAndBound } from './math/bb.js';
import { gomoryCuttingPlanes } from './math/cuts.js';
import { kelley } from './math/convex.js';
import { plotFigure, treeFigure } from './viz.js';
import { toModel, replay } from './drills/bb.js';
import { dataTable } from './drills/common.js';

const fr = (v) => Frac.of(v);
const P = (v) => (v === null || v === undefined ? '—' : fr(v).pretty(4));
const WORKSHOP = [{ a: [1, 0], b: '3' }, { a: [-1, 1], b: '3.7' }, { a: [1, 1], b: '6.3' }];
const cons = (rows) => rows.map((r) => ({ a: r.a[0], b: r.a[1], c: Frac.parse(String(r.b)) }));

function stepper(container, count, draw, labels = {}) {
  let k = 0;
  const host = h('div');
  const info = h('span', { class: 'muted small' });
  const prev = h('button', { type: 'button', class: 'btn small' }, labels.prev || '← Back');
  const next = h('button', { type: 'button', class: 'btn small primary' }, labels.next || 'Next step →');
  const update = () => {
    clear(host);
    draw(host, k);
    renderMath(host);
    prev.disabled = k === 0; next.disabled = k === count - 1;
    info.textContent = `Step ${k + 1} of ${count}`;
  };
  prev.addEventListener('click', () => { if (k > 0) { k -= 1; update(); } });
  next.addEventListener('click', () => { if (k < count - 1) { k += 1; update(); } });
  container.appendChild(h('div', { class: 'row', style: 'margin-bottom:.5rem' }, prev, next, info));
  container.appendChild(host);
  update();
}

// Branch and bound on the workshop example, one processed node at a time (slides 102).
function bbWorkshop(container) {
  const inst = { c: [1, 10], rows: WORKSHOP };
  const model = toModel(inst);
  const res = branchAndBound(model, { incumbent: { x: [1, 4] } });
  const steps = replay(res, fr(41));
  const names = ['x', 'y'];
  const lines = (nd) => (nd.lp.status === 'optimal' ? [`#${nd.id}   ${P(nd.bound)}`, `(${nd.lp.x.map(P).join(', ')})`] : [`#${nd.id}`, 'infeasible']);
  const edge = (nd) => (nd.branch ? `${names[nd.branch.var]} ${nd.branch.op === '<=' ? '≤' : '≥'} ${nd.branch.val}` : '');
  const tree = (status, cur) => treeFigure(res.nodes.filter((nd) => status[nd.id] !== undefined).map((nd) => ({ id: nd.id, parent: nd.parent, lines: lines(nd), edge: edge(nd), cls: `${status[nd.id] === 'open' ? 'open' : status[nd.id] === 'branched' ? '' : status[nd.id]}${nd.id === cur ? ' cur' : ''}` })), 'Amber: open. Green: integer. Red: closed (infeasible or by bound). Each box: node number, LP value, LP solution.');
  const rows = res.log.filter((L) => L.action.startsWith('branch on'));
  container.appendChild(rich('<b>Step through the search.</b> Maximise $x+10y$ over the workshop region; the starting incumbent is $(1,4)$ with value 41.', 'p'));
  stepper(container, steps.length + 1, (host, k) => {
    if (k === 0) {
      host.appendChild(plotFigure({ xmax: 4, ymax: 6, cons: cons(WORKSHOP), marks: [{ x: 1.3, y: 5, cls: 'lp', label: 'LP 51.3' }, { x: 1, y: 4, cls: 'opt', label: 'incumbent 41' }], caption: 'Root: LP optimum (1.3, 5) with value 51.3, so 41 ≤ z* ≤ 51.3. Gap (51.3 − 41)/41 = 25.1%.' }));
      host.appendChild(tree({ 0: 'open' }, 0));
      return;
    }
    const s = steps[k - 1];
    const extra = s.sel.cons.map((c) => ({ a: c.op === '<=' ? (c.var === 0 ? 1 : 0) : (c.var === 0 ? -1 : 0), b: c.op === '<=' ? (c.var === 1 ? 1 : 0) : (c.var === 1 ? -1 : 0), c: c.op === '<=' ? c.val : c.val.neg() }));
    host.appendChild(rich(`<b>Process node ${s.sel.id}</b> (largest bound among the open nodes: ${P(s.L.best)}; gap ${s.L.gap ? `${s.L.gap.mul(100).toNumber().toFixed(1)}%` : '—'}). Its LP optimum is (${s.sel.lp.x.map(P).join(', ')}); branch on $${names[s.sel.branchVar]}$. ${s.kids.map((kid, i) => `Node ${kid.id}: ${kid.lp.status === 'optimal' ? `value ${P(kid.bound)}` : 'infeasible'} → ${{ open: 'stays open', infeasible: 'closed', 'integral-new': 'new incumbent', 'integral-old': 'integer, not better: closed', bound: 'closed by bound' }[s.outcome[i]]}`).join('. ')}. Incumbent after this step: ${P(s.incAfter)}.`, 'p'));
    host.appendChild(tree(s.after, s.sel.id));
    host.appendChild(plotFigure({ xmax: 4, ymax: 6, cons: cons(WORKSHOP), extra, marks: [{ x: s.sel.lp.x[0], y: s.sel.lp.x[1], cls: 'lp', label: `node ${s.sel.id}` }], caption: `Region of node ${s.sel.id} (dashed lines: its branching constraints) and its LP optimum.` }));
    if (k === steps.length) host.appendChild(dataTable(['Node', 'Depth', 'Local UB', 'Incumbent', 'Best UB', 'Gap', 'Action'], res.log.map((L) => [L.node, L.depth, P(L.local), P(L.incumbent), P(L.best), L.gap ? `${L.gap.mul(100).toNumber().toFixed(1)}%` : '—', `${L.action}${L.closed.length ? `; close ${L.closed.join(', ')}` : ''}`]), 'compact'));
  });
  void rows;
}

// Formulation strength on the workshop example (slides 104).
function strength(container) {
  const variants = [
    { id: 'nat', label: 'Natural', rows: WORKSHOP, rule: 'first' },
    { id: 'xy6', label: '+ x + y ≤ 6', rows: WORKSHOP.concat([{ a: [1, 1], b: '6' }]), rule: 'first' },
    { id: 'yx3', label: '+ y ≤ x + 3', rows: WORKSHOP.concat([{ a: [-1, 1], b: '3' }]), rule: 'last' },
    { id: 'hull', label: 'Integer hull', rows: [{ a: [1, 0], b: '3' }, { a: [1, 1], b: '6' }, { a: [-1, 1], b: '3' }, { a: [0, 1], b: '4' }], rule: 'first' },
  ];
  const host = h('div');
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Formulation' });
  const draw = (v) => {
    clear(host);
    const model = toModel({ c: [1, 10], rows: v.rows });
    const lp = solveLP(model);
    const bb = branchAndBound(model, { incumbent: { x: [1, 4] }, branchRule: v.rule });
    const gap = lp.obj.sub(42).abs().div(42).mul(100).toNumber().toFixed(1);
    host.appendChild(plotFigure({ xmax: 4, ymax: 6, cons: cons(v.rows), marks: [{ x: lp.x[0], y: lp.x[1], cls: 'lp', label: `LP ${P(lp.obj)}` }, { x: 2, y: 4, cls: 'opt', label: 'z* = 42' }], caption: `${v.label}: root bound ${P(lp.obj)}, root gap ${gap}%, ${bb.nodes.length} node${bb.nodes.length > 1 ? 's' : ''} in the tree${v.rule === 'last' ? ' (branching on y first, as on the slide)' : ''}.` }));
    host.appendChild(rich('All four formulations contain exactly the same integer points (the large dots). Only the shaded LP region changes: the smaller it is, the lower the root bound and the smaller the tree.', 'p', 'small muted'));
  };
  variants.forEach((v, i) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(i === 0) }, v.label);
    b.addEventListener('click', () => { [...seg.children].forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); draw(v); });
    seg.appendChild(b);
  });
  container.appendChild(seg);
  container.appendChild(host);
  draw(variants[0]);
}

// Gomory cuts on the workshop example with integer data (slides 204).
function gomoryWorkshop(container) {
  const rows = [{ a: [1, 0], b: 3 }, { a: [-10, 10], b: 37 }, { a: [10, 10], b: 63 }];
  const res = gomoryCuttingPlanes({ c: [1, 10], rows: rows.map((r) => ({ a: r.a, op: '<=', b: r.b })), names: ['x', 'y'] }, 8);
  const lps = res.rounds.map((r) => r.lp).concat([res.final]);
  container.appendChild(rich('<b>Three Gomory cuts solve the workshop problem.</b> Each cut is read from the tableau row of a fractional basic variable; the dashed lines are the cuts added so far.', 'p'));
  stepper(container, lps.length, (host, k) => {
    const cuts = res.rounds.slice(0, k).map((r) => ({ a: r.cut.a[0], b: r.cut.a[1], c: r.cut.b }));
    const lp = lps[k];
    host.appendChild(plotFigure({ xmax: 4, ymax: 6, cons: cons(WORKSHOP), extra: cuts, marks: [{ x: lp.x[0], y: lp.x[1], cls: lp.x.every((v) => v.isInt()) ? 'opt' : 'lp', label: `z = ${P(lp.obj)}` }], caption: `LP optimum (${lp.x.map((v) => v.toString()).join(', ')}) with z = ${lp.obj.toString()}${lp.obj.isInt() ? '' : ` ≈ ${lp.obj.toNumber().toFixed(3)}`}.` }));
    if (k < res.rounds.length) {
      const r = res.rounds[k];
      const name = r.lp.tableau.rows[r.rowIndex].name;
      host.appendChild(rich(`Next cut: source row of $${name}$, floored and written in $x,y$: <b>$${[r.cut.a[0], r.cut.a[1]].map((v, j) => (v.isZero() ? '' : `${v.eq(1) ? '' : v.eq(-1) ? '-' : v.toString()}${['x', 'y'][j]}`)).filter(Boolean).join(' + ').replace('+ -', '- ')} \\le ${r.cut.b}$</b>.`, 'p'));
    } else host.appendChild(rich('The LP optimum is integer: $(2,4)$ with $z=42$. No branching was needed.', 'p'));
  });
}

// Kelley's method on (x - 1.3)^2 (slides E201): table of bounds.
function kelleyTable(container) {
  const K = kelley({ q: fr(1), c: Frac.parse('1.3'), d: fr(0) }, 0, 2, [0, 1, 2], 3);
  container.appendChild(rich('<b>Bounds after each master solve</b> for $f(x)=(x-1.3)^2$ on $[0,2]$, starting from tangents at 0, 1, 2:', 'p'));
  container.appendChild(dataTable(['Cuts added', '$\\bar x$', '$L=\\bar t$', '$f(\\bar x)$', '$U$', '$U-L$', 'New tangent'], K.records.map((r) => [r.addedCuts, P(r.x), r.L.pretty(8), r.fx.pretty(8), r.U.pretty(8), r.gap.pretty(8), r.newCut ? `$t\\ge ${r.newCut.slope.pretty(6)}x ${r.newCut.intercept.sign() < 0 ? '-' : '+'} ${r.newCut.intercept.abs().pretty(8)}$` : '—']), 'compact'));
  container.appendChild(rich('$L$ rises, $U$ falls, and the gap shrinks by roughly a factor of four per cut on this function.', 'p', 'small muted'));
}

export const WIDGETS = { bbWorkshop, strength, gomoryWorkshop, kelleyTable };
