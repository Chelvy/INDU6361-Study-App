// Small DOM, random-number and formatting helpers shared by the whole app.
import { Frac } from './math/frac.js';

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

// Element whose innerHTML is trusted app content (lesson text, explanations) containing $math$.
export function rich(html, tag = 'div', cls = '') {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = html;
  return el;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Render $...$ and $$...$$ with KaTeX when it has loaded; plain text stays readable if the CDN is unreachable.
export function renderMath(el) {
  if (!el) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    } catch { /* leave the source text */ }
  } else {
    pendingMath.add(el);
  }
}
const pendingMath = new Set();
export function flushPendingMath() {
  if (!window.renderMathInElement) return;
  for (const el of pendingMath) if (el.isConnected) renderMath(el);
  pendingMath.clear();
}

// ---------------------------------------------------------------- seeded random numbers
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    seed,
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; }
      return a2;
    },
    sample: (arr, k) => rng.shuffle(arr).slice(0, k),
  };
  return rng;
}
export function newSeed() { return (Math.floor(Math.random() * 0x7fffffff) ^ (Date.now() & 0x7fffffff)) >>> 0 || 1; }

// ---------------------------------------------------------------- formatting
export function fmt(v, digits = 4) {
  if (v === null || v === undefined) return '—';
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '-∞';
  if (v instanceof Frac) return v.pretty(digits);
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e4) / 1e4);
  return String(v);
}
export function tex(v) {
  if (v === Infinity) return '\\infty';
  if (v instanceof Frac) return v.toLatex();
  return String(v);
}
export function pct(x, digits = 1) { return `${(x * 100).toFixed(digits)}%`; }

// LaTeX for a variable name such as x1 -> x_{1}.
export function vtex(name) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(name);
  return m ? `${m[1]}_{${m[2]}}` : name;
}

// LaTeX for sum of coef_j * var_j, e.g. linTex([1,-2,0],['x','y','z']) -> "x - 2y".
export function linTex(coefs, names) {
  let out = '';
  coefs.forEach((c, j) => {
    const f = Frac.of(c);
    if (f.isZero()) return;
    const neg = f.sign() < 0;
    const a = f.abs();
    const co = a.eq(1) ? '' : a.toLatex();
    out += out === '' ? `${neg ? '-' : ''}${co}${vtex(names[j])}` : ` ${neg ? '-' : '+'} ${co}${vtex(names[j])}`;
  });
  return out || '0';
}
export function ineqTex(coefs, names, op, rhs) {
  const o = op === '<=' ? '\\le' : op === '>=' ? '\\ge' : '=';
  return `${linTex(coefs, names)} ${o} ${Frac.of(rhs).toLatex()}`;
}
// Plain-text version the parser accepts, e.g. "x - 2y <= 4".
export function ineqText(coefs, names, op, rhs) {
  let out = '';
  coefs.forEach((c, j) => {
    const f = Frac.of(c);
    if (f.isZero()) return;
    const neg = f.sign() < 0;
    const a = f.abs();
    const co = a.eq(1) ? '' : (a.isInt() ? a.toString() : `(${a.toString()})`);
    out += out === '' ? `${neg ? '-' : ''}${co}${names[j]}` : ` ${neg ? '-' : '+'} ${co}${names[j]}`;
  });
  return `${out || '0'} ${op} ${Frac.of(rhs).toString()}`;
}

export function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
}
export function daysBetween(a, b) { return Math.ceil((b - a) / 86400000); }
export function todayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function uid() { return Math.random().toString(36).slice(2, 10); }
export function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
