// SVG figures (graphs, 2-D integer programs, search trees) and HTML tables (tableaux, matrices).
import { h, rich } from './util.js';
import { Frac } from './math/frac.js';

const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs, ...children) {
  const el = document.createElementNS(NS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v); }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// ---------------------------------------------------------------- graph layouts
// Coordinates on a unit grid; scaled when drawn.
export const LAYOUTS = {
  // s on the left, t on the right, a/c on top, b/d at the bottom (slides 105 Dijkstra, exercises 3, 3B)
  six: { s: [0, 1], a: [1, 0], b: [1, 2], c: [2.4, 0], d: [2.4, 2], t: [3.4, 1] },
  // exercise 1: a top, b centre, c bottom, d right of b, t top right
  ex1: { s: [0, 1], a: [1.3, 0], b: [1.3, 1], c: [1.3, 2], d: [2.6, 1], t: [3.4, 0] },
  // lecture max-flow example: b top, a/c middle row, d bottom
  ek: { s: [0, 1], a: [1, 1], b: [1.6, 0], c: [2.2, 1], d: [1.6, 2], t: [3.2, 1] },
  four: { s: [0, 1], a: [1.3, 0], b: [1.3, 2], t: [2.6, 1] },
  kruskal6: { a: [0, 1], b: [1, 0], c: [1, 2], d: [2.4, 0], e: [2.4, 2], f: [3.4, 1] },
  ex2: { a: [0.2, 0], e: [3, 0], c: [1.6, 1], b: [0.2, 2], d: [3, 2] },
  grid8: { a: [0, 0], b: [1, 0], c: [2, 0], d: [3, 0], e: [0, 1.6], f: [1, 1.6], g: [2, 1.6], h: [3, 1.6] },
};

export function circleLayout(ids) {
  const out = {};
  const n = ids.length;
  ids.forEach((id, i) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    out[id] = [1.6 + 1.6 * Math.cos(ang), 1.3 + 1.3 * Math.sin(ang)];
  });
  return out;
}

/**
 * graphFigure({ nodes:[ids], pos:{id:[x,y]}, edges:[{u,v,label,cls}], directed, nodeCls:{id:cls}, badges:{id:text}, caption })
 * Edge classes: 'hl' (highlight), 'sel' (selected/blue), 'dash' (dashed), 'dim'.
 */
