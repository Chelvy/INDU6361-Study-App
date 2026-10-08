// Static checks on the written content: lessons, course question bank, cheat sheet, external bank files.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS, topicById } from '../js/data/topics.js';
import { allLessons, hasLesson } from '../js/data/lessons/index.js';
import { CORE } from '../js/data/bank-core.js';
import { SHEET } from '../js/data/sheet.js';
import { SOURCES } from '../js/data/sources.js';
import { gradeField } from '../js/grade.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'ul', 'ol', 'li', 'code', 'sub', 'sup', 'p', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'pre', 'u', 'h3', 'h4', 'a', 'small']);

function checkHtml(s, where) {
  assert.equal(typeof s, 'string', `${where}: not a string`);
  assert.ok(s.trim().length > 0, `${where}: empty`);
  assert.ok(!/\[object |\bNaN\b/.test(s), `${where}: suspicious text`);
  assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s), `${where}: control character (bad escape?)`);
  // strip code blocks: they may contain $ and comparison signs legitimately
  const t = s.replace(/<pre>[\s\S]*?<\/pre>/g, '').replace(/<code>[\s\S]*?<\/code>/g, '').replace(/\\\$/g, '');
  const dd = (t.match(/\$\$/g) || []).length;
  const d = (t.replace(/\$\$/g, '').match(/\$/g) || []).length;
  assert.ok(dd % 2 === 0 && d % 2 === 0, `${where}: unbalanced $ near "${t.slice(0, 80)}"`);
  for (const m of t.matchAll(/<\/?([A-Za-z!?][A-Za-z0-9]*)/g)) assert.ok(TAGS.has(m[1].toLowerCase()), `${where}: "<${m[1]}" is read as an HTML tag (use \\lt or spaces inside math)`);
  // every opened block tag is closed
  for (const tag of ['table', 'ul', 'ol', 'div', 'pre', 'tbody', 'thead']) {
    const open = (s.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (s.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    assert.equal(open, close, `${where}: <${tag}> opened ${open} times, closed ${close}`);
  }
  // braces balanced inside math
  for (const m of t.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]*?)\$/g)) {
    const body = (m[1] !== undefined ? m[1] : m[2]).replace(/\\[{}]/g, '');
    const o = (body.match(/\{/g) || []).length, c = (body.match(/\}/g) || []).length;
    assert.equal(o, c, `${where}: unbalanced braces in math "${body.slice(0, 70)}"`);
    assert.ok(!/\\(begin|end)\{(align\*?|equation|eqnarray|tabular)\}/.test(body), `${where}: environment not supported by KaTeX`);
  }
}

test('every topic has a lesson and every lesson belongs to a topic', () => {
  TOPICS.forEach((t) => assert.ok(hasLesson(t.id), `no lesson for ${t.id}`));
  allLessons().forEach((l) => assert.ok(topicById(l.id), `lesson ${l.id} has no topic`));
});

test('lessons are well formed', () => {
  allLessons().forEach((l) => {
    checkHtml(l.lead, `${l.id} lead`);
    assert.ok(l.sections.length >= 3, `${l.id}: too few sections`);
    l.sections.forEach((s, i) => {
      assert.ok(s.title, `${l.id} section ${i}: title`);
      if (s.html) checkHtml(s.html, `${l.id} / ${s.title}`);
      if (s.after) checkHtml(s.after, `${l.id} / ${s.title} (after)`);
      assert.ok(s.html || s.widget, `${l.id} / ${s.title}: empty section`);
    });
    ['moves', 'traps', 'refs'].forEach((k) => {
      assert.ok(Array.isArray(l[k]) && l[k].length >= 2, `${l.id}: ${k}`);
      l[k].forEach((x, i) => checkHtml(x, `${l.id} ${k}[${i}]`));
    });
  });
});

