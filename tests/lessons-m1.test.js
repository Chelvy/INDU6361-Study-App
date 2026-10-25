// Checks for the Module 1 lessons: the numbers quoted in the surrogate-relaxation section (slides 103) are
// recomputed by enumeration, and every link from a lesson to an exercise page points at an existing exercise
// of the same topic.
import test from 'node:test';
import assert from 'node:assert/strict';
import { allLessons } from '../js/data/lessons/index.js';
import { exerciseById } from '../js/data/exercises/index.js';

// max 3x + 2y over nonnegative integers satisfying every row a·(x, y) <= b
function bestInteger(rows, limit = 30) {
  let best = -Infinity;
  const arg = [];
  for (let x = 0; x <= limit; x += 1) {
    for (let y = 0; y <= limit; y += 1) {
      if (!rows.every(([a1, a2, b]) => a1 * x + a2 * y <= b)) continue;
      const v = 3 * x + 2 * y;
      if (v > best) { best = v; arg.length = 0; arg.push(`${x},${y}`); } else if (v === best) arg.push(`${x},${y}`);
    }
  }
  return { best, arg };
}

const ORIGINAL = [[2, 1, 5], [1, 2, 5]];
const surrogate = ([u1, u2]) => [[2 * u1 + u2, u1 + 2 * u2, 5 * u1 + 5 * u2]];

test('slides 103 surrogate example: original optimum 8 at (2,1), surrogate u=(1,1) gives 9 at (3,0)', () => {
  assert.deepEqual(bestInteger(ORIGINAL), { best: 8, arg: ['2,1'] });
  const s = bestInteger(surrogate([1, 1]));
  assert.deepEqual(surrogate([1, 1]), [[3, 3, 10]]);
  assert.deepEqual(s, { best: 9, arg: ['3,0'] });
  assert.ok(2 * 3 + 0 > 5, '(3,0) violates 2x + y <= 5');
});

test('t103 table of other weights matches enumeration', () => {
  const expected = [
    [[2, 1], [5, 4, 15], 9, ['3,0']],
    [[3, 1], [7, 5, 20], 8, ['0,4', '2,1']],
    [[1, 0], [2, 1, 5], 10, ['0,5']],
    [[0, 1], [1, 2, 5], 15, ['5,0']],
  ];
  for (const [u, row, best, arg] of expected) {
    assert.deepEqual(surrogate(u)[0], row, `row for u=${u}`);
    assert.deepEqual(bestInteger(surrogate(u)), { best, arg }, `bound for u=${u}`);
  }
  // every surrogate bound is an upper bound on z* = 8
  for (let u1 = 0; u1 <= 6; u1 += 1) for (let u2 = 0; u2 <= 6; u2 += 1) {
    if (u1 + u2 === 0) continue;
    assert.ok(bestInteger(surrogate([u1, u2])).best >= 8, `u=(${u1},${u2})`);
  }
});

const MODULE1 = new Set(['t101', 't102', 't103', 't104', 't105a', 't105b', 't105c', 't105d', 't105e', 't106', 't401']);

test('Module 1 lesson links to exercise pages resolve to an exercise of the same topic', () => {
  let links = 0;
  allLessons().filter((l) => MODULE1.has(l.id)).forEach((l) => {
    const texts = [l.lead, ...l.sections.flatMap((s) => [s.html || '', s.after || '']), ...l.moves, ...l.traps, ...l.refs];
    texts.forEach((t) => {
      for (const m of t.matchAll(/href="#\/exercises\/([a-z0-9]+)\/([0-9]+)"/g)) {
        const ex = exerciseById(m[1], m[2]);
        assert.ok(ex, `${l.id}: no exercise ${m[1]}/${m[2]}`);
        assert.equal(ex.topic, l.id, `${l.id}: link ${m[1]}/${m[2]} points at an exercise of ${ex.topic}`);
        links += 1;
      }
    });
  });
  assert.ok(links >= 8, `only ${links} exercise links`);
});
