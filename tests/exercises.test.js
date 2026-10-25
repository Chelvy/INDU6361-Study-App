// The instructor's exercise sheets: structure, KaTeX-safe text, self-graded answer keys, figures and trainer links.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml, installStubDom } from './helpers.js';

installStubDom();
const { SHEETS, allExercises } = await import('../js/data/exercises/index.js');
const { topicById } = await import('../js/data/topics.js');
const { gradeField } = await import('../js/grade.js');
const { drillById } = await import('../js/drills/index.js');

const stepHtml = (s) => (typeof s === 'string' ? s : s.html);

test('both sheets are present with the instructor numbering', () => {
  assert.deepEqual(SHEETS.map((s) => s.id), ['20e', '10e']);
  assert.equal(SHEETS[0].exercises.length, 14);
  assert.equal(SHEETS[1].exercises.length, 8);
  const ids = new Set();
  allExercises().forEach((ex) => { assert.ok(!ids.has(ex.id), `duplicate ${ex.id}`); ids.add(ex.id); });
});

test('every exercise is well formed and KaTeX-safe', () => {
  allExercises().forEach((ex) => {
    const w = ex.id;
    assert.ok(topicById(ex.topic), `${w}: topic`);
    assert.ok(ex.title && ex.src, `${w}: title/source`);
    if (ex.blurb) checkHtml(ex.blurb, `${w} blurb`);
    if (ex.statement) checkHtml(ex.statement, `${w} statement`);
    assert.ok(ex.statement || ex.trainerStatement, `${w}: no statement`);
    assert.ok(ex.parts.length >= 1, `${w}: parts`);
    ex.parts.forEach((p, k) => {
      checkHtml(p.q, `${w} part ${k + 1} q`);
      (p.hints || []).forEach((x, i) => checkHtml(x, `${w} part ${k + 1} hint ${i + 1}`));
      assert.ok(p.steps.length >= 1, `${w} part ${k + 1}: steps`);
      p.steps.forEach((s, i) => checkHtml(stepHtml(s), `${w} part ${k + 1} step ${i + 1}`));
      if (p.after) checkHtml(p.after, `${w} part ${k + 1} after`);
      (p.check || []).forEach((def, i) => {
        checkHtml(def.label, `${w} part ${k + 1} check ${i + 1} label`);
        const key = def.type === 'ineq' ? def.answerText || def.answer : String(def.answer);
        assert.ok(gradeField(def, key).ok, `${w} part ${k + 1} check ${i + 1}: answer key rejected by its grader`);
      });
    });
    (ex.traps || []).forEach((t, i) => checkHtml(t, `${w} trap ${i + 1}`));
  });
});

test('every figure builds', () => {
  allExercises().forEach((ex) => {
    if (ex.figure) assert.ok(ex.figure(), `${ex.id}: figure`);
    ex.parts.forEach((p) => p.steps.forEach((s) => { if (typeof s === 'object' && s.figure) assert.ok(s.figure(), `${ex.id}: step figure`); }));
  });
});

test('trainer links point to an existing trainer and preset', () => {
  allExercises().filter((ex) => ex.trainer).forEach((ex) => {
    const d = drillById(ex.trainer.drill);
    assert.ok(d, `${ex.id}: unknown trainer ${ex.trainer.drill}`);
    if (ex.trainer.preset) {
      const p = (d.presets || []).find((x) => x.id === ex.trainer.preset);
      assert.ok(p, `${ex.id}: trainer ${d.id} has no preset ${ex.trainer.preset}`);
      if (ex.trainerStatement) { const built = d.build(p.make()); assert.ok(built.statement, `${ex.id}: trainer statement`); }
    }
  });
});
