// Answer widgets. Each widget exposes getValue(), showResult(), setDisabled() and reveal().
import { h, rich, renderMath, clear } from './util.js';
import { gradeField, expectedHtml } from './grade.js';
import { Frac } from './math/frac.js';

let fieldCounter = 0;

const PLACEHOLDER = {
  num: 'number or a/b',
  int: 'integer',
  set: 'e.g. s, a, b',
  seq: 'e.g. s-a-c-t',
  ineq: 'e.g. x1 + 2x2 <= 4',
  expr: 'e.g. 2x - 3y',
};

function cellText(v) {
  if (v === Infinity) return '∞';
  if (v === null || v === undefined) return '';
  if (v instanceof Frac) return v.pretty();
  return String(v);
}

export function createField(def) {
  const id = `f${++fieldCounter}`;
  const wrap = h('div', { class: `field field-${def.type}${def.inline ? ' field-inline' : ''}` });
  const label = def.label ? rich(def.label, 'label', 'field-label') : null;
  if (label) { label.setAttribute('for', id); wrap.appendChild(label); }
  const body = h('div', { class: 'field-body' });
  wrap.appendChild(body);
  const msg = h('div', { class: 'field-msg', 'aria-live': 'polite' });
  let getValue; let setDisabled; let fill = () => {}; let paint = () => {};

  if (['num', 'int', 'set', 'seq', 'ineq', 'expr'].includes(def.type)) {
    const input = h('input', {
      id, type: 'text', class: `field-input${def.type === 'ineq' || def.type === 'expr' ? ' wide' : ''}`,
      autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: def.placeholder || PLACEHOLDER[def.type] || '',
      inputmode: def.type === 'int' ? 'numeric' : 'text',
    });
    if (def.prefix) body.appendChild(rich(def.prefix, 'span', 'field-affix'));
    body.appendChild(input);
    if (def.suffix) body.appendChild(rich(def.suffix, 'span', 'field-affix'));
    getValue = () => input.value;
    setDisabled = (b) => { input.disabled = b; };
    fill = (text) => { input.value = text; };
  } else if (def.type === 'choice') {
    const group = h('div', { class: `choice-group${def.stack ? ' stack' : ''}`, role: 'radiogroup' });
    const inputs = def.options.map((o, i) => {
      const rid = `${id}_${i}`;
      const input = h('input', { type: 'radio', name: id, id: rid, value: String(o.value) });
      group.appendChild(h('label', { class: 'choice', for: rid }, input, rich(o.label, 'span')));
      return input;
    });
    body.appendChild(group);
    getValue = () => { const c = inputs.find((i) => i.checked); return c ? c.value : ''; };
    setDisabled = (b) => inputs.forEach((i) => { i.disabled = b; });
    paint = (result, reveal) => {
      inputs.forEach((i) => {
        const lab = i.parentElement;
        lab.classList.remove('is-correct', 'is-wrong');
        if (reveal || result.ok) { if (i.value === String(def.answer)) lab.classList.add('is-correct'); }
        if (i.checked && !result.ok) lab.classList.add('is-wrong');
      });
    };
  } else if (def.type === 'multi') {
    const group = h('div', { class: 'choice-group stack' });
    const inputs = def.options.map((o, i) => {
      const rid = `${id}_${i}`;
      const input = h('input', { type: 'checkbox', id: rid, value: String(o.value) });
      group.appendChild(h('label', { class: 'choice', for: rid }, input, rich(o.label, 'span')));
      return input;
    });
    body.appendChild(group);
    getValue = () => inputs.filter((i) => i.checked).map((i) => i.value);
    setDisabled = (b) => inputs.forEach((i) => { i.disabled = b; });
    paint = (result, reveal) => {
      const want = new Set(def.answer.map(String));
      inputs.forEach((i) => {
        const lab = i.parentElement;
        lab.classList.remove('is-correct', 'is-wrong');
        if (reveal || result.ok) { if (want.has(i.value)) lab.classList.add('is-correct'); }
        if (i.checked && !want.has(i.value) && (reveal || !result.ok)) lab.classList.add('is-wrong');
      });
    };
  } else if (def.type === 'grid') {
    const table = h('table', { class: 'grid-table' });
    if (def.colHeads) {
      const tr = h('tr', null, def.rowHeads ? h('th', { class: 'corner', html: def.corner || '' }) : null);
      def.colHeads.forEach((c) => tr.appendChild(rich(String(c), 'th')));
      table.appendChild(h('thead', null, tr));
    }
    const tbody = h('tbody');
    const inputs = def.answer.map((rowAns, i) => {
      const tr = h('tr');
      if (def.rowHeads) tr.appendChild(rich(String(def.rowHeads[i]), 'th'));
      const rowInputs = rowAns.map((ans, j) => {
        const td = h('td');
        const pre = def.prefill && def.prefill[i] ? def.prefill[i][j] : undefined;
        if (ans === null || ans === undefined) {
          td.className = 'given';
          td.textContent = cellText(pre);
          tr.appendChild(td);
          return null;
        }
        const input = h('input', { type: 'text', class: 'cell-input', autocomplete: 'off', 'aria-label': `row ${i + 1} column ${j + 1}`, inputmode: 'text' });
        td.appendChild(input);
        tr.appendChild(td);
        return input;
      });
      tbody.appendChild(tr);
      return rowInputs;
    });
    table.appendChild(tbody);
    body.appendChild(h('div', { class: 'grid-scroll' }, table));
    getValue = () => inputs.map((r) => r.map((inp) => (inp ? inp.value : '')));
    setDisabled = (b) => inputs.forEach((r) => r.forEach((inp) => { if (inp) inp.disabled = b; }));
    paint = (result, reveal) => {
      inputs.forEach((r, i) => r.forEach((inp, j) => {
        if (!inp) return;
        const td = inp.parentElement;
        td.classList.remove('cell-ok', 'cell-bad');
        const okCell = result.cells && result.cells[i][j];
        if (okCell) td.classList.add('cell-ok');
        else if (inp.value.trim() !== '' || reveal) td.classList.add('cell-bad');
        const old = td.querySelector('.cell-fix');
        if (old) old.remove();
        if (reveal && !okCell) td.appendChild(h('span', { class: 'cell-fix' }, cellText(def.answer[i][j])));
      }));
    };
    // Arrow-key navigation between cells.
    table.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
      const flat = inputs.map((r) => r.slice());
      for (let i = 0; i < flat.length; i++) for (let j = 0; j < flat[i].length; j++) {
        if (flat[i][j] !== e.target) continue;
        const dir = e.key === 'ArrowUp' ? -1 : 1;
        for (let k = i + dir; k >= 0 && k < flat.length; k += dir) if (flat[k][j]) { flat[k][j].focus(); e.preventDefault(); return; }
      }
    });
  } else if (def.type === 'table') {
    const table = h('table', { class: 'grid-table trace-table' });
    const headRow = h('tr');
    if (def.rows.some((r) => r.head !== undefined)) headRow.appendChild(rich(def.corner || '', 'th', 'corner'));
    def.columns.forEach((c) => headRow.appendChild(rich(c.head, 'th')));
    table.appendChild(h('thead', null, headRow));
    const tbody = h('tbody');
    const answerText = (col, ans) => {
      if (col.kind === 'choice') { const o = (col.options || []).find((x) => String(x.value) === String(ans)); return o ? o.label : String(ans); }
      if (Array.isArray(ans)) return ans.join(col.joiner !== undefined ? col.joiner : ' ');
      return cellText(ans);
    };
    const widgets = def.rows.map((row) => {
      const tr = h('tr');
      if (row.head !== undefined) tr.appendChild(rich(String(row.head), 'th'));
      const w = {};
      def.columns.forEach((col) => {
        const td = h('td');
        const ans = row.cells[col.key];
        if (col.kind === 'given' || ans === null || ans === undefined) {
          td.className = 'given';
          td.appendChild(rich(col.kind === 'given' ? answerText(col, ans) : '', 'span'));
        } else if (col.kind === 'choice') {
          const sel = h('select', { class: 'cell-select', 'aria-label': col.plain || col.key });
          sel.appendChild(h('option', { value: '' }, '—'));
          col.options.forEach((o) => sel.appendChild(h('option', { value: String(o.value) }, o.short || o.label)));
          td.appendChild(sel);
          w[col.key] = sel;
        } else {
          const input = h('input', { type: 'text', class: `cell-input${col.kind === 'tokens' ? ' cell-wide' : ''}`, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': col.plain || col.key, placeholder: col.placeholder || '' });
          td.appendChild(input);
          w[col.key] = input;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      return w;
    });
    table.appendChild(tbody);
    body.appendChild(h('div', { class: 'grid-scroll' }, table));
    getValue = () => widgets.map((w) => Object.fromEntries(Object.entries(w).map(([k, el]) => [k, el.value])));
    setDisabled = (b) => widgets.forEach((w) => Object.values(w).forEach((el) => { el.disabled = b; }));
    paint = (result, reveal) => {
      widgets.forEach((w, i) => Object.entries(w).forEach(([k, el]) => {
        const td = el.parentElement;
        td.classList.remove('cell-ok', 'cell-bad');
        const okCell = result.cells && result.cells[i][k];
        if (okCell) td.classList.add('cell-ok');
        else if (el.value.trim() !== '' || reveal) td.classList.add('cell-bad');
        const old = td.querySelector('.cell-fix');
        if (old) old.remove();
        if (reveal && !okCell) {
          const col = def.columns.find((c) => c.key === k);
          td.appendChild(h('span', { class: 'cell-fix' }, answerText(col, def.rows[i].cells[k])));
        }
      }));
    };
  } else if (def.type === 'order') {
    let items = def.items.slice();
    const list = h('ol', { class: 'order-list' });
    let disabled = false;
    const draw = () => {
      clear(list);
      items.forEach((it, i) => {
        const up = h('button', { type: 'button', class: 'mini', 'aria-label': 'Move up', disabled: disabled || i === 0, onclick: () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); } }, '↑');
        const down = h('button', { type: 'button', class: 'mini', 'aria-label': 'Move down', disabled: disabled || i === items.length - 1, onclick: () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); } }, '↓');
        list.appendChild(h('li', { dataset: { id: String(it.id) } }, h('span', { class: 'order-btns' }, up, down), rich(it.label, 'span', 'order-text')));
      });
      renderMath(list);
    };
    draw();
    body.appendChild(list);
    getValue = () => items.map((it) => String(it.id));
    setDisabled = (b) => { disabled = b; draw(); };
    paint = (result, reveal) => {
      if (reveal && !result.ok) {
        items = def.answer.map((aid) => def.items.find((it) => String(it.id) === String(aid)));
        draw();
      }
    };
  } else if (def.type === 'self') {
    const notes = h('textarea', { class: 'self-notes', rows: def.rows || 4, placeholder: def.placeholder || 'Work it out on paper (or type notes here), then reveal the model answer and mark yourself honestly.' });
    const model = h('div', { class: 'self-model', hidden: true });
    const boxes = [];
    const revealBtn = h('button', { type: 'button', class: 'btn ghost', onclick: () => showModel() }, 'Show model answer and rubric');
    const showModel = () => {
      if (!model.hidden) return;
      model.hidden = false;
      revealBtn.hidden = true;
      model.appendChild(rich(def.model, 'div', 'self-answer'));
      const ul = h('div', { class: 'rubric' }, h('div', { class: 'rubric-title' }, 'Tick each point your answer covers:'));
      def.rubric.forEach((r, i) => {
        const cid = `${id}_r${i}`;
        const cb = h('input', { type: 'checkbox', id: cid });
        boxes.push(cb);
        ul.appendChild(h('label', { class: 'choice', for: cid }, cb, rich(r, 'span')));
      });
      model.appendChild(ul);
      renderMath(model);
    };
    body.appendChild(notes);
    body.appendChild(revealBtn);
    body.appendChild(model);
    getValue = () => { showModel(); return boxes.map((b) => b.checked); };
    setDisabled = (b) => { boxes.forEach((x) => { x.disabled = b; }); notes.disabled = b; };
    wrap.needsReveal = () => model.hidden;
    wrap.forceReveal = showModel;
  } else {
    throw new Error('Unknown field type ' + def.type);
  }

  wrap.appendChild(msg);
  renderMath(wrap);

  return {
    def,
    el: wrap,
    getValue,
    setDisabled,
    grade: () => gradeField(def, getValue()),
    // result from gradeField; reveal = also show the correct answer.
    showResult(result, reveal) {
      wrap.classList.remove('ok', 'bad', 'partial');
      if (result.self) wrap.classList.add(result.score > 0.999 ? 'ok' : result.score > 0 ? 'partial' : 'bad');
      else wrap.classList.add(result.ok ? 'ok' : result.score > 0 ? 'partial' : 'bad');
      paint(result, reveal);
      clear(msg);
      if (result.msg) msg.appendChild(rich(result.msg, 'span', 'why'));
      if (result.blank && !reveal) msg.appendChild(h('span', { class: 'why' }, 'No answer yet.'));
      if (reveal && !result.ok && !result.self) {
        const exp = expectedHtml(def);
        if (exp) msg.appendChild(rich(`<b>Answer:</b> ${exp}`, 'span', 'expected'));
      }
      renderMath(msg);
    },
    clearResult() { wrap.classList.remove('ok', 'bad', 'partial'); clear(msg); },
    fill,
    needsReveal: () => (wrap.needsReveal ? wrap.needsReveal() : false),
    forceReveal: () => { if (wrap.forceReveal) wrap.forceReveal(); },
  };
}
