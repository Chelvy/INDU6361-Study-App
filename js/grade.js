// Pure grading logic for every answer-field type (no DOM), so it can be unit-tested.
import { Frac } from './math/frac.js';
import { parseInequality, parseLinear, sameInequality, sameLinear, inequalityToLatex } from './math/parse.js';

const INF_WORDS = new Set(['inf', '+inf', 'infinity', '∞', '+∞', 'oo', 'infini', 'infty']);

// Answer key marker for a numeric table cell that has no value (e.g. the LP bound of an infeasible node).
export const NA = '—';
const NA_WORDS = new Set(['', '-', '—', '–', 'na', 'n/a', 'none', 'x', 'inf', '-inf', 'infeasible', 'inf.', '∞', '-∞']);
function gradeNA(raw) {
  const s = String(raw === null || raw === undefined ? '' : raw).trim().toLowerCase();
  const ok = NA_WORDS.has(s);
  return { score: ok ? 1 : 0, ok, blank: false, msg: null };
}

export function parseNumber(raw) {
  if (raw === null || raw === undefined) return { blank: true };
  let s = String(raw).trim();
  if (s === '') return { blank: true };
  s = s.replace(/\s+/g, '').replace(/−/g, '-').replace(/%$/, '');
  const low = s.toLowerCase();
  if (INF_WORDS.has(low)) return { inf: 1 };
  if (low === '-inf' || low === '-infinity' || low === '-∞') return { inf: -1 };
  if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.'); // decimal comma
  const f = Frac.tryParse(s);
  if (!f) return { error: `"${raw}" is not a number` };
  return { value: f };
}

function toFracAnswer(a) {
  if (a === Infinity || a === -Infinity) return a;
  return Frac.of(a);
}

function gradeNumber(def, raw) {
  const p = parseNumber(raw);
  if (p.blank) return { score: 0, ok: false, blank: true, msg: null };
  if (p.error) return { score: 0, ok: false, msg: p.error };
  const ans = toFracAnswer(def.answer);
  if (ans === Infinity || ans === -Infinity) {
    const ok = p.inf === (ans === Infinity ? 1 : -1);
    return { score: ok ? 1 : 0, ok, msg: null };
  }
  if (p.inf) return { score: 0, ok: false, msg: null };
  if (def.type === 'int' && !p.value.isInt()) return { score: 0, ok: false, msg: 'An integer is expected here.' };
  let ok = p.value.eq(ans);
  if (!ok) {
    const tol = def.tol !== undefined ? def.tol : (ans.isInt() ? 0 : 0.0051);
    if (tol > 0) ok = Math.abs(p.value.toNumber() - ans.toNumber()) <= tol + 1e-12;
  }
  let msg = null;
  if (!ok && def.mis) {
    for (const m of def.mis) {
      const mv = toFracAnswer(m.value);
      if (mv instanceof Frac && (p.value.eq(mv) || Math.abs(p.value.toNumber() - mv.toNumber()) < 1e-9)) { msg = m.msg; break; }
    }
  }
  return { score: ok ? 1 : 0, ok, msg };
}

export function tokenize(raw, def = {}) {
  let s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!def.caseSensitive) s = s.toLowerCase();
  s = s.replace(/[{}()\[\]]/g, ' ').replace(/→|->|=>|–|—|>/g, ' ').replace(/[;,|]/g, ' ');
  if (!def.keepDash) s = s.replace(/-/g, ' ');
  let toks = s.split(/\s+/).filter(Boolean);
  if (def.chars && toks.length === 1 && toks[0].length > 1 && /^[a-z0-9]+$/i.test(toks[0])) toks = toks[0].split('');
  if (def.normalize) toks = toks.map(def.normalize);
  return toks;
}

const EMPTY_WORDS = new Set(['', '{}', '∅', 'none', 'empty', 'aucun', '-']);

function gradeSet(def, raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  const want = (def.answer || []).map((t) => (def.caseSensitive ? String(t) : String(t).toLowerCase()));
  if (text === '' && want.length > 0) return { score: 0, ok: false, blank: true, msg: null };
  const got = EMPTY_WORDS.has(text.toLowerCase()) ? [] : tokenize(text, def);
  const g = new Set(got), w = new Set(want);
  const missing = [...w].filter((t) => !g.has(t));
  const extra = [...g].filter((t) => !w.has(t));
  const ok = missing.length === 0 && extra.length === 0;
  let msg = null;
  if (!ok) {
    const bits = [];
    if (extra.length) bits.push(`${extra.length} element${extra.length > 1 ? 's' : ''} should not be there`);
    if (missing.length) bits.push(`${missing.length} element${missing.length > 1 ? 's are' : ' is'} missing`);
    msg = bits.join('; ') + '.';
  }
  return { score: ok ? 1 : 0, ok, msg };
}

