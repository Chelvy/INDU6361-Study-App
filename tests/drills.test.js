// Builds every trainer on its presets and on many random instances, runs every lazily rendered
// statement / explanation against a stub DOM, and checks that each answer key is accepted by its own grader.
import test from 'node:test';
import assert from 'node:assert/strict';

class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}; this._html = ''; this.className = ''; this.hidden = false; }
  get classList() { return { add() {}, remove() {}, contains() { return false; }, toggle() {} }; }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener() {}
  get firstChild() { return this.children[0] || null; }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text || ''; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}
globalThis.Node = El;
globalThis.document = {
  createElement: (t) => new El(t),
  createElementNS: (_ns, t) => new El(t),
  createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; },
};
globalThis.window = {};

const { DRILLS } = await import('../js/drills/index.js');
const { gradeField } = await import('../js/grade.js');
const { makeRng } = await import('../js/util.js');
const { Frac } = await import('../js/math/frac.js');

const TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'ul', 'ol', 'li', 'code', 'sub', 'sup', 'p', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'pre', 'u', 'small', 'kbd']);
function checkHtml(s, where) {
  if (/undefined|NaN|\[object /.test(s)) assert.fail(`${where}: suspicious text "${s.slice(0, 160)}"`);
  const t = s.replace(/\\\$/g, '');
  const dd = (t.match(/\$\$/g) || []).length;
  const d = (t.replace(/\$\$/g, '').match(/\$/g) || []).length;
  assert.ok(dd % 2 === 0 && d % 2 === 0, `${where}: unbalanced $ in "${s.slice(0, 160)}"`);
  for (const m of t.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]*?)\$/g)) {
    const body = m[1] !== undefined ? m[1] : m[2];
    assert.ok(!/(^|[^\\])%/.test(body), `${where}: unescaped % inside math "${body.slice(0, 80)}"`);
  }
  for (const m of s.matchAll(/<\/?([A-Za-z!?][A-Za-z0-9]*)/g)) assert.ok(TAGS.has(m[1].toLowerCase()), `${where}: "<${m[1]}" would be parsed as a tag in "${s.slice(0, 160)}"`);
}
function walk(node, where) {
  if (!node) return;
  if (typeof node === 'string') { checkHtml(node, where); return; }
  if (node._html) checkHtml(node._html, where);
  if (node._text) checkHtml(node._text.replace(/</g, '&lt;'), where);
  (node.children || []).forEach((c) => walk(c, where));
}
const run = (x, where) => { const v = typeof x === 'function' ? x() : x; walk(v, where); return v; };

const numText = (a) => (a === Infinity ? 'inf' : a === -Infinity ? '-inf' : a instanceof Frac ? a.toString() : String(a));
function canonical(def) {
  switch (def.type) {
    case 'num': case 'int': return numText(def.answer);
    case 'choice': return String(def.answer);
    case 'multi': return def.answer.map(String);
    case 'set': return def.answer.length ? def.answer.join(', ') : 'none';
    case 'seq': return def.answer.join(' ');
    case 'ineq': case 'expr': return def.answerText;
    case 'grid': return def.answer.map((r) => r.map((v) => (v === null || v === undefined ? '' : numText(v))));
    case 'table': return def.rows.map((row) => Object.fromEntries(def.columns.filter((c) => c.kind !== 'given' && row.cells[c.key] !== null && row.cells[c.key] !== undefined).map((c) => {
      const a = row.cells[c.key];
      return [c.key, a === '—' ? '-' : c.kind === 'num' ? numText(a) : Array.isArray(a) ? a.join(' ') : String(a)];
    })));
    case 'order': return def.answer.map(String);
    case 'self': return def.rubric.map(() => true);
    default: throw new Error('unknown field type ' + def.type);
  }
}

function checkBuilt(drill, built, tag) {
  assert.ok(built && built.steps && built.steps.length > 0, `${tag}: no steps`);
  assert.equal(built.id, drill.id, `${tag}: built.id`);
  assert.ok(built.topic, `${tag}: topic`);
  assert.ok(typeof built.title === 'string' && built.title, `${tag}: title`);
  run(built.statement, `${tag} statement`);
  run(built.figure, `${tag} figure`);
  if (built.rules) checkHtml(built.rules, `${tag} rules`);
  if (built.wrapup) checkHtml(built.wrapup, `${tag} wrapup`);
  built.steps.forEach((st, i) => {
    const w = `${tag} step ${i + 1} (${st.title})`;
    assert.ok(st.title, `${w}: title`);
    run(st.text, `${w} text`); run(st.figure, `${w} figure`); run(st.explain, `${w} explain`); run(st.after, `${w} after`);
    (st.fields || []).forEach((def, k) => {
      const fw = `${w} field ${k + 1} (${def.label || def.type})`;
      if (def.label) checkHtml(def.label, fw);
      if (def.options) def.options.forEach((o) => checkHtml(String(o.label), fw));
      if (def.type === 'ineq' || def.type === 'expr') assert.ok(typeof def.answerText === 'string', `${fw}: needs answerText`);
      const res = gradeField(def, canonical(def));
      assert.ok(res.ok, `${fw}: the answer key is rejected by its own grader (${JSON.stringify(canonical(def)).slice(0, 200)}) -> ${res.msg}`);
      if (def.type !== 'self' && def.type !== 'order') {
        const blank = gradeField(def, def.type === 'multi' ? [] : def.type === 'grid' ? def.answer.map((r) => r.map(() => '')) : def.type === 'table' ? def.rows.map(() => ({})) : '');
        const emptyIsRight = (def.type === 'set' && def.answer.length === 0) || (def.type === 'multi' && def.answer.length === 0);
        if (!emptyIsRight) assert.ok(!blank.ok, `${fw}: a blank answer must not be accepted`);
      }
    });
  });
}

for (const drill of DRILLS) {
  test(`trainer ${drill.id}: presets build and answer keys grade as correct`, () => {
    assert.ok(drill.title && drill.topic && drill.blurb, 'metadata');
    (drill.presets || []).forEach((p) => checkBuilt(drill, drill.build(p.make()), `${drill.id}/${p.id}`));
  });
  test(`trainer ${drill.id}: random instances at every level`, () => {
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= 40; seed++) {
        const inst = drill.random(makeRng(seed * 7919 + level), level);
        assert.ok(inst, `${drill.id} level ${level} seed ${seed}: no instance`);
        checkBuilt(drill, drill.build(inst), `${drill.id}/L${level}/seed${seed}`);
      }
    }
  });
  if (drill.custom) {
    test(`trainer ${drill.id}: the default custom instance parses and builds`, () => {
      const values = Object.fromEntries(drill.custom.fields.map((f) => [f.key, f.value]));
      checkBuilt(drill, drill.build(drill.custom.parse(values)), `${drill.id}/custom`);
    });
  }
}

test('random instances are reproducible from the seed', () => {
  for (const drill of DRILLS) {
    const a = JSON.stringify(drill.random(makeRng(12345), 2));
    const b = JSON.stringify(drill.random(makeRng(12345), 2));
    assert.equal(a, b, drill.id);
  }
});
