// Parser for linear expressions and inequalities typed by the student,
// e.g. "x1 + x2 + 2x4 <= 2", "t >= 8x - 16z", "y1 + y2 <= 2 + 4(x1 + x2)".
import { Frac, ZERO, ONE } from './frac.js';

class Lin {
  constructor(c = ZERO, t = new Map()) { this.c = c; this.t = t; }
  static constant(v) { return new Lin(Frac.of(v)); }
  static variable(name) { return new Lin(ZERO, new Map([[name, ONE]])); }
  isConst() { return this.t.size === 0; }
  add(o, sign = 1) {
    const t = new Map(this.t);
    for (const [k, v] of o.t) {
      const nv = (t.get(k) || ZERO).add(sign === 1 ? v : v.neg());
      if (nv.isZero()) t.delete(k); else t.set(k, nv);
    }
    return new Lin(sign === 1 ? this.c.add(o.c) : this.c.sub(o.c), t);
  }
  scale(f) {
    const t = new Map();
    if (!f.isZero()) for (const [k, v] of this.t) t.set(k, v.mul(f));
    return new Lin(this.c.mul(f), t);
  }
}

function normalizeVarName(raw) {
  return raw.replace(/[_{}\s]/g, '');
}

function tokenize(src) {
  const s = src
    .replace(/−|–|—/g, '-')
    .replace(/≤|=<|⩽/g, '<=')
    .replace(/≥|=>|⩾/g, '>=')
    .replace(/·|×|⋅/g, '*')
    .replace(/\\leq?|\\le\b/g, '<=')
    .replace(/\\geq?|\\ge\b/g, '>=')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/[$\\]/g, '');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ type: 'num', value: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-zα-ω]/.test(ch)) {
      // A variable is one letter plus an optional subscript: x1, s_3, x_{12}, f_a.
      let j = i + 1;
      while (j < s.length && /[0-9_{}]/.test(s[j])) j++;
      let name = s.slice(i, j);
      if (/[_{]$/.test(name)) {
        while (j < s.length && /[A-Za-z0-9_{}]/.test(s[j])) j++;
        name = s.slice(i, j);
      }
      tokens.push({ type: 'var', value: normalizeVarName(name) });
      i = j;
      continue;
    }
    if (ch === '<' || ch === '>') {
      const two = s.slice(i, i + 2);
      if (two === '<=' || two === '>=') { tokens.push({ type: 'cmp', value: two }); i += 2; }
      else { tokens.push({ type: 'cmp', value: ch + '=' }); i += 1; }
      continue;
    }
    if (ch === '=') {
      if (s[i + 1] === '=') i++;
      tokens.push({ type: 'cmp', value: '=' });
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) { tokens.push({ type: ch }); i++; continue; }
    if (ch === ',') { tokens.push({ type: ',' }); i++; continue; }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
}

class Parser {
  constructor(tokens) { this.tk = tokens; this.p = 0; }
  peek() { return this.tk[this.p]; }
  next() { return this.tk[this.p++]; }
  atEnd() { return this.p >= this.tk.length; }

  expr() {
    let left = this.term();
    while (!this.atEnd() && (this.peek().type === '+' || this.peek().type === '-')) {
      const op = this.next().type;
      const right = this.term();
      left = left.add(right, op === '+' ? 1 : -1);
    }
    return left;
  }

  term() {
    let left = this.factor();
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.type === '*') {
        this.next();
        left = this.mul(left, this.factor());
      } else if (t.type === '/') {
        this.next();
        const r = this.factor();
        if (!r.isConst()) throw new Error('Cannot divide by a variable expression');
        if (r.c.isZero()) throw new Error('Division by zero');
        left = left.scale(ONE.div(r.c));
      } else if (t.type === 'num' || t.type === 'var' || t.type === '(') {
        left = this.mul(left, this.factor(true)); // implicit multiplication
      } else break;
    }
    return left;
  }

  mul(a, b) {
    if (a.isConst()) return b.scale(a.c);
    if (b.isConst()) return a.scale(b.c);
    throw new Error('Expression is not linear (product of variables)');
  }

  factor(noSign = false) {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (!noSign && (t.type === '+' || t.type === '-')) {
      this.next();
      const f = this.factor();
      return t.type === '-' ? f.scale(ONE.neg()) : f;
    }
    if (t.type === 'num') { this.next(); return Lin.constant(Frac.parse(t.value)); }
    if (t.type === 'var') { this.next(); return Lin.variable(t.value); }
    if (t.type === '(') {
      this.next();
      const e = this.expr();
      const c = this.next();
      if (!c || c.type !== ')') throw new Error('Missing closing parenthesis');
      return e;
    }
    throw new Error('Unexpected token');
  }
}

export function parseLinear(str) {
  const p = new Parser(tokenize(String(str)));
  const e = p.expr();
  if (!p.atEnd()) throw new Error('Unexpected trailing input');
  return { terms: e.t, c: e.c };
}