export function graphFigure(g) {
  const pos = g.pos;
  const xs = g.nodes.map((v) => pos[v][0]);
  const ys = g.nodes.map((v) => pos[v][1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 520, H = g.height || 270, padX = 46, padY = 44;
  const sx = (x) => padX + ((x - minX) / Math.max(1e-9, maxX - minX)) * (W - 2 * padX);
  const sy = (y) => padY + ((y - minY) / Math.max(1e-9, maxY - minY)) * (H - 2 * padY);
  const R = 17;
  const root = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig graph-fig', role: 'img', 'aria-label': g.caption || 'graph' });
  const defs = s('defs');
  ['arrow', 'arrow-hl', 'arrow-sel', 'arrow-dim'].forEach((id) => {
    defs.appendChild(s('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', class: id }, s('path', { d: 'M 0 0 L 10 5 L 0 10 z' })));
  });
  root.appendChild(defs);
  const has = new Set(g.edges.map((e) => `${e.u}>${e.v}`));
  const gE = s('g', { class: 'edges' });
  const gL = s('g', { class: 'edge-labels' });
  g.edges.forEach((e) => {
    const x1 = sx(pos[e.u][0]), y1 = sy(pos[e.u][1]), x2 = sx(pos[e.v][0]), y2 = sy(pos[e.v][1]);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const twin = g.directed && has.has(`${e.v}>${e.u}`);
    const bend = twin ? 16 : (e.bend || 0);
    const ax = x1 + ux * R, ay = y1 + uy * R, bx = x2 - ux * (R + (g.directed ? 3 : 0)), by = y2 - uy * (R + (g.directed ? 3 : 0));
    const mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
    const cls = `edge ${e.cls || ''}`;
    const marker = g.directed ? `url(#${e.cls && e.cls.includes('hl') ? 'arrow-hl' : e.cls && e.cls.includes('sel') ? 'arrow-sel' : e.cls && e.cls.includes('dim') ? 'arrow-dim' : 'arrow'})` : null;
    const d = bend ? `M ${ax} ${ay} Q ${mx + nx * bend} ${my + ny * bend} ${bx} ${by}` : `M ${ax} ${ay} L ${bx} ${by}`;
    gE.appendChild(s('path', { d, class: cls, 'marker-end': marker, fill: 'none' }));
    if (e.label !== undefined && e.label !== null && e.label !== '') {
      const t = e.t === undefined ? 0.5 : e.t;
      const lx = ax + (bx - ax) * t + nx * (bend ? bend * 1.5 : 0), ly = ay + (by - ay) * t + ny * (bend ? bend * 1.5 : 0);
      const txt = String(e.label);
      const w = 8 + txt.length * 7.2;
      gL.appendChild(s('rect', { x: lx - w / 2, y: ly - 10, width: w, height: 19, rx: 4, class: 'edge-label-bg' }));
      gL.appendChild(s('text', { x: lx, y: ly + 4.5, 'text-anchor': 'middle', class: `edge-label ${e.cls || ''}` }, txt));
    }
  });
  root.appendChild(gE);
  root.appendChild(gL);
  const gN = s('g', { class: 'nodes' });
  g.nodes.forEach((v) => {
    const x = sx(pos[v][0]), y = sy(pos[v][1]);
    gN.appendChild(s('circle', { cx: x, cy: y, r: R, class: `node ${(g.nodeCls && g.nodeCls[v]) || ''}` }));
    gN.appendChild(s('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'node-label' }, (g.nodeNames && g.nodeNames[v]) || v));
    if (g.badges && g.badges[v] !== undefined) {
      const above = pos[v][1] <= (minY + maxY) / 2;
      gN.appendChild(s('text', { x, y: above ? y - R - 7 : y + R + 16, 'text-anchor': 'middle', class: 'node-badge' }, g.badges[v]));
    }
  });
  root.appendChild(gN);
  const fig = h('figure', { class: 'figure' }, root);
  if (g.caption) fig.appendChild(h('figcaption', null, g.caption));
  return fig;
}

// ---------------------------------------------------------------- 2-D integer program plot
function clipPolygon(poly, a, b, c) {
  // keep a x + b y <= c
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const fp = a * p[0] + b * p[1] - c, fq = a * q[0] + b * q[1] - c;
    if (fp <= 1e-9) out.push(p);
    if ((fp < -1e-9 && fq > 1e-9) || (fp > 1e-9 && fq < -1e-9)) {
      const t = fp / (fp - fq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}
const num = (v) => (v instanceof Frac ? v.toNumber() : Number(v));

/**
 * plotFigure({ xmax, ymax, cons:[{a,b,c,cls,label}] (a x + b y <= c), extra:[same, drawn as cut lines],
 *              marks:[{x,y,cls,label}], names:['x','y'], objective:[cx,cy], caption })
 */
export function plotFigure(p) {
  const W = 420, H = 330, L = 40, B = 34, T = 14, Rm = 16;
  const xmax = p.xmax, ymax = p.ymax;
  const X = (x) => L + (x / xmax) * (W - L - Rm);
  const Y = (y) => H - B - (y / ymax) * (H - B - T);
  const root = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig plot-fig', role: 'img', 'aria-label': p.caption || 'feasible region' });
  let poly = [[0, 0], [xmax, 0], [xmax, ymax], [0, ymax]];
  const all = p.cons.concat(p.extra || []);
  all.forEach((k) => { poly = clipPolygon(poly, num(k.a), num(k.b), num(k.c)); });
  if (poly.length >= 3) root.appendChild(s('polygon', { points: poly.map((q) => `${X(q[0])},${Y(q[1])}`).join(' '), class: 'region' }));
  // axes and ticks
  for (let i = 0; i <= Math.floor(xmax); i++) {
    root.appendChild(s('line', { x1: X(i), y1: Y(0), x2: X(i), y2: Y(0) + 4, class: 'tick' }));
    root.appendChild(s('text', { x: X(i), y: Y(0) + 17, 'text-anchor': 'middle', class: 'tick-label' }, i));
  }
  for (let j = 0; j <= Math.floor(ymax); j++) {
    root.appendChild(s('line', { x1: X(0) - 4, y1: Y(j), x2: X(0), y2: Y(j), class: 'tick' }));
    root.appendChild(s('text', { x: X(0) - 8, y: Y(j) + 4, 'text-anchor': 'end', class: 'tick-label' }, j));
  }
  root.appendChild(s('line', { x1: X(0), y1: Y(0), x2: X(xmax), y2: Y(0), class: 'axis' }));
  root.appendChild(s('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(ymax), class: 'axis' }));
  const names = p.names || ['x', 'y'];
  root.appendChild(s('text', { x: X(xmax), y: Y(0) + 30, 'text-anchor': 'end', class: 'axis-name' }, names[0]));
  root.appendChild(s('text', { x: X(0) - 26, y: Y(ymax) + 8, class: 'axis-name' }, names[1]));
  // constraint boundary lines, clipped to the box
  const drawLine = (k, cls) => {
    const a = num(k.a), b = num(k.b), c = num(k.c);
    const pts = [];
    const add = (x, y) => { if (x >= -1e-9 && x <= xmax + 1e-9 && y >= -1e-9 && y <= ymax + 1e-9) pts.push([x, y]); };
    if (Math.abs(b) > 1e-12) { add(0, c / b); add(xmax, (c - a * xmax) / b); }
    if (Math.abs(a) > 1e-12) { add(c / a, 0); add((c - b * ymax) / a, ymax); }
    if (pts.length < 2) return;
    pts.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    const p1 = pts[0], p2 = pts[pts.length - 1];
    root.appendChild(s('line', { x1: X(p1[0]), y1: Y(p1[1]), x2: X(p2[0]), y2: Y(p2[1]), class: cls }));
  };
  p.cons.forEach((k) => drawLine(k, `con-line ${k.cls || ''}`));
  (p.extra || []).forEach((k) => drawLine(k, `cut-line ${k.cls || ''}`));
  // integer lattice
  const feasible = (x, y) => all.every((k) => num(k.a) * x + num(k.b) * y <= num(k.c) + 1e-9);
  for (let i = 0; i <= Math.floor(xmax); i++) for (let j = 0; j <= Math.floor(ymax); j++) {
    root.appendChild(s('circle', { cx: X(i), cy: Y(j), r: feasible(i, j) ? 3.6 : 2, class: feasible(i, j) ? 'lattice in' : 'lattice out' }));
  }
  (p.marks || []).forEach((m) => {
    const x = num(m.x), y = num(m.y);
    root.appendChild(s('circle', { cx: X(x), cy: Y(y), r: 6, class: `mark ${m.cls || ''}` }));
    if (m.label) root.appendChild(s('text', { x: X(x) + 9, y: Y(y) - 8, class: `mark-label ${m.cls || ''}` }, m.label));
  });
  const fig = h('figure', { class: 'figure' }, root);
  if (p.caption) fig.appendChild(h('figcaption', null, p.caption));
  return fig;
}

// ---------------------------------------------------------------- search tree
/**
 * treeFigure(nodes): nodes = [{id, parent, lines:[..], edge:'x <= 1', cls}]. Laid out top-down.
 */
export function treeFigure(nodes, caption) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n, kids: [] }]));
  let rootNode = null;
  byId.forEach((n) => { if (n.parent === null || n.parent === undefined) rootNode = n; else byId.get(n.parent).kids.push(n); });
  let leaf = 0;
  let maxDepth = 0;
  const place = (n, depth) => {
    n.depth = depth; maxDepth = Math.max(maxDepth, depth);
    if (!n.kids.length) { n.x = leaf++; return; }
    n.kids.forEach((k) => place(k, depth + 1));
    n.x = n.kids.reduce((acc, k) => acc + k.x, 0) / n.kids.length;
  };
  place(rootNode, 0);
  const bw = 96, bh = 46, gx = 14, gy = 40;
  const W = Math.max(leaf, 1) * (bw + gx) + gx, H = (maxDepth + 1) * (bh + gy) + 8;
  const X = (n) => gx + n.x * (bw + gx) + bw / 2;
  const Y = (n) => 6 + n.depth * (bh + gy);
  const root = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig tree-fig', role: 'img', 'aria-label': caption || 'search tree', style: `max-width:${Math.max(360, W)}px` });
  byId.forEach((n) => {
    n.kids.forEach((k) => {
      root.appendChild(s('line', { x1: X(n), y1: Y(n) + bh, x2: X(k), y2: Y(k), class: 'tree-edge' }));
      if (k.edge) root.appendChild(s('text', { x: (X(n) + X(k)) / 2 + (X(k) < X(n) ? -6 : 6), y: (Y(n) + bh + Y(k)) / 2 + 4, 'text-anchor': X(k) < X(n) ? 'end' : 'start', class: 'tree-edge-label' }, k.edge));
    });
  });
  byId.forEach((n) => {
    root.appendChild(s('rect', { x: X(n) - bw / 2, y: Y(n), width: bw, height: bh, rx: 7, class: `tree-node ${n.cls || ''}` }));
    (n.lines || []).forEach((line, i) => {
      root.appendChild(s('text', { x: X(n), y: Y(n) + 18 + i * 16, 'text-anchor': 'middle', class: `tree-text ${i === 0 ? 'head' : ''}` }, line));
    });
  });
  const fig = h('figure', { class: 'figure tree-wrap' }, root);
  if (caption) fig.appendChild(h('figcaption', null, caption));
  return fig;
}

// ---------------------------------------------------------------- tables
const cell = (v) => (v instanceof Frac ? v.toString() : v === Infinity ? '∞' : v === null || v === undefined ? '' : String(v));

// Simplex tableau in the slide layout: Basic | variables... | RHS, with the z row last.
export function tableauTable(t, opts = {}) {
  const table = h('table', { class: 'tableau' });
  const head = h('tr', null, h('th', null, 'Basic'));
  t.cols.forEach((c) => head.appendChild(rich(`$${c.kind === 'x' ? c.name.replace(/^([A-Za-z]+)(\d+)$/, '$1_{$2}') : `s_{${c.index + 1}}`}$`, 'th')));
  head.appendChild(h('th', null, 'RHS'));
  table.appendChild(h('thead', null, head));
  const body = h('tbody');
  t.rows.forEach((r, i) => {
    const tr = h('tr', { class: opts.highlightRow === i ? 'hl-row' : '' });
    tr.appendChild(rich(`$${r.name.replace(/^([A-Za-z]+)(\d+)$/, '$1_{$2}')}$`, 'th'));
    r.coef.forEach((v) => tr.appendChild(h('td', null, cell(v))));
    tr.appendChild(h('td', { class: 'rhs' }, cell(r.rhs)));
    body.appendChild(tr);
  });
  const zr = h('tr', { class: 'z-row' }, rich('$z$', 'th'));
  t.zrow.coef.forEach((v) => zr.appendChild(h('td', null, cell(v))));
  zr.appendChild(h('td', { class: 'rhs' }, cell(t.zrow.rhs)));
  body.appendChild(zr);
  table.appendChild(body);
  return h('div', { class: 'grid-scroll' }, table);
}

// Generic matrix / table. opts: rowHeads, colHeads, corner, cls(i,j) -> class name, caption.
export function matrixTable(M, opts = {}) {
  const table = h('table', { class: `matrix ${opts.tableCls || ''}` });
  if (opts.colHeads) {
    const tr = h('tr', null, opts.rowHeads ? rich(opts.corner || '', 'th', 'corner') : null);
    opts.colHeads.forEach((c) => tr.appendChild(rich(String(c), 'th')));
    table.appendChild(h('thead', null, tr));
  }
  const body = h('tbody');
  M.forEach((row, i) => {
    const tr = h('tr');
    if (opts.rowHeads) tr.appendChild(rich(String(opts.rowHeads[i]), 'th'));
    row.forEach((v, j) => tr.appendChild(h('td', { class: opts.cls ? opts.cls(i, j) || '' : '' }, cell(v))));
    body.appendChild(tr);
  });
  table.appendChild(body);
  const wrap = h('div', { class: 'grid-scroll' }, table);
  if (opts.caption) return h('figure', { class: 'figure' }, wrap, h('figcaption', null, opts.caption));
  return wrap;
}