function checkItem(q, where, ids) {
  assert.match(q.id, /^[a-z0-9][a-z0-9-]{3,60}$/, `${where}: id`);
  assert.ok(!ids.has(q.id), `${where}: duplicate id ${q.id}`);
  ids.add(q.id);
  assert.ok(topicById(q.topic), `${where}: unknown topic ${q.topic}`);
  assert.ok([1, 2, 3].includes(q.difficulty), `${where}: difficulty`);
  checkHtml(q.q, `${where} q`);
  if (q.explain) checkHtml(q.explain, `${where} explain`);
  if (q.type === 'tf') { assert.equal(typeof q.answer, 'boolean', `${where}: tf answer`); assert.ok(q.explain, `${where}: explain`); }
  else if (q.type === 'mcq') {
    assert.ok(Array.isArray(q.options) && q.options.length >= 3 && q.options.length <= 5, `${where}: options`);
    q.options.forEach((o, i) => checkHtml(o, `${where} option ${i}`));
    assert.equal(new Set(q.options).size, q.options.length, `${where}: duplicate options`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${where}: answer index`);
    assert.ok(q.explain, `${where}: explain`);
  } else if (q.type === 'num') {
    const r = gradeField({ type: 'num', answer: q.answer, tol: q.tol }, String(q.answer));
    assert.ok(r.ok, `${where}: numeric key is not accepted by the grader`);
    assert.ok(q.explain, `${where}: explain`);
  } else if (q.type === 'short') {
    checkHtml(q.model, `${where} model`);
    assert.ok(Array.isArray(q.rubric) && q.rubric.length >= 2 && q.rubric.length <= 6, `${where}: rubric`);
    q.rubric.forEach((r, i) => checkHtml(r, `${where} rubric ${i}`));
  } else if (q.type === 'card') checkHtml(q.a, `${where} a`);
  else assert.fail(`${where}: unknown type ${q.type}`);
}

test('course question bank is well formed and covers every released topic', () => {
  const ids = new Set();
  CORE.forEach((q, i) => checkItem(q, `core[${i}] ${q.id}`, ids));
  const count = {};
  CORE.forEach((q) => { count[q.topic] = (count[q.topic] || 0) + 1; });
  TOPICS.filter((t) => t.released && t.module !== 'm0').forEach((t) => assert.ok((count[t.id] || 0) >= 6, `only ${count[t.id] || 0} course questions for ${t.id}`));
  // answer positions of multiple-choice questions should not be predictable
  const pos = [0, 0, 0, 0, 0];
  CORE.filter((q) => q.type === 'mcq').forEach((q) => { pos[q.answer] += 1; });
  const total = pos.reduce((a, b) => a + b, 0);
  if (total >= 20) assert.ok(Math.max(...pos) / total < 0.5, `correct option is too often in the same position: ${pos}`);
});

test('external bank files listed in the index exist, are valid and do not clash with course ids', () => {
  const dir = path.join(here, '..', 'data', 'ext');
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const ids = new Set(CORE.map((q) => q.id));
  let n = 0;
  index.files.forEach((f) => {
    const items = JSON.parse(fs.readFileSync(path.join(dir, f.file), 'utf8'));
    assert.ok(Array.isArray(items) && items.length > 0, f.file);
    items.forEach((q, i) => {
      checkItem(q, `${f.file}[${i}] ${q.id}`, ids);
      assert.ok(q.source && q.source.label, `${f.file} ${q.id}: source label`);
      assert.ok(q.source.url === null || /^https?:\/\//.test(q.source.url), `${f.file} ${q.id}: source url`);
      assert.ok(['source', 'worked'].includes(q.source.solution), `${f.file} ${q.id}: solution flag`);
      n += 1;
    });
  });
  assert.ok(n >= 500, `only ${n} external questions`);
});

test('cheat sheet and sources ledger are well formed', () => {
  assert.ok(SHEET.length >= 12, 'cheat sheet sections');
  SHEET.forEach((s) => {
    assert.ok(s.title && s.items.length >= 2, `sheet section ${s.title}`);
    if (s.topic) assert.ok(topicById(s.topic), `sheet topic ${s.topic}`);
    s.items.forEach((x, i) => checkHtml(x, `sheet ${s.title}[${i}]`));
  });
  assert.ok(SOURCES.sections.length >= 4, 'sources sections');
  SOURCES.sections.forEach((s) => {
    assert.ok(s.title, 'source section title');
    if (s.html) checkHtml(s.html, `sources ${s.title}`);
    if (s.after) checkHtml(s.after, `sources ${s.title} after`);
    if (s.table) s.table.rows.forEach((r) => assert.equal(r.length, s.table.headers.length, `sources ${s.title}: row width`));
  });
});
