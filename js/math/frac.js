// Exact rational arithmetic on BigInt, so tableaux and bounds match hand calculations.

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export class Frac {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('Division by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static of(v) {
    if (v instanceof Frac) return v;
    if (typeof v === 'bigint') return new Frac(v);
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new Error('Not a finite number: ' + v);
      if (Number.isInteger(v)) return new Frac(BigInt(v));
      return Frac.parse(String(v));
    }
    if (typeof v === 'string') return Frac.parse(v);
    throw new Error('Cannot convert to Frac: ' + v);
  }

  // Accepts "3", "-3", "13/10", "1.3", "-0.25", ".5", "1e-3".
  static parse(str) {
    let s = String(str).trim().replace(/−/g, '-').replace(/\s+/g, '');
    if (s === '') throw new Error('Empty number');
    const slash = s.indexOf('/');
    if (slash >= 0) {
      const a = Frac.parse(s.slice(0, slash));
      const b = Frac.parse(s.slice(slash + 1));
      return a.div(b);
    }
    const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) throw new Error('Not a number: ' + str);
    const sign = m[1] === '-' ? -1n : 1n;
    const intPart = m[2] || '0';
    const fracPart = m[3] || '';
    let n = BigInt(intPart + fracPart);
    let d = 10n ** BigInt(fracPart.length);
    const e = m[4] ? parseInt(m[4], 10) : 0;
    if (e > 0) n *= 10n ** BigInt(e);
    if (e < 0) d *= 10n ** BigInt(-e);
    return new Frac(sign * n, d);
  }

  static tryParse(str) {
    try { return Frac.parse(str); } catch { return null; }
  }

  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); if (o.n === 0n) throw new Error('Division by zero'); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  abs() { return this.n < 0n ? this.neg() : this; }
  inv() { return new Frac(this.d, this.n); }

  cmp(o) { o = Frac.of(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  lt(o) { return this.cmp(o) < 0; }
  le(o) { return this.cmp(o) <= 0; }
  gt(o) { return this.cmp(o) > 0; }
  ge(o) { return this.cmp(o) >= 0; }
  sign() { return this.n < 0n ? -1 : this.n > 0n ? 1 : 0; }
  isZero() { return this.n === 0n; }
  isInt() { return this.d === 1n; }

  floor() {
    let q = this.n / this.d;
    if (this.n % this.d !== 0n && this.n < 0n) q -= 1n;
    return new Frac(q);
  }
  ceil() { return this.neg().floor().neg(); }
  // Fractional part in [0, 1): x - floor(x).
  fracPart() { return this.sub(this.floor()); }

  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`; }

  // True when the value has a finite decimal expansion.
  isTerminating() {
    let d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }

  toDecimal(maxDigits = 4) {
    if (this.isInt()) return this.n.toString();
    const neg = this.n < 0n;
    const a = neg ? -this.n : this.n;
    const scale = 10n ** BigInt(maxDigits);
    let q = (a * scale * 2n + this.d) / (2n * this.d); // rounded half up
    let s = q.toString().padStart(maxDigits + 1, '0');
    let ip = s.slice(0, s.length - maxDigits);
    let fp = s.slice(s.length - maxDigits).replace(/0+$/, '');
    const out = fp ? `${ip}.${fp}` : ip;
    return neg && Number(out) !== 0 ? '-' + out : out;
  }

  // Fraction for LaTeX; integers plain.
  toLatex() {
    if (this.d === 1n) return this.n.toString();
    const neg = this.n < 0n;
    return `${neg ? '-' : ''}\\tfrac{${neg ? -this.n : this.n}}{${this.d}}`;
  }

  // Short human form: exact decimal when it terminates within `digits`, else a/b.
  pretty(digits = 4) {
    if (this.isInt()) return this.n.toString();
    if (this.isTerminating()) {
      const dec = this.toDecimal(12);
      const fp = dec.split('.')[1] || '';
      if (fp.length <= digits) return dec;
    }
    return this.toString();
  }
}

export const F = (v) => Frac.of(v);
export const ZERO = new Frac(0n);
export const ONE = new Frac(1n);

export function fracSum(arr) { return arr.reduce((a, b) => a.add(b), ZERO); }
export function fracMax(arr) { return arr.reduce((a, b) => (b.gt(a) ? b : a)); }
export function fracMin(arr) { return arr.reduce((a, b) => (b.lt(a) ? b : a)); }

export function bigGcd(a, b) { return gcd(a, b); }
export function bigLcm(a, b) { return a === 0n || b === 0n ? 0n : (a / gcd(a, b)) * b; }