// Returns {terms, op, rhs} meaning  sum(terms) op rhs  with all variables on the left.
export function parseInequality(str) {
  const tokens = tokenize(String(str));
  const idx = tokens.findIndex((t) => t.type === 'cmp');
  if (idx < 0) throw new Error('Missing <=, >= or =');
  if (tokens.slice(idx + 1).some((t) => t.type === 'cmp')) throw new Error('Only one comparison is allowed');
  const lp = new Parser(tokens.slice(0, idx));
  const rp = new Parser(tokens.slice(idx + 1));
  const l = lp.expr();
  if (!lp.atEnd()) throw new Error('Could not read the left-hand side');
  const r = rp.expr();
  if (!rp.atEnd()) throw new Error('Could not read the right-hand side');
  const diff = l.add(r, -1); // diff op 0
  return { terms: diff.t, op: tokens[idx].value, rhs: diff.c.neg() };
}

// Canonical "sum a_i v_i <= b" (or "= b") scaled so the first coefficient (by variable name) has absolute value 1.
export function canonicalInequality(ineq) {
  let { terms, op, rhs } = ineq;
  let entries = [...terms.entries()].filter(([, v]) => !v.isZero()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  let sign = ONE;
  if (op === '>=') { sign = ONE.neg(); op = '<='; }
  entries = entries.map(([k, v]) => [k, v.mul(sign)]);
  rhs = rhs.mul(sign);
  if (entries.length === 0) return { entries, op, rhs, trivial: true };
  let scale = entries[0][1].abs();
  if (op === '=' && entries[0][1].sign() < 0) scale = scale.neg();
  entries = entries.map(([k, v]) => [k, v.div(scale)]);
  rhs = rhs.div(scale);
  return { entries, op, rhs, trivial: false };
}

export function inequalityKey(ineq) {
  const c = canonicalInequality(ineq);
  return c.entries.map(([k, v]) => `${v}*${k}`).join('+') + c.op + c.rhs;
}

export function sameInequality(a, b) {
  const A = typeof a === 'string' ? parseInequality(a) : a;
  const B = typeof b === 'string' ? parseInequality(b) : b;
  return inequalityKey(A) === inequalityKey(B);
}

export function sameLinear(a, b) {
  const A = typeof a === 'string' ? parseLinear(a) : a;
  const B = typeof b === 'string' ? parseLinear(b) : b;
  if (!A.c.eq(B.c)) return false;
  const keys = new Set([...A.terms.keys(), ...B.terms.keys()]);
  for (const k of keys) if (!(A.terms.get(k) || ZERO).eq(B.terms.get(k) || ZERO)) return false;
  return true;
}

export function evalLinear(lin, point) {
  let v = lin.c || ZERO;
  for (const [k, coef] of lin.terms) {
    if (!(k in point)) throw new Error('No value for variable ' + k);
    v = v.add(coef.mul(Frac.of(point[k])));
  }
  return v;
}

// Does `point` satisfy the inequality? point: {var: number|Frac|string}.
export function satisfies(ineq, point) {
  const I = typeof ineq === 'string' ? parseInequality(ineq) : ineq;
  const lhs = evalLinear({ terms: I.terms, c: ZERO }, point);
  const c = lhs.cmp(I.rhs);
  return I.op === '<=' ? c <= 0 : I.op === '>=' ? c >= 0 : c === 0;
}

function varLatex(name) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(name);
  if (m) return `${m[1]}_{${m[2]}}`;
  return name;
}

// Render sum of terms as LaTeX in the given variable order.
export function linearToLatex(terms, order) {
  const keys = order ? order.filter((k) => terms.has(k) && !terms.get(k).isZero()) : [...terms.keys()].filter((k) => !terms.get(k).isZero());
  if (keys.length === 0) return '0';
  let out = '';
  keys.forEach((k, i) => {
    const v = terms.get(k);
    const neg = v.sign() < 0;
    const a = v.abs();
    const coef = a.eq(ONE) ? '' : a.toLatex();
    if (i === 0) out += (neg ? '-' : '') + coef + varLatex(k);
    else out += (neg ? ' - ' : ' + ') + coef + varLatex(k);
  });
  return out;
}

export function inequalityToLatex(ineq, order) {
  const I = typeof ineq === 'string' ? parseInequality(ineq) : ineq;
  const op = I.op === '<=' ? '\\le' : I.op === '>=' ? '\\ge' : '=';
  return `${linearToLatex(I.terms, order)} ${op} ${I.rhs.toLatex()}`;
}

// Build an inequality object from plain data: coef {var: value}, op, rhs.
export function makeInequality(coef, op, rhs) {
  const terms = new Map();
  for (const [k, v] of Object.entries(coef)) {
    const f = Frac.of(v);
    if (!f.isZero()) terms.set(k, f);
  }
  return { terms, op, rhs: Frac.of(rhs) };
}

// Scale an inequality to coprime integer coefficients (keeps direction), for tidy display.
export function integerForm(ineq) {
  const I = typeof ineq === 'string' ? parseInequality(ineq) : ineq;
  let l = 1n;
  const all = [...I.terms.values(), I.rhs];
  const g0 = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  for (const v of all) l = (l / g0(l, v.d)) * v.d;
  let g = 0n;
  for (const v of all) g = g0(g, v.n * (l / v.d));
  if (g === 0n) g = 1n;
  const f = new Frac(l, g);
  const terms = new Map();
  for (const [k, v] of I.terms) terms.set(k, v.mul(f));
  return { terms, op: I.op, rhs: I.rhs.mul(f) };
}
