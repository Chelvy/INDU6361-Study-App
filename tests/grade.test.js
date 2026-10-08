import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeField, expectedHtml, parseNumber, tokenize } from '../js/grade.js';
import { F } from '../js/math/frac.js';

const ok = (def, v) => gradeField(def, v).ok;

test('numbers: exact, fractions, decimals, tolerance, infinity, misconceptions', () => {
  assert.ok(ok({ type: 'num', answer: 42 }, '42'));
  assert.ok(ok({ type: 'num', answer: 42 }, ' 42.0 '));
  assert.ok(!ok({ type: 'num', answer: 42 }, '42.004'));
  assert.ok(ok({ type: 'num', answer: F('972/19') }, '972/19'));
  assert.ok(ok({ type: 'num', answer: F('972/19') }, '51.158'));
  assert.ok(ok({ type: 'num', answer: F('972/19') }, '51.16'));
  assert.ok(!ok({ type: 'num', answer: F('972/19') }, '51.2'));
  assert.ok(ok({ type: 'num', answer: '51.3' }, '51,3'));
  assert.ok(ok({ type: 'num', answer: F('25.1'), tol: 0.06 }, '25.12%'));
  assert.ok(ok({ type: 'num', answer: Infinity }, 'inf'));
  assert.ok(ok({ type: 'num', answer: Infinity }, '∞'));
  assert.ok(!ok({ type: 'num', answer: Infinity }, '100'));
  assert.ok(!ok({ type: 'num', answer: 7 }, 'inf'));
  assert.ok(gradeField({ type: 'num', answer: 7 }, '').blank);
  assert.match(gradeField({ type: 'num', answer: 7 }, 'abc').msg, /not a number/);
  assert.ok(!ok({ type: 'int', answer: 3 }, '2.5'));
  const mis = gradeField({ type: 'num', answer: -1, mis: [{ value: 0, msg: 'floor rounds toward minus infinity' }] }, '0');
  assert.equal(mis.msg, 'floor rounds toward minus infinity');
  assert.equal(parseNumber('-inf').inf, -1);
});

test('choice, multi, set, sequence', () => {
  assert.ok(ok({ type: 'choice', answer: 'b', options: [] }, 'b'));
  assert.equal(gradeField({ type: 'choice', answer: 'b', mis: { a: 'that is the primal bound' } }, 'a').msg, 'that is the primal bound');
  assert.ok(ok({ type: 'multi', answer: ['a', 'c'] }, ['c', 'a']));
  assert.ok(!ok({ type: 'multi', answer: ['a', 'c'] }, ['a']));
  assert.ok(ok({ type: 'set', answer: ['s', 'a'] }, '{a, s}'));
  assert.ok(ok({ type: 'set', answer: ['s', 'a'], chars: true }, 'sa'));
  assert.ok(ok({ type: 'set', answer: [] }, '{}'));
  assert.ok(ok({ type: 'set', answer: [] }, 'none'));
  assert.ok(!ok({ type: 'set', answer: ['s'] }, 's a'));
  assert.ok(ok({ type: 'set', answer: ['ab', 'bc'] }, 'bc, ab'));
  assert.ok(ok({ type: 'seq', answer: ['s', 'b', 'c', 'a', 'd', 't'], chars: true }, 's-b-c-a-d-t'));
  assert.ok(ok({ type: 'seq', answer: ['s', 'b', 'c', 'a', 'd', 't'], chars: true }, 's → b → c → a → d → t'));
  assert.ok(ok({ type: 'seq', answer: ['s', 'b', 'c', 'a', 'd', 't'], chars: true }, 'sbcadt'));
  assert.ok(!ok({ type: 'seq', answer: ['s', 'a', 't'], chars: true }, 's-t-a'));
  assert.ok(ok({ type: 'seq', answer: ['w3', 'j1', 'w1', 'j2'] }, 'W3 - J1 - W1 - J2'));
  assert.ok(ok({ type: 'seq', answer: ['ab', 'ac'], alts: [['ac', 'ab']] }, 'ac ab'));
  assert.deepEqual(tokenize('a -> b, c'), ['a', 'b', 'c']);
});

test('inequalities and expressions', () => {
  const def = { type: 'ineq', answer: 'x1 + x2 + x3 + 2x4 <= 2' };
  assert.ok(ok(def, 'x1+x2+x3+2x4<=2'));
  assert.ok(ok(def, '2 >= x1 + x2 + x3 + 2 x4'));
  assert.ok(ok(def, '2x1 + 2x2 + 2x3 + 4x4 ≤ 4'));
  assert.equal(gradeField(def, 'x1+x2+x3+2x4>=2').msg, 'The coefficients are right but the inequality points the wrong way.');
  assert.equal(gradeField(def, 'x1+x2+x3+2x4<=3').msg, 'Left-hand side is right; check the right-hand side.');
  assert.match(gradeField(def, 'x1 ++ <= 2').msg, /Could not read/);
  assert.ok(ok({ type: 'ineq', answer: 'y <= 6 + 4x' }, 'y - 4x <= 6'));
  const anyCover = { type: 'ineq', answer: 'x1 + x4 <= 1', validator: (p) => (p.terms.size === 2 ? { ok: true } : null) };
  assert.ok(ok(anyCover, 'x2 + x4 <= 1'));
  assert.ok(ok({ type: 'expr', answer: '2ax - a' }, '-a + 2 a x') === false); // nonlinear product is rejected, not accepted
  assert.ok(ok({ type: 'expr', answer: '8x - 16z' }, '-16z + 8x'));
  assert.equal(expectedHtml({ type: 'ineq', answer: 'x1 - x2 <= 1' }), '$x_{1} - x_{2} \\le 1$');
});

test('grid and trace table give per-cell results', () => {
  const g = gradeField({ type: 'grid', answer: [[0, 0, 3], [null, 5, Infinity]] }, [['0', '0', '4'], ['', '5', 'inf']]);
  assert.equal(g.score, 4 / 5);
  assert.deepEqual(g.cells, [[true, true, false], [null, true, true]]);
  const t = gradeField({
    type: 'table',
    columns: [{ key: 'sel', kind: 'tokens', chars: true }, { key: 'da', kind: 'num' }, { key: 'dec', kind: 'choice', options: [] }, { key: 'info', kind: 'given' }],
    rows: [{ cells: { sel: ['s'], da: 4, dec: 'A', info: 'x' } }, { cells: { sel: ['c'], da: Infinity, dec: 'R', info: 'y' } }],
  }, [{ sel: 'S', da: '4', dec: 'A' }, { sel: 'b', da: 'inf', dec: 'R' }]);
  assert.equal(t.score, 5 / 6);
  assert.deepEqual(t.cells, [{ sel: true, da: true, dec: true }, { sel: false, da: true, dec: true }]);
});

test('order and self-graded fields', () => {
  assert.ok(ok({ type: 'order', answer: ['a', 'b', 'c'] }, ['a', 'b', 'c']));
  assert.match(gradeField({ type: 'order', answer: ['a', 'b', 'c'] }, ['a', 'c', 'b']).msg, /step 2/);
  const s = gradeField({ type: 'self', rubric: ['x', 'y', 'z', 'w'] }, [true, false, true, true]);
  assert.equal(s.score, 0.75);
  assert.ok(s.self);
});