function sameSeq(a, b) { return a.length === b.length && a.every((t, i) => t === b[i]); }

function gradeSeq(def, raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (text === '') return { score: 0, ok: false, blank: true, msg: null };
  const got = tokenize(text, def);
  const norm = (arr) => arr.map((t) => (def.caseSensitive ? String(t) : String(t).toLowerCase()));
  const candidates = [def.answer].concat(def.alts || []).map(norm);
  const ok = candidates.some((c) => sameSeq(c, got));
  let msg = null;
  if (!ok && def.check) {
    const r = def.check(got);
    if (r) return { score: r.score || 0, ok: !!r.ok, msg: r.msg || null };
  }
  if (!ok) {
    const want = candidates[0];
    if (got.length !== want.length) msg = `Expected ${want.length} entries, got ${got.length}.`;
    else { const i = got.findIndex((t, k) => t !== want[k]); msg = `First difference at position ${i + 1}.`; }
  }
  return { score: ok ? 1 : 0, ok, msg };
}

function gradeInequality(def, raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (text === '') return { score: 0, ok: false, blank: true, msg: null };
  let parsed;
  try { parsed = parseInequality(text); } catch (e) { return { score: 0, ok: false, msg: `Could not read that inequality: ${e.message}.` }; }
  const targets = [def.answer].concat(def.alts || []);
  if (targets.some((t) => sameInequality(parsed, t))) return { score: 1, ok: true, msg: null };
  if (def.validator) {
    const r = def.validator(parsed);
    if (r) return { score: r.ok ? 1 : (r.score || 0), ok: !!r.ok, msg: r.msg || null };
  }
  // Diagnose the two most common slips: wrong direction, or right left-hand side with a different constant.
  let msg = null;
  try {
    const t = typeof def.answer === 'string' ? parseInequality(def.answer) : def.answer;
    const flipped = { terms: parsed.terms, op: parsed.op === '<=' ? '>=' : parsed.op === '>=' ? '<=' : '=', rhs: parsed.rhs };
    if (sameInequality(flipped, t)) msg = 'The coefficients are right but the inequality points the wrong way.';
    else if (sameLinear({ terms: parsed.terms, c: Frac.of(0) }, { terms: t.terms, c: Frac.of(0) }) && parsed.op === t.op) msg = 'Left-hand side is right; check the right-hand side.';
  } catch { /* no diagnosis */ }
  return { score: 0, ok: false, msg };
}

function gradeExpr(def, raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (text === '') return { score: 0, ok: false, blank: true, msg: null };
  let parsed;
  try { parsed = parseLinear(text); } catch (e) { return { score: 0, ok: false, msg: `Could not read that expression: ${e.message}.` }; }
  const ok = [def.answer].concat(def.alts || []).some((t) => sameLinear(parsed, t));
  return { score: ok ? 1 : 0, ok, msg: null };
}

function gradeGrid(def, values) {
  let total = 0, good = 0, blanks = 0;
  const cells = def.answer.map((rowAns, i) => rowAns.map((ans, j) => {
    if (ans === null || ans === undefined) return null; // prefilled / not graded
    total += 1;
    const raw = values && values[i] ? values[i][j] : '';
    const r = gradeNumber({ type: 'num', answer: ans, tol: def.tol }, raw);
    if (r.blank) blanks += 1;
    if (r.ok) good += 1;
    return r.ok;
  }));
  const score = total ? good / total : 1;
  return {
    score, ok: good === total, blank: total > 0 && blanks === total, cells,
    msg: good === total ? null : `${good} of ${total} cells correct.`,
  };
}

