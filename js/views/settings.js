// Settings: exam dates, daily target, theme, backup.
import { h } from '../util.js';
import { store } from '../store.js';
import { applyTheme } from '../theme.js';
import { SCOPES } from '../data/topics.js';

export function render(root) {
  const s = store.get().settings;
  root.appendChild(h('div', { class: 'page-head' }, h('h1', null, 'Settings'), h('p', null, 'Progress is stored only in this browser (localStorage). Export a backup before clearing browser data or switching device.')));

  const dates = h('section', { class: 'card' }, h('h2', null, 'Exam dates and daily target'));
  const field = (label, input, note) => h('label', { style: 'display:grid;grid-template-columns:minmax(0,1fr);gap:.25rem;margin-bottom:.8rem;max-width:26rem' }, h('span', { style: 'font-weight:600' }, label), input, note ? h('span', { class: 'small muted' }, note) : null);
  const mid = h('input', { type: 'date' }); mid.value = s.midterm || '';
  mid.addEventListener('change', () => store.setSetting('midterm', mid.value));
  const fin = h('input', { type: 'date' }); fin.value = s.final || '';
  fin.addEventListener('change', () => store.setSetting('final', fin.value));
  const mins = h('input', { type: 'number', min: '15', max: '240', step: '5' }); mins.value = String(s.dailyMinutes);
  mins.addEventListener('change', () => store.setSetting('dailyMinutes', Math.max(15, Math.min(240, Number(mins.value) || 45))));
  dates.appendChild(field('Midterm date', mid, 'Not stated in the course outline; enter the date announced in class. Until then the plan targets Modules 1–2.'));
  dates.appendChild(field('Final exam date', fin, 'Default: 9 December 2026, the first day of the exam period given in the outline (9–22 December). Replace it when the schedule is published.'));
  dates.appendChild(field('Daily study target (minutes)', mins, 'Used to size the recommended session on the Today page.'));
  const focus = h('select', null,
    h('option', { value: 'auto' }, 'Automatic: Modules 1–2 until the midterm, then the whole course'),
    ...Object.entries(SCOPES).map(([k, v]) => h('option', { value: k }, v.label)));
  focus.value = s.focus || 'auto';
  focus.addEventListener('change', () => store.setSetting('focus', focus.value));
  dates.appendChild(field('What the study plan and the readiness score cover', focus, 'Choose “Module 1 only” if your midterm stops there.'));
  root.appendChild(dates);

  const look = h('section', { class: 'card' }, h('h2', null, 'Appearance'));
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' });
  const opts = [['auto', 'Match system'], ['light', 'Light'], ['dark', 'Dark']];
  const btns = opts.map(([v, label]) => {
    const b = h('button', { type: 'button', 'aria-pressed': String((s.theme || 'auto') === v) }, label);
    b.addEventListener('click', () => { store.setSetting('theme', v); applyTheme(); btns.forEach((x, i) => x.setAttribute('aria-pressed', String(opts[i][0] === v))); });
    seg.appendChild(b);
    return b;
  });
  look.appendChild(seg);
  root.appendChild(look);

  const data = h('section', { class: 'card' }, h('h2', null, 'Backup'));
  const msg = h('p', { class: 'small', role: 'status' });
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    f.text().then((text) => { store.importJSON(text); msg.textContent = 'Progress imported.'; applyTheme(); }).catch((e) => { msg.textContent = `Import failed: ${e.message}`; });
  });
  data.appendChild(h('div', { class: 'row' },
    h('button', { type: 'button', class: 'btn', onclick: () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `indu6361-progress-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = 'Backup file downloaded.';
    } }, 'Export progress'),
    h('button', { type: 'button', class: 'btn', onclick: () => file.click() }, 'Import progress'),
    h('button', { type: 'button', class: 'btn danger', onclick: () => { if (window.confirm('Erase all progress stored in this browser? This cannot be undone.')) { store.reset(); applyTheme(); msg.textContent = 'Progress erased.'; } } }, 'Erase all progress'),
    file));
  data.appendChild(msg);
  if (store.isMemoryOnly()) data.appendChild(h('p', { class: 'error' }, 'This browser is blocking storage (private mode?). Progress will be lost when the tab closes.'));
  root.appendChild(data);
}