// Trace table with typed columns: kind 'num' | 'tokens' | 'choice' | 'given'.
function gradeTable(def, values) {
  let total = 0, good = 0, blanks = 0;
  const cells = def.rows.map((row, i) => {
    const out = {};
    def.columns.forEach((col) => {
      if (col.kind === 'given') return;
      const ans = row.cells[col.key];
      if (ans === null || ans === undefined) return; // not asked in this row
      total += 1;
      const raw = values && values[i] ? values[i][col.key] : '';
      let r;
      if (ans === NA) r = gradeNA(raw);
      else if (col.kind === 'num') r = gradeNumber({ type: 'num', answer: ans, tol: col.tol }, raw);
      else if (col.kind === 'choice') r = gradeChoice({ answer: ans }, raw);
      else if (col.ordered === false) r = gradeSet({ answer: Array.isArray(ans) ? ans : tokenize(ans, col), chars: col.chars }, raw);
      else r = gradeSeq({ answer: Array.isArray(ans) ? ans : tokenize(ans, col), chars: col.chars, alts: row.alts && row.alts[col.key] }, raw === undefined ? '' : raw);
      if (r.blank) blanks += 1;
      if (r.ok) good += 1;
      out[col.key] = !!r.ok;
    });
    return out;
  });
  return {
    score: total ? good / total : 1, ok: good === total, blank: total > 0 && blanks === total, cells,
    msg: good === total ? null : `${good} of ${total} entries correct.`,
  };
}

function gradeChoice(def, value) {
  if (value === null || value === undefined || value === '') return { score: 0, ok: false, blank: true, msg: null };
  const ok = String(value) === String(def.answer);
  const msg = !ok && def.mis && def.mis[value] ? def.mis[value] : null;
  return { score: ok ? 1 : 0, ok, msg };
}

function gradeMulti(def, value) {
  const got = new Set((value || []).map(String));
  const want = new Set((def.answer || []).map(String));
  const missing = [...want].filter((t) => !got.has(t)).length;
  const extra = [...got].filter((t) => !want.has(t)).length;
  const ok = missing === 0 && extra === 0;
  return { score: ok ? 1 : 0, ok, blank: got.size === 0 && want.size > 0, msg: ok ? null : `${extra} wrong selection${extra === 1 ? '' : 's'}, ${missing} missing.` };
}

function gradeOrder(def, value) {
  const got = (value || []).map(String);
  const want = def.answer.map(String);
  const ok = sameSeq(got, want);
  let msg = null;
  if (!ok) { const i = got.findIndex((t, k) => t !== want[k]); msg = `The order first goes wrong at step ${i + 1}.`; }
  return { score: ok ? 1 : 0, ok, msg };
}

function gradeSelf(def, value) {
  const n = def.rubric.length;
  const ticked = (value || []).filter(Boolean).length;
  const score = n ? ticked / n : 1;
  return { score, ok: score > 0.999, self: true, msg: null };
}

export function gradeField(def, value) {
  switch (def.type) {
    case 'num': case 'int': return gradeNumber(def, value);
    case 'choice': return gradeChoice(def, value);
    case 'multi': return gradeMulti(def, value);
    case 'set': return gradeSet(def, value);
    case 'seq': return gradeSeq(def, value);
    case 'ineq': return gradeInequality(def, value);
    case 'expr': return gradeExpr(def, value);
    case 'grid': return gradeGrid(def, value);
    case 'table': return gradeTable(def, value);
    case 'order': return gradeOrder(def, value);
    case 'self': return gradeSelf(def, value);
    default: throw new Error('Unknown field type ' + def.type);
  }
}

function numText(a) {
  if (a === Infinity) return '∞';
  if (a === -Infinity) return '-∞';
  const f = Frac.of(a);
  if (f.isInt()) return f.toString();
  const dec = f.isTerminating() ? f.toDecimal(8) : `≈ ${f.toDecimal(4)}`;
  return f.isTerminating() ? dec : `${f.toString()} (${dec})`;
}

// Human-readable correct answer (HTML; may contain $math$).
export function expectedHtml(def) {
  if (def.expected) return def.expected;
  switch (def.type) {
    case 'num': case 'int': return numText(def.answer) + (def.unit ? ` ${def.unit}` : '');
    case 'choice': { const o = (def.options || []).find((x) => String(x.value) === String(def.answer)); return o ? o.label : String(def.answer); }
    case 'multi': return (def.options || []).filter((o) => def.answer.map(String).includes(String(o.value))).map((o) => o.label).join('; ') || '(none)';
    case 'set': return def.answer.length ? `{${def.answer.join(', ')}}` : '∅ (empty)';
    case 'seq': return def.answer.join(def.joiner || ' → ');
    case 'ineq': return `$${inequalityToLatex(def.answer, def.order)}$`;
    case 'expr': return String(def.answerText || def.answer);
    case 'grid': return null; // the grid itself is filled in with the solution
    case 'table': return null;
    case 'order': return null;
    case 'self': return null;
    default: return '';
  }
}
